using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Sync.PacsSaleRegression;

namespace TerraFusion.Data.Services.Regression;

/// <summary>
/// Slice S5: dual-flavor regression queries. The PACS flavor mirrors
/// the operator's working SQL against
/// <c>legacy_pacs_raw.sale</c> joined to
/// <c>legacy_pacs_raw.prop_supp_assoc</c>; the canonical flavor
/// reads <c>canonical_tf.tf_sale</c> directly.
///
/// <para>Single-county scope by parameter — the PACS flavor doesn't
/// know about counties (raw data is county-agnostic), so we narrow
/// it to the county under test by joining through
/// <c>canonical_tf.tf_parcel</c> via <c>sync_bridge.source_xref</c>.
/// In a real ratio-study run, the operator would scope by
/// neighborhood or property class instead; the contract here is
/// "same fixture, same answer" not "identical SQL form."</para>
///
/// <para>Cutover constant: <c>2018-01-01 UTC</c>. Pre-cutover rows
/// are excluded by both flavors per the doctrine.</para>
/// </summary>
public sealed class OperatorSalesRegressionService : IOperatorSalesRegressionService
{
    /// <summary>
    /// 2017 cutover boundary. Mirrors the constant in
    /// <see cref="TerraFusion.Data.Services.LegacyPacsRaw.PacsSaleLandingService"/>.
    /// </summary>
    private static readonly DateTime CutoverUtc =
        new(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private const string ValidSaleCode = "100";

    private readonly TerraFusionDbContext _db;

    public OperatorSalesRegressionService(TerraFusionDbContext db) => _db = db;

    // ── Q1: count ──────────────────────────────────────────────────

    public async Task<int> ValidSaleCountPacsAsync(
        Guid countyId, CancellationToken ct = default)
    {
        var rows = await PacsScopedRowsAsync(countyId, ct).ConfigureAwait(false);
        return rows.Count(r => r.SaleDt >= CutoverUtc);
    }

    public async Task<int> ValidSaleCountCanonicalAsync(
        Guid countyId, CancellationToken ct = default)
    {
        return await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt >= CutoverUtc)
            .CountAsync(ct)
            .ConfigureAwait(false);
    }

    // ── Q2: histogram by year ──────────────────────────────────────

