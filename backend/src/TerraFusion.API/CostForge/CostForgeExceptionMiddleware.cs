using System.Text.Json;

namespace TerraFusion.API.CostForge;

/// <summary>
/// Exception middleware for CostForge API endpoints.
/// Produces correlationId-first structured error responses matching the
/// TerraFusion OS error display pattern (corr-cf-* prefix).
/// </summary>
public class CostForgeExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CostForgeExceptionMiddleware> _logger;

    public CostForgeExceptionMiddleware(RequestDelegate next, ILogger<CostForgeExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only intercept CostForge routes
        if (!context.Request.Path.StartsWithSegments("/api/costforge", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            var correlationId = $"corr-cf-{Guid.NewGuid():N}";
            _logger.LogWarning(ex, "CostForge validation error [{CorrelationId}]: {Message}", correlationId, ex.Message);

            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                correlationId,
                error = "Validation failed",
                message = ex.Message,
                component = "CostForge",
                timestamp = DateTime.UtcNow,
            }));
        }
        catch (InvalidOperationException ex)
        {
            var correlationId = $"corr-cf-{Guid.NewGuid():N}";
            _logger.LogWarning(ex, "CostForge operation error [{CorrelationId}]: {Message}", correlationId, ex.Message);

            context.Response.StatusCode = 422;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                correlationId,
                error = "Operation failed",
                message = ex.Message,
                component = "CostForge",
                timestamp = DateTime.UtcNow,
            }));
        }
        catch (Exception ex)
        {
            var correlationId = $"corr-cf-{Guid.NewGuid():N}";
            _logger.LogError(ex, "CostForge unhandled error [{CorrelationId}]", correlationId);

            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                correlationId,
                error = "Internal server error",
                message = "An unexpected error occurred in the CostForge engine",
                component = "CostForge",
                timestamp = DateTime.UtcNow,
            }));
        }
    }
}

/// <summary>Custom validation exception for CostForge domain rules.</summary>
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
    public ValidationException(string message, Exception inner) : base(message, inner) { }
}
