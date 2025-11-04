using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public interface IAIAnalyticsService
    {
        System.Threading.Tasks.Task<AIAnalyticsDataDto> GetAnalyticsDataAsync();
    }
}
