// backend/src/TerraFusion.API/Controllers/CountyStudyController.cs
//
// CountyStudy REST controller — TerraForge County Studio backend.
// All 19+ endpoints delegate to ICountyStudyService; no business logic here.
// Auth is handled at the gateway level; no [Authorize] attribute required.
//
// Route: api/county-study  (explicit, avoids token-expansion quirks)
//
// Error handling convention (applied uniformly across all actions):
//   InvalidOperationException → 400 BadRequest  { error: message }
//   Exception                 → 500 Internal     { error: "Internal error" }  + Error log

using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/county-study")]
public class CountyStudyController : ControllerBase
{
    private readonly ICountyStudyService _svc;
    private readonly ICountyResolver _countyResolver;
    private readonly ILogger<CountyStudyController> _logger;

    // userId sourced from claim in production; hardened default for gateway-auth environments.
    private const string FallbackUserId = "system";

    private readonly ICountyStudySegmentDerivationService _deriveSvc;
    private readonly ICountyStudyHealthService _healthSvc;
    private readonly ICountyStudyInspectorService _inspectorSvc;
    private readonly ICountyStudioAiService _aiSvc;

    public CountyStudyController(
        ICountyStudyService svc,
        ICountyResolver countyResolver,
        ICountyStudySegmentDerivationService deriveSvc,
        ICountyStudyHealthService healthSvc,
        ICountyStudyInspectorService inspectorSvc,
        ICountyStudioAiService aiSvc,
        ILogger<CountyStudyController> logger)
    {
        _svc            = svc;
        _countyResolver = countyResolver;
        _deriveSvc      = deriveSvc;
        _healthSvc      = healthSvc;
        _inspectorSvc   = inspectorSvc;
        _aiSvc          = aiSvc;
        _logger         = logger;
    }

    private string CurrentUserId =>
        User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User?.FindFirst("sub")?.Value
        ?? FallbackUserId;

