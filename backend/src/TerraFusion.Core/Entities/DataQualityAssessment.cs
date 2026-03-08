using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Data quality assessment result — tracks completeness, consistency,
/// timeliness, and accuracy scores for county parcel data.
/// </summary>
public class DataQualityAssessment
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public int Id { get; set; }

  /// <summary>County that owns this assessment.</summary>
  public Guid CountyId { get; set; }

  /// <summary>Scope of assessment: parcel, district, county.</summary>
  [MaxLength(50)]
  public string Scope { get; set; } = "county";

  /// <summary>Optional parcel ID if scope is parcel-level.</summary>
  [MaxLength(50)]
  public string? ParcelId { get; set; }

  /// <summary>Total records evaluated.</summary>
  public int TotalRecords { get; set; }

  /// <summary>Records with complete required fields.</summary>
  public int CompleteRecords { get; set; }

  /// <summary>Completeness score (0-100).</summary>
  public double CompletenessScore { get; set; }

  /// <summary>Records passing cross-field consistency checks.</summary>
  public int ConsistentRecords { get; set; }

  /// <summary>Consistency score (0-100).</summary>
  public double ConsistencyScore { get; set; }

  /// <summary>Records updated within the timeliness window.</summary>
  public int TimelyRecords { get; set; }

  /// <summary>Timeliness score (0-100).</summary>
  public double TimelinessScore { get; set; }

  /// <summary>Records within plausible value ranges.</summary>
  public int AccurateRecords { get; set; }

  /// <summary>Accuracy score (0-100).</summary>
  public double AccuracyScore { get; set; }

  /// <summary>Weighted overall quality score (0-100).</summary>
  public double OverallScore { get; set; }

  /// <summary>Quality grade: A (≥90), B (≥80), C (≥70), D (≥60), F (&lt;60).</summary>
  [MaxLength(2)]
  public string Grade { get; set; } = "F";

  /// <summary>Number of distinct issues found.</summary>
  public int IssueCount { get; set; }

  /// <summary>JSON array of issue descriptions.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? Issues { get; set; }

  /// <summary>JSON details with per-field metrics, histograms, etc.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? Details { get; set; }

  [MaxLength(200)]
  public string CreatedBy { get; set; } = "";

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
