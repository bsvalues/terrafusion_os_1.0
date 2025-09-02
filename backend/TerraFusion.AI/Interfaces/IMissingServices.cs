using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Interfaces
{
    public interface IRevenueDataService
    {
        Task<decimal> GetTotalRevenueAsync();
        Task<decimal[]> GetRevenueHistoryAsync(int months);
        Task<decimal> GetProjectedRevenueAsync();
    }

    public interface ISwarmIntelligenceService
    {
        Task<SwarmOptimizationResult> OptimizeSwarmPerformanceAsync();
        Task<AgentCoordinationMetrics> GetCoordinationMetricsAsync();
        Task<bool> ScaleSwarmAsync(int targetAgentCount);
    }
}
