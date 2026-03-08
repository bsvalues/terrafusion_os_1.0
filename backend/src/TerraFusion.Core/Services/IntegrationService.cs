using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Integration service providing Harris PACS property data access from the database,
/// system integration CRUD operations, and basic local file transfer operations.
/// Tyler Technologies and Aumentum integrations remain stubbed for R19/R20.
/// </summary>
public sealed class IntegrationService : IIntegrationService
{
    private readonly ILogger<IntegrationService> _logger;
    private readonly ITerraFusionDbContext _db;
    private readonly IConfiguration _configuration;

    /// <summary>
    /// In-memory registry keyed by integration ID, storing (projectId, dto) pairs.
    /// </summary>
    private readonly ConcurrentDictionary<string, (string ProjectId, SystemIntegrationDto Dto)> _integrations = new();

    public IntegrationService(
        ILogger<IntegrationService> logger,
        ITerraFusionDbContext db,
        IConfiguration configuration)
    {
        _logger = logger;
        _db = db;
        _configuration = configuration;
    }

    public Task<List<SystemIntegrationDto>> GetSystemIntegrationsAsync(string projectId)
    {
        _logger.LogDebug("GetSystemIntegrations: {ProjectId}", projectId);
        var integrations = _integrations.Values
            .Where(i => string.IsNullOrEmpty(projectId) || i.ProjectId == projectId)
            .Select(i => i.Dto)
            .ToList();
        return Task.FromResult(integrations);
    }

    public Task<SystemIntegrationDto?> GetSystemIntegrationAsync(string integrationId)
    {
        _integrations.TryGetValue(integrationId, out var entry);
        return Task.FromResult<SystemIntegrationDto?>(entry.Dto);
    }

    public Task<SystemIntegrationDto> CreateSystemIntegrationAsync(string projectId, SystemIntegrationDto integrationDto)
    {
        var id = Guid.NewGuid().ToString();
        _integrations[id] = (projectId, integrationDto);
        _logger.LogInformation("Created integration {IntegrationId} for project {ProjectId}", id, projectId);
        return Task.FromResult(integrationDto);
    }

    public Task<SystemIntegrationDto?> UpdateSystemIntegrationAsync(string integrationId, SystemIntegrationDto integrationDto)
    {
        if (_integrations.TryGetValue(integrationId, out var existing))
        {
            _integrations[integrationId] = (existing.ProjectId, integrationDto);
            _logger.LogInformation("Updated integration {IntegrationId}", integrationId);
            return Task.FromResult<SystemIntegrationDto?>(integrationDto);
        }

        _logger.LogWarning("Integration not found for update: {IntegrationId}", integrationId);
        return Task.FromResult<SystemIntegrationDto?>(null);
    }

    public Task<bool> DeleteSystemIntegrationAsync(string integrationId)
    {
        var removed = _integrations.TryRemove(integrationId, out _);
        _logger.LogInformation("Delete integration {IntegrationId}: {Result}", integrationId, removed);
        return Task.FromResult(removed);
    }

    public Task<bool> TestIntegrationConnectionAsync(string integrationId)
    {
        var exists = _integrations.ContainsKey(integrationId);
        _logger.LogDebug("TestIntegrationConnection: {IntegrationId}, exists={Exists}", integrationId, exists);
        return Task.FromResult(exists);
    }

    public Task<bool> SyncIntegrationDataAsync(string integrationId)
    {
        _logger.LogInformation("SyncIntegrationData: {IntegrationId}", integrationId);
        return Task.FromResult(_integrations.ContainsKey(integrationId));
    }

    public Task<Dictionary<string, object>> GetIntegrationStatusAsync(string integrationId)
    {
        var found = _integrations.ContainsKey(integrationId);
        return Task.FromResult(new Dictionary<string, object>
        {
            ["status"] = found ? "connected" : "not_found",
            ["lastSync"] = DateTime.UtcNow.ToString("O"),
            ["integrationId"] = integrationId
        });
    }

    public Task<Dictionary<string, object>> GetHarrisPACSStatusAsync()
    {
        var connectionString = _configuration.GetConnectionString("HarrisPACS");
        var hasConnection = !string.IsNullOrEmpty(connectionString);

        return Task.FromResult(new Dictionary<string, object>
        {
            ["status"] = hasConnection ? "connected" : "available",
            ["version"] = "9.0",
            ["connectionConfigured"] = hasConnection,
            ["dataSource"] = "TerraFusion.Properties (Benton County)",
            ["checkedAt"] = DateTime.UtcNow.ToString("O")
        });
    }

    public Task<bool> SyncHarrisPACSDataAsync(string countyId)
    {
        _logger.LogInformation("SyncHarrisPACSData: {CountyId} - Data is served directly from Properties table", countyId);
        return Task.FromResult(true);
    }

