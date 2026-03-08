using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Levy certification calculation — tracks levy rate computations,
/// statutory limits (1% constitutional, $5.90 aggregate), and
/// certification workflow state for a given tax year.
/// </summary>
public class LevyCertification
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public int Id { get; set; }

  /// <summary>County that owns this certification record.</summary>
  public Guid CountyId { get; set; }

  /// <summary>Tax year this certification applies to.</summary>
  public int TaxYear { get; set; }

  /// <summary>Taxing district code (e.g., county, city, school, fire).</summary>
  [MaxLength(100)]
  public string DistrictCode { get; set; } = "";

  /// <summary>Taxing district display name.</summary>
  [MaxLength(250)]
  public string DistrictName { get; set; } = "";

  /// <summary>Prior-year levy amount in dollars.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal PriorYearLevy { get; set; }

  /// <summary>Requested levy amount for the current year.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal RequestedLevy { get; set; }

  /// <summary>Certified (approved) levy amount after limit checks.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal CertifiedLevy { get; set; }

  /// <summary>Total assessed value in the district.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal AssessedValue { get; set; }

  /// <summary>New-construction value added this year.</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal NewConstructionValue { get; set; }

  /// <summary>Annexation value (newly-included territory).</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal AnnexationValue { get; set; }

  /// <summary>Computed levy rate per $1,000 assessed value.</summary>
  public double LevyRate { get; set; }

  /// <summary>WA statutory limit: 1% annual increase (RCW 84.55).</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal StatutoryLimit { get; set; }

  /// <summary>1% constitutional limit on levy rate per $1,000 AV.</summary>
  public double ConstitutionalLimit { get; set; } = 10.0;

  /// <summary>$5.90 aggregate limit per $1,000 AV (RCW 84.52.043).</summary>
  public double AggregateLimit { get; set; } = 5.90;

  /// <summary>Whether the district is within the 1% constitutional limit.</summary>
  public bool WithinConstitutionalLimit { get; set; }

  /// <summary>Whether the district is within the $5.90 aggregate limit.</summary>
  public bool WithinAggregateLimit { get; set; }

  /// <summary>Whether levy was reduced to comply with limits.</summary>
  public bool WasReduced { get; set; }

  /// <summary>Amount the levy was reduced by (if any).</summary>
  [Column(TypeName = "decimal(18,2)")]
  public decimal ReductionAmount { get; set; }

  /// <summary>Certification status: draft, pending_review, certified, rejected.</summary>
  [MaxLength(50)]
  public string Status { get; set; } = "draft";

  /// <summary>JSON details blob with breakdown, limit check details, etc.</summary>
  [Column(TypeName = "nvarchar(max)")]
  public string? Details { get; set; }

  /// <summary>Who created/ran this calculation.</summary>
  [MaxLength(200)]
  public string CreatedBy { get; set; } = "";

  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
