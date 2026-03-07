namespace TerraFusion.Core.Services;

/// <summary>
/// USPAP-aligned three-approach reconciliation service.
/// Combines cost, income, and sales comparison approaches into final indicated value.
/// </summary>
public interface IReconciliationService
{
  Task<ReconciliationResultDto> ReconcileAsync(ReconciliationRequest request);
  Task<ReconciliationParametersDto> GetReconciliationParametersAsync();
}

// ── Request / Response DTOs ──

public class ReconciliationRequest
{
  public Guid PropertyId { get; set; }
  public string SubjectId { get; set; } = string.Empty;
  public string EffectiveDate { get; set; } = string.Empty;
  public string PropertyType { get; set; } = "residential";
  public string ReconciliationMethod { get; set; } = "weighted_average";
  public bool ForcedWeights { get; set; }
  public ApproachValueDto? SalesApproach { get; set; }
  public ApproachValueDto? IncomeApproach { get; set; }
  public ApproachValueDto? CostApproach { get; set; }
}

public class ApproachValueDto
{
  public decimal IndicatedValue { get; set; }
  public string ConfidenceLevel { get; set; } = "medium";
  public decimal? Weight { get; set; }
}

public class ReconciliationResultDto
{
  public string SubjectId { get; set; } = string.Empty;
  public string EffectiveDate { get; set; } = string.Empty;
  public decimal FinalOpinionOfValue { get; set; }
  public Dictionary<string, ApproachSummaryItemDto> ApproachSummary { get; set; } = new();
  public ReconciliationAnalysisDto Analysis { get; set; } = new();
  public QualityIndicatorsDto QualityIndicators { get; set; } = new();
  public string Explanation { get; set; } = string.Empty;
  public DateTime GeneratedAt { get; set; }
}

public class ApproachSummaryItemDto
{
  public decimal IndicatedValue { get; set; }
  public string ConfidenceLevel { get; set; } = string.Empty;
  public decimal BaseWeight { get; set; }
  public decimal AdjustedWeight { get; set; }
  public decimal ContributedValue { get; set; }
}

public class ReconciliationAnalysisDto
{
  public string Method { get; set; } = string.Empty;
  public decimal MinValue { get; set; }
  public decimal MaxValue { get; set; }
  public decimal SpreadPercentage { get; set; }
  public string? PrimaryApproach { get; set; }
  public bool WeightsNormalized { get; set; }
}

public class QualityIndicatorsDto
{
  public string ConfidenceLevel { get; set; } = "medium";
  public List<string> Warnings { get; set; } = new();
  public string ApproachAgreement { get; set; } = "moderate";
}

public class ReconciliationParametersDto
{
  public Dictionary<string, PropertyTypeWeightsDto> DefaultWeightsByPropertyType { get; set; } = new();
  public Dictionary<string, decimal> ConfidenceMultipliers { get; set; } = new();
  public List<string> SupportedMethods { get; set; } = new();
  public List<string> SupportedPropertyTypes { get; set; } = new();
  public AgreementThresholdsDto AgreementThresholds { get; set; } = new();
}

public class PropertyTypeWeightsDto
{
  public decimal Sales { get; set; }
  public decimal Income { get; set; }
  public decimal Cost { get; set; }
}

public class AgreementThresholdsDto
{
  public decimal StrongMaxSpread { get; set; } = 10m;
  public decimal ModerateMaxSpread { get; set; } = 20m;
}
