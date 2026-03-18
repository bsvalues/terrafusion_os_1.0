// LEV-038 — User Audit Service
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Security.Audit
{
    /// <summary>
    /// Service for logging and querying user actions in the levy module.
    /// Tracks logins, data changes, levy overrides, and export activities
    /// for FISMA compliance and government audit requirements.
    /// </summary>
    public class UserAuditService
    {
        /// <summary>
        /// Log a user action to the audit trail.
        /// </summary>
        /// <param name="userId">User performing the action.</param>
        /// <param name="action">Action type (e.g., "RateOverride", "Export", "Login").</param>
        /// <param name="entityType">Optional entity type affected.</param>
        /// <param name="entityId">Optional entity ID affected.</param>
        /// <param name="details">Optional JSON details.</param>
        public Task LogActionAsync(
            string userId,
            string action,
            string? entityType = null,
            int? entityId = null,
            string? details = null)
        {
            // Stub — production impl persists to LevyAuditRecord via EF Core
            return Task.CompletedTask;
        }

        /// <summary>
        /// Record a levy rate override for audit tracking.
        /// </summary>
        /// <param name="userId">User who authorized the override.</param>
        /// <param name="districtId">Affected district.</param>
        /// <param name="taxYear">Tax year of the override.</param>
        /// <param name="previousRate">Rate before override.</param>
        /// <param name="newRate">Rate after override.</param>
        /// <param name="justification">Reason for the override.</param>
        public Task RecordLevyOverrideAsync(
            string userId,
            int districtId,
            int taxYear,
            decimal previousRate,
            decimal newRate,
            string justification)
        {
            // Stub
            return Task.CompletedTask;
        }

        /// <summary>
        /// Query audit logs with filters.
        /// </summary>
        public Task<List<AuditLogEntry>> GetAuditLogsAsync(
            string? userId = null,
            DateTime? from = null,
            DateTime? to = null,
            string? actionType = null,
            int page = 1,
            int pageSize = 50)
        {
            // Stub — production impl queries LevyAuditRecord table
            return Task.FromResult(new List<AuditLogEntry>());
        }

        /// <summary>
        /// Get activity summary for a specific user.
        /// </summary>
        public Task<UserActivitySummary> GetUserActivitySummaryAsync(string userId)
        {
            var summary = new UserActivitySummary
            {
                UserId = userId,
                TotalActions = 0,
                LastActiveAt = null,
                ActionBreakdown = new Dictionary<string, int>()
            };
            return Task.FromResult(summary);
        }

        /// <summary>
        /// Get levy override records filtered by district and/or year.
        /// </summary>
        public Task<List<LevyOverrideRecord>> GetLevyOverridesAsync(
            int? districtId = null, int? taxYear = null)
        {
            // Stub
            return Task.FromResult(new List<LevyOverrideRecord>());
        }
    }

    /// <summary>A single audit log entry.</summary>
    public class AuditLogEntry
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public int? EntityId { get; set; }
        public string? Details { get; set; }
        public DateTime PerformedAt { get; set; }
    }

    /// <summary>Summary of a user's activity in the levy module.</summary>
    public class UserActivitySummary
    {
        public string UserId { get; set; } = string.Empty;
        public int TotalActions { get; set; }
        public DateTime? LastActiveAt { get; set; }
        public Dictionary<string, int> ActionBreakdown { get; set; } = new();
    }

    /// <summary>Record of a levy rate override for audit.</summary>
    public class LevyOverrideRecord
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        public decimal PreviousRate { get; set; }
        public decimal NewRate { get; set; }
        public string Justification { get; set; } = string.Empty;
        public DateTime OverriddenAt { get; set; }
    }
}
