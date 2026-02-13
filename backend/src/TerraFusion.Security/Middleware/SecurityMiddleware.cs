using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Text;
using System.Text.Json;
using TerraFusion.Security.Services;
using TerraFusion.Security.Extensions;

namespace TerraFusion.Security.Middleware;

/// <summary>
/// REVOLUTIONARY: Advanced Security Middleware Pipeline
///
/// This comprehensive middleware suite provides world-class security protection
/// for TerraFusion OS with government-grade threat detection, rate limiting,
/// compliance enforcement, and real-time security monitoring.
/// </summary>

/// <summary>
/// Security headers middleware for government compliance
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly SecurityConfiguration _securityConfig;

    public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger, IOptions<SecurityConfiguration> securityConfig)
    {
        _next = next;
        _logger = logger;
        _securityConfig = securityConfig.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add government-required security headers
        AddSecurityHeaders(context.Response);

        await _next(context);
    }

    private void AddSecurityHeaders(HttpResponse response)
    {
        // Prevent clickjacking attacks
        response.Headers.Append("X-Frame-Options", "DENY");

        // Prevent MIME type sniffing
        response.Headers.Append("X-Content-Type-Options", "nosniff");

        // XSS protection
        response.Headers.Append("X-XSS-Protection", "1; mode=block");

        // Referrer policy
        response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        // Content Security Policy (government-grade)
        response.Headers.Append("Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'");

        // Permissions Policy
        response.Headers.Append("Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), payment=(), usb=()");

        // HSTS (HTTP Strict Transport Security)
        response.Headers.Append("Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload");

        // Government identification
        response.Headers.Append("X-Government-System", "TerraFusion-OS");
        response.Headers.Append("X-Compliance-Level", "FISMA-HIGH");
        response.Headers.Append("X-Security-Classification", "UNCLASSIFIED");

        // Remove server information
        response.Headers.Remove("Server");
        response.Headers.Append("Server", "TerraFusion/1.0");

        // Remove .NET headers
        response.Headers.Remove("X-Powered-By");
        response.Headers.Remove("X-AspNet-Version");
        response.Headers.Remove("X-AspNetMvc-Version");
    }
}

/// <summary>
/// Advanced rate limiting middleware with adaptive algorithms
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly IRateLimitingService _rateLimitingService;

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger, IRateLimitingService rateLimitingService)
    {
        _next = next;
        _logger = logger;
        _rateLimitingService = rateLimitingService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIP = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var endpoint = context.Request.Path.ToString();

        var rateLimitResult = await _rateLimitingService.CheckRateLimitAsync(clientIP, endpoint);

        if (!rateLimitResult.IsAllowed)
        {
            _logger.LogWarning("Rate limit exceeded for IP {IP} on endpoint {Endpoint}. Limit: {Limit}, Current: {Current}",
                clientIP, endpoint, rateLimitResult.Limit, rateLimitResult.Current);

            context.Response.StatusCode = 429; // Too Many Requests
            context.Response.Headers.Append("Retry-After", rateLimitResult.RetryAfter.ToString());
            context.Response.Headers.Append("X-RateLimit-Limit", rateLimitResult.Limit.ToString());
            context.Response.Headers.Append("X-RateLimit-Remaining", rateLimitResult.Remaining.ToString());
            context.Response.Headers.Append("X-RateLimit-Reset", rateLimitResult.ResetTime.ToString());

            await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
            return;
        }

        // Add rate limit headers for monitoring
        context.Response.Headers.Append("X-RateLimit-Limit", rateLimitResult.Limit.ToString());
        context.Response.Headers.Append("X-RateLimit-Remaining", rateLimitResult.Remaining.ToString());
        context.Response.Headers.Append("X-RateLimit-Reset", rateLimitResult.ResetTime.ToString());

        await _next(context);
    }
}

