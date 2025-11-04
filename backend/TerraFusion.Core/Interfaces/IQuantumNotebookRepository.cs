/**
 * IQuantumNotebookRepository Interface
 *
 * Repository interface for QuantumNotebook entity data access.
 * Provides CRUD operations and common queries with county data isolation.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Repository interface for QuantumNotebook entity
/// </summary>
public interface IQuantumNotebookRepository
{
    /// <summary>
    /// Get notebook by ID
    /// </summary>
    /// <param name="id">Notebook ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Notebook or null if not found</returns>
    Task<QuantumNotebook?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all notebooks for a user (with county filtering)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="includeArchived">Include archived notebooks</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of notebooks</returns>
    Task<IEnumerable<QuantumNotebook>> GetByUserIdAsync(
        int userId,
        int countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all notebooks for a county
    /// </summary>
    /// <param name="countyId">County ID</param>
    /// <param name="includeArchived">Include archived notebooks</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of notebooks</returns>
    Task<IEnumerable<QuantumNotebook>> GetByCountyIdAsync(
        int countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get notebooks by programming language
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="language">Programming language (javascript, python, r, julia)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of notebooks</returns>
    Task<IEnumerable<QuantumNotebook>> GetByLanguageAsync(
        int userId,
        int countyId,
        string language,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Search notebooks by name or description
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="searchTerm">Search term</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of matching notebooks</returns>
    Task<IEnumerable<QuantumNotebook>> SearchAsync(
        int userId,
        int countyId,
        string searchTerm,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get favorite notebooks for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of favorite notebooks</returns>
    Task<IEnumerable<QuantumNotebook>> GetFavoritesAsync(
        int userId,
        int countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new notebook
    /// </summary>
    /// <param name="notebook">Notebook to create</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created notebook with ID</returns>
    Task<QuantumNotebook> CreateAsync(QuantumNotebook notebook, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing notebook
    /// </summary>
    /// <param name="notebook">Notebook to update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated notebook</returns>
    Task<QuantumNotebook> UpdateAsync(QuantumNotebook notebook, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a notebook (soft delete - sets IsArchived)
    /// </summary>
    /// <param name="id">Notebook ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Permanently delete a notebook
    /// </summary>
    /// <param name="id">Notebook ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if user has access to notebook (ownership + county validation)
    /// </summary>
    /// <param name="notebookId">Notebook ID</param>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if user has access</returns>
    Task<bool> HasAccessAsync(
        int notebookId,
        int userId,
        int countyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get notebook count for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="countyId">County ID for data isolation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Notebook count</returns>
    Task<int> GetCountAsync(
        int userId,
        int countyId,
        CancellationToken cancellationToken = default);
}
