using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>Stores results of a Bayesian posterior estimation for property valuation parameters.</summary>
public class BayesianAnalysis
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public Guid Id { get; set; }

  /// <summary>County scope for data isolation.</summary>
  public Guid CountyId { get; set; }

  /// <summary>Parameter being estimated (e.g. "sqft_coefficient").</summary>
  public string ParameterName { get; set; } = "value";

  /// <summary>Prior distribution type (normal, uniform, beta, etc.).</summary>
  public string PriorDistribution { get; set; } = "normal";

  /// <summary>JSON-serialised prior hyperparameters (e.g. {"mean":0,"std":1}).</summary>
  public string PriorParameters { get; set; } = "{}";

  /// <summary>JSON-serialised observed data used for updating.</summary>
  public string ObservedData { get; set; } = "[]";

  /// <summary>Posterior mean.</summary>
  public double PosteriorMean { get; set; }

  /// <summary>Posterior standard deviation.</summary>
  public double PosteriorStd { get; set; }

  /// <summary>JSON 95 % credible interval [lower, upper].</summary>
  public string CredibleInterval95 { get; set; } = "[]";

  /// <summary>Number of observations used.</summary>
  public int SampleSize { get; set; }

  public string CreatedBy { get; set; } = "system";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
