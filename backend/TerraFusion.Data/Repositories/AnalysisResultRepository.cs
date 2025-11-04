/**
 * AnalysisResultRepository Implementation
 *
 * Concrete implementation of IAnalysisResultRepository using Entity Framework Core.
 * Provides data access for AnalysisResult entities with statistical query capabilities.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Data.Repositories;

/// <summary>
/// Repository implementation for AnalysisResult entity
/// </summary>
public class AnalysisResultRepository : IAnalysisResultRepository
{
    private readonly TerraFusionDbContext _context;

    public AnalysisResultRepository(TerraFusionDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<AnalysisResult?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AnalysisResults
            .Include(r => r.User)
            .Include(r => r.County)
            .Include(r => r.Notebook)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> GetByUserIdAsync(
        int userId,
        int countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AnalysisResults
            .Where(r => r.UserId == userId && r.CountyId == countyId);

        if (!includeArchived)
        {
            query = query.Where(r => !r.IsArchived);
        }

        return await query
            .Include(r => r.Notebook)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> GetByAnalysisTypeAsync(
        int userId,
        int countyId,
        string analysisType,
        CancellationToken cancellationToken = default)
    {
        return await _context.AnalysisResults
            .Where(r => r.UserId == userId &&
                       r.CountyId == countyId &&
                       r.AnalysisType == analysisType &&
                       !r.IsArchived)
            .Include(r => r.Notebook)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> GetByNotebookIdAsync(
        int notebookId,
        CancellationToken cancellationToken = default)
    {
        return await _context.AnalysisResults
            .Where(r => r.NotebookId == notebookId && !r.IsArchived)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> GetSignificantResultsAsync(
        int userId,
        int countyId,
        double maxPValue = 0.05,
        CancellationToken cancellationToken = default)
    {
        return await _context.AnalysisResults
            .Where(r => r.UserId == userId &&
                       r.CountyId == countyId &&
                       r.PValue <= maxPValue &&
                       !r.IsArchived)
            .Include(r => r.Notebook)
            .OrderBy(r => r.PValue)  // Order by significance (smallest p-value first)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> GetRecentAsync(
        int userId,
        int countyId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.AnalysisResults
            .Where(r => r.UserId == userId &&
                       r.CountyId == countyId &&
                       !r.IsArchived)
            .Include(r => r.Notebook)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> GetFavoritesAsync(
        int userId,
        int countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.AnalysisResults
            .Where(r => r.UserId == userId &&
                       r.CountyId == countyId &&
                       r.IsFavorite &&
                       !r.IsArchived)
            .Include(r => r.Notebook)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnalysisResult>> SearchAsync(
        int userId,
        int countyId,
        string searchTerm,
        CancellationToken cancellationToken = default)
    {
        var lowerSearchTerm = searchTerm.ToLower();

        return await _context.AnalysisResults
            .Where(r => r.UserId == userId &&
                       r.CountyId == countyId &&
                       !r.IsArchived &&
                       ((r.Tags != null && r.Tags.ToLower().Contains(lowerSearchTerm)) ||
                        (r.Notes != null && r.Notes.ToLower().Contains(lowerSearchTerm))))
            .Include(r => r.Notebook)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<AnalysisResult> CreateAsync(AnalysisResult result, CancellationToken cancellationToken = default)
    {
        if (result == null)
            throw new ArgumentNullException(nameof(result));

        _context.AnalysisResults.Add(result);
        await _context.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<AnalysisResult> UpdateAsync(AnalysisResult result, CancellationToken cancellationToken = default)
    {
        if (result == null)
            throw new ArgumentNullException(nameof(result));

        _context.AnalysisResults.Update(result);
        await _context.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var result = await _context.AnalysisResults.FindAsync(new object[] { id }, cancellationToken);
        if (result == null)
            return false;

        result.IsArchived = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var result = await _context.AnalysisResults.FindAsync(new object[] { id }, cancellationToken);
        if (result == null)
            return false;

        _context.AnalysisResults.Remove(result);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<object> GetStatisticsAsync(
        int userId,
        int countyId,
        CancellationToken cancellationToken = default)
    {
        var results = await _context.AnalysisResults
            .Where(r => r.UserId == userId && r.CountyId == countyId && !r.IsArchived)
            .ToListAsync(cancellationToken);

        var statistics = new
        {
            TotalCount = results.Count,
            CountByType = results
                .GroupBy(r => r.AnalysisType)
                .Select(g => new { AnalysisType = g.Key, Count = g.Count() })
                .ToList(),
            SignificantResults = results.Count(r => r.PValue <= 0.05),
            SignificanceRate = results.Any() ? results.Count(r => r.PValue <= 0.05) / (double)results.Count : 0,
            AveragePValue = results.Any() ? results.Average(r => r.PValue) : 0,
            FavoriteCount = results.Count(r => r.IsFavorite),
            WithNotebook = results.Count(r => r.NotebookId != null),
            WithoutNotebook = results.Count(r => r.NotebookId == null)
        };

        return statistics;
    }
}
