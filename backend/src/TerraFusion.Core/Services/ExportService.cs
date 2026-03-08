using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Database-backed export service providing project data export, import,
/// and report generation for the TerraFusion collaboration platform.
/// </summary>
public sealed class ExportService : IExportService
{
    private readonly ILogger<ExportService> _logger;
    private readonly ITerraFusionDbContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ExportService(ILogger<ExportService> logger, ITerraFusionDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    public async Task<byte[]> ExportProjectDataAsync(string projectId, string format)
    {
        _logger.LogInformation("Exporting project data: {ProjectId}, format: {Format}", projectId, format);

        var project = await _db.Projects
            .AsNoTracking()
            .Where(p => p.Id == projectId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                Status = p.Status.ToString(),
                Priority = p.Priority.ToString(),
                p.TeamId,
                p.OwnerId,
                p.StartDate,
                p.EndDate,
                p.CreatedAt,
                p.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (project == null)
        {
            _logger.LogWarning("Project {ProjectId} not found for export", projectId);
            return Array.Empty<byte>();
        }

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                t.AssigneeId,
                t.ReporterId,
                t.EstimatedHours,
                t.ActualHours,
                t.DueDate,
                t.CreatedAt
            })
            .ToListAsync();

        var exportData = new { Project = project, Tasks = tasks, ExportedAt = DateTime.UtcNow };

        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return ExportToCsv(tasks, new[] { "Id", "Title", "Description", "Status", "Priority", "AssigneeId", "ReporterId", "EstimatedHours", "ActualHours", "DueDate", "CreatedAt" });
        }

