namespace TerraFusion.Core.DTOs;

// ── Cost Approach ──────────────────────────────────────────────────────

/// <summary>
/// Cost approach result matching the frontend CostApproach / ForgeOverview panels.
/// Maps to fields from pacs_valuations (CostValue, CostMarket, CostLand*, CostImprv*)
/// and pacs_improvement_details (RCN, depreciation).
/// </summary>
public record CostApproachResult
{
    public string ParcelId { get; init; } = string.Empty;
    public int TaxYear { get; init; }

    /// <summary>Replacement cost new (sum of improvement detail RCN).</summary>
    public decimal ReplacementCostNew { get; init; }

    /// <summary>Physical depreciation dollar amount.</summary>
    public decimal PhysicalDepreciation { get; init; }

    /// <summary>Functional obsolescence dollar amount.</summary>
    public decimal FunctionalObsolescence { get; init; }

    /// <summary>External / economic obsolescence dollar amount.</summary>
    public decimal ExternalObsolescence { get; init; }

    /// <summary>RCN minus all depreciation.</summary>
    public decimal DepreciatedCost { get; init; }

    /// <summary>Land value from pacs_land_details sum.</summary>
    public decimal LandValue { get; init; }

    /// <summary>Final cost approach indicated value (DepreciatedCost + LandValue).</summary>
    public decimal IndicatedValue { get; init; }

    /// <summary>Improvement homestead + non-homestead from pacs_valuations cost columns.</summary>
    public decimal ImprovementValue { get; init; }

    /// <summary>Data source label: "pacs" when real data, "fallback" when synthetic.</summary>
    public string Source { get; init; } = "fallback";

    /// <summary>Confidence 0.0 – 1.0 (higher when sourced from real PACS data).</summary>
    public double Confidence { get; init; }

    /// <summary>Cost model input factors for the explain_model_inputs tool.</summary>
    public List<ModelInputEntry> Inputs { get; init; } = [];
}

public record ModelInputEntry
{
    public string Name { get; init; } = string.Empty;
    public string SourceLabel { get; init; } = string.Empty;
    public bool Pii { get; init; }
}

// ── Sales Comparison ───────────────────────────────────────────────────

/// <summary>
/// Sales comparison result matching the frontend SalesComparison panel.
/// Populated from pacs_sales joined to pacs_valuations.
/// </summary>
public record SalesComparisonResult
{
    public string ParcelId { get; init; } = string.Empty;
    public int TaxYear { get; init; }

    /// <summary>Indicated value from market approach (pacs_valuations.MktapprMarket).</summary>
    public decimal IndicatedValue { get; init; }

    /// <summary>Number of comparables found.</summary>
    public int ComparableCount { get; init; }

    /// <summary>Median adjusted sale price of comparables.</summary>
    public decimal MedianAdjustedPrice { get; init; }

    /// <summary>Range of adjusted prices (max - min).</summary>
    public decimal AdjustmentRange { get; init; }

    /// <summary>Individual comparable sale entries.</summary>
    public List<ComparableSaleEntry> Comparables { get; init; } = [];

    /// <summary>Narrative rationale text.</summary>
    public string Rationale { get; init; } = string.Empty;

    public string Source { get; init; } = "fallback";
    public double Confidence { get; init; }
}

public record ComparableSaleEntry
{
    public string ParcelId { get; init; } = string.Empty;
    public DateTime? SaleDate { get; init; }
    public decimal SalePrice { get; init; }
    public decimal AdjustedPrice { get; init; }
    public double Similarity { get; init; }
    public List<string> Notes { get; init; } = [];
}

// ── Income Approach ────────────────────────────────────────────────────

/// <summary>
/// Income approach result matching the frontend IncomeApproach panel.
/// Sourced from pacs_valuations income columns and pacs_sales income data.
/// </summary>
public record IncomeApproachResult
{
    public string ParcelId { get; init; } = string.Empty;
    public int TaxYear { get; init; }

    public decimal NetOperatingIncome { get; init; }
    public decimal CapRate { get; init; }
    public decimal Valuation { get; init; }
    public decimal GrossIncomeMultiplier { get; init; }
    public string RiskClassification { get; init; } = "moderate";

    /// <summary>Income approach indicated value from pacs_valuations.</summary>
    public decimal IncomeIndicatedValue { get; init; }

    public string Source { get; init; } = "fallback";
    public double Confidence { get; init; }
}

// ── Reconciliation ─────────────────────────────────────────────────────

/// <summary>
/// Three-approach reconciliation result matching the frontend Reconciliation panel.
/// </summary>
public record ReconciliationResult
{
    public string ParcelId { get; init; } = string.Empty;
    public int TaxYear { get; init; }

    public ApproachSummary CostApproach { get; init; } = new();
    public ApproachSummary SalesApproach { get; init; } = new();
    public ApproachSummary IncomeApproach { get; init; } = new();

    /// <summary>Final reconciled value (weighted average of approach indications).</summary>
    public decimal ReconciledValue { get; init; }

