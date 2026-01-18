/**
 * SelfHealingController - REST API for Advanced Self-Healing Operations
 *
 * Provides comprehensive self-healing and recovery orchestration endpoints:
 * - Self-healing reports and metrics
 * - Recovery playbook management
 * - Rollback execution
 * - Recovery validation
 * - Decision tree analysis
 * - Historical recovery patterns
 * - Orchestrated recovery workflows
 * - Dependency graph management
 * - Impact analysis
 * - Cascade prevention
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 4.0.0 - Phase 4 Week 1 Day 5-7
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/self-healing")]
    [Produces("application/json")]
    public class SelfHealingController : ControllerBase
    {
        private readonly ISelfHealingEngine _selfHealingEngine;
        private readonly IAutoRecoveryOrchestrator _orchestrator;
        private readonly ILogger<SelfHealingController> _logger;

        public SelfHealingController(
            ISelfHealingEngine selfHealingEngine,
            IAutoRecoveryOrchestrator orchestrator,
            ILogger<SelfHealingController> logger)
        {
            _selfHealingEngine = selfHealingEngine;
            _orchestrator = orchestrator;
            _logger = logger;
        }

        /// <summary>
        /// Get comprehensive self-healing report
        /// </summary>
        /// <returns>Detailed self-healing report with metrics, playbooks, and history</returns>
        [HttpGet("report")]
        [ProducesResponseType(typeof(SelfHealingReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSelfHealingReport()
        {
            try
            {
                var report = await _selfHealingEngine.GetSelfHealingReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting self-healing report");
                return StatusCode(500, new { error = "Failed to get self-healing report" });
            }
        }

        /// <summary>
        /// Execute recovery for a specific subsystem
        /// </summary>
        /// <param name="request">Recovery request with subsystem, failure type, and severity</param>
        /// <returns>Recovery result with executed steps and health improvement</returns>
        [HttpPost("recover")]
        [ProducesResponseType(typeof(RecoveryResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ExecuteRecovery([FromBody] RecoveryRequest request)
        {
            try
            {
                _logger.LogInformation("Executing recovery for subsystem: {SubsystemId}, failure type: {FailureType}",
                    request.SubsystemId, request.FailureType);
                var result = await _selfHealingEngine.ExecuteRecoveryAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing recovery");
                return StatusCode(500, new { error = "Failed to execute recovery" });
            }
        }

        /// <summary>
        /// Get recovery playbook for a specific failure type
        /// </summary>
        /// <param name="failureType">Type of failure (e.g., Memory Exhaustion, Database Connection Failure)</param>
        /// <returns>Recovery playbook with steps and rollback strategy</returns>
        [HttpGet("playbooks/{failureType}")]
        [ProducesResponseType(typeof(RecoveryPlaybook), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRecoveryPlaybook(string failureType)
        {
            try
            {
                var playbook = await _selfHealingEngine.GetRecoveryPlaybookAsync(failureType);
                if (playbook == null)
                {
                    return NotFound(new { error = $"No playbook found for failure type: {failureType}" });
                }
                return Ok(playbook);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recovery playbook");
                return StatusCode(500, new { error = "Failed to get recovery playbook" });
            }
        }

        /// <summary>
        /// Execute rollback for a recovery operation
        /// </summary>
        /// <param name="recoveryId">ID of the recovery to roll back</param>
        /// <returns>Rollback result with steps and final health state</returns>
        [HttpPost("rollback/{recoveryId}")]
        [ProducesResponseType(typeof(RollbackResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ExecuteRollback(string recoveryId)
        {
            try
            {
                _logger.LogWarning("Executing rollback for recovery: {RecoveryId}", recoveryId);
                var result = await _selfHealingEngine.ExecuteRollbackAsync(recoveryId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing rollback");
                return StatusCode(500, new { error = "Failed to execute rollback" });
            }
        }

        /// <summary>
        /// Validate recovery for a subsystem
        /// </summary>
        /// <param name="subsystemId">ID of the subsystem to validate</param>
        /// <returns>Validation result with health checks and status</returns>
        [HttpPost("validate/{subsystemId}")]
        [ProducesResponseType(typeof(RecoveryValidationResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateRecovery(string subsystemId)
        {
            try
            {
                _logger.LogInformation("Validating recovery for subsystem: {SubsystemId}", subsystemId);
                var result = await _selfHealingEngine.ValidateRecoveryAsync(subsystemId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating recovery");
                return StatusCode(500, new { error = "Failed to validate recovery" });
            }
        }

        /// <summary>
        /// Get decision tree for a failure type
        /// </summary>
        /// <param name="failureType">Type of failure</param>
        /// <returns>Decision tree with recovery path recommendations</returns>
        [HttpGet("decision-tree/{failureType}")]
        [ProducesResponseType(typeof(RecoveryDecisionTree), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDecisionTree(string failureType)
        {
            try
            {
                var decisionTree = await _selfHealingEngine.GetDecisionTreeAsync(failureType);
                return Ok(decisionTree);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting decision tree");
                return StatusCode(500, new { error = "Failed to get decision tree" });
            }
        }

        /// <summary>
        /// Get historical recovery patterns for a subsystem
        /// </summary>
        /// <param name="subsystemId">ID of the subsystem</param>
        /// <returns>Historical recovery patterns with trends and effectiveness</returns>
        [HttpGet("patterns/{subsystemId}")]
        [ProducesResponseType(typeof(HistoricalRecoveryPattern), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRecoveryPatterns(string subsystemId)
        {
            try
            {
                var patterns = await _selfHealingEngine.GetRecoveryPatternsAsync(subsystemId);
                return Ok(patterns);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recovery patterns");
                return StatusCode(500, new { error = "Failed to get recovery patterns" });
            }
        }

        /// <summary>
        /// Get orchestration status
        /// </summary>
        /// <returns>Complete orchestration status with active workflows and metrics</returns>
        [HttpGet("orchestration/status")]
        [ProducesResponseType(typeof(OrchestrationStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOrchestrationStatus()
        {
            try
            {
                var status = await _orchestrator.GetOrchestrationStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orchestration status");
                return StatusCode(500, new { error = "Failed to get orchestration status" });
            }
        }

        /// <summary>
        /// Execute orchestrated recovery workflow
        /// </summary>
        /// <param name="workflow">Recovery workflow with stages and coordination mode</param>
        /// <returns>Orchestrated recovery result with stage execution details</returns>
        [HttpPost("orchestration/execute")]
        [ProducesResponseType(typeof(OrchestratedRecoveryResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ExecuteOrchestratedRecovery([FromBody] RecoveryWorkflow workflow)
        {
            try
            {
                _logger.LogInformation("Executing orchestrated recovery workflow: {WorkflowType}, stages: {StageCount}",
                    workflow.WorkflowType, workflow.RecoveryStages.Count);
                var result = await _orchestrator.ExecuteOrchestratedRecoveryAsync(workflow);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing orchestrated recovery");
                return StatusCode(500, new { error = "Failed to execute orchestrated recovery" });
            }
        }

        /// <summary>
        /// Build recovery workflow for affected subsystems
        /// </summary>
        /// <param name="subsystems">List of affected subsystem IDs</param>
        /// <returns>Generated recovery workflow with dependency-aware stages</returns>
        [HttpPost("orchestration/build-workflow")]
        [ProducesResponseType(typeof(RecoveryWorkflow), StatusCodes.Status200OK)]
        public async Task<IActionResult> BuildRecoveryWorkflow([FromBody] List<string> subsystems)
        {
            try
            {
                _logger.LogInformation("Building recovery workflow for {Count} subsystems", subsystems.Count);
                var workflow = await _orchestrator.BuildRecoveryWorkflowAsync(subsystems);
                return Ok(workflow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building recovery workflow");
                return StatusCode(500, new { error = "Failed to build recovery workflow" });
            }
        }

        /// <summary>
        /// Get subsystem dependency graph
        /// </summary>
        /// <returns>Complete dependency graph with all subsystems and relationships</returns>
        [HttpGet("orchestration/dependency-graph")]
        [ProducesResponseType(typeof(DependencyGraph), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDependencyGraph()
        {
            try
            {
                var graph = await _orchestrator.GetSubsystemDependencyGraphAsync();
                return Ok(graph);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dependency graph");
                return StatusCode(500, new { error = "Failed to get dependency graph" });
            }
        }

        /// <summary>
        /// Analyze recovery impact
        /// </summary>
        /// <param name="workflow">Recovery workflow to analyze</param>
        /// <returns>Impact analysis with affected users, downtime, and risk level</returns>
        [HttpPost("orchestration/analyze-impact")]
        [ProducesResponseType(typeof(RecoveryImpactAnalysis), StatusCodes.Status200OK)]
        public async Task<IActionResult> AnalyzeRecoveryImpact([FromBody] RecoveryWorkflow workflow)
        {
            try
            {
                var analysis = await _orchestrator.AnalyzeRecoveryImpactAsync(workflow);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing recovery impact");
                return StatusCode(500, new { error = "Failed to analyze recovery impact" });
            }
        }

        /// <summary>
        /// Prevent cascading failures
        /// </summary>
        /// <param name="subsystemId">ID of the initiating subsystem</param>
        /// <returns>Cascade prevention result with protected subsystems and actions</returns>
        [HttpPost("orchestration/prevent-cascade/{subsystemId}")]
        [ProducesResponseType(typeof(CascadePreventionResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> PreventCascadingFailures(string subsystemId)
        {
            try
            {
                _logger.LogWarning("Preventing cascading failures from subsystem: {SubsystemId}", subsystemId);
                var result = await _orchestrator.PreventCascadingFailuresAsync(subsystemId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error preventing cascading failures");
                return StatusCode(500, new { error = "Failed to prevent cascading failures" });
            }
        }
    }
}
