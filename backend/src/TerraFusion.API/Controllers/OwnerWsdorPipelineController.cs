using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsOwnerWsdorPipeline;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Operator-trigger endpoint for Block B's owner+WSDOR pipeline.
/// Mirrors <see cref="SalesPipelineController"/>'s shape.
///
/// <para><c>POST /api/sync/owner-wsdor/run</c></para>
///
/// <para>Auth: <c>[Authorize]</c> + non-empty <c>countyId</c> claim.
/// Like the sales pipeline trigger, this endpoint does not yet
/// verify the source batches belong to the principal's county —
/// county isolation is enforced downstream at the canonical layer's
/// county-isolation gates (B3 + B4). A future hardening slice can
/// add a precondition check.</para>
///
/// <para>The four-stage chain (B2-A → B2-B → B3 → B4) returns 200
/// even on REFUSED / FAILED outcomes; the body's
/// <see cref="PacsOwnerWsdorSyncRunResult.Status"/> field carries
/// the outcome. Refusals are doctrine outcomes, not transport errors.</para>
/// </summary>
[ApiController]
[Route("api/sync/owner-wsdor")]
public sealed class OwnerWsdorPipelineController : ControllerBase
{
    private readonly IPacsOwnerWsdorSyncRunner _runner;
    private readonly ILogger<OwnerWsdorPipelineController> _logger;

    public OwnerWsdorPipelineController(
        IPacsOwnerWsdorSyncRunner runner,
        ILogger<OwnerWsdorPipelineController> logger)
    {
        _runner = runner;
        _logger = logger;
    }

    [HttpPost("run")]
    [Authorize]
    public async Task<IActionResult> RunPipeline(
        [FromBody] OwnerWsdorPipelineRunRequest request,
        CancellationToken ct = default)
    {
        if (request is null)
        {
            return BadRequest(new { error = "request body is required." });
        }
        if (request.OwnerLoadBatchId == Guid.Empty)
        {
            return BadRequest(new { error = "ownerLoadBatchId must be a non-empty Guid." });
        }
        if (request.AccountLoadBatchId == Guid.Empty)
        {
            return BadRequest(new { error = "accountLoadBatchId must be a non-empty Guid." });
        }
        if (request.SuppAssocLoadBatchId == Guid.Empty)
        {
            return BadRequest(new { error = "suppAssocLoadBatchId must be a non-empty Guid." });
        }
        if (request.WpovLoadBatchId == Guid.Empty)
        {
            return BadRequest(new { error = "wpovLoadBatchId must be a non-empty Guid." });
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning("[OwnerWsdorPipeline] missing countyId claim; refusing.");
            return Forbid();
        }

        var operatorName = User.Identity?.Name?.Trim() is { Length: > 0 } name
            ? name
            : $"operator:{principalCountyId.Value}";

        var result = await _runner
            .RunAsync(
                request.OwnerLoadBatchId,
                request.AccountLoadBatchId,
                request.SuppAssocLoadBatchId,
                request.WpovLoadBatchId,
                operatorName,
                ct)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[OwnerWsdorPipeline] runStatus={Status} truthOwner={TO} truthWsdor={TW} canonOwner={CO} canonWsdor={CW}",
            result.Status,
            result.TruthOwnerLoadBatchId, result.TruthWsdorLoadBatchId,
            result.CanonicalOwnerLoadBatchId, result.CanonicalWsdorLoadBatchId);

        return Ok(result);
    }

    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}

/// <summary>Request body for <c>POST /api/sync/owner-wsdor/run</c>.</summary>
public sealed record OwnerWsdorPipelineRunRequest
{
    public Guid OwnerLoadBatchId { get; init; }
    public Guid AccountLoadBatchId { get; init; }
    public Guid SuppAssocLoadBatchId { get; init; }
    public Guid WpovLoadBatchId { get; init; }
}
