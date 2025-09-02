using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Data;

using TerraFusion.Abstractions.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.API.Services
{
    /// <summary>
    /// Production audit logger that persists security events to database
    /// Replaces NoopAuditLogger for production use
    /// </summary>
    public class DatabaseAuditLogger : IAuditLogger
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<DatabaseAuditLogger> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DatabaseAuditLogger(
            TerraFusionDbContext context,
            ILogger<DatabaseAuditLogger> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Log an audit event to the database
        /// </summary>
        public async System.Threading.Tasks.Task LogAsync(string action, string details, bool success = true)
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                
                var auditLog = new TerraFusion.Core.Entities.AuditLog
                {
                    // DatabaseAuditLogger fields
                    Type = action,
                    Data = JsonSerializer.Serialize(new { details, success }, new JsonSerializerOptions
                    {
                        WriteIndented = false,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }),
                    Timestamp = DateTime.UtcNow,
                    UserId = httpContext?.User?.FindFirst("sub")?.Value,
                    UserEmail = httpContext?.User?.FindFirst("email")?.Value,
                    IpAddress = GetClientIpAddress(httpContext),
                    UserAgent = httpContext?.Request.Headers["User-Agent"].FirstOrDefault(),
                    RequestPath = httpContext?.Request.Path.ToString(),
                    RequestMethod = httpContext?.Request.Method,
                    CorrelationId = GetCorrelationId(httpContext)
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                // Log critical events to file system as well
                if (IsCriticalAuditType(action))
                {
                    _logger.LogWarning("[CRITICAL AUDIT] Type: {Type}, User: {User}, IP: {IP}, Data: {Data}",
                        action, auditLog.UserEmail ?? "anonymous", auditLog.IpAddress, auditLog.Data);
                }
            }
            catch (Exception ex)
            {
                // Audit logging should never break the application flow
                _logger.LogError(ex, "Failed to write audit log for type {Type}", action);
                
                // Fallback to console logging
                try
                {
                    var fallbackData = JsonSerializer.Serialize(new { details, success });
                    Console.WriteLine($"[AUDIT FALLBACK] type={action} data={fallbackData}");
                }
                catch
                {
                    // Even fallback failed, just log the type
                    Console.WriteLine($"[AUDIT FALLBACK] type={action} [data serialization failed]");
                }
            }
        }

        /// <summary>
        /// Log security event
        /// </summary>
        public async System.Threading.Tasks.Task LogSecurityEventAsync(string eventType, string details, string userId = null)
        {
            await LogAsync($"SECURITY_{eventType}", details, true);
        }

        /// <summary>
        /// Log data access event
        /// </summary>
        public async System.Threading.Tasks.Task LogDataAccessAsync(string resourceType, string resourceId, string action, string userId = null)
        {
            await LogAsync("DATA_ACCESS", $"Resource: {resourceType}/{resourceId}, Action: {action}, User: {userId}", true);
        }

        /// <summary>
        /// Log system event
        /// </summary>
        public async System.Threading.Tasks.Task LogSystemEventAsync(string eventType, string details)
        {
            await LogAsync($"SYSTEM_{eventType}", details, true);
        }

        /// <summary>
        /// Log user action
        /// </summary>
        public async System.Threading.Tasks.Task LogUserActionAsync(string action, string userId, string details = null)
        {
            await LogAsync("USER_ACTION", $"Action: {action}, User: {userId}, Details: {details}", true);
        }

        /// <summary>
        /// Log error event
        /// </summary>
        public async System.Threading.Tasks.Task LogErrorAsync(string action, Exception exception, string userId = null)
        {
            await LogAsync("ERROR", $"Action: {action}, Exception: {exception.Message}, User: {userId}", false);
        }

        /// <summary>
        /// Log API call
        /// </summary>
        public async System.Threading.Tasks.Task LogApiCallAsync(string method, string path, int statusCode, double duration, string userId = null)
        {
            await LogAsync("API_CALL", $"{method} {path} - Status: {statusCode}, Duration: {duration}ms, User: {userId}", statusCode < 400);
        }

        /// <summary>
        /// Log authentication event
        /// </summary>
        public async System.Threading.Tasks.Task LogAuthenticationAsync(string userId, bool success, string reason = null)
        {
            await LogAsync("AUTHENTICATION", $"User: {userId}, Success: {success}, Reason: {reason}", success);
        }

        /// <summary>
        /// Log authorization event
        /// </summary>
        public async System.Threading.Tasks.Task LogAuthorizationAsync(string userId, string resource, bool granted)
        {
            await LogAsync("AUTHORIZATION", $"User: {userId}, Resource: {resource}, Granted: {granted}", granted);
        }

        /// <summary>
        /// Log configuration change
        /// </summary>
        public async System.Threading.Tasks.Task LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string userId = null)
        {
            await LogAsync("CONFIG_CHANGE", $"Setting: {setting}, Old: {oldValue}, New: {newValue}, User: {userId}", true);
        }

        /// <summary>
        /// Extract client IP address from HTTP context
        /// </summary>
        private string? GetClientIpAddress(HttpContext? context)
        {
            if (context == null)
                return null;

            // Check for forwarded IP (when behind proxy/load balancer)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (ips.Length > 0)
                {
                    // Take the first IP (original client)
                    return ips[0].Trim();
                }
            }

            // Check for real IP header (some proxies use this)
            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            // Fallback to remote IP address
            return context.Connection.RemoteIpAddress?.ToString();
        }

        /// <summary>
        /// Get or generate correlation ID for request tracking
        /// </summary>
        private string GetCorrelationId(HttpContext? context)
        {
            if (context == null)
                return Guid.NewGuid().ToString();

            // Check for existing correlation ID in headers
            var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault();
            
            if (string.IsNullOrEmpty(correlationId))
            {
                // Check if we stored one in HttpContext Items
                if (context.Items.TryGetValue("CorrelationId", out var storedId))
                {
                    correlationId = storedId?.ToString();
                }
            }

            if (string.IsNullOrEmpty(correlationId))
            {
                // Generate new correlation ID
                correlationId = Guid.NewGuid().ToString();
                context.Items["CorrelationId"] = correlationId;
            }

            return correlationId;
        }

        /// <summary>
        /// Determine if an audit type is critical and needs special handling
        /// </summary>
        private bool IsCriticalAuditType(string action)
        {
            var criticalTypes = new[]
            {
                "SECURITY:",
                "AUTH:",
                "UNAUTHORIZED",
                "BREACH",
                "ATTACK",
                "MALICIOUS",
                "EXPLOIT",
                "INJECTION",
                "PRIVILEGE",
                "TAMPERING"
            };

            return criticalTypes.Any(critical => 
                action.Contains(critical, StringComparison.OrdinalIgnoreCase));
        }
    }

    /// <summary>
    /// Background service to clean up old audit logs
    /// </summary>
    public class AuditLogCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AuditLogCleanupService> _logger;
        private readonly int _retentionDays;

        public AuditLogCleanupService(
            IServiceProvider serviceProvider,
            ILogger<AuditLogCleanupService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _retentionDays = configuration.GetValue<int>("AuditLog:RetentionDays", 90);
        }

        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupOldAuditLogs();
                    
                    // Run cleanup daily at 2 AM
                    var now = DateTime.Now;
                    var nextRun = now.Date.AddDays(1).AddHours(2);
                    var delay = nextRun - now;
                    
                    await System.Threading.Tasks.Task.Delay(delay, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in audit log cleanup service");
                    
                    // Wait an hour before retrying if there's an error
                    await System.Threading.Tasks.Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async System.Threading.Tasks.Task CleanupOldAuditLogs()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            
            var cutoffDate = DateTime.UtcNow.AddDays(-_retentionDays);
            
            // Delete old audit logs in batches to avoid locking
            const int batchSize = 1000;
            int totalDeleted = 0;
            int deleted;
            
            do
            {
                deleted = await context.Database.ExecuteSqlInterpolatedAsync(
                    $@"DELETE FROM AuditLogs 
                       WHERE Id IN (
                           SELECT TOP {batchSize} Id 
                           FROM AuditLogs 
                           WHERE Timestamp < {cutoffDate}
                       )");
                
                totalDeleted += deleted;
                
                if (deleted > 0)
                {
                    await System.Threading.Tasks.Task.Delay(100); // Small delay between batches
                }
                
            } while (deleted == batchSize);
            
            if (totalDeleted > 0)
            {
                _logger.LogInformation("Cleaned up {Count} audit log entries older than {Days} days", 
                    totalDeleted, _retentionDays);
            }
        }
    }
}