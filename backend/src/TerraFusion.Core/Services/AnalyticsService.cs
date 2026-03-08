using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Database-backed analytics service providing dashboard data, executive reports,
/// productivity analytics, and scheduled report management.
/// </summary>
public sealed class AnalyticsService : IAnalyticsService
{
    private readonly ILogger<AnalyticsService> _logger;
    private readonly ITerraFusionDbContext _db;

    private static readonly ConcurrentDictionary<string, ScheduledReport> ScheduledReports = new();

    public AnalyticsService(ILogger<AnalyticsService> logger, ITerraFusionDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    public async Task<Dictionary<string, object>> GetDashboardDataAsync(string userId, string dashboardType)
    {
        _logger.LogInformation("GetDashboardData: {UserId}/{DashboardType}", userId, dashboardType);

        var propertyCount = await _db.Properties.AsNoTracking().CountAsync();
        var userCount = await _db.GovernmentUsers.AsNoTracking().CountAsync();
        var taskCount = await _db.Tasks.AsNoTracking().CountAsync();
        var recentProjects = await _db.Projects
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new { p.Id, p.Name, Status = p.Status.ToString(), p.CreatedAt })
            .ToListAsync();

        var agentCount = await _db.AIAgents.AsNoTracking().CountAsync();
        var countyCount = await _db.Counties.AsNoTracking().CountAsync();

        return new Dictionary<string, object>
        {
            ["dashboardType"] = dashboardType,
            ["generatedAt"] = DateTime.UtcNow.ToString("O"),
            ["propertyCount"] = propertyCount,
            ["userCount"] = userCount,
            ["taskCount"] = taskCount,
            ["agentCount"] = agentCount,
            ["countyCount"] = countyCount,
            ["recentProjects"] = recentProjects
        };
    }

    public async Task<List<Dictionary<string, object>>> GetExecutiveReportsAsync(DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("GetExecutiveReports: {Start} to {End}", startDate, endDate);

        var reports = new List<Dictionary<string, object>>();

        // Properties assessment summary
        var propertiesInPeriod = await _db.Properties
            .AsNoTracking()
            .Where(p => p.AssessmentDate >= startDate && p.AssessmentDate <= endDate)
            .CountAsync();

        var totalAssessedValue = await _db.Properties
            .AsNoTracking()
            .Where(p => p.AssessmentDate >= startDate && p.AssessmentDate <= endDate)
            .SumAsync(p => (decimal?)p.AssessedValue) ?? 0;

        reports.Add(new Dictionary<string, object>
        {
            ["reportType"] = "PropertyAssessment",
            ["period"] = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
            ["propertiesAssessed"] = propertiesInPeriod,
            ["totalAssessedValue"] = totalAssessedValue
        });

        // Task completion summary
        var tasksCreated = await _db.Tasks.AsNoTracking()
            .Where(t => t.CreatedAt >= startDate && t.CreatedAt <= endDate)
            .CountAsync();

        var tasksCompleted = await _db.Tasks.AsNoTracking()
            .Where(t => t.UpdatedAt >= startDate && t.UpdatedAt <= endDate && t.Status == DTOs.TaskStatus.Done)
            .CountAsync();

        reports.Add(new Dictionary<string, object>
        {
            ["reportType"] = "TaskCompletion",
            ["period"] = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
            ["tasksCreated"] = tasksCreated,
            ["tasksCompleted"] = tasksCompleted
        });

        // Security events summary
        var securityEventCount = await _db.SecurityEvents.AsNoTracking()
            .Where(e => e.Timestamp >= startDate && e.Timestamp <= endDate)
            .CountAsync();

        reports.Add(new Dictionary<string, object>
        {
            ["reportType"] = "SecurityOverview",
            ["period"] = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
            ["securityEvents"] = securityEventCount
        });

        return reports;
    }

    public async Task<Dictionary<string, object>> GetProductivityAnalyticsAsync(string teamId, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("GetProductivityAnalytics: {TeamId}, {Start} to {End}", teamId, startDate, endDate);

        // Get projects for this team
        var projectIds = await _db.Projects
            .AsNoTracking()
            .Where(p => p.TeamId == teamId)
            .Select(p => p.Id)
            .ToListAsync();

        var totalTasks = await _db.Tasks.AsNoTracking()
            .Where(t => projectIds.Contains(t.ProjectId) && t.CreatedAt >= startDate && t.CreatedAt <= endDate)
            .CountAsync();

        var completedTasks = await _db.Tasks.AsNoTracking()
            .Where(t => projectIds.Contains(t.ProjectId) && t.Status == DTOs.TaskStatus.Done
                && t.UpdatedAt >= startDate && t.UpdatedAt <= endDate)
            .CountAsync();

        var totalEstimated = await _db.Tasks.AsNoTracking()
            .Where(t => projectIds.Contains(t.ProjectId) && t.CreatedAt >= startDate && t.CreatedAt <= endDate && t.EstimatedHours != null)
            .SumAsync(t => (decimal?)t.EstimatedHours) ?? 0;

        var totalActual = await _db.Tasks.AsNoTracking()
            .Where(t => projectIds.Contains(t.ProjectId) && t.CreatedAt >= startDate && t.CreatedAt <= endDate && t.ActualHours != null)
            .SumAsync(t => (decimal?)t.ActualHours) ?? 0;

        return new Dictionary<string, object>
        {
            ["teamId"] = teamId,
            ["period"] = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
            ["projectCount"] = projectIds.Count,
            ["totalTasks"] = totalTasks,
            ["completedTasks"] = completedTasks,
            ["completionRate"] = totalTasks > 0 ? Math.Round((double)completedTasks / totalTasks * 100, 1) : 0,
            ["totalEstimatedHours"] = totalEstimated,
            ["totalActualHours"] = totalActual
        };
    }

