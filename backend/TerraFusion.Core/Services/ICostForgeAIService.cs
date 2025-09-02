using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services;

public interface ICostForgeAIService
{
    Task<CostForgeStatusDto> GetSystemStatusAsync();
    Task<PropertyValuationDto> CalculatePropertyValuationAsync(PropertyValuationRequestDto request);
    Task<BatchValuationResultDto> BatchCalculateValuationsAsync(BatchValuationRequestDto request);
    Task<AIAgentStatusDto> GetAIAgentStatusAsync();
    Task ScaleAIAgentsAsync(int targetCount);
    Task<PerformanceMetricsDto> GetPerformanceMetricsAsync();
    Task<HarrisSyncResultDto> SyncWithHarrisPACSAsync(HarrisSyncRequestDto request);
    Task<ModuleHealthDto> GetModuleHealthAsync();
    Task StartModuleAsync();
    Task StopModuleAsync();
    Task<AnalyticsDto> GetAnalyticsAsync(DateTime? startDate, DateTime? endDate);
}