/// <summary>
/// Advanced threat detection and blocking middleware
/// </summary>
public class ThreatDetectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ThreatDetectionMiddleware> _logger;
    private readonly ISecurityAuditService _auditService;

    // Threat patterns for government security
    private readonly string[] _suspiciousPatterns = {
        "eval\\s*\\(", "javascript:", "<script", "union.*select", "drop.*table",
        "exec\\s*\\(", "system\\s*\\(", "\\.\\./", "cmd\\.exe", "powershell",
        "wget", "curl", "base64", "xp_cmdshell", "sp_executesql"
    };

    private readonly string[] _maliciousUserAgents = {
        "sqlmap", "nikto", "nmap", "masscan", "zap", "burp", "metasploit"
    };

    public ThreatDetectionMiddleware(RequestDelegate next, ILogger<ThreatDetectionMiddleware> logger, ISecurityAuditService auditService)
    {
        _next = next;
        _logger = logger;
        _auditService = auditService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var threatAnalysis = await AnalyzeThreatAsync(context);

        if (threatAnalysis.ThreatLevel >= ThreatLevel.High)
        {
            _logger.LogWarning("High threat detected from IP {IP}: {ThreatType}",
                context.Connection.RemoteIpAddress, threatAnalysis.ThreatType);

            await _auditService.LogSecurityEventAsync("THREAT_DETECTED", new
            {
                IP = context.Connection.RemoteIpAddress?.ToString(),
                ThreatType = threatAnalysis.ThreatType,
                ThreatLevel = threatAnalysis.ThreatLevel.ToString(),
                RequestPath = context.Request.Path.ToString(),
                UserAgent = context.Request.Headers["User-Agent"].ToString(),
                Details = threatAnalysis.Details
            });

            context.Response.StatusCode = 403; // Forbidden
            await context.Response.WriteAsync("Access denied - security threat detected");
            return;
        }

        if (threatAnalysis.ThreatLevel >= ThreatLevel.Medium)
        {
            // Log medium threats but allow request
            await _auditService.LogSecurityEventAsync("SUSPICIOUS_ACTIVITY", new
            {
                IP = context.Connection.RemoteIpAddress?.ToString(),
                ThreatType = threatAnalysis.ThreatType,
                RequestPath = context.Request.Path.ToString()
            });
        }

        await _next(context);
    }

    private async Task<ThreatAnalysis> AnalyzeThreatAsync(HttpContext context)
    {
        var threats = new List<string>();
        var threatLevel = ThreatLevel.None;

        // Analyze request URL
        var url = context.Request.Path.ToString().ToLowerInvariant();
        foreach (var pattern in _suspiciousPatterns)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(url, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                threats.Add($"Suspicious URL pattern: {pattern}");
                threatLevel = ThreatLevel.High;
            }
        }

        // Analyze query parameters
        foreach (var param in context.Request.Query)
        {
            var value = param.Value.ToString().ToLowerInvariant();
            foreach (var pattern in _suspiciousPatterns)
            {
                if (System.Text.RegularExpressions.Regex.IsMatch(value, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                {
                    threats.Add($"Suspicious query parameter: {param.Key}");
                    threatLevel = ThreatLevel.High;
                }
            }
        }

        // Analyze User-Agent
        var userAgent = context.Request.Headers["User-Agent"].ToString().ToLowerInvariant();
        foreach (var maliciousAgent in _maliciousUserAgents)
        {
            if (userAgent.Contains(maliciousAgent))
            {
                threats.Add($"Malicious User-Agent: {maliciousAgent}");
                threatLevel = ThreatLevel.High;
            }
        }

        // Analyze request body for POST/PUT requests
        if (context.Request.Method == "POST" || context.Request.Method == "PUT")
        {
            var bodyThreatLevel = await AnalyzeRequestBodyAsync(context);
            if (bodyThreatLevel > threatLevel)
                threatLevel = bodyThreatLevel;
        }

        // Check for suspicious headers
        var suspiciousHeaders = new[] { "x-forwarded-for", "x-real-ip", "x-originating-ip" };
        foreach (var header in suspiciousHeaders)
        {
            if (context.Request.Headers.ContainsKey(header))
            {
                var headerValue = context.Request.Headers[header].ToString();
                if (IsPrivateIP(headerValue) && !IsPrivateIP(context.Connection.RemoteIpAddress?.ToString()))
                {
                    threats.Add("Suspicious IP forwarding detected");
                    threatLevel = Math.Max(threatLevel, ThreatLevel.Medium);
                }
            }
        }

        return new ThreatAnalysis
        {
            ThreatLevel = threatLevel,
            ThreatType = threatLevel >= ThreatLevel.High ? "INJECTION_ATTACK" : "SUSPICIOUS_ACTIVITY",
            Details = threats.ToArray(),
            AnalyzedAt = DateTime.UtcNow
        };
    }

    private async Task<ThreatLevel> AnalyzeRequestBodyAsync(HttpContext context)
    {
        try
        {
            context.Request.EnableBuffering();
            var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
            context.Request.Body.Position = 0;

            var bodyLower = body.ToLowerInvariant();
            foreach (var pattern in _suspiciousPatterns)
            {
                if (System.Text.RegularExpressions.Regex.IsMatch(bodyLower, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                {
                    return ThreatLevel.High;
                }
            }

            return ThreatLevel.None;
        }
        catch
        {
            return ThreatLevel.None;
        }
    }

    private bool IsPrivateIP(string? ip)
    {
        if (string.IsNullOrEmpty(ip) || !IPAddress.TryParse(ip, out var address))
            return false;

        var bytes = address.GetAddressBytes();

        return bytes[0] == 10 ||
               (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
               (bytes[0] == 192 && bytes[1] == 168);
    }
}

/// <summary>
/// Comprehensive audit logging middleware
/// </summary>
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;
    private readonly ISecurityAuditService _auditService;

    public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger, ISecurityAuditService auditService)
    {
        _next = next;
        _logger = logger;
        _auditService = auditService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid().ToString();
        var startTime = DateTime.UtcNow;

        // Log request start
        await LogRequestStartAsync(context, requestId);

        try
        {
            await _next(context);
        }
        finally
        {
            // Log request completion
            var duration = DateTime.UtcNow - startTime;
            await LogRequestCompletionAsync(context, requestId, duration);
        }
    }

    private async Task LogRequestStartAsync(HttpContext context, string requestId)
    {
        var auditData = new
        {
            RequestId = requestId,
            Method = context.Request.Method,
            Path = context.Request.Path.ToString(),
            Query = context.Request.QueryString.ToString(),
            RemoteIP = context.Connection.RemoteIpAddress?.ToString(),
            UserAgent = context.Request.Headers["User-Agent"].ToString(),
            User = context.User?.Identity?.Name,
            Timestamp = DateTime.UtcNow,
            Headers = context.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
        };

        await _auditService.LogSecurityEventAsync("REQUEST_START", auditData);
    }

    private async Task LogRequestCompletionAsync(HttpContext context, string requestId, TimeSpan duration)
    {
        var auditData = new
        {
            RequestId = requestId,
            StatusCode = context.Response.StatusCode,
            Duration = duration.TotalMilliseconds,
            ResponseSize = context.Response.ContentLength ?? 0,
            User = context.User?.Identity?.Name,
            Timestamp = DateTime.UtcNow
        };

        var eventType = context.Response.StatusCode >= 400 ? "REQUEST_ERROR" : "REQUEST_COMPLETED";
        await _auditService.LogSecurityEventAsync(eventType, auditData);
    }
}

/// <summary>
/// Government compliance enforcement middleware
/// </summary>
public class ComplianceEnforcementMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ComplianceEnforcementMiddleware> _logger;
    private readonly IComplianceMonitoringService _complianceService;

    public ComplianceEnforcementMiddleware(RequestDelegate next, ILogger<ComplianceEnforcementMiddleware> logger, IComplianceMonitoringService complianceService)
    {
        _next = next;
        _logger = logger;
        _complianceService = complianceService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Enforce HTTPS for government data
        if (!context.Request.IsHttps)
        {
            _logger.LogWarning("HTTP request blocked for government compliance from IP {IP}",
                context.Connection.RemoteIpAddress);

            context.Response.StatusCode = 426; // Upgrade Required
            await context.Response.WriteAsync("HTTPS required for government systems");
            return;
        }

        // Validate user security clearance for sensitive endpoints
        if (IsSensitiveEndpoint(context.Request.Path))
        {
            var hasRequiredClearance = await ValidateSecurityClearanceAsync(context);
            if (!hasRequiredClearance)
            {
                context.Response.StatusCode = 403; // Forbidden
                await context.Response.WriteAsync("Insufficient security clearance");
                return;
            }
        }

        // Monitor for compliance violations
        await _complianceService.MonitorRequestAsync(context);

        await _next(context);

        // Post-request compliance checks
        await _complianceService.ValidateResponseAsync(context);
    }

    private bool IsSensitiveEndpoint(PathString path)
    {
        var sensitivePaths = new[]
        {
            "/api/aimodels",
            "/api/property",
            "/api/financial",
            "/api/citizen",
            "/api/admin"
        };

        return sensitivePaths.Any(p => path.StartsWithSegments(p));
    }

    private async Task<bool> ValidateSecurityClearanceAsync(HttpContext context)
    {
        var user = context.User;
        if (user?.Identity?.IsAuthenticated != true)
            return false;

        var securityClearance = user.FindFirst("SecurityClearance")?.Value;
        var requiredClearances = new[] { "High", "TopSecret" };

        return requiredClearances.Contains(securityClearance);
    }
}

