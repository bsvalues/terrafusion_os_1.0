using System;
using System.Text.Json;
using System.Threading.Tasks;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.API.Services
{
    public class NoopAuditLogger : IAuditLogger
    {
        public Task LogAsync(string action, string details, bool success = true)
        {
            Console.WriteLine($"[NOOP-AUDIT] Action={action} Success={success} Details={details}");
            return Task.CompletedTask;
        }

        public Task LogAsync(string type, object data)
        {
            try
            {
                var serializedData = JsonSerializer.Serialize(data);
                Console.WriteLine($"[NOOP-AUDIT-DATA] Type={type} Data={serializedData}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NOOP-AUDIT-ERROR] Type={type} Error={ex.Message}");
            }
            return Task.CompletedTask;
        }

        public Task LogSecurityEventAsync(string eventType, string details, string? userId = null)
        {
            Console.WriteLine($"[NOOP-SECURITY] Type={eventType} User={userId ?? "SYSTEM"} Details={details}");
            return Task.CompletedTask;
        }

        public Task LogDataAccessAsync(string resourceType, string resourceId, string action, string? userId = null)
        {
            Console.WriteLine($"[NOOP-DATA] Resource={resourceType}/{resourceId} Action={action} User={userId ?? "SYSTEM"}");
            return Task.CompletedTask;
        }

        public Task LogSystemEventAsync(string eventType, string details)
        {
            Console.WriteLine($"[NOOP-SYSTEM] Type={eventType} Details={details}");
            return Task.CompletedTask;
        }

        public Task LogUserActionAsync(string action, string userId, string? details = null)
        {
            Console.WriteLine($"[NOOP-USER] Action={action} User={userId} Details={details ?? "N/A"}");
            return Task.CompletedTask;
        }

        public Task LogErrorAsync(string action, Exception exception, string? userId = null)
        {
            Console.WriteLine($"[NOOP-ERROR] Action={action} User={userId ?? "SYSTEM"} Error={exception?.Message}");
            return Task.CompletedTask;
        }

        public Task LogApiCallAsync(string method, string path, int statusCode, double duration, string? userId = null)
        {
            Console.WriteLine($"[NOOP-API] {method} {path} Status={statusCode} Duration={duration}ms User={userId ?? "ANONYMOUS"}");
            return Task.CompletedTask;
        }

        public Task LogAuthenticationAsync(string userId, bool success, string? reason = null)
        {
            Console.WriteLine($"[NOOP-AUTH] User={userId} Success={success} Reason={reason ?? "N/A"}");
            return Task.CompletedTask;
        }

        public Task LogAuthorizationAsync(string userId, string resource, bool granted)
        {
            Console.WriteLine($"[NOOP-AUTHZ] User={userId} Resource={resource} Granted={granted}");
            return Task.CompletedTask;
        }

        public Task LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string? userId = null)
        {
            Console.WriteLine($"[NOOP-CONFIG] Setting={setting} Old={oldValue} New={newValue} User={userId ?? "SYSTEM"}");
            return Task.CompletedTask;
        }
    }
}