    public async Task<IReadOnlyDictionary<int, int>> ValidSalesByYearPacsAsync(
        Guid countyId, CancellationToken ct = default)
    {
        var rows = await PacsScopedRowsAsync(countyId, ct).ConfigureAwait(false);
        return rows
            .Where(r => r.SaleDt >= CutoverUtc)
            .GroupBy(r => r.SaleDt!.Value.ToUniversalTime().Year)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<IReadOnlyDictionary<int, int>> ValidSalesByYearCanonicalAsync(
        Guid countyId, CancellationToken ct = default)
    {
        var raw = await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt >= CutoverUtc)
            .Select(s => s.SlDt)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return raw
            .Where(d => d.HasValue)
            .GroupBy(d => d!.Value.ToUniversalTime().Year)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    // ── Q3: aggregate price ────────────────────────────────────────

    public async Task<RegressionPriceAggregate> ValidSalePriceAggregatePacsAsync(
        Guid countyId, CancellationToken ct = default)
    {
        var rows = await PacsScopedRowsAsync(countyId, ct).ConfigureAwait(false);
        var priced = rows
            .Where(r => r.SaleDt >= CutoverUtc && r.SalePrice != null)
            .ToList();

        return new RegressionPriceAggregate
        {
            Count = priced.Count,
            TotalPrice = priced.Count == 0 ? null : priced.Sum(r => r.SalePrice!.Value),
            AveragePrice = priced.Count == 0 ? null : priced.Average(r => r.SalePrice!.Value),
        };
    }

    public async Task<RegressionPriceAggregate> ValidSalePriceAggregateCanonicalAsync(
        Guid countyId, CancellationToken ct = default)
    {
        var raw = await _db.TfSales
            .AsNoTracking()
            .Where(s => s.CountyId == countyId
                        && s.SaleQualified
                        && s.SlDt >= CutoverUtc
                        && s.SlPrice != null)
            .Select(s => s.SlPrice!.Value)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return new RegressionPriceAggregate
        {
            Count = raw.Count,
            TotalPrice = raw.Count == 0 ? null : raw.Sum(),
            AveragePrice = raw.Count == 0 ? null : raw.Average(),
        };
    }

    // ── Helpers ────────────────────────────────────────────────────

    /// <summary>
    /// Mirrors the PACS supp-aware-and-qualification-filtered query.
    /// Joins raw_pacs.sale → raw_pacs.prop_supp_assoc on
    /// (prop_id, prop_val_yr, sup_num); filters
    /// <c>sl_county_ratio_cd = '100'</c>; scopes to <paramref name="countyId"/>
    /// by resolving the parcel xref (because raw rows have no
    /// CountyId column).
    /// </summary>
    private async Task<IReadOnlyList<PacsRowProjection>> PacsScopedRowsAsync(
        Guid countyId, CancellationToken ct)
    {
        // Build the prop-supp-assoc index for "active supp pointer."
        // For regression purposes, take the latest landed row per
        // (PropId, PropValYr) — same shape S2-B uses.
        var suppRows = await _db.LegacyPacsRawPropSuppAssocs
            .AsNoTracking()
            .ToListAsync(ct).ConfigureAwait(false);
        var suppIndex = suppRows
            .GroupBy(p => (p.PropId, p.PropValYr))
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(r => r.LandedAt).First().SupNum);

        // Build the prop_id → countyId index from parcel xrefs (this
        // is how raw rows get scoped to the county under test).
        var parcelXrefs = await _db.SyncBridgeSourceXrefs
            .AsNoTracking()
            .Where(x => x.TfEntityType == "parcel" && x.IsActive)
            .ToListAsync(ct).ConfigureAwait(false);

        var parcelIds = parcelXrefs.Select(x => x.TfEntityId).ToHashSet();
        var parcels = await _db.TfParcels
            .AsNoTracking()
            .Where(p => parcelIds.Contains(p.TfParcelId))
            .ToDictionaryAsync(p => p.TfParcelId, ct)
            .ConfigureAwait(false);

        var propIdToCounty = new Dictionary<int, Guid>();
        foreach (var x in parcelXrefs)
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(x.SourceKeyJson);
                if (doc.RootElement.TryGetProperty("prop_id", out var el)
                    && el.TryGetInt32(out var pid)
                    && parcels.TryGetValue(x.TfEntityId, out var parcel)
                    && !propIdToCounty.ContainsKey(pid))
                {
                    propIdToCounty[pid] = parcel.CountyId;
                }
            }
            catch (System.Text.Json.JsonException) { /* skip malformed lineage */ }
        }

        // Sale + supp-aware join + qualification filter + county scope.
        var saleRows = await _db.LegacyPacsRawSales
            .AsNoTracking()
            .Where(s => s.SlCountyRatioCd == ValidSaleCode)
            .ToListAsync(ct).ConfigureAwait(false);

        var result = new List<PacsRowProjection>(saleRows.Count);
        foreach (var s in saleRows)
        {
            // Supp-aware join.
            if (!suppIndex.TryGetValue((s.PropId, s.PropValYr), out var activeSup))
                continue;
            if (activeSup != s.SupNum)
                continue;

            // County scope.
            if (!propIdToCounty.TryGetValue(s.PropId, out var county))
                continue;
            if (county != countyId)
                continue;

            result.Add(new PacsRowProjection(s.SlDt, s.SlPrice));
        }
        return result;
    }

    private sealed record PacsRowProjection(DateTime? SaleDt, decimal? SalePrice);
}
