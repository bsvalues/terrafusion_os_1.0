namespace TerraFusion.API.Interfaces;

/// <summary>
/// Forge statistics service for IAAO ratio study analysis — strata, outliers,
/// model comparison, and segment discovery.
/// </summary>
public interface IForgeStatisticsService
{
  Task<List<StrataResultDto>> GetStrataAsync(string modelId, Guid countyId, CancellationToken ct = default);
  Task<List<OutlierRecordDto>> GetOutliersAsync(string modelId, Guid countyId, CancellationToken ct = default);
  Task<ModelComparisonDto> CompareModelsAsync(CompareModelsRequest request, Guid countyId, CancellationToken ct = default);
  Task<List<DiscoveredSegmentDto>> DiscoverSegmentsAsync(string modelId, Guid countyId, CancellationToken ct = default);
}

// ============================================================================
// DTOs
// ============================================================================

public class StrataResultDto
{
  public string StrataId { get; set; } = string.Empty;
  public string StrataLabel { get; set; } = string.Empty;
  public string Neighborhood { get; set; } = string.Empty;
  public string PropertyType { get; set; } = string.Empty;
  public int SampleSize { get; set; }
  public double MedianRatio { get; set; }
  public double Cod { get; set; }
  public double Prd { get; set; }
  public bool Qualified { get; set; }
}

public class OutlierRecordDto
{
  public string ParcelId { get; set; } = string.Empty;
  public string Address { get; set; } = string.Empty;
  public string Neighborhood { get; set; } = string.Empty;
  public decimal SalePrice { get; set; }
  public decimal AssessedValue { get; set; }
  public double Ratio { get; set; }
  public double RatioDeviation { get; set; }
  public string OutlierMethod { get; set; } = "iqr";
  public string FlagReason { get; set; } = string.Empty;
  public double Confidence { get; set; }
  public string ReviewStatus { get; set; } = "pending";
}

public class CompareModelsRequest
{
  public string ModelIdA { get; set; } = string.Empty;
  public string ModelIdB { get; set; } = string.Empty;
}

public class ModelComparisonDto
{
  public ModelSummaryDto ModelA { get; set; } = new();
  public ModelSummaryDto ModelB { get; set; } = new();
  public ComparisonDeltasDto Deltas { get; set; } = new();
  public List<string> ImprovedMetrics { get; set; } = new();
  public List<string> DegradedMetrics { get; set; } = new();
}

public class ModelSummaryDto
{
  public string Label { get; set; } = string.Empty;
  public double MedianRatio { get; set; }
  public double Cod { get; set; }
  public double Prd { get; set; }
  public double Prb { get; set; }
  public int SampleSize { get; set; }
}

public class ComparisonDeltasDto
{
  public double Cod { get; set; }
  public double Prd { get; set; }
  public double Prb { get; set; }
  public double MedianRatio { get; set; }
  public int SampleSize { get; set; }
}

public class DiscoveredSegmentDto
{
  public string Id { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string BoundaryDescription { get; set; } = string.Empty;
  public string Status { get; set; } = "pending";
  public double Confidence { get; set; }
  public int ParcelCount { get; set; }
  public decimal MedianValue { get; set; }
  public double AvgSqft { get; set; }
  public double AvgAge { get; set; }
  public List<string> KeyCharacteristics { get; set; } = new();
}