    public async Task<List<Dictionary<string, object>>> GetHarrisPACSPropertiesAsync(string countyId, int page = 1, int pageSize = 100)
    {
        _logger.LogInformation("GetHarrisPACSProperties: county={CountyId}, page={Page}, pageSize={PageSize}", countyId, page, pageSize);

        // Query real property data from the database
        var query = _db.Properties.AsNoTracking().AsQueryable();

        if (Guid.TryParse(countyId, out var countyGuid))
        {
            query = query.Where(p => p.CountyId == countyGuid);
        }

        var properties = await query
            .OrderBy(p => p.ParcelNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new Dictionary<string, object>
            {
                ["propertyId"] = p.PropertyId,
                ["parcelId"] = p.ParcelId,
                ["parcelNumber"] = p.ParcelNumber,
                ["address"] = p.Address,
                ["ownerName"] = (object)(p.OwnerName ?? ""),
                ["propertyType"] = (object)(p.PropertyType ?? ""),
                ["assessedValue"] = p.AssessedValue,
                ["landValue"] = p.LandValue,
                ["improvementValue"] = p.ImprovementValue,
                ["marketValue"] = p.MarketValue,
                ["yearBuilt"] = (object)(p.YearBuilt ?? 0),
                ["taxYear"] = p.TaxYear,
                ["assessmentDate"] = p.AssessmentDate.ToString("O")
            })
            .ToListAsync();

        _logger.LogInformation("Returned {Count} properties for county {CountyId}", properties.Count, countyId);
        return properties;
    }

    public Task<Dictionary<string, object>> GetTylerTechStatusAsync()
    {
        _logger.LogDebug("GetTylerTechStatus: Tyler Technologies Vision integration planned for R19");
        return Task.FromResult(new Dictionary<string, object>
        {
            ["status"] = "planned",
            ["version"] = "Vision",
            ["note"] = "Tyler Technologies integration scheduled for Sprint R19"
        });
    }

    public Task<bool> SyncTylerTechDataAsync(string countyId)
    {
        _logger.LogInformation("SyncTylerTechData: {CountyId} - Tyler Technologies sync planned for R19", countyId);
        return Task.FromResult(false);
    }

    public Task<List<Dictionary<string, object>>> GetTylerTechDataAsync(string countyId, string dataType, int page = 1, int pageSize = 100)
    {
        _logger.LogDebug("GetTylerTechData: {CountyId}/{DataType} - Tyler Technologies data access planned for R19", countyId, dataType);
        return Task.FromResult(new List<Dictionary<string, object>>());
    }

    public async Task<bool> UploadFileAsync(string integrationId, string localFilePath, string remoteFilePath)
    {
        _logger.LogInformation("UploadFile: {IntegrationId}, {LocalPath} -> {RemotePath}", integrationId, localFilePath, remoteFilePath);

        try
        {
            if (!File.Exists(localFilePath))
            {
                _logger.LogWarning("Local file not found for upload: {LocalPath}", localFilePath);
                return false;
            }

            var remoteDir = Path.GetDirectoryName(remoteFilePath);
            if (!string.IsNullOrEmpty(remoteDir) && !Directory.Exists(remoteDir))
            {
                Directory.CreateDirectory(remoteDir);
            }

            await Task.Run(() => File.Copy(localFilePath, remoteFilePath, overwrite: true));
            _logger.LogInformation("File uploaded successfully: {RemotePath}", remoteFilePath);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File upload failed: {LocalPath} -> {RemotePath}", localFilePath, remoteFilePath);
            return false;
        }
    }

    public async Task<bool> DownloadFileAsync(string integrationId, string remoteFilePath, string localFilePath)
    {
        _logger.LogInformation("DownloadFile: {IntegrationId}, {RemotePath} -> {LocalPath}", integrationId, remoteFilePath, localFilePath);

        try
        {
            if (!File.Exists(remoteFilePath))
            {
                _logger.LogWarning("Remote file not found for download: {RemotePath}", remoteFilePath);
                return false;
            }

            var localDir = Path.GetDirectoryName(localFilePath);
            if (!string.IsNullOrEmpty(localDir) && !Directory.Exists(localDir))
            {
                Directory.CreateDirectory(localDir);
            }

            await Task.Run(() => File.Copy(remoteFilePath, localFilePath, overwrite: true));
            _logger.LogInformation("File downloaded successfully: {LocalPath}", localFilePath);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "File download failed: {RemotePath} -> {LocalPath}", remoteFilePath, localFilePath);
            return false;
        }
    }

    public Task<List<string>> ListDirectoryAsync(string integrationId, string remotePath)
    {
        _logger.LogDebug("ListDirectory: {IntegrationId}, path={RemotePath}", integrationId, remotePath);

        try
        {
            if (Directory.Exists(remotePath))
            {
                var entries = Directory.GetFileSystemEntries(remotePath)
                    .Select(Path.GetFileName)
                    .Where(name => name != null)
                    .Cast<string>()
                    .ToList();
                return Task.FromResult(entries);
            }

            _logger.LogWarning("Directory not found: {RemotePath}", remotePath);
            return Task.FromResult(new List<string>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list directory: {RemotePath}", remotePath);
            return Task.FromResult(new List<string>());
        }
    }

    public Task<bool> DeleteRemoteFileAsync(string integrationId, string remoteFilePath)
    {
        _logger.LogInformation("DeleteRemoteFile: {IntegrationId}, {RemotePath}", integrationId, remoteFilePath);

        try
        {
            if (File.Exists(remoteFilePath))
            {
                File.Delete(remoteFilePath);
                _logger.LogInformation("File deleted: {RemotePath}", remoteFilePath);
                return Task.FromResult(true);
            }

            _logger.LogWarning("File not found for deletion: {RemotePath}", remoteFilePath);
            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file: {RemotePath}", remoteFilePath);
            return Task.FromResult(false);
        }
    }
}
