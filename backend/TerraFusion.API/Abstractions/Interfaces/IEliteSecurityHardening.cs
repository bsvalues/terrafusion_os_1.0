using TerraFusion.API.Security;

namespace TerraFusion.Abstractions.Interfaces;

/// <summary>
/// Elite Security Hardening Interface
/// Government-grade FISMA Moderate security interface for TerraFusion OS
/// Manages advanced security protocols for 50,000+ AI agents across 39 WA counties
/// </summary>
public interface IEliteSecurityHardening
{
    /// <summary>
    /// Validates JWT token with government-grade security checks
    /// </summary>
    Task<bool> ValidateJwtSecurityAsync(string token);

    /// <summary>
    /// Performs advanced rate limiting check for client requests
    /// </summary>
    Task<bool> CheckRateLimitAsync(string clientId, string endpoint);

    /// <summary>
    /// Detects security threats using AI-powered analysis
    /// </summary>
    Task<bool> DetectSecurityThreatsAsync(HttpContext context);

    /// <summary>
    /// Validates government-grade access permissions
    /// </summary>
    Task<bool> ValidateGovernmentGradeAccessAsync(System.Security.Claims.ClaimsPrincipal user, string requiredRole);

    /// <summary>
    /// Gets comprehensive security metrics for elite monitoring
    /// </summary>
    Task<EliteSecurityMetrics> GetSecurityMetricsAsync();

    /// <summary>
    /// Validates request security with detailed analysis
    /// </summary>
    Task<EliteSecurityValidationResult> ValidateRequestSecurityAsync(HttpContext context);

    /// <summary>
    /// Records security event for audit trail
    /// </summary>
    Task RecordSecurityEventAsync(string eventType, string details, bool isSuccessful);

    /// <summary>
    /// Validates FISMA compliance for current request
    /// </summary>
    Task<bool> ValidateFismaComplianceAsync(HttpContext context);

    /// <summary>
    /// Gets current threat detection score
    /// </summary>
    Task<double> GetThreatDetectionScoreAsync();

    /// <summary>
    /// Clears rate limiting entries for maintenance
    /// </summary>
    Task ClearRateLimitingAsync();
}
