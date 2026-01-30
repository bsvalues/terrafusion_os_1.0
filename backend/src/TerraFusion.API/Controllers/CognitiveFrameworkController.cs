using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Services;
using TerraFusion.Abstractions.DTOs;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// TIER 5+ AI Enhancement: 3-6-9-12 Cognitive Framework API
    /// RESTful endpoints for task classification and phase management
    /// Supports Individual (3) → Team (6) → Platform (9) → Organization (12) cognitive patterns
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class CognitiveFrameworkController : ControllerBase
    {
        private readonly ICognitiveFrameworkService _cognitiveFrameworkService;
        private readonly ILogger<CognitiveFrameworkController> _logger;

        public CognitiveFrameworkController(
            ICognitiveFrameworkService cognitiveFrameworkService,
            ILogger<CognitiveFrameworkController> logger)
        {
            _cognitiveFrameworkService = cognitiveFrameworkService ?? throw new ArgumentNullException(nameof(cognitiveFrameworkService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Classify task complexity using 3-6-9-12 cognitive framework
        /// Determines appropriate tier (1-4) and phase count (3/6/9/12)
        /// </summary>
        /// <param name="assessment">Task assessment data</param>
        /// <returns>Classification result with tier, phases, and execution plan</returns>
        [HttpPost("classify")]
        [ProducesResponseType(typeof(TaskClassificationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TaskClassificationResult>> ClassifyTask([FromBody] TaskAssessment assessment)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid task assessment model state");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Classifying task: {TaskTitle} using 3-6-9-12 framework", assessment.TaskTitle);

                var result = await _cognitiveFrameworkService.ClassifyTaskAsync(assessment);

                _logger.LogInformation("Task classified as TIER {Tier} ({Phases} phases): {Category}",
                    result.Tier, result.Phases, result.Category);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid task assessment parameters");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error classifying task: {TaskTitle}", assessment?.TaskTitle ?? "Unknown");
                return StatusCode(500, "Internal server error occurred while classifying task");
            }
        }

        /// <summary>
        /// Generate phase execution plan for specified tier
        /// Returns cognitive-optimized phase structure with checklists and deliverables
        /// </summary>
        /// <param name="tier">Cognitive tier (1-4)</param>
        /// <param name="taskId">Unique task identifier</param>
        /// <returns>Complete phase execution plan with cognitive optimizations</returns>
        [HttpPost("execution-plan/{tier:int}")]
        [ProducesResponseType(typeof(PhaseExecutionPlan), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<PhaseExecutionPlan>> GenerateExecutionPlan(
            [Range(1, 4)] int tier,
            [FromQuery] [Required] string taskId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(taskId))
                {
                    return BadRequest("Task ID is required");
                }

                _logger.LogInformation("Generating TIER {Tier} execution plan for task: {TaskId}", tier, taskId);

                var plan = await _cognitiveFrameworkService.GeneratePhaseExecutionPlanAsync(tier, taskId);

                _logger.LogInformation("Generated execution plan with {PhaseCount} phases and {OptimizationCount} cognitive optimizations",
                    plan.Phases.Count, plan.CognitiveOptimizations.Count);

                return Ok(plan);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid tier or task ID");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating execution plan for TIER {Tier}, task: {TaskId}", tier, taskId);
                return StatusCode(500, "Internal server error occurred while generating execution plan");
            }
        }

        /// <summary>
        /// Evaluate confidence gate for phase progression
        /// Prevents "Never 3 of 6" violations by enforcing confidence thresholds
        /// </summary>
        /// <param name="taskId">Task identifier</param>
        /// <param name="phase">Phase number (1-12)</param>
        /// <param name="confidence">Confidence level (0.0-1.0)</param>
        /// <returns>Gate evaluation result with pass/fail and recommendations</returns>
        [HttpPost("confidence-gate")]
        [ProducesResponseType(typeof(ConfidenceGateResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ConfidenceGateResult>> EvaluateConfidenceGate(
            [FromQuery] [Required] string taskId,
            [FromQuery] [Range(1, 12)] int phase,
            [FromQuery] [Range(0.0, 1.0)] double confidence)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(taskId))
                {
                    return BadRequest("Task ID is required");
                }

                _logger.LogInformation("Evaluating confidence gate for task {TaskId}, Phase {Phase}: {Confidence}%",
                    taskId, phase, confidence * 100);

                var result = await _cognitiveFrameworkService.EvaluateConfidenceGateAsync(taskId, phase, confidence);

                if (result.IsPassing)
                {
                    _logger.LogInformation("Confidence gate PASSED for task {TaskId}, Phase {Phase}", taskId, phase);
                }
                else
                {
                    _logger.LogWarning("Confidence gate FAILED for task {TaskId}, Phase {Phase}. Required: {Required}%, Actual: {Actual}%",
                        taskId, phase, result.RequiredConfidence * 100, result.ActualConfidence * 100);
                }

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid confidence gate parameters");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating confidence gate for task {TaskId}, phase {Phase}", taskId, phase);
                return StatusCode(500, "Internal server error occurred while evaluating confidence gate");
            }
        }

        /// <summary>
        /// Validate phase completion before allowing progression
        /// Ensures all deliverables, checklists, and confidence requirements are met
        /// </summary>
        /// <param name="taskId">Task identifier</param>
        /// <param name="phase">Phase number (1-12)</param>
        /// <param name="completionData">Phase completion data with deliverables and confidence</param>
        /// <returns>Validation result indicating if phase can be marked complete</returns>
        [HttpPost("validate-completion")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<bool>> ValidatePhaseCompletion(
            [FromQuery] [Required] string taskId,
            [FromQuery] [Range(1, 12)] int phase,
            [FromBody] PhaseCompletionData completionData)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(taskId))
                {
                    return BadRequest("Task ID is required");
                }

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid phase completion data model state");
                    return BadRequest(ModelState);
                }

                _logger.LogInformation("Validating phase completion for task {TaskId}, Phase {Phase}", taskId, phase);

                var isValid = await _cognitiveFrameworkService.ValidatePhaseCompletionAsync(taskId, phase, completionData);

                if (isValid)
                {
                    _logger.LogInformation("Phase completion validation PASSED for task {TaskId}, Phase {Phase}", taskId, phase);
                }
                else
                {
                    _logger.LogWarning("Phase completion validation FAILED for task {TaskId}, Phase {Phase}", taskId, phase);
                }

                return Ok(isValid);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid phase completion parameters");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating phase completion for task {TaskId}, phase {Phase}", taskId, phase);
                return StatusCode(500, "Internal server error occurred while validating phase completion");
            }
        }

        /// <summary>
        /// Get cognitive framework effectiveness metrics
        /// Provides insights into framework adoption, success rates, and cognitive health
        /// </summary>
        /// <param name="startDate">Start date for metrics (optional, defaults to 30 days ago)</param>
        /// <param name="endDate">End date for metrics (optional, defaults to today)</param>
        /// <returns>Framework metrics including completion rates, confidence accuracy, cognitive load</returns>
        [HttpGet("metrics")]
        [ProducesResponseType(typeof(List<CognitiveMetrics>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<CognitiveMetrics>>> GetFrameworkMetrics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                if (start > end)
                {
                    return BadRequest("Start date cannot be after end date");
                }

                if ((end - start).TotalDays > 365)
                {
                    return BadRequest("Date range cannot exceed 365 days");
                }

                _logger.LogInformation("Retrieving cognitive framework metrics from {StartDate} to {EndDate}", start, end);

                var metrics = await _cognitiveFrameworkService.GetFrameworkMetricsAsync(start, end);

                _logger.LogInformation("Retrieved {MetricCount} cognitive framework metrics", metrics.Count);

                return Ok(metrics);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid metrics parameters");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cognitive framework metrics");
                return StatusCode(500, "Internal server error occurred while retrieving metrics");
            }
        }

        /// <summary>
        /// Get framework tier definitions and decision criteria
        /// Provides reference information for understanding when to use each tier
        /// </summary>
        /// <returns>Complete tier definitions with decision criteria</returns>
        [HttpGet("tier-definitions")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public ActionResult GetTierDefinitions()
        {
            try
            {
                var definitions = new
                {
                    Framework = "3-6-9-12 Cognitive Framework",
                    Principle = "Never 3 of 6, Never 6 of 12 - Complete cognitive cycles only",
                    Version = "2.0",
                    Tiers = new[]
                    {
                        new
                        {
                            Tier = 1,
                            Phases = 3,
                            Name = "Individual",
                            Scope = "Component or fix",
                            Duration = "Hours to 1 day",
                            TeamSize = "1 person",
                            Focus = "Technical execution",
                            Examples = new[] { "Bug fixes", "Config changes", "Documentation updates", "Minor refactoring" },
                            PhaseNames = new[] { "UNDERSTAND", "EXECUTE", "CLOSE" }
                        },
                        new
                        {
                            Tier = 2,
                            Phases = 6,
                            Name = "Team",
                            Scope = "Feature or service",
                            Duration = "2-5 days",
                            TeamSize = "2-5 people",
                            Focus = "Design + integration",
                            Examples = new[] { "API endpoints", "UI components", "Integration work", "Performance tuning" },
                            PhaseNames = new[] { "CLARIFY", "RESEARCH", "DESIGN", "BUILD", "VERIFY", "OPERATE" }
                        },
                        new
                        {
                            Tier = 3,
                            Phases = 9,
                            Name = "Platform",
                            Scope = "Platform or system",
                            Duration = "1-4 weeks",
                            TeamSize = "10-30 people",
                            Focus = "Architecture + operations",
                            Examples = new[] { "Microservices", "Data pipelines", "Infrastructure migration", "Compliance frameworks" },
                            PhaseNames = new[] { "DISCOVERY", "LANDSCAPE", "STRATEGIC_DESIGN", "THREAT_MODELING", "DETAILED_PLANNING", "ITERATIVE_BUILD", "STAGED_ROLLOUT", "OPTIMIZATION", "INSTITUTIONALIZATION" }
                        },
                        new
                        {
                            Tier = 4,
                            Phases = 12,
                            Name = "Transformation",
                            Scope = "Organizational change",
                            Duration = "3-12 months",
                            TeamSize = "100+ people",
                            Focus = "Technical + behavioral + cultural",
                            Examples = new[] { "Agency digital transformation", "Government-wide process change", "AI adoption across departments", "Cultural shift to cloud-first" },
                            PhaseNames = new[] { "ASSESS_CURRENT", "ENVISION_FUTURE", "MAP_JOURNEY", "SECURE_LEADERSHIP", "ARCHITECT_SOLUTION", "DESIGN_CHANGE", "PILOT_VALIDATE", "SCALE_STABILIZE", "OPTIMIZE_EMBED", "TRANSFER_OWNERSHIP", "MEASURE_SUSTAIN", "EVOLVE_INNOVATE" }
                        }
                    },
                    DecisionCriteria = new
                    {
                        UseTier4When = new[]
                        {
                            "100+ people need to change behavior",
                            "Multiple departments/agencies involved",
                            "New processes replace existing workflows",
                            "Training programs required at scale",
                            "Cultural resistance expected",
                            "Executive sponsorship critical",
                            "Timeline measured in quarters",
                            "Political navigation required"
                        },
                        NeverUseTier4When = new[]
                        {
                            "Only technical delivery needed",
                            "Single team can execute",
                            "No process or behavior change",
                            "Timeline is weeks/months",
                            "No resistance to adoption expected"
                        },
                        LitmusTest = "If you removed all technology and just focused on getting people to work differently, would you still have a massive project? If YES → TIER 4"
                    },
                    ConfidenceGates = new
                    {
                        Tier1 = "97% after Phase 1",
                        Tier2 = "97% after Phase 3",
                        Tier3 = "97% after Phase 5",
                        Tier4 = "97% after Phase 6, then continuous validation"
                    },
                    CognitiveOptimizations = new[]
                    {
                        "Working memory protection (≤7 items per phase)",
                        "Progressive disclosure (show only current phase)",
                        "Completion psychology (clear phase boundaries)",
                        "Parallel execution (for Tier 3+)",
                        "Quarterly cadence (for Tier 4)"
                    }
                };

                _logger.LogInformation("Provided tier definitions for 3-6-9-12 cognitive framework");
                return Ok(definitions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tier definitions");
                return StatusCode(500, "Internal server error occurred while retrieving tier definitions");
            }
        }

        /// <summary>
        /// Health check endpoint for cognitive framework service
        /// </summary>
        /// <returns>Service health status</returns>
        [HttpGet("health")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public ActionResult GetHealth()
        {
            return Ok(new
            {
                Service = "CognitiveFramework",
                Status = "Healthy",
                Version = "2.0",
                Framework = "3-6-9-12",
                Timestamp = DateTime.UtcNow,
                Features = new[]
                {
                    "Task Classification",
                    "Phase Execution Planning",
                    "Confidence Gates",
                    "Completion Validation",
                    "Cognitive Metrics",
                    "Organizational Transformation"
                }
            });
        }
    }
}
