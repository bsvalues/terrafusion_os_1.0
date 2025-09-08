using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.Services;

namespace TerraFusion.Core.Extensions;

/// <summary>
/// Extension methods for IStructuredLogger to provide specialized logging methods
/// </summary>
public static class StructuredLoggerExtensions
{
    /// <summary>
    /// Logs an AI-related event with structured data
    /// </summary>
    public static void LogAIEvent(this IStructuredLogger logger, string eventName, string? message = null, object? context = null, string? correlationId = null)
    {
        // Use the existing LogBusinessEvent method for AI events
        logger.LogBusinessEvent($"AI_{eventName}", context ?? new { Message = message, CorrelationId = correlationId });
    }

    /// <summary>
    /// Logs an AI error event with structured data
    /// </summary>
    public static void LogAIError(this IStructuredLogger logger, string eventName, Exception? exception = null, object? context = null, string? correlationId = null)
    {
        if (exception != null)
        {
            logger.LogError(exception, $"AI Error: {eventName}", context);
        }
        else
        {
            logger.LogBusinessEvent($"AI_ERROR_{eventName}", context ?? new { CorrelationId = correlationId });
        }
    }

    /// <summary>
    /// Logs an integration event with structured data
    /// </summary>
    public static void LogIntegrationEvent(this IStructuredLogger logger, string eventName, string? message = null, object? context = null, string? correlationId = null)
    {
        logger.LogBusinessEvent($"INTEGRATION_{eventName}", context ?? new { Message = message, CorrelationId = correlationId });
    }

    /// <summary>
    /// Logs an integration error event with structured data
    /// </summary>
    public static void LogIntegrationError(this IStructuredLogger logger, string eventName, Exception? exception = null, object? context = null, string? correlationId = null)
    {
        if (exception != null)
        {
            logger.LogError(exception, $"Integration Error: {eventName}", context);
        }
        else
        {
            logger.LogBusinessEvent($"INTEGRATION_ERROR_{eventName}", context ?? new { CorrelationId = correlationId });
        }
    }

    /// <summary>
    /// Logs an API Gateway event with structured data
    /// </summary>
    public static void LogApiGatewayEvent(this IStructuredLogger logger, string eventName, string? message = null, object? context = null, string? correlationId = null)
    {
        logger.LogBusinessEvent($"API_GATEWAY_{eventName}", context ?? new { Message = message, CorrelationId = correlationId });
    }

    /// <summary>
    /// Logs an API Gateway error event with structured data
    /// </summary>
    public static void LogApiGatewayError(this IStructuredLogger logger, string eventName, Exception? exception = null, object? context = null, string? correlationId = null)
    {
        if (exception != null)
        {
            logger.LogError(exception, $"API Gateway Error: {eventName}", context);
        }
        else
        {
            logger.LogBusinessEvent($"API_GATEWAY_ERROR_{eventName}", context ?? new { CorrelationId = correlationId });
        }
    }

    /// <summary>
    /// Logs a performance event with structured data
    /// </summary>
    public static void LogPerformanceEvent(this IStructuredLogger logger, string eventName, object? data = null, string? correlationId = null)
    {
        var properties = new Dictionary<string, object>
        {
            ["Event"] = eventName,
            ["CorrelationId"] = correlationId ?? string.Empty,
            ["Data"] = JsonSerializer.Serialize(data ?? new { Event = eventName, CorrelationId = correlationId })
        };
        logger.LogPerformanceMetric(eventName, 0, properties);
    }

    /// <summary>
    /// Logs a security event with structured data
    /// </summary>
    public static void LogSecurityEvent(this IStructuredLogger logger, string eventName, object? data = null, string? correlationId = null)
    {
        logger.LogSecurityEvent(eventName, JsonSerializer.Serialize(data ?? new { Event = eventName, CorrelationId = correlationId }));
    }

    /// <summary>
    /// Logs a business event with structured data
    /// </summary>
    public static void LogBusinessEvent(this IStructuredLogger logger, string eventName, object? data = null, string? correlationId = null)
    {
        logger.LogBusinessEvent(eventName, JsonSerializer.Serialize(data ?? new { Event = eventName, CorrelationId = correlationId }));
    }

    /// <summary>
    /// Logs a user activity event with structured data
    /// </summary>
    public static void LogUserActivity(this IStructuredLogger logger, string activity, string? userId = null, object? data = null, string? correlationId = null)
    {
        var activityData = new
        {
            UserId = userId,
            Activity = activity,
            Data = data
        };
        
        logger.LogBusinessEvent(activity, JsonSerializer.Serialize(activityData));
    }

    /// <summary>
    /// Logs a system metric event with structured data
    /// </summary>
    public static void LogMetricEvent(this IStructuredLogger logger, string metricName, double value, string? unit = null, object? tags = null, string? correlationId = null)
    {
        var metricData = new
        {
            MetricName = metricName,
            Value = value,
            Unit = unit,
            Tags = tags
        };
        
        var properties = new Dictionary<string, object>
        {
            ["MetricData"] = JsonSerializer.Serialize(metricData),
            ["Unit"] = unit ?? string.Empty,
            ["CorrelationId"] = correlationId ?? string.Empty
        };
        
        logger.LogPerformanceMetric(metricName, value, properties);
    }

    /// <summary>
    /// Logs a configuration change event with structured data
    /// </summary>
    public static void LogConfigurationChange(this IStructuredLogger logger, string configKey, object? oldValue, object? newValue, string? userId = null, string? correlationId = null)
    {
        var changeData = new
        {
            ConfigurationKey = configKey,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedBy = userId
        };
        
        logger.LogBusinessEvent(configKey, JsonSerializer.Serialize(changeData));
    }

    /// <summary>
    /// Logs an audit event with structured data
    /// </summary>
    public static void LogAuditEvent(this IStructuredLogger logger, string action, string? userId = null, string? resourceId = null, object? data = null, string? correlationId = null)
    {
        var auditData = new
        {
            Action = action,
            UserId = userId,
            ResourceId = resourceId,
            Data = data,
            Timestamp = DateTime.UtcNow
        };
        
        logger.LogBusinessEvent(action, JsonSerializer.Serialize(auditData));
    }
}
