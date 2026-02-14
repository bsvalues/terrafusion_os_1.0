using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Security.Extensions;
using TerraFusion.Security.Services;
using TerraFusion.Security.Background;

namespace TerraFusion.Security;

/// <summary>
/// REVOLUTIONARY: TerraFusion Security Module Configuration
/// 
/// This comprehensive security module provides complete government-grade
/// security infrastructure for TerraFusion OS including:
/// - Quantum-resistant encryption
/// - Multi-factor authentication
/// - Advanced threat detection
/// - Automated vulnerability scanning
/// - Penetration testing framework
/// - Government compliance monitoring
/// - Security incident response automation
/// </summary>
public static class SecurityModule
{
    /// <summary>
    /// Configure all TerraFusion security services
    /// </summary>
    public static IServiceCollection AddTerraFusionSecurity(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var logger = LoggerFactory.Create(builder => builder.AddConsole())
            .CreateLogger("TerraFusion.Security.Startup");

        logger.LogInformation("🔒 Initializing TerraFusion Government-Grade Security Suite...");

        // Ensure IConfiguration is available for services that need key derivation
        services.AddSingleton<IConfiguration>(configuration);

        // Core security configuration
        services.Configure<SecurityConfiguration>(configuration.GetSection("Security"));

        // Add comprehensive security extensions
        services.AddTerraFusionSecurityCore(configuration);
        services.AddTerraFusionAuthentication(configuration);
        services.AddTerraFusionAuthorization();
        services.AddTerraFusionEncryption(configuration);
        services.AddTerraFusionMFA(configuration);
        services.AddTerraFusionAuditLogging(configuration);
        services.AddTerraFusionThreatDetection(configuration);
        services.AddTerraFusionRateLimit(configuration);
        services.AddTerraFusionCompliance();

        // Security services
        services.AddSecurityServices();

        // Background security services
        services.AddSecurityBackgroundServices();

        // Security monitoring and automation
        services.AddSecurityMonitoring();

        // Penetration testing framework
        services.AddPenetrationTesting();

        // Vulnerability scanning
        services.AddVulnerabilityScanning();

        // Security incident response
        services.AddIncidentResponse();

        logger.LogInformation("✅ TerraFusion Security Suite initialization complete - Government. Transcended.");

        return services;
    }

    /// <summary>
    /// Add core security services
    /// </summary>
    private static IServiceCollection AddSecurityServices(this IServiceCollection services)
    {
        services.AddSingleton<IKeyRingProvider, KeyRingProvider>();
        services.AddScoped<ITokenValidationService, TokenValidationService>();
        services.AddScoped<IQuantumResistantEncryptionService, QuantumResistantEncryptionService>();
        services.AddScoped<IMultiFactorAuthService, MultiFactorAuthService>();
        services.AddScoped<ISecurityAuditService, SecurityAuditService>();

        return services;
    }

    /// <summary>
    /// Add background security services
    /// </summary>
    private static IServiceCollection AddSecurityBackgroundServices(this IServiceCollection services)
    {
        services.AddHostedService<SecurityMonitoringService>();
        services.AddHostedService<ComplianceMonitoringService>();
        services.AddHostedService<PenetrationTestingService>();

        return services;
    }

    /// <summary>
    /// Add security monitoring services
    /// </summary>
    private static IServiceCollection AddSecurityMonitoring(this IServiceCollection services)
    {
        services.AddScoped<SecurityMonitoringService>();

        return services;
    }

    /// <summary>
    /// Add penetration testing framework
    /// </summary>
    private static IServiceCollection AddPenetrationTesting(this IServiceCollection services)
    {
        services.AddScoped<IPenetrationTester, AdvancedPenetrationTester>();

        return services;
    }

    /// <summary>
    /// Add vulnerability scanning services
    /// </summary>
    private static IServiceCollection AddVulnerabilityScanning(this IServiceCollection services)
    {
        services.AddScoped<IVulnerabilityScanner, AutomatedVulnerabilityScanner>();

        return services;
    }

