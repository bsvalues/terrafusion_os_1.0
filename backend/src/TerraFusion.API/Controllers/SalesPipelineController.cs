using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsSalePipeline;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Operator-trigger endpoints for the Block A sales pipeline. v1
/// exposes the chain that promotes already-landed raw batches all
/// the way to canonical: S2-B truth promotion → S3 canonical
/// projection.
///
/// <para><c>POST /api/sync/sales/run</c></para>
///
/// <para>Auth: <c>[Authorize]</c> + a non-empty <c>countyId</c>
/// claim. The endpoint does not yet verify that the source batches
/// belong to the principal's county — county isolation is enforced
/// downstream at <c>canonical_tf.tf_sale</c>'s
/// <c>canonical-county-isolation</c> gate. A future hardening slice
/// can add a precondition check.</para>
/// </summary>
[ApiController]
[Route("api/sync/sales")]
public sealed class SalesPipelineController : ControllerBase
{
    private readonly IPacsSaleSyncRunner _runner;
    private readonly ILogger<SalesPipelineController> _logger;

    public SalesPipelineController(
        IPacsSaleSyncRunner runner,
        ILogger<SalesPipelineController> logger)
    {
        _runner = runner;
        _logger = logger;
    }

    [HttpPost("run")]
    [Authorize]
    public async Task<IActionResult> RunPipeline(
        [FromBody] SalesPipelineRunRequest request,
        CancellationToken ct = default)
    {
        if (request is null)
        {
            return BadRequest(new { error = "request body is required." });
        }
        if (request.SaleLoadBatchId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "saleLoadBatchId must be a non-empty Guid.",
            });
        }
        if (request.SuppAssocLoadBatchId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "suppAssocLoadBatchId must be a non-empty Guid.",
            });
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning("[SalesPipeline] missing countyId claim; refusing.");
            return Forbid();
        }

        var operatorName = User.Identity?.Name?.Trim() is { Length: > 0 } name
            ? name
            : $"operator:{principalCountyId.Value}";

        var result = await _runner
            .RunAsync(request.SaleLoadBatchId, request.SuppAssocLoadBatchId, operatorName, ct)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[SalesPipeline] runStatus={Status} truthBatch={Truth} canonicalBatch={Canonical} promoted={Promoted} projected={Projected} quarantined={Quarantined}",
            result.Status, result.TruthPromotionLoadBatchId,
            result.CanonicalPromotionLoadBatchId,
            result.SalesPromoted, result.SalesProjected, result.SalesQuarantined);

        // 200 even on REFUSED — the body carries the per-stage status.
        // Refusals are doctrine outcomes, not transport errors. A
        // genuine FAILED stage (exception path) also returns 200 with
        // ErrorSummary populated; the caller inspects Status.
        return Ok(result);
    }

    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}

/// <summary>Request body for <c>POST /api/sync/sales/run</c>.</summary>
public sealed record SalesPipelineRunRequest
{
    public Guid SaleLoadBatchId { get; init; }
    public Guid SuppAssocLoadBatchId { get; init; }
}
