using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Stub implementation of IExportService.
/// Returns empty byte arrays for export/generation operations.
/// </summary>
public sealed class ExportService : IExportService
{
    private readonly ILogger<ExportService> _logger;

    public ExportService(ILogger<ExportService> logger)
    {
        _logger = logger;
    }

    public Task<byte[]> ExportProjectDataAsync(string projectId, string format)
    {
        _logger.LogWarning("ExportProjectData: {ProjectId}/{Format} (stub)", projectId, format);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> ExportTeamDataAsync(string teamId, string format)
    {
        _logger.LogWarning("ExportTeamData: {TeamId}/{Format} (stub)", teamId, format);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> ExportTaskDataAsync(string projectId, string format)
    {
        _logger.LogWarning("ExportTaskData: {ProjectId}/{Format} (stub)", projectId, format);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> ExportDocumentsAsync(string projectId, string format)
    {
        _logger.LogWarning("ExportDocuments: {ProjectId}/{Format} (stub)", projectId, format);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<bool> ImportProjectDataAsync(byte[] data, string format, string userId)
    {
        _logger.LogWarning("ImportProjectData: format={Format} (stub — no-op)", format);
        return Task.FromResult(false);
    }

    public Task<Dictionary<string, object>> ValidateImportDataAsync(byte[] data, string format)
    {
        _logger.LogDebug("ValidateImportData: format={Format} (stub)", format);
        return Task.FromResult(new Dictionary<string, object>
        {
            ["valid"] = true,
            ["stub"] = true
        });
    }

    public Task<byte[]> GenerateProjectReportPdfAsync(string projectId)
    {
        _logger.LogWarning("GenerateProjectReportPdf: {ProjectId} (stub)", projectId);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> GenerateTaskReportPdfAsync(string projectId)
    {
        _logger.LogWarning("GenerateTaskReportPdf: {ProjectId} (stub)", projectId);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> GenerateTimelineReportPdfAsync(string projectId)
    {
        _logger.LogWarning("GenerateTimelineReportPdf: {ProjectId} (stub)", projectId);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> GenerateAuditReportPdfAsync(string entityType, string entityId)
    {
        _logger.LogWarning("GenerateAuditReportPdf: {EntityType}/{EntityId} (stub)", entityType, entityId);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> GenerateTasksExcelAsync(string projectId)
    {
        _logger.LogWarning("GenerateTasksExcel: {ProjectId} (stub)", projectId);
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> GenerateMetricsExcelAsync(Dictionary<string, object> metrics)
    {
        _logger.LogWarning("GenerateMetricsExcel (stub)");
        return Task.FromResult(Array.Empty<byte>());
    }

    public Task<byte[]> GenerateTimeTrackingExcelAsync(string projectId, DateTime startDate, DateTime endDate)
    {
        _logger.LogWarning("GenerateTimeTrackingExcel: {ProjectId} (stub)", projectId);
        return Task.FromResult(Array.Empty<byte>());
    }
}
