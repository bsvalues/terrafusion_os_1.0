/*
 * IAnalysisResultRepository Interface
 *
 * Repository interface for AnalysisResult entity data access.
 * Provides CRUD operations and statistical query capabilities.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Repository interface for AnalysisResult entity
/// </summary>
public interface IAnalysisResultRepository
{
    /// <summary>
    /// Get analysis result by ID
    /// </summary>
    /// <param name="id">Result ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Analysis result or null if not found</returns>
    Task<AnalysisResult?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all analysis results for a user (with county filtering)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="includeArchived">Include archived results</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of analysis results</returns>
    Task<IEnumerable<AnalysisResult>> GetByUserIdAsync(
        Guid userId,
        Guid countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get analysis results by analysis type
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="analysisType">Analysis type (t-test, anova, etc.)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of analysis results</returns>
    Task<IEnumerable<AnalysisResult>> GetByAnalysisTypeAsync(
        Guid userId,
        Guid countyId,
        string analysisType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get analysis results for a specific notebook
    /// </summary>
    /// <param name="notebookId">Notebook ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of analysis results</returns>
    Task<IEnumerable<AnalysisResult>> GetByNotebookIdAsync(
        int notebookId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get analysis results by p-value range (for significance filtering)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="maxPValue">Maximum p-value (e.g., 0.05 for significant results)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of significant analysis results</returns>
    Task<IEnumerable<AnalysisResult>> GetSignificantResultsAsync(
        Guid userId,
        Guid countyId,
        double maxPValue = 0.05,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent analysis results
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="count">Number of results to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recent analysis results</returns>
    Task<IEnumerable<AnalysisResult>> GetRecentAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get favorite analysis results
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of favorite analysis results</returns>
    Task<IEnumerable<AnalysisResult>> GetFavoritesAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Search analysis results by tags or notes
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="searchTerm">Search term</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of matching analysis results</returns>
    Task<IEnumerable<AnalysisResult>> SearchAsync(
        Guid userId,
        Guid countyId,
        string searchTerm,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new analysis result
    /// </summary>
    /// <param name="result">Analysis result to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created analysis result with ID</returns>
    Task<AnalysisResult> CreateAsync(AnalysisResult result, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing analysis result
    /// </summary>
    /// <param name="result">Analysis result to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated analysis result</returns>
    Task<AnalysisResult> UpdateAsync(AnalysisResult result, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete an analysis result (soft delete - sets IsArchived)
    /// </summary>
    /// <param name="id">Result ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Permanently delete an analysis result
    /// </summary>
    /// <param name="id">Result ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get analysis statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Statistics (count by type, avg execution time, etc.)</returns>
    Task<object> GetStatisticsAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default);
}
