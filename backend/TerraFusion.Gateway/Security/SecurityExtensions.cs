using Microsoft.AspNetCore.Builder;

namespace TerraFusion.Gateway.Security;

/// <summary>
/// Security extensions for TerraFusion Gateway
/// </summary>
public static class SecurityExtensions
{
    /// <summary>
    /// Adds government-grade security headers for FISMA compliance
    /// </summary>
    /// <param name="app">Application builder</param>
    /// <returns>Application builder</returns>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            // Add security headers for government compliance
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Add("X-Frame-Options", "DENY");
            context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            context.Response.Headers.Add("Content-Security-Policy", "default-src 'self'");
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
            context.Response.Headers.Add("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

            await next();
        });

        return app;
    }
}