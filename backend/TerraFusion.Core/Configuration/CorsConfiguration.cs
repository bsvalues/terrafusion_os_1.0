using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;

namespace TerraFusion.Core.Configuration;

/// <summary>
/// Production-ready CORS configuration for government security compliance
/// Implements strict origin control with environment-specific policies
/// </summary>
public static class CorsConfiguration
{
    public const string PRODUCTION_POLICY = "TerraFusionProductionPolicy";
    public const string DEVELOPMENT_POLICY = "TerraFusionDevelopmentPolicy";
    public const string STAGING_POLICY = "TerraFusionStagingPolicy";
    public const string GOVERNMENT_POLICY = "TerraFusionGovernmentPolicy";

    public static void ConfigureCors(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.AddCors(options =>
        {
            // Production Policy - Strictest Security
            options.AddPolicy(PRODUCTION_POLICY, policy =>
            {
                var allowedOrigins = GetAllowedOrigins(configuration, "Production");
                
                policy.WithOrigins(allowedOrigins)
                      .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                      .WithHeaders(
                          "Content-Type",
                          "Authorization",
                          "X-Requested-With",
                          "X-API-Key",
                          "X-Request-ID",
                          "X-Correlation-ID",
                          "Cache-Control",
                          "Pragma"
                      )
                      .AllowCredentials()
                      .SetPreflightMaxAge(TimeSpan.FromMinutes(10))
                      .SetIsOriginAllowed(origin => false); // Strict origin checking
            });

            // Government Policy - Maximum Security for .gov domains
            options.AddPolicy(GOVERNMENT_POLICY, policy =>
            {
                var govOrigins = GetGovernmentOrigins(configuration);
                
                policy.WithOrigins(govOrigins)
                      .WithMethods("GET", "POST", "PUT", "PATCH", "OPTIONS") // No DELETE for safety
                      .WithHeaders(
                          "Content-Type",
                          "Authorization",
                          "X-Requested-With",
                          "X-API-Key",
                          "X-Request-ID",
                          "X-Government-Auth",
                          "X-Security-Token"
                      )
                      .AllowCredentials()
                      .SetPreflightMaxAge(TimeSpan.FromMinutes(5)) // Shorter cache for security
                      .SetIsOriginAllowed(origin => false);
            });

            // Staging Policy - Controlled Testing Environment
            options.AddPolicy(STAGING_POLICY, policy =>
            {
                var stagingOrigins = GetAllowedOrigins(configuration, "Staging");
                
                policy.WithOrigins(stagingOrigins)
                      .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                      .WithHeaders(
                          "Content-Type",
                          "Authorization",
                          "X-Requested-With",
                          "X-API-Key",
                          "X-Request-ID",
                          "X-Test-Mode"
                      )
                      .AllowCredentials()
                      .SetPreflightMaxAge(TimeSpan.FromMinutes(15));
            });

            // Development Policy - Flexible for Local Development
            options.AddPolicy(DEVELOPMENT_POLICY, policy =>
            {
                if (environment.IsDevelopment())
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .SetPreflightMaxAge(TimeSpan.FromHours(1));
                }
                else
                {
                    // Even in development, be restrictive in non-dev environments
                    var devOrigins = new[]
                    {
                        "http://localhost:3000",
                        "http://localhost:3001",
                        "http://localhost:5000",
                        "http://localhost:5001",
                        "https://localhost:3000",
                        "https://localhost:3001",
                        "https://localhost:5000",
                        "https://localhost:5001"
                    };
                    
                    policy.WithOrigins(devOrigins)
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                }
            });
        });
    }

    private static string[] GetAllowedOrigins(IConfiguration configuration, string environment)
    {
        var configSection = configuration.GetSection($"Cors:{environment}:AllowedOrigins");
        var origins = configSection.Get<string[]>();
        
        if (origins == null || origins.Length == 0)
        {
            // Fallback to default production origins
            return environment.ToLower() switch
            {
                "production" => new[]
                {
                    "https://terrafusion.gov",
                    "https://www.terrafusion.gov",
                    "https://api.terrafusion.gov",
                    "https://admin.terrafusion.gov"
                },
                "staging" => new[]
                {
                    "https://staging.terrafusion.gov",
                    "https://test.terrafusion.gov",
                    "https://demo.terrafusion.gov"
                },
                _ => new[]
                {
                    "http://localhost:3000",
                    "https://localhost:3000"
                }
            };
        }
        
        return origins;
    }

    private static string[] GetGovernmentOrigins(IConfiguration configuration)
    {
        var configSection = configuration.GetSection("Cors:Government:AllowedOrigins");
        var origins = configSection.Get<string[]>();
        
        if (origins == null || origins.Length == 0)
        {
            // Default government origins
            return new[]
            {
                "https://county.gov",
                "https://state.gov",
                "https://terrafusion.gov",
                "https://*.county.gov", // Wildcard for county subdomains
                "https://*.state.gov"   // Wildcard for state subdomains
            };
        }
        
        return origins;
    }

    public static string GetPolicyName(IHostEnvironment environment, bool isGovernmentRequest = false)
    {
        if (isGovernmentRequest)
        {
            return GOVERNMENT_POLICY;
        }
        
        return environment.EnvironmentName.ToLower() switch
        {
            "development" => DEVELOPMENT_POLICY,
            "staging" => STAGING_POLICY,
            "production" => PRODUCTION_POLICY,
            _ => PRODUCTION_POLICY // Default to most restrictive
        };
    }
}

