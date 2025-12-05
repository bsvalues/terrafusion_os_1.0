using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;

namespace TerraFusion.Core.Behaviors;

/// <summary>
/// MediatR Pipeline Behavior for automatic request validation
/// Provides comprehensive input validation for all API requests
/// </summary>
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    private readonly ILogger<ValidationBehavior<TRequest, TResponse>> _logger;

    public ValidationBehavior(
        IEnumerable<IValidator<TRequest>> validators,
        ILogger<ValidationBehavior<TRequest, TResponse>> logger)
    {
        _validators = validators;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Skip validation if no validators are registered
        if (!_validators.Any())
        {
            return await next();
        }

        var typeName = typeof(TRequest).Name;
        _logger.LogDebug("🔍 Validating request: {RequestType}", typeName);

        // Create validation context
        var context = new ValidationContext<TRequest>(request);

        // Run all validators
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        // Collect all validation failures
        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Any())
        {
            _logger.LogWarning("❌ Validation failed for {RequestType}: {FailureCount} errors",
                typeName, failures.Count);

            // Log each validation error
            foreach (var failure in failures)
            {
                _logger.LogWarning("Validation error: {PropertyName} - {ErrorMessage} (Value: {AttemptedValue})",
                    failure.PropertyName, failure.ErrorMessage, failure.AttemptedValue);
            }

            throw new ValidationException(failures);
        }

        _logger.LogDebug("✅ Validation passed for {RequestType}", typeName);
        
        return await next();
    }
}

/// <summary>
/// Custom validation exception for API responses
/// </summary>
public class ValidationException : Exception
{
    public ValidationException()
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IEnumerable<FluentValidation.Results.ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(failureGroup => failureGroup.Key, failureGroup => failureGroup.ToArray());
    }

    public IDictionary<string, string[]> Errors { get; }

    /// <summary>
    /// Converts validation errors to API-friendly format
    /// </summary>
    public IEnumerable<ValidationErrorResponse> GetValidationErrors()
    {
        return Errors.SelectMany(kvp =>
            kvp.Value.Select(error => new ValidationErrorResponse
            {
                Field = kvp.Key,
                Message = error
            }));
    }
}

/// <summary>
/// Performance tracking behavior for API requests
/// </summary>
public class PerformanceTrackingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    where TResponse : class
{
    private readonly ILogger<PerformanceTrackingBehavior<TRequest, TResponse>> _logger;
    private readonly IRealPerformanceService _performanceService;

    public PerformanceTrackingBehavior(
        ILogger<PerformanceTrackingBehavior<TRequest, TResponse>> logger,
        IRealPerformanceService performanceService)
    {
        _logger = logger;
        _performanceService = performanceService;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        
        return await _performanceService.OptimizeAsync(async () =>
        {
            _logger.LogDebug("⚡ Processing request: {RequestName}", requestName);
            var response = await next();
            _logger.LogDebug("✅ Completed request: {RequestName}", requestName);
            return response;
        }, requestName);
    }
}

/// <summary>
/// Logging behavior for comprehensive request/response logging
/// </summary>
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var requestGuid = Guid.NewGuid();
        
        _logger.LogInformation("📥 Handling request {RequestId}: {RequestName}", requestGuid, requestName);
        
        try
        {
            var response = await next();
            _logger.LogInformation("📤 Request {RequestId} completed successfully", requestGuid);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Request {RequestId} failed: {ErrorMessage}", requestGuid, ex.Message);
            throw;
        }
    }
}

/// <summary>
/// Security logging behavior for auditing sensitive operations
/// </summary>
public class SecurityLoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<SecurityLoggingBehavior<TRequest, TResponse>> _logger;

    public SecurityLoggingBehavior(ILogger<SecurityLoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        
        // Log security-sensitive operations
        if (IsSensitiveOperation(requestName))
        {
            _logger.LogWarning("🔒 Security-sensitive operation initiated: {RequestName} at {Timestamp}",
                requestName, DateTime.UtcNow);
        }
        
        try
        {
            var response = await next();
            
            if (IsSensitiveOperation(requestName))
            {
                _logger.LogWarning("🔒 Security-sensitive operation completed: {RequestName}", requestName);
            }
            
            return response;
        }
        catch (Exception ex)
        {
            if (IsSensitiveOperation(requestName))
            {
                _logger.LogError("🚨 Security-sensitive operation failed: {RequestName} - {ErrorMessage}",
                    requestName, ex.Message);
            }
            throw;
        }
    }

    private static bool IsSensitiveOperation(string requestName)
    {
        var sensitiveOperations = new[]
        {
            "UserLogin", "UserRegistration", "PropertyCreate", "PropertyUpdate", "PropertyDelete",
            "AssessmentCreate", "AssessmentUpdate", "AssessmentDelete"
        };

        return sensitiveOperations.Any(op => requestName.Contains(op, StringComparison.OrdinalIgnoreCase));
    }
}