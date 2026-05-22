using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace TerraFusion.CurrentUse.Middleware;

/// <summary>
/// Global exception handler for CurrentUse API endpoints.
/// Catches validation errors, domain exceptions, and unhandled exceptions,
/// returning structured error responses with correlation IDs.
/// </summary>
public class CurrentUseExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CurrentUseExceptionMiddleware> _logger;

    public CurrentUseExceptionMiddleware(RequestDelegate next, ILogger<CurrentUseExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only handle requests to the currentuse API
        if (!context.Request.Path.StartsWithSegments("/api/currentuse"))
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
            var correlationId = $"corr-cu-{Guid.NewGuid():N}";
            _logger.LogWarning(ex, "Validation error [{CorrelationId}]: {Errors}",
                correlationId, string.Join("; ", ex.Errors.Select(e => e.ErrorMessage)));

            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var response = new
            {
                type = "validation_error",
                correlationId,
                errors = ex.Errors.Select(e => new
                {
                    field = e.PropertyName,
                    message = e.ErrorMessage,
                    code = e.ErrorCode
                })
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (CurrentUseDomainException ex)
        {
            var correlationId = $"corr-cu-{Guid.NewGuid():N}";
            _logger.LogWarning(ex, "Domain error [{CorrelationId}]: {Message}", correlationId, ex.Message);

            context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
            context.Response.ContentType = "application/json";

            var response = new
            {
                type = "domain_error",
                correlationId,
                message = ex.Message,
                code = ex.Code
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex)
        {
            var correlationId = $"corr-cu-{Guid.NewGuid():N}";
            _logger.LogError(ex, "Unhandled exception [{CorrelationId}] in CurrentUse API", correlationId);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = new
            {
                type = "internal_error",
                correlationId,
                message = "An unexpected error occurred. Please reference this correlation ID when reporting."
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}

/// <summary>
/// Domain-specific exception for CurrentUse business rule violations.
/// </summary>
public class CurrentUseDomainException : Exception
{
    public string Code { get; }

    public CurrentUseDomainException(string code, string message) : base(message)
    {
        Code = code;
    }

    public CurrentUseDomainException(string code, string message, Exception inner) : base(message, inner)
    {
        Code = code;
    }
}
