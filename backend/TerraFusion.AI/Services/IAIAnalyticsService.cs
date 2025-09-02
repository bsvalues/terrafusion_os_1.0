using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IAIAnalyticsService
    {
        Task<AIAnalyticsDataDto> GetAnalyticsDataAsync();
    }
}
