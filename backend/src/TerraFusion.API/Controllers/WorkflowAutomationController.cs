/*
 * ═══════════════════════════════════════════════════════════════
 * WORKFLOW AUTOMATION CONTROLLER - REST API
 * TerraFusion OS Workflow API Gateway
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.AI.Services;
using TerraFusion.AI.DTOs;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkflowAutomationController : ControllerBase
    {
        private readonly ILogger<WorkflowAutomationController> _logger;
        private readonly IWorkflowAutomationService _workflowService;

        public WorkflowAutomationController(
            ILogger<WorkflowAutomationController> logger,
            IWorkflowAutomationService workflowService)
        {
            _logger = logger;
            _workflowService = workflowService;
        }

        /// <summary>
        /// Execute a workflow with AI optimization
        /// </summary>
        [HttpPost("execute")]
        [ProducesResponseType(typeof(TerraFusion.AI.DTOs.WorkflowExecutionResult), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> ExecuteWorkflow([FromBody] ExecuteWorkflowRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "Executing workflow {WorkflowId} for county {CountyId}",
                    request.WorkflowId, request.CountyId);

                var result = await _workflowService.ExecuteWorkflowAsync(
                    request.WorkflowId,
                    request.CountyId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing workflow");
                return StatusCode(500, new { error = "Failed to execute workflow" });
            }
        }

        /// <summary>
        /// Get available workflows for department
        /// </summary>
        [HttpGet("workflows/{department}")]
        [ProducesResponseType(typeof(List<WorkflowDefinition>), 200)]
        public async Task<IActionResult> GetWorkflows(string department)
        {
            try
            {
                var workflows = await _workflowService.GetAvailableWorkflowsAsync(department);
                return Ok(workflows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting workflows");
                return StatusCode(500, new { error = "Failed to retrieve workflows" });
            }
        }

        /// <summary>
        /// Get workflow execution status
        /// </summary>
        [HttpGet("status/{executionId}")]
        [ProducesResponseType(typeof(WorkflowStatus), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetWorkflowStatus(string executionId, [FromQuery] string workflowId)
        {
            try
            {
                var status = await _workflowService.GetWorkflowStatusAsync(workflowId, executionId);

                if (status == null)
                {
                    return NotFound(new { error = "Workflow execution not found" });
                }

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting workflow status");
                return StatusCode(500, new { error = "Failed to retrieve status" });
            }
        }

        /// <summary>
        /// Analyze workflow efficiency and get optimization suggestions
        /// </summary>
        [HttpPost("analyze")]
        [ProducesResponseType(typeof(WorkflowOptimizationSuggestion), 200)]
        public async Task<IActionResult> AnalyzeWorkflow([FromBody] AnalyzeWorkflowRequest request)
        {
            try
            {
                var suggestion = await _workflowService.AnalyzeWorkflowEfficiencyAsync(
                    request.WorkflowId,
                    request.CountyId);

                return Ok(suggestion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing workflow");
                return StatusCode(500, new { error = "Failed to analyze workflow" });
            }
        }

        /// <summary>
        /// Health check endpoint
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult Health()
        {
            return Ok(new
            {
                service = "WorkflowAutomation",
                status = "operational",
                timestamp = DateTime.UtcNow,
                quantumOptimizationFactor = 949,
                message = "Government. Transcended."
            });
        }
    }

    // Request models
    public class ExecuteWorkflowRequest
    {
        public required string WorkflowId { get; set; }
        public required string CountyId { get; set; }
        public required Dictionary<string, object> Parameters { get; set; }
    }

    public class AnalyzeWorkflowRequest
    {
        public required string WorkflowId { get; set; }
        public required string CountyId { get; set; }
    }
}
