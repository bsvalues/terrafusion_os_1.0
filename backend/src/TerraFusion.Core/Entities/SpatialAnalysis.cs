using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>Stores spatial autocorrelation analysis results (Moran's I, Local Moran, etc.).</summary>
public class SpatialAnalysis
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public Guid Id { get; set; }

  public Guid CountyId { get; set; }

  /// <summary>Type of analysis: global_moran, local_moran, geary_c.</summary>
  public string AnalysisType { get; set; } = "global_moran";

  /// <summary>Variable analysed (e.g. "assessed_value").</summary>
  public string VariableName { get; set; } = "assessed_value";

  /// <summary>Weight matrix type: queen, rook, distance, knn.</summary>
  public string WeightMatrixType { get; set; } = "queen";

  /// <summary>Global statistic value.</summary>
  public double StatisticValue { get; set; }

  /// <summary>Expected value under null hypothesis of spatial randomness.</summary>
  public double ExpectedValue { get; set; }

  /// <summary>Variance under null hypothesis.</summary>
  public double Variance { get; set; }

  /// <summary>Z-score for significance testing.</summary>
  public double ZScore { get; set; }

  /// <summary>P-value (two-tailed).</summary>
  public double PValue { get; set; }

  /// <summary>Number of spatial units.</summary>
  public int SampleSize { get; set; }

  /// <summary>JSON-serialised local indicators (LISA) per observation.</summary>
  public string LocalIndicators { get; set; } = "[]";

  /// <summary>JSON-serialised cluster classification (HH, HL, LH, LL, NS).</summary>
  public string ClusterMap { get; set; } = "[]";

  public string CreatedBy { get; set; } = "system";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
