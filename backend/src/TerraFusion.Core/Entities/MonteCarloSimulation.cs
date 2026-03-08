using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities;

/// <summary>Stores results of a Monte Carlo simulation for property valuation.</summary>
public class MonteCarloSimulation
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public Guid Id { get; set; }

  /// <summary>County scope for data isolation.</summary>
  public Guid CountyId { get; set; }

  /// <summary>Label describing what was simulated (e.g. "portfolio_value").</summary>
  public string SimulationName { get; set; } = "monte_carlo";

  /// <summary>Number of iterations executed.</summary>
  public int Iterations { get; set; }

  /// <summary>JSON-serialised input parameter distributions.</summary>
  public string InputDistributions { get; set; } = "[]";

  /// <summary>Mean of simulated output distribution.</summary>
  public double ResultMean { get; set; }

  /// <summary>Median of simulated output distribution.</summary>
  public double ResultMedian { get; set; }

  /// <summary>Standard deviation of simulated output distribution.</summary>
  public double ResultStd { get; set; }

  /// <summary>5th percentile of simulated output.</summary>
  public double Percentile5 { get; set; }

  /// <summary>25th percentile.</summary>
  public double Percentile25 { get; set; }

  /// <summary>75th percentile.</summary>
  public double Percentile75 { get; set; }

  /// <summary>95th percentile.</summary>
  public double Percentile95 { get; set; }

  /// <summary>JSON-serialised histogram bins [{lower,upper,count}].</summary>
  public string HistogramBins { get; set; } = "[]";

  public string CreatedBy { get; set; } = "system";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
