using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Persistent record of an OLS multiple regression analysis on property valuation data.
/// Stores coefficients, fit metrics, and diagnostic flags.
/// Write lane: Forge (TerraForge).
/// </summary>
public class RegressionAnalysis
{
  public Guid Id { get; set; } = Guid.NewGuid();

  [Required]
  public Guid CountyId { get; set; }

  /// <summary>Comma-separated parcel IDs used in the analysis sample.</summary>
  [StringLength(8000)]
  public string ParcelIds { get; set; } = string.Empty;

  [Required]
  [StringLength(100)]
  public string DependentVariable { get; set; } = "assessed_value";

  /// <summary>JSON array of independent variable names, e.g. ["sqft","acreage","age"].</summary>
  [Required]
  [StringLength(2000)]
  public string IndependentVariables { get; set; } = "[]";

  /// <summary>JSON array of coefficient values (same order as IndependentVariables).</summary>
  [Required]
  [StringLength(2000)]
  public string Coefficients { get; set; } = "[]";

  public double Intercept { get; set; }

  public double RSquared { get; set; }

  public double AdjustedRSquared { get; set; }

  public double FStatistic { get; set; }

  public double PValue { get; set; }

  /// <summary>JSON array of standard errors for each coefficient.</summary>
  [StringLength(2000)]
  public string StandardErrors { get; set; } = "[]";

  /// <summary>JSON object with diagnostic flags: heteroskedasticity, autocorrelation, normality.</summary>
  [StringLength(4000)]
  public string ResidualDiagnostics { get; set; } = "{}";

  public int SampleSize { get; set; }

  // ── Ownership ──
  [StringLength(100)]
  public string CreatedBy { get; set; } = "system";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
