using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public sealed record CreateQueueItemCommand(
    string TaskType,
    string? ParcelId,
    string? AssignedTo,
    string? Priority);

public interface IQueueService
{
    Task<QueueItem> CreateAsync(QueueItem entity);
    Task<QueueItem> CreateAsync(Guid countyId, CreateQueueItemCommand request, string? createdBy = null, DateTime? utcNow = null);
    Task<QueueItem?> GetByIdAsync(Guid id, Guid countyId);
    Task<List<QueueItem>> GetPendingAsync(Guid countyId, string? taskType = null);
    Task<List<QueueItem>> GetAllAsync(Guid countyId, string? status = null, string? assignedTo = null, string? taskType = null);
    Task<QueueItem> UpdateStatusAsync(Guid id, string status, Guid countyId);
    Task<QueueItem> AssignAsync(Guid id, string assignedTo, Guid countyId);
    Task<QueueMetricsDto> GetMetricsAsync(Guid countyId);
    Task<List<AppraiserProductivityDto>> GetProductivityAsync(Guid countyId);
    Task<QueueItem> ReviewAsync(Guid id, string action, Guid countyId, string? reviewer = null);
}

/// <summary>Queue-wide aggregate metrics.</summary>
public class QueueMetricsDto
{
    public int TotalQueued { get; set; }
    public int TotalInProgress { get; set; }
    public int TotalCompleted { get; set; }
    public int TotalFailed { get; set; }
    public int TotalEscalated { get; set; }
    public int SlaViolations { get; set; }
    public double AvgDaysToComplete { get; set; }
}

/// <summary>Per-appraiser productivity stats.</summary>
public class AppraiserProductivityDto
{
    public string Appraiser { get; set; } = string.Empty;
    public int Assigned { get; set; }
    public int Completed { get; set; }
    public double AvgDays { get; set; }
    public double RejectRate { get; set; }
}

public class QueueService : IQueueService
{
    private readonly ITerraFusionDbContext _context;
    private readonly ILogger<QueueService> _logger;

    // Explicit status transition map — reject invalid moves
    private static readonly Dictionary<string, HashSet<string>> ValidTransitions = new()
    {
        ["queued"]      = new() { "in_progress", "failed" },
        ["in_progress"] = new() { "completed", "failed", "escalated" },
        ["completed"]   = new(),  // terminal
        ["failed"]      = new() { "queued" },  // retry
        ["escalated"]   = new() { "in_progress" },  // de-escalate
    };

    public QueueService(ITerraFusionDbContext context, ILogger<QueueService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<QueueItem> CreateAsync(QueueItem entity)
    {
        var now = DateTime.UtcNow;
        PrepareForCreate(entity, now);

        _context.QueueItems.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created queue item {QueueItemId} for parcel {ParcelId} in county {CountyId}, type {TaskType}, priority {Priority}",
            entity.Id, entity.ParcelId, entity.CountyId, entity.TaskType, entity.Priority);

        return entity;
    }

    public Task<QueueItem> CreateAsync(Guid countyId, CreateQueueItemCommand request, string? createdBy = null, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var slaHours = GetDefaultSlaHours(request.TaskType);
        var entity = new QueueItem
        {
            ParcelId = request.ParcelId ?? string.Empty,
            TaskType = request.TaskType,
            Priority = request.Priority ?? "normal",
            Status = "queued",
            AssignedTo = request.AssignedTo,
            SlaHours = slaHours,
            SlaDeadline = now.AddHours(slaHours),
            CountyId = countyId,
            CreatedBy = createdBy,
            UpdatedBy = createdBy,
        };

        return CreateAsync(entity);
    }