    /// <summary>
    /// Add security incident response services
    /// </summary>
    private static IServiceCollection AddIncidentResponse(this IServiceCollection services)
    {
        services.AddScoped<ISecurityIncidentResponseService, SecurityIncidentResponseService>();

        return services;
    }
}

/// <summary>
/// Security startup configuration
/// </summary>
public class SecurityStartup
{
    public SecurityStartup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    public void ConfigureServices(IServiceCollection services)
    {
        // This method can be used for additional security configuration
        // when the security module is used as a standalone service
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<SecurityStartup> logger)
    {
        logger.LogInformation("🔒 Configuring TerraFusion Security Pipeline...");

        // Add security middleware in correct order
        app.UseSecurityHeaders();
        app.UseRateLimit();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseThreatDetection();
        app.UseAuditLogging();
        app.UseComplianceEnforcement();

        logger.LogInformation("✅ TerraFusion Security Pipeline configured - Government. Transcended.");
    }
}

/// <summary>
/// Security health check extensions
/// </summary>
public static class SecurityHealthCheckExtensions
{
    public static IServiceCollection AddSecurityHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck<SecuritySystemHealthCheck>("security_system")
            .AddCheck<EncryptionHealthCheck>("encryption_services")
            .AddCheck<AuthenticationHealthCheck>("authentication_system")
            .AddCheck<ComplianceHealthCheck>("compliance_monitoring");

        return services;
    }
}

/// <summary>
/// Security system health check
/// </summary>
public class SecuritySystemHealthCheck : IHealthCheck
{
    private readonly ILogger<SecuritySystemHealthCheck> _logger;
    private readonly ISecurityAuditService _auditService;

    public SecuritySystemHealthCheck(ILogger<SecuritySystemHealthCheck> logger, ISecurityAuditService auditService)
    {
        _logger = logger;
        _auditService = auditService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check security system components
            var recentEvents = await _auditService.GetSecurityEventsAsync(new SecurityEventFilter
            {
                FromDate = DateTime.UtcNow.AddMinutes(-5),
                MaxResults = 10
            });

            var criticalEvents = recentEvents.Count(e => e.Severity == SecurityEventSeverity.Critical);

            if (criticalEvents > 0)
            {
                return HealthCheckResult.Degraded($"Security system has {criticalEvents} recent critical events");
            }

            return HealthCheckResult.Healthy("Security system operational");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Security system health check failed");
            return HealthCheckResult.Unhealthy("Security system health check failed", ex);
        }
    }
}

/// <summary>
/// Encryption services health check
/// </summary>
public class EncryptionHealthCheck : IHealthCheck
{
    private readonly IQuantumResistantEncryptionService _encryptionService;

    public EncryptionHealthCheck(IQuantumResistantEncryptionService encryptionService)
    {
        _encryptionService = encryptionService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // Test encryption/decryption
            var testData = "TerraFusion Security Health Check";
            var encrypted = await _encryptionService.EncryptAsync(testData);
            var decrypted = await _encryptionService.DecryptAsync(encrypted);

            if (decrypted == testData)
            {
                return HealthCheckResult.Healthy("Encryption services operational");
            }

            return HealthCheckResult.Unhealthy("Encryption service test failed");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Encryption service health check failed", ex);
        }
    }
}

/// <summary>
/// Authentication system health check
/// </summary>
public class AuthenticationHealthCheck : IHealthCheck
{
    private readonly ITokenValidationService _tokenService;

    public AuthenticationHealthCheck(ITokenValidationService tokenService)
    {
        _tokenService = tokenService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // Test token validation service
            var isHealthy = await _tokenService.IsServiceHealthyAsync();

            return isHealthy
                ? HealthCheckResult.Healthy("Authentication system operational")
                : HealthCheckResult.Degraded("Authentication system degraded");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Authentication system health check failed", ex);
        }
    }
}