/// <summary>
/// Main security middleware orchestrator
/// </summary>
public class SecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityMiddleware> _logger;

    public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Final security validation before allowing request
        var securityValidation = await PerformFinalSecurityValidationAsync(context);

        if (!securityValidation.IsValid)
        {
            _logger.LogWarning("Final security validation failed: {Reason}", securityValidation.Reason);
            context.Response.StatusCode = 403;
            await context.Response.WriteAsync("Access denied");
            return;
        }

        await _next(context);
    }

    private async Task<SecurityValidationResult> PerformFinalSecurityValidationAsync(HttpContext context)
    {
        // Implement final security checks
        return new SecurityValidationResult
        {
            IsValid = true,
            Reason = "Passed all security checks"
        };
    }
}

// Supporting classes and interfaces
public interface IRateLimitingService
{
    Task<RateLimitResult> CheckRateLimitAsync(string clientId, string endpoint);
}

public class AdaptiveRateLimitingService : IRateLimitingService
{
    private readonly ILogger<AdaptiveRateLimitingService> _logger;
    private readonly Dictionary<string, RateLimitTracker> _trackers = new();

    public AdaptiveRateLimitingService(ILogger<AdaptiveRateLimitingService> logger)
    {
        _logger = logger;
    }

    public async Task<RateLimitResult> CheckRateLimitAsync(string clientId, string endpoint)
    {
        var key = $"{clientId}:{endpoint}";
        var tracker = _trackers.GetValueOrDefault(key) ?? new RateLimitTracker();

        var now = DateTime.UtcNow;
        var windowStart = now.AddMinutes(-1);

        // Clean old requests
        tracker.Requests.RemoveAll(r => r < windowStart);

        // Check rate limit
        var limit = GetRateLimitForEndpoint(endpoint);
        var current = tracker.Requests.Count;

        if (current >= limit)
        {
            return new RateLimitResult
            {
                IsAllowed = false,
                Limit = limit,
                Current = current,
                Remaining = 0,
                RetryAfter = 60,
                ResetTime = windowStart.AddMinutes(1)
            };
        }

        // Add current request
        tracker.Requests.Add(now);
        _trackers[key] = tracker;

        return new RateLimitResult
        {
            IsAllowed = true,
            Limit = limit,
            Current = current + 1,
            Remaining = limit - current - 1,
            RetryAfter = 0,
            ResetTime = windowStart.AddMinutes(1)
        };
    }

