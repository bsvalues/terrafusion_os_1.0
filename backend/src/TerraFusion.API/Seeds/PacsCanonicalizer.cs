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
    private readonly TerraFusion.API.Services.ISaleQualificationService _qualifier;
    private const int BatchSize = 500;

    public PacsCanonicalizer(TerraFusionDbContext db, ILogger logger, TerraFusion.API.Services.ISaleQualificationService? qualifier = null)
    {
        _db = db;
        _logger = logger;
        _qualifier = qualifier ?? new TerraFusion.API.Services.SaleQualificationService();
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

    /// <summary>Re-run only Step 4 (CamaCharacteristics). Fast path for cost-field schema updates.</summary>
    public async Task<int> CanonicalizeCamaOnlyAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("[PacsCanonicalizer] CAMA-ONLY pass (Step 4 only — cost fields refresh).");
        var cama = await CanonicalizeCamaCharacteristicsAsync(ct);
        _logger.LogInformation("[PacsCanonicalizer] CAMA-ONLY complete. CamaCharacteristics={Count}", cama);
        return cama;
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
        var rawStubs = await _db.PacsParcel
            .Select(p => new
            {
                p.Id,
                GeoId = p.GeoId ?? p.SimpleGeoId,
                PropId = p.PropId,
                PropIdStr = p.PropId.ToString(),
                p.CountyId,
                p.PropTypeCd
            })
            .ToListAsync(ct);

        // Deduplicate by GeoId — PacsParcel may contain re-seeded rows with different
        // Guids but the same GeoId (county parcel number). Keep the row with the highest
        // PropId (most authoritative PACS integer key). Without this, same-batch
        // duplicates cause unique constraint violations on Properties.ParcelId.
        var pacsStubs = rawStubs
            .Where(p => !string.IsNullOrEmpty(p.GeoId))
            .GroupBy(p => p.GeoId)
            .Select(g => g.OrderByDescending(p => p.PropId).First())
            .ToList();

        var total = 0;

        // ── Bulk-load ALL supporting data at once — avoids 256+ per-batch round-trips ──

        // Primary situs display address (all parcels)
        var allSitusMap = await _db.PacsSituses
            .Where(s => s.PrimaryFlag == "Y")
            .GroupBy(s => s.ParcelId)
            .Select(g => new { ParcelId = g.Key, Display = g.First().SitusDisplay })
            .ToDictionaryAsync(x => x.ParcelId, x => x.Display, ct);

        // Latest owner per parcel — SQLite: OwnerTaxYear is decimal, evaluate first
        var allOwnerRaw = await _db.PacsOwners
            .Select(o => new { o.ParcelId, o.OwnerTaxYear, o.FileAsName })
            .ToListAsync(ct);
        var allOwnerMap = allOwnerRaw
            .GroupBy(o => o.ParcelId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(o => o.OwnerTaxYear).First().FileAsName);

        // Latest base-roll valuation — SQLite: decimal, evaluate first
        var allValRaw = await _db.PacsValuations
            .Where(v => v.SupNum == 0)
            .Select(v => new { v.ParcelId, v.PropValYear, v.MktapprMarket })
            .ToListAsync(ct);
        var allValMap = allValRaw
            .GroupBy(v => v.ParcelId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var best = g.OrderByDescending(v => v.PropValYear).First();
                    return new { ParcelId = g.Key, Year = best.PropValYear, Market = best.MktapprMarket };
                });

        // Land value sum (latest year) — SQLite: decimal, evaluate first
        var allLandValRaw = await _db.PacsLandDetails
            .Where(l => l.SupNum == 0)
            .Select(l => new { l.ParcelId, l.PropValYear, l.LandSegMktVal })
            .ToListAsync(ct);
        var allLandValMap = allLandValRaw
            .GroupBy(l => l.ParcelId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var maxYear = g.Max(x => x.PropValYear);
                    return g.Where(x => x.PropValYear == maxYear).Sum(x => x.LandSegMktVal ?? 0m);
                });

        // Improvement value sum (latest year) — SQLite: decimal, evaluate first
        var allImprvValRaw = await _db.PacsImprovements
            .Where(i => i.SupNum == 0)
            .Select(i => new { i.ParcelId, i.PropValYear, i.MktapprVal })
            .ToListAsync(ct);
        var allImprvValMap = allImprvValRaw
            .GroupBy(i => i.ParcelId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var maxYear = g.Max(x => x.PropValYear);
                    return g.Where(x => x.PropValYear == maxYear).Sum(x => x.MktapprVal ?? 0m);
                });

        // All existing Properties (upsert target) — AsNoTracking to avoid tracking 128k entities
        var allExistingProps = await _db.Properties
            .AsNoTracking()
            .ToDictionaryAsync(p => p.ParcelId, p => p, ct);

        foreach (var batch in pacsStubs.Chunk(BatchSize))
        {
            // ── Upsert each parcel in the batch ──────────────────────────
            foreach (var stub in batch)
            {
                if (string.IsNullOrEmpty(stub.GeoId)) continue;

                allValMap.TryGetValue(stub.Id, out var val);
                allSitusMap.TryGetValue(stub.Id, out var address);
                allOwnerMap.TryGetValue(stub.Id, out var ownerName);
                allLandValMap.TryGetValue(stub.Id, out var landVal);
                allImprvValMap.TryGetValue(stub.Id, out var imprvVal);

                var marketValue = val?.Market ?? 0m;
                var taxYear = val?.Year ?? DateTime.UtcNow.Year;
                var addressStr = address ?? "Address not available";

                if (allExistingProps.TryGetValue(stub.GeoId, out var existing))
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
                    existing.AssessedValue    = marketValue;
                    existing.TaxYear          = taxYear;
                    existing.CountyId         = stub.CountyId;
                    existing.LastUpdated      = DateTime.UtcNow;
                    existing.UpdatedAt        = DateTime.UtcNow;
                    _db.Properties.Update(existing); // explicit attach as Modified (AsNoTracking)
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
                    allExistingProps[stub.GeoId] = property; // prevent duplicate-key on subsequent batches
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

        // Build parcel lookup: PropId (int) → (GeoId, CountyId, PropTypeCd)
        // Using PropId avoids GUID mismatch when PacsParcel is re-seeded with new Guids
        // but pacs_valuations still references old Guids via ParcelId FK.
        // Deduplicate by PropId — PacsParcel may contain re-seeded duplicates.
        var parcelRaw2 = await _db.PacsParcel
            .Where(p => p.GeoId != null || p.SimpleGeoId != null)
            .Select(p => new
            {
                p.PropId,
                GeoId = p.GeoId ?? p.SimpleGeoId,
                p.CountyId,
                p.PropTypeCd
            })
            .ToListAsync(ct);
        var parcelMap = parcelRaw2
            .GroupBy(p => p.PropId)
            .ToDictionary(g => g.Key, g => g.First());

        // Load base-roll valuations — join via PacsPropId (stable int FK) not ParcelId (Guid)
        var valuations = await _db.PacsValuations
            .Where(v => v.SupNum == 0)
            .Select(v => new
            {
                v.PacsPropId,
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
                if (!parcelMap.TryGetValue(pv.PacsPropId, out var parcelInfo)) continue;

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

        // Neighborhood lookup — most recent base-roll year per parcel (SupNum=0, max PropValYear).
        // PacsValuation.NeighborhoodCode maps to hood_cd via [Column("hood_cd")] attribute.
        var hoodMap = await _db.PacsValuations
            .Where(v => v.SupNum == 0 && v.NeighborhoodCode != null)
            .GroupBy(v => v.ParcelId)
            .Select(g => new
            {
                ParcelId = g.Key,
                Hood = g.OrderByDescending(v => v.PropValYear).First().NeighborhoodCode,
            })
            .ToDictionaryAsync(x => x.ParcelId, x => x.Hood, ct);

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
                s.SaleCountyRatioCd,
                s.WacCd,
                s.SalesExcludeCalcCd,
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
                hoodMap.TryGetValue(ps.ParcelId, out var hood);

                var price = ps.AdjustedSalePrice > 0 ? ps.AdjustedSalePrice!.Value : (ps.SalePrice ?? 0m);

                // Raw PACS codes stored verbatim — never interpreted at this layer.
                // TerraFusion's SaleQualificationService owns the verdict.
                _db.ComparableSales.Add(new ComparableSale
                {
                    Id                  = Guid.NewGuid(),
                    ParcelId            = parcelInfo.GeoId!,
                    SaleDate            = ps.SaleDate.Value,
                    SalePrice           = price,
                    PropertyType        = parcelInfo.PropTypeCd ?? "residential",
                    Address             = address,
                    Neighborhood        = hood,
                    GrossLivingArea     = ps.SlLivingArea.HasValue ? (decimal?)ps.SlLivingArea.Value : null,
                    LotSizeSqft         = ps.SlLandSqft.HasValue ? (decimal?)ps.SlLandSqft.Value : null,
                    YearBuilt           = ps.SlYearBuilt.HasValue ? (int?)ps.SlYearBuilt.Value : null,
                    RawSaleQualifier    = ps.SaleQualifier,
                    RawCountyRatioCd    = ps.SaleCountyRatioCd,
                    RawExcludeCalcCd    = ps.SalesExcludeCalcCd,
                    RawWacCd            = ps.WacCd,
                    SaleQualification   = _qualifier.Qualify(ps.SaleQualifier, ps.SaleCountyRatioCd, ps.SalesExcludeCalcCd, ps.WacCd),
                    IsVerified          = false,
                    CountyId            = parcelInfo.CountyId
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
        await _db.CamaImprovementDetails.ExecuteDeleteAsync(ct);

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

        // Load base-roll improvements (SupNum=0; PrimaryImprv not reliably populated in all PACS exports)
        var improvements = await _db.PacsImprovements
            .Where(i => i.SupNum == 0)
            .Select(i => new
            {
                i.Id,
                i.ParcelId,
                i.PropValYear,
                i.ImprvTypeCode,
                i.ActualYearBuilt,
                i.EffectiveYearBuilt,
                i.ImprvVal,
                i.PhysicalPct,
                i.DepPct,
                i.FunctionalPct,
                i.EconomicPct
            })
            .ToListAsync(ct);

        // Load ALL detail and land data at once — avoid 280+ per-batch DB round-trips
        _logger.LogDebug("[PacsCanonicalizer] Loading all improvement details...");
        var allImprvIds = improvements.Select(i => i.Id).ToHashSet();
        var allParcelIds = improvements.Select(i => i.ParcelId).Distinct().ToHashSet();

        var allDetailRaw = await _db.PacsImprovementDetails
            .Where(d => d.SupNum == 0)
            .Select(d => new
            {
                d.ImprovementId,
                d.ImprvDetArea,
                d.ConditionCode,
                d.ImprvDetSubClassCd,
                d.ImprvDetClassCd,
                d.ImprvDetMethCd,
                d.ImprvDetTypeCd,
                d.ImprvDetDesc,
                d.UnitPrice,
                d.ImprvDetCalcVal,
                d.DepreciatedReplacementCostNew,
                d.YearBuilt,
                d.PhysicalPct,
                d.DepPct
            })
            .ToListAsync(ct);

        var allDetailMap = allDetailRaw
            .GroupBy(d => d.ImprovementId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var ordered = g.OrderByDescending(d => d.ImprvDetArea).ToList();
                    return new
                    {
                        TotalArea     = g.Sum(d => d.ImprvDetArea ?? 0m),
                        ConditionCode = ordered.Select(d => d.ConditionCode).FirstOrDefault(),
                        ClassCode     = ordered.Select(d => d.ImprvDetClassCd).FirstOrDefault(),
                        SubClassCd    = ordered.Select(d => d.ImprvDetSubClassCd).FirstOrDefault(),
                        YearBuilt     = ordered.Select(d => d.YearBuilt).FirstOrDefault(),
                        PhysicalPct   = ordered.Select(d => d.PhysicalPct).FirstOrDefault()
                    };
                });

        _logger.LogDebug("[PacsCanonicalizer] Loading all land sizes...");
        var allLandRaw = await _db.PacsLandDetails
            .Where(l => l.SupNum == 0)
            .Select(l => new { l.ParcelId, l.PropValYear, l.SizeSquareFeet })
            .ToListAsync(ct);

        var allLandMap = allLandRaw
            .GroupBy(l => l.ParcelId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var maxYear = g.Max(x => x.PropValYear);
                    return g.Where(x => x.PropValYear == maxYear).Sum(x => x.SizeSquareFeet ?? 0m);
                });

        // Segments grouped by ImprovementId — raw list used for CamaImprovementDetail inserts
        var allSegmentsByImprv = allDetailRaw
            .GroupBy(d => d.ImprovementId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Load all improvement attributes — maps AttributeCode / AttrUnit to physical fields
        _logger.LogDebug("[PacsCanonicalizer] Loading all improvement attributes...");
        var allAttributesRaw = await _db.PacsImprovementAttributes
            .Where(a => allImprvIds.Contains(a.ImprovementId))
            .Select(a => new { a.ImprovementId, a.AttributeCode, a.AttributeValue, a.AttrUnit })
            .ToListAsync(ct);

        var allAttrMap = allAttributesRaw
            .GroupBy(a => a.ImprovementId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var total = 0;

        // Deduplicate by (GeoId, PropValYear) — the unique index requires one row per parcel/year.
        // Must use GeoId (canonical string), NOT ParcelId (Guid), because multiple PacsParcel rows
        // may share the same GeoId but have different Guids (from multiple seeder runs).
        // Take the improvement with the largest total detail area as the "primary" building.
        var primaryImprovements = improvements
            .Select(i =>
            {
                parcelMap.TryGetValue(i.ParcelId, out var p);
                return new { Imprv = i, GeoId = p?.GeoId };
            })
            .Where(x => !string.IsNullOrEmpty(x.GeoId))
            .GroupBy(x => new { x.GeoId, x.Imprv.PropValYear })
            .Select(g => g.OrderByDescending(x =>
            {
                allDetailMap.TryGetValue(x.Imprv.Id, out var d);
                return d?.TotalArea ?? 0m;
            }).First().Imprv)
            .ToList();

        _logger.LogDebug("[PacsCanonicalizer] {Count} primary improvements after dedup (from {Raw} total).", primaryImprovements.Count, improvements.Count);

        foreach (var batch in primaryImprovements.Chunk(BatchSize))
        {
            foreach (var imprv in batch)
            {
                if (!parcelMap.TryGetValue(imprv.ParcelId, out var parcelInfo)) continue;
                if (string.IsNullOrEmpty(parcelInfo.GeoId)) continue;

                allDetailMap.TryGetValue(imprv.Id, out var detail);
                allLandMap.TryGetValue(imprv.ParcelId, out var landSqft);
                allAttrMap.TryGetValue(imprv.Id, out var attrList);
                attrList ??= new();

                // ── Attribute-to-physical-field mapping ───────────────────────────────
                string? foundation = attrList.FirstOrDefault(a =>
                    a.AttributeCode is "Crawl/Concrete Perimeter Piers" or "Slab"
                        or "Post & Pier" or "None/Dirt")?.AttributeCode;

                string? exteriorWall = attrList.FirstOrDefault(a =>
                    a.AttributeCode is "Alum siding" or "Vinyl" or "Brick" or "Brick Veneer"
                        or "Wood" or "Stucco" or "Stucco economy" or "Hardboard" or "Hardi-board"
                        or "Log" or "Log veneer or rustic" or "Concrete Block" or "Masonry Wall"
                        or "Metal" or "Metal - Low" or "Dryvit/EIFS" or "T 111 plywood"
                        or "Asbestos")?.AttributeCode;

                string? roofType = attrList.FirstOrDefault(a =>
                    a.AttributeCode is "Comp Shingle" or "Comp Shingle - Arch" or "Slate/Tile"
                        or "Metal" or "Built-Up" or "Tar & Gravel")?.AttributeCode;

                string? hvacType = attrList.FirstOrDefault(a =>
                    a.AttributeCode is "Heat pump" or "Heat Pump" or "Heat Pump, Ground Loop"
                        or "Forced Air Furnace" or "Central Warm Air" or "Central heat/cooling"
                        or "Baseboard" or "Electric baseboard" or "Electric, Cable or Baseboard"
                        or "Electric radiant" or "Electric, Radiant Panels" or "Evaporative Cooling"
                        or "Hot Water, Radiant" or "No HVAC" or "Package Unit" or "Space Heaters"
                        or "Space heater-elec" or "Warmed & Cooled Air"
                        or "Warmed & Cooled Air/Heat Pump")?.AttributeCode;

                int? fireplaces = (int?)(attrList.FirstOrDefault(a => a.AttributeCode == "FIREPLACE")?.AttrUnit);
                // Bedrooms: AttrCode="Count", AttrUnit=3; Bathrooms: AttrCode="Count", AttrUnit=2
                int? bedrooms  = (int?)(attrList.FirstOrDefault(a => a.AttributeCode == "Count" && a.AttrUnit == 3m)?.AttrUnit);
                int? bathrooms = (int?)(attrList.FirstOrDefault(a => a.AttributeCode == "Count" && a.AttrUnit == 2m)?.AttrUnit);

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
                    // Normalize PACS ClassCd (Avg, Good, EXC…) to Benton 1-6 canonical values
                    QualityGrade          = NormalizeQualityGrade(detail?.ClassCode),
                    // Sub-class "+" maps to ComplexityGrade=PLUS; "*" (standard) is omitted
                    ComplexityGrade       = detail?.SubClassCd == "+" ? "PLUS" : null,
                    // Physical characteristics from PACS improvement attributes
                    Foundation            = foundation,
                    ExteriorWall          = exteriorWall,
                    RoofType              = roofType,
                    HvacType              = hvacType,
                    Bedrooms              = bedrooms,
                    Bathrooms             = bathrooms,
                    Fireplaces            = fireplaces,
                    ImprvVal              = imprv.ImprvVal,
                    PhysicalDepreciationPct = imprv.PhysicalPct ?? detail?.PhysicalPct,
                    DepreciationPct       = imprv.DepPct,
                    // FunctionalPct and EconomicPct are PACS "percent good" values (0-100).
                    // Convert to dollar obsolescence amounts: $ = ImprvVal × (1 - pctGood/100).
                    // If percent-good = 100 → $0 obsolescence (no loss). If null → null (unknown).
                    FunctionalObsolescence = imprv.ImprvVal.HasValue && imprv.FunctionalPct.HasValue
                        ? Math.Round(imprv.ImprvVal.Value * (1m - imprv.FunctionalPct.Value / 100m), 2)
                        : null,
                    ExternalObsolescence  = imprv.ImprvVal.HasValue && imprv.EconomicPct.HasValue
                        ? Math.Round(imprv.ImprvVal.Value * (1m - imprv.EconomicPct.Value / 100m), 2)
                        : null,
                    CountyId              = parcelInfo.CountyId,
                    UpdatedAt             = DateTime.UtcNow
                });

                // Insert per-segment detail rows for CostForge matrix cost lookups
                if (allSegmentsByImprv.TryGetValue(imprv.Id, out var segments))
                {
                    foreach (var seg in segments)
                    {
                        _db.CamaImprovementDetails.Add(new CamaImprovementDetail
                        {
                            Id            = Guid.NewGuid(),
                            ParcelId      = parcelInfo.GeoId!,
                            TaxYear       = imprv.PropValYear,
                            SegmentType   = seg.ImprvDetTypeCd,
                            SegmentDesc   = seg.ImprvDetDesc,
                            MethodCode    = seg.ImprvDetMethCd,
                            ClassCode     = seg.ImprvDetClassCd,
                            SubClassCode  = seg.ImprvDetSubClassCd,
                            Area          = seg.ImprvDetArea,
                            UnitPrice     = seg.UnitPrice,
                            CalcValue     = seg.ImprvDetCalcVal,
                            DepreciatedRCN = seg.DepreciatedReplacementCostNew,
                            ConditionCode = seg.ConditionCode,
                            PhysicalPct   = seg.PhysicalPct,
                            DepPct        = seg.DepPct,
                            YearBuilt     = seg.YearBuilt.HasValue ? (int?)seg.YearBuilt.Value : null,
                            CountyId      = parcelInfo.CountyId,
                            UpdatedAt     = DateTime.UtcNow
                        });
                    }
                }

                total++;
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogDebug("[PacsCanonicalizer] CamaCharacteristics: {Done}/{Total}", total, primaryImprovements.Count);
        }

        _logger.LogInformation("[PacsCanonicalizer] CamaCharacteristics: {Count} inserted.", total);
        return total;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Normalize a PACS ImprvDetClassCd to the Benton 1-6 canonical quality tier names.
    /// Source: Benton County 2026 Calibration Technical Report + __new_quality.sql.
    ///   chp / low → ECONOMY  (tier 1)
    ///   fair      → FAIR     (tier 2)
    ///   avg       → AVERAGE  (tier 3)
    ///   good      → GOOD     (tier 4)
    ///   vgd       → VERY_GOOD (tier 5)
    ///   exc       → EXCELLENT (tier 6)
    /// Unrecognized codes are passed through unchanged so no data is silently lost.
    /// </summary>
    private static string? NormalizeQualityGrade(string? rawClassCd) =>
        rawClassCd?.Trim().ToLowerInvariant() switch
        {
            "chp" or "low"  => "ECONOMY",
            "fair"          => "FAIR",
            "avg"           => "AVERAGE",
            "good"          => "GOOD",
            "vgd"           => "VERY_GOOD",
            "exc"           => "EXCELLENT",
            null            => null,
            _               => rawClassCd   // pass through unrecognized codes
        };
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
