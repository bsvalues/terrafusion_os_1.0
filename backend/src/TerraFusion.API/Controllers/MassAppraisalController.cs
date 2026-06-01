using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using TerraFusion.API.Interfaces;
using TerraFusion.API.Seeds;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;
using CountyNotFoundException = TerraFusion.Core.Services.CountyNotFoundException;

namespace TerraFusion.API.Controllers
{
  /// <summary>
  /// Mass Appraisal Controller (BIV-002, TFT-002)
  /// Exposes CAMA model execution, calibration, and ratio study endpoints
  /// for IAAO-compliant mass appraisal operations.
  /// </summary>
  [ApiController]
  [Route("api/[controller]")]
  [Produces("application/json")]
  [Authorize]
  public class MassAppraisalController : ControllerBase
  {
    private readonly IMassAppraisalService _massAppraisalService;
    private readonly IForgeStatisticsService _statisticsService;
    private readonly ICountyResolver _countyResolver;
    private readonly ILogger<MassAppraisalController> _logger;

    private static readonly Guid FallbackCountyId = DatabaseSeeder.BentonCountyId;

    public MassAppraisalController(
        IMassAppraisalService massAppraisalService,
        IForgeStatisticsService statisticsService,
        ICountyResolver countyResolver,
        ILogger<MassAppraisalController> logger)
    {
      _massAppraisalService = massAppraisalService;
      _statisticsService = statisticsService;
      _countyResolver = countyResolver;
      _logger = logger;
    }

    private string? ResolveCountyScopeToken()
    {
      var candidates = new[]
      {
        User.FindFirst("county_id")?.Value,
        User.FindFirst("countyId")?.Value,
        Request.Headers["x-county-id"].FirstOrDefault(),
        Request.Headers["X-County-Id"].FirstOrDefault(),
        Request.Headers["X-TerraFusion-County"].FirstOrDefault(),
      };

      return candidates.FirstOrDefault(candidate => !string.IsNullOrWhiteSpace(candidate))?.Trim();
    }

    private async Task<Guid> ResolveCountyIdAsync(CancellationToken ct = default)
    {
      var countyToken = ResolveCountyScopeToken();
      if (string.IsNullOrWhiteSpace(countyToken))
        return FallbackCountyId;

      return await _countyResolver.ResolveAsync(countyToken, ct);
    }

