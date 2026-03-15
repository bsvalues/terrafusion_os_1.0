// TFT-083: Security Headers Middleware
// Applies FISMA-HIGH compliant security headers to all HTTP responses.

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TerraFusion.Security.Middleware;

/// <summary>
/// Configuration options for security headers.
/// </summary>
public sealed class SecurityHeadersOptions
{
    /// <summary>Enable Strict-Transport-Security header. Default: true.</summary>
    public bool EnableHsts { get; set; } = true;

    /// <summary>HSTS max-age in seconds. Default: 2 years (63072000).</summary>
    public int HstsMaxAgeSeconds { get; set; } = 63_072_000;

    /// <summary>Include subdomains in HSTS. Default: true.</summary>
    public bool HstsIncludeSubDomains { get; set; } = true;

    /// <summary>Enable HSTS preload. Default: true.</summary>
    public bool HstsPreload { get; set; } = true;

    /// <summary>Content-Security-Policy directive. Null to use the built-in default.</summary>
    public string? ContentSecurityPolicy { get; set; }

    /// <summary>Additional custom headers to apply.</summary>
    public Dictionary<string, string> CustomHeaders { get; set; } = new();
}

/// <summary>
/// ASP.NET Core middleware that sets security-related HTTP response headers
/// per OWASP recommendations and FISMA-HIGH requirements.
/// </summary>
public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly SecurityHeadersOptions _options;

    private const string DefaultCsp =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' ws: wss:; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'";

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        ILogger<SecurityHeadersMiddleware> logger,
        IOptions<SecurityHeadersOptions>? options = null)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? new SecurityHeadersOptions();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            // Prevent MIME-type sniffing
            SetHeader(headers, "X-Content-Type-Options", "nosniff");

            // XSS protection (legacy browsers)
            SetHeader(headers, "X-XSS-Protection", "1; mode=block");

            // Prevent clickjacking
            SetHeader(headers, "X-Frame-Options", "DENY");

            // Referrer policy
            SetHeader(headers, "Referrer-Policy", "strict-origin-when-cross-origin");

            // Content Security Policy
            var csp = _options.ContentSecurityPolicy ?? DefaultCsp;
            SetHeader(headers, "Content-Security-Policy", csp);

            // Permissions policy (restrict browser features)
            SetHeader(headers, "Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=()");

            // Strict-Transport-Security
            if (_options.EnableHsts)
            {
                var hsts = $"max-age={_options.HstsMaxAgeSeconds}";
                if (_options.HstsIncludeSubDomains) hsts += "; includeSubDomains";
                if (_options.HstsPreload) hsts += "; preload";
                SetHeader(headers, "Strict-Transport-Security", hsts);
            }

            // Cache control for sensitive government data
            SetHeader(headers, "Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            SetHeader(headers, "Pragma", "no-cache");

            // Remove server identification headers
            headers.Remove("Server");
            headers.Remove("X-Powered-By");
            headers.Remove("X-AspNet-Version");

            // Apply any custom headers from configuration
            foreach (var (key, value) in _options.CustomHeaders)
            {
                SetHeader(headers, key, value);
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }

    private static void SetHeader(IHeaderDictionary headers, string name, string value)
    {
        if (!headers.ContainsKey(name))
        {
            headers.Append(name, value);
        }
    }
}

/// <summary>
/// Extension methods for registering security headers middleware.
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    /// <summary>
    /// Adds FISMA-HIGH compliant security headers to all responses.
    /// Place early in the pipeline, before UseStaticFiles.
    /// </summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }

    /// <summary>
    /// Adds security headers middleware with custom options.
    /// </summary>
    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder builder,
        Action<SecurityHeadersOptions> configure)
    {
        var options = new SecurityHeadersOptions();
        configure(options);

        return builder.UseMiddleware<SecurityHeadersMiddleware>(
            Microsoft.Extensions.Options.Options.Create(options));
    }
}
