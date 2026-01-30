/*
 * IWorkflowRepository Interface
 *
 * Repository interface for Workflow entity data access.
 * Provides CRUD operations and workflow-specific queries.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Repository interface for Workflow entity
/// </summary>
public interface IWorkflowRepository
{
    /// <summary>
    /// Get workflow by ID
    /// </summary>
    /// <param name="id">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Workflow or null if not found</returns>
    Task<Workflow?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get workflow by ID with execution history
    /// </summary>
    /// <param name="id">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Workflow with executions or null if not found</returns>
    Task<Workflow?> GetWithExecutionsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all workflows for a user (with county filtering)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="includeArchived">Include archived workflows</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of workflows</returns>
    Task<IEnumerable<Workflow>> GetByUserIdAsync(
        Guid userId,
        Guid countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get workflows by category
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="category">Workflow category (data-processing, ai-analysis, etc.)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of workflows</returns>
    Task<IEnumerable<Workflow>> GetByCategoryAsync(
        Guid userId,
        Guid countyId,
        string category,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get workflows by complexity level
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="complexity">Complexity level (simple, moderate, complex)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of workflows</returns>
    Task<IEnumerable<Workflow>> GetByComplexityAsync(
        Guid userId,
        Guid countyId,
        string complexity,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all workflow templates
    /// </summary>
    /// <param name="category">Optional category filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of template workflows</returns>
    Task<IEnumerable<Workflow>> GetTemplatesAsync(
        string? category = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get workflows created from a specific template
    /// </summary>
    /// <param name="templateId">Template workflow ID</param>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of workflows derived from template</returns>
    Task<IEnumerable<Workflow>> GetByTemplateIdAsync(
        int templateId,
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Search workflows by name or description
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="searchTerm">Search term</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of matching workflows</returns>
    Task<IEnumerable<Workflow>> SearchAsync(
        Guid userId,
        Guid countyId,
        string searchTerm,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get favorite workflows for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of favorite workflows</returns>
    Task<IEnumerable<Workflow>> GetFavoritesAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get most executed workflows
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="count">Number of workflows to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of most executed workflows</returns>
    Task<IEnumerable<Workflow>> GetMostExecutedAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent workflows
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="count">Number of workflows to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recent workflows</returns>
    Task<IEnumerable<Workflow>> GetRecentAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new workflow
    /// </summary>
    /// <param name="workflow">Workflow to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created workflow with ID</returns>
    Task<Workflow> CreateAsync(Workflow workflow, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create workflow from template
    /// </summary>
    /// <param name="templateId">Template workflow ID</param>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID</param>
    /// <param name="name">New workflow name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created workflow</returns>
    Task<Workflow> CreateFromTemplateAsync(
        int templateId,
        Guid userId,
        Guid countyId,
        string name,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing workflow
    /// </summary>
    /// <param name="workflow">Workflow to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated workflow</returns>
    Task<Workflow> UpdateAsync(Workflow workflow, CancellationToken cancellationToken = default);

    /// <summary>
    /// Increment execution count
    /// </summary>
    /// <param name="id">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if incremented, false if workflow not found</returns>
    Task<bool> IncrementExecutionCountAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a workflow (soft delete - sets IsArchived)
    /// </summary>
    /// <param name="id">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Permanently delete a workflow
    /// </summary>
    /// <param name="id">Workflow ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if user has access to workflow (ownership + county validation)
    /// </summary>
    /// <param name="workflowId">Workflow ID</param>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if user has access</returns>
    Task<bool> HasAccessAsync(
        int workflowId,
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get workflow statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics (count by category, total executions, etc.)</returns>
    Task<object> GetStatisticsAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);
}
