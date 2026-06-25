using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Helpers;
using TerraFusion.Core.Sync.PacsSaleCanonical;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice S4: read-only paginated endpoint for the canonical sales
/// corpus.
///
/// <para><c>GET /api/sales?countyId={id}&amp;page&amp;pageSize&amp;era</c></para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>400 on missing <c>countyId</c>, pagination violations, or
///   invalid <c>era</c> token.</item>
///   <item>403 when the caller's <c>countyId</c> claim doesn't match.</item>
///   <item>200 with <see cref="TerraFusion.Abstractions.DTOs.CanonicalTf.PagedTfSaleResponse"/>
///   on success — empty envelope when no rows qualify.</item>
/// </list>
/// </para>
///
/// <para>Defaults: <c>page=1</c>, <c>pageSize=100</c>, <c>era=POST_CONVERSION</c>.
/// Maximum <c>pageSize=500</c> (server refuses, never silently truncates,
/// per the C39-A pagination contract). The <c>era</c> default is the
/// doctrine-frozen v1.10 §3 value; <c>era=ALL</c> bypasses the filter
/// for audit / migration sweeps.</para>
///
/// <para>Read-only: no DbContext writes, no audit-table mutations.
/// Deterministic ordering by <c>(SlDt DESC, ChgOfOwnerId DESC)</c>
/// so consecutive pages don't shuffle.</para>
/// </summary>
[ApiController]
[Route("api/sales")]
public sealed class TfSalesController : ControllerBase
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 100;
    private const int MaxPageSize = 500;

    private readonly ITfSaleReader _reader;
    private readonly ILogger<TfSalesController> _logger;

    public TfSalesController(
        ITfSaleReader reader,
        ILogger<TfSalesController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetSales(
        [FromQuery] Guid countyId,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? era = null,
        CancellationToken ct = default)
    {
        if (countyId == Guid.Empty)
        {
            return BadRequest(new
            {
                error = "countyId is required.",
                hint = "Pass a non-empty Guid as the countyId query parameter.",
            });
        }

        if (page is < 1)
        {
            return BadRequest(new
            {
                error = "page must be >= 1.",
                hint = "Omit the page query parameter to default to page 1.",
                page,
            });
        }
        if (pageSize is < 1)
        {
            return BadRequest(new
            {
                error = "pageSize must be >= 1.",
                hint = $"Omit the pageSize query parameter to default to {DefaultPageSize}.",
                pageSize,
            });
        }
        if (pageSize is > MaxPageSize)
        {
            return BadRequest(new
            {
                error = $"pageSize must be <= {MaxPageSize}.",
                hint = "Server-bounded per the C39-A pagination contract.",
                pageSize,
                maxPageSize = MaxPageSize,
            });
        }

        // G3 (v1.12): normalize era query param. Null → POST_CONVERSION;
        // unknown tokens → 400 with the valid-values list.
        if (!EraQueryHelper.TryNormalizeEra(era, out var resolvedEra, out var eraFail))
        {
            _logger.LogWarning("[TfSales] invalid era token: {Era}", era);
            return eraFail!;
        }

        var principalCountyId = ResolveCountyClaim();
        if (principalCountyId is null || principalCountyId.Value != countyId)
        {
            _logger.LogWarning(
                "[TfSales] cross-county refused: principal={Principal} requested={Requested}",
                principalCountyId, countyId);
            return Forbid();
        }

        var effectivePage = page ?? DefaultPage;
        var effectivePageSize = pageSize ?? DefaultPageSize;

        var result = await _reader
            .ReadAsync(countyId, effectivePage, effectivePageSize, resolvedEra, ct)
            .ConfigureAwait(false);

        _logger.LogInformation(
            "[TfSales] county={CountyId} page={Page} pageSize={PageSize} era={Era} rows={Rows} total={Total}",
            countyId, effectivePage, effectivePageSize, resolvedEra,
            result.Items.Count, result.TotalCount);

        return Ok(result);
    }

    /// <summary>
    /// Mirrors <c>SyncController.ResolveCountyClaim</c> /
    /// <c>ParcelGeometryController.ResolveCountyClaim</c> — narrow
    /// trust surface (Guid claim only).
    /// </summary>
    private Guid? ResolveCountyClaim()
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }
}