/// <summary>
/// Middleware for dynamic CORS policy selection based on request characteristics
/// </summary>
public class DynamicCorsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DynamicCorsMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public DynamicCorsMiddleware(
        RequestDelegate next,
        ILogger<DynamicCorsMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var origin = context.Request.Headers["Origin"].FirstOrDefault();
        var isGovernmentRequest = IsGovernmentOrigin(origin);
        var isHighSecurity = RequiresHighSecurity(context);
        
        // Log CORS requests for monitoring
        if (!string.IsNullOrEmpty(origin))
        {
            _logger.LogInformation(
                "CORS request from origin: {Origin}, Government: {IsGov}, HighSecurity: {HighSec}",
                origin, isGovernmentRequest, isHighSecurity
            );
        }

        // Add security headers based on request type
        if (isGovernmentRequest || isHighSecurity)
        {
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        await _next(context);
    }

    private static bool IsGovernmentOrigin(string? origin)
    {
        if (string.IsNullOrEmpty(origin))
            return false;

        var govDomains = new[] { ".gov", ".mil", "county.gov", "state.gov", "city.gov" };
        return govDomains.Any(domain => origin.Contains(domain, StringComparison.OrdinalIgnoreCase));
    }

    private static bool RequiresHighSecurity(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower();
        var sensitiveEndpoints = new[] 
        {
            "/api/auth",
            "/api/admin",
            "/api/properties/assessment",
            "/api/users",
            "/api/counties/sensitive"
        };
        
        return sensitiveEndpoints.Any(endpoint => path?.StartsWith(endpoint) == true);
    }
}

/// <summary>
/// CORS policy validator for runtime security checks
/// </summary>
public class CorsSecurityValidator
{
    private readonly ILogger<CorsSecurityValidator> _logger;
    private readonly IConfiguration _configuration;

    public CorsSecurityValidator(
        ILogger<CorsSecurityValidator> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public bool ValidateOrigin(string origin, string policyName)
    {
        try
        {
            // Validate against allowed origins for the policy
            var allowedOrigins = GetAllowedOriginsForPolicy(policyName);
            
            if (allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            {
                return true;
            }

            // Check for wildcard matches
            foreach (var allowedOrigin in allowedOrigins)
            {
                if (allowedOrigin.Contains("*") && MatchesWildcard(origin, allowedOrigin))
                {
                    return true;
                }
            }

            _logger.LogWarning("CORS validation failed for origin: {Origin} with policy: {Policy}", origin, policyName);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating CORS origin: {Origin}", origin);
            return false;
        }
    }

    private string[] GetAllowedOriginsForPolicy(string policyName)
    {
        var configKey = policyName switch
        {
            CorsConfiguration.PRODUCTION_POLICY => "Cors:Production:AllowedOrigins",
            CorsConfiguration.STAGING_POLICY => "Cors:Staging:AllowedOrigins",
            CorsConfiguration.GOVERNMENT_POLICY => "Cors:Government:AllowedOrigins",
            _ => "Cors:Development:AllowedOrigins"
        };
        
        return _configuration.GetSection(configKey).Get<string[]>() ?? Array.Empty<string>();
    }

    private static bool MatchesWildcard(string origin, string pattern)
    {
        // Simple wildcard matching for subdomain patterns like "*.example.com"
        if (!pattern.Contains("*"))
            return false;
            
        var regexPattern = pattern.Replace("*", ".*").Replace(".", "\\.");
        return System.Text.RegularExpressions.Regex.IsMatch(origin, regexPattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }
}