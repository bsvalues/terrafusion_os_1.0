/*
 * QuantumNotebookRepository Implementation
 *
 * Concrete implementation of IQuantumNotebookRepository using Entity Framework Core.
 * Provides data access for QuantumNotebook entities with county data isolation.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Data.Repositories;

/// <summary>
/// Repository implementation for QuantumNotebook entity
/// </summary>
public class QuantumNotebookRepository : IQuantumNotebookRepository
{
    private readonly TerraFusionDbContext _context;

    public QuantumNotebookRepository(TerraFusionDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<QuantumNotebook?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.QuantumNotebooks
            .Include(n => n.User)
            .Include(n => n.County)
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<QuantumNotebook>> GetByUserIdAsync(
        Guid userId,
        Guid countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.QuantumNotebooks
            .Where(n => n.UserId == userId && n.CountyId == countyId);

        if (!includeArchived)
        {
            query = query.Where(n => !n.IsArchived);
        }

        return await query
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<QuantumNotebook>> GetByCountyIdAsync(
        Guid countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.QuantumNotebooks
            .Where(n => n.CountyId == countyId);

        if (!includeArchived)
        {
            query = query.Where(n => !n.IsArchived);
        }

        return await query
            .Include(n => n.User)
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<QuantumNotebook>> GetByLanguageAsync(
        Guid userId,
        Guid countyId,
        string language,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuantumNotebooks
            .Where(n => n.UserId == userId &&
                       n.CountyId == countyId &&
                       n.Language == language &&
                       !n.IsArchived)
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<QuantumNotebook>> SearchAsync(
        Guid userId,
        Guid countyId,
        string searchTerm,
        CancellationToken cancellationToken = default)
    {
        var lowerSearchTerm = searchTerm.ToLower();

        return await _context.QuantumNotebooks
            .Where(n => n.UserId == userId &&
                       n.CountyId == countyId &&
                       !n.IsArchived &&
                       (n.Name.ToLower().Contains(lowerSearchTerm) ||
                        (n.Description != null && n.Description.ToLower().Contains(lowerSearchTerm))))
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<QuantumNotebook>> GetFavoritesAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuantumNotebooks
            .Where(n => n.UserId == userId &&
                       n.CountyId == countyId &&
                       n.IsFavorite &&
                       !n.IsArchived)
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<QuantumNotebook> CreateAsync(QuantumNotebook notebook, CancellationToken cancellationToken = default)
    {
        if (notebook == null)
            throw new ArgumentNullException(nameof(notebook));

        _context.QuantumNotebooks.Add(notebook);
        await _context.SaveChangesAsync(cancellationToken);
        return notebook;
    }

    public async Task<QuantumNotebook> UpdateAsync(QuantumNotebook notebook, CancellationToken cancellationToken = default)
    {
        if (notebook == null)
            throw new ArgumentNullException(nameof(notebook));

        _context.QuantumNotebooks.Update(notebook);
        await _context.SaveChangesAsync(cancellationToken);
        return notebook;
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var notebook = await _context.QuantumNotebooks.FindAsync(new object[] { id }, cancellationToken);
        if (notebook == null)
            return false;

        notebook.IsArchived = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var notebook = await _context.QuantumNotebooks.FindAsync(new object[] { id }, cancellationToken);
        if (notebook == null)
            return false;

        _context.QuantumNotebooks.Remove(notebook);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> HasAccessAsync(
        int notebookId,
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuantumNotebooks
            .AnyAsync(n => n.Id == notebookId &&
                          n.UserId == userId &&
                          n.CountyId == countyId,
                     cancellationToken);
    }

    public async Task<int> GetCountAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuantumNotebooks
            .CountAsync(n => n.UserId == userId &&
                            n.CountyId == countyId &&
                            !n.IsArchived,
                       cancellationToken);
    }
}
