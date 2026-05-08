using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Helpers;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesRatioStudy;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice F5: read-only sales-ratio-study aggregate endpoints.
///
/// <para>Per
/// <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>:
/// exposes the operator's three morning queries (Q1 valid-count,
/// Q2 by-year, Q3 aggregate price) as canonical-equivalent
/// REST endpoints. The aggregates read from
/// <c>canonical_tf.tf_sale</c>; equivalence to PACS-original
/// queries is proven by <c>OperatorSalesRegressionTests</c>.</para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if the request is unauthenticated (handled by
///   <c>[Authorize]</c>).</item>
///   <item>403 if the caller's <c>countyId</c> claim is missing.</item>
///   <item>403 if the caller's <c>countyId</c> claim doesn't
///   match the requested <c>countyId</c> path segment
///   (sovereign-county isolation).</item>
///   <item>200 with a typed aggregate body when authorized.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit
/// table mutations, no PII surfaced. Empty datasets return
/// 200 with zero counts (operator gets a clean "nothing to
/// study yet" view, not a 404).</para>
/// </summary>
[ApiController]
[Route("api/counties/{countyId:guid}/sales-ratio-study")]
public sealed class SalesRatioStudyController : ControllerBase
{
    private readonly ISalesRatioStudyReader _reader;
    private readonly ILogger<SalesRatioStudyController> _logger;

    public SalesRatioStudyController(
        ISalesRatioStudyReader reader,
        ILogger<SalesRatioStudyController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    /// <summary>
    /// Q1: count of valid sales for the county.
    /// <c>GET /api/counties/{countyId}/sales-ratio-study/valid-sale-count</c>
    /// </summary>
    [HttpGet("valid-sale-count")]
    [Authorize]
    public async Task<IActionResult> GetValidSaleCount(
        Guid countyId,
        [FromQuery] DateTime? from = null,
        [FromQuery] string? era = null,
        CancellationToken ct = default)
    {
        if (!TryAuthorize(countyId, out var fail))
            return fail!;
        if (!TryNormalizeEra(era, out var resolvedEra, out var eraFail))
            return eraFail!;

        var count = await _reader.GetValidSaleCountAsync(countyId, from, resolvedEra, ct)
            .ConfigureAwait(false);
        return Ok(new
        {
            countyId,
            fromDate = from ?? ISalesRatioStudyReader.DefaultFromDate,
            era = resolvedEra,
            validSaleCount = count,
        });
    }

    /// <summary>
    /// Q2: count of valid sales grouped by sale year, descending.
    /// <c>GET /api/counties/{countyId}/sales-ratio-study/by-year</c>
    /// </summary>
    [HttpGet("by-year")]
    [Authorize]
    public async Task<IActionResult> GetValidSalesByYear(
        Guid countyId,
        [FromQuery] DateTime? from = null,
        [FromQuery] string? era = null,
        CancellationToken ct = default)
    {
        if (!TryAuthorize(countyId, out var fail))
            return fail!;
        if (!TryNormalizeEra(era, out var resolvedEra, out var eraFail))
            return eraFail!;

        var rows = await _reader.GetValidSalesByYearAsync(countyId, from, resolvedEra, ct)
            .ConfigureAwait(false);
        return Ok(new
        {
            countyId,
            fromDate = from ?? ISalesRatioStudyReader.DefaultFromDate,
            era = resolvedEra,
            rows,
        });
    }

    /// <summary>
    /// Q3: aggregate price (count, sum, avg) for valid sales
    /// with non-null <c>SlPrice</c>.
    /// <c>GET /api/counties/{countyId}/sales-ratio-study/price-aggregate</c>
    /// </summary>
    [HttpGet("price-aggregate")]
    [Authorize]
    public async Task<IActionResult> GetAggregateSalePrice(
        Guid countyId,
        [FromQuery] DateTime? from = null,
        [FromQuery] string? era = null,
        CancellationToken ct = default)
    {
        if (!TryAuthorize(countyId, out var fail))
            return fail!;
        if (!TryNormalizeEra(era, out var resolvedEra, out var eraFail))
            return eraFail!;

        var aggregate = await _reader.GetAggregateSalePriceAsync(countyId, from, resolvedEra, ct)
            .ConfigureAwait(false);
        return Ok(new
        {
            countyId,
            fromDate = from ?? ISalesRatioStudyReader.DefaultFromDate,
            era = resolvedEra,
            aggregate,
        });
    }

    /// <summary>
    /// G3 (v1.12): normalizes the <c>era</c> query parameter.
    /// Delegates to <see cref="EraQueryHelper"/> so the doctrine
    /// vocabulary stays single-sourced across all G3 read endpoints.
    /// </summary>
    private bool TryNormalizeEra(
        string? era,
        out string resolvedEra,
        out IActionResult? failureResult)
    {
        if (!EraQueryHelper.TryNormalizeEra(era, out resolvedEra, out failureResult))
        {
            _logger.LogWarning(
                "[SalesRatioStudy] invalid era token: {Era}", era);
            return false;
        }
        return true;
    }

    /// <summary>
    /// Verifies the caller has a <c>countyId</c> claim and that
    /// it matches the requested <c>countyId</c>. Returns
    /// <c>true</c> on authorized, <c>false</c> + populates
    /// <paramref name="failureResult"/> otherwise.
    /// </summary>
    private bool TryAuthorize(Guid requestedCountyId, out IActionResult? failureResult)
    {
        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null)
        {
            _logger.LogWarning(
                "[SalesRatioStudy] missing countyId claim on principal; refusing.");
            failureResult = Forbid();
            return false;
        }

        if (principalCountyId.Value != requestedCountyId)
        {
            _logger.LogWarning(
                "[SalesRatioStudy] cross-county refused: principal={Principal} requested={Requested}",
                principalCountyId, requestedCountyId);
            failureResult = Forbid();
            return false;
        }

        failureResult = null;
        return true;
    }

    /// <summary>Mirrors <c>ParcelGeometryController.ResolveCountyClaim</c>.</summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