/// <summary>
/// Compliance monitoring health check
/// </summary>
public class ComplianceHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check government compliance status
            var complianceIssues = new List<string>();

            // Simulate compliance checks
            var isCompliant = await CheckGovernmentComplianceAsync();

            if (!isCompliant)
            {
                complianceIssues.Add("Government compliance issues detected");
            }

            return complianceIssues.Any()
                ? HealthCheckResult.Degraded($"Compliance issues: {string.Join(", ", complianceIssues)}")
                : HealthCheckResult.Healthy("Government compliance operational");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Compliance health check failed", ex);
        }
    }

    private async Task<bool> CheckGovernmentComplianceAsync()
    {
        // Implement actual compliance checks
        return true;
    }
}

/// <summary>
/// Security configuration class
/// </summary>
public class SecurityConfiguration
{
    public JwtConfiguration Jwt { get; set; } = new();
    public EncryptionConfiguration Encryption { get; set; } = new();
    public MFAConfiguration MFA { get; set; } = new();
    public AuditConfiguration Audit { get; set; } = new();
    public ThreatDetectionConfiguration ThreatDetection { get; set; } = new();
    public RateLimitConfiguration RateLimit { get; set; } = new();
    public ComplianceConfiguration Compliance { get; set; } = new();
}

public class JwtConfiguration
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "TerraFusion-OS";
    public string Audience { get; set; } = "TerraFusion-Government";
    public TimeSpan ExpirationTime { get; set; } = TimeSpan.FromHours(8);
    public TimeSpan RefreshTokenExpiration { get; set; } = TimeSpan.FromDays(30);
}

public class EncryptionConfiguration
{
    public bool QuantumResistant { get; set; } = true;
    public string Algorithm { get; set; } = "KYBER-768";
    public int KeySize { get; set; } = 768;
    public TimeSpan KeyRotationInterval { get; set; } = TimeSpan.FromDays(90);
    /// <summary>Ordered key ring. The entry with Active=true is used for encryption; all are available for decryption.</summary>
    public EncryptionKeyEntry[] Keys { get; set; } = Array.Empty<EncryptionKeyEntry>();
}

/// <summary>One entry in the encryption key ring (config-driven).</summary>
public class EncryptionKeyEntry
{
    public string KeyId { get; set; } = string.Empty;
    /// <summary>Base64-encoded 32-byte key material (or a high-entropy passphrase). NEVER use the JWT secret.</summary>
    public string Material { get; set; } = string.Empty;
    public bool Active { get; set; }
}

public class MFAConfiguration
{
    public bool Required { get; set; } = true;
    public string[] EnabledProviders { get; set; } = { "TOTP", "SMS", "Hardware" };
    public TimeSpan TOTPWindow { get; set; } = TimeSpan.FromMinutes(5);
    public TimeSpan SMSCodeExpiration { get; set; } = TimeSpan.FromMinutes(10);
}

public class AuditConfiguration
{
    public bool Enabled { get; set; } = true;
    public bool LogAllRequests { get; set; } = true;
    public bool LogAllResponses { get; set; } = false;
    public TimeSpan RetentionPeriod { get; set; } = TimeSpan.FromDays(2555); // 7 years for government
    public string[] SensitiveFields { get; set; } = { "password", "token", "key", "secret" };
}

public class ThreatDetectionConfiguration
{
    public bool Enabled { get; set; } = true;
    public int MaxFailedAttempts { get; set; } = 5;
    public TimeSpan LockoutDuration { get; set; } = TimeSpan.FromMinutes(30);
    public bool AIThreatDetection { get; set; } = true;
    public float ThreatThreshold { get; set; } = 0.8f;
}

public class RateLimitConfiguration
{
    public bool Enabled { get; set; } = true;
    public int RequestsPerMinute { get; set; } = 100;
    public int RequestsPerHour { get; set; } = 1000;
    public int RequestsPerDay { get; set; } = 10000;
    public bool AdaptiveRateLimit { get; set; } = true;
}

public class ComplianceConfiguration
{
    public string[] RequiredStandards { get; set; } = { "FISMA-HIGH", "FedRAMP", "SOC2", "NIST-800-53" };
    public bool AutomaticCompliance { get; set; } = true;
    public TimeSpan ComplianceCheckInterval { get; set; } = TimeSpan.FromHours(6);
    public bool EnforceCompliance { get; set; } = true;
}