using System;
using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces
{
    public interface IAuditLogger
    {
        Task LogAsync(string action, string details, bool success = true);
        Task LogSecurityEventAsync(string eventType, string details, string? userId = null);
        Task LogDataAccessAsync(string resourceType, string resourceId, string action, string? userId = null);
        Task LogSystemEventAsync(string eventType, string details);
        Task LogUserActionAsync(string action, string userId, string? details = null);
        Task LogErrorAsync(string action, Exception exception, string? userId = null);
        Task LogApiCallAsync(string method, string path, int statusCode, double duration, string? userId = null);
        Task LogAuthenticationAsync(string userId, bool success, string? reason = null);
        Task LogAuthorizationAsync(string userId, string resource, bool granted);
        Task LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string? userId = null);
    }
}

namespace TerraFusion.API.Services
{
    public interface IAuditLoggerLegacy
    {
        Task LogAsync(string type, object data);
    }
}
