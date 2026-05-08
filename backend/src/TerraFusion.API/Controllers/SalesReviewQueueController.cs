using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.SalesReview;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Slice F2: read-only sales-review queue endpoint.
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §F: F2
/// is one of the operator's morning-dashboard panels. Surfaces
/// canonical <c>tf_sale</c> rows whose dual-surface qualification
/// reviews (DOR / county) are still outstanding.</para>
///
/// <para>Contract:
/// <list type="bullet">
///   <item>401 if the request is unauthenticated (handled by <c>[Authorize]</c>).</item>
///   <item>403 if the caller's <c>countyId</c> claim is missing.</item>
///   <item>400 if <c>era</c> is provided but unrecognized.</item>
///   <item>200 with <c>{ countyId, lookbackYears, era, count, items }</c>
///   when authorized.</item>
/// </list>
/// </para>
///
/// <para>Read-only by contract: no DbContext writes, no audit
/// table mutations, no PII surfaced. County is taken from the
/// <c>countyId</c> claim (not the URL) so the endpoint is
/// always-and-only scoped to the caller's sovereign county.</para>
/// </summary>
[ApiController]
[Route("api/sales/review-queue")]
public sealed class SalesReviewQueueController : ControllerBase
{
    private readonly ISalesReviewReader _reader;
    private readonly ILogger<SalesReviewQueueController> _logger;

    /// <summary>
    /// Frozen set of valid <c>era</c> tokens. Mirrors the F5 token
    /// set so the two morning panels share one vocabulary.
    /// </summary>
    private static readonly IReadOnlySet<string> ValidEraValues =
        new HashSet<string>
        {
            ConversionEras.PostConversion,
            ConversionEras.PreConversion2017,
            ConversionEras.Unknown,
            ISalesReviewReader.EraAll,
        };

    public SalesReviewQueueController(
        ISalesReviewReader reader,
        ILogger<SalesReviewQueueController> logger)
    {
        _reader = reader;
        _logger = logger;
    }

    /// <summary>
    /// <c>GET /api/sales/review-queue</c>
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetReviewQueue(
        [FromQuery] int lookbackYears = ISalesReviewReader.DefaultLookbackYears,
        [FromQuery] string? era = null,
        [FromQuery] int maxResults = ISalesReviewReader.DefaultMaxResults,
        CancellationToken ct = default)
    {
        if (!TryResolveCounty(out var countyId, out var countyFail))
            return countyFail!;
        if (!TryNormalizeEra(era, out var resolvedEra, out var eraFail))
            return eraFail!;

        var clampedLookback = lookbackYears < 1
            ? 1
            : lookbackYears;
        var clampedMax = maxResults < 1
            ? 1
            : (maxResults > ISalesReviewReader.MaxResultsHardCap
                ? ISalesReviewReader.MaxResultsHardCap
                : maxResults);

        var items = await _reader.GetReviewQueueAsync(
            countyId, clampedLookback, resolvedEra, clampedMax, ct)
            .ConfigureAwait(false);

        return Ok(new SalesReviewQueueResponse
        {
            CountyId = countyId,
            LookbackYears = clampedLookback,
            Era = resolvedEra,
            MaxResults = clampedMax,
            Count = items.Count,
            Items = items,
        });
    }

    private bool TryNormalizeEra(
        string? era,
        out string resolvedEra,
        out IActionResult? failureResult)
    {
        if (string.IsNullOrWhiteSpace(era))
        {
            resolvedEra = ConversionEras.PostConversion;
            failureResult = null;
            return true;
        }

        var trimmed = era.Trim();
        if (!ValidEraValues.Contains(trimmed))
        {
            _logger.LogWarning(
                "[SalesReviewQueue] invalid era token: {Era}", trimmed);
            resolvedEra = string.Empty;
            failureResult = BadRequest(new
            {
                error = "invalid era",
                validValues = ValidEraValues,
            });
            return false;
        }

        resolvedEra = trimmed;
        failureResult = null;
        return true;
    }

    private bool TryResolveCounty(out Guid countyId, out IActionResult? failureResult)
    {
        var raw = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(raw) || !Guid.TryParse(raw, out countyId))
        {
            _logger.LogWarning(
                "[SalesReviewQueue] missing or invalid countyId claim; refusing.");
            countyId = Guid.Empty;
            failureResult = Forbid();
            return false;
        }

        failureResult = null;
        return true;
    }
}

/// <summary>
/// Slice F2 response envelope. The shape echoes the resolved
/// query parameters so the operator dashboard panel can render
/// "showing N sales reviewed in last X years (era=...)" without a
/// second round-trip.
/// </summary>
public sealed record SalesReviewQueueResponse
{
    public required Guid CountyId { get; init; }
    public required int LookbackYears { get; init; }
    public required string Era { get; init; }
    public required int MaxResults { get; init; }
    public required int Count { get; init; }
    public required IReadOnlyList<SalesReviewItem> Items { get; init; }
}
