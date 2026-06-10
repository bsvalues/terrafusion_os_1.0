using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// WORKBENCH-V0.2 SLICE-I STEP-2: quarantine review endpoints.
///
/// <para>Surfaces two operations:</para>
/// <list type="bullet">
///   <item>
///     <c>GET /api/sync/workbench/quarantine/review</c> — browse
///     quarantine records joined with current operator disposition.
///     Quarantine source rows are never mutated.
///   </item>
///   <item>
///     <c>POST /api/sync/workbench/quarantine/review/{quarantineRowRef}/decision</c>
///     — append an operator disposition row. Does NOT release, promote,
///     or delete the source quarantine row.
///   </item>
/// </list>
///
/// <para>Hard doctrine invariants (per SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7):</para>
/// <list type="bullet">
///   <item>ACCEPT_AS_IS means reviewed + acknowledged, NOT promoted to canonical.</item>
///   <item>Source quarantine row count is unchanged after any POST.</item>
///   <item>Allowed dispositions: ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH.</item>
///   <item>Unsupported lanes → 400. Invalid disposition → 400.</item>
/// </list>
///
/// <para>Single-operator workbench: [AllowAnonymous], no multi-user auth.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/quarantine/review")]
[AllowAnonymous]
public sealed class WorkbenchQuarantineReviewController : ControllerBase
{
    private readonly IQuarantineReviewService _service;
    private readonly ILogger<WorkbenchQuarantineReviewController> _logger;

    public WorkbenchQuarantineReviewController(
        IQuarantineReviewService service,
        ILogger<WorkbenchQuarantineReviewController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/sync/workbench/quarantine/review
    ///
    /// <para>Query parameters:</para>
    /// <list type="bullet">
    ///   <item><c>lane</c> (string, required) — must be "imprv_attr"</item>
    ///   <item><c>limit</c> (int, optional, default 50, max 500)</item>
    ///   <item><c>reason</c> (string, optional) — filter by QuarantineReason</item>
    ///   <item><c>disposition</c> (string, optional) — filter by current disposition;
    ///   "UNREVIEWED" returns rows with no decision yet</item>
    /// </list>
    ///
    /// <para>Returns quarantine source rows joined with their current
    /// (latest by CreatedAt DESC) operator disposition. Source rows are
    /// immutable — this is a read-only projection.</para>
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Browse(
        [FromQuery] string lane = "imprv_attr",
        [FromQuery] int limit = 50,
        [FromQuery] string? reason = null,
        [FromQuery] string? disposition = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[QuarantineReview] Browse: lane={Lane} limit={Limit} reason={Reason} disp={Disp}",
            lane, limit, reason, disposition);

        var request = new QuarantineReviewBrowseRequest
        {
            Lane              = lane,
            Limit             = limit,
            ReasonFilter      = reason,
            DispositionFilter = disposition,
        };

        var result = await _service.BrowseAsync(request, cancellationToken);

        return result.Outcome switch
        {
            QuarantineReviewOutcome.Ok => Ok(new
            {
                lane              = result.Lane,
                totalSourceCount  = result.TotalSourceCount,
                returnedCount     = result.ReturnedCount,
                items             = result.Items,
                notice            = "SOURCE ROWS ARE IMMUTABLE — READ-ONLY PROJECTION",
            }),
            QuarantineReviewOutcome.InvalidInput =>
                BadRequest(new { error = result.ErrorMessage }),
            QuarantineReviewOutcome.UnsupportedLane =>
                BadRequest(new { error = result.ErrorMessage }),
            _ =>
                StatusCode(500, new { error = result.ErrorMessage }),
        };
    }

    /// <summary>
    /// POST /api/sync/workbench/quarantine/review/{quarantineRowRef}/decision
    ///
    /// <para>Request body fields:</para>
    /// <list type="bullet">
    ///   <item><c>lane</c> (string, required) — must be "imprv_attr"</item>
    ///   <item><c>disposition</c> (string, required) —
    ///   ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH</item>
    ///   <item><c>note</c> (string, optional) — max 500 characters</item>
    ///   <item><c>operatorIdentity</c> (string, optional) — defaults to "operator"</item>
    /// </list>
    ///
    /// <para>Inserts exactly one row in
    /// <c>sync_bridge.quarantine_review_decision</c>. The source
    /// quarantine row is never modified. ACCEPT_AS_IS does NOT
    /// release or promote the row.</para>
    /// </summary>
    [HttpPost("{quarantineRowRef}/decision")]
    public async Task<IActionResult> SaveDecision(
        [FromRoute] string quarantineRowRef,
        [FromBody] QuarantineReviewSaveRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return BadRequest(new { error = "request body is required" });

        _logger.LogInformation(
            "[QuarantineReview] SaveDecision: ref={Ref} lane={Lane} disp={Disp}",
            quarantineRowRef, body.Lane, body.Disposition);

        var result = await _service.SaveDecisionAsync(
            quarantineRowRef, body, cancellationToken);

        return result.Outcome switch
        {
            QuarantineReviewOutcome.Ok => Ok(new
            {
                decisionId             = result.DecisionId,
                disposition            = result.Disposition,
                savedAt                = result.SavedAt,
                sourceRowCountAfterSave = result.SourceRowCountAfterSave,
                notice = "DECISION RECORDED — SOURCE QUARANTINE ROW IS UNCHANGED",
            }),
            QuarantineReviewOutcome.InvalidInput =>
                BadRequest(new { error = result.ErrorMessage }),
            QuarantineReviewOutcome.UnsupportedLane =>
                BadRequest(new { error = result.ErrorMessage }),
            QuarantineReviewOutcome.NotFound =>
                NotFound(new { error = result.ErrorMessage }),
            _ =>
                StatusCode(500, new { error = result.ErrorMessage }),
        };
    }
}
