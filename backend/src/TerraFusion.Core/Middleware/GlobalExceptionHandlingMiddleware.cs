using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;
using FluentValidation;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Behaviors;
using CoreValidationException = TerraFusion.Core.Behaviors.ValidationException;

namespace TerraFusion.Core.Middleware;

/// <summary>
/// Global exception handling middleware for consistent error responses
/// Provides standardized error handling across the entire API
/// </summary>
public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred while processing the request");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = exception switch
        {
            CoreValidationException validationEx => new ApiResponse<object>
            {
                Success = false,
                Message = "Validation failed",
                Errors = validationEx.Errors.SelectMany(e => e.Value).ToArray(),
                Data = validationEx.GetValidationErrors()
            },
            FluentValidation.ValidationException fluentValidationEx => new ApiResponse<object>
            {
                Success = false,
                Message = "Input validation failed",
                Errors = fluentValidationEx.Errors.Select(e => e.ErrorMessage).ToArray()
            },
            UnauthorizedAccessException => new ApiResponse<object>
            {
                Success = false,
                Message = "Unauthorized access",
                Errors = new[] { "You do not have permission to access this resource" }
            },
            ArgumentException argEx => new ApiResponse<object>
            {
                Success = false,
                Message = "Invalid argument",
                Errors = new[] { argEx.Message }
            },
            KeyNotFoundException => new ApiResponse<object>
            {
                Success = false,
                Message = "Resource not found",
                Errors = new[] { "The requested resource was not found" }
            },
            InvalidOperationException invalidOpEx => new ApiResponse<object>
            {
                Success = false,
                Message = "Invalid operation",
                Errors = new[] { invalidOpEx.Message }
            },
            TimeoutException => new ApiResponse<object>
            {
                Success = false,
                Message = "Request timeout",
                Errors = new[] { "The request took too long to process" }
            },
            _ => new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while processing your request",
                Errors = new[] { "Internal server error" }
            }
        };

        context.Response.StatusCode = exception switch
        {
            CoreValidationException => (int)HttpStatusCode.BadRequest,
            FluentValidation.ValidationException => (int)HttpStatusCode.BadRequest,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            TimeoutException => (int)HttpStatusCode.RequestTimeout,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        // Log the error details
        _logger.LogError("API Error Response: {StatusCode} - {Message}", 
            context.Response.StatusCode, response.Message);

        await context.Response.WriteAsync(jsonResponse);
    }
}

/// <summary>
/// Rate limiting middleware for API protection
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private static readonly Dictionary<string, List<DateTime>> _requests = new();
    private static readonly object _lock = new object();
    private readonly int _maxRequestsPerMinute;

    public RateLimitingMiddleware(
        RequestDelegate next,
        ILogger<RateLimitingMiddleware> logger,
        int maxRequestsPerMinute = 100)
    {
        _next = next;
        _logger = logger;
        _maxRequestsPerMinute = maxRequestsPerMinute;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = GetClientIdentifier(context);
        
        if (IsRateLimited(clientId))
        {
            _logger.LogWarning("Rate limit exceeded for client: {ClientId}", clientId);
            
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.ContentType = "application/json";
            
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = "Rate limit exceeded",
                Errors = new[] { $"Maximum {_maxRequestsPerMinute} requests per minute allowed" }
            };

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
            return;
        }

        await _next(context);
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // Try to get user ID first, fall back to IP address
        var userId = context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(userId))
        {
            return $"user:{userId}";
        }

        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        return $"ip:{ipAddress ?? "unknown"}";
    }

    private bool IsRateLimited(string clientId)
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            var cutoff = now.AddMinutes(-1);

            if (!_requests.ContainsKey(clientId))
            {
                _requests[clientId] = new List<DateTime>();
            }

            var clientRequests = _requests[clientId];
            
            // Remove old requests
            clientRequests.RemoveAll(req => req < cutoff);
            
            // Check if rate limit exceeded
            if (clientRequests.Count >= _maxRequestsPerMinute)
            {
                return true;
            }

            // Add current request
            clientRequests.Add(now);
            return false;
        }
    }
}

/// <summary>
/// Security headers middleware for enhanced API security
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        ILogger<SecurityHeadersMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        context.Response.Headers["Content-Security-Policy"] =
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
        
        // Remove server information
        context.Response.Headers["Server"] = "TerraFusion";

        await _next(context);
    }
}

/// <summary>
/// Request logging middleware for comprehensive audit trails
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid();
        var startTime = DateTime.UtcNow;
        
        // Log request details
        _logger.LogInformation(
            "HTTP {Method} {Path} started - RequestId: {RequestId}, User: {User}, IP: {IpAddress}",
            context.Request.Method,
            context.Request.Path,
            requestId,
            context.User?.Identity?.Name ?? "Anonymous",
            context.Connection.RemoteIpAddress?.ToString() ?? "Unknown");

        try
        {
            await _next(context);
        }
        finally
        {
            var duration = DateTime.UtcNow - startTime;
            
            _logger.LogInformation(
                "HTTP {Method} {Path} completed - RequestId: {RequestId}, Status: {StatusCode}, Duration: {Duration}ms",
                context.Request.Method,
                context.Request.Path,
                requestId,
                context.Response.StatusCode,
                duration.TotalMilliseconds);
        }
    }
}