    // ── Studies ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new county study session (ratio study, sales study, etc.).
    /// Returns 201 Created with the new session DTO.
    /// </summary>
    [HttpPost("studies")]
    public async Task<IActionResult> CreateStudy([FromBody] CreateStudyRequest req)
    {
        try
        {
            var dto = await _svc.CreateStudyAsync(req, CurrentUserId);
            return CreatedAtAction(nameof(GetStudyById), new { studyId = dto.StudyId }, dto);
        }
        catch (CountyNotFoundException ex)
        {
            return BadRequest(new { error = ex.Message, field = "countyId" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] CreateStudy failed for county {CountyId}", req.CountyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all studies for a county, ordered by creation date descending.
    /// CountyId accepts either a Guid or a county name ("benton", case-insensitive).
    /// </summary>
    [HttpGet("studies")]
    public async Task<IActionResult> GetStudies([FromQuery] string countyId, CancellationToken ct)
    {
        try
        {
            var resolvedId = await _countyResolver.ResolveAsync(countyId, ct);
            var list = await _svc.GetStudiesAsync(resolvedId);
            return Ok(list);
        }
        catch (CountyNotFoundException ex)
        {
            return BadRequest(new { error = ex.Message, field = "countyId" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetStudies failed for county {CountyId}", countyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Derives a baseline CountySegmentSet from canonical TerraFusion data for the given study.
    /// Reads Properties + CamaCharacteristics + qualified ComparableSales, groups by
    /// (neighborhood × building type × quality grade), computes per-segment IAAO metrics
    /// (median ratio, COD, PRD, stability, risk, exception count), persists the result,
    /// and sets the new set as the study's ActiveSegmentSetId.
    ///
    /// Idempotent-per-study: each invocation creates a new set with incremented Version.
    /// </summary>
    [HttpPost("studies/{studyId:guid}/derive-segments")]
    public async Task<IActionResult> DeriveSegments(Guid studyId, CancellationToken ct)
    {
        try
        {
            var result = await _deriveSvc.DeriveAsync(studyId, CurrentUserId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] DeriveSegments failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns a single study by ID. Returns 404 if not found.
    /// </summary>
    [HttpGet("studies/{studyId:guid}")]
    public async Task<IActionResult> GetStudyById(Guid studyId)
    {
        try
        {
            var dto = await _svc.GetStudyAsync(studyId);
            return dto is null ? NotFound(new { error = $"Study {studyId} not found" }) : Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetStudyById failed for {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Transitions a study to a given status (e.g. "Archived", "Published").
    /// Returns the updated DTO or 404 if the study does not exist.
    /// </summary>
    [HttpPatch("studies/{studyId:guid}/status")]
    public async Task<IActionResult> UpdateStudyStatus(Guid studyId, [FromBody] UpdateStudyStatusRequest req)
    {
        try
        {
            var dto = await _svc.UpdateStudyStatusAsync(studyId, req.Status, CurrentUserId);
            return dto is null ? NotFound(new { error = $"Study {studyId} not found" }) : Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] UpdateStudyStatus failed for {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Rollups (Task B — County → City → Neighborhood drill lattice) ────

    /// <summary>
    /// Returns one row per Benton city, aggregated from the study's active
    /// CountySegmentSet. Each row carries segment/parcel counts, parcel-weighted
    /// IAAO metrics (median / COD / PRD), exception stats, a pointer to the
    /// single worst-performing segment in the city, and an IAAO compliance
    /// classification. Cities with no matching segments are omitted.
    ///
    /// Returns 409 Conflict if the study has no active segment set yet —
    /// caller should prompt the user to run "Derive Segment Metrics" first.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/city-rollup")]
    public async Task<IActionResult> GetCityRollup(Guid studyId)
    {
        try
        {
            var rows = await _svc.GetCityRollupAsync(studyId);
            return Ok(rows);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("active segment set"))
        {
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetCityRollup failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns one row per neighborhood in the study's active segment set,
    /// optionally filtered to a single city. Neighborhoods are grouped by
    /// CountySegment.GeographyRef (neighborhood code). Each row carries
    /// parcel-weighted IAAO metrics and parcel-weighted stability + risk
    /// averages across the neighborhood's segments.
    ///
    /// Returns 409 Conflict if the study has no active segment set yet.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/neighborhood-rollup")]
    public async Task<IActionResult> GetNeighborhoodRollup(Guid studyId, [FromQuery] string? city)
    {
        try
        {
            var rows = await _svc.GetNeighborhoodRollupAsync(studyId, city);
            return Ok(rows);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("active segment set"))
        {
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetNeighborhoodRollup failed for study {StudyId} city {City}", studyId, city);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Health Summary (Task C — chief appraiser's Monday-morning screen) ──

    /// <summary>
    /// Returns a single-screen health summary for a study. Overall IAAO metrics
    /// across the study's active segment set (parcel-weighted), IAAO compliance
    /// classification, severity counts, and the top 5 segments by composite
    /// risk.
    ///
    /// Returns 409 Conflict if the study has no active segment set yet —
    /// caller should prompt the user to run "Derive Segment Metrics" first.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/health-summary")]
    public async Task<IActionResult> GetHealthSummary(Guid studyId, CancellationToken ct)
    {
        try
        {
            var dto = await _healthSvc.GetHealthSummaryAsync(studyId, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("active segment set"))
        {
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetHealthSummary failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Inspector (Task D — ObjectInspector detail + action-context) ──

    /// <summary>
    /// Returns the full Inspector detail bundle for a segment: IAAO core +
    /// Benton Method additions (PRB / VEI / classification / equity score)
    /// + 5-year YoY history + compliance + human-readable warnings.
    /// 404 when the segment does not exist.
    /// </summary>
    [HttpGet("segments/{segmentId:guid}/detail")]
    public async Task<IActionResult> GetSegmentDetail(Guid segmentId, CancellationToken ct)
    {
        try
        {
            var dto = await _inspectorSvc.GetSegmentDetailAsync(segmentId, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetSegmentDetail failed for segment {SegmentId}", segmentId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns the pre-scoped handoff context for a segment: parcel list
    /// (capped), qualified sales count, and five per-target handoff DTOs
    /// whose DeeplinkQuery is populated only when the downstream module
    /// consumes URL parameters. 404 when the segment does not exist.
    /// </summary>
    [HttpGet("segments/{segmentId:guid}/action-context")]
    public async Task<IActionResult> GetSegmentActionContext(Guid segmentId, CancellationToken ct)
    {
        try
        {
            var dto = await _inspectorSvc.GetActionContextAsync(segmentId, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetSegmentActionContext failed for segment {SegmentId}", segmentId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── AI Diagnosis (Task E — Fix #6 — deterministic finding / classification / action) ──

    /// <summary>
    /// Returns the deterministic diagnosis for a segment: classification (Data /
    /// Model / Workflow / Market / Healthy), confidence, ordered findings with
    /// structured evidence, prioritized recommended actions, and a 2–4 sentence
    /// narrative whose every sentence cites a real number.
    ///
    /// 404 when the segment does not exist.
    /// 409 when the segment has no derived metrics (derive first).
    /// </summary>
    [HttpGet("segments/{segmentId:guid}/diagnosis")]
    public async Task<IActionResult> GetSegmentDiagnosis(Guid segmentId, CancellationToken ct)
    {
        try
        {
            var dto = await _aiSvc.DiagnoseSegmentAsync(segmentId, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("no derived metrics"))
        {
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetSegmentDiagnosis failed for segment {SegmentId}", segmentId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns the county-level deterministic diagnosis for a study: aggregate
    /// classification, healthy/problem segment counts, the 5 worst-diagnosed
    /// segments (pre-diagnosed), and cross-segment patterns.
    ///
    /// 409 when the study has no active segment set.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/diagnosis")]
    public async Task<IActionResult> GetCountyDiagnosis(Guid studyId, CancellationToken ct)
    {
        try
        {
            var dto = await _aiSvc.DiagnoseCountyAsync(studyId, ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("active segment set"))
        {
            return Conflict(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetCountyDiagnosis failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Segment Sets ──────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new segment set for a study (e.g. baseline geographic partitioning).
    /// Returns 201 Created with the segment set DTO.
    /// </summary>
    [HttpPost("studies/{studyId:guid}/segment-sets")]
    public async Task<IActionResult> CreateSegmentSet(Guid studyId, [FromBody] CreateSegmentSetRequest req)
    {
        try
        {
            var dto = await _svc.CreateSegmentSetAsync(studyId, req.Name, req.SourceType, req.IsBaseline, CurrentUserId);
            return StatusCode(201, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] CreateSegmentSet failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all segment sets for a study.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/segment-sets")]
    public async Task<IActionResult> GetSegmentSets(Guid studyId)
    {
        try
        {
            var list = await _svc.GetSegmentSetsAsync(studyId);
            return Ok(list);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetSegmentSets failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all segments within a segment set.
    /// </summary>
    [HttpGet("segment-sets/{segmentSetId:guid}/segments")]
    public async Task<IActionResult> GetSegments(Guid segmentSetId)
    {
        try
        {
            var list = await _svc.GetSegmentsAsync(segmentSetId);
            return Ok(list);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetSegments failed for set {SegmentSetId}", segmentSetId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Cohorts ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new cohort (parcel grouping for scenario analysis).
    /// Returns 201 Created with the cohort DTO.
    /// </summary>
    [HttpPost("cohorts")]
    public async Task<IActionResult> CreateCohort([FromBody] CreateCohortRequest req)
    {
        try
        {
            var dto = await _svc.CreateCohortAsync(req, CurrentUserId);
            return CreatedAtAction(nameof(GetCohort), new { cohortId = dto.CohortId }, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] CreateCohort failed for study {StudyId}", req.StudyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all cohorts for a study.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/cohorts")]
    public async Task<IActionResult> GetCohorts(Guid studyId)
    {
        try
        {
            var list = await _svc.GetCohortsAsync(studyId);
            return Ok(list);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetCohorts failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns a single cohort by ID. Returns 404 if not found.
    /// </summary>
    [HttpGet("cohorts/{cohortId:guid}")]
    public async Task<IActionResult> GetCohort(Guid cohortId)
    {
        try
        {
            var dto = await _svc.GetCohortAsync(cohortId);
            return dto is null ? NotFound(new { error = $"Cohort {cohortId} not found" }) : Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetCohort failed for {CohortId}", cohortId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Scenarios ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new adjustment scenario for a cohort.
    /// Returns 201 Created with the scenario DTO.
    /// </summary>
    [HttpPost("scenarios")]
    public async Task<IActionResult> CreateScenario([FromBody] CreateScenarioRequest req)
    {
        try
        {
            var dto = await _svc.CreateScenarioAsync(req, CurrentUserId);
            return CreatedAtAction(nameof(GetScenario), new { scenarioId = dto.ScenarioId }, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] CreateScenario failed for study {StudyId}", req.StudyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all scenarios for a study.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/scenarios")]
    public async Task<IActionResult> GetScenarios(Guid studyId)
    {
        try
        {
            var list = await _svc.GetScenariosAsync(studyId);
            return Ok(list);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetScenarios failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns a single scenario by ID. Returns 404 if not found.
    /// </summary>
    [HttpGet("scenarios/{scenarioId:guid}")]
    public async Task<IActionResult> GetScenario(Guid scenarioId)
    {
        try
        {
            var dto = await _svc.GetScenarioAsync(scenarioId);
            return dto is null ? NotFound(new { error = $"Scenario {scenarioId} not found" }) : Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetScenario failed for {ScenarioId}", scenarioId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Saves (locks) a scenario for review, transitioning it from Draft to Saved.
    /// Returns the updated scenario DTO or 404 if not found.
    /// </summary>
    [HttpPost("scenarios/{scenarioId:guid}/save")]
    public async Task<IActionResult> SaveScenario(Guid scenarioId)
    {
        try
        {
            var dto = await _svc.SaveScenarioAsync(scenarioId, CurrentUserId);
            return dto is null ? NotFound(new { error = $"Scenario {scenarioId} not found" }) : Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] SaveScenario failed for {ScenarioId}", scenarioId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns a preview of the equity / ratio impact of applying a scenario
    /// without committing any changes to the study.
    /// </summary>
    [HttpGet("scenarios/{scenarioId:guid}/preview")]
    public async Task<IActionResult> PreviewScenarioImpact(Guid scenarioId)
    {
        try
        {
            var dto = await _svc.PreviewScenarioImpactAsync(scenarioId);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] PreviewScenarioImpact failed for {ScenarioId}", scenarioId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns a side-by-side projected impact comparison for two scenarios in the same study.
    /// </summary>
    [HttpGet("scenarios/{scenarioIdA:guid}/compare")]
    public async Task<IActionResult> CompareScenarios(Guid scenarioIdA, [FromQuery] Guid compareWithId)
    {
        if (compareWithId == Guid.Empty)
            return BadRequest(new { error = "compareWithId is required." });
        try
        {
            var dto = await _svc.CompareScenarioImpactAsync(scenarioIdA, compareWithId);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] CompareScenarios failed {A} vs {B}", scenarioIdA, compareWithId);
            return StatusCode(500, new { error = "Failed to compare scenarios." });
        }
    }

    // ── Adjustment Sets ───────────────────────────────────────────────────────

    /// <summary>
    /// Promotes a saved scenario into a published adjustment set.
    /// The request body must include ScenarioId and EffectiveScope.
    /// Returns 200 with the created adjustment set DTO.
    /// </summary>
    [HttpPost("scenarios/promote")]
    public async Task<IActionResult> PromoteScenario([FromBody] PromoteScenarioRequest req)
    {
        try
        {
            var dto = await _svc.PromoteScenarioAsync(req, CurrentUserId);
            return StatusCode(201, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] PromoteScenario failed for scenario {ScenarioId}", req.ScenarioId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all published adjustment sets for a study.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/adjustment-sets")]
    public async Task<IActionResult> GetAdjustmentSets(Guid studyId)
    {
        try
        {
            var list = await _svc.GetAdjustmentSetsAsync(studyId);
            return Ok(list);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetAdjustmentSets failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Advances (or rolls back) the approval state of an adjustment set.
    /// Valid transitions: Proposed → ReadyForApproval → Approved → Published → RolledBack
    /// Also supports ReadyForApproval → Proposed (send-back).
    /// Returns 200 with the updated adjustment set DTO.
    /// </summary>
    [HttpPatch("adjustment-sets/{id:guid}/approval-state")]
    public async Task<IActionResult> UpdateAdjustmentApprovalState(
        Guid id, [FromBody] UpdateAdjustmentApprovalStateRequest req)
    {
        if (!Enum.TryParse<AdjustmentSetApprovalState>(req.NewState, ignoreCase: true, out var parsed))
            return BadRequest(new { error = $"Unknown approval state '{req.NewState}'." });
        try
        {
            var dto = await _svc.UpdateApprovalStateAsync(id, parsed, CurrentUserId, req.RollbackReason);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] UpdateApprovalState failed for {Id}", id);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    // ── Exception Sets ────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a new exception set (parcels routed to a manual review queue or alternate process).
    /// Returns 201 Created with the exception set DTO.
    /// </summary>
    [HttpPost("exceptions")]
    public async Task<IActionResult> CreateExceptionSet([FromBody] CreateCountyExceptionSetRequest req)
    {
        try
        {
            var dto = await _svc.CreateExceptionSetAsync(req, CurrentUserId);
            return StatusCode(201, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] CreateExceptionSet failed for study {StudyId}", req.StudyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    /// <summary>
    /// Returns all exception sets for a study.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/exceptions")]
    public async Task<IActionResult> GetExceptionSets(Guid studyId)
    {
        try
        {
            var list = await _svc.GetExceptionSetsAsync(studyId);
            return Ok(list);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetExceptionSets failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Internal error" });
        }
    }

    [HttpPatch("exceptions/{id:guid}/status")]
    public async Task<IActionResult> UpdateExceptionStatus(Guid id, [FromBody] UpdateExceptionStatusRequest req)
    {
        try
        {
            var dto = await _svc.UpdateExceptionStatusAsync(id, req.NewStatus, CurrentUserId);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] UpdateExceptionStatus failed for {Id}", id);
            return StatusCode(500, new { error = "Failed to update exception status." });
        }
    }

    [HttpPatch("exceptions/{id:guid}/assign")]
    public async Task<IActionResult> AssignException(Guid id, [FromBody] AssignExceptionRequest req)
    {
        try
        {
            var dto = await _svc.AssignExceptionSetAsync(id, req.AssignTo, CurrentUserId);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] AssignException failed for {Id}", id);
            return StatusCode(500, new { error = "Failed to assign exception." });
        }
    }

    [HttpPost("exceptions/{id:guid}/notes")]
    public async Task<IActionResult> AddExceptionNote(Guid id, [FromBody] AddExceptionNoteRequest req)
    {
        try
        {
            var dto = await _svc.AddExceptionNoteAsync(id, req.NoteText, CurrentUserId);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] AddExceptionNote failed for {Id}", id);
            return StatusCode(500, new { error = "Failed to add note." });
        }
    }

    // ── Evidence Packet (Task H — DOR-defensible export) ─────────────────────

    /// <summary>
    /// Assembles a DOR-defensible evidence packet: IAAO metrics, scenario decision,
    /// AI diagnosis summary, and exception log. No new data is written.
    /// </summary>
    [HttpGet("studies/{studyId:guid}/evidence-packet")]
    public async Task<IActionResult> GetEvidencePacket(
        Guid studyId,
        [FromQuery] Guid? scenarioId,
        CancellationToken ct)
    {
        try
        {
            var study = await _svc.GetStudyAsync(studyId);
            if (study is null)
                return NotFound(new { error = $"Study {studyId} not found." });

            // ── IAAO health ───────────────────────────────────────────────────
            CountyHealthSummaryDto? health = null;
            try { health = await _healthSvc.GetHealthSummaryAsync(studyId, ct); }
            catch { /* no active segment set — health stays null */ }

            // ── Scenario ──────────────────────────────────────────────────────
            CountyScenarioDto? scenario = null;
            if (scenarioId.HasValue)
            {
                var allScenarios = await _svc.GetScenariosAsync(studyId);
                scenario = allScenarios.FirstOrDefault(s => s.ScenarioId == scenarioId.Value);
            }

            // ── AI diagnosis (best-effort; omit if no segment set) ────────────
            EvidenceAiSection? aiSection = null;
            try
            {
                var diagnosis = await _aiSvc.DiagnoseCountyAsync(studyId, ct);
                if (diagnosis is not null)
                {
                    var topFindings = diagnosis.TopProblems
                        .SelectMany(seg => seg.Findings)
                        .OrderByDescending(f => f.EvidenceStrength)
                        .Take(5)
                        .Select(f => new EvidenceAiFindingSummary(f.Code, f.Category, f.Summary, f.EvidenceStrength))
                        .ToList();
                    aiSection = new EvidenceAiSection(
                        diagnosis.OverallClass.ToString(),
                        diagnosis.OverallConfidence,
                        diagnosis.HealthySegmentCount,
                        diagnosis.ProblemSegmentCount,
                        diagnosis.Narrative,
                        topFindings);
                }
            }
            catch { /* no segments or other error — diagnosis omitted */ }

            // ── Exceptions ────────────────────────────────────────────────────
            var exceptions = await _svc.GetExceptionSetsAsync(studyId);
            var excItems = exceptions.Select(e => new EvidenceExceptionItem(
                e.ExceptionSetId, e.ReasonCode, e.ParcelCount,
                e.Destination, e.Status, e.AssignedTo, e.Notes, e.CreatedAt)).ToList();

            // ── Assemble ──────────────────────────────────────────────────────
            EvidenceScenarioSection? scenSection = scenario is null ? null :
                new EvidenceScenarioSection(
                    scenario.ScenarioId, scenario.AdjustmentType,
                    scenario.Parameters, scenario.Rationale,
                    scenario.Status, scenario.CreatedAt, scenario.CreatedBy);

            var packet = new EvidencePacketDto(
                StudyId: studyId,
                CountyName: study.CountyName,
                TaxYear: study.TaxYear,
                StudyType: study.StudyType,
                StudyStatus: study.Status,
                ExportedAt: DateTime.UtcNow,
                ExportedBy: CurrentUserId,
                MedianRatio: health?.MedianRatio,
                Cod: health?.Cod,
                Prd: health?.Prd,
                ComplianceStatus: health?.ComplianceStatus ?? "Unknown",
                ParcelCount: health?.ParcelCount ?? 0,
                RatioCount: health?.RatioCount ?? 0,
                CriticalSegments: health?.CriticalCount ?? 0,
                WarningSegments: health?.WarningCount ?? 0,
                HealthySegments: health?.HealthyCount ?? 0,
                PrimaryScenario: scenSection,
                AiDiagnosis: aiSection,
                Exceptions: excItems);

            return Ok(packet);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CountyStudy] GetEvidencePacket failed for study {StudyId}", studyId);
            return StatusCode(500, new { error = "Failed to generate evidence packet." });
        }
    }
}
