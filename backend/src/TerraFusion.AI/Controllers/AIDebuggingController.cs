/*
 * AIDebuggingController - REST API for AI Debugging Services
 *
 * Provides endpoints for intelligent code debugging, breakpoint analysis,
 * variable inspection, and execution path prediction.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 7 Day 1
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/ai/debug")]
    [Produces("application/json")]
    public class AIDebuggingController : ControllerBase
    {
        private readonly IAIDebuggingService _debuggingService;
        private readonly ILogger<AIDebuggingController> _logger;

        public AIDebuggingController(
            IAIDebuggingService debuggingService,
            ILogger<AIDebuggingController> logger)
        {
            _debuggingService = debuggingService;
            _logger = logger;
        }

        /// <summary>
        /// Analyze code for debugging with comprehensive AI assistance
        /// </summary>
        /// <param name="request">Debug analysis request with code, variables, and error details</param>
        /// <returns>Comprehensive debug analysis with suggestions, paths, and inspections</returns>
        [HttpPost("analyze")]
        [ProducesResponseType(typeof(DebugAnalysisResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> AnalyzeCode([FromBody] DebugAnalysisRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    return BadRequest(new { error = "Code is required" });
                }

                _logger.LogInformation("Analyzing code for debugging in {Language}", request.Language);

                var result = await _debuggingService.AnalyzeCodeAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing code for debugging");
                return StatusCode(500, new { error = "Failed to analyze code", details = ex.Message });
            }
        }

        /// <summary>
        /// Get debug suggestions for specific code and error
        /// </summary>
        /// <param name="request">Code and error message</param>
        /// <returns>List of debug suggestions</returns>
        [HttpPost("suggestions")]
        [ProducesResponseType(typeof(List<DebugSuggestion>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDebugSuggestions([FromBody] DebugSuggestionsRequest request)
        {
            try
            {
                var suggestions = await _debuggingService.GetDebugSuggestionsAsync(
                    request.Code,
                    request.ErrorMessage,
                    request.LineNumber
                );

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting debug suggestions");
                return StatusCode(500, new { error = "Failed to get suggestions" });
            }
        }

        /// <summary>
        /// Inspect variables in code context
        /// </summary>
        /// <param name="request">Code and variable values</param>
        /// <returns>Variable inspection results</returns>
        [HttpPost("inspect")]
        [ProducesResponseType(typeof(List<VariableInspection>), StatusCodes.Status200OK)]
        public async Task<IActionResult> InspectVariables([FromBody] VariableInspectionRequest request)
        {
            try
            {
                var inspections = await _debuggingService.InspectVariablesAsync(
                    request.Code,
                    request.Variables
                );

                return Ok(inspections);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inspecting variables");
                return StatusCode(500, new { error = "Failed to inspect variables" });
            }
        }

        /// <summary>
        /// Predict possible execution paths through code
        /// </summary>
        /// <param name="request">Code and initial variable values</param>
        /// <returns>Predicted execution paths</returns>
        [HttpPost("paths")]
        [ProducesResponseType(typeof(List<ExecutionPath>), StatusCodes.Status200OK)]
        public async Task<IActionResult> PredictPaths([FromBody] ExecutionPathRequest request)
        {
            try
            {
                var paths = await _debuggingService.PredictExecutionPathsAsync(
                    request.Code,
                    request.InitialValues
                );

                return Ok(paths);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting execution paths");
                return StatusCode(500, new { error = "Failed to predict paths" });
            }
        }

        /// <summary>
        /// Analyze breakpoint effectiveness and provide inspection suggestions
        /// </summary>
        /// <param name="request">Code and breakpoint line numbers</param>
        /// <returns>Breakpoint analysis results</returns>
        [HttpPost("breakpoints")]
        [ProducesResponseType(typeof(List<BreakpointAnalysis>), StatusCodes.Status200OK)]
        public async Task<IActionResult> AnalyzeBreakpoints([FromBody] BreakpointAnalysisRequest request)
        {
            try
            {
                var analyses = await _debuggingService.AnalyzeBreakpointsAsync(
                    request.Code,
                    request.Breakpoints
                );

                return Ok(analyses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing breakpoints");
                return StatusCode(500, new { error = "Failed to analyze breakpoints" });
            }
        }
    }

    // ==================== REQUEST MODELS ====================

    public class DebugSuggestionsRequest
    {
        public string Code { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public int? LineNumber { get; set; }
    }

    public class VariableInspectionRequest
    {
        public string Code { get; set; } = string.Empty;
        public Dictionary<string, object> Variables { get; set; } = new();
    }

    public class ExecutionPathRequest
    {
        public string Code { get; set; } = string.Empty;
        public Dictionary<string, object> InitialValues { get; set; } = new();
    }

    public class BreakpointAnalysisRequest
    {
        public string Code { get; set; } = string.Empty;
        public List<int> Breakpoints { get; set; } = new();
    }
}
