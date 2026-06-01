using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/pilot")]
[Authorize(Policy = "RequireUser")]
public sealed class PilotController : ControllerBase
{
    private readonly IMuseService _muse;
    private readonly IDraftService _drafts;
    private readonly IMuseRouterStatusService _routerStatus;
    private readonly ILogger<PilotController> _logger;

    public PilotController(
        IMuseService muse,
        IDraftService drafts,
        IMuseRouterStatusService routerStatus,
        ILogger<PilotController> logger)
    {
        _muse = muse;
        _drafts = drafts;
        _routerStatus = routerStatus;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/pilot/router/status — live probe of each configured model lane.
    /// Returns model name, endpoint, live flag, and probe latency per lane.
    /// FallbackActive = true means at least one lane is offline; those requests
    /// will use the static template until the model becomes reachable.
    /// </summary>
    [HttpGet("router/status")]
    [AllowAnonymous] // observability — no auth required, no sensitive data exposed
    public async Task<ActionResult<RouterStatusResponse>> RouterStatus(CancellationToken ct)
    {
        var status = await _routerStatus.GetStatusAsync(ct);
        return Ok(status);
    }

    /// <summary>POST /api/pilot/explain — Muse Mode grounded explain (read-only)</summary>
    [HttpPost("explain")]
    public async Task<ActionResult<ExplainResponse>> Explain(
        [FromBody] ExplainRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CountyId))
            return BadRequest("CountyId is required.");

        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query is required.");

        _logger.LogInformation(
            "Pilot explain request from {ActorId} for county {CountyId}",
            request.ActorId, request.CountyId);

        var result = await _muse.ExplainAsync(request, ct);
        return Ok(result);
    }

    [HttpPost("drafts")]
    public async Task<ActionResult> CreateDraft(
        [FromBody] CreateDraftRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CountyId))
            return BadRequest("CountyId is required");

        var draft = await _drafts.CreateDraftAsync(
            request.CountyId,
            request.ProposedBy,
            request.ActionSummary,
            request.ActionPayloadJson,
            ct);

        return CreatedAtAction(nameof(GetDraft), new { id = draft.Id }, draft);
    }

    [HttpGet("drafts/{id:guid}")]
    public async Task<ActionResult> GetDraft(Guid id, [FromQuery] string countyId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(countyId))
            return BadRequest("countyId query parameter is required");

        var draft = await _drafts.GetDraftAsync(id, countyId, ct);
        if (draft is null) return NotFound();
        return Ok(draft);
    }

    [HttpGet("drafts")]
    public async Task<ActionResult> GetPendingDrafts([FromQuery] string countyId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(countyId))
            return BadRequest("countyId query parameter is required");

        var drafts = await _drafts.GetPendingDraftsAsync(countyId, ct);
        return Ok(drafts);
    }

    [HttpPost("drafts/{id:guid}/approve")]
    [Authorize(Policy = "RequireAssessor")]
    public async Task<ActionResult> ApproveDraft(Guid id, [FromBody] ApproveDraftRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.HumanApproverId))
            return BadRequest("HumanApproverId is required");

        try
        {
            var draft = await _drafts.ApproveDraftAsync(id, request.CountyId, request.HumanApproverId, ct);
            return Ok(draft);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPost("drafts/{id:guid}/reject")]
    [Authorize(Policy = "RequireAssessor")]
    public async Task<ActionResult> RejectDraft(Guid id, [FromBody] RejectDraftRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.HumanApproverId))
            return BadRequest("HumanApproverId is required");

        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest("Reason is required");

        try
        {
            var draft = await _drafts.RejectDraftAsync(id, request.CountyId, request.HumanApproverId, request.Reason, ct);
            return Ok(draft);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    // Dedicated pilot runtime is optional in preview environments. These responses
    // keep read surfaces honest when that runtime is unavailable.

    /// <summary>Returns an explicit empty tool list when pilot runtime is unavailable.</summary>
    [HttpGet("tools")]
    [AllowAnonymous]
    public IActionResult GetTools([FromQuery] string? mode = null)
    {
        _logger.LogDebug("Pilot tools unavailable response hit (mode={Mode})", mode);
        return Ok(new
        {
            tools = Array.Empty<object>(),
            source = "pilot_runtime_unavailable",
            runtimeOnline = false,
            code = "PILOT_RUNTIME_UNAVAILABLE"
        });
    }

    /// <summary>Returns service-unavailable when pilot invoke is hit without runtime.</summary>
    [HttpPost("invoke")]
    [Authorize]
    public IActionResult InvokeTool([FromBody] object? body = null)
    {
        _logger.LogDebug("Pilot invoke unavailable response hit");
        return StatusCode(StatusCodes.Status503ServiceUnavailable, new
        {
            success = false,
            runtimeOnline = false,
            correlationId = $"pilot-unavailable-{Guid.NewGuid():N}",
            error = new
            {
                code = "PILOT_RUNTIME_UNAVAILABLE",
                message = "Pilot runtime is unavailable in this environment.",
                severity = "unavailable"
            }
        });
    }

    /// <summary>Returns explicit empty traces when pilot runtime is unavailable.</summary>
    [HttpGet("traces")]
    [AllowAnonymous]
    public IActionResult GetTraces()
    {
        _logger.LogDebug("Pilot traces unavailable response hit");
        return Ok(new
        {
            events = Array.Empty<object>(),
            total = 0,
            source = "pilot_runtime_unavailable",
            runtimeOnline = false,
            code = "PILOT_RUNTIME_UNAVAILABLE"
        });
    }

    /// <summary>Returns health indicating pilot runtime is unavailable.</summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult GetPilotHealth()
    {
        _logger.LogDebug("Pilot health unavailable response hit");
        return Ok(new
        {
            status = "degraded",
            runtimeOnline = false,
            code = "PILOT_RUNTIME_UNAVAILABLE",
            message = "Pilot runtime unavailable"
        });
    }

    /// <summary>Returns service-unavailable for validation when pilot runtime is unavailable.</summary>
    [HttpPost("validate")]
    [Authorize]
    public IActionResult ValidateTool([FromBody] object? body = null)
    {
        return StatusCode(StatusCodes.Status503ServiceUnavailable, new
        {
            valid = false,
            runtimeOnline = false,
            code = "PILOT_RUNTIME_UNAVAILABLE",
            message = "Pilot runtime is unavailable in this environment."
        });
    }
}
