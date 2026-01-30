using System;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Abstraction for wrapping operations with real performance optimizations/measurements.
    /// Keeps implementation optional while allowing pipeline behaviors to depend on it.
    /// </summary>
    public interface IRealPerformanceService
    {
        Task<T> OptimizeAsync<T>(Func<Task<T>> operation, string contextName) where T : class;
        Task OptimizeAsync(Func<Task> operation, string contextName);
        // Extended surface used by QuantumPerformanceService and provided by RealPerformanceService
        Task<double> GetPerformanceImprovementAsync(string operationName);
        Task<RealPerformanceMetrics> GetMetricsAsync();
        Task OptimizeSystemResourcesAsync();
        Task<bool> EnablePerformanceOptimizationAsync();
        void RegisterPerformanceEvent(string eventName, TimeSpan duration, long memoryUsed);
        Task<RealSystemHealthStatus> GetSystemHealthAsync();
    }
}
