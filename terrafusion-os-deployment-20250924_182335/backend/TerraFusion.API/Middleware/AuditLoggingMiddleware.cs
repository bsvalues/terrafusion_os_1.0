using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.API.Middleware
{
    public class AuditLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public AuditLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (ShouldSkipLogging(context.Request.Path))
            {
                await _next(context);
                return;
            }

            var auditLogger = context.RequestServices.GetService<IAuditLogger>();
            
            if (auditLogger == null)
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();
            var originalBodyStream = context.Response.Body;

            try
            {
                using var responseBody = new MemoryStream();
                context.Response.Body = responseBody;

                await _next(context);

                stopwatch.Stop();

                var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                
                await auditLogger.LogApiCallAsync(
                    context.Request.Method,
                    context.Request.Path.ToString(),
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds,
                    userId);

                if (context.Response.StatusCode >= 400)
                {
                    await LogErrorDetails(context, auditLogger, responseBody);
                }

                await responseBody.CopyToAsync(originalBodyStream);
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }

        private bool ShouldSkipLogging(PathString path)
        {
            var pathValue = path.Value?.ToLowerInvariant();
            if (string.IsNullOrEmpty(pathValue)) return true;

            var skipPaths = new[]
            {
                "/health",
                "/swagger",
                "/favicon.ico",
                "/_framework",
                "/_content",
                "/css/",
                "/js/",
                "/images/",
                "/fonts/"
            };

            foreach (var skipPath in skipPaths)
            {
                if (pathValue.Contains(skipPath))
                {
                    return true;
                }
            }

            return false;
        }

        private async Task LogErrorDetails(HttpContext context, IAuditLogger auditLogger, MemoryStream responseBody)
        {
            try
            {
                responseBody.Seek(0, SeekOrigin.Begin);
                var responseText = await new StreamReader(responseBody).ReadToEndAsync();
                responseBody.Seek(0, SeekOrigin.Begin);

                var details = $"Error response: {responseText}";
                await auditLogger.LogErrorAsync(
                    $"{context.Request.Method} {context.Request.Path}",
                    new Exception(details),
                    context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            }
            catch
            {
            }
        }
    }

    public static class AuditLoggingMiddlewareExtensions
    {
        public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuditLoggingMiddleware>();
        }
    }
}
