using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.API.Security;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Muse — AI-powered NLP explanation engine for assessment operations.
/// Generates professional natural language for taxpayer notices, appeal responses,
/// commissioner memos, and evidence synthesis.
/// R2.11: Template-based engine; swaps to Claude API in R3.
/// County isolation enforced on all endpoints.
/// </summary>
[ApiController]
[Route("api/muse")]
[Authorize]
public class MuseController : ControllerBase
{
    private readonly IMuseService _muse;
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<MuseController> _logger;

    public MuseController(
        IMuseService muse,
        TerraFusionDbContext db,
        ILogger<MuseController> logger)
    {
        _muse = muse;
        _db = db;
        _logger = logger;
    }

    // ── County Isolation ─────────────────────────────────────────────

    private async Task<Guid?> ResolveCountyIdAsync()
    {
        var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
        if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
            return directCountyId;

        var countyCodeClaim = User.FindFirst("countyCode")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(countyIdClaim) && string.IsNullOrWhiteSpace(countyCodeClaim))
            return null;

        // Try to resolve by name or FIPS
        var candidate = (countyIdClaim ?? countyCodeClaim)!.Trim();
        return await _db.Counties
            .AsNoTracking()
            .Where(c => c.Name == candidate || c.FipsCode == candidate)
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync();
    }

    // ── GET /api/muse/capabilities ───────────────────────────────────

    /// <summary>Return Muse engine capabilities and supported explanation types.</summary>
    [HttpGet("capabilities")]
    public IActionResult GetCapabilities()
    {
        return Ok(_muse.GetCapabilities());
    }

    // ── POST /api/muse/explain/value-change ──────────────────────────

    /// <summary>
    /// Generate a natural language explanation for a property value change.
    /// Supports audience-specific language: taxpayer, appraiser, commissioner, internal.
    /// </summary>
    [HttpPost("explain/value-change")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> ExplainValueChange([FromBody] ExplainValueChangeRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var result = await _muse.ExplainValueChangeAsync(request, countyId.Value);
        return Ok(result);
    }

    // ── POST /api/muse/explain/assessment ────────────────────────────

    /// <summary>
    /// Generate a natural language explanation for the current assessment of a property.
    /// </summary>
    [HttpPost("explain/assessment")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> ExplainAssessment([FromBody] ExplainAssessmentRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var result = await _muse.ExplainAssessmentAsync(request, countyId.Value);
        return Ok(result);
    }

    // ── POST /api/muse/draft/notice ──────────────────────────────────

    /// <summary>
    /// Draft a value change notice for a property owner.
    /// </summary>
    [HttpPost("draft/notice")]
    [RequiresPermission("write:notice")]
    public async Task<IActionResult> DraftNotice([FromBody] DraftNoticeRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var result = await _muse.DraftNoticeAsync(request, countyId.Value);
        return Ok(result);
    }

    // ── POST /api/muse/draft/appeal-response ─────────────────────────

    /// <summary>
    /// Draft a response to a Board of Equalization appeal.
    /// </summary>
    [HttpPost("draft/appeal-response")]
    [RequiresPermission("write:appeal")]
    public async Task<IActionResult> DraftAppealResponse([FromBody] DraftAppealResponseRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var result = await _muse.DraftAppealResponseAsync(request, countyId.Value);
        return Ok(result);
    }

    // ── POST /api/muse/draft/memo ────────────────────────────────────

    /// <summary>
    /// Generate a commissioner memorandum on a given topic.
    /// </summary>
    [HttpPost("draft/memo")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GenerateMemo([FromBody] GenerateMemoRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var result = await _muse.GenerateMemoAsync(request, countyId.Value);
        return Ok(result);
    }

    // ── POST /api/muse/synthesize ────────────────────────────────────

    /// <summary>
    /// Synthesize evidence from multiple data sources for a parcel.
    /// Gathers assessment history, property data, and returns a cohesive narrative.
    /// </summary>
    [HttpPost("synthesize")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> SynthesizeEvidence([FromBody] SynthesizeEvidenceRequest request)
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null) return Forbid();

        var result = await _muse.SynthesizeEvidenceAsync(request, countyId.Value);
        return Ok(result);
    }
}
