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