    /// <summary>Method used for reconciliation.</summary>
    public string Method { get; init; } = "weighted_average";

    /// <summary>Assessed value from pacs_valuations.AssessedVal.</summary>
    public decimal? AssessedValue { get; init; }

    /// <summary>Market value from pacs_valuations.Market.</summary>
    public decimal? MarketValue { get; init; }

    public string Source { get; init; } = "fallback";
    public double Confidence { get; init; }
}

public record ApproachSummary
{
    public string Approach { get; init; } = string.Empty;
    public decimal IndicatedValue { get; init; }
    public int Weight { get; init; }
    public double Confidence { get; init; }
    public string Note { get; init; } = string.Empty;
}

// ── Available Years (Year-Layer Inventory) ─────────────────────────────

/// <summary>
/// All pacs_valuations year layers for a parcel, ordered most-recent first.
/// The UI calls this endpoint on parcel load to populate the year selector
/// and default to the most recent base-roll layer.
///
/// PACS year-layer model: each (PropValYear, SupNum) pair is a discrete,
/// sovereign snapshot. Layers are never silently substituted — year selection
/// is explicit and driven by the caller.
/// </summary>
public record ParcelYearLayersResult
{
    public string ParcelId { get; init; } = string.Empty;

    /// <summary>All layers ordered by year desc, then SupNum asc.</summary>
    public List<ParcelYearLayer> Layers { get; init; } = [];

    /// <summary>
    /// Recommended default year for UI: the most recent base-roll (SupNum=0) layer.
    /// Null if no valuation rows exist for this parcel.
    /// </summary>
    public int? DefaultYear { get; init; }
}

/// <summary>
/// Metadata for a single pacs_valuations row (one year-layer).
/// </summary>
public record ParcelYearLayer
{
    public int Year { get; init; }
    public int SupNum { get; init; }

    /// <summary>"base" when SupNum=0 (roll record), "supplemental" when SupNum>0 (mid-year adjustment).</summary>
    public string LayerType { get; init; } = "base";

    /// <summary>Raw PropState from PACS (e.g. "A"=active). Null if not set.</summary>
    public string? PropState { get; init; }

    /// <summary>True when HasLockedValues=true — layer is certified / closed roll.</summary>
    public bool IsLocked { get; init; }

    /// <summary>
    /// True if this is the oldest known layer for this parcel (data-driven minimum year).
    /// For Benton County parcels this will be 2015 — the asend/proval → PACS migration year.
    /// That layer is NOT stale data; it is the active certified value for parcels not
    /// reappraised since migration (e.g. agricultural parcels on the 6-year cycle).
    /// </summary>
    public bool IsEarliestKnownLayer { get; init; }

    /// <summary>Revaluation cycle number from pacs_valuations.Cycle.</summary>
    public int? RevaluationCycle { get; init; }

    /// <summary>Date parcel was last appraised (LastAppraisalDate ?? LastActualAppraisalDate).</summary>
    public DateTime? LastAppraisalDate { get; init; }

    public decimal? AssessedValue { get; init; }
    public decimal? MarketValue { get; init; }

    /// <summary>
    /// Special program enrollments active in this layer.
    /// These programs create deferred tax liabilities and affect how the parcel is valued.
    /// </summary>
    public ProgramEnrollment Programs { get; init; } = new();
}

/// <summary>
/// Special valuation programs active in a given year layer.
/// Derived from pacs_valuations value fields and pacs_exemptions codes.
///
/// Programs with deferred losses (AgLossDeferred, TimberLossDeferred) are the
/// BASIS for removal penalty calculations under RCW 84.34 and RCW 84.33.
/// Penalty calculation is a separate service method — not part of valuation reconciliation.
/// </summary>
public record ProgramEnrollment
{
    // ── RCW 84.34: Current Use Agricultural ──────────────────────────────
    /// <summary>True when AgUseVal > 0. Parcel is assessed at use value, not market.</summary>
    public bool CurrentUseAg { get; init; }

    /// <summary>
    /// Deferred ag tax difference (market minus use value) for this year.
    /// Summed over up to 7 prior years + 12% interest = removal penalty (RCW 84.34.080).
    /// </summary>
    public decimal AgLossDeferred { get; init; }

    /// <summary>Late-charge component of ag deferral (AgLateLoss).</summary>
    public decimal AgLateLossDeferred { get; init; }

    // ── RCW 84.33: Open Space Timber ─────────────────────────────────────
    /// <summary>True when TimberUse > 0.</summary>
    public bool CurrentUseTimber { get; init; }

    /// <summary>Deferred timber tax difference for this year (penalty basis on removal).</summary>
    public decimal TimberLossDeferred { get; init; }

    // ── RCW 84.36: Exemptions ─────────────────────────────────────────────
    /// <summary>
    /// Exemption type codes active for this parcel in this year layer.
    /// From pacs_exemptions.ExemptTypeCode (e.g. HS, OV65, DP, AG, EX).
    /// </summary>
    public List<string> ExemptionCodes { get; init; } = [];
}
