using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-WORKBENCH-F: improvement-attribute quarantine triage panel.
///
/// <para>Mirrors the V7 doctrine-policy controller pattern: no
/// <c>[Authorize]</c>, no per-row CountyId filter (single-county-
/// per-deployment doctrine). The quarantine entity is doctrine-
/// immutable; this controller only writes the sibling triage table.</para>
///
/// <para>Endpoints:</para>
/// <list type="bullet">
///   <item><c>GET /api/sync/workbench/f/quarantine/imprv-attr</c> —
///   paged list with optional reason / universe / propId filters.</item>
///   <item><c>POST /api/sync/workbench/f/quarantine/imprv-attr/{id}/route</c> —
///   record a routing decision.</item>
///   <item><c>POST /api/sync/workbench/f/quarantine/imprv-attr/{id}/dismiss</c> —
///   record a dismissal decision.</item>
/// </list>
///
/// <para>PR-2 (Prometheus T3): explicitly tagged <c>[AllowAnonymous]</c>.
/// Single-county-per-deployment doctrine; operator-driven via curl. The
/// global <c>FallbackPolicy.RequireAuthenticatedUser()</c> now requires
/// every controller to declare its auth posture; this controller's
/// "no [Authorize]" intent is now explicit instead of implicit.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/f")]
[AllowAnonymous]
public sealed class WorkbenchFController : ControllerBase
{
    private readonly IQuarantineTriageService _service;
    private readonly ILogger<WorkbenchFController> _logger;

    public WorkbenchFController(
        IQuarantineTriageService service,
        ILogger<WorkbenchFController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// <c>GET /api/sync/workbench/f/quarantine/imprv-attr</c>
    /// </summary>
    [HttpGet("quarantine/imprv-attr")]
    public async Task<IActionResult> ListQuarantine(
        [FromQuery] string? reason = null,
        [FromQuery] string? universe = null,
        [FromQuery] int? propId = null,
        [FromQuery] int limit = 100,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.ListAsync(
            new QuarantineListRequest(reason, universe, propId, limit, offset),
            cancellationToken);

        return MapList(result);
    }

    /// <summary>
    /// <c>POST /api/sync/workbench/f/quarantine/imprv-attr/{unprovenRowId}/route</c>
    /// </summary>
    [HttpPost("quarantine/imprv-attr/{unprovenRowId:guid}/route")]
    public async Task<IActionResult> Route(
        [FromRoute] Guid unprovenRowId,
        [FromBody] RouteRequest body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return BadRequest(new { error = "request body is required" });

        var result = await _service.RouteAsync(unprovenRowId, body, cancellationToken);
        return MapRoute(result);
    }

    /// <summary>
    /// <c>POST /api/sync/workbench/f/quarantine/imprv-attr/{unprovenRowId}/dismiss</c>
    /// </summary>
    [HttpPost("quarantine/imprv-attr/{unprovenRowId:guid}/dismiss")]
    public async Task<IActionResult> Dismiss(
        [FromRoute] Guid unprovenRowId,
        [FromBody] DismissRequest body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return BadRequest(new { error = "request body is required" });

        var result = await _service.DismissAsync(unprovenRowId, body, cancellationToken);
        return MapDismiss(result);
    }

    // ── Outcome → HTTP mapping ───────────────────────────────────────

    private IActionResult MapList(QuarantineListResult r) => r.Outcome switch
    {
        TriageOutcome.Ok => Ok(new
        {
            count = r.Items.Count,
            limit = r.Limit,
            offset = r.Offset,
            items = r.Items,
        }),
        TriageOutcome.InvalidInput => BadRequest(new { error = r.ErrorMessage }),
        _ => StatusCode(500, new { error = r.ErrorMessage }),
    };

    private IActionResult MapRoute(RouteDecisionResult r) => r.Outcome switch
    {
        TriageOutcome.Ok => Ok(r.Payload),
        TriageOutcome.InvalidInput => BadRequest(new { error = r.ErrorMessage }),
        TriageOutcome.NotFound => NotFound(new { error = r.ErrorMessage }),
        TriageOutcome.Conflict => Conflict(new { error = r.ErrorMessage }),
        _ => StatusCode(500, new { error = r.ErrorMessage }),
    };

    private IActionResult MapDismiss(DismissDecisionResult r) => r.Outcome switch
    {
        TriageOutcome.Ok => Ok(r.Payload),
        TriageOutcome.InvalidInput => BadRequest(new { error = r.ErrorMessage }),
        TriageOutcome.NotFound => NotFound(new { error = r.ErrorMessage }),
        TriageOutcome.Conflict => Conflict(new { error = r.ErrorMessage }),
        _ => StatusCode(500, new { error = r.ErrorMessage }),
    };
}