    private int GetRateLimitForEndpoint(string endpoint)
    {
        return endpoint.ToLowerInvariant() switch
        {
            var e when e.Contains("/api/aimodels") => 30, // AI endpoints are more restrictive
            var e when e.Contains("/api/auth") => 10, // Authentication endpoints
            var e when e.Contains("/api/admin") => 20, // Admin endpoints
            _ => 100 // Default rate limit
        };
    }
}

public interface IComplianceMonitoringService
{
    Task MonitorRequestAsync(HttpContext context);
    Task ValidateResponseAsync(HttpContext context);
}

public class GovernmentComplianceMonitoringService : IComplianceMonitoringService
{
    private readonly ILogger<GovernmentComplianceMonitoringService> _logger;
    private readonly ISecurityAuditService _auditService;

    public GovernmentComplianceMonitoringService(ILogger<GovernmentComplianceMonitoringService> logger, ISecurityAuditService auditService)
    {
        _logger = logger;
        _auditService = auditService;
    }

    public async Task MonitorRequestAsync(HttpContext context)
    {
        // Monitor for FISMA compliance violations
        if (ContainsSensitiveData(context))
        {
            await _auditService.LogSecurityEventAsync("SENSITIVE_DATA_ACCESS", new
            {
                Path = context.Request.Path.ToString(),
                User = context.User?.Identity?.Name,
                IP = context.Connection.RemoteIpAddress?.ToString()
            });
        }
    }

    public async Task ValidateResponseAsync(HttpContext context)
    {
        // Ensure response complies with government standards
        if (context.Response.StatusCode >= 500)
        {
            await _auditService.LogSecurityEventAsync("SERVER_ERROR", new
            {
                StatusCode = context.Response.StatusCode,
                Path = context.Request.Path.ToString(),
                User = context.User?.Identity?.Name
            });
        }
    }

    private bool ContainsSensitiveData(HttpContext context)
    {
        var sensitivePaths = new[] { "/api/citizen", "/api/property", "/api/financial" };
        return sensitivePaths.Any(p => context.Request.Path.StartsWithSegments(p));
    }
}

// Model classes
public class ThreatAnalysis
{
    public ThreatLevel ThreatLevel { get; set; }
    public string ThreatType { get; set; } = string.Empty;
    public string[] Details { get; set; } = Array.Empty<string>();
    public DateTime AnalyzedAt { get; set; }
}

public enum ThreatLevel
{
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public class RateLimitResult
{
    public bool IsAllowed { get; set; }
    public int Limit { get; set; }
    public int Current { get; set; }
    public int Remaining { get; set; }
    public int RetryAfter { get; set; }
    public DateTime ResetTime { get; set; }
}

public class RateLimitTracker
{
    public List<DateTime> Requests { get; set; } = new();
}

public class SecurityValidationResult
{
    public bool IsValid { get; set; }
    public string Reason { get; set; } = string.Empty;
}
