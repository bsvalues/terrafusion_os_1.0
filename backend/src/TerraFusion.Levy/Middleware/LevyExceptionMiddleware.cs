using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Levy.Middleware;

/// <summary>
/// Global exception handler for the Levy API surface.
/// Produces structured error responses with correlationId for the
/// TerraFusion correlationId-first UX pattern.
/// </summary>
public sealed class LevyExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<LevyExceptionMiddleware> _logger;

    public LevyExceptionMiddleware(RequestDelegate next, ILogger<LevyExceptionMiddleware> logger)
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
        catch (ValidationException ex)
        {
            await HandleValidationExceptionAsync(context, ex);
        }
        catch (Exception ex)
        {
            await HandleUnexpectedExceptionAsync(context, ex);
        }
    }

    private async Task HandleValidationExceptionAsync(HttpContext context, ValidationException ex)
    {
        var correlationId = $"corr-levy-{Guid.NewGuid():N}";
        _logger.LogWarning(
            "[Levy] Validation failure | correlationId={CorrelationId} | errors={Errors}",
            correlationId, string.Join("; ", ex.Errors.Select(e => e.ErrorMessage)));

        context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = "Validation failed",
            correlationId,
            errors = ex.Errors.Select(e => new
            {
                field = e.PropertyName,
                message = e.ErrorMessage,
                attemptedValue = e.AttemptedValue?.ToString()
            })
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, new JsonSerializerOptions { WriteIndented = false }));
    }

    private async Task HandleUnexpectedExceptionAsync(HttpContext context, Exception ex)
    {
        var correlationId = $"corr-levy-{Guid.NewGuid():N}";
        _logger.LogError(ex,
            "[Levy] Unhandled exception | correlationId={CorrelationId} | path={Path}",
            correlationId, context.Request.Path);

        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = "An internal error occurred in the Levy module",
            correlationId,
            path = context.Request.Path.Value
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response, new JsonSerializerOptions { WriteIndented = false }));
    }
}
