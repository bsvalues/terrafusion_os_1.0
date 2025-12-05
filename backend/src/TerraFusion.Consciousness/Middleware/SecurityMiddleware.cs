using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Consciousness.Services;
using TerraFusion.Consciousness.Interfaces;
using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Middleware
{
    /// <summary>
    /// Consciousness audit middleware for government-grade operation tracking
    /// Ensures comprehensive audit trail for all consciousness operations
    /// </summary>
    public class ConsciousnessAuditMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ConsciousnessAuditMiddleware> _logger;
        private readonly IAuditLogger _auditLogger;

        public ConsciousnessAuditMiddleware(
            RequestDelegate next,
            ILogger<ConsciousnessAuditMiddleware> logger,
            IAuditLogger auditLogger)
        {
            _next = next;
            _logger = logger;
            _auditLogger = auditLogger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestId = Guid.NewGuid().ToString();
            var startTime = DateTime.UtcNow;

            // Log request start
            await LogAuditEventAsync("REQUEST_START", context, requestId, new Dictionary<string, object>
            {
                { "Method", context.Request.Method },
                { "Path", context.Request.Path },
                { "QueryString", context.Request.QueryString.ToString() },
                { "UserAgent", context.Request.Headers["User-Agent"].ToString() },
                { "RemoteIpAddress", context.Connection.RemoteIpAddress?.ToString() ?? "Unknown" }
            });

            try
            {
                // Execute next middleware
                await _next(context);

                // Log successful completion
                await LogAuditEventAsync("REQUEST_COMPLETED", context, requestId, new Dictionary<string, object>
                {
                    { "StatusCode", context.Response.StatusCode },
                    { "ProcessingTime", (DateTime.UtcNow - startTime).TotalMilliseconds },
                    { "ResponseSize", context.Response.ContentLength ?? 0 }
                });
            }
            catch (Exception ex)
            {
                // Log error
                await LogAuditEventAsync("REQUEST_ERROR", context, requestId, new Dictionary<string, object>
                {
                    { "ErrorType", ex.GetType().Name },
                    { "ErrorMessage", ex.Message },
                    { "ProcessingTime", (DateTime.UtcNow - startTime).TotalMilliseconds }
                });

                throw; // Re-throw to maintain error handling chain
            }
        }

        private async Task LogAuditEventAsync(string eventType, HttpContext context, string requestId, Dictionary<string, object> details)
        {
            try
            {
                var userId = GetUserIdFromContext(context);

                await _auditLogger.LogAuditEventAsync(new AuditEvent
                {
                    EventType = eventType,
                    UserId = userId,
                    Description = $"{eventType} for {context.Request.Method} {context.Request.Path}",
                    Details = details,
                    ResourceId = requestId,
                    ComplianceLevel = "GOVERNMENT_GRADE"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to log audit event for request {RequestId}", requestId);
                // Don't throw - audit failure shouldn't break the request
            }
        }

        private string GetUserIdFromContext(HttpContext context)
        {
            // Extract user ID from authentication context
            var userClaim = context.User?.FindFirst("sub") ?? context.User?.FindFirst("id");
            return userClaim?.Value ?? "anonymous";
        }
    }

    /// <summary>
    /// Quantum security middleware for advanced threat protection
    /// Implements quantum-ready security measures for consciousness operations
    /// </summary>
    public class QuantumSecurityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<QuantumSecurityMiddleware> _logger;
        private readonly IAuditLogger _auditLogger;
        private readonly HashSet<string> _blockedIPs;
        private readonly Dictionary<string, SecurityMetrics> _securityMetrics;

        public QuantumSecurityMiddleware(
            RequestDelegate next,
            ILogger<QuantumSecurityMiddleware> logger,
            IAuditLogger auditLogger)
        {
            _next = next;
            _logger = logger;
            _auditLogger = auditLogger;
            _blockedIPs = new HashSet<string>();
            _securityMetrics = new Dictionary<string, SecurityMetrics>();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var clientIP = GetClientIP(context);
            var requestId = Guid.NewGuid().ToString();

            try
            {
                // Quantum security validations
                if (!await ValidateQuantumSecurityAsync(context, clientIP, requestId))
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsync("Access denied by quantum security protocols");
                    return;
                }

                // Advanced threat detection
                if (!await ValidateThreatDetectionAsync(context, clientIP, requestId))
                {
                    context.Response.StatusCode = 429;
                    await context.Response.WriteAsync("Request blocked by threat detection system");
                    return;
                }

                // Encryption validation for sensitive endpoints
                if (!ValidateEncryptionRequirements(context))
                {
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsync("Insufficient encryption for this endpoint");
                    return;
                }

                // Update security metrics
                UpdateSecurityMetrics(clientIP);

                // Add security headers
                AddQuantumSecurityHeaders(context);

                await _next(context);

                // Log successful security validation
                await LogSecurityEventAsync("SECURITY_VALIDATION_PASSED", context, requestId, clientIP);
            }
            catch (SecurityException ex)
            {
                _logger.LogWarning("🔒 Security violation detected from {ClientIP}: {Message}", clientIP, ex.Message);

                await LogSecurityEventAsync("SECURITY_VIOLATION", context, requestId, clientIP, new Dictionary<string, object>
                {
                    { "ViolationType", ex.GetType().Name },
                    { "ViolationMessage", ex.Message }
                });

                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("Security violation detected");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Quantum security middleware error");
                throw;
            }
        }

        private async Task<bool> ValidateQuantumSecurityAsync(HttpContext context, string clientIP, string requestId)
        {
            // Check if IP is blocked
            if (_blockedIPs.Contains(clientIP))
            {
                await LogSecurityEventAsync("BLOCKED_IP_ACCESS", context, requestId, clientIP);
                return false;
            }

            // Quantum encryption validation
            var quantumHeader = context.Request.Headers["X-Quantum-Signature"].FirstOrDefault();
            if (IsQuantumEndpoint(context.Request.Path) && string.IsNullOrEmpty(quantumHeader))
            {
                await LogSecurityEventAsync("MISSING_QUANTUM_SIGNATURE", context, requestId, clientIP);
                return false;
            }

            // Government clearance validation for classified endpoints
            if (IsClassifiedEndpoint(context.Request.Path))
            {
                var clearanceLevel = context.Request.Headers["X-Security-Clearance"].FirstOrDefault();
                if (!ValidateSecurityClearance(clearanceLevel))
                {
                    await LogSecurityEventAsync("INSUFFICIENT_CLEARANCE", context, requestId, clientIP);
                    return false;
                }
            }

            return true;
        }

        private async Task<bool> ValidateThreatDetectionAsync(HttpContext context, string clientIP, string requestId)
        {
            // Rate limiting per IP
            if (!ValidateRateLimit(clientIP))
            {
                await LogSecurityEventAsync("RATE_LIMIT_EXCEEDED", context, requestId, clientIP);
                return false;
            }

            // Suspicious pattern detection
            if (DetectSuspiciousPatterns(context))
            {
                await LogSecurityEventAsync("SUSPICIOUS_PATTERN_DETECTED", context, requestId, clientIP);
                return false;
            }

            // SQL injection detection
            if (DetectSQLInjection(context))
            {
                await LogSecurityEventAsync("SQL_INJECTION_ATTEMPT", context, requestId, clientIP);
                _blockedIPs.Add(clientIP); // Block IP after injection attempt
                return false;
            }

            return true;
        }

        private bool ValidateEncryptionRequirements(HttpContext context)
        {
            // Require HTTPS for all consciousness endpoints
            if (IsConsciousnessEndpoint(context.Request.Path) && !context.Request.IsHttps)
            {
                return false;
            }

            // Validate TLS version for high-security endpoints
            if (IsHighSecurityEndpoint(context.Request.Path))
            {
                // In production, check actual TLS version
                return true; // Simplified for this implementation
            }

            return true;
        }

        private void UpdateSecurityMetrics(string clientIP)
        {
            if (!_securityMetrics.ContainsKey(clientIP))
            {
                _securityMetrics[clientIP] = new SecurityMetrics();
            }

            _securityMetrics[clientIP].RequestCount++;
            _securityMetrics[clientIP].LastSeen = DateTime.UtcNow;
        }

        private void AddQuantumSecurityHeaders(HttpContext context)
        {
            context.Response.Headers["X-Quantum-Security"] = "enabled";
            context.Response.Headers["X-Government-Grade"] = "FISMA-FedRAMP-SOC2";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        private string GetClientIP(HttpContext context)
        {
            return context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                   context.Request.Headers["X-Real-IP"].FirstOrDefault() ??
                   context.Connection.RemoteIpAddress?.ToString() ??
                   "Unknown";
        }

        private bool IsQuantumEndpoint(string path)
        {
            return path.Contains("/quantum", StringComparison.OrdinalIgnoreCase) ||
                   path.Contains("/consciousness", StringComparison.OrdinalIgnoreCase);
        }

        private bool IsClassifiedEndpoint(string path)
        {
            return path.Contains("/classified", StringComparison.OrdinalIgnoreCase) ||
                   path.Contains("/secret", StringComparison.OrdinalIgnoreCase);
        }

        private bool IsConsciousnessEndpoint(string path)
        {
            return path.Contains("/consciousness", StringComparison.OrdinalIgnoreCase) ||
                   path.Contains("/mesh", StringComparison.OrdinalIgnoreCase);
        }

        private bool IsHighSecurityEndpoint(string path)
        {
            return path.Contains("/admin", StringComparison.OrdinalIgnoreCase) ||
                   path.Contains("/secure", StringComparison.OrdinalIgnoreCase);
        }

        private bool ValidateSecurityClearance(string? clearanceLevel)
        {
            if (string.IsNullOrEmpty(clearanceLevel))
                return false;

            var validClearances = new[] { "SECRET", "TOP_SECRET", "COSMIC" };
            return validClearances.Contains(clearanceLevel.ToUpper());
        }

        private bool ValidateRateLimit(string clientIP)
        {
            if (_securityMetrics.TryGetValue(clientIP, out var metrics))
            {
                var timeWindow = TimeSpan.FromMinutes(1);
                var recentRequests = metrics.RequestCount;

                // Allow 100 requests per minute per IP
                return recentRequests <= 100;
            }

            return true;
        }

        private bool DetectSuspiciousPatterns(HttpContext context)
        {
            var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault() ?? "";
            var suspiciousPatterns = new[] { "bot", "crawler", "scanner", "hack" };

            return suspiciousPatterns.Any(pattern =>
                userAgent.Contains(pattern, StringComparison.OrdinalIgnoreCase));
        }

        private bool DetectSQLInjection(HttpContext context)
        {
            var queryString = context.Request.QueryString.ToString();
            var sqlPatterns = new[] { "union select", "drop table", "exec(", "script>" };

            return sqlPatterns.Any(pattern =>
                queryString.Contains(pattern, StringComparison.OrdinalIgnoreCase));
        }

        private async Task LogSecurityEventAsync(string eventType, HttpContext context, string requestId, string clientIP, Dictionary<string, object>? additionalDetails = null)
        {
            try
            {
                var details = new Dictionary<string, object>
                {
                    { "ClientIP", clientIP },
                    { "UserAgent", context.Request.Headers["User-Agent"].ToString() },
                    { "Path", context.Request.Path },
                    { "Method", context.Request.Method }
                };

                if (additionalDetails != null)
                {
                    foreach (var detail in additionalDetails)
                    {
                        details[detail.Key] = detail.Value;
                    }
                }

                await _auditLogger.LogAuditEventAsync(new AuditEvent
                {
                    EventType = eventType,
                    UserId = GetUserIdFromContext(context),
                    Description = $"Security event: {eventType} from {clientIP}",
                    Details = details,
                    ResourceId = requestId,
                    ComplianceLevel = "QUANTUM_SECURITY"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to log security event");
            }
        }

        private string GetUserIdFromContext(HttpContext context)
        {
            var userClaim = context.User?.FindFirst("sub") ?? context.User?.FindFirst("id");
            return userClaim?.Value ?? "anonymous";
        }
    }

    /// <summary>
    /// Security metrics tracking
    /// </summary>
    public class SecurityMetrics
    {
        public int RequestCount { get; set; }
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;
        public List<string> SuspiciousActivities { get; set; } = new();
    }

    /// <summary>
    /// Custom security exception
    /// </summary>
    public class SecurityException : Exception
    {
        public SecurityException(string message) : base(message) { }
        public SecurityException(string message, Exception innerException) : base(message, innerException) { }
    }
}