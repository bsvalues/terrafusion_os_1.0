using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// SYNC-WORKBENCH-G: atomic decision-commit panel.
///
/// <para>Mirrors the Phase 4 / V7 doctrine-policy controller pattern:
/// no <c>[Authorize]</c>, no per-row CountyId filter (single-county-
/// per-deployment doctrine). The commit endpoint runs inside one
/// DbContext transaction; reads are <c>AsNoTracking</c>.</para>
///
/// <para>Endpoints:</para>
/// <list type="bullet">
///   <item><c>POST /api/sync/workbench/g/commit</c> — atomic,
///   idempotent commit of pending Routed/Dismissed triage decisions
///   plus a doctrine-gate snapshot.</item>
///   <item><c>GET /api/sync/workbench/g/commits</c> — paged list
///   of recent commits (newest first).</item>
///   <item><c>GET /api/sync/workbench/g/commits/{commitId}</c> —
///   single commit + linked decisions.</item>
/// </list>
///
/// <para>PR-2 (Prometheus T3): explicitly tagged <c>[AllowAnonymous]</c>.
/// Single-county-per-deployment doctrine; operator-driven via curl. The
/// global <c>FallbackPolicy.RequireAuthenticatedUser()</c> now requires
/// every controller to declare its auth posture; this controller's
/// "no [Authorize]" intent is now explicit instead of implicit.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/g")]
[AllowAnonymous]
public sealed class WorkbenchGController : ControllerBase
{
    private readonly IWorkbenchCommitService _service;
    private readonly ILogger<WorkbenchGController> _logger;

    public WorkbenchGController(
        IWorkbenchCommitService service,
        ILogger<WorkbenchGController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// <c>POST /api/sync/workbench/g/commit</c>
    /// </summary>
    [HttpPost("commit")]
    public async Task<IActionResult> Commit(
        [FromBody] CommitRequest body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return BadRequest(new { error = "request body is required" });

        var result = await _service.CommitAsync(body, cancellationToken);
        return MapCommit(result);
    }

    /// <summary>
    /// <c>GET /api/sync/workbench/g/commits</c>
    /// </summary>
    [HttpGet("commits")]
    public async Task<IActionResult> ListCommits(
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.ListCommitsAsync(limit, offset, cancellationToken);
        return MapList(result);
    }

    /// <summary>
    /// <c>GET /api/sync/workbench/g/commits/{commitId}</c>
    /// </summary>
    [HttpGet("commits/{commitId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetCommit(
        [FromRoute] Guid commitId,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetCommitAsync(commitId, cancellationToken);
        return MapDetail(result);
    }

    // ── Outcome → HTTP mapping ───────────────────────────────────────

    private IActionResult MapCommit(CommitResult r) => r.Outcome switch
    {
        CommitOutcome.Ok => Ok(r.Payload),
        CommitOutcome.InvalidInput => BadRequest(new { error = r.ErrorMessage }),
        CommitOutcome.NotFound => NotFound(new { error = r.ErrorMessage }),
        CommitOutcome.Conflict => Conflict(new { error = r.ErrorMessage }),
        _ => StatusCode(500, new { error = r.ErrorMessage }),
    };

    private IActionResult MapList(CommitListResult r) => r.Outcome switch
    {
        CommitOutcome.Ok => Ok(new
        {
            count = r.Items.Count,
            limit = r.Limit,
            offset = r.Offset,
            items = r.Items,
        }),
        CommitOutcome.InvalidInput => BadRequest(new { error = r.ErrorMessage }),
        _ => StatusCode(500, new { error = r.ErrorMessage }),
    };

    private IActionResult MapDetail(CommitDetailResult r) => r.Outcome switch
    {
        CommitOutcome.Ok => Ok(r.Payload),
        CommitOutcome.InvalidInput => BadRequest(new { error = r.ErrorMessage }),
        CommitOutcome.NotFound => NotFound(new { error = r.ErrorMessage }),
        _ => StatusCode(500, new { error = r.ErrorMessage }),
    };
}