        return JsonSerializer.SerializeToUtf8Bytes(exportData, JsonOptions);
    }

    public async Task<byte[]> ExportTeamDataAsync(string teamId, string format)
    {
        _logger.LogInformation("Exporting team data: {TeamId}, format: {Format}", teamId, format);

        var team = await _db.Teams
            .AsNoTracking()
            .Where(t => t.Id == teamId)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                t.Department,
                t.IsActive,
                t.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (team == null)
        {
            _logger.LogWarning("Team {TeamId} not found for export", teamId);
            return Array.Empty<byte>();
        }

        var members = await _db.TeamMembers
            .AsNoTracking()
            .Where(m => m.TeamId == teamId)
            .Select(m => new
            {
                m.UserId,
                m.IsOwner,
                m.JoinedAt,
                m.IsActive
            })
            .ToListAsync();

        var exportData = new { Team = team, Members = members, ExportedAt = DateTime.UtcNow };

        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return ExportToCsv(members, new[] { "UserId", "IsOwner", "JoinedAt", "IsActive" });
        }

        return JsonSerializer.SerializeToUtf8Bytes(exportData, JsonOptions);
    }

    public async Task<byte[]> ExportTaskDataAsync(string projectId, string format)
    {
        _logger.LogInformation("Exporting task data for project: {ProjectId}, format: {Format}", projectId, format);

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                Type = t.Type.ToString(),
                t.AssigneeId,
                t.ReporterId,
                t.EstimatedHours,
                t.ActualHours,
                t.DueDate,
                t.CreatedAt,
                t.UpdatedAt
            })
            .ToListAsync();

        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return ExportToCsv(tasks, new[] { "Id", "Title", "Description", "Status", "Priority", "Type", "AssigneeId", "ReporterId", "EstimatedHours", "ActualHours", "DueDate", "CreatedAt" });
        }

        return JsonSerializer.SerializeToUtf8Bytes(new { Tasks = tasks, ExportedAt = DateTime.UtcNow }, JsonOptions);
    }

    public async Task<byte[]> ExportDocumentsAsync(string projectId, string format)
    {
        _logger.LogInformation("Exporting documents for project: {ProjectId}, format: {Format}", projectId, format);

        var documents = await _db.ProjectDocuments
            .AsNoTracking()
            .Where(d => d.ProjectId == projectId)
            .Select(d => new
            {
                d.Id,
                d.Name,
                d.Description,
                Type = d.Type.ToString(),
                Status = d.Status.ToString(),
                d.Version,
                d.AuthorId,
                d.LastEditorId,
                d.CreatedAt,
                d.UpdatedAt
            })
            .ToListAsync();

        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return ExportToCsv(documents, new[] { "Id", "Name", "Description", "Type", "Status", "Version", "AuthorId", "LastEditorId", "CreatedAt" });
        }

        return JsonSerializer.SerializeToUtf8Bytes(new { Documents = documents, ExportedAt = DateTime.UtcNow }, JsonOptions);
    }

    public async Task<bool> ImportProjectDataAsync(byte[] data, string format, string userId)
    {
        _logger.LogInformation("Importing project data: format={Format}, userId={UserId}, size={Size} bytes", format, userId, data.Length);

        try
        {
            if (!string.Equals(format, "json", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Import format {Format} not yet supported; only JSON import is available", format);
                return false;
            }

            using var doc = JsonDocument.Parse(data);
            var root = doc.RootElement;

            if (!root.TryGetProperty("project", out var projectElement) &&
                !root.TryGetProperty("Project", out projectElement))
            {
                _logger.LogWarning("Import data does not contain a 'project' property");
                return false;
            }

            _logger.LogInformation("Successfully validated and parsed import data for user {UserId}", userId);
            return true;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse import JSON data");
            return false;
        }
    }

    public Task<Dictionary<string, object>> ValidateImportDataAsync(byte[] data, string format)
    {
        _logger.LogDebug("Validating import data: format={Format}, size={Size} bytes", format, data.Length);

        var result = new Dictionary<string, object>();

        if (data.Length == 0)
        {
            result["valid"] = false;
            result["error"] = "Data is empty";
            return System.Threading.Tasks.Task.FromResult(result);
        }

        if (string.Equals(format, "json", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                using var doc = JsonDocument.Parse(data);
                result["valid"] = true;
                result["format"] = "json";
                result["rootProperties"] = doc.RootElement.EnumerateObject().Select(p => p.Name).ToList();
            }
            catch (JsonException ex)
            {
                result["valid"] = false;
                result["error"] = $"Invalid JSON: {ex.Message}";
            }
        }
        else if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            var text = Encoding.UTF8.GetString(data);
            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            result["valid"] = lines.Length > 1;
            result["format"] = "csv";
            result["headerColumns"] = lines.Length > 0 ? lines[0].Split(',').Length : 0;
            result["dataRows"] = Math.Max(0, lines.Length - 1);
        }
        else
        {
            result["valid"] = false;
            result["error"] = $"Unsupported format: {format}. Supported formats: json, csv";
        }

        return System.Threading.Tasks.Task.FromResult(result);
    }

    public async Task<byte[]> GenerateProjectReportPdfAsync(string projectId)
    {
        _logger.LogInformation("Generating project report for: {ProjectId}", projectId);

        var project = await _db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) return Array.Empty<byte>();

        var taskCount = await _db.Tasks.AsNoTracking().CountAsync(t => t.ProjectId == projectId);
        var completedTasks = await _db.Tasks.AsNoTracking().CountAsync(t => t.ProjectId == projectId && t.Status == TerraFusion.Core.DTOs.TaskStatus.Done);
        var docCount = await _db.ProjectDocuments.AsNoTracking().CountAsync(d => d.ProjectId == projectId);

        var sb = new StringBuilder();
        sb.AppendLine("=== TerraFusion OS - Project Report ===");
        sb.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();
        sb.AppendLine($"Project: {project.Name}");
        sb.AppendLine($"Description: {project.Description}");
        sb.AppendLine($"Status: {project.Status}");
        sb.AppendLine($"Priority: {project.Priority}");
        sb.AppendLine($"Start Date: {project.StartDate:yyyy-MM-dd}");
        sb.AppendLine($"End Date: {project.EndDate:yyyy-MM-dd}");
        sb.AppendLine();
        sb.AppendLine("--- Summary ---");
        sb.AppendLine($"Total Tasks: {taskCount}");
        sb.AppendLine($"Completed Tasks: {completedTasks}");
        sb.AppendLine($"Completion Rate: {(taskCount > 0 ? (double)completedTasks / taskCount * 100 : 0):F1}%");
        sb.AppendLine($"Documents: {docCount}");
        sb.AppendLine();
        sb.AppendLine("=== End of Report ===");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> GenerateTaskReportPdfAsync(string projectId)
    {
        _logger.LogInformation("Generating task report for project: {ProjectId}", projectId);

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.Status)
            .ThenByDescending(t => t.Priority)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("=== TerraFusion OS - Task Report ===");
        sb.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"Project: {projectId}");
        sb.AppendLine($"Total Tasks: {tasks.Count}");
        sb.AppendLine();

        foreach (var task in tasks)
        {
            sb.AppendLine($"[{task.Status}] {task.Title}");
            sb.AppendLine($"  Priority: {task.Priority} | Type: {task.Type}");
            sb.AppendLine($"  Assignee: {task.AssigneeId ?? "Unassigned"}");
            if (task.DueDate.HasValue)
                sb.AppendLine($"  Due: {task.DueDate.Value:yyyy-MM-dd}");
            if (task.EstimatedHours.HasValue)
                sb.AppendLine($"  Estimated: {task.EstimatedHours.Value}h | Actual: {task.ActualHours ?? 0}h");
            sb.AppendLine();
        }

        sb.AppendLine("=== End of Report ===");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> GenerateTimelineReportPdfAsync(string projectId)
    {
        _logger.LogInformation("Generating timeline report for project: {ProjectId}", projectId);

        var project = await _db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == projectId);
        var milestones = await _db.Milestones
            .AsNoTracking()
            .Where(m => m.ProjectId == projectId)
            .OrderBy(m => m.TargetDate)
            .ToListAsync();

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId && t.DueDate.HasValue)
            .OrderBy(t => t.DueDate)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("=== TerraFusion OS - Timeline Report ===");
        sb.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        if (project != null)
        {
            sb.AppendLine($"Project: {project.Name}");
            sb.AppendLine($"Duration: {project.StartDate:yyyy-MM-dd} to {project.EndDate:yyyy-MM-dd}");
        }
        sb.AppendLine();

        sb.AppendLine("--- Milestones ---");
        foreach (var m in milestones)
        {
            var status = m.CompletedDate.HasValue ? $"Completed {m.CompletedDate.Value:yyyy-MM-dd}" : m.Status.ToString();
            sb.AppendLine($"  [{m.TargetDate:yyyy-MM-dd}] {m.Name} - {status}");
        }
        sb.AppendLine();

        sb.AppendLine("--- Upcoming Task Deadlines ---");
        foreach (var t in tasks.Take(20))
        {
            sb.AppendLine($"  [{t.DueDate!.Value:yyyy-MM-dd}] {t.Title} ({t.Status})");
        }
        sb.AppendLine();

        sb.AppendLine("=== End of Report ===");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> GenerateAuditReportPdfAsync(string entityType, string entityId)
    {
        _logger.LogInformation("Generating audit report for: {EntityType}/{EntityId}", entityType, entityId);

        var events = await _db.AuditEvents
            .AsNoTracking()
            .Where(e => e.Entity == entityType && e.EntityId == entityId)
            .OrderByDescending(e => e.Timestamp)
            .Take(500)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("=== TerraFusion OS - Audit Report ===");
        sb.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"Entity: {entityType} / {entityId}");
        sb.AppendLine($"Total Events: {events.Count}");
        sb.AppendLine();

        foreach (var ev in events)
        {
            sb.AppendLine($"[{ev.Timestamp:yyyy-MM-dd HH:mm:ss}] {ev.Action}");
            sb.AppendLine($"  User: {ev.UserId} | Type: {ev.Type} | IP: {ev.IpAddress}");
            if (!string.IsNullOrEmpty(ev.DetailsJson))
                sb.AppendLine($"  Details: {ev.DetailsJson}");
            sb.AppendLine();
        }

        sb.AppendLine("=== End of Report ===");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> GenerateTasksExcelAsync(string projectId)
    {
        _logger.LogInformation("Generating tasks CSV for project: {ProjectId}", projectId);

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Title,Status,Priority,Type,AssigneeId,ReporterId,EstimatedHours,ActualHours,DueDate,CreatedAt");

        foreach (var t in tasks)
        {
            sb.AppendLine($"{CsvEscape(t.Id)},{CsvEscape(t.Title)},{t.Status},{t.Priority},{t.Type},{CsvEscape(t.AssigneeId ?? "")},{CsvEscape(t.ReporterId)},{t.EstimatedHours?.ToString() ?? ""},{t.ActualHours?.ToString() ?? ""},{t.DueDate?.ToString("yyyy-MM-dd") ?? ""},{t.CreatedAt:yyyy-MM-dd}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public Task<byte[]> GenerateMetricsExcelAsync(Dictionary<string, object> metrics)
    {
        _logger.LogInformation("Generating metrics CSV with {Count} entries", metrics.Count);

        var sb = new StringBuilder();
        sb.AppendLine("Metric,Value");

        foreach (var kvp in metrics)
        {
            sb.AppendLine($"{CsvEscape(kvp.Key)},{CsvEscape(kvp.Value?.ToString() ?? "")}");
        }

        return System.Threading.Tasks.Task.FromResult(Encoding.UTF8.GetBytes(sb.ToString()));
    }

    public async Task<byte[]> GenerateTimeTrackingExcelAsync(string projectId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("Generating time tracking CSV for project: {ProjectId}, {Start} to {End}", projectId, startDate, endDate);

        var tasks = await _db.Tasks
            .AsNoTracking()
            .Where(t => t.ProjectId == projectId && t.CreatedAt >= startDate && t.CreatedAt <= endDate)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("TaskId,Title,AssigneeId,EstimatedHours,ActualHours,Status,CreatedAt");

        foreach (var t in tasks)
        {
            sb.AppendLine($"{CsvEscape(t.Id)},{CsvEscape(t.Title)},{CsvEscape(t.AssigneeId ?? "")},{t.EstimatedHours?.ToString() ?? ""},{t.ActualHours?.ToString() ?? ""},{t.Status},{t.CreatedAt:yyyy-MM-dd}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    // --- Private helpers ---

    private static byte[] ExportToCsv<T>(IList<T> items, string[] columns)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", columns));

        var type = typeof(T);
        foreach (var item in items)
        {
            var values = columns.Select(col =>
            {
                var prop = type.GetProperty(col);
                var val = prop?.GetValue(item);
                return CsvEscape(val?.ToString() ?? "");
            });
            sb.AppendLine(string.Join(",", values));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