    /// <summary>
    /// Run a mass appraisal model against the specified property population.
    /// Executes cost, sales comparison, or income approach models per IAAO standards.
    /// </summary>
    /// <param name="request">Model run parameters including approach type, property class, and neighborhood filters.</param>
    /// <returns>Model run result with value estimates and statistical summary.</returns>
    [HttpPost("run")]
    [ProducesResponseType(typeof(MassAppraisalRunResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MassAppraisalRunResult>> RunModel([FromBody] MassAppraisalRunRequest request)
    {
      try
      {
        _logger.LogInformation(
            "Initiating mass appraisal model run: Approach={Approach}, PropertyClass={PropertyClass}",
            request.ApproachType, request.PropertyClass);

        var result = await _massAppraisalService.RunModelAsync(request);
        return Ok(result);
      }
      catch (ArgumentException ex)
      {
        _logger.LogWarning(ex, "Invalid mass appraisal request parameters");
        return BadRequest(new { error = ex.Message });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Mass appraisal model run failed");
        return StatusCode(500, new { error = "Mass appraisal model execution failed. Contact system administrator." });
      }
    }

    /// <summary>
    /// Calibrate a mass appraisal model using recent arm's-length sales.
    /// Adjusts coefficients to minimize assessment-to-sale ratio deviation.
    /// </summary>
    /// <param name="request">Calibration parameters including sales period and target COD.</param>
    /// <returns>Calibration result with updated coefficients and ratio statistics.</returns>
    [HttpPost("calibrate")]
    [ProducesResponseType(typeof(ModelCalibrationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ModelCalibrationResult>> CalibrateModel([FromBody] ModelCalibrationRequest request)
    {
      try
      {
        _logger.LogInformation(
            "Calibrating mass appraisal model: ModelId={ModelId}, SalesPeriodMonths={Months}",
            request.ModelId, request.SalesPeriodMonths);

        var result = await _massAppraisalService.CalibrateModelAsync(request);
        return Ok(result);
      }
      catch (ArgumentException ex)
      {
        _logger.LogWarning(ex, "Invalid calibration request");
        return BadRequest(new { error = ex.Message });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Model calibration failed for ModelId={ModelId}", request.ModelId);
        return StatusCode(500, new { error = "Model calibration failed. Contact system administrator." });
      }
    }

    /// <summary>
    /// Retrieve ratio study results for a specific appraisal model.
    /// Returns IAAO-standard statistics: median ratio, COD, COV, PRD, and PRB.
    /// </summary>
    /// <param name="modelId">The unique identifier of the appraisal model.</param>
    /// <returns>Ratio study with uniformity and equity statistics.</returns>
    [HttpGet("ratio-study/{modelId}")]
    [ProducesResponseType(typeof(RatioStudyResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RatioStudyResult>> GetRatioStudy(string modelId)
    {
      try
      {
        _logger.LogInformation("Retrieving ratio study for ModelId={ModelId}", modelId);

        var result = await _massAppraisalService.GetRatioStudyAsync(modelId);
        if (result == null)
          return NotFound(new { error = $"No ratio study found for model '{modelId}'." });

        return Ok(result);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to retrieve ratio study for ModelId={ModelId}", modelId);
        return Ok(new RatioStudyResult());
      }
    }

    /// <summary>
    /// List all available mass appraisal models for the current county.
    /// Includes model metadata, last calibration date, and performance metrics.
    /// </summary>
    /// <returns>List of appraisal models with summary statistics.</returns>
    [AllowAnonymous]
    [HttpGet("models")]
    [ProducesResponseType(typeof(IEnumerable<AppraisalModelSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppraisalModelSummary>>> ListModels()
    {
      try
      {
        _logger.LogInformation("Listing available mass appraisal models");

        var models = await _massAppraisalService.ListModelsAsync();
        return Ok(models);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to list mass appraisal models");
        return Ok(Enumerable.Empty<AppraisalModelSummary>());
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  Wave 4A — Forge Statistics Endpoints (strata, outliers, compare, segments)
    // ══════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET api/massappraisal/ratio-study/{modelId}/strata —
    /// Strata breakdown by neighborhood × property type for a given model.
    /// </summary>
    [HttpGet("ratio-study/{modelId}/strata")]
    [ProducesResponseType(typeof(List<StrataResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<StrataResultDto>>> GetStrata(string modelId)
    {
      try
      {
        var countyId = await ResolveCountyIdAsync();
        var strata = await _statisticsService.GetStrataAsync(modelId, countyId);
        return Ok(strata);
      }
      catch (CountyNotFoundException ex)
      {
        return BadRequest(new { error = ex.Message, field = "countyId" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to retrieve strata for ModelId={ModelId}", modelId);
        return Ok(new List<StrataResultDto>());
      }
    }

    /// <summary>
    /// GET api/massappraisal/ratio-study/{modelId}/outliers —
    /// Flagged outlier parcels for a given model (IQR / trim methods).
    /// </summary>
    [HttpGet("ratio-study/{modelId}/outliers")]
    [ProducesResponseType(typeof(List<OutlierRecordDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<OutlierRecordDto>>> GetOutliers(string modelId)
    {
      try
      {
        var countyId = await ResolveCountyIdAsync();
        var outliers = await _statisticsService.GetOutliersAsync(modelId, countyId);
        return Ok(outliers);
      }
      catch (CountyNotFoundException ex)
      {
        return BadRequest(new { error = ex.Message, field = "countyId" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to retrieve outliers for ModelId={ModelId}", modelId);
        return Ok(new List<OutlierRecordDto>());
      }
    }

    /// <summary>
    /// POST api/massappraisal/compare — Compare two appraisal models.
    /// Returns delta metrics and improved/degraded classification.
    /// </summary>
    [HttpPost("compare")]
    [ProducesResponseType(typeof(ModelComparisonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ModelComparisonDto>> CompareModels([FromBody] CompareModelsRequest request)
    {
      if (string.IsNullOrWhiteSpace(request.ModelIdA) || string.IsNullOrWhiteSpace(request.ModelIdB))
        return BadRequest(new { error = "Both ModelIdA and ModelIdB are required." });

      try
      {
        var countyId = await ResolveCountyIdAsync();
        var comparison = await _statisticsService.CompareModelsAsync(request, countyId);
        return Ok(comparison);
      }
      catch (CountyNotFoundException ex)
      {
        return BadRequest(new { error = ex.Message, field = "countyId" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to compare models {A} vs {B}", request.ModelIdA, request.ModelIdB);
        return Ok(new ModelComparisonDto());
      }
    }

    /// <summary>
    /// GET api/massappraisal/segments/{modelId} — Discover property segments
    /// using deterministic neighborhood grouping.
    /// </summary>
    [HttpGet("segments/{modelId}")]
    [ProducesResponseType(typeof(List<DiscoveredSegmentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DiscoveredSegmentDto>>> DiscoverSegments(string modelId)
    {
      try
      {
        var countyId = await ResolveCountyIdAsync();
        var segments = await _statisticsService.DiscoverSegmentsAsync(modelId, countyId);
        return Ok(segments);
      }
      catch (CountyNotFoundException ex)
      {
        return BadRequest(new { error = ex.Message, field = "countyId" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to discover segments for ModelId={ModelId}", modelId);
        return Ok(new List<DiscoveredSegmentDto>());
      }
    }
  }

  // DTOs for mass appraisal operations

  /// <summary>Request to execute a mass appraisal model run.</summary>
  public class MassAppraisalRunRequest
  {
    /// <summary>Valuation approach: Cost, SalesComparison, or Income.</summary>
    public string ApproachType { get; set; } = string.Empty;
    /// <summary>Property class filter (e.g., Residential, Commercial, Agricultural).</summary>
    public string? PropertyClass { get; set; }
    /// <summary>Neighborhood code filter.</summary>
    public string? NeighborhoodCode { get; set; }
    /// <summary>Assessment year for the model run.</summary>
    public int AssessmentYear { get; set; }
  }

  /// <summary>Result of a mass appraisal model execution.</summary>
  public class MassAppraisalRunResult
  {
    public string RunId { get; set; } = string.Empty;
    public int ParcelsProcessed { get; set; }
    public int ParcelsValued { get; set; }
    public decimal MedianAssessedValue { get; set; }
    public decimal TotalAssessedValue { get; set; }
    public DateTime CompletedAt { get; set; }
    public string Status { get; set; } = string.Empty;
  }

  /// <summary>Request to calibrate a mass appraisal model.</summary>
  public class ModelCalibrationRequest
  {
    public string ModelId { get; set; } = string.Empty;
    /// <summary>Number of months of sales data to use for calibration.</summary>
    public int SalesPeriodMonths { get; set; } = 12;
    /// <summary>Target coefficient of dispersion.</summary>
    public decimal? TargetCOD { get; set; }
  }

  /// <summary>Result of model calibration with updated statistics.</summary>
  public class ModelCalibrationResult
  {
    public string ModelId { get; set; } = string.Empty;
    public int SalesUsed { get; set; }
    public decimal MedianRatio { get; set; }
    public decimal COD { get; set; }
    public decimal PRD { get; set; }
    public DateTime CalibratedAt { get; set; }
    public string Status { get; set; } = string.Empty;
  }

  /// <summary>IAAO-standard ratio study results.</summary>
  public class RatioStudyResult
  {
    public string ModelId { get; set; } = string.Empty;
    public int SampleSize { get; set; }
    public decimal MedianRatio { get; set; }
    public decimal MeanRatio { get; set; }
    public decimal WeightedMeanRatio { get; set; }
    /// <summary>Coefficient of Dispersion - measures uniformity.</summary>
    public decimal COD { get; set; }
    /// <summary>Coefficient of Variation.</summary>
    public decimal COV { get; set; }
    /// <summary>Price-Related Differential - measures vertical equity.</summary>
    public decimal PRD { get; set; }
    /// <summary>Price-Related Bias coefficient.</summary>
    public decimal PRB { get; set; }
    public DateTime AsOfDate { get; set; }
  }

  /// <summary>Summary of an appraisal model.</summary>
  public class AppraisalModelSummary
  {
    public string ModelId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ApproachType { get; set; } = string.Empty;
    public string PropertyClass { get; set; } = string.Empty;
    public DateTime? LastCalibrated { get; set; }
    public decimal? LastCOD { get; set; }
    public string Status { get; set; } = string.Empty;
  }

  /// <summary>Service interface for mass appraisal operations.</summary>
  public interface IMassAppraisalService
  {
    Task<MassAppraisalRunResult> RunModelAsync(MassAppraisalRunRequest request);
    Task<ModelCalibrationResult> CalibrateModelAsync(ModelCalibrationRequest request);
    Task<RatioStudyResult?> GetRatioStudyAsync(string modelId);
    Task<IEnumerable<AppraisalModelSummary>> ListModelsAsync();
  }

  /// <summary>
  /// Explicit unavailable implementation for mass appraisal operations.
  /// Keeps the API host wired without inventing appraisal models or ratio-study results.
  /// </summary>
  internal sealed class UnavailableMassAppraisalService : IMassAppraisalService
  {
    public Task<IEnumerable<AppraisalModelSummary>> ListModelsAsync() =>
        Task.FromResult(Enumerable.Empty<AppraisalModelSummary>());

    public Task<RatioStudyResult?> GetRatioStudyAsync(string modelId) =>
        Task.FromResult<RatioStudyResult?>(null);

    public Task<MassAppraisalRunResult> RunModelAsync(MassAppraisalRunRequest request) =>
        throw new NotSupportedException("Mass appraisal model execution is not available from a governed service.");

    public Task<ModelCalibrationResult> CalibrateModelAsync(ModelCalibrationRequest request) =>
        throw new NotSupportedException("Mass appraisal model calibration is not available from a governed service.");
  }
}
