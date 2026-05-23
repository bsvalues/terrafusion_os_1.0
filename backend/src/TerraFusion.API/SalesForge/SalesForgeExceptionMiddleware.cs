using System.Net;
using System.Text.Json;

namespace TerraFusion.API.SalesForge;

/// <summary>
/// Exception middleware for SalesForge endpoints.
/// Returns correlationId-first structured error responses matching the UI error flow.
/// </summary>
public sealed class SalesForgeExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SalesForgeExceptionMiddleware> _logger;

    public SalesForgeExceptionMiddleware(RequestDelegate next, ILogger<SalesForgeExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only intercept SalesForge routes
        if (!context.Request.Path.StartsWithSegments("/api/terraforge") &&
            !context.Request.Path.StartsWithSegments("/api/sales"))
        {
            await _next(context);
            return;
        }

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var correlationId = $"corr-sf-{Guid.NewGuid():N}";
            _logger.LogError(ex,
                "[SalesForge Error] correlationId={CorrelationId} Path={Path} Method={Method}",
                correlationId, context.Request.Path, context.Request.Method);

            context.Response.StatusCode = ex switch
            {
                ArgumentException => (int)HttpStatusCode.BadRequest,
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                InvalidOperationException => (int)HttpStatusCode.Conflict,
                UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,
                _ => (int)HttpStatusCode.InternalServerError,
            };

            context.Response.ContentType = "application/json";
            var errorResponse = new
            {
                correlationId,
                error = ex switch
                {
                    ArgumentException => "VALIDATION_ERROR",
                    KeyNotFoundException => "NOT_FOUND",
                    InvalidOperationException => "CONFLICT",
                    UnauthorizedAccessException => "FORBIDDEN",
                    _ => "INTERNAL_ERROR",
                },
                message = ex is ArgumentException or KeyNotFoundException or InvalidOperationException
                    ? ex.Message
                    : "An unexpected error occurred. Use the correlationId for debugging.",
                component = "SalesForge",
                path = context.Request.Path.Value,
                timestamp = DateTimeOffset.UtcNow,
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
        }
    }
}
