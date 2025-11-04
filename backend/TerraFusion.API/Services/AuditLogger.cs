using System;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.Data;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Services
{
    public class AuditLogger : IAuditLogger
    {
        private readonly ILogger<AuditLogger> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IServiceProvider _serviceProvider;
        private readonly string _environment;
        private readonly string _machineName;
        private readonly bool _isEnabled;
        private readonly bool _logToDatabase;
        private readonly bool _logToFile;

        public AuditLogger(
            ILogger<AuditLogger> logger,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _serviceProvider = serviceProvider;
            _environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
            _machineName = Environment.MachineName;
            _isEnabled = _configuration.GetValue<bool>("AuditLogging:Enabled", true);
            _logToDatabase = _configuration.GetValue<bool>("AuditLogging:LogToDatabase", true);
            _logToFile = _configuration.GetValue<bool>("AuditLogging:LogToFile", true);
        }

        public async System.Threading.Tasks.Task LogAsync(string action, string details, bool success = true)
        {
            if (!_isEnabled) return;

            var stopwatch = Stopwatch.StartNew();

            try
            {
                var auditLog = CreateAuditLog(action, details, success);

                if (_logToDatabase)
                {
                    await LogToDatabaseAsync(auditLog);
                }

                if (_logToFile)
                {
                    LogToFile(auditLog);
                }

                stopwatch.Stop();
                // Duration is stored in the Changes JSON
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write audit log for action: {Action}", action);
            }
        }

        public async System.Threading.Tasks.Task LogAsync(string type, object data)
        {
            if (!_isEnabled) return;

            try
            {
                var serializedData = JsonSerializer.Serialize(data);
                await LogAsync(type, serializedData, true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to serialize and log audit data for type: {Type}", type);
            }
        }

        public async System.Threading.Tasks.Task LogSecurityEventAsync(string eventType, string details, string? userId = null)
        {
            await LogEventAsync(eventType, "Security", details, userId: userId);
        }

        public async System.Threading.Tasks.Task LogDataAccessAsync(string resourceType, string resourceId, string action, string? userId = null)
        {
            var details = $"Action: {action}, Resource: {resourceType}/{resourceId}";
            await LogEventAsync("DataAccess", "Data", details, userId: userId, resourceType: resourceType, resourceId: resourceId);
        }

        public async System.Threading.Tasks.Task LogSystemEventAsync(string eventType, string details)
        {
            await LogEventAsync(eventType, "System", details);
        }

        public async System.Threading.Tasks.Task LogUserActionAsync(string action, string userId, string? details = null)
        {
            await LogEventAsync("UserAction", "User", details ?? action, userId: userId);
        }

        public async System.Threading.Tasks.Task LogErrorAsync(string action, Exception exception, string? userId = null)
        {
            var details = JsonSerializer.Serialize(new
            {
                Message = exception.Message,
                Type = exception.GetType().Name,
                StackTrace = exception.StackTrace,
                InnerException = exception.InnerException?.Message
            });

            await LogEventAsync("Error", "Error", details,
                userId: userId,
                success: false,
                errorMessage: exception.Message);
        }

        public async System.Threading.Tasks.Task LogApiCallAsync(string method, string path, int statusCode, double duration, string? userId = null)
        {
            var details = $"{method} {path}";
            await LogEventAsync("ApiCall", "API", details,
                userId: userId,
                success: statusCode < 400,
                responseCode: statusCode,
                duration: duration);
        }

        public async System.Threading.Tasks.Task LogAuthenticationAsync(string userId, bool success, string? reason = null)
        {
            var details = success ? "Authentication successful" : $"Authentication failed: {reason}";
            await LogEventAsync("Authentication", "Security", details,
                userId: userId,
                success: success);
        }

        public async System.Threading.Tasks.Task LogAuthorizationAsync(string userId, string resource, bool granted)
        {
            var details = $"Access to {resource} was {(granted ? "granted" : "denied")}";
            await LogEventAsync("Authorization", "Security", details,
                userId: userId,
                success: granted,
                resourceType: resource);
        }

        public async System.Threading.Tasks.Task LogConfigurationChangeAsync(string setting, string oldValue, string newValue, string? userId = null)
        {
            var details = $"Configuration changed: {setting}";
            await LogEventAsync("ConfigurationChange", "System", details,
                userId: userId,
                oldValue: oldValue,
                newValue: newValue);
        }

        private async System.Threading.Tasks.Task LogEventAsync(
            string eventType,
            string eventCategory,
            string details,
            string? userId = null,
            bool success = true,
            string? errorMessage = null,
            int? responseCode = null,
            double? duration = null,
            string? resourceType = null,
            string? resourceId = null,
            string? oldValue = null,
            string? newValue = null)
        {
            if (!_isEnabled) return;

            var auditLog = CreateAuditLog($"{eventType}: {eventCategory}", details, success);
            auditLog.UserId = userId ?? auditLog.UserId;
            auditLog.Data = JsonSerializer.Serialize(new
            {
                EventType = eventType,
                EventCategory = eventCategory,
                Details = details,
                Success = success,
                ErrorMessage = errorMessage,
                ResponseCode = responseCode,
                Duration = duration,
                OldValue = oldValue,
                NewValue = newValue,
                ResourceType = resourceType ?? eventCategory,
                ResourceId = resourceId ?? Guid.NewGuid().ToString()
            });

            if (_logToDatabase)
            {
                await LogToDatabaseAsync(auditLog);
            }

            if (_logToFile)
            {
                LogToFile(auditLog);
            }
        }

        private AuditLog CreateAuditLog(string action, string details, bool success)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var user = httpContext?.User;
            var userId = user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            return new AuditLog
            {
                Id = Guid.NewGuid(),
                Type = action,
                Data = JsonSerializer.Serialize(new
                {
                    Details = details,
                    Success = success,
                    Environment = _environment,
                    MachineName = _machineName
                }),
                UserId = userId,
                UserEmail = user?.Identity?.Name,
                Timestamp = DateTime.UtcNow,
                IpAddress = GetClientIpAddress(httpContext ?? new DefaultHttpContext()),
                UserAgent = httpContext?.Request.Headers["User-Agent"].ToString()
            };
        }

        private async System.Threading.Tasks.Task LogToDatabaseAsync(AuditLog auditLog)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetService<TerraFusionDbContext>();

                if (dbContext != null)
                {
                    await dbContext.Set<AuditLog>().AddAsync(auditLog);
                    await dbContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save audit log to database");
                LogToFile(auditLog);
            }
        }

        private void LogToFile(AuditLog auditLog)
        {
            // Check success from the Changes JSON if needed
            var logLevel = LogLevel.Information;
            var logMessage = JsonSerializer.Serialize(auditLog, new JsonSerializerOptions
            {
                WriteIndented = false,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            _logger.Log(logLevel, "AUDIT: {AuditLog}", logMessage);
        }

        private string? GetClientIpAddress(HttpContext httpContext)
        {
            if (httpContext == null) return null;

            var forwarded = httpContext.Request.Headers["X-Forwarded-For"].ToString();
            if (!string.IsNullOrEmpty(forwarded))
            {
                return forwarded.Split(',')[0].Trim();
            }

            var realIp = httpContext.Request.Headers["X-Real-IP"].ToString();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            return httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }
    }
}
