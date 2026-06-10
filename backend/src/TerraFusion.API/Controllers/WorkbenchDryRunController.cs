using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Controllers;

/// <summary>
/// WORKBENCH-V0.2 SLICE-H STEP-2: dry-run preview endpoint.
///
/// <para>POST /api/sync/workbench/dry-run-preview</para>
///
/// <para>Returns a read-only projection of what the improvement drain
/// would do. Does NOT execute the drain. Does NOT mutate
/// truth_pacs.*, canonical_tf.*, or legacy_pacs_raw.*. Writes
/// exactly one <c>sync_bridge.dry_run_log</c> row (is_preview=true)
/// for audit traceability.</para>
///
/// <para>Hard rules (per SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §3–§4):</para>
/// <list type="bullet">
///   <item><c>dryRun</c> must be <see langword="true"/> in the request body.
///   Absent or false → 400.</item>
///   <item>Only lane = "improvement" is supported in Step 2.
///   Other lanes → 400.</item>
///   <item>The response body contains Status = "PREVIEW" so the caller
///   can confirm no drain ran.</item>
/// </list>
///
/// <para>Mirrors the V7 controller pattern: [AllowAnonymous],
/// single-county-per-deployment doctrine.</para>
/// </summary>
[ApiController]
[Route("api/sync/workbench/dry-run-preview")]
[AllowAnonymous]
public sealed class WorkbenchDryRunController : ControllerBase
{
    private readonly IDryRunPreviewService _service;
    private readonly ILogger<WorkbenchDryRunController> _logger;

    public WorkbenchDryRunController(
        IDryRunPreviewService service,
        ILogger<WorkbenchDryRunController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/sync/workbench/dry-run-preview
    ///
    /// <para>Request body fields:</para>
    /// <list type="bullet">
    ///   <item><c>lane</c> (string, required) — must be "improvement"</item>
    ///   <item><c>dryRun</c> (bool, required) — must be true</item>
    ///   <item><c>operationalYear</c> (int, optional)</item>
    ///   <item><c>topN</c> (int, optional)</item>
    ///   <item><c>requestedBy</c> (string, optional)</item>
    /// </list>
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Preview(
        [FromBody] DryRunPreviewRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)
            return BadRequest(new { error = "request body is required" });

        _logger.LogInformation(
            "[WorkbenchDryRun] Preview requested: lane={Lane} dryRun={DryRun} " +
            "topN={TopN} year={Year}",
            body.Lane, body.DryRun, body.TopN, body.OperationalYear);

        var result = await _service.ComputePreviewAsync(body, cancellationToken);

        return result.Outcome switch
        {
            DryRunPreviewOutcome.Ok => Ok(new
            {
                previewRunId = result.PreviewRunId,
                lane = result.Lane,
                operationalYear = result.OperationalYear,
                topN = result.TopN,
                sourceCount = result.SourceCount,
                canonicalCount = result.CanonicalCount,
                estimatedInserts = result.EstimatedInserts,
                estimatedUpdates = result.EstimatedUpdates,
                estimatedDeletes = result.EstimatedDeletes,
                quarantineCandidateCount = result.QuarantineCandidateCount,
                status = result.Status,
                durationMs = result.DurationMs,
                // Confirms no drain ran — belt-and-suspenders label.
                notice = "DRY-RUN PREVIEW — NO DATA HAS MOVED",
            }),
            DryRunPreviewOutcome.InvalidInput =>
                BadRequest(new { error = result.ErrorMessage }),
            DryRunPreviewOutcome.UnsupportedLane =>
                BadRequest(new { error = result.ErrorMessage }),
            _ =>
                StatusCode(500, new { error = result.ErrorMessage }),
        };
    }
}
