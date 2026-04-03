using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

// BOUNDARY REPAIR COMPLETE (CP-3b): All Pacs* reads removed per PACS Sync mandate.
// Service reads canonical TF entities only: Properties, ValuationRecords,
// ComparableSales, CamaCharacteristics.
// Assessor workflow PARITY gaps are tracked as CP-4/5/6 work — not this service.
/// <summary>
/// Phase 10 — PropertyForge valuation service.
/// Reads canonical TerraFusion entities only. No direct Pacs* mirror reads.
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
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId || p.ParcelNumber == parcelId, ct);

        if (property == null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found in canonical Properties — returning fallback cost approach", parcelId);
            return BuildFallbackCostApproach(parcelId, taxYear);
        }

        var valRec = await _db.ValuationRecords
            .AsNoTracking()
            .Where(vr => vr.ParcelId == parcelId && vr.TaxYear == taxYear)
            .FirstOrDefaultAsync(ct);

        var cama = await _db.CamaCharacteristics
            .AsNoTracking()
            .Where(c => c.ParcelId == parcelId && c.TaxYear == taxYear)
            .FirstOrDefaultAsync(ct);

        // Use canonicalized aggregate values from ValuationRecord.
        // ImprvVal is Benton County's own pre-computed improvement value from pacs_improvements —
        // this IS the county cost approach result. Fall through to it when ValuationRecord.Rcn is absent.
        var costValue     = valRec?.CostApproachValue ?? 0m;
        var landValue     = valRec?.LandValue ?? property.LandValue;
        var rcn           = valRec?.Rcn ?? cama?.ImprvVal ?? 0m;
        var depPct        = valRec?.DepreciationPercent
                           ?? (cama?.DepreciationPct.HasValue == true ? (decimal)cama.DepreciationPct.Value : 0m);
        var rcnld         = valRec?.Rcnld ?? (rcn > 0 ? rcn * (1 - depPct / 100m) : 0m);
        var functionalDep = cama?.FunctionalObsolescence ?? 0m;
        var externalDep   = cama?.ExternalObsolescence ?? 0m;
        var physicalDep   = (rcn > 0 && rcnld > 0) ? rcn - rcnld - functionalDep - externalDep : 0m;
        if (physicalDep < 0) physicalDep = 0m;

        var imprvValue = property.ImprovementValue;
        var indicated  = costValue > 0 ? costValue : (rcnld + landValue);
        var hasData    = valRec != null || cama != null;

        // CP-4: Depreciation percentages (IAAO standard — assessors work in %)
        var physicalDepPct   = rcn > 0 ? Math.Round((double)(physicalDep   / rcn * 100m), 1) : 0.0;
        var functionalDepPct = rcn > 0 ? Math.Round((double)(functionalDep / rcn * 100m), 1) : 0.0;
        var externalDepPct   = rcn > 0 ? Math.Round((double)(externalDep   / rcn * 100m), 1) : 0.0;

        // CP-4: WA RCW 84.34 — agricultural (A1/A2) or timber (T) classification
        var buildingType  = cama?.BuildingType ?? string.Empty;
        var isAgOrTimber  = buildingType.StartsWith("A", StringComparison.OrdinalIgnoreCase)
                         || buildingType.StartsWith("T", StringComparison.OrdinalIgnoreCase);
        var waNote        = isAgOrTimber
            ? $"WA RCW 84.34 qualifying use class ({buildingType}). Current-use assessment basis applies."
            : null;

        // CP-4: Land area in acres (1 acre = 43,560 sq ft)
        decimal? landAcres = cama?.LandAreaSqft > 0
            ? Math.Round(cama!.LandAreaSqft!.Value / 43560m, 3)
            : null;

        // Phase B: Load per-segment breakdown from CamaImprovementDetails
        // Note: avoid OrderByDescending(decimal?) in EF/SQLite — load all rows then sort client-side
        var segmentRows = await _db.CamaImprovementDetails
            .AsNoTracking()
            .Where(s => s.ParcelId == parcelId && s.TaxYear == taxYear)
            .ToListAsync(ct);

        var segments = segmentRows
            .OrderByDescending(s => s.Area ?? 0m)
            .Select(s => new SegmentEntry
            {
                SegmentType  = s.SegmentType,
                SegmentDesc  = s.SegmentDesc,
                MethodCode   = s.MethodCode,
                ClassCode    = s.ClassCode,
                SubClassCode = s.SubClassCode,
                Area         = s.Area,
                UnitPrice    = s.UnitPrice,
                CalcValue    = s.CalcValue,
                ConditionCode = s.ConditionCode,
                YearBuilt    = s.YearBuilt,
            }).ToList();

        return new CostApproachResult
        {
            ParcelId                  = parcelId,
            TaxYear                   = taxYear,
            ReplacementCostNew        = rcn,
            PhysicalDepreciation      = physicalDep,
            FunctionalObsolescence    = functionalDep,
            ExternalObsolescence      = externalDep,
            DepreciatedCost           = rcnld,
            LandValue                 = landValue,
            IndicatedValue            = indicated,
            ImprovementValue          = imprvValue > 0 ? imprvValue : rcnld,
            Source                    = hasData ? "canonical" : "stub",
            Confidence                = hasData ? (rcn > 0 ? 0.85 : 0.60) : 0.40,
            Inputs                    = BuildCostInputs(valRec != null, cama?.LandAreaSqft > 0, cama != null),
            // CP-4 additions
            PhysicalDepreciationPct   = physicalDepPct,
            FunctionalObsolescencePct = functionalDepPct,
            ExternalObsolescencePct   = externalDepPct,
            YearBuilt                 = cama?.YearBuilt,
            EffectiveAge              = cama?.EffectiveAge,
            QualityGrade              = cama?.QualityGrade,
            ConditionGrade            = cama?.ConditionGrade,
            BuildingSqFt              = cama?.SquareFeet > 0 ? cama.SquareFeet : null,
            LandAreaSqFt              = cama?.LandAreaSqft,
            LandAreaAcres             = landAcres,
            IsAgriculturalOrTimber    = isAgOrTimber,
            WaClassificationNote      = waNote,
            // Phase B: physical building attributes
            Foundation   = cama?.Foundation,
            ExteriorWall = cama?.ExteriorWall,
            RoofType     = cama?.RoofType,
            HvacType     = cama?.HvacType,
            Bedrooms     = cama?.Bedrooms,
            Bathrooms    = cama?.Bathrooms,
            Fireplaces   = cama?.Fireplaces,
            Segments     = segments,
        };
    }

    // ── Sales Comparison ───────────────────────────────────────────────

    public async Task<SalesComparisonResult> CalculateSalesComparisonAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId || p.ParcelNumber == parcelId, ct);

        if (property == null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found — returning fallback sales comparison", parcelId);
            return BuildFallbackSalesComparison(parcelId, taxYear);
        }

        var valRec = await _db.ValuationRecords
            .AsNoTracking()
            .Where(vr => vr.ParcelId == parcelId && vr.TaxYear == taxYear)
            .FirstOrDefaultAsync(ct);

        // Find comps by property type and date range.
        // NOTE: Neighborhood filtering deferred — ComparableSale.Neighborhood not yet
        // populated in the canonical model. This is a CP-5 parity gap.
        var cutoffStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var cutoffEnd   = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        var comps = await _db.ComparableSales
            .AsNoTracking()
            .Where(cs =>
                cs.SaleDate >= cutoffStart &&
                cs.SaleDate <= cutoffEnd &&
                cs.SalePrice > 0 &&
                cs.ParcelId != parcelId)
            .OrderByDescending(cs => cs.SaleDate)
            .Take(10)
            .ToListAsync(ct);

        var prices = comps.Select(c => c.SalePrice).OrderBy(p => p).ToList();
        var median = prices.Count > 0 ? prices[prices.Count / 2] : 0m;
        var range  = prices.Count > 1 ? prices[^1] - prices[0] : 0m;

        // CP-5: Sales ratio statistics (IAAO standard)
        // AdjustedPrice = SalePrice currently (no neighborhood-score adjustment yet — CP-5 gap).
        // Ratios are all 1.0 until adjustment scoring is built. COD = 0.
        var ratios = comps
            .Where(c => c.SalePrice > 0)
            .Select(c => (double)(c.SalePrice / c.SalePrice))  // = 1.0 until adjustments applied
            .ToList();
        var ratioMedian = ratios.Count > 0 ? ratios.OrderBy(r => r).ElementAt(ratios.Count / 2) : 0.0;
        var cod = ratioMedian > 0 && ratios.Count > 1
            ? Math.Round(ratios.Average(r => Math.Abs(r - ratioMedian)) / ratioMedian * 100.0, 2)
            : 0.0;

        var indicated = valRec?.SalesComparisonValue ?? median;
        var hasData   = comps.Count > 0 || valRec?.SalesComparisonValue > 0;

        return new SalesComparisonResult
        {
            ParcelId                = parcelId,
            TaxYear                 = taxYear,
            IndicatedValue          = indicated,
            ComparableCount         = comps.Count,
            MedianAdjustedPrice     = median,
            AdjustmentRange         = range,
            Comparables             = comps.Select(c => new ComparableSaleEntry
            {
                ParcelId      = c.ParcelId,
                SaleDate      = c.SaleDate,
                SalePrice     = c.SalePrice,
                AdjustedPrice = c.SalePrice, // adjustment scoring is CP-5 parity work
                Similarity    = 0.80,         // uniform default — real scoring is a future AI layer
                Notes         = BuildSaleNotes(c),
                SalesRatio    = c.SalePrice > 0 ? 1.0 : 0.0,  // 1.0 until adjustments applied
            }).ToList(),
            Rationale = comps.Count > 0
                ? $"{comps.Count} comparable sales within {taxYear - 2}\u2013{taxYear}. Median: ${median:N0}. Neighborhood filter not yet active \u2014 comps span entire county."
                : "No comparable sales found. Market value from canonical valuation record used where available.",
            Source                   = hasData ? "canonical" : "stub",
            Confidence               = hasData ? (comps.Count >= 3 ? 0.90 : 0.70) : 0.35,
            // CP-5 additions
            SalesRatioMedian         = ratioMedian,
            CoefficientOfDispersion  = cod,
            NeighborhoodFilterActive = false, // CP-5 gap: Neighborhood not yet populated in canonical ComparableSale
        };
    }

    // ── Income Approach ────────────────────────────────────────────────

    public async Task<IncomeApproachResult> CalculateIncomeApproachAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId || p.ParcelNumber == parcelId, ct);

        if (property == null)
        {
            _logger.LogWarning("Parcel {ParcelId} not found — returning fallback income approach", parcelId);
            return BuildFallbackIncomeApproach(parcelId, taxYear);
        }

        var valRec = await _db.ValuationRecords
            .AsNoTracking()
            .Where(vr => vr.ParcelId == parcelId && vr.TaxYear == taxYear)
            .FirstOrDefaultAsync(ct);

        var incomeValue = valRec?.IncomeApproachValue ?? 0m;
        var grossIncome = valRec?.GrossIncome ?? 0m;
        var noi         = valRec?.NetOperatingIncome ?? 0m;
        var capRate     = valRec?.CapRate ?? 0m;

        // CP-6: Track methodology assumptions for UI disclosure
        var noiDerived        = false;
        var capRateDefaulted  = false;
        double? expenseRatio  = null;

        // If canonical NOI is missing but gross income is present, derive using
        // standard 40% expense ratio — disclosed as an assumption, not a market fact.
        if (grossIncome > 0 && noi == 0)
        {
            noi           = grossIncome * (1 - 0.40m);
            noiDerived    = true;
            expenseRatio  = 0.40;
        }

        if (capRate == 0 && noi > 0 && incomeValue > 0)
            capRate = Math.Round(noi / incomeValue * 100, 2);
        else if (capRate == 0)
        {
            capRate          = 7.0m; // Benton County market default — disclosed assumption
            capRateDefaulted = true;
        }

        var derived = noi > 0 && capRate > 0
            ? Math.Round(noi / (capRate / 100), 0)
            : incomeValue;

        var gim = grossIncome > 0 && derived > 0
            ? Math.Round(derived / grossIncome, 2)
            : 8.5m;

        // CP-6: Build honest methodology note
        var methodNotes = new List<string>();
        if (noiDerived)    methodNotes.Add("NOI derived at 40% expense ratio (assumed).");
        if (capRateDefaulted) methodNotes.Add("Cap rate: 7.0% Benton County market default (assumed, no market data).");
        if (!noiDerived && noi == 0) methodNotes.Add("No income data in canonical record — income approach not applicable for this parcel.");
        var methodologyNote = methodNotes.Count > 0 ? string.Join(" ", methodNotes) : null;

        // Income approach applicable = commercial/income-producing properties.
        // Heuristic from BuildingType or gross income presence.
        var hasCama   = await _db.CamaCharacteristics.AsNoTracking().AnyAsync(c => c.ParcelId == parcelId && c.TaxYear == taxYear, ct);
        var bldgType  = hasCama
            ? (await _db.CamaCharacteristics.AsNoTracking().Where(c => c.ParcelId == parcelId && c.TaxYear == taxYear).Select(c => c.BuildingType).FirstOrDefaultAsync(ct) ?? "")
            : "";
        var applicable = grossIncome > 0
                      || bldgType.StartsWith("C", StringComparison.OrdinalIgnoreCase)
                      || bldgType.StartsWith("I", StringComparison.OrdinalIgnoreCase);

        var hasData = incomeValue > 0 || noi > 0 || grossIncome > 0;

        return new IncomeApproachResult
        {
            ParcelId                   = parcelId,
            TaxYear                    = taxYear,
            NetOperatingIncome         = noi,
            CapRate                    = capRate,
            Valuation                  = derived,
            GrossIncomeMultiplier      = gim,
            RiskClassification         = ClassifyRisk(capRate),
            IncomeIndicatedValue       = incomeValue,
            Source                     = hasData ? "canonical" : "stub",
            Confidence                 = hasData ? 0.75 : 0.30,
            // CP-6 additions
            GrossIncome                = grossIncome,
            ExpenseRatio               = expenseRatio,
            NoiDerived                 = noiDerived,
            CapRateDefaulted           = capRateDefaulted,
            MethodologyNote            = methodologyNote,
            IncomeApproachApplicable   = applicable,
        };
    }

    // ── Reconciliation ─────────────────────────────────────────────────

    public async Task<ReconciliationResult> ReconcileAsync(
        string parcelId, int taxYear, CancellationToken ct)
    {
        // Run sequentially — DbContext is not thread-safe for concurrent operations
        var cost   = await CalculateCostApproachAsync(parcelId, taxYear, ct);
        var sales  = await CalculateSalesComparisonAsync(parcelId, taxYear, ct);
        var income = await CalculateIncomeApproachAsync(parcelId, taxYear, ct);

        const int costWeight   = 40;
        const int salesWeight  = 45;
        const int incomeWeight = 15;

        var weightedSum =
            cost.IndicatedValue   * costWeight   +
            sales.IndicatedValue  * salesWeight  +
            income.Valuation      * incomeWeight;

        var reconciled = Math.Round(weightedSum / 100, 0);

        // Assessed / market values from canonical Property entity
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId || p.ParcelNumber == parcelId, ct);

        var anyReal = cost.Source == "canonical" || sales.Source == "canonical" || income.Source == "canonical";

        return new ReconciliationResult
        {
            ParcelId  = parcelId,
            TaxYear   = taxYear,
            CostApproach = new ApproachSummary
            {
                Approach       = "cost",
                IndicatedValue = cost.IndicatedValue,
                Weight         = costWeight,
                Confidence     = cost.Confidence,
                Note           = $"RCN ${cost.ReplacementCostNew:N0} less depreciation + land ${cost.LandValue:N0}",
            },
            SalesApproach = new ApproachSummary
            {
                Approach       = "sales",
                IndicatedValue = sales.IndicatedValue,
                Weight         = salesWeight,
                Confidence     = sales.Confidence,
                Note           = $"{sales.ComparableCount} comps, median ${sales.MedianAdjustedPrice:N0}",
            },
            IncomeApproach = new ApproachSummary
            {
                Approach       = "income",
                IndicatedValue = income.Valuation,
                Weight         = incomeWeight,
                Confidence     = income.Confidence,
                Note           = $"NOI ${income.NetOperatingIncome:N0} / {income.CapRate}% cap rate",
            },
            ReconciledValue = reconciled,
            Method          = "weighted_average",
            AssessedValue   = property?.AssessedValue,
            MarketValue     = property?.MarketValue,
            Source          = anyReal ? "canonical" : "stub",
            Confidence      = anyReal ? 0.82 : 0.35,
        };
    }

    // ── Available Years ────────────────────────────────────────────────

    /// <summary>
    /// Returns valuation year layers for a parcel from canonical ValuationRecords.
    ///
    /// PARITY GAP (CP-4): The canonical ValuationRecord does not capture the full
    /// PACS year-layer model (SupNum, PropState, program enrollment, exemptions, etc.).
    /// Those fields return null/empty/false until the canonical model is extended.
    /// </summary>
    public async Task<ParcelYearLayersResult> GetAvailableYearsAsync(
        string parcelId, CancellationToken ct)
    {
        var property = await _db.Properties
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ParcelId == parcelId || p.ParcelNumber == parcelId, ct);

        if (property == null)
            return new ParcelYearLayersResult { ParcelId = parcelId };

        var valRecs = await _db.ValuationRecords
            .AsNoTracking()
            .Where(vr => vr.ParcelId == parcelId)
            .OrderByDescending(vr => vr.TaxYear)
            .ToListAsync(ct);

        if (valRecs.Count == 0)
            return new ParcelYearLayersResult { ParcelId = parcelId };

        var minYear = valRecs.Min(v => v.TaxYear);

        var layers = valRecs.Select(vr => new ParcelYearLayer
        {
            Year                 = vr.TaxYear,
            SupNum               = 0,
            LayerType            = "base",
            PropState            = null,
            IsLocked             = false,
            IsEarliestKnownLayer = vr.TaxYear == minYear,
            RevaluationCycle     = null,
            LastAppraisalDate    = null,
            AssessedValue        = vr.SalesComparisonValue ?? vr.FinalReconciledValue,
            MarketValue          = vr.SalesComparisonValue,
            Programs             = new ProgramEnrollment
            {
                CurrentUseAg       = false,
                AgLossDeferred     = 0,
                AgLateLossDeferred = 0,
                CurrentUseTimber   = false,
                TimberLossDeferred = 0,
                ExemptionCodes     = [],
            },
        }).ToList();

        return new ParcelYearLayersResult
        {
            ParcelId    = parcelId,
            Layers      = layers,
            DefaultYear = layers.FirstOrDefault()?.Year,
        };
    }

    // ── Fallback Builders ──────────────────────────────────────────────

    private static CostApproachResult BuildFallbackCostApproach(string parcelId, int taxYear) => new()
    {
        ParcelId               = parcelId,
        TaxYear                = taxYear,
        ReplacementCostNew     = 0,
        PhysicalDepreciation   = 0,
        FunctionalObsolescence = 0,
        ExternalObsolescence   = 0,
        DepreciatedCost        = 0,
        LandValue              = 0,
        IndicatedValue         = 0,
        ImprovementValue       = 0,
        Source                 = "stub",
        Confidence             = 0.0,
        Inputs                 = BuildCostInputs(false, false, false),
    };

    private static SalesComparisonResult BuildFallbackSalesComparison(string parcelId, int taxYear) => new()
    {
        ParcelId            = parcelId,
        TaxYear             = taxYear,
        IndicatedValue      = 0,
        ComparableCount     = 0,
        MedianAdjustedPrice = 0,
        AdjustmentRange     = 0,
        Comparables         = [],
        Rationale           = "No data available for this parcel. Load parcel data to enable sales comparison analysis.",
        Source              = "stub",
        Confidence          = 0.0,
    };

    private static IncomeApproachResult BuildFallbackIncomeApproach(string parcelId, int taxYear) => new()
    {
        ParcelId              = parcelId,
        TaxYear               = taxYear,
        NetOperatingIncome    = 0,
        CapRate               = 7.0m,
        Valuation             = 0,
        GrossIncomeMultiplier = 0,
        RiskClassification    = "unknown",
        IncomeIndicatedValue  = 0,
        Source                = "stub",
        Confidence            = 0.0,
    };

    // ── Helpers ─────────────────────────────────────────────────────────

    private static List<ModelInputEntry> BuildCostInputs(bool hasValuation, bool hasLand, bool hasCama)
    {
        return
        [
            new() { Name = "Replacement Cost New (RCN)",   SourceLabel = hasCama ? "cama-data" : "not_available", Pii = false },
            new() { Name = "Physical Depreciation %",      SourceLabel = hasCama ? "cama-data" : "not_available", Pii = false },
            new() { Name = "Functional Obsolescence %",    SourceLabel = hasCama ? "cama-data" : "not_available", Pii = false },
            new() { Name = "Economic Obsolescence %",      SourceLabel = hasCama ? "cama-data" : "not_available", Pii = false },
            new() { Name = "Land Market Value",            SourceLabel = hasLand ? "cama-land-data" : "not_available", Pii = false },
            new() { Name = "Cost Approach Value",          SourceLabel = hasValuation ? "valuation-record" : "not_available", Pii = false },
            new() { Name = "Owner Name",                   SourceLabel = "property-data", Pii = true },
            new() { Name = "Situs Address",                SourceLabel = "property-data", Pii = true },
        ];
    }

    private static List<string> BuildSaleNotes(TerraFusion.Core.Entities.ComparableSale sale)
    {
        var notes = new List<string>();
        if (sale.SaleDate != default)
            notes.Add($"Sale date: {sale.SaleDate:yyyy-MM-dd}");
        if (!string.IsNullOrEmpty(sale.SaleQualification) && sale.SaleQualification != "qualified")
            notes.Add($"Qualification: {sale.SaleQualification}");
        if (sale.GrossLivingArea > 0)
            notes.Add($"Living area: {sale.GrossLivingArea:N0} sqft");
        if (sale.YearBuilt > 0)
            notes.Add($"Year built: {sale.YearBuilt}");
        if (!string.IsNullOrEmpty(sale.Neighborhood))
            notes.Add($"Neighborhood: {sale.Neighborhood}");
        return notes;
    }

    private static string ClassifyRisk(decimal capRate) => capRate switch
    {
        <= 0    => "unknown",
        < 5.0m  => "low",
        < 8.0m  => "moderate",
        < 11.0m => "elevated",
        _       => "high",
    };
}
