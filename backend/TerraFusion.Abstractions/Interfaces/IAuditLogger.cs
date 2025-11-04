using System;
using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces
{
    /// <summary>
    /// Elite Government Audit Logger Interface
    /// Provides comprehensive audit trail capabilities for TerraFusion OS
    /// FISMA/FedRAMP compliant audit logging for government operations
    /// </summary>
    public interface IAuditLogger
    {
        /// <summary>
        /// Log general action with details and success status
        /// </summary>
        Task LogAsync(string action, string details, bool success = true);

        /// <summary>
        /// Log action with structured data object (elite version)
        /// </summary>
        Task LogAsync(string type, object data);

        /// <summary>
        /// Log security-related events for government compliance
        /// </summary>
        Task LogSecurityEventAsync(string eventType, string details, string? userId = null);

        /// <summary>
        /// Log data access for government data sovereignty requirements
        /// </summary>
        Task LogDataAccessAsync(string resourceType, string resourceId, string action, string? userId = null);

        /// <summary>
        /// Log system events for operational monitoring
        /// </summary>
        Task LogSystemEventAsync(string eventType, string details);

        /// <summary>
        /// Log user actions for accountability and compliance
        /// </summary>
        Task LogUserActionAsync(string action, string userId, string? details = null);

        /// <summary>
        /// Log errors with full exception details for debugging
        /// </summary>
        Task LogErrorAsync(string action, Exception exception, string? userId = null);

        /// <summary>
        /// Log API calls for performance and security monitoring
        /// </summary>
        Task LogApiCallAsync(string method, string path, int statusCode, double duration, string? userId = null);

        /// <summary>
        /// Log authentication events for security compliance
        /// </summary>
        Task LogAuthenticationAsync(string userId, bool success, string? reason = null);

        /// <summary>
        /// Log authorization decisions for access control auditing
        /// </summary>
        Task LogAuthorizationAsync(string userId, string resource, bool granted);

        /// <summary>
        /// Log configuration changes for change management
        /// </summary>
        Task LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string? userId = null);
    }
}