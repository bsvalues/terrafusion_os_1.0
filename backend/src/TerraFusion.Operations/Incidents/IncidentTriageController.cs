// =============================================================================
// Phase 39: Incident Triage Engine - API Controller
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// REST API endpoint for incident triage operations.
// =============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// API controller for incident triage operations.
/// Provides REST endpoints for triaging alerts into structured incidents.
/// </summary>
/// <remarks>
/// Endpoint: POST /api/ops/incidents/triage
///
/// Security:
/// - Requires authentication (government operations)
/// - Rate limited to prevent abuse
/// - Audit logged for compliance
/// </remarks>
[ApiController]
[Route("api/ops/incidents")]
[Authorize]
public class IncidentTriageController : ControllerBase
{
    private readonly IIncidentTriageEngine _triageEngine;
    private readonly IIncidentExplanationService _explanationService;
    private readonly IOptions<IncidentTriageOptions> _triageOptions;
    private readonly ILogger<IncidentTriageController> _logger;

    /// <summary>
    /// Initializes a new instance of the IncidentTriageController.
    /// </summary>
    public IncidentTriageController(
        IIncidentTriageEngine triageEngine,
        IIncidentExplanationService explanationService,
        IOptions<IncidentTriageOptions> triageOptions,
        ILogger<IncidentTriageController> logger)
    {
        _triageEngine = triageEngine ?? throw new ArgumentNullException(nameof(triageEngine));
        _explanationService = explanationService ?? throw new ArgumentNullException(nameof(explanationService));
        _triageOptions = triageOptions ?? throw new ArgumentNullException(nameof(triageOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Triages incoming alerts into a structured incident summary.
    /// </summary>
    /// <param name="request">The triage request containing alerts and optional context.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A structured incident summary with classification and recommendations.</returns>
    /// <response code="200">Triage completed successfully.</response>
    /// <response code="400">Invalid request (missing alerts, malformed payload).</response>
    /// <response code="500">Triage engine failure.</response>
    [HttpPost("triage")]
    [ProducesResponseType(typeof(IncidentSummary), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IncidentSummary>> TriageAsync(
        [FromBody] IncidentTriageRequest request,
        CancellationToken cancellationToken)
    {
        // Validate request
        if (request == null)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = "Request body is required.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        if (!request.IsValid(out var errorMessage))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = errorMessage,
                Status = StatusCodes.Status400BadRequest
            });
        }

        try
        {
            _logger.LogInformation(
                "Starting incident triage for {AlertCount} alerts",
                request.Alerts.Count);

            // Step 1: Deterministic triage
            var incident = await _triageEngine.TriageAsync(request, cancellationToken);

            // Step 2: Optional LLM enrichment
            if (_triageOptions.Value.EnableLlmExplanation)
            {
                try
                {
                    incident = await _explanationService.EnrichWithExplanationAsync(
                        incident,
                        new IncidentExplanationOptions(),
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    // LLM failure is non-fatal - log and continue with deterministic result
                    _logger.LogWarning(ex,
                        "LLM explanation failed for incident {IncidentId}, using deterministic result",
                        incident.IncidentId);
                }
            }

            _logger.LogInformation(
                "Incident triage completed: {IncidentId} - Severity: {Severity}, Counties: {CountyCount}",
                incident.IncidentId,
                incident.OverallSeverity,
                incident.ImpactedCountyIds.Count);

            return Ok(incident);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid triage request");
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Request",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Incident triage failed");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Triage Engine Failure",
                Detail = "An error occurred during incident triage. Please try again.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Health check for the triage engine.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Health status of the triage engine.</returns>
    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TriageHealthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TriageHealthResponse>> HealthAsync(
        CancellationToken cancellationToken)
    {
        var llmAvailable = await _explanationService.IsAvailableAsync(cancellationToken);

        return Ok(new TriageHealthResponse
        {
            Status = "Healthy",
            EngineVersion = _triageOptions.Value.EngineVersion,
            LlmExplanationEnabled = _triageOptions.Value.EnableLlmExplanation,
            LlmExplanationAvailable = llmAvailable
        });
    }
}

/// <summary>
/// Health response for the triage engine.
/// </summary>
public record TriageHealthResponse
{
    /// <summary>
    /// Overall health status.
    /// </summary>
    public required string Status { get; init; }

    /// <summary>
    /// Triage engine version.
    /// </summary>
    public required string EngineVersion { get; init; }

    /// <summary>
    /// Whether LLM explanation is enabled in configuration.
    /// </summary>
    public bool LlmExplanationEnabled { get; init; }

    /// <summary>
    /// Whether LLM explanation service is currently available.
    /// </summary>
    public bool LlmExplanationAvailable { get; init; }
}
