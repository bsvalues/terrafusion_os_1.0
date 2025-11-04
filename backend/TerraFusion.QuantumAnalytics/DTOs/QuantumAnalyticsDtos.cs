namespace TerraFusion.QuantumAnalytics.DTOs;

/// <summary>
/// Request for statistical hypothesis testing
/// </summary>
public class HypothesisTestRequest
{
    public string TestType { get; set; } = "t-test"; // "t-test", "anova", "chi-square", "mann-whitney", "kruskal-wallis"
    public HypothesisTestDataset Dataset { get; set; } = new();
    public HypothesisDefinition Hypothesis { get; set; } = new();
    public double Alpha { get; set; } = 0.05; // Significance level
}

public class HypothesisTestDataset
{
    public double[] Group1 { get; set; } = Array.Empty<double>();
    public double[]? Group2 { get; set; }
    public double[][]? Groups { get; set; } // For ANOVA (3+ groups)
}

public class HypothesisDefinition
{
    public string Null { get; set; } = "The means are equal";
    public string Alternative { get; set; } = "two-sided"; // "two-sided", "less", "greater"
}

/// <summary>
/// Result of statistical hypothesis test
/// </summary>
public class StatisticalTestResult
{
    public double TestStatistic { get; set; }
    public double PValue { get; set; }
    public int? DegreesOfFreedom { get; set; }
    public double[]? ConfidenceInterval { get; set; }
    public EffectSizeInfo? EffectSize { get; set; }
    public string Conclusion { get; set; } = string.Empty;
    public string LatexOutput { get; set; } = string.Empty;
    public string ApaOutput { get; set; } = string.Empty;
}

public class EffectSizeInfo
{
    public string Type { get; set; } = "cohens-d"; // "cohens-d", "eta-squared", "cramers-v"
    public double Value { get; set; }
}

/// <summary>
/// Request for causal inference analysis
/// </summary>
public class CausalInferenceRequest
{
    public string Method { get; set; } = "propensity-score"; // "propensity-score", "instrumental-variable", "diff-in-diff", "regression-discontinuity"
    public string Treatment { get; set; } = string.Empty;
    public string Outcome { get; set; } = string.Empty;
    public string[] Confounders { get; set; } = Array.Empty<string>();
    public Dictionary<string, double[]> Dataset { get; set; } = new();
    public CausalInferenceOptions Options { get; set; } = new();
}

public class CausalInferenceOptions
{
    public string? MatchingMethod { get; set; } // "nearest-neighbor", "caliper", "kernel"
    public double? Caliper { get; set; }
    public double? Trimming { get; set; }
}

/// <summary>
/// Result of causal inference analysis
/// </summary>
public class CausalInferenceResult
{
    public double TreatmentEffect { get; set; } // Average treatment effect (ATE)
    public double StandardError { get; set; }
    public double[] ConfidenceInterval { get; set; } = Array.Empty<double>();
    public double PValue { get; set; }
    public List<CovariateBalanceInfo> CovariateBalance { get; set; } = new();
    public List<SensitivityAnalysisInfo> SensitivityAnalysis { get; set; } = new();
    public string Conclusion { get; set; } = string.Empty;
}

public class CovariateBalanceInfo
{
    public string Variable { get; set; } = string.Empty;
    public BalanceMetrics BeforeMatching { get; set; } = new();
    public BalanceMetrics AfterMatching { get; set; } = new();
    public double StandardizedDiff { get; set; }
}

public class BalanceMetrics
{
    public double Mean { get; set; }
    public double Std { get; set; }
}

public class SensitivityAnalysisInfo
{
    public double Gamma { get; set; } // Rosenbaum bound
    public double PValueLower { get; set; }
    public double PValueUpper { get; set; }
}

/// <summary>
/// Request for Bayesian analysis
/// </summary>
public class BayesianAnalysisRequest
{
    public string ModelType { get; set; } = "regression"; // "regression", "hierarchical", "mixture", "time-series", "custom"
    public PriorDistribution Prior { get; set; } = new();
    public MCMCOptions MCMC { get; set; } = new();
    public Dictionary<string, double[]> Dataset { get; set; } = new();
}

public class PriorDistribution
{
    public string Type { get; set; } = "normal"; // "normal", "beta", "gamma", "uniform"
    public Dictionary<string, double> Parameters { get; set; } = new();
}

public class MCMCOptions
{
    public string Algorithm { get; set; } = "NUTS"; // "Metropolis-Hastings", "Gibbs", "HMC", "NUTS"
    public int Chains { get; set; } = 4;
    public int Iterations { get; set; } = 2000;
    public int Warmup { get; set; } = 1000;
}

/// <summary>
/// Result of Bayesian analysis
/// </summary>
public class BayesianAnalysisResult
{
    public Dictionary<string, double> PosteriorMeans { get; set; } = new();
    public Dictionary<string, double[]> CredibleIntervals { get; set; } = new(); // 95% HDI
    public Dictionary<string, double[]> PosteriorSamples { get; set; } = new();
    public double[] TraceData { get; set; } = Array.Empty<double>();
    public double GelmanRubin { get; set; } // Convergence diagnostic
    public double EffectiveSampleSize { get; set; }
    public string Conclusion { get; set; } = string.Empty;
}

/// <summary>
/// Request for time-series forecasting
/// </summary>
public class TimeSeriesForecastRequest
{
    public double[] TimeSeries { get; set; } = Array.Empty<double>();
    public string Method { get; set; } = "ARIMA"; // "ARIMA", "ETS", "Prophet", "LSTM"
    public int Horizon { get; set; } = 12; // Forecast periods
    public double[] ConfidenceLevels { get; set; } = new[] { 0.80, 0.95 };
}

/// <summary>
/// Time-series forecast result
/// </summary>
public class TimeSeriesForecast
{
    public double[] Forecast { get; set; } = Array.Empty<double>();
    public Dictionary<double, double[]> ConfidenceIntervals { get; set; } = new(); // Level -> [lower, upper]
    public Dictionary<string, double> Metrics { get; set; } = new(); // MAE, RMSE, MAPE, MASE
    public string Model { get; set; } = string.Empty;
    public Dictionary<string, double> ModelParameters { get; set; } = new();
}

/// <summary>
/// Request for correlation analysis
/// </summary>
public class CorrelationMatrixRequest
{
    public Dictionary<string, double[]> Variables { get; set; } = new();
    public string Method { get; set; } = "pearson"; // "pearson", "spearman", "kendall", "mutual-information"
}

/// <summary>
/// Correlation matrix result
/// </summary>
public class CorrelationMatrix
{
    public Dictionary<string, Dictionary<string, double>> Matrix { get; set; } = new(); // Variable1 -> Variable2 -> Correlation
    public Dictionary<string, Dictionary<string, double>> PValues { get; set; } = new(); // Variable1 -> Variable2 -> P-value
    public Dictionary<string, Dictionary<string, double>> ConfidenceIntervals { get; set; } = new(); // Variable1 -> Variable2 -> [lower, upper]
}
