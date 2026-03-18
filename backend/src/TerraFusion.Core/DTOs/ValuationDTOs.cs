namespace TerraFusion.Core.DTOs;

/// <summary>
/// Property data transfer object for valuation operations.
/// Assets: TFT-098, TFT-198, TFT-199, TFT-200
/// </summary>
public record PropertyDataDto
{
    public string ParcelId { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string Neighborhood { get; init; } = string.Empty;
    public string PropertyType { get; init; } = string.Empty;
    public int YearBuilt { get; init; }
    public decimal SquareFootage { get; init; }
    public int Bedrooms { get; init; }
    public int Bathrooms { get; init; }
    public decimal LotSize { get; init; }
    public string QualityClass { get; init; } = string.Empty;
    public string Condition { get; init; } = string.Empty;
    public string ZoningCode { get; init; } = string.Empty;
    public decimal? LastSalePrice { get; init; }
    public DateTime? LastSaleDate { get; init; }
    public decimal? AssessedValue { get; init; }
    public int CycleYear { get; init; }
    public string CountyId { get; init; } = string.Empty;
}

public record PropertyListingDto
{
    public string ListingId { get; init; } = string.Empty;
    public string ParcelId { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public decimal ListPrice { get; init; }
    public decimal? SalePrice { get; init; }
    public DateTime ListDate { get; init; }
    public DateTime? SaleDate { get; init; }
    public int DaysOnMarket { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public decimal SquareFootage { get; init; }
    public int YearBuilt { get; init; }
    public string PropertyType { get; init; } = string.Empty;
}

/// <summary>
/// Valuation agent type definitions for AI-assisted valuation.
/// </summary>
public record ValuationAgentRequestDto
{
    public string ParcelId { get; init; } = string.Empty;
    public string CountyId { get; init; } = string.Empty;
    public string AnalysisType { get; init; } = "full";
    public string[] Approaches { get; init; } = ["cost", "sales", "income"];
    public bool IncludeComps { get; init; } = true;
    public int MaxComps { get; init; } = 10;
}

public record ValuationAgentResultDto
{
    public string ParcelId { get; init; } = string.Empty;
    public decimal RecommendedValue { get; init; }
    public decimal ConfidenceScore { get; init; }
    public string PrimaryApproach { get; init; } = string.Empty;
    public CostApproachResultDto? CostApproach { get; init; }
    public SalesApproachResultDto? SalesApproach { get; init; }
    public IncomeApproachResultDto? IncomeApproach { get; init; }
    public string Methodology { get; init; } = string.Empty;
    public DateTime AnalysisDate { get; init; }
}

public record CostApproachResultDto
{
    public decimal ReplacementCostNew { get; init; }
    public decimal PhysicalDepreciation { get; init; }
    public decimal FunctionalObsolescence { get; init; }
    public decimal ExternalObsolescence { get; init; }
    public decimal DepreciatedCost { get; init; }
    public decimal LandValue { get; init; }
    public decimal IndicatedValue { get; init; }
}

public record SalesApproachResultDto
{
    public decimal IndicatedValue { get; init; }
    public int ComparableCount { get; init; }
    public decimal MedianAdjustedPrice { get; init; }
    public decimal AdjustmentRange { get; init; }
}

public record IncomeApproachResultDto
{
    public decimal NetOperatingIncome { get; init; }
    public decimal CapitalizationRate { get; init; }
    public decimal GrossRentMultiplier { get; init; }
    public decimal IndicatedValueDirect { get; init; }
    public decimal IndicatedValueGRM { get; init; }
    public decimal ReconciledValue { get; init; }
}

/// <summary>
/// Analytics agent type definitions.
/// </summary>
public record AnalyticsAgentRequestDto
{
    public string AnalysisType { get; init; } = string.Empty;
    public string Area { get; init; } = string.Empty;
    public string CountyId { get; init; } = string.Empty;
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public string[] Metrics { get; init; } = [];
}

public record AnalyticsAgentResultDto
{
    public string AnalysisType { get; init; } = string.Empty;
    public Dictionary<string, object> Metrics { get; init; } = new();
    public string Summary { get; init; } = string.Empty;
    public DateTime GeneratedAt { get; init; }
}

/// <summary>
/// Real estate agent type definitions.
/// </summary>
public record RealEstateAgentQueryDto
{
    public string QueryType { get; init; } = string.Empty;
    public string Area { get; init; } = string.Empty;
    public string PropertyType { get; init; } = string.Empty;
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public int? MinSqft { get; init; }
    public int? MaxSqft { get; init; }
}

public record RealEstateAgentResponseDto
{
    public int TotalResults { get; init; }
    public List<PropertyListingDto> Listings { get; init; } = new();
    public MarketSummaryDto MarketSummary { get; init; } = new();
}

public record MarketSummaryDto
{
    public decimal MedianPrice { get; init; }
    public decimal AveragePrice { get; init; }
    public int ActiveListings { get; init; }
    public int SoldLast30Days { get; init; }
    public decimal AverageDaysOnMarket { get; init; }
    public string MarketCondition { get; init; } = string.Empty;
}
