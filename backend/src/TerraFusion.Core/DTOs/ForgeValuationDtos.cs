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

    // ── CP-4: Depreciation percentages (IAAO standard — show both $ and %) ──
    /// <summary>Physical depreciation as a percent of RCN (0–100).</summary>
    public double PhysicalDepreciationPct { get; init; }

    /// <summary>Functional obsolescence as a percent of RCN (0–100).</summary>
    public double FunctionalObsolescencePct { get; init; }

    /// <summary>External obsolescence as a percent of RCN (0–100).</summary>
    public double ExternalObsolescencePct { get; init; }

    // ── CP-4: Building characteristics from CamaCharacteristic ──
    public int? YearBuilt { get; init; }
    public int? EffectiveAge { get; init; }
    public string? QualityGrade { get; init; }
    public string? ConditionGrade { get; init; }
    public decimal? BuildingSqFt { get; init; }

    // ── CP-4: Land summary from CamaCharacteristic ──
    public decimal? LandAreaSqFt { get; init; }
    public decimal? LandAreaAcres { get; init; }

    // ── CP-4: WA RCW 84.34 agricultural / timber classification ──
    public bool IsAgriculturalOrTimber { get; init; }
    public string? WaClassificationNote { get; init; }

    // ── Phase B: Physical building attributes from PACS improvement attributes ──
    /// <summary>Foundation type (e.g., Crawl/Concrete Perimeter Piers, Slab, Post & Pier).</summary>
    public string? Foundation { get; init; }
    /// <summary>Exterior wall material (e.g., Alum siding, Vinyl, Brick Veneer).</summary>
    public string? ExteriorWall { get; init; }
    /// <summary>Roof covering type (e.g., Comp Shingle, Comp Shingle - Arch, Metal).</summary>
    public string? RoofType { get; init; }
    /// <summary>HVAC system type.</summary>
    public string? HvacType { get; init; }
    public int? Bedrooms { get; init; }
    public int? Bathrooms { get; init; }
    public int? Fireplaces { get; init; }

    // ── Phase B: Per-segment cost breakdown ──
    /// <summary>
    /// Benton county percent-good from the primary segment's age×condition matrix lookup.
    /// percent-good = 86 means 86% of new value remains; effective depreciation = 14%.
    /// Null when no segment data is available.
    /// </summary>
    public double? CountyPercentGood { get; init; }

    /// <summary>
    /// Individual building segments with matrix join keys and area/unit-price data.
    /// Empty when CamaImprovementDetail rows are not present for the parcel.
    /// </summary>
    public List<SegmentEntry> Segments { get; init; } = [];
}

/// <summary>
/// One building segment row from cama_improvement_details.
/// Preserves PACS cost matrix join keys for CostForge recalculation.
/// </summary>
public record SegmentEntry
{
    /// <summary>Segment type code (ImprvDetTypeCd): MA, CovPatio, Patio, Shop, DETGAR, etc.</summary>
    public string? SegmentType { get; init; }
    /// <summary>Human-readable PACS description.</summary>
    public string? SegmentDesc { get; init; }
    /// <summary>Method code — matrix join key (e.g., R, EXT-B).</summary>
    public string? MethodCode { get; init; }
    /// <summary>Class/quality code — matrix join key (e.g., 25, 30, Avg).</summary>
    public string? ClassCode { get; init; }
    /// <summary>Sub-class code (* standard, + plus tier).</summary>
    public string? SubClassCode { get; init; }
    /// <summary>Floor area in square feet.</summary>
    public decimal? Area { get; init; }
    /// <summary>PACS unit cost per square foot.</summary>
    public decimal? UnitPrice { get; init; }
    /// <summary>PACS-computed segment value (Area × UnitPrice × adjustments). Null if not loaded.</summary>
    public decimal? CalcValue { get; init; }
    /// <summary>Condition code for this segment.</summary>
    public string? ConditionCode { get; init; }
    public int? YearBuilt { get; init; }
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

    // ── CP-5: IAAO sales ratio statistics ──
    /// <summary>Median sales ratio (adjusted/sale). 1.0 when no adjustment applied.</summary>
    public double SalesRatioMedian { get; init; }

    /// <summary>Coefficient of Dispersion per IAAO standards (%). IAAO target: ≤15% residential.</summary>
    public double CoefficientOfDispersion { get; init; }

    /// <summary>
    /// Price-Related Differential (IAAO standard). Arithmetic mean / weighted mean.
    /// IAAO target: 0.98–1.03. >1.03 = assessment regressivity; &lt;0.98 = progressivity.
    /// 0.0 when fewer than 2 qualified sales with PACS ratios available.
    /// </summary>
    public double PriceRelatedDifferential { get; init; }

    /// <summary>Number of sales with EffectiveQualification = "qualified" used in ratio statistics.</summary>
    public int QualifiedSaleCount { get; init; }

    /// <summary>True when comps were filtered by neighborhood code.</summary>
    public bool NeighborhoodFilterActive { get; init; }

    // ── OLS Regression (market-extracted adjustments) ──
    /// <summary>
    /// Regression-indicated value from OLS model fitted on comparable sales.
    /// Uses GLA, LotSizeSqft, YearBuilt as predictors.
    /// Null when fewer than 5 qualified comps are available.
    /// </summary>
    public decimal? RegressionIndicatedValue { get; init; }

