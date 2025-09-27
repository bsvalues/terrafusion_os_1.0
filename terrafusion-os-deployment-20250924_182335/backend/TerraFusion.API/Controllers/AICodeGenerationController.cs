using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// AI Code Generation API Controller
    /// Exposes AI-powered code generation capabilities for TerraFusion IDE
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AICodeGenerationController : ControllerBase
    {
        private readonly ILogger<AICodeGenerationController> _logger;
        private readonly IAICodeGenerationService _codeGenService;

        public AICodeGenerationController(
            ILogger<AICodeGenerationController> logger,
            IAICodeGenerationService codeGenService)
        {
            _logger = logger;
            _codeGenService = codeGenService;
        }

        /// <summary>
        /// Generate code from natural language description
        /// </summary>
        [HttpPost("generate")]
        public async Task<ActionResult<CodeGenerationResult>> GenerateCode([FromBody] GenerateCodeRequest request)
        {
            try
            {
                var result = await _codeGenService.GenerateFromNaturalLanguageAsync(
                    request.Description, 
                    request.ModuleType);
                    
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate code");
                return StatusCode(500, new { error = "Code generation failed" });
            }
        }

        /// <summary>
        /// Get intelligent code completion suggestions
        /// </summary>
        [HttpPost("completion")]
        public async Task<ActionResult<CodeCompletionResult>> GetCodeCompletion([FromBody] CodeCompletionRequest request)
        {
            try
            {
                var result = await _codeGenService.GetCodeCompletionAsync(
                    request.PartialCode, 
                    request.Context);
                    
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get code completion");
                return StatusCode(500, new { error = "Code completion failed" });
            }
        }

        /// <summary>
        /// Automatically fix compilation errors
        /// </summary>
        [HttpPost("auto-fix")]
        public async Task<ActionResult<BugFixResult>> AutoFixBugs([FromBody] AutoFixRequest request)
        {
            try
            {
                var result = await _codeGenService.AutoFixBugsAsync(
                    request.Code, 
                    request.Errors);
                    
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-fix bugs");
                return StatusCode(500, new { error = "Auto-fix failed" });
            }
        }

        /// <summary>
        /// Optimize code for performance, readability, or compliance
        /// </summary>
        [HttpPost("optimize")]
        public async Task<ActionResult<OptimizationResult>> OptimizeCode([FromBody] OptimizeCodeRequest request)
        {
            try
            {
                var result = await _codeGenService.OptimizeCodeAsync(
                    request.Code, 
                    request.OptimizationType);
                    
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to optimize code");
                return StatusCode(500, new { error = "Code optimization failed" });
            }
        }

        /// <summary>
        /// Scaffold complete government module
        /// </summary>
        [HttpPost("scaffold")]
        public async Task<ActionResult<ModuleScaffoldResult>> ScaffoldModule([FromBody] ModuleScaffoldRequest request)
        {
            try
            {
                var result = await _codeGenService.ScaffoldCompleteModuleAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to scaffold module");
                return StatusCode(500, new { error = "Module scaffolding failed" });
            }
        }

        /// <summary>
        /// Generate code from visual workflow
        /// </summary>
        [HttpPost("workflow")]
        public async Task<ActionResult<WorkflowCodeResult>> GenerateWorkflowCode([FromBody] TerraFusion.Core.Services.WorkflowDefinition workflow)
        {
            try
            {
                var result = await _codeGenService.GenerateWorkflowCodeAsync(workflow);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate workflow code");
                return StatusCode(500, new { error = "Workflow code generation failed" });
            }
        }
    }

    #region Request Models

    public class GenerateCodeRequest
    {
        public string Description { get; set; } = string.Empty;
        public string ModuleType { get; set; } = "government";
    }

    public class CodeCompletionRequest
    {
        public string PartialCode { get; set; } = string.Empty;
        public string Context { get; set; } = string.Empty;
    }

    public class AutoFixRequest
    {
        public string Code { get; set; } = string.Empty;
        public string[] Errors { get; set; } = Array.Empty<string>();
    }

    public class OptimizeCodeRequest
    {
        public string Code { get; set; } = string.Empty;
        public string OptimizationType { get; set; } = "performance";
    }

    #endregion
}
