using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ILogger = Microsoft.Extensions.Logging.ILogger;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Seeds;

/// <summary>
/// Phase 7 of the PACS seed pipeline.
/// Transforms Pacs* mirror rows (raw Harris PACS data) into canonical
/// TerraFusion domain entities owned by the OS — NOT by PACS.
///
/// This is BOUNDARY REPAIR, not assessor workflow parity.
/// It fixes the pipe. Actual workflow parity is achieved in CP-4/5/6.
///
/// BOUNDARY RULE (enforced here):
///   - This class reads from Pacs* DbSets. No other service may read Pacs* tables.
///   - All downstream services must read canonical entities only.
///
/// Idempotent: safe to re-run after a full PacsDataSeeder execution.
///   - Properties: upsert by ParcelId (GeoId string)
///   - ValuationRecords: delete all Status="draft" records, insert fresh from PacsValuations
///   - ComparableSales: delete all, insert fresh from PacsSales
///   - CamaCharacteristics: delete all, insert fresh from PacsImprovements
/// </summary>
public sealed class PacsCanonicalizer
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger _logger;
    private const int BatchSize = 500;

    public PacsCanonicalizer(TerraFusionDbContext db, ILogger logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<CanonicalizeResult> CanonicalizeAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("[PacsCanonicalizer] Starting canonicalization pass. This is boundary repair — plumbing, not parity.");

        var properties = await CanonicalizePropertiesAsync(ct);
        var valuations = await CanonicalizeValuationRecordsAsync(ct);
        var sales = await CanonicalizeComparableSalesAsync(ct);
        var cama = await CanonicalizeCamaCharacteristicsAsync(ct);

        var result = new CanonicalizeResult
        {
            Properties = properties,
            ValuationRecords = valuations,
            ComparableSales = sales,
            CamaCharacteristics = cama
        };

        _logger.LogInformation(
            "[PacsCanonicalizer] Complete. {Result}",
            result);

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: PacsParcel + PacsSitus (primary) + PacsOwner (latest year)
    //         + PacsValuation (latest, SupNum=0) → canonical Property
    //
    // Upsert by GeoId string (canonical ParcelId). Properties are keyed by
    // county parcel number — GeoId is the authoritative county parcel number.
    // ─────────────────────────────────────────────────────────────────────────
    private async Task<int> CanonicalizePropertiesAsync(CancellationToken ct)
    {
        _logger.LogInformation("[PacsCanonicalizer] Step 1: Properties...");

        // Load all Pacs parcel stubs — these are small, ~9MB for 89K rows
        var pacsStubs = await _db.PacsParcel
            .Select(p => new
            {
                p.Id,
                GeoId = p.GeoId ?? p.SimpleGeoId,
                PropIdStr = p.PropId.ToString(),
                p.CountyId,
                p.PropTypeCd
            })
            .ToListAsync(ct);

        var total = 0;

        foreach (var batch in pacsStubs.Chunk(BatchSize))
        {
            var batchIds = batch.Select(p => p.Id).ToHashSet();
            var batchGeoIds = batch
                .Select(p => p.GeoId)
                .Where(g => !string.IsNullOrEmpty(g))
                .ToList()!;

            // ── Load supporting data for this batch ──────────────────────

            // Primary situs display address
            var situsMap = await _db.PacsSituses
                .Where(s => batchIds.Contains(s.ParcelId) && s.PrimaryFlag == "Y")
                .GroupBy(s => s.ParcelId)
                .Select(g => new { ParcelId = g.Key, Display = g.First().SitusDisplay })
                .ToDictionaryAsync(x => x.ParcelId, x => x.Display, ct);

            // Latest owner name per parcel
            var ownerMap = await _db.PacsOwners
                .Where(o => batchIds.Contains(o.ParcelId))
                .GroupBy(o => o.ParcelId)
                .Select(g => new
                {
                    ParcelId = g.Key,
                    Name = g.OrderByDescending(o => o.OwnerTaxYear).First().FileAsName
                })
                .ToDictionaryAsync(x => x.ParcelId, x => x.Name, ct);

            // Latest base-roll valuation for aggregate values
            var valMap = await _db.PacsValuations
                .Where(v => batchIds.Contains(v.ParcelId) && v.SupNum == 0)
                .GroupBy(v => v.ParcelId)
                .Select(g => new
                {
                    ParcelId = g.Key,
                    Year = g.Max(v => v.PropValYear),
                    Market = g.OrderByDescending(v => v.PropValYear)
                        .Select(v => v.MktapprMarket)
                        .FirstOrDefault()
                })
                .ToDictionaryAsync(x => x.ParcelId, x => x, ct);

            // Land value sum (latest year)
            var landValMap = await _db.PacsLandDetails
                .Where(l => batchIds.Contains(l.ParcelId) && l.SupNum == 0)
                .GroupBy(l => new { l.ParcelId, l.PropValYear })
                .Select(g => new
                {
                    g.Key.ParcelId,
                    g.Key.PropValYear,
                    Total = g.Sum(l => (decimal?)(l.LandSegMktVal ?? 0)) ?? 0m
                })
                .GroupBy(x => x.ParcelId)
                .Select(g => new
                {
                    ParcelId = g.Key,
                    Total = g.OrderByDescending(x => x.PropValYear).First().Total
                })
                .ToDictionaryAsync(x => x.ParcelId, x => x.Total, ct);

            // Improvement value sum (latest year)
            var imprvValMap = await _db.PacsImprovements
                .Where(i => batchIds.Contains(i.ParcelId) && i.SupNum == 0)
                .GroupBy(i => new { i.ParcelId, i.PropValYear })
                .Select(g => new
                {
                    g.Key.ParcelId,
                    g.Key.PropValYear,
                    Total = g.Sum(i => (decimal?)(i.MktapprVal ?? 0)) ?? 0m
                })
                .GroupBy(x => x.ParcelId)
                .Select(g => new
                {
                    ParcelId = g.Key,
                    Total = g.OrderByDescending(x => x.PropValYear).First().Total
                })
                .ToDictionaryAsync(x => x.ParcelId, x => x.Total, ct);

            // Load existing Properties for this batch (upsert target)
            var existingProps = await _db.Properties
                .Where(p => batchGeoIds.Contains(p.ParcelId))
                .ToDictionaryAsync(p => p.ParcelId, p => p, ct);

            // ── Upsert each parcel in the batch ──────────────────────────
            foreach (var stub in batch)
            {
                if (string.IsNullOrEmpty(stub.GeoId)) continue;

                valMap.TryGetValue(stub.Id, out var val);
                situsMap.TryGetValue(stub.Id, out var address);
                ownerMap.TryGetValue(stub.Id, out var ownerName);
                landValMap.TryGetValue(stub.Id, out var landVal);
                imprvValMap.TryGetValue(stub.Id, out var imprvVal);

                var marketValue = val?.Market ?? 0m;
                var taxYear = val?.Year ?? DateTime.UtcNow.Year;
                var addressStr = address ?? "Address not available";

                if (existingProps.TryGetValue(stub.GeoId, out var existing))
                {
                    // Update — PACS is authoritative for these fields during transition
                    existing.PropertyId       = stub.PropIdStr;
                    existing.ParcelNumber     = stub.GeoId;
                    existing.Address          = addressStr;
                    existing.OwnerName        = ownerName;
                    existing.PropertyType     = stub.PropTypeCd;
                    existing.MarketValue      = marketValue;
                    existing.LandValue        = landVal;
                    existing.ImprovementValue = imprvVal;
                    // WA State: assessed value = 100% of market value for most property types
                    existing.AssessedValue    = marketValue;
                    existing.TaxYear          = taxYear;
                    existing.CountyId         = stub.CountyId;
                    existing.LastUpdated      = DateTime.UtcNow;
                    existing.UpdatedAt        = DateTime.UtcNow;
                }
                else
                {
                    var property = new Property
                    {
                        Id              = Guid.NewGuid(),
                        PropertyId      = stub.PropIdStr,
                        ParcelId        = stub.GeoId,
                        ParcelNumber    = stub.GeoId,
                        Address         = addressStr,
                        OwnerName       = ownerName,
                        PropertyType    = stub.PropTypeCd,
                        MarketValue     = marketValue,
                        LandValue       = landVal,
                        ImprovementValue = imprvVal,
                        AssessedValue   = marketValue,
                        TaxYear         = taxYear,
                        AssessmentDate  = DateTime.UtcNow,
                        LastUpdated     = DateTime.UtcNow,
                        CountyId        = stub.CountyId,
                        CreatedAt       = DateTime.UtcNow,
                        UpdatedAt       = DateTime.UtcNow
                    };
                    _db.Properties.Add(property);
                }

                total++;
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogDebug("[PacsCanonicalizer] Properties: {Done}/{Total}", total, pacsStubs.Count);
        }

        _logger.LogInformation("[PacsCanonicalizer] Properties: {Count} upserted.", total);
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: PacsValuation (SupNum=0) → canonical ValuationRecord (Status="draft")
    //
    // Delete all existing "draft" ValuationRecords, then insert fresh from PACS.
    // Records with Status="reviewed" or "sealed" are untouched — these are
    // assessor-authored and must not be overwritten by canonicalization.
    // ─────────────────────────────────────────────────────────────────────────
    private async Task<int> CanonicalizeValuationRecordsAsync(CancellationToken ct)
    {
        _logger.LogInformation("[PacsCanonicalizer] Step 2: ValuationRecords...");

        // Clear all draft records — safe because reviewed/sealed are not touched
        var deleted = await _db.ValuationRecords
            .Where(vr => vr.Status == "draft")
            .ExecuteDeleteAsync(ct);

        _logger.LogDebug("[PacsCanonicalizer] Cleared {N} draft ValuationRecords.", deleted);

        // Build parcel lookup: Guid → (GeoId, CountyId, PropTypeCd)
        var parcelMap = await _db.PacsParcel
            .Where(p => p.GeoId != null || p.SimpleGeoId != null)
            .Select(p => new
            {
                p.Id,
                GeoId = p.GeoId ?? p.SimpleGeoId,
                p.CountyId,
                p.PropTypeCd
            })
            .ToDictionaryAsync(p => p.Id, p => p!, ct);

        // Load base-roll valuations
        var valuations = await _db.PacsValuations
            .Where(v => v.SupNum == 0)
            .Select(v => new
            {
                v.ParcelId,
                v.PropValYear,
                v.CostValue,
                v.CostMarket,
                v.IncomeValue,
                v.IncomeMarket,
                v.MktapprMarket,
                v.RegionCode
            })
            .ToListAsync(ct);

        var total = 0;

        foreach (var batch in valuations.Chunk(BatchSize))
        {
            foreach (var pv in batch)
            {
                if (!parcelMap.TryGetValue(pv.ParcelId, out var parcelInfo)) continue;

                var costVal  = pv.CostMarket  ?? pv.CostValue  ?? 0m;
                var incomeVal = pv.IncomeMarket ?? pv.IncomeValue ?? 0m;
                var salesVal  = pv.MktapprMarket ?? 0m;

                _db.ValuationRecords.Add(new ValuationRecord
                {
                    Id                   = Guid.NewGuid(),
                    ParcelId             = parcelInfo.GeoId!,
                    TaxYear              = pv.PropValYear,
                    PropertyType         = parcelInfo.PropTypeCd ?? "residential",
                    CostApproachValue    = costVal > 0    ? costVal    : null,
                    IncomeApproachValue  = incomeVal > 0  ? incomeVal  : null,
                    SalesComparisonValue = salesVal > 0   ? salesVal   : null,
                    Region               = pv.RegionCode,
                    Status               = "draft",
                    CountyId             = parcelInfo.CountyId,
                    CreatedBy            = "pacs-canonicalizer",
                    CreatedAt            = DateTime.UtcNow
                });

                total++;
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogDebug("[PacsCanonicalizer] ValuationRecords: {Done}/{Total}", total, valuations.Count);
        }

        _logger.LogInformation("[PacsCanonicalizer] ValuationRecords: {Count} inserted.", total);
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: PacsSale → canonical ComparableSale
    //
    // Delete all existing ComparableSales, then insert fresh from PACS.
    // ComparableSales are raw PACS source facts — no assessor-authored content.
    // ─────────────────────────────────────────────────────────────────────────
    private async Task<int> CanonicalizeComparableSalesAsync(CancellationToken ct)
    {
        _logger.LogInformation("[PacsCanonicalizer] Step 3: ComparableSales...");

        await _db.ComparableSales.ExecuteDeleteAsync(ct);

        // Build parcel lookup
        var parcelMap = await _db.PacsParcel
            .Where(p => p.GeoId != null || p.SimpleGeoId != null)
            .Select(p => new
            {
                p.Id,
                GeoId = p.GeoId ?? p.SimpleGeoId,
                p.CountyId,
                p.PropTypeCd
            })
            .ToDictionaryAsync(p => p.Id, p => p!, ct);

        // Primary situs display address per parcel
        var addressMap = await _db.PacsSituses
            .Where(s => s.PrimaryFlag == "Y")
            .GroupBy(s => s.ParcelId)
            .Select(g => new { ParcelId = g.Key, Display = g.First().SitusDisplay })
            .ToDictionaryAsync(x => x.ParcelId, x => x.Display, ct);

        // Load valid sales
        var sales = await _db.PacsSales
            .Where(s => s.SaleDate != null && (s.SalePrice > 0 || s.AdjustedSalePrice > 0))
            .Select(s => new
            {
                s.ParcelId,
                s.SaleDate,
                s.SalePrice,
                s.AdjustedSalePrice,
                s.SaleQualifier,
                s.SlLivingArea,
                s.SlLandSqft,
                s.SlYearBuilt
            })
            .ToListAsync(ct);

        var total = 0;

        foreach (var batch in sales.Chunk(BatchSize))
        {
            foreach (var ps in batch)
            {
                if (!parcelMap.TryGetValue(ps.ParcelId, out var parcelInfo)) continue;
                if (!ps.SaleDate.HasValue) continue;

                addressMap.TryGetValue(ps.ParcelId, out var address);

                var price = ps.AdjustedSalePrice > 0 ? ps.AdjustedSalePrice!.Value : (ps.SalePrice ?? 0m);

                _db.ComparableSales.Add(new ComparableSale
                {
                    Id                = Guid.NewGuid(),
                    ParcelId          = parcelInfo.GeoId!,
                    SaleDate          = ps.SaleDate.Value,
                    SalePrice         = price,
                    PropertyType      = parcelInfo.PropTypeCd ?? "residential",
                    Address           = address,
                    GrossLivingArea   = ps.SlLivingArea.HasValue ? (decimal?)ps.SlLivingArea.Value : null,
                    LotSizeSqft       = ps.SlLandSqft.HasValue ? (decimal?)ps.SlLandSqft.Value : null,
                    YearBuilt         = ps.SlYearBuilt.HasValue ? (int?)ps.SlYearBuilt.Value : null,
                    SaleQualification = NormalizeSaleQualification(ps.SaleQualifier),
                    IsVerified        = false,
                    CountyId          = parcelInfo.CountyId
                });

                total++;
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogDebug("[PacsCanonicalizer] ComparableSales: {Done}/{Total}", total, sales.Count);
        }

        _logger.LogInformation("[PacsCanonicalizer] ComparableSales: {Count} inserted.", total);
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: PacsImprovement (primary, SupNum=0) + PacsImprovementDetail (area)
    //         + PacsLandDetail (land sqft) → canonical CamaCharacteristic
    //
    // Delete all existing CamaCharacteristics, then insert fresh from PACS.
    // CamaCharacteristics are purely derived from PACS source facts.
    // ─────────────────────────────────────────────────────────────────────────
    private async Task<int> CanonicalizeCamaCharacteristicsAsync(CancellationToken ct)
    {
        _logger.LogInformation("[PacsCanonicalizer] Step 4: CamaCharacteristics...");

        await _db.CamaCharacteristics.ExecuteDeleteAsync(ct);

        // Build parcel lookup
        var parcelMap = await _db.PacsParcel
            .Where(p => p.GeoId != null || p.SimpleGeoId != null)
            .Select(p => new
            {
                p.Id,
                GeoId = p.GeoId ?? p.SimpleGeoId,
                p.CountyId
            })
            .ToDictionaryAsync(p => p.Id, p => p!, ct);

        // Load base-roll primary improvements
        var improvements = await _db.PacsImprovements
            .Where(i => i.SupNum == 0 && i.PrimaryImprv == "Y")
            .Select(i => new
            {
                i.Id,
                i.ParcelId,
                i.PropValYear,
                i.ImprvTypeCode,
                i.ActualYearBuilt,
                i.EffectiveYearBuilt,
                i.FunctionalPct,
                i.EconomicPct
            })
            .ToListAsync(ct);

        var total = 0;

        foreach (var batch in improvements.Chunk(BatchSize))
        {
            var batchImprvIds = batch.Select(i => i.Id).ToHashSet();
            var batchParcelIds = batch.Select(i => i.ParcelId).ToHashSet();

            // Aggregate improvement detail areas for this batch
            var detailMap = await _db.PacsImprovementDetails
                .Where(d => batchImprvIds.Contains(d.ImprovementId) && d.SupNum == 0)
                .GroupBy(d => d.ImprovementId)
                .Select(g => new
                {
                    ImprovementId  = g.Key,
                    TotalArea      = g.Sum(d => d.ImprvDetArea ?? 0m),
                    // Use the largest detail segment for quality/condition (main area)
                    ConditionCode  = g.OrderByDescending(d => d.ImprvDetArea).Select(d => d.ConditionCode).FirstOrDefault(),
                    QualityGrade   = g.OrderByDescending(d => d.ImprvDetArea).Select(d => d.ImprvDetSubClassCd).FirstOrDefault(),
                    YearBuilt      = g.OrderByDescending(d => d.ImprvDetArea).Select(d => d.YearBuilt).FirstOrDefault(),
                    PhysicalPct    = g.OrderByDescending(d => d.ImprvDetArea).Select(d => d.PhysicalPct).FirstOrDefault()
                })
                .ToDictionaryAsync(x => x.ImprovementId, x => x, ct);

            // Land area sums for this batch (latest year)
            var landMap = await _db.PacsLandDetails
                .Where(l => batchParcelIds.Contains(l.ParcelId) && l.SupNum == 0)
                .GroupBy(l => new { l.ParcelId, l.PropValYear })
                .Select(g => new
                {
                    g.Key.ParcelId,
                    g.Key.PropValYear,
                    TotalSqft = g.Sum(l => l.SizeSquareFeet ?? 0m)
                })
                .GroupBy(x => x.ParcelId)
                .Select(g => new
                {
                    ParcelId  = g.Key,
                    TotalSqft = g.OrderByDescending(x => x.PropValYear).First().TotalSqft
                })
                .ToDictionaryAsync(x => x.ParcelId, x => x.TotalSqft, ct);

            foreach (var imprv in batch)
            {
                if (!parcelMap.TryGetValue(imprv.ParcelId, out var parcelInfo)) continue;

                detailMap.TryGetValue(imprv.Id, out var detail);
                landMap.TryGetValue(imprv.ParcelId, out var landSqft);

                var sqft     = detail?.TotalArea ?? 0m;
                var yearBuilt = detail?.YearBuilt.HasValue == true
                    ? (int?)detail.YearBuilt.Value
                    : imprv.ActualYearBuilt.HasValue
                        ? (int?)imprv.ActualYearBuilt.Value
                        : null;

                // Effective age = current year minus effective year built
                int? effectiveAge = null;
                if (imprv.EffectiveYearBuilt.HasValue)
                    effectiveAge = DateTime.UtcNow.Year - (int)imprv.EffectiveYearBuilt.Value;
                else if (yearBuilt.HasValue)
                    effectiveAge = DateTime.UtcNow.Year - yearBuilt.Value;

                _db.CamaCharacteristics.Add(new CamaCharacteristic
                {
                    Id                    = Guid.NewGuid(),
                    ParcelId              = parcelInfo.GeoId!,
                    TaxYear               = imprv.PropValYear,
                    BuildingType          = imprv.ImprvTypeCode ?? "UNK",
                    SquareFeet            = sqft,
                    YearBuilt             = yearBuilt,
                    EffectiveAge          = effectiveAge,
                    LandAreaSqft          = landSqft > 0 ? landSqft : null,
                    ConditionGrade        = detail?.ConditionCode,
                    QualityGrade          = detail?.QualityGrade,
                    FunctionalObsolescence = imprv.FunctionalPct ?? (decimal?)detail?.PhysicalPct,
                    ExternalObsolescence  = (decimal?)imprv.EconomicPct,
                    CountyId              = parcelInfo.CountyId,
                    UpdatedAt             = DateTime.UtcNow
                });

                total++;
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogDebug("[PacsCanonicalizer] CamaCharacteristics: {Done}/{Total}", total, improvements.Count);
        }

        _logger.LogInformation("[PacsCanonicalizer] CamaCharacteristics: {Count} inserted.", total);
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static string NormalizeSaleQualification(string? pacsCode)
    {
        return pacsCode?.ToUpperInvariant() switch
        {
            "Q"  or "1" or "VALID"                   => "qualified",
            "E"  or "FC" or "FORECLOSURE"             => "foreclosure",
            "A"  or "ESTATE" or "EST"                 => "estate",
            _ when pacsCode != null                   => "non-arms-length",
            _                                         => "non-arms-length"
        };
    }
}

// ── Result DTO ────────────────────────────────────────────────────────────────

public sealed record CanonicalizeResult
{
    public int Properties          { get; init; }
    public int ValuationRecords    { get; init; }
    public int ComparableSales     { get; init; }
    public int CamaCharacteristics { get; init; }

    public override string ToString() =>
        $"Properties={Properties} ValuationRecords={ValuationRecords} " +
        $"ComparableSales={ComparableSales} CamaCharacteristics={CamaCharacteristics}";
}
