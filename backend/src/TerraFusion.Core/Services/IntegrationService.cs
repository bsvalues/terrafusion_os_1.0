using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Stub implementation of IIntegrationService.
/// Returns empty/default results for all integration operations.
/// </summary>
public sealed class IntegrationService : IIntegrationService
{
    private readonly ILogger<IntegrationService> _logger;

    public IntegrationService(ILogger<IntegrationService> logger)
    {
        _logger = logger;
    }

    public Task<List<SystemIntegrationDto>> GetSystemIntegrationsAsync(string projectId)
    {
        _logger.LogDebug("GetSystemIntegrations: {ProjectId} (stub)", projectId);
        return Task.FromResult(new List<SystemIntegrationDto>());
    }

    public Task<SystemIntegrationDto?> GetSystemIntegrationAsync(string integrationId)
    {
        _logger.LogDebug("GetSystemIntegration: {IntegrationId} (stub)", integrationId);
        return Task.FromResult<SystemIntegrationDto?>(null);
    }

    public Task<SystemIntegrationDto> CreateSystemIntegrationAsync(string projectId, SystemIntegrationDto integrationDto)
    {
        _logger.LogInformation("CreateSystemIntegration: {ProjectId} (stub)", projectId);
        return Task.FromResult(integrationDto);
    }

    public Task<SystemIntegrationDto?> UpdateSystemIntegrationAsync(string integrationId, SystemIntegrationDto integrationDto)
    {
        _logger.LogDebug("UpdateSystemIntegration: {IntegrationId} (stub)", integrationId);
        return Task.FromResult<SystemIntegrationDto?>(integrationDto);
    }

    public Task<bool> DeleteSystemIntegrationAsync(string integrationId)
    {
        _logger.LogInformation("DeleteSystemIntegration: {IntegrationId} (stub)", integrationId);
        return Task.FromResult(true);
    }

    public Task<bool> TestIntegrationConnectionAsync(string integrationId)
    {
        _logger.LogDebug("TestIntegrationConnection: {IntegrationId} (stub)", integrationId);
        return Task.FromResult(true);
    }

    public Task<bool> SyncIntegrationDataAsync(string integrationId)
    {
        _logger.LogDebug("SyncIntegrationData: {IntegrationId} (stub)", integrationId);
        return Task.FromResult(true);
    }

    public Task<Dictionary<string, object>> GetIntegrationStatusAsync(string integrationId)
    {
        return Task.FromResult(new Dictionary<string, object>
        {
            ["status"] = "connected",
            ["lastSync"] = DateTime.UtcNow.ToString("O"),
            ["stub"] = true
        });
    }

    public Task<Dictionary<string, object>> GetHarrisPACSStatusAsync()
    {
        return Task.FromResult(new Dictionary<string, object>
        {
            ["status"] = "available",
            ["version"] = "9.0",
            ["stub"] = true
        });
    }

    public Task<bool> SyncHarrisPACSDataAsync(string countyId)
    {
        _logger.LogInformation("SyncHarrisPACSData: {CountyId} (stub)", countyId);
        return Task.FromResult(true);
    }

    public Task<List<Dictionary<string, object>>> GetHarrisPACSPropertiesAsync(string countyId, int page = 1, int pageSize = 100)
    {
        _logger.LogDebug("GetHarrisPACSProperties: {CountyId} page={Page} (stub)", countyId, page);
        return Task.FromResult(new List<Dictionary<string, object>>());
    }

    public Task<Dictionary<string, object>> GetTylerTechStatusAsync()
    {
        return Task.FromResult(new Dictionary<string, object>
        {
            ["status"] = "available",
            ["stub"] = true
        });
    }

    public Task<bool> SyncTylerTechDataAsync(string countyId)
    {
        _logger.LogInformation("SyncTylerTechData: {CountyId} (stub)", countyId);
        return Task.FromResult(true);
    }

    public Task<List<Dictionary<string, object>>> GetTylerTechDataAsync(string countyId, string dataType, int page = 1, int pageSize = 100)
    {
        _logger.LogDebug("GetTylerTechData: {CountyId}/{DataType} (stub)", countyId, dataType);
        return Task.FromResult(new List<Dictionary<string, object>>());
    }

    public Task<bool> UploadFileAsync(string integrationId, string localFilePath, string remoteFilePath)
    {
        _logger.LogWarning("UploadFile: {IntegrationId} (stub — no-op)", integrationId);
        return Task.FromResult(false);
    }

    public Task<bool> DownloadFileAsync(string integrationId, string remoteFilePath, string localFilePath)
    {
        _logger.LogWarning("DownloadFile: {IntegrationId} (stub — no-op)", integrationId);
        return Task.FromResult(false);
    }

    public Task<List<string>> ListDirectoryAsync(string integrationId, string remotePath)
    {
        _logger.LogDebug("ListDirectory: {IntegrationId} (stub)", integrationId);
        return Task.FromResult(new List<string>());
    }

    public Task<bool> DeleteRemoteFileAsync(string integrationId, string remoteFilePath)
    {
        _logger.LogWarning("DeleteRemoteFile: {IntegrationId} (stub — no-op)", integrationId);
        return Task.FromResult(false);
    }
}
