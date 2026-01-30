/*
 * QuantumAnalyticsController
 *
 * API controller for quantum analytics operations including notebooks,
 * statistical analysis, and workflow management.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using Microsoft.AspNetCore.Mvc;
using TerraFusion.AI.Services;
using TerraFusion.Core.Entities;
using WorkflowExecution = TerraFusion.Core.Entities.WorkflowExecution;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Controller for quantum analytics operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class QuantumAnalyticsController : ControllerBase
{
    private readonly IQuantumAnalyticsService _quantumAnalyticsService;
    private readonly ILogger<QuantumAnalyticsController> _logger;

    public QuantumAnalyticsController(
        IQuantumAnalyticsService quantumAnalyticsService,
        ILogger<QuantumAnalyticsController> logger)
    {
        _quantumAnalyticsService = quantumAnalyticsService ?? throw new ArgumentNullException(nameof(quantumAnalyticsService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Notebook Endpoints

    /// <summary>
    /// Create a new quantum notebook
    /// </summary>
    [HttpPost("notebooks")]
    public async Task<ActionResult<QuantumNotebook>> CreateNotebook([FromBody] CreateNotebookRequest request)
    {
        try
        {
            var notebook = await _quantumAnalyticsService.CreateNotebookAsync(
                request.UserId,
                request.CountyId,
                request.Name,
                request.Language ?? "javascript");

            return CreatedAtAction(nameof(GetNotebook), new { id = notebook.Id }, notebook);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notebook");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get a quantum notebook by ID
    /// </summary>
    [HttpGet("notebooks/{id}")]
    public async Task<ActionResult<QuantumNotebook>> GetNotebook(
        int id,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var notebook = await _quantumAnalyticsService.GetNotebookAsync(id, userId, countyId);
        if (notebook == null)
        {
            return NotFound(new { error = "Notebook not found or access denied" });
        }

        return Ok(notebook);
    }

    /// <summary>
    /// Get all notebooks for a user
    /// </summary>
    [HttpGet("notebooks")]
    public async Task<ActionResult<IEnumerable<QuantumNotebook>>> GetUserNotebooks(
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var notebooks = await _quantumAnalyticsService.GetUserNotebooksAsync(userId, countyId);
        return Ok(notebooks);
    }

    /// <summary>
    /// Update a quantum notebook
    /// </summary>
    [HttpPut("notebooks/{id}")]
    public async Task<ActionResult<QuantumNotebook>> UpdateNotebook(
        int id,
        [FromBody] UpdateNotebookRequest request)
    {
        try
        {
            var notebook = await _quantumAnalyticsService.GetNotebookAsync(id, request.UserId, request.CountyId);
            if (notebook == null)
            {
                return NotFound(new { error = "Notebook not found or access denied" });
            }

            // Update fields
            notebook.Name = request.Name ?? notebook.Name;
            notebook.Description = request.Description ?? notebook.Description;
            notebook.CellsJson = request.CellsJson ?? notebook.CellsJson;
            notebook.Language = request.Language ?? notebook.Language;
            notebook.IsFavorite = request.IsFavorite ?? notebook.IsFavorite;

            var updated = await _quantumAnalyticsService.UpdateNotebookAsync(notebook, request.UserId, request.CountyId);
            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notebook");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a quantum notebook (soft delete)
    /// </summary>
    [HttpDelete("notebooks/{id}")]
    public async Task<IActionResult> DeleteNotebook(
        int id,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var deleted = await _quantumAnalyticsService.DeleteNotebookAsync(id, userId, countyId);
        if (!deleted)
        {
            return NotFound(new { error = "Notebook not found or access denied" });
        }

        return NoContent();
    }

    /// <summary>
    /// Execute a quantum notebook
    /// </summary>
    [HttpPost("notebooks/{id}/execute")]
    public async Task<ActionResult<QuantumNotebook>> ExecuteNotebook(
        int id,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        try
        {
            var notebook = await _quantumAnalyticsService.ExecuteNotebookAsync(id, userId, countyId);
            return Ok(notebook);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing notebook");
            return BadRequest(new { error = ex.Message });
        }
    }

    #endregion

    #region Analysis Endpoints

    /// <summary>
    /// Run statistical analysis
    /// </summary>
    [HttpPost("analysis")]
    public async Task<ActionResult<AnalysisResult>> RunAnalysis([FromBody] RunAnalysisRequest request)
    {
        try
        {
            var result = await _quantumAnalyticsService.RunStatisticalAnalysisAsync(
                request.UserId,
                request.CountyId,
                request.AnalysisType,
                request.Data1,
                request.Data2,
                request.NotebookId);

            return CreatedAtAction(nameof(GetAnalysisResult), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running analysis");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get analysis result by ID
    /// </summary>
    [HttpGet("analysis/{id}")]
    public async Task<ActionResult<AnalysisResult>> GetAnalysisResult(
        int id,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var result = await _quantumAnalyticsService.GetAnalysisResultAsync(id, userId, countyId);
        if (result == null)
        {
            return NotFound(new { error = "Analysis result not found or access denied" });
        }

        return Ok(result);
    }

    /// <summary>
    /// Get all analysis results for a user
    /// </summary>
    [HttpGet("analysis")]
    public async Task<ActionResult<IEnumerable<AnalysisResult>>> GetUserAnalysisResults(
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var results = await _quantumAnalyticsService.GetUserAnalysisResultsAsync(userId, countyId);
        return Ok(results);
    }

    /// <summary>
    /// Get significant analysis results (p-value &lt;= threshold)
    /// </summary>
    [HttpGet("analysis/significant")]
    public async Task<ActionResult<IEnumerable<AnalysisResult>>> GetSignificantResults(
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId,
        [FromQuery] double pValueThreshold = 0.05)
    {
        var results = await _quantumAnalyticsService.GetSignificantResultsAsync(userId, countyId, pValueThreshold);
        return Ok(results);
    }

    /// <summary>
    /// Get analysis statistics for a user
    /// </summary>
    [HttpGet("analysis/statistics")]
    public async Task<ActionResult<object>> GetAnalysisStatistics(
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var statistics = await _quantumAnalyticsService.GetAnalysisStatisticsAsync(userId, countyId);
        return Ok(statistics);
    }

    #endregion

    #region Workflow Endpoints

    /// <summary>
    /// Create a new workflow
    /// </summary>
    [HttpPost("workflows")]
    public async Task<ActionResult<Workflow>> CreateWorkflow([FromBody] CreateWorkflowRequest request)
    {
        try
        {
            var workflow = await _quantumAnalyticsService.CreateWorkflowAsync(
                request.UserId,
                request.CountyId,
                request.Name,
                request.Category ?? "data-processing");

            return CreatedAtAction(nameof(GetWorkflow), new { id = workflow.Id }, workflow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workflow");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get workflow by ID
    /// </summary>
    [HttpGet("workflows/{id}")]
    public async Task<ActionResult<Workflow>> GetWorkflow(
        int id,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var workflow = await _quantumAnalyticsService.GetWorkflowAsync(id, userId, countyId);
        if (workflow == null)
        {
            return NotFound(new { error = "Workflow not found or access denied" });
        }

        return Ok(workflow);
    }

    /// <summary>
    /// Get all workflows for a user
    /// </summary>
    [HttpGet("workflows")]
    public async Task<ActionResult<IEnumerable<Workflow>>> GetUserWorkflows(
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var workflows = await _quantumAnalyticsService.GetUserWorkflowsAsync(userId, countyId);
        return Ok(workflows);
    }

    /// <summary>
    /// Create workflow from template
    /// </summary>
    [HttpPost("workflows/from-template")]
    public async Task<ActionResult<Workflow>> CreateWorkflowFromTemplate([FromBody] CreateFromTemplateRequest request)
    {
        try
        {
            var workflow = await _quantumAnalyticsService.CreateWorkflowFromTemplateAsync(
                request.TemplateId,
                request.UserId,
                request.CountyId,
                request.Name);

            return CreatedAtAction(nameof(GetWorkflow), new { id = workflow.Id }, workflow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workflow from template");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get workflow templates
    /// </summary>
    [HttpGet("workflows/templates")]
    public async Task<ActionResult<IEnumerable<Workflow>>> GetWorkflowTemplates([FromQuery] string? category = null)
    {
        var templates = await _quantumAnalyticsService.GetWorkflowTemplatesAsync(category);
        return Ok(templates);
    }

    #endregion

    #region Workflow Execution Endpoints

    /// <summary>
    /// Start workflow execution
    /// </summary>
    [HttpPost("workflows/{workflowId}/executions")]
    public async Task<ActionResult<WorkflowExecution>> StartWorkflowExecution(
        int workflowId,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        try
        {
            var execution = await _quantumAnalyticsService.StartWorkflowExecutionAsync(workflowId, userId, countyId);
            return Ok(execution);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting workflow execution");
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update execution progress
    /// </summary>
    [HttpPatch("executions/{id}/progress")]
    public async Task<IActionResult> UpdateExecutionProgress(
        int id,
        [FromBody] UpdateProgressRequest request)
    {
        var updated = await _quantumAnalyticsService.UpdateExecutionProgressAsync(
            id,
            request.NodesExecuted,
            request.NodesFailed);

        if (!updated)
        {
            return NotFound(new { error = "Execution not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Complete workflow execution
    /// </summary>
    [HttpPost("executions/{id}/complete")]
    public async Task<IActionResult> CompleteWorkflowExecution(
        int id,
        [FromBody] CompleteExecutionRequest request)
    {
        var completed = await _quantumAnalyticsService.CompleteWorkflowExecutionAsync(
            id,
            request.Status,
            request.ErrorMessage);

        if (!completed)
        {
            return NotFound(new { error = "Execution not found" });
        }

        return NoContent();
    }

    /// <summary>
    /// Get workflow execution history
    /// </summary>
    [HttpGet("workflows/{workflowId}/executions")]
    public async Task<ActionResult<IEnumerable<WorkflowExecution>>> GetWorkflowExecutionHistory(
        int workflowId,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        var executions = await _quantumAnalyticsService.GetWorkflowExecutionHistoryAsync(workflowId, userId, countyId);
        return Ok(executions);
    }

    /// <summary>
    /// Get workflow execution statistics
    /// </summary>
    [HttpGet("workflows/{workflowId}/executions/statistics")]
    public async Task<ActionResult<object>> GetWorkflowExecutionStatistics(
        int workflowId,
        [FromQuery] Guid userId,
        [FromQuery] Guid countyId)
    {
        try
        {
            var statistics = await _quantumAnalyticsService.GetWorkflowExecutionStatisticsAsync(workflowId, userId, countyId);
            return Ok(statistics);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
    }

    #endregion

    #region Request Models

    public record CreateNotebookRequest(Guid UserId, Guid CountyId, string Name, string? Language = null);
    public record UpdateNotebookRequest(Guid UserId, Guid CountyId, string? Name, string? Description, string? CellsJson, string? Language, bool? IsFavorite);
    public record RunAnalysisRequest(Guid UserId, Guid CountyId, string AnalysisType, double[] Data1, double[]? Data2 = null, int? NotebookId = null);
    public record CreateWorkflowRequest(Guid UserId, Guid CountyId, string Name, string? Category = null);
    public record CreateFromTemplateRequest(int TemplateId, Guid UserId, Guid CountyId, string Name);
    public record UpdateProgressRequest(int NodesExecuted, int NodesFailed);
    public record CompleteExecutionRequest(string Status, string? ErrorMessage = null);

    #endregion
}
