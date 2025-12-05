/**
 * IWorkflowExecutionRepository Interface
 *
 * Repository interface for WorkflowExecution entity data access.
 * Provides CRUD operations and execution history queries.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Repository interface for WorkflowExecution entity
/// </summary>
public interface IWorkflowExecutionRepository
{
    /// <summary>
    /// Get execution by ID
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Execution or null if not found</returns>
    Task<WorkflowExecution?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get execution by ID with workflow details
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Execution with workflow or null if not found</returns>
    Task<WorkflowExecution?> GetWithWorkflowAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all executions for a workflow
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetByWorkflowIdAsync(
        int workflowId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get executions by status
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="status">Execution status (running, completed, failed, cancelled)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetByStatusAsync(
        int workflowId,
        string status,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all currently running executions
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of running executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetRunningAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get running executions for a specific workflow
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of running executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetRunningByWorkflowIdAsync(
        int workflowId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent executions for a workflow
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="count">Number of executions to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recent executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetRecentAsync(
        int workflowId,
        int count = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent executions for a user across all workflows
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="count">Number of executions to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recent executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetRecentByUserAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get failed executions for a workflow
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of failed executions</returns>
    Task<IEnumerable<WorkflowExecution>> GetFailedAsync(
        int workflowId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get executions by date range
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of executions in date range</returns>
    Task<IEnumerable<WorkflowExecution>> GetByDateRangeAsync(
        int workflowId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get executions by duration range (for performance analysis)
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="minDurationMs">Minimum duration in milliseconds</param>
    /// <param name="maxDurationMs">Maximum duration in milliseconds</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of executions in duration range</returns>
    Task<IEnumerable<WorkflowExecution>> GetByDurationRangeAsync(
        int workflowId,
        int minDurationMs,
        int maxDurationMs,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new execution
    /// </summary>
    /// <param name="execution">Execution to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created execution with ID</returns>
    Task<WorkflowExecution> CreateAsync(WorkflowExecution execution, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing execution
    /// </summary>
    /// <param name="execution">Execution to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated execution</returns>
    Task<WorkflowExecution> UpdateAsync(WorkflowExecution execution, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update execution status
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="status">New status</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if updated, false if not found</returns>
    Task<bool> UpdateStatusAsync(
        int id,
        string status,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update execution progress
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="nodesExecuted">Number of nodes executed</param>
    /// <param name="nodesFailed">Number of nodes failed</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if updated, false if not found</returns>
    Task<bool> UpdateProgressAsync(
        int id,
        int nodesExecuted,
        int nodesFailed,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Complete an execution (set status, completion time, and duration)
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="status">Final status (completed or failed)</param>
    /// <param name="errorMessage">Optional error message if failed</param>
    /// <param name="errorStackTrace">Optional error stack trace if failed</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if updated, false if not found</returns>
    Task<bool> CompleteAsync(
        int id,
        string status,
        string? errorMessage = null,
        string? errorStackTrace = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancel a running execution
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if cancelled, false if not found or not running</returns>
    Task<bool> CancelAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete an execution
    /// </summary>
    /// <param name="id">Execution ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete all executions for a workflow older than a specified date
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="olderThan">Delete executions older than this date</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Number of executions deleted</returns>
    Task<int> DeleteOldExecutionsAsync(
        int workflowId,
        DateTime olderThan,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get execution statistics for a workflow
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics (success rate, avg duration, failure rate, etc.)</returns>
    Task<object> GetStatisticsAsync(
        int workflowId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get execution statistics for a user across all workflows
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics across all workflows</returns>
    Task<object> GetUserStatisticsAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);
}
