using TerraFusion.QuantumAnalytics.DTOs;

namespace TerraFusion.QuantumAnalytics.Services;

/// <summary>
/// Main interface for Quantum Analytics services
/// </summary>
public interface IQuantumAnalyticsService
{
    Task<StatisticalTestResult> RunHypothesisTestAsync(HypothesisTestRequest request, CancellationToken cancellationToken = default);
    Task<CausalInferenceResult> PerformCausalInferenceAsync(CausalInferenceRequest request, CancellationToken cancellationToken = default);
    Task<BayesianAnalysisResult> RunBayesianAnalysisAsync(BayesianAnalysisRequest request, CancellationToken cancellationToken = default);
    Task<TimeSeriesForecast> ForecastTimeSeriesAsync(TimeSeriesForecastRequest request, CancellationToken cancellationToken = default);
    Task<CorrelationMatrix> ComputeCorrelationMatrixAsync(CorrelationMatrixRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// Statistical hypothesis testing service
/// </summary>
public interface IStatisticalTestingService
{
    Task<StatisticalTestResult> RunTTestAsync(HypothesisTestRequest request);
    Task<StatisticalTestResult> RunAnovaAsync(HypothesisTestRequest request);
    Task<StatisticalTestResult> RunChiSquareAsync(HypothesisTestRequest request);
    Task<StatisticalTestResult> RunMannWhitneyAsync(HypothesisTestRequest request);
    Task<StatisticalTestResult> RunKruskalWallisAsync(HypothesisTestRequest request);
}

/// <summary>
/// Causal inference service
/// </summary>
public interface ICausalInferenceService
{
    Task<CausalInferenceResult> PropensityScoreMatchingAsync(CausalInferenceRequest request);
    Task<CausalInferenceResult> InstrumentalVariableAsync(CausalInferenceRequest request);
    Task<CausalInferenceResult> DifferenceInDifferencesAsync(CausalInferenceRequest request);
    Task<CausalInferenceResult> RegressionDiscontinuityAsync(CausalInferenceRequest request);
}

/// <summary>
/// Bayesian analysis service
/// </summary>
public interface IBayesianAnalysisService
{
    Task<BayesianAnalysisResult> RunBayesianRegressionAsync(BayesianAnalysisRequest request);
    Task<BayesianAnalysisResult> RunHierarchicalModelAsync(BayesianAnalysisRequest request);
}

/// <summary>
/// Time-series analysis and forecasting service
/// </summary>
public interface ITimeSeriesService
{
    Task<TimeSeriesForecast> ForecastARIMAAsync(TimeSeriesForecastRequest request);
    Task<TimeSeriesForecast> ForecastETSAsync(TimeSeriesForecastRequest request);
    Task<TimeSeriesForecast> ForecastProphetAsync(TimeSeriesForecastRequest request);
}

/// <summary>
/// Correlation and covariance analysis service
/// </summary>
public interface ICorrelationAnalysisService
{
    Task<CorrelationMatrix> ComputePearsonCorrelationAsync(CorrelationMatrixRequest request);
    Task<CorrelationMatrix> ComputeSpearmanCorrelationAsync(CorrelationMatrixRequest request);
    Task<CorrelationMatrix> ComputeKendallCorrelationAsync(CorrelationMatrixRequest request);
}
