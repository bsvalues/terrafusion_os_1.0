using System.Threading.Tasks;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Swarm intelligence service for AI agent coordination and optimization.
/// Delegates to the ConsciousnessEngine for real swarm operations.
/// </summary>
public interface ISwarmIntelligenceService
{
    System.Threading.Tasks.Task<object> GetSwarmDataAsync();
    System.Threading.Tasks.Task<SwarmOptimizedForecastResult> OptimizeAsync(SwarmOptimizationRequest request);
}
