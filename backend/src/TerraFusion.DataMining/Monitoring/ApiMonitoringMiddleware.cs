// TMR-108: API Monitoring Middleware - Request/response logging
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Monitoring
{
    /// <summary>
    /// ASP.NET Core middleware that logs request/response timing and status codes.
    /// </summary>
    public class ApiMonitoringMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ApiMonitoringMiddleware> _logger;

        public ApiMonitoringMiddleware(RequestDelegate next, ILogger<ApiMonitoringMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        /// <summary>
        /// Processes the HTTP request, measuring elapsed time and logging results.
        /// </summary>
        public async Task InvokeAsync(HttpContext context)
        {
            var requestId = Guid.NewGuid().ToString("N")[..12];
            var method = context.Request.Method;
            var path = context.Request.Path.Value ?? "/";
            var stopwatch = Stopwatch.StartNew();

            _logger.LogInformation("[{RequestId}] {Method} {Path} started", requestId, method, path);

            try
            {
                await _next(context);
                stopwatch.Stop();

                var statusCode = context.Response.StatusCode;
                var level = statusCode >= 500 ? LogLevel.Error
                    : statusCode >= 400 ? LogLevel.Warning
                    : LogLevel.Information;

                _logger.Log(level,
                    "[{RequestId}] {Method} {Path} completed {StatusCode} in {ElapsedMs}ms",
                    requestId, method, path, statusCode, stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex,
                    "[{RequestId}] {Method} {Path} failed after {ElapsedMs}ms",
                    requestId, method, path, stopwatch.ElapsedMilliseconds);
                throw;
            }
        }
    }

    /// <summary>
    /// Summary of a monitored API request.
    /// </summary>
    public class ApiRequestMetric
    {
        public string RequestId { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public long ElapsedMs { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
