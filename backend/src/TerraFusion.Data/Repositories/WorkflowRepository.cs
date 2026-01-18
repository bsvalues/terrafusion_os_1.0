/**
 * WorkflowRepository Implementation
 *
 * Concrete implementation of IWorkflowRepository using Entity Framework Core.
 * Provides data access for Workflow entities with template management.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Data.Repositories;

/// <summary>
/// Repository implementation for Workflow entity
/// </summary>
public class WorkflowRepository : IWorkflowRepository
{
    private readonly TerraFusionDbContext _context;

    public WorkflowRepository(TerraFusionDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Workflow?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Include(w => w.User)
            .Include(w => w.County)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<Workflow?> GetWithExecutionsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Include(w => w.User)
            .Include(w => w.County)
            .Include(w => w.Executions.OrderByDescending(e => e.StartedAt).Take(10))
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetByUserIdAsync(
        Guid userId,
        Guid countyId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Workflows
            .Where(w => w.UserId == userId && w.CountyId == countyId);

        if (!includeArchived)
        {
            query = query.Where(w => !w.IsArchived);
        }

        return await query
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetByCategoryAsync(
        Guid userId,
        Guid countyId,
        string category,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Where(w => w.UserId == userId &&
                       w.CountyId == countyId &&
                       w.Category == category &&
                       !w.IsArchived)
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetByComplexityAsync(
        Guid userId,
        Guid countyId,
        string complexity,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Where(w => w.UserId == userId &&
                       w.CountyId == countyId &&
                       w.Complexity == complexity &&
                       !w.IsArchived)
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetTemplatesAsync(
        string? category = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Workflows.Where(w => w.IsTemplate && !w.IsArchived);

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(w => w.Category == category);
        }

        return await query
            .OrderBy(w => w.Category)
            .ThenBy(w => w.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetByTemplateIdAsync(
        int templateId,
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Where(w => w.TemplateId == templateId &&
                       w.UserId == userId &&
                       w.CountyId == countyId &&
                       !w.IsArchived)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> SearchAsync(
        Guid userId,
        Guid countyId,
        string searchTerm,
        CancellationToken cancellationToken = default)
    {
        var lowerSearchTerm = searchTerm.ToLower();

        return await _context.Workflows
            .Where(w => w.UserId == userId &&
                       w.CountyId == countyId &&
                       !w.IsArchived &&
                       (w.Name.ToLower().Contains(lowerSearchTerm) ||
                        (w.Description != null && w.Description.ToLower().Contains(lowerSearchTerm))))
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetFavoritesAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Where(w => w.UserId == userId &&
                       w.CountyId == countyId &&
                       w.IsFavorite &&
                       !w.IsArchived)
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetMostExecutedAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Where(w => w.UserId == userId &&
                       w.CountyId == countyId &&
                       !w.IsArchived)
            .OrderByDescending(w => w.ExecutionCount)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Workflow>> GetRecentAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .Where(w => w.UserId == userId &&
                       w.CountyId == countyId &&
                       !w.IsArchived)
            .OrderByDescending(w => w.UpdatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<Workflow> CreateAsync(Workflow workflow, CancellationToken cancellationToken = default)
    {
        if (workflow == null)
            throw new ArgumentNullException(nameof(workflow));

        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync(cancellationToken);
        return workflow;
    }

    public async Task<Workflow> CreateFromTemplateAsync(
        int templateId,
        Guid userId,
        Guid countyId,
        string name,
        CancellationToken cancellationToken = default)
    {
        var template = await _context.Workflows.FindAsync(new object[] { templateId }, cancellationToken);
        if (template == null || !template.IsTemplate)
            throw new InvalidOperationException($"Template workflow {templateId} not found");

        var newWorkflow = new Workflow
        {
            Name = name,
            Description = template.Description,
            Category = template.Category,
            Complexity = template.Complexity,
            DefinitionJson = template.DefinitionJson,
            UserId = userId,
            CountyId = countyId,
            TemplateId = templateId,
            IsTemplate = false,
            IsFavorite = false,
            IsArchived = false,
            ExecutionCount = 0
        };

        _context.Workflows.Add(newWorkflow);
        await _context.SaveChangesAsync(cancellationToken);
        return newWorkflow;
    }

    public async Task<Workflow> UpdateAsync(Workflow workflow, CancellationToken cancellationToken = default)
    {
        if (workflow == null)
            throw new ArgumentNullException(nameof(workflow));

        _context.Workflows.Update(workflow);
        await _context.SaveChangesAsync(cancellationToken);
        return workflow;
    }

    public async Task<bool> IncrementExecutionCountAsync(int id, CancellationToken cancellationToken = default)
    {
        var workflow = await _context.Workflows.FindAsync(new object[] { id }, cancellationToken);
        if (workflow == null)
            return false;

        workflow.ExecutionCount++;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var workflow = await _context.Workflows.FindAsync(new object[] { id }, cancellationToken);
        if (workflow == null)
            return false;

        workflow.IsArchived = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var workflow = await _context.Workflows.FindAsync(new object[] { id }, cancellationToken);
        if (workflow == null)
            return false;

        _context.Workflows.Remove(workflow);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> HasAccessAsync(
        int workflowId,
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Workflows
            .AnyAsync(w => w.Id == workflowId &&
                          w.UserId == userId &&
                          w.CountyId == countyId,
                     cancellationToken);
    }

    public async Task<object> GetStatisticsAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        var workflows = await _context.Workflows
            .Where(w => w.UserId == userId && w.CountyId == countyId && !w.IsArchived)
            .ToListAsync(cancellationToken);

        var statistics = new
        {
            TotalCount = workflows.Count,
            CountByCategory = workflows
                .GroupBy(w => w.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToList(),
            CountByComplexity = workflows
                .GroupBy(w => w.Complexity)
                .Select(g => new { Complexity = g.Key, Count = g.Count() })
                .ToList(),
            TotalExecutions = workflows.Sum(w => w.ExecutionCount),
            AverageExecutions = workflows.Any() ? workflows.Average(w => w.ExecutionCount) : 0,
            FavoriteCount = workflows.Count(w => w.IsFavorite),
            TemplateCount = workflows.Count(w => w.IsTemplate),
            FromTemplateCount = workflows.Count(w => w.TemplateId != null)
        };

        return statistics;
    }
}
