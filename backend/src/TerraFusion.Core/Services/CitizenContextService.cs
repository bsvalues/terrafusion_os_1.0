using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Stub implementation of ICitizenContextService.
/// Returns default citizen context data for all operations.
/// </summary>
public sealed class CitizenContextService : ICitizenContextService
{
    private readonly ILogger<CitizenContextService> _logger;

    public CitizenContextService(ILogger<CitizenContextService> logger)
    {
        _logger = logger;
    }

    public Task<CitizenContextDto> GetCitizenContextAsync(string citizenId)
    {
        _logger.LogDebug("GetCitizenContext: {CitizenId} (stub)", citizenId);
        return Task.FromResult(new CitizenContextDto
        {
            CitizenId = citizenId,
            LastActivity = DateTime.UtcNow,
            IsAuthenticated = false
        });
    }

    public Task<bool> UpdateCitizenContextAsync(string citizenId, CitizenContextDto context)
    {
        _logger.LogDebug("UpdateCitizenContext: {CitizenId} (stub)", citizenId);
        return Task.FromResult(true);
    }

    public Task<bool> ValidateCitizenAccessAsync(string citizenId, string serviceEndpoint)
    {
        _logger.LogDebug("ValidateCitizenAccess: {CitizenId}/{Endpoint} (stub)", citizenId, serviceEndpoint);
        return Task.FromResult(true);
    }

    public Task<double> GetCitizenSatisfactionScoreAsync(string? citizenId)
    {
        _logger.LogDebug("GetCitizenSatisfactionScore: {CitizenId} (stub)", citizenId ?? "all");
        return Task.FromResult(0.0);
    }

    public Task UpdateCitizenInteractionAsync(string? citizenId, CitizenInteraction interaction)
    {
        _logger.LogDebug("UpdateCitizenInteraction: {CitizenId} (stub)", citizenId ?? "anonymous");
        return Task.CompletedTask;
    }

    public Task<CitizenInsights> GetCitizenInsightsAsync(string? citizenId)
    {
        _logger.LogDebug("GetCitizenInsights: {CitizenId} (stub)", citizenId ?? "all");
        return Task.FromResult(new CitizenInsights
        {
            CitizenId = citizenId ?? string.Empty
        });
    }

    public Task<Dictionary<string, object>> GetPopulationInsightsAsync()
    {
        _logger.LogDebug("GetPopulationInsights (stub)");
        return Task.FromResult(new Dictionary<string, object>
        {
            ["stub"] = true
        });
    }
}
