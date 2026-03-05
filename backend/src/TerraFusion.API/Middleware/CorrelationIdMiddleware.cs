using System.Text.RegularExpressions;

namespace TerraFusion.API.Middleware;

/// <summary>
/// Middleware that ensures every HTTP response includes an X-Correlation-ID header
/// for traceability. Reads the inbound header if present and valid; otherwise generates
/// a new correlation ID. Runs early in the pipeline so that even 400/403/404/500
/// error responses carry the header.
///
/// DX-05: Fixes the gap identified in DX-02 runtime smoke (Issue #572) where
/// X-Correlation-ID was only echoed on success paths.
/// </summary>
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly Regex SafePattern = new(@"^[A-Za-z0-9._\-]{1,128}$", RegexOptions.Compiled);
    private const string HeaderName = "X-Correlation-ID";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var inbound = context.Request.Headers[HeaderName].FirstOrDefault();

        string correlationId;
        if (!string.IsNullOrWhiteSpace(inbound) && SafePattern.IsMatch(inbound))
        {
            correlationId = inbound;
        }
        else
        {
            correlationId = $"tf-{Guid.NewGuid():N}";
        }

        // Store for downstream use (controllers, services, audit logger)
        context.Items["CorrelationId"] = correlationId;

        // Set header eagerly so it appears on ALL responses — 200, 400, 403, 404, 500.
        // Controllers that call GetOrCreateCorrelationId() may overwrite with same or
        // different value, which is fine (last-write wins, controller takes precedence).
        context.Response.Headers[HeaderName] = correlationId;

        await _next(context);
    }
}

public static class CorrelationIdMiddlewareExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CorrelationIdMiddleware>();
    }
}
