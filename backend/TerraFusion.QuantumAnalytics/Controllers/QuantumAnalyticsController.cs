using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.QuantumAnalytics.DTOs;
using TerraFusion.QuantumAnalytics.Services;

namespace TerraFusion.QuantumAnalytics.Controllers;

/// <summary>
/// API Controller for Quantum Analytics
/// Provides PhD-level statistical analysis services
/// </summary>
[ApiController]
[Route("api/v2/analytics")]
[Authorize] // Require authentication for all endpoints
[Produces("application/json")]
public class QuantumAnalyticsController : ControllerBase
{
    private readonly IQuantumAnalyticsService _analyticsService;
    private readonly ILogger<QuantumAnalyticsController> _logger;

    public QuantumAnalyticsController(
        IQuantumAnalyticsService analyticsService,
        ILogger<QuantumAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Run statistical hypothesis test
    /// </summary>
    /// <param name="request">Hypothesis test configuration</param>
    /// <returns>Test results with p-value, confidence intervals, effect sizes</returns>
    /// <response code="200">Test completed successfully</response>
    /// <response code="400">Invalid request parameters</response>
    /// <response code="401">Unauthorized - authentication required</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("hypothesis-test")]
    [ProducesResponseType(typeof(StatisticalTestResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<StatisticalTestResult>> RunHypothesisTest(
        [FromBody] HypothesisTestRequest request)
    {
        try
        {
            _logger.LogInformation($"Received hypothesis test request: {request.TestType}");

            // Validate request
            if (request.Dataset.Group1 == null || request.Dataset.Group1.Length == 0)
            {
                return BadRequest(new { error = "Group1 data is required and cannot be empty" });
            }

            if (request.Alpha <= 0 || request.Alpha >= 1)
            {
                return BadRequest(new { error = "Alpha must be between 0 and 1" });
            }

            // Run test
            var result = await _analyticsService.RunHypothesisTestAsync(request);

            _logger.LogInformation($"Hypothesis test completed: {request.TestType}, p-value={result.PValue:F6}");

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument in hypothesis test");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running hypothesis test");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Perform causal inference analysis
    /// </summary>
    /// <param name="request">Causal inference configuration</param>
    /// <returns>Treatment effect with confidence intervals and sensitivity analysis</returns>
    [HttpPost("causal-inference")]
    [ProducesResponseType(typeof(CausalInferenceResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<CausalInferenceResult>> PerformCausalInference(
        [FromBody] CausalInferenceRequest request)
    {
        try
        {
            _logger.LogInformation($"Received causal inference request: {request.Method}");

            // Validate request
            if (string.IsNullOrEmpty(request.Treatment))
            {
                return BadRequest(new { error = "Treatment variable is required" });
            }

            if (string.IsNullOrEmpty(request.Outcome))
            {
                return BadRequest(new { error = "Outcome variable is required" });
            }

            if (request.Confounders == null || request.Confounders.Length == 0)
            {
                return BadRequest(new { error = "At least one confounder is required for valid causal inference" });
            }

            // Run analysis
            var result = await _analyticsService.PerformCausalInferenceAsync(request);

            _logger.LogInformation($"Causal inference completed: {request.Method}, ATE={result.TreatmentEffect:F4}");

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument in causal inference");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing causal inference");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Run Bayesian analysis with MCMC sampling
    /// </summary>
    /// <param name="request">Bayesian analysis configuration</param>
    /// <returns>Posterior distributions and credible intervals</returns>
    [HttpPost("bayesian-analysis")]
    [ProducesResponseType(typeof(BayesianAnalysisResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<BayesianAnalysisResult>> RunBayesianAnalysis(
        [FromBody] BayesianAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation($"Received Bayesian analysis request: {request.ModelType}");

            var result = await _analyticsService.RunBayesianAnalysisAsync(request);

            _logger.LogInformation($"Bayesian analysis completed: {request.ModelType}");

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument in Bayesian analysis");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running Bayesian analysis");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Forecast time-series data using ARIMA, ETS, or Prophet
    /// </summary>
    /// <param name="request">Time-series forecast configuration</param>
    /// <returns>Forecast with confidence intervals and accuracy metrics</returns>
    [HttpPost("time-series-forecast")]
    [ProducesResponseType(typeof(TimeSeriesForecast), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<TimeSeriesForecast>> ForecastTimeSeries(
        [FromBody] TimeSeriesForecastRequest request)
    {
        try
        {
            _logger.LogInformation($"Received time-series forecast request: {request.Method}");

            if (request.TimeSeries == null || request.TimeSeries.Length == 0)
            {
                return BadRequest(new { error = "Time-series data is required" });
            }

            if (request.Horizon <= 0)
            {
                return BadRequest(new { error = "Forecast horizon must be greater than 0" });
            }

            var result = await _analyticsService.ForecastTimeSeriesAsync(request);

            _logger.LogInformation($"Time-series forecast completed: {request.Method}, {result.Forecast.Length} periods");

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument in time-series forecast");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error forecasting time-series");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Compute correlation matrix (Pearson, Spearman, or Kendall)
    /// </summary>
    /// <param name="request">Correlation analysis configuration</param>
    /// <returns>Correlation matrix with p-values</returns>
    [HttpPost("correlation-matrix")]
    [ProducesResponseType(typeof(CorrelationMatrix), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<CorrelationMatrix>> ComputeCorrelationMatrix(
        [FromBody] CorrelationMatrixRequest request)
    {
        try
        {
            _logger.LogInformation($"Received correlation matrix request: {request.Method}");

            if (request.Variables == null || request.Variables.Count < 2)
            {
                return BadRequest(new { error = "At least 2 variables are required for correlation analysis" });
            }

            var result = await _analyticsService.ComputeCorrelationMatrixAsync(request);

            _logger.LogInformation($"Correlation matrix computed: {request.Variables.Count} variables");

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument in correlation analysis");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing correlation matrix");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    /// <summary>
    /// Get available statistical tests
    /// </summary>
    [HttpGet("tests")]
    [AllowAnonymous]
    public IActionResult GetAvailableTests()
    {
        var tests = new
        {
            hypothesis_tests = new[]
            {
                new { name = "t-test", description = "Independent samples t-test", parametric = true },
                new { name = "anova", description = "One-way ANOVA", parametric = true },
                new { name = "chi-square", description = "Chi-square test of independence", parametric = true },
                new { name = "mann-whitney", description = "Mann-Whitney U test (non-parametric)", parametric = false },
                new { name = "kruskal-wallis", description = "Kruskal-Wallis H test (non-parametric)", parametric = false }
            },
            causal_inference_methods = new[]
            {
                "propensity-score",
                "instrumental-variable",
                "diff-in-diff",
                "regression-discontinuity"
            },
            bayesian_models = new[]
            {
                "regression",
                "hierarchical",
                "mixture",
                "time-series"
            },
            forecast_methods = new[]
            {
                "ARIMA",
                "ETS",
                "Prophet",
                "LSTM"
            },
            correlation_methods = new[]
            {
                "pearson",
                "spearman",
                "kendall",
                "mutual-information"
            }
        };

        return Ok(tests);
    }
}
