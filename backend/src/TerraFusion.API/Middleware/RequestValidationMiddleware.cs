using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Middleware;

public class RequestValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestValidationMiddleware> _logger;

    public RequestValidationMiddleware(RequestDelegate next, ILogger<RequestValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Validate content type for POST/PUT requests
        if (IsWriteRequest(context.Request.Method))
        {
            if (!IsValidContentType(context.Request.ContentType))
            {
                await WriteValidationErrorAsync(context, "Invalid content type. Expected application/json");
                return;
            }
        }

        // Validate request size
        if (context.Request.ContentLength > 10 * 1024 * 1024) // 10MB limit
        {
            await WriteValidationErrorAsync(context, "Request size exceeds maximum allowed limit");
            return;
        }

        // Add security headers
        AddSecurityHeaders(context.Response);

        await _next(context);
    }

    private static bool IsWriteRequest(string method)
    {
        return method.Equals("POST", StringComparison.OrdinalIgnoreCase) ||
               method.Equals("PUT", StringComparison.OrdinalIgnoreCase) ||
               method.Equals("PATCH", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsValidContentType(string? contentType)
    {
        if (string.IsNullOrEmpty(contentType))
            return false;

        return contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) ||
               contentType.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddSecurityHeaders(HttpResponse response)
    {
        response.Headers.Append("X-Content-Type-Options", "nosniff");
        response.Headers.Append("X-Frame-Options", "DENY");
        response.Headers.Append("X-XSS-Protection", "1; mode=block");
        response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        response.Headers.Append("Content-Security-Policy", "default-src 'self'");
    }

    private static async Task WriteValidationErrorAsync(HttpContext context, string message)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";

        var error = new ProblemDetails
        {
            Status = 400,
            Title = "Validation Error",
            Detail = message
        };

        var json = JsonSerializer.Serialize(error, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