    public async Task<QueueItem?> GetByIdAsync(Guid id, Guid countyId)
    {
        return await _context.QueueItems
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == id && q.CountyId == countyId);
    }

    public async Task<List<QueueItem>> GetPendingAsync(Guid countyId, string? taskType = null)
    {
        var query = _context.QueueItems
            .AsNoTracking()
            .Where(q => q.CountyId == countyId && q.Status == "queued");

        if (!string.IsNullOrEmpty(taskType))
            query = query.Where(q => q.TaskType == taskType);

        return await query
            .OrderByDescending(q => q.Priority == "urgent" ? 0 : q.Priority == "high" ? 1 : 2)
            .ThenBy(q => q.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<QueueItem>> GetAllAsync(Guid countyId, string? status = null, string? assignedTo = null, string? taskType = null)
    {
        var query = _context.QueueItems
            .AsNoTracking()
            .Where(q => q.CountyId == countyId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(q => q.Status == status);

        if (!string.IsNullOrEmpty(assignedTo))
            query = query.Where(q => q.AssignedTo == assignedTo);

        if (!string.IsNullOrEmpty(taskType))
            query = query.Where(q => q.TaskType == taskType);

        return await query
            .OrderByDescending(q => q.Priority == "urgent" ? 0 : q.Priority == "high" ? 1 : 2)
            .ThenBy(q => q.CreatedAt)
            .ToListAsync();
    }

    public async Task<QueueItem> UpdateStatusAsync(Guid id, string status, Guid countyId)
    {
        var entity = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == id && q.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"QueueItem {id} not found in county {countyId}.");

        // Validate transition
        if (ValidTransitions.TryGetValue(entity.Status, out var allowed) && !allowed.Contains(status))
            throw new InvalidOperationException(
                $"Invalid status transition from '{entity.Status}' to '{status}' for QueueItem {id}.");

        entity.Status = status;
        entity.UpdatedAt = DateTime.UtcNow;

        if (status == "in_progress" && entity.StartedAt is null)
            entity.StartedAt = DateTime.UtcNow;

        if (status == "completed")
            entity.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Updated queue item {QueueItemId} status to {Status} in county {CountyId}",
            id, status, countyId);

        return entity;
    }

    public async Task<QueueItem> AssignAsync(Guid id, string assignedTo, Guid countyId)
    {
        var entity = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == id && q.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"QueueItem {id} not found in county {countyId}.");

        entity.AssignedTo = assignedTo;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Assigned queue item {QueueItemId} to {AssignedTo} in county {CountyId}",
            id, assignedTo, countyId);

        return entity;
    }

    public async Task<QueueMetricsDto> GetMetricsAsync(Guid countyId)
    {
        var items = await _context.QueueItems
            .AsNoTracking()
            .Where(q => q.CountyId == countyId)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var completed = items.Where(q => q.Status == "completed" && q.CompletedAt.HasValue && q.StartedAt.HasValue).ToList();
        var avgDays = completed.Count > 0
            ? completed.Average(q => (q.CompletedAt!.Value - q.StartedAt!.Value).TotalDays)
            : 0;

        return new QueueMetricsDto
        {
            TotalQueued = items.Count(q => q.Status == "queued"),
            TotalInProgress = items.Count(q => q.Status == "in_progress"),
            TotalCompleted = items.Count(q => q.Status == "completed"),
            TotalFailed = items.Count(q => q.Status == "failed"),
            TotalEscalated = items.Count(q => q.Status == "escalated"),
            SlaViolations = items.Count(q => q.SlaDeadline.HasValue && q.SlaDeadline.Value < now && q.Status != "completed"),
            AvgDaysToComplete = Math.Round(avgDays, 1),
        };
    }

    public async Task<List<AppraiserProductivityDto>> GetProductivityAsync(Guid countyId)
    {
        var items = await _context.QueueItems
            .AsNoTracking()
            .Where(q => q.CountyId == countyId && q.AssignedTo != null)
            .ToListAsync();

        return items
            .GroupBy(q => q.AssignedTo!)
            .Select(g =>
            {
                var all = g.ToList();
                var completed = all.Where(q => q.Status == "completed" && q.CompletedAt.HasValue && q.StartedAt.HasValue).ToList();
                var failed = all.Count(q => q.Status == "failed");
                var total = all.Count;

                return new AppraiserProductivityDto
                {
                    Appraiser = g.Key,
                    Assigned = total,
                    Completed = completed.Count,
                    AvgDays = completed.Count > 0
                        ? Math.Round(completed.Average(q => (q.CompletedAt!.Value - q.StartedAt!.Value).TotalDays), 1)
                        : 0,
                    RejectRate = total > 0 ? Math.Round((double)failed / total * 100, 1) : 0,
                };
            })
            .OrderByDescending(p => p.Assigned)
            .ToList();
    }

    public async Task<QueueItem> ReviewAsync(Guid id, string action, Guid countyId, string? reviewer = null)
    {
        var newStatus = action switch
        {
            "approve" => "completed",
            "reject" => "failed",
            _ => throw new ArgumentException($"Invalid review action '{action}'. Use 'approve' or 'reject'."),
        };

        var entity = await _context.QueueItems
            .FirstOrDefaultAsync(q => q.Id == id && q.CountyId == countyId);

        if (entity is null)
            throw new KeyNotFoundException($"QueueItem {id} not found in county {countyId}.");

        entity.Status = newStatus;
        entity.UpdatedAt = DateTime.UtcNow;

        if (newStatus == "completed")
            entity.CompletedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(reviewer))
            entity.UpdatedBy = reviewer;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Reviewed queue item {QueueItemId} with action {Action} → {Status} in county {CountyId}",
            id, action, newStatus, countyId);

        return entity;
    }

    private static void PrepareForCreate(QueueItem entity, DateTime now)
    {
        if (entity.Id == Guid.Empty)
            entity.Id = Guid.NewGuid();

        entity.Priority = string.IsNullOrWhiteSpace(entity.Priority) ? "normal" : entity.Priority;
        entity.Status = string.IsNullOrWhiteSpace(entity.Status) ? "queued" : entity.Status;
        entity.SlaHours ??= GetDefaultSlaHours(entity.TaskType);
        entity.SlaDeadline ??= now.AddHours(entity.SlaHours.Value);
        entity.CreatedAt = entity.CreatedAt == default ? now : entity.CreatedAt;
        entity.UpdatedAt = now;
    }

    private static int GetDefaultSlaHours(string taskType)
    {
        return taskType switch
        {
            "FIELD_INSPECTION" => 72,
            "DESK_REVIEW" => 48,
            "APPEAL_PREPARATION" => 120,
            "EXEMPTION_REVIEW" => 96,
            "DATA_CORRECTION" => 24,
            "SUPERVISORY_REVIEW" => 48,
            _ => 72,
        };
    }
}
