using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>
/// ML model prediction result — tracks model execution, input features,
/// predicted values, confidence scores, and model metadata.
/// </summary>
public class MlPrediction
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public int Id { get; set; }

  public Guid CountyId { get; set; }

  /// <summary>Model identifier: property_value, land_classification, market_trend, anomaly_detection.</summary>
  [MaxLength(100)]
  public string ModelType { get; set; } = "";

  /// <summary>Model version string.</summary>
  [MaxLength(50)]
  public string ModelVersion { get; set; } = "1.0";

  /// <summary>Optional parcel ID the prediction is for.</summary>
  [MaxLength(50)]
  public string? ParcelId { get; set; }

  /// <summary>The predicted value (e.g., assessed value, classification label).</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal PredictedValue { get; set; }

  /// <summary>Model confidence score (0-1).</summary>
  public double Confidence { get; set; }

  /// <summary>R-squared or accuracy metric for the model run.</summary>
  public double ModelAccuracy { get; set; }

  /// <summary>Mean absolute error from training/validation.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal MeanAbsoluteError { get; set; }

  /// <summary>Root mean squared error from training/validation.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal RootMeanSquaredError { get; set; }

  /// <summary>Number of features used in prediction.</summary>
  public int FeatureCount { get; set; }

  /// <summary>Number of training samples used.</summary>
  public int TrainingSamples { get; set; }

  /// <summary>Inference time in milliseconds.</summary>
  public long InferenceTimeMs { get; set; }

  /// <summary>JSON blob with input features used for prediction.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? InputFeatures { get; set; }

  /// <summary>JSON blob with feature importances / SHAP values.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? FeatureImportances { get; set; }

  /// <summary>JSON details with full model metrics, hyperparams, etc.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? Details { get; set; }

  [MaxLength(200)]
  public string CreatedBy { get; set; } = "";

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
