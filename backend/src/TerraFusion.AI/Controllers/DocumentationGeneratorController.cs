/*
 * DocumentationGeneratorController - REST API for Documentation Generation
 *
 * Provides endpoints for automatic documentation generation,
 * docstring creation, and README generation.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 8 Day 2
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/ai/docs")]
    [Produces("application/json")]
    public class DocumentationGeneratorController : ControllerBase
    {
        private readonly IDocumentationGeneratorService _docService;
        private readonly ILogger<DocumentationGeneratorController> _logger;

        public DocumentationGeneratorController(
            IDocumentationGeneratorService docService,
            ILogger<DocumentationGeneratorController> logger)
        {
            _docService = docService;
            _logger = logger;
        }

        /// <summary>
        /// Generate documentation for code
        /// </summary>
        /// <param name="request">Documentation generation request</param>
        /// <returns>Generated documentation</returns>
        [HttpPost]
        [ProducesResponseType(typeof(DocumentationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GenerateDocumentation([FromBody] DocumentationRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Code))
                {
                    return BadRequest(new { error = "Code is required" });
                }

                _logger.LogInformation("Generating {Type} documentation", request.DocumentationType);

                var result = await _docService.GenerateDocumentationAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating documentation");
                return StatusCode(500, new { error = "Failed to generate documentation" });
            }
        }

        /// <summary>
        /// Generate docstring for a function
        /// </summary>
        /// <param name="request">Function code</param>
        /// <returns>Generated docstring</returns>
        [HttpPost("docstring")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        public async Task<IActionResult> GenerateDocstring([FromBody] DocstringRequest request)
        {
            try
            {
                var docstring = await _docService.GenerateDocstringAsync(
                    request.FunctionCode,
                    request.Language
                );

                return Ok(new { docstring });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating docstring");
                return StatusCode(500, new { error = "Failed to generate docstring" });
            }
        }

        /// <summary>
        /// Generate README for project
        /// </summary>
        /// <param name="request">Project code and name</param>
        /// <returns>Generated README content</returns>
        [HttpPost("readme")]
        [ProducesResponseType(typeof(ReadmeContent), StatusCodes.Status200OK)]
        public async Task<IActionResult> GenerateReadme([FromBody] ReadmeRequest request)
        {
            try
            {
                var readme = await _docService.GenerateReadmeAsync(
                    request.Code,
                    request.ProjectName
                );

                return Ok(readme);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating README");
                return StatusCode(500, new { error = "Failed to generate README" });
            }
        }

        /// <summary>
        /// Analyze module structure
        /// </summary>
        /// <param name="request">Module code</param>
        /// <returns>Module documentation analysis</returns>
        [HttpPost("analyze")]
        [ProducesResponseType(typeof(ModuleDocumentation), StatusCodes.Status200OK)]
        public async Task<IActionResult> AnalyzeModule([FromBody] ModuleAnalysisRequest request)
        {
            try
            {
                var module = await _docService.AnalyzeModuleAsync(
                    request.Code,
                    request.Language
                );

                return Ok(module);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing module");
                return StatusCode(500, new { error = "Failed to analyze module" });
            }
        }
    }

    // ==================== REQUEST MODELS ====================

    public class DocstringRequest
    {
        public string FunctionCode { get; set; } = string.Empty;
        public string Language { get; set; } = "python";
    }

    public class ReadmeRequest
    {
        public string Code { get; set; } = string.Empty;
        public string ProjectName { get; set; } = "Project";
    }

    public class ModuleAnalysisRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = "python";
    }
}
