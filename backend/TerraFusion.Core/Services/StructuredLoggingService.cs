using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Linq;
using System.Security;

namespace TerraFusion.Core.Services
{
    public interface IStructuredLoggingService
    {
        Task LogAsync(LogLevel level, string message, object? data = null, string? traceId = null, string? spanId = null);
        Task LogPerformanceAsync(string operation, TimeSpan duration, Dictionary<string, object>? metrics = null);
        Task LogSecurityEventAsync(string eventType, string userId, string details, Dictionary<string, object>? context = null);
        Task LogBusinessEventAsync(string eventType, string entityId, object? eventData, string? userId = null);
        Task LogErrorAsync(Exception exception, string? context = null, Dictionary<string, object>? additionalData = null);
        Task<List<LogEntry>> QueryLogsAsync(LogQuery query);
        Task FlushLogsAsync();
    }

    public class LogEntry
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public LogLevel Level { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? TraceId { get; set; }
        public string? SpanId { get; set; }
        public string? UserId { get; set; }
        public string? RequestId { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public Dictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
        public Dictionary<string, object> Context { get; set; } = new Dictionary<string, object>();
        public string Environment { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
    }

    public class LogQuery
    {
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public LogLevel? MinLevel { get; set; }
        public string? TraceId { get; set; }
        public string? UserId { get; set; }
        public string? Category { get; set; }
        public string? SearchText { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 100;
        public string OrderBy { get; set; } = "timestamp";
        public bool OrderDescending { get; set; } = true;
    }

    public class LoggingPerformanceRecord
    {
        public string Operation { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Metrics { get; set; } = new Dictionary<string, object>();
        public string? TraceId { get; set; }
        public string? SpanId { get; set; }
    }

    public class SecurityAuditEvent
    {
        public string EventType { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Context { get; set; } = new Dictionary<string, object>();
        public string Severity { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
    }

    public class StructuredLoggingService : IStructuredLoggingService
    {
        private readonly ILogger<StructuredLoggingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly List<LogEntry> _logBuffer;
        private readonly object _bufferLock = new object();

        // Configuration
        private readonly string? _elasticsearchEndpoint;
        private readonly string _serviceName;
        private readonly string _environment;
        private readonly string _version;
        private readonly int _bufferSize;
        private readonly bool _enableFileLogging;
        private readonly string _logFilePath;

        public StructuredLoggingService(
            ILogger<StructuredLoggingService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _logBuffer = new List<LogEntry>();

            _elasticsearchEndpoint = configuration["Logging:ElasticsearchEndpoint"] ?? string.Empty;
            _serviceName = configuration["Logging:ServiceName"] ?? "TerraFusion.API";
            _environment = configuration["Environment"] ?? "Development";
            _version = configuration["Version"] ?? "1.0.0";
            _bufferSize = configuration.GetValue<int>("Logging:BufferSize", 100);
            _enableFileLogging = configuration.GetValue<bool>("Logging:EnableFileLogging", true);
            _logFilePath = configuration["Logging:LogFilePath"] ?? "logs/terrafusion.log";

            // Ensure log directory exists
            if (_enableFileLogging)
            {
                var logDir = Path.GetDirectoryName(_logFilePath);
                if (!string.IsNullOrEmpty(logDir) && !Directory.Exists(logDir))
                {
                    Directory.CreateDirectory(logDir);
                }
            }
        }

        public async Task LogAsync(LogLevel level, string message, object? data = null, string? traceId = null, string? spanId = null)
        {
            var logEntry = new LogEntry
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = level,
                Message = message,
                Category = "General",
                TraceId = traceId,
                SpanId = spanId,
                ServiceName = _serviceName,
                Environment = _environment,
                Version = _version
            };

            if (data != null)
            {
                logEntry.Data = SerializeToDict(data);
            }

            await ProcessLogEntryAsync(logEntry);
        }

        public async Task LogPerformanceAsync(string operation, TimeSpan duration, Dictionary<string, object>? metrics = null)
        {
            var logEntry = new LogEntry
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = LogLevel.Information,
                Message = $"Performance metric for operation: {operation}",
                Category = "Performance",
                ServiceName = _serviceName,
                Environment = _environment,
                Version = _version
            };

            logEntry.Data["operation"] = operation;
            logEntry.Data["duration_ms"] = duration.TotalMilliseconds;
            logEntry.Data["duration_readable"] = duration.ToString();

            if (metrics != null)
            {
                foreach (var metric in metrics)
                {
                    logEntry.Data[metric.Key] = metric.Value;
                }
            }

            // Add performance thresholds
            if (duration.TotalMilliseconds > 5000)
            {
                logEntry.Level = LogLevel.Warning;
                logEntry.Data["performance_issue"] = "slow_operation";
            }
            else if (duration.TotalMilliseconds > 10000)
            {
                logEntry.Level = LogLevel.Error;
                logEntry.Data["performance_issue"] = "very_slow_operation";
            }

            await ProcessLogEntryAsync(logEntry);
        }

        public async Task LogSecurityEventAsync(string eventType, string userId, string details, Dictionary<string, object>? context = null)
        {
            var logEntry = new LogEntry
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = GetSecurityEventLogLevel(eventType),
                Message = $"Security event: {eventType}",
                Category = "Security",
                UserId = userId,
                ServiceName = _serviceName,
                Environment = _environment,
                Version = _version
            };

            logEntry.Data["event_type"] = eventType;
            logEntry.Data["details"] = details;
            logEntry.Data["severity"] = GetSecurityEventSeverity(eventType);

            if (context != null)
            {
                logEntry.Context = context;
            }

            // Add security-specific context
            logEntry.Context["source_ip"] = GetClientIpAddress();
            logEntry.Context["user_agent"] = GetUserAgent();
            logEntry.Context["timestamp_iso"] = DateTime.UtcNow.ToString("O");

            await ProcessLogEntryAsync(logEntry);

            // Also log to security-specific logger for immediate alerting
            _logger.LogWarning("SECURITY EVENT: {EventType} for user {UserId} - {Details}", 
                eventType, userId, details);
        }

        public async Task LogBusinessEventAsync(string eventType, string entityId, object? eventData, string? userId = null)
        {
            var logEntry = new LogEntry
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = LogLevel.Information,
                Message = $"Business event: {eventType}",
                Category = "Business",
                UserId = userId,
                ServiceName = _serviceName,
                Environment = _environment,
                Version = _version
            };

            logEntry.Data["event_type"] = eventType;
            logEntry.Data["entity_id"] = entityId;
            
            if (eventData != null)
            {
                logEntry.Data["event_data"] = SerializeToDict(eventData);
            }

            // Add business context
            logEntry.Context["business_domain"] = GetBusinessDomain(eventType);
            logEntry.Context["compliance_relevant"] = IsComplianceRelevant(eventType);

            await ProcessLogEntryAsync(logEntry);
        }

        public async Task LogErrorAsync(Exception exception, string? context = null, Dictionary<string, object>? additionalData = null)
        {
            var logEntry = new LogEntry
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                Level = LogLevel.Error,
                Message = exception.Message,
                Category = "Error",
                ServiceName = _serviceName,
                Environment = _environment,
                Version = _version
            };

            logEntry.Data["exception_type"] = exception.GetType().Name;
            logEntry.Data["stack_trace"] = exception.StackTrace;
            logEntry.Data["inner_exception"] = exception.InnerException?.Message;
            logEntry.Data["context"] = context;

            if (additionalData != null)
            {
                foreach (var kvp in additionalData)
                {
                    logEntry.Data[kvp.Key] = kvp.Value;
                }
            }

            // Add error classification
            logEntry.Data["error_category"] = ClassifyError(exception);
            logEntry.Data["is_retryable"] = IsRetryableError(exception);
            logEntry.Data["severity"] = GetErrorSeverity(exception);

            await ProcessLogEntryAsync(logEntry);

            // Also log to standard logger for immediate visibility
            _logger.LogError(exception, "Error in context: {Context}", context);
        }

        public async Task<List<LogEntry>> QueryLogsAsync(LogQuery query)
        {
            // For now, query from buffer - in production, this would query Elasticsearch
            List<LogEntry> results;
            
            lock (_bufferLock)
            {
                results = new List<LogEntry>(_logBuffer);
            }

            // Apply filters
            if (query.StartTime.HasValue)
                results = results.Where(l => l.Timestamp >= query.StartTime.Value).ToList();
            
            if (query.EndTime.HasValue)
                results = results.Where(l => l.Timestamp <= query.EndTime.Value).ToList();
            
            if (query.MinLevel.HasValue)
                results = results.Where(l => l.Level >= query.MinLevel.Value).ToList();
            
            if (!string.IsNullOrEmpty(query.TraceId))
                results = results.Where(l => l.TraceId == query.TraceId).ToList();
            
            if (!string.IsNullOrEmpty(query.UserId))
                results = results.Where(l => l.UserId == query.UserId).ToList();
            
            if (!string.IsNullOrEmpty(query.Category))
                results = results.Where(l => l.Category == query.Category).ToList();
            
            if (!string.IsNullOrEmpty(query.SearchText))
                results = results.Where(l => l.Message.Contains(query.SearchText, StringComparison.OrdinalIgnoreCase)).ToList();

            // Apply ordering
            if (query.OrderBy == "timestamp")
            {
                results = query.OrderDescending 
                    ? results.OrderByDescending(l => l.Timestamp).ToList()
                    : results.OrderBy(l => l.Timestamp).ToList();
            }

            // Apply pagination
            results = results.Skip(query.Skip).Take(query.Take).ToList();

            return results;
        }

        public async Task FlushLogsAsync()
        {
            List<LogEntry> logsToFlush;
            
            lock (_bufferLock)
            {
                logsToFlush = new List<LogEntry>(_logBuffer);
                _logBuffer.Clear();
            }

            if (logsToFlush.Any())
            {
                // Send to Elasticsearch if configured
                if (!string.IsNullOrEmpty(_elasticsearchEndpoint))
                {
                    await SendLogsToElasticsearchAsync(logsToFlush);
                }

                // Write to file if enabled
                if (_enableFileLogging)
                {
                    await WriteLogsToFileAsync(logsToFlush);
                }

                _logger.LogDebug("Flushed {LogCount} log entries", logsToFlush.Count);
            }
        }

        private async Task ProcessLogEntryAsync(LogEntry logEntry)
        {
            lock (_bufferLock)
            {
                _logBuffer.Add(logEntry);
                
                // Auto-flush if buffer is full
                if (_logBuffer.Count >= _bufferSize)
                {
                    Task.Run(async () => await FlushLogsAsync());
                }
            }

            // Immediate file write for critical errors
            if (logEntry.Level == LogLevel.Critical && _enableFileLogging)
            {
                await WriteLogToFileAsync(logEntry);
            }
        }

        private Dictionary<string, object> SerializeToDict(object obj)
        {
            if (obj == null) return new Dictionary<string, object>();
            
            try
            {
                var json = JsonSerializer.Serialize(obj);
                return JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new Dictionary<string, object>();
            }
            catch
            {
                return new Dictionary<string, object> { ["serialized_value"] = obj.ToString() };
            }
        }

        private LogLevel GetSecurityEventLogLevel(string eventType)
        {
            return eventType.ToLower() switch
            {
                "login_success" => LogLevel.Information,
                "login_failure" => LogLevel.Warning,
                "unauthorized_access" => LogLevel.Error,
                "data_breach" => LogLevel.Critical,
                "suspicious_activity" => LogLevel.Warning,
                _ => LogLevel.Information
            };
        }

        private string GetSecurityEventSeverity(string eventType)
        {
            return eventType.ToLower() switch
            {
                "login_success" => "low",
                "login_failure" => "medium",
                "unauthorized_access" => "high",
                "data_breach" => "critical",
                "suspicious_activity" => "medium",
                _ => "low"
            };
        }

        private string GetClientIpAddress()
        {
            // This would typically come from HttpContext
            return "127.0.0.1"; // Placeholder
        }

        private string GetUserAgent()
        {
            // This would typically come from HttpContext
            return "TerraFusion-Client/1.0"; // Placeholder
        }

        private string GetBusinessDomain(string eventType)
        {
            return eventType.ToLower() switch
            {
                var e when e.Contains("property") => "PropertyManagement",
                var e when e.Contains("tax") => "TaxAssessment",
                var e when e.Contains("revenue") => "RevenueOptimization",
                var e when e.Contains("compliance") => "Compliance",
                _ => "General"
            };
        }

        private bool IsComplianceRelevant(string eventType)
        {
            var complianceEvents = new[] { "audit", "compliance", "security", "data_access", "user_management" };
            return complianceEvents.Any(ce => eventType.ToLower().Contains(ce));
        }

        private string ClassifyError(Exception exception)
        {
            return exception switch
            {
                ArgumentException => "validation",
                UnauthorizedAccessException => "security",
                TimeoutException => "performance",
                HttpRequestException => "external_service",
                InvalidOperationException => "business_logic",
                _ => "system"
            };
        }

        private bool IsRetryableError(Exception exception)
        {
            return exception switch
            {
                TimeoutException => true,
                HttpRequestException => true,
                TaskCanceledException => true,
                _ => false
            };
        }

        private string GetErrorSeverity(Exception exception)
        {
            return exception switch
            {
                ArgumentException => "low",
                UnauthorizedAccessException => "high",
                SecurityException => "critical",
                OutOfMemoryException => "critical",
                _ => "medium"
            };
        }

        private async Task SendLogsToElasticsearchAsync(List<LogEntry> logs)
        {
            try
            {
                var bulkData = new StringBuilder();
                foreach (var log in logs)
                {
                    var indexAction = new { index = new { _index = $"terrafusion-logs-{DateTime.UtcNow:yyyy.MM.dd}" } };
                    bulkData.AppendLine(JsonSerializer.Serialize(indexAction));
                    bulkData.AppendLine(JsonSerializer.Serialize(log));
                }

                var content = new StringContent(bulkData.ToString(), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_elasticsearchEndpoint}/_bulk", content);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to send logs to Elasticsearch: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending logs to Elasticsearch");
            }
        }

        private async Task WriteLogsToFileAsync(List<LogEntry> logs)
        {
            try
            {
                var logLines = logs.Select(log => JsonSerializer.Serialize(log));
                await File.AppendAllLinesAsync(_logFilePath, logLines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing logs to file");
            }
        }

        private async Task WriteLogToFileAsync(LogEntry log)
        {
            try
            {
                var logLine = JsonSerializer.Serialize(log);
                await File.AppendAllTextAsync(_logFilePath, logLine + Environment.NewLine);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing single log to file");
            }
        }
    }
}
