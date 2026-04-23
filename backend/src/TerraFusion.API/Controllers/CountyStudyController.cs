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
using TerraFusion.Core.DTOs;
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

    public CountyStudyController(
        ICountyStudyService svc,
        ICountyResolver countyResolver,
        ILogger<CountyStudyController> logger)
    {
        _svc            = svc;
        _countyResolver = countyResolver;
        _logger         = logger;
    }

    private string CurrentUserId =>
        User?.Identity?.Name ?? FallbackUserId;

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
}
