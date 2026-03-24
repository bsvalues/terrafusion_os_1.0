using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

/// <summary>
/// Phase 10 — PropertyForge valuation service.
/// Queries PACS tables (pacs_valuations, pacs_land_details, pacs_improvement_details,
/// pacs_sales, pacs_owner_vals) for real Benton County data.
/// Returns structured fallback values where PACS data is incomplete.
/// </summary>
public class ValuationService : IValuationService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ValuationService> _logger;

    public ValuationService(TerraFusionDbContext db, ILogger<ValuationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Cost Approach ──────────────────────────────────────────────────

    public async Task<CostApproachResult> CalculateCostApproachAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        // Find the parcel by GeoId (the parcel identifier the frontend uses)
        var parcel = await _db.PacsParcel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GeoId == parcelId || p.SimpleGeoId == parcelId, ct);

        if (parcel == null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found in PACS — returning fallback cost approach", parcelId);
            return BuildFallbackCostApproach(parcelId, taxYear);
        }

        // Get valuation record for the given year
        var valuation = await _db.PacsValuations
            .AsNoTracking()
            .Where(v => v.ParcelId == parcel.Id && v.PropValYear == taxYear && v.SupNum == 0)
            .FirstOrDefaultAsync(ct);

        // Get land details
        var landDetails = await _db.PacsLandDetails
            .AsNoTracking()
            .Where(l => l.ParcelId == parcel.Id && l.PropValYear == taxYear)
            .ToListAsync(ct);

        // Get improvement details for RCN/depreciation
        var improvements = await _db.PacsImprovementDetails
            .AsNoTracking()
            .Where(i => i.PacsPropId == parcel.PropId && i.PropValYear == taxYear)
            .ToListAsync(ct);

        var landValue = landDetails.Sum(l => l.LandSegMktVal ?? 0m);
        var rcn = improvements.Sum(i => i.ImprvDetOrigVal ?? i.ImprvDetCalcVal ?? 0m);
        var physicalDep = improvements.Sum(i =>
        {
            var pct = i.PhysicalPct ?? 0m;
            var baseVal = i.ImprvDetOrigVal ?? i.ImprvDetCalcVal ?? 0m;
            return baseVal * pct;
        });
        var functionalDep = improvements.Sum(i =>
        {
            var pct = i.FunctionalPct ?? 0m;
            var baseVal = i.ImprvDetOrigVal ?? i.ImprvDetCalcVal ?? 0m;
            return baseVal * pct;
        });
        var economicDep = improvements.Sum(i =>
        {
            var pct = i.EconomicPct ?? 0m;
            var baseVal = i.ImprvDetOrigVal ?? i.ImprvDetCalcVal ?? 0m;
            return baseVal * pct;
        });

        var depreciatedCost = rcn - physicalDep - functionalDep - economicDep;
        if (depreciatedCost < 0) depreciatedCost = 0;

        var costValue = valuation?.CostValue ?? (depreciatedCost + landValue);
        var imprvValue = (valuation?.CostImprvHstdVal ?? 0m) + (valuation?.CostImprvNonHstdVal ?? 0m);

        var hasPacsData = valuation != null || landDetails.Count > 0 || improvements.Count > 0;

        return new CostApproachResult
        {
            ParcelId = parcelId,
            TaxYear = taxYear,
            ReplacementCostNew = rcn,
            PhysicalDepreciation = physicalDep,
            FunctionalObsolescence = functionalDep,
            ExternalObsolescence = economicDep,
            DepreciatedCost = depreciatedCost,
            LandValue = landValue,
            IndicatedValue = costValue,
            ImprovementValue = imprvValue > 0 ? imprvValue : depreciatedCost,
            Source = hasPacsData ? "pacs" : "fallback",
            Confidence = hasPacsData ? 0.85 : 0.40,
            Inputs = BuildCostInputs(valuation != null, landDetails.Count, improvements.Count),
        };
    }

    // ── Sales Comparison ───────────────────────────────────────────────

    public async Task<SalesComparisonResult> CalculateSalesComparisonAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        var parcel = await _db.PacsParcel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GeoId == parcelId || p.SimpleGeoId == parcelId, ct);

        if (parcel == null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found — returning fallback sales comparison", parcelId);
            return BuildFallbackSalesComparison(parcelId, taxYear);
        }

        // Get valuation for market approach indicated value
        var valuation = await _db.PacsValuations
            .AsNoTracking()
            .Where(v => v.ParcelId == parcel.Id && v.PropValYear == taxYear && v.SupNum == 0)
            .FirstOrDefaultAsync(ct);

        // Get the neighborhood code for finding comps
        var hood = valuation?.NeighborhoodCode;

        // Find comparable sales: same neighborhood, within 2 years of taxYear
        var compQuery = _db.PacsSales.AsNoTracking()
            .Where(s => s.SalePrice > 0 && s.SaleDate != null);

        if (!string.IsNullOrEmpty(hood))
        {
            // Find parcel IDs in same neighborhood
            var neighborhoodParcelIds = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => v.NeighborhoodCode == hood && v.PropValYear == taxYear)
                .Select(v => v.ParcelId)
                .Distinct()
                .ToListAsync(ct);

            compQuery = compQuery.Where(s => neighborhoodParcelIds.Contains(s.ParcelId));
        }

        var cutoffStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var cutoffEnd = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        compQuery = compQuery.Where(s => s.SaleDate >= cutoffStart && s.SaleDate <= cutoffEnd);

        var comps = await compQuery
            .OrderByDescending(s => s.SaleDate)
            .Take(10)
            .ToListAsync(ct);

        // Get GeoIds for comp parcels
        var compParcelIds = comps.Select(c => c.ParcelId).Distinct().ToList();
        var parcelGeoMap = await _db.PacsParcel
            .AsNoTracking()
            .Where(p => compParcelIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.GeoId ?? p.PropId.ToString(), ct);

        var adjustedPrices = comps
            .Where(c => c.AdjustedSalePrice > 0 || c.SalePrice > 0)
            .Select(c => c.AdjustedSalePrice ?? c.SalePrice ?? 0m)
            .OrderBy(p => p)
            .ToList();

        var median = adjustedPrices.Count > 0
            ? adjustedPrices[adjustedPrices.Count / 2]
            : 0m;

        var range = adjustedPrices.Count > 1
            ? adjustedPrices[^1] - adjustedPrices[0]
            : 0m;

        var indicated = valuation?.MktapprMarket ?? median;
        var hasData = comps.Count > 0 || valuation?.MktapprMarket > 0;

        return new SalesComparisonResult
        {
            ParcelId = parcelId,
            TaxYear = taxYear,
            IndicatedValue = indicated,
            ComparableCount = comps.Count,
            MedianAdjustedPrice = median,
            AdjustmentRange = range,
            Comparables = comps.Select(c => new ComparableSaleEntry
            {
                ParcelId = parcelGeoMap.GetValueOrDefault(c.ParcelId, c.PacsPropId.ToString()),
                SaleDate = c.SaleDate,
                SalePrice = c.SalePrice ?? 0m,
                AdjustedPrice = c.AdjustedSalePrice ?? c.SalePrice ?? 0m,
                Similarity = 0.80, // default — real similarity scoring is a future AI layer
                Notes = BuildSaleNotes(c),
            }).ToList(),
            Rationale = comps.Count > 0
                ? $"{comps.Count} comparable sales found in neighborhood {hood ?? "N/A"} within {taxYear - 2}–{taxYear}. Median adjusted price: ${median:N0}."
                : "No comparable sales found for this parcel and tax year. Market approach indicated value from PACS valuation record used where available.",
            Source = hasData ? "pacs" : "fallback",
            Confidence = hasData ? (comps.Count >= 3 ? 0.90 : 0.70) : 0.35,
        };
    }

    // ── Income Approach ────────────────────────────────────────────────

    public async Task<IncomeApproachResult> CalculateIncomeApproachAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        var parcel = await _db.PacsParcel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GeoId == parcelId || p.SimpleGeoId == parcelId, ct);

        if (parcel == null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found — returning fallback income approach", parcelId);
            return BuildFallbackIncomeApproach(parcelId, taxYear);
        }

        var valuation = await _db.PacsValuations
            .AsNoTracking()
            .Where(v => v.ParcelId == parcel.Id && v.PropValYear == taxYear && v.SupNum == 0)
            .FirstOrDefaultAsync(ct);

        // Check for income data from sales records (monthly/annual income fields)
        var latestSaleWithIncome = await _db.PacsSales
            .AsNoTracking()
            .Where(s => s.ParcelId == parcel.Id && (s.AnnualIncome > 0 || s.MonthlyIncome > 0))
            .OrderByDescending(s => s.SaleDate)
            .FirstOrDefaultAsync(ct);

        var incomeValue = valuation?.IncomeValue ?? 0m;
        var incomeMarket = valuation?.IncomeMarket ?? 0m;

        // Derive NOI and cap rate from available data
        decimal annualIncome = 0m;
        if (latestSaleWithIncome != null)
        {
            annualIncome = latestSaleWithIncome.AnnualIncome
                ?? (latestSaleWithIncome.MonthlyIncome ?? 0m) * 12;
        }

        // Standard expense ratio assumption (40% for residential, 35% for commercial)
        var expenseRatio = 0.40m;
        var noi = annualIncome > 0 ? annualIncome * (1 - expenseRatio) : 0m;

        // Cap rate: derive from PACS or use market default
        decimal capRate;
        if (incomeValue > 0 && noi > 0)
        {
            capRate = Math.Round(noi / incomeValue * 100, 2);
        }
        else
        {
            capRate = 7.0m; // Benton County market default
        }

        var valuation_ = noi > 0 && capRate > 0
            ? Math.Round(noi / (capRate / 100), 0)
            : incomeValue > 0 ? incomeValue : incomeMarket;

        var gim = annualIncome > 0 && valuation_ > 0
            ? Math.Round(valuation_ / annualIncome, 2)
            : 8.5m; // market default GIM

        var hasData = incomeValue > 0 || incomeMarket > 0 || annualIncome > 0;

        return new IncomeApproachResult
        {
            ParcelId = parcelId,
            TaxYear = taxYear,
            NetOperatingIncome = noi,
            CapRate = capRate,
            Valuation = valuation_,
            GrossIncomeMultiplier = gim,
            RiskClassification = ClassifyRisk(capRate),
            IncomeIndicatedValue = incomeValue > 0 ? incomeValue : incomeMarket,
            Source = hasData ? "pacs" : "fallback",
            Confidence = hasData ? 0.75 : 0.30,
        };
    }

    // ── Reconciliation ─────────────────────────────────────────────────

    public async Task<ReconciliationResult> ReconcileAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        // Run sequentially — DbContext is not thread-safe for concurrent operations
        var cost = await CalculateCostApproachAsync(parcelId, taxYear, ct);
        var sales = await CalculateSalesComparisonAsync(parcelId, taxYear, ct);
        var income = await CalculateIncomeApproachAsync(parcelId, taxYear, ct);

        // Standard residential weights: Sales 45%, Cost 40%, Income 15%
        const int costWeight = 40;
        const int salesWeight = 45;
        const int incomeWeight = 15;

        var weightedSum =
            cost.IndicatedValue * costWeight +
            sales.IndicatedValue * salesWeight +
            income.Valuation * incomeWeight;

        var reconciled = Math.Round(weightedSum / 100, 0);

        // Get assessed/market from PACS
        var parcel = await _db.PacsParcel
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.GeoId == parcelId || p.SimpleGeoId == parcelId, ct);

        decimal? assessedVal = null;
        decimal? marketVal = null;

        if (parcel != null)
        {
            var valuation = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => v.ParcelId == parcel.Id && v.PropValYear == taxYear && v.SupNum == 0)
                .FirstOrDefaultAsync(ct);

            assessedVal = valuation?.AssessedVal;
            marketVal = valuation?.Market;
        }

        var anyReal = cost.Source == "pacs" || sales.Source == "pacs" || income.Source == "pacs";

        return new ReconciliationResult
        {
            ParcelId = parcelId,
            TaxYear = taxYear,
            CostApproach = new ApproachSummary
            {
                Approach = "cost",
                IndicatedValue = cost.IndicatedValue,
                Weight = costWeight,
                Confidence = cost.Confidence,
                Note = $"RCN ${cost.ReplacementCostNew:N0} less depreciation + land ${cost.LandValue:N0}",
            },
            SalesApproach = new ApproachSummary
            {
                Approach = "sales",
                IndicatedValue = sales.IndicatedValue,
                Weight = salesWeight,
                Confidence = sales.Confidence,
                Note = $"{sales.ComparableCount} comps, median ${sales.MedianAdjustedPrice:N0}",
            },
            IncomeApproach = new ApproachSummary
            {
                Approach = "income",
                IndicatedValue = income.Valuation,
                Weight = incomeWeight,
                Confidence = income.Confidence,
                Note = $"NOI ${income.NetOperatingIncome:N0} / {income.CapRate}% cap rate",
            },
            ReconciledValue = reconciled,
            Method = "weighted_average",
            AssessedValue = assessedVal,
            MarketValue = marketVal,
            Source = anyReal ? "pacs" : "fallback",
            Confidence = anyReal ? 0.82 : 0.35,
        };
    }

    // ── Fallback Builders ──────────────────────────────────────────────

    private static CostApproachResult BuildFallbackCostApproach(string parcelId, int taxYear) => new()
    {
        ParcelId = parcelId,
        TaxYear = taxYear,
        ReplacementCostNew = 0,
        PhysicalDepreciation = 0,
        FunctionalObsolescence = 0,
        ExternalObsolescence = 0,
        DepreciatedCost = 0,
        LandValue = 0,
        IndicatedValue = 0,
        ImprovementValue = 0,
        Source = "fallback",
        Confidence = 0.0,
        Inputs = BuildCostInputs(false, 0, 0),
    };

    private static SalesComparisonResult BuildFallbackSalesComparison(string parcelId, int taxYear) => new()
    {
        ParcelId = parcelId,
        TaxYear = taxYear,
        IndicatedValue = 0,
        ComparableCount = 0,
        MedianAdjustedPrice = 0,
        AdjustmentRange = 0,
        Comparables = [],
        Rationale = "No PACS data available for this parcel. Load parcel data to enable sales comparison analysis.",
        Source = "fallback",
        Confidence = 0.0,
    };

    private static IncomeApproachResult BuildFallbackIncomeApproach(string parcelId, int taxYear) => new()
    {
        ParcelId = parcelId,
        TaxYear = taxYear,
        NetOperatingIncome = 0,
        CapRate = 7.0m,
        Valuation = 0,
        GrossIncomeMultiplier = 0,
        RiskClassification = "unknown",
        IncomeIndicatedValue = 0,
        Source = "fallback",
        Confidence = 0.0,
    };

    // ── Helpers ─────────────────────────────────────────────────────────

    private static List<ModelInputEntry> BuildCostInputs(bool hasValuation, int landCount, int imprvCount)
    {
        return
        [
            new() { Name = "Replacement Cost New (RCN)", SourceLabel = imprvCount > 0 ? "pacs_improvement_details" : "not_available", Pii = false },
            new() { Name = "Physical Depreciation %", SourceLabel = imprvCount > 0 ? "pacs_improvement_details" : "not_available", Pii = false },
            new() { Name = "Functional Obsolescence %", SourceLabel = imprvCount > 0 ? "pacs_improvement_details" : "not_available", Pii = false },
            new() { Name = "Economic Obsolescence %", SourceLabel = imprvCount > 0 ? "pacs_improvement_details" : "not_available", Pii = false },
            new() { Name = "Land Market Value", SourceLabel = landCount > 0 ? "pacs_land_details" : "not_available", Pii = false },
            new() { Name = "Land Acreage", SourceLabel = landCount > 0 ? "pacs_land_details" : "not_available", Pii = false },
            new() { Name = "Cost Approach Value", SourceLabel = hasValuation ? "pacs_valuations" : "not_available", Pii = false },
            new() { Name = "Owner Name", SourceLabel = "pacs_owners", Pii = true },
            new() { Name = "Situs Address", SourceLabel = "pacs_situses", Pii = true },
        ];
    }

    private static List<string> BuildSaleNotes(TerraFusion.Core.Entities.Pacs.PacsSale sale)
    {
        var notes = new List<string>();
        if (sale.SaleDate.HasValue)
            notes.Add($"Sale date: {sale.SaleDate.Value:yyyy-MM-dd}");
        if (!string.IsNullOrEmpty(sale.SaleTypeCd))
            notes.Add($"Type: {sale.SaleTypeCd}");
        if (sale.SlLivingArea > 0)
            notes.Add($"Living area: {sale.SlLivingArea:N0} sqft");
        if (sale.SlYearBuilt > 0)
            notes.Add($"Year built: {sale.SlYearBuilt:F0}");
        if (sale.NumDaysOnMarket > 0)
            notes.Add($"Days on market: {sale.NumDaysOnMarket:F0}");
        return notes;
    }

    private static string ClassifyRisk(decimal capRate) => capRate switch
    {
        <= 0 => "unknown",
        < 5.0m => "low",
        < 8.0m => "moderate",
        < 11.0m => "elevated",
        _ => "high",
    };
}
