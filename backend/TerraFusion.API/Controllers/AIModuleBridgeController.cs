using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/modules/ai-bridge")]
    public class AIModuleBridgeController : ControllerBase
    {
        private readonly IAIModuleBridge _aiBridge;
        private readonly ILogger<AIModuleBridgeController> _logger;

        public AIModuleBridgeController(
            IAIModuleBridge aiBridge,
            ILogger<AIModuleBridgeController> logger)
        {
            _aiBridge = aiBridge;
            _logger = logger;
        }

        /// <summary>
        /// Request AI assistance for a module
        /// This is the main endpoint that modules use to get AI capabilities
        /// </summary>
        [HttpPost("request")]
        public async Task<ActionResult<AIBridgeResponse>> RequestAIAssistance([FromBody] AIBridgeRequest request)
        {
            try
            {
                var response = await _aiBridge.RequestAIAssistanceAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI assistance request");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Register a module for AI capabilities
        /// </summary>
        [HttpPost("register/{moduleId}")]
        public async Task<ActionResult<bool>> RegisterModule(string moduleId, [FromBody] ModuleAICapabilities capabilities)
        {
            try
            {
                var result = await _aiBridge.RegisterModuleForAIAsync(moduleId, capabilities);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering module {ModuleId}", moduleId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get a dedicated AI agent for a module
        /// </summary>
        [HttpPost("agent/{moduleId}")]
        public async Task<ActionResult<AIAgentAssignment>> GetDedicatedAgent(string moduleId, [FromBody] string task)
        {
            try
            {
                var assignment = await _aiBridge.GetDedicatedAgentAsync(moduleId, task);
                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning agent to module {ModuleId}", moduleId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get available AI capabilities for a module
        /// </summary>
        [HttpGet("capabilities/{moduleId}")]
        public async Task<ActionResult<List<AICapability>>> GetCapabilities(string moduleId)
        {
            try
            {
                var capabilities = await _aiBridge.GetAvailableCapabilitiesAsync(moduleId);
                return Ok(capabilities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting capabilities for module {ModuleId}", moduleId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Health check for AI bridge
        /// </summary>
        [HttpGet("health")]
        public ActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                service = "AI Module Bridge",
                description = "Bridge service connecting TerraFusion modules to AI orchestration layer"
            });
        }
    }
}