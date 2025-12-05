/**
 * WorkflowExecutionRepository Implementation
 *
 * Concrete implementation of IWorkflowExecutionRepository using Entity Framework Core.
 * Provides data access for WorkflowExecution entities with execution tracking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Week 4
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Data.Repositories;

/// <summary>
/// Repository implementation for WorkflowExecution entity
/// </summary>
public class WorkflowExecutionRepository : IWorkflowExecutionRepository
{
    private readonly TerraFusionDbContext _context;

    public WorkflowExecutionRepository(TerraFusionDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<WorkflowExecution?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<WorkflowExecution?> GetWithWorkflowAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Include(e => e.Workflow)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetByWorkflowIdAsync(
        int workflowId,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetByStatusAsync(
        int workflowId,
        string status,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId && e.Status == status)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetRunningAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Include(e => e.Workflow)
            .Where(e => e.Status == "running")
            .OrderBy(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetRunningByWorkflowIdAsync(
        int workflowId,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId && e.Status == "running")
            .OrderBy(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetRecentAsync(
        int workflowId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId)
            .OrderByDescending(e => e.StartedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetRecentByUserAsync(
        Guid userId,
        Guid countyId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Include(e => e.Workflow)
            .Where(e => e.Workflow!.UserId == userId && e.Workflow.CountyId == countyId)
            .OrderByDescending(e => e.StartedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetFailedAsync(
        int workflowId,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId && e.Status == "failed")
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetByDateRangeAsync(
        int workflowId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId &&
                       e.StartedAt >= startDate &&
                       e.StartedAt <= endDate)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<WorkflowExecution>> GetByDurationRangeAsync(
        int workflowId,
        int minDurationMs,
        int maxDurationMs,
        CancellationToken cancellationToken = default)
    {
        return await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId &&
                       e.DurationMs != null &&
                       e.DurationMs >= minDurationMs &&
                       e.DurationMs <= maxDurationMs)
            .OrderByDescending(e => e.StartedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkflowExecution> CreateAsync(WorkflowExecution execution, CancellationToken cancellationToken = default)
    {
        if (execution == null)
            throw new ArgumentNullException(nameof(execution));

        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync(cancellationToken);
        return execution;
    }

    public async Task<WorkflowExecution> UpdateAsync(WorkflowExecution execution, CancellationToken cancellationToken = default)
    {
        if (execution == null)
            throw new ArgumentNullException(nameof(execution));

        _context.WorkflowExecutions.Update(execution);
        await _context.SaveChangesAsync(cancellationToken);
        return execution;
    }

    public async Task<bool> UpdateStatusAsync(
        int id,
        string status,
        CancellationToken cancellationToken = default)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(new object[] { id }, cancellationToken);
        if (execution == null)
            return false;

        execution.Status = status;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateProgressAsync(
        int id,
        int nodesExecuted,
        int nodesFailed,
        CancellationToken cancellationToken = default)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(new object[] { id }, cancellationToken);
        if (execution == null)
            return false;

        execution.NodesExecuted = nodesExecuted;
        execution.NodesFailed = nodesFailed;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CompleteAsync(
        int id,
        string status,
        string? errorMessage = null,
        string? errorStackTrace = null,
        CancellationToken cancellationToken = default)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(new object[] { id }, cancellationToken);
        if (execution == null)
            return false;

        execution.Status = status;
        execution.CompletedAt = DateTime.UtcNow;
        execution.DurationMs = (int)(execution.CompletedAt.Value - execution.StartedAt).TotalMilliseconds;
        execution.ErrorMessage = errorMessage;
        execution.ErrorStackTrace = errorStackTrace;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> CancelAsync(int id, CancellationToken cancellationToken = default)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(new object[] { id }, cancellationToken);
        if (execution == null || execution.Status != "running")
            return false;

        execution.Status = "cancelled";
        execution.CompletedAt = DateTime.UtcNow;
        execution.DurationMs = (int)(execution.CompletedAt.Value - execution.StartedAt).TotalMilliseconds;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(new object[] { id }, cancellationToken);
        if (execution == null)
            return false;

        _context.WorkflowExecutions.Remove(execution);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> DeleteOldExecutionsAsync(
        int workflowId,
        DateTime olderThan,
        CancellationToken cancellationToken = default)
    {
        var executions = await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId && e.StartedAt < olderThan)
            .ToListAsync(cancellationToken);

        if (!executions.Any())
            return 0;

        _context.WorkflowExecutions.RemoveRange(executions);
        await _context.SaveChangesAsync(cancellationToken);
        return executions.Count;
    }

    public async Task<object> GetStatisticsAsync(
        int workflowId,
        CancellationToken cancellationToken = default)
    {
        var executions = await _context.WorkflowExecutions
            .Where(e => e.WorkflowId == workflowId)
            .ToListAsync(cancellationToken);

        var completedExecutions = executions.Where(e => e.Status == "completed").ToList();
        var failedExecutions = executions.Where(e => e.Status == "failed").ToList();

        var statistics = new
        {
            TotalExecutions = executions.Count,
            CompletedCount = completedExecutions.Count,
            FailedCount = failedExecutions.Count,
            RunningCount = executions.Count(e => e.Status == "running"),
            CancelledCount = executions.Count(e => e.Status == "cancelled"),
            SuccessRate = executions.Any() ? completedExecutions.Count / (double)executions.Count : 0,
            FailureRate = executions.Any() ? failedExecutions.Count / (double)executions.Count : 0,
            AverageDurationMs = completedExecutions.Any() && completedExecutions.All(e => e.DurationMs.HasValue)
                ? completedExecutions.Average(e => e.DurationMs!.Value)
                : 0,
            MinDurationMs = completedExecutions.Any() && completedExecutions.All(e => e.DurationMs.HasValue)
                ? completedExecutions.Min(e => e.DurationMs!.Value)
                : 0,
            MaxDurationMs = completedExecutions.Any() && completedExecutions.All(e => e.DurationMs.HasValue)
                ? completedExecutions.Max(e => e.DurationMs!.Value)
                : 0,
            AverageNodesExecuted = executions.Any() ? executions.Average(e => e.NodesExecuted) : 0,
            AverageNodesFailed = executions.Any() ? executions.Average(e => e.NodesFailed) : 0
        };

        return statistics;
    }

    public async Task<object> GetUserStatisticsAsync(
        Guid userId,
        Guid countyId,
        CancellationToken cancellationToken = default)
    {
        var executions = await _context.WorkflowExecutions
            .Include(e => e.Workflow)
            .Where(e => e.Workflow!.UserId == userId && e.Workflow.CountyId == countyId)
            .ToListAsync(cancellationToken);

        var completedExecutions = executions.Where(e => e.Status == "completed").ToList();
        var failedExecutions = executions.Where(e => e.Status == "failed").ToList();

        var statistics = new
        {
            TotalExecutions = executions.Count,
            CompletedCount = completedExecutions.Count,
            FailedCount = failedExecutions.Count,
            RunningCount = executions.Count(e => e.Status == "running"),
            SuccessRate = executions.Any() ? completedExecutions.Count / (double)executions.Count : 0,
            AverageDurationMs = completedExecutions.Any() && completedExecutions.All(e => e.DurationMs.HasValue)
                ? completedExecutions.Average(e => e.DurationMs!.Value)
                : 0,
            ExecutionsByWorkflow = executions
                .GroupBy(e => e.WorkflowId)
                .Select(g => new
                {
                    WorkflowId = g.Key,
                    WorkflowName = g.First().Workflow!.Name,
                    ExecutionCount = g.Count(),
                    SuccessCount = g.Count(e => e.Status == "completed"),
                    FailureCount = g.Count(e => e.Status == "failed")
                })
                .OrderByDescending(x => x.ExecutionCount)
                .Take(10)
                .ToList()
        };

        return statistics;
    }
}
