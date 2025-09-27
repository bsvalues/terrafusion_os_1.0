using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Module Ecosystem Controller - API endpoints for module ecosystem management
    /// Provides comprehensive orchestration control for TerraFusion OS module system
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ModuleEcosystemController : ControllerBase
    {
        private readonly ILogger<ModuleEcosystemController> _logger;
        private readonly IModuleService _moduleService;

        public ModuleEcosystemController(
            ILogger<ModuleEcosystemController> logger,
            IModuleService moduleService)
        {
            _logger = logger;
            _moduleService = moduleService;
        }

        /// <summary>
        /// Get all registered modules in the ecosystem
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ModuleDto>>> GetAllModules()
        {
            try
            {
                var modules = await _moduleService.GetAllModulesAsync();
                return Ok(modules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all modules");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get module by ID
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ModuleDto>> GetModule(int id)
        {
            try
            {
                var module = await _moduleService.GetModuleByIdAsync(id);
                if (module == null)
                {
                    return NotFound($"Module with ID {id} not found");
                }
                return Ok(module);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving module {ModuleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get module health status
        /// </summary>
        [HttpGet("{id:int}/health")]
        public async Task<ActionResult<ModuleHealthDto>> GetModuleHealth(int id)
        {
            try
            {
                var health = await _moduleService.GetModuleHealthAsync(id);
                if (health == null)
                {
                    return NotFound($"Module with ID {id} not found");
                }
                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving module health {ModuleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Start a module
        /// </summary>
        [HttpPost("{id:int}/start")]
        [Authorize(Roles = "Admin,SystemOperator")]
        public async Task<ActionResult> StartModule(int id)
        {
            try
            {
                var result = await _moduleService.LaunchModuleAsync(id);
                if (!result)
                {
                    return BadRequest($"Failed to start module {id}");
                }
                return Ok($"Module {id} started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting module {ModuleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Stop a module
        /// </summary>
        [HttpPost("{id:int}/stop")]
        [Authorize(Roles = "Admin,SystemOperator")]
        public async Task<ActionResult> StopModule(int id)
        {
            try
            {
                var result = await _moduleService.StopModuleAsync(id);
                if (!result)
                {
                    return BadRequest($"Failed to stop module {id}");
                }
                return Ok($"Module {id} stopped successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping module {ModuleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Restart a module
        /// </summary>
        [HttpPost("{id:int}/restart")]
        [Authorize(Roles = "Admin,SystemOperator")]
        public async Task<ActionResult> RestartModule(int id)
        {
            try
            {
                // Stop then start to simulate restart
                await _moduleService.StopModuleAsync(id);
                var result = await _moduleService.LaunchModuleAsync(id);
                if (!result)
                {
                    return BadRequest($"Failed to restart module {id}");
                }
                return Ok($"Module {id} restarted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restarting module {ModuleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
