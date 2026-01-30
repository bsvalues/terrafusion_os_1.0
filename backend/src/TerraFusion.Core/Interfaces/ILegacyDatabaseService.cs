using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Interfaces
{
    /// <summary>
    /// Generic Legacy Database Service Interface
    /// Provides unified access to various legacy government property systems
    /// while maintaining vendor-specific implementations behind the scenes
    /// </summary>
    public interface ILegacyDatabaseService
    {
        /// <summary>
        /// Legacy system identifier (e.g., "HARRIS_PACS", "TYLER_TECH", "CAMA_PLUS")
        /// </summary>
        string SystemType { get; }
        
        /// <summary>
        /// System version information
        /// </summary>
        string SystemVersion { get; }
        
        /// <summary>
        /// County jurisdiction this legacy system serves
        /// </summary>
        string Jurisdiction { get; }

        /// <summary>
        /// Test connection to legacy database system
        /// </summary>
        Task<bool> TestConnectionAsync();

        /// <summary>
        /// Synchronize property data from legacy system
        /// </summary>
        Task<LegacyDataSyncResult> SyncPropertyDataAsync(DateTime? lastSyncDate = null);

        /// <summary>
        /// Get property record by parcel ID
        /// </summary>
        Task<LegacyPropertyRecord> GetPropertyByParcelIdAsync(string parcelId);

        /// <summary>
        /// Get all properties for a jurisdiction
        /// </summary>
        Task<IEnumerable<LegacyPropertyRecord>> GetAllPropertiesAsync();

        /// <summary>
        /// Update property record in legacy system
        /// </summary>
        Task<bool> UpdatePropertyAsync(LegacyPropertyRecord property);

        /// <summary>
        /// Get system health and performance metrics
        /// </summary>
        Task<LegacySystemHealth> GetSystemHealthAsync();

        /// <summary>
        /// Get audit trail for property changes
        /// </summary>
        Task<IEnumerable<LegacyAuditRecord>> GetAuditTrailAsync(string parcelId, DateTime? fromDate = null);
    }

    /// <summary>
    /// Generic property record from legacy system
    /// </summary>
    public class LegacyPropertyRecord
    {
        public required string ParcelId { get; set; }
        public required string PropertyAddress { get; set; }
        public required string OwnerName { get; set; }
        public decimal AssessedValue { get; set; }
        public decimal MarketValue { get; set; }
        public DateTime LastUpdated { get; set; }
        public required string PropertyType { get; set; }
        public decimal LandArea { get; set; }
        public int BuildingCount { get; set; }
        public Dictionary<string, object> VendorSpecificData { get; set; } = new();
    }

    /// <summary>
    /// Result of legacy data synchronization
    /// </summary>
    public class LegacyDataSyncResult
    {
        public bool Success { get; set; }
        public int RecordsProcessed { get; set; }
        public int RecordsUpdated { get; set; }
        public int RecordsAdded { get; set; }
        public int RecordsSkipped { get; set; }
        public DateTime SyncStartTime { get; set; }
        public DateTime SyncEndTime { get; set; }
        public TimeSpan Duration => SyncEndTime - SyncStartTime;
        public List<string> Errors { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    /// <summary>
    /// Legacy system health metrics
    /// </summary>
    public class LegacySystemHealth
    {
        public string SystemId { get; set; } = string.Empty;
        public bool IsHealthy { get; set; }
        public string Status { get; set; } = string.Empty;
        public Dictionary<string, object> HealthMetrics { get; set; } = new();
        public List<string> Issues { get; set; } = new();
        public bool IsOnline { get; set; }
        public TimeSpan ResponseTime { get; set; }
        public int ActiveConnections { get; set; }
        public DateTime LastSuccessfulSync { get; set; }
        public string SystemStatus { get; set; } = string.Empty;
        public Dictionary<string, object> SystemMetrics { get; set; } = new();
    }

    /// <summary>
    /// Legacy system audit record
    /// </summary>
    public class LegacyAuditRecord
    {
        public required string AuditId { get; set; }
        public required string ParcelId { get; set; }
        public required string Action { get; set; }
        public required string UserId { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Changes { get; set; } = new();
        public required string Notes { get; set; }
    }
}