    /// <summary>Coefficient of determination (R²) for the regression model. Null when model not run.</summary>
    public double? RegressionRSquared { get; init; }

    /// <summary>Adjusted R² penalising for number of predictors. Null when model not run.</summary>
    public double? RegressionRSquaredAdj { get; init; }

    /// <summary>Number of comparable sales used in the regression fit.</summary>
    public int? RegressionCompsUsed { get; init; }

    /// <summary>Regression model coefficients: [intercept, GLA, lot, yearBuilt]. Null when model not run.</summary>
    public double[]? RegressionBeta { get; init; }
}

public record ComparableSaleEntry
{
    public string ParcelId { get; init; } = string.Empty;
    public DateTime? SaleDate { get; init; }
    public decimal SalePrice { get; init; }
    public decimal AdjustedPrice { get; init; }
    public double Similarity { get; init; }
    public List<string> Notes { get; init; } = [];

    // CP-5: per-comp sales ratio (adjustedPrice / salePrice)
    public double SalesRatio { get; init; }

    /// <summary>Sale price per square foot of gross living area. Null if GLA not available.</summary>
    public decimal? PricePerSqFt { get; init; }

    // ── 3-Layer Qualification (read-only for UI display + override surface) ──
    /// <summary>Stable ID of the ComparableSale record — required for the PATCH override endpoint.</summary>
    public Guid SaleId { get; init; }

    /// <summary>Layer 2: TF rule engine recommendation (recomputable, not authoritative).</summary>
    public string? QualificationRecommendation { get; init; }

    /// <summary>Layer 3: Assessor's explicit decision. Null = no override, falls back to recommendation.</summary>
    public string? QualificationDecision { get; init; }

    /// <summary>"AssessorOverride" | "AcceptedRecommendation" | null</summary>
    public string? DecisionSource { get; init; }

    /// <summary>Effective qualification used by ValuationService: Decision ?? Recommendation.</summary>
    public string? EffectiveQualification { get; init; }

    // ── Raw PACS Sale data (Layer 1 verbatim fields for ratio study) ──
    /// <summary>PACS adjusted_sl_price — the price used in ratio study calculations (raw price ± adjustments). Use this, not SalePrice, for ratio math.</summary>
    public decimal? AdjustedSalePriceFromPacs { get; init; }

    /// <summary>PACS sl_ratio_type_cd — WA State DOR ratio study type code (e.g. "100").</summary>
    public string? RawRatioTypeCd { get; init; }

    /// <summary>PACS sl_county_ratio_cd — county's qualified/unqualified designation (e.g. "SWD", "WD").</summary>
    public string? RawCountyRatioCd { get; init; }

    /// <summary>PACS sl_ratio_cd_reason — human-readable reason for DOR report (e.g. "Gift- Grantee pays debt").</summary>
    public string? RawRatioCdReason { get; init; }

    /// <summary>PACS sl_type_cd — deed/sale type code.</summary>
    public string? RawSaleTypeCode { get; init; }

    /// <summary>PACS sl_ratio — pre-computed ratio from PACS (for audit/display; not used in TF calcs).</summary>
    public decimal? PacsComputedRatio { get; init; }

    /// <summary>PACS land_only_sale — true = land-only; affects which value base the ratio is computed against.</summary>
    public bool? LandOnlySale { get; init; }

    /// <summary>PACS continue_current_use — WA current use (open space/farm/timber) must continue.</summary>
    public bool? ContinueCurrentUse { get; init; }

    /// <summary>PACS sales_year — DOR ratio study year assigned by PACS (may differ from SaleDate.Year).</summary>
    public int? SalesYear { get; init; }

    /// <summary>PACS suppress_on_ratio_rpt_cd — "T" suppresses this sale from the DOR ratio report.</summary>
    public string? SuppressOnRatioRptCd { get; init; }

    /// <summary>PACS include_no_calc — sale appears in ratio report but is excluded from IAAO calculations.</summary>
    public bool? IncludeNoCalc { get; init; }

    /// <summary>PACS exemption_amount — REET exemption amount applied to this sale.</summary>
    public decimal? SaleExemptionAmount { get; init; }

    /// <summary>PACS sl_comment — general sale comment recorded by staff.</summary>
    public string? RawComment { get; init; }
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

    // ── CP-6: Methodology disclosure for assessor review ──
    /// <summary>Gross income from the canonical valuation record.</summary>
    public decimal GrossIncome { get; init; }

    /// <summary>Expense ratio used in NOI derivation (e.g. 0.40). Null if NOI was direct from record.</summary>
    public double? ExpenseRatio { get; init; }

    /// <summary>True when NOI was derived from gross income using assumed expense ratio, not from actual record.</summary>
    public bool NoiDerived { get; init; }

    /// <summary>True when the cap rate is the Benton County market default (7.0%), not from actual data.</summary>
    public bool CapRateDefaulted { get; init; }

    /// <summary>Brief methodology note for display: discloses assumptions used.</summary>
    public string? MethodologyNote { get; init; }

    /// <summary>Whether income approach is applicable to this property type.</summary>
    public bool IncomeApproachApplicable { get; init; }
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