    public async Task<Dictionary<string, object>> GetCollaborationTrendsAsync(DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation("GetCollaborationTrends: {Start} to {End}", startDate, endDate);

        var projectsCreated = await _db.Projects.AsNoTracking()
            .Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate)
            .CountAsync();

        var documentsCreated = await _db.ProjectDocuments.AsNoTracking()
            .Where(d => d.CreatedAt >= startDate && d.CreatedAt <= endDate)
            .CountAsync();

        var taskComments = await _db.TaskComments.AsNoTracking()
            .Where(c => c.CreatedAt >= startDate && c.CreatedAt <= endDate)
            .CountAsync();

        var activeTeams = await _db.Teams.AsNoTracking()
            .Where(t => t.IsActive)
            .CountAsync();

        return new Dictionary<string, object>
        {
            ["period"] = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
            ["projectsCreated"] = projectsCreated,
            ["documentsCreated"] = documentsCreated,
            ["taskComments"] = taskComments,
            ["activeTeams"] = activeTeams
        };
    }

    public async Task<List<Dictionary<string, object>>> GetPerformanceMetricsAsync(string entityType, string entityId)
    {
        _logger.LogInformation("GetPerformanceMetrics: {EntityType}/{EntityId}", entityType, entityId);

        var metrics = await _db.PerformanceMetrics
            .AsNoTracking()
            .Where(m => m.RelatedEntityType == entityType &&
                       (entityId == "*" || m.RelatedEntityId.ToString() == entityId))
            .OrderByDescending(m => m.Timestamp)
            .Take(100)
            .Select(m => new Dictionary<string, object>
            {
                ["id"] = m.Id.ToString(),
                ["metricName"] = m.MetricName,
                ["metricType"] = m.MetricType,
                ["value"] = m.Value,
                ["unit"] = (object)(m.Unit ?? ""),
                ["source"] = (object)(m.Source ?? ""),
                ["timestamp"] = m.Timestamp.ToString("O")
            })
            .ToListAsync();

        return metrics;
    }

    public async Task<byte[]> GenerateReportPdfAsync(string reportType, Dictionary<string, object> parameters)
    {
        _logger.LogInformation("GenerateReportPdf: {ReportType}", reportType);

        var sb = new StringBuilder();
        sb.AppendLine($"=== TerraFusion OS - {reportType} Report ===");
        sb.AppendLine($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();

        // Include parameters
        foreach (var param in parameters)
        {
            sb.AppendLine($"  {param.Key}: {param.Value}");
        }
        sb.AppendLine();

        // Include summary data based on report type
        var propertyCount = await _db.Properties.AsNoTracking().CountAsync();
        var taskCount = await _db.Tasks.AsNoTracking().CountAsync();

        sb.AppendLine("--- System Summary ---");
        sb.AppendLine($"Total Properties: {propertyCount}");
        sb.AppendLine($"Total Tasks: {taskCount}");
        sb.AppendLine();
        sb.AppendLine("=== End of Report ===");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> GenerateReportExcelAsync(string reportType, Dictionary<string, object> parameters)
    {
        _logger.LogInformation("GenerateReportExcel: {ReportType}", reportType);

        var sb = new StringBuilder();
        sb.AppendLine("Metric,Value");

        var propertyCount = await _db.Properties.AsNoTracking().CountAsync();
        var taskCount = await _db.Tasks.AsNoTracking().CountAsync();
        var userCount = await _db.GovernmentUsers.AsNoTracking().CountAsync();
        var countyCount = await _db.Counties.AsNoTracking().CountAsync();

        sb.AppendLine($"ReportType,{reportType}");
        sb.AppendLine($"GeneratedAt,{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"TotalProperties,{propertyCount}");
        sb.AppendLine($"TotalTasks,{taskCount}");
        sb.AppendLine($"TotalUsers,{userCount}");
        sb.AppendLine($"TotalCounties,{countyCount}");

        foreach (var param in parameters)
        {
            sb.AppendLine($"{CsvEscape(param.Key)},{CsvEscape(param.Value?.ToString() ?? "")}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public Task<string> ScheduleReportAsync(string reportType, Dictionary<string, object> parameters, string schedule, string userId)
    {
        var id = Guid.NewGuid().ToString();
        _logger.LogInformation("ScheduleReport: {ReportType} for {UserId}, schedule={Schedule}, id={Id}", reportType, userId, schedule, id);

        ScheduledReports[id] = new ScheduledReport
        {
            Id = id,
            ReportType = reportType,
            Parameters = parameters,
            Schedule = schedule,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        return System.Threading.Tasks.Task.FromResult(id);
    }

    public Task<bool> CancelScheduledReportAsync(string scheduleId)
    {
        _logger.LogInformation("CancelScheduledReport: {ScheduleId}", scheduleId);
        var removed = ScheduledReports.TryRemove(scheduleId, out _);
        return System.Threading.Tasks.Task.FromResult(removed);
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private sealed class ScheduledReport
    {
        public string Id { get; set; } = string.Empty;
        public string ReportType { get; set; } = string.Empty;
        public Dictionary<string, object> Parameters { get; set; } = new();
        public string Schedule { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
