using TerraFusion.Core.Models;

namespace TerraFusion.Sync.Services
{
    /// <summary>
    /// Generic interface for legacy system connectors
    /// DNA extracted from terra-sync-production proven patterns
    /// </summary>
    public interface ILegacySystemConnector
    {
        /// <summary>
        /// Validate connection to legacy system
        /// </summary>
        Task<ConnectionValidationResult> ValidateConnectionAsync();

        /// <summary>
        /// Get property changes since specified date
        /// </summary>
        Task<IEnumerable<PropertyRecord>> GetPropertyChangesAsync(DateTime since);

        /// <summary>
        /// Get system health information
        /// </summary>
        Task<SystemHealthInfo> GetSystemHealthAsync();

        /// <summary>
        /// Test connectivity and performance
        /// </summary>
        Task<PerformanceMetrics> GetPerformanceMetricsAsync();
    }

    public class SystemHealthInfo
    {
        public string Status { get; set; } = string.Empty;
        public DateTime LastChecked { get; set; }
        public double ResponseTimeMs { get; set; }
        public long ActiveConnections { get; set; }
        public string Version { get; set; } = string.Empty;
        public Dictionary<string, object> AdditionalInfo { get; set; } = new();
    }

    public class PerformanceMetrics
    {
        public double AverageResponseTimeMs { get; set; }
        public double P95ResponseTimeMs { get; set; }
        public long QueriesPerSecond { get; set; }
        public double ErrorRate { get; set; }
        public long MemoryUsageMB { get; set; }
        public DateTime MeasuredAt { get; set; }
    }
}
