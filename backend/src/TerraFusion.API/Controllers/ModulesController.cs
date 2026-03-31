using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly IModuleService _moduleService;
    private readonly ILogger<ModulesController> _logger;

    public ModulesController(IModuleService moduleService, ILogger<ModulesController> logger)
    {
        _moduleService = moduleService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetModules()
    {
        try
        {
            var modules = await _moduleService.GetAllModulesAsync();
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ModuleDto>> GetModule(int id)
    {
        try
        {
            var module = await _moduleService.GetModuleByIdAsync(id);
            if (module == null)
                return NotFound();

            return Ok(module);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving module {ModuleId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("by-name/{name}")]
    public async Task<ActionResult<ModuleDto>> GetModuleByName(string name)
    {
        try
        {
            var module = await _moduleService.GetModuleByNameAsync(name);
            if (module == null)
                return NotFound();

            return Ok(module);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving module {ModuleName}", name);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("tier/{tier}")]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetModulesByTier(string tier)
    {
        try
        {
            var modules = await _moduleService.GetModulesByTierAsync(tier);
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules by tier {Tier}", tier);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetActiveModules()
    {
        try
        {
            var modules = await _moduleService.GetActiveModulesAsync();
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active modules");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<ModuleDto>> CreateModule(CreateModuleDto createDto)
    {
        try
        {
            var module = await _moduleService.CreateModuleAsync(createDto);
            return CreatedAtAction(nameof(GetModule), new { id = module.Id }, module);
        }
        catch (NotSupportedException ex)
        {
            _logger.LogWarning(ex, "Module creation is not supported by the runtime-backed module catalog");
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating module");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ModuleDto>> UpdateModule(int id, UpdateModuleDto updateDto)
    {
        try
        {
            var module = await _moduleService.UpdateModuleAsync(id, updateDto);
            if (module == null)
                return NotFound();

            return Ok(module);
        }
        catch (NotSupportedException ex)
        {
            _logger.LogWarning(ex, "Module updates are not supported by the runtime-backed module catalog");
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating module {ModuleId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteModule(int id)
    {
        try
        {
            var result = await _moduleService.DeleteModuleAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
        catch (NotSupportedException ex)
        {
            _logger.LogWarning(ex, "Module deletion is not supported by the runtime-backed module catalog");
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting module {ModuleId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/launch")]
    public async Task<ActionResult> LaunchModule(int id)
    {
        try
        {
            var result = await _moduleService.LaunchModuleAsync(id);
            if (!result)
                return BadRequest("Failed to launch module");

            return Ok(new { message = "Module launched successfully" });
        }
        catch (NotSupportedException ex)
        {
            _logger.LogWarning(ex, "Module launch mutation is not supported by the runtime-backed module catalog");
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error launching module {ModuleId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/stop")]
    public async Task<ActionResult> StopModule(int id)
    {
        try
        {
            var result = await _moduleService.StopModuleAsync(id);
            if (!result)
                return BadRequest("Failed to stop module");

            return Ok(new { message = "Module stopped successfully" });
        }
        catch (NotSupportedException ex)
        {
            _logger.LogWarning(ex, "Module stop mutation is not supported by the runtime-backed module catalog");
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping module {ModuleId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}/health")]
    public async Task<ActionResult<ModuleHealthDto>> GetModuleHealth(int id)
    {
        try
        {
            var health = await _moduleService.GetModuleHealthAsync(id);
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving module health {ModuleId}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
