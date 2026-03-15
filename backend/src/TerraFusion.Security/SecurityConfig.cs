// TFT-185: Security Configuration
// Centralized security settings for CORS, JWT, rate limiting, and FISMA-HIGH compliance.

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace TerraFusion.Security;

/// <summary>
/// FISMA-HIGH compliance flags and settings.
/// </summary>
public sealed class FismaComplianceSettings
{
    /// <summary>Require HTTPS for all connections.</summary>
    public bool RequireHttps { get; set; } = true;

    /// <summary>Enable audit logging for all authentication events.</summary>
    public bool AuditAuthEvents { get; set; } = true;

    /// <summary>Maximum session duration in minutes.</summary>
    public int MaxSessionDurationMinutes { get; set; } = 480;

    /// <summary>Idle session timeout in minutes.</summary>
    public int IdleTimeoutMinutes { get; set; } = 30;

    /// <summary>Maximum failed login attempts before lockout.</summary>
    public int MaxFailedLoginAttempts { get; set; } = 5;

    /// <summary>Account lockout duration in minutes.</summary>
    public int LockoutDurationMinutes { get; set; } = 30;

    /// <summary>Minimum password length.</summary>
    public int MinPasswordLength { get; set; } = 14;

    /// <summary>Password complexity requirement (upper, lower, digit, special).</summary>
    public bool RequirePasswordComplexity { get; set; } = true;

    /// <summary>Enforce county data isolation at the query level.</summary>
    public bool EnforceCountyIsolation { get; set; } = true;
}

/// <summary>
/// JWT authentication settings.
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string Issuer { get; set; } = "TerraFusion";
    public string Audience { get; set; } = "TerraFusionServices";

    /// <summary>
    /// Reference key name for the signing secret. Resolved from configuration or key vault.
    /// Do NOT store the actual secret here in production.
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>Token expiration in minutes.</summary>
    public int ExpirationMinutes { get; set; } = 60;

    /// <summary>Refresh token expiration in days.</summary>
    public int RefreshTokenExpirationDays { get; set; } = 7;

    /// <summary>Clock skew tolerance in seconds.</summary>
    public int ClockSkewSeconds { get; set; } = 30;
}

/// <summary>
/// Rate limiting configuration.
/// </summary>
public sealed class RateLimitSettings
{
    public const string SectionName = "RateLimiting";

    /// <summary>Enable rate limiting.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Maximum requests per window per client.</summary>
    public int PermitLimit { get; set; } = 100;

    /// <summary>Time window in seconds.</summary>
    public int WindowSeconds { get; set; } = 60;

    /// <summary>Queue limit for excess requests.</summary>
    public int QueueLimit { get; set; } = 10;

    /// <summary>Segment rate limits by authenticated user.</summary>
    public bool SegmentByUser { get; set; } = true;

    /// <summary>Segment rate limits by county ID.</summary>
    public bool SegmentByCounty { get; set; } = true;
}

/// <summary>
/// CORS policy definitions.
/// </summary>
public sealed class CorsSettings
{
    public const string SectionName = "Cors";

    /// <summary>Allowed origins for the default policy.</summary>
    public string[] AllowedOrigins { get; set; } =
    {
        "http://localhost:3000",
        "http://localhost:5000",
        "https://localhost:3000",
        "https://localhost:5000",
    };

    /// <summary>Allowed HTTP methods.</summary>
    public string[] AllowedMethods { get; set; } =
    {
        "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS",
    };

    /// <summary>Allowed headers.</summary>
    public string[] AllowedHeaders { get; set; } =
    {
        "Authorization", "Content-Type", "X-County-Id",
        "X-Request-Id", "X-Correlation-Id",
    };

    /// <summary>Allow credentials (cookies, authorization headers).</summary>
    public bool AllowCredentials { get; set; } = true;

    /// <summary>Preflight cache duration in seconds.</summary>
    public int PreflightMaxAgeSeconds { get; set; } = 600;
}

/// <summary>
/// Central registration point for all security services and middleware configuration.
/// </summary>
public static class SecurityConfig
{
    public const string DefaultCorsPolicy = "TerraFusionCors";

    /// <summary>
    /// Registers JWT authentication, CORS, and binds security configuration sections.
    /// Call from Program.cs: <c>builder.Services.AddTerraFusionSecurity(builder.Configuration);</c>
    /// </summary>
    public static IServiceCollection AddTerraFusionSecurity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Bind configuration sections
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<RateLimitSettings>(configuration.GetSection(RateLimitSettings.SectionName));
        services.Configure<CorsSettings>(configuration.GetSection(CorsSettings.SectionName));
        services.Configure<FismaComplianceSettings>(configuration.GetSection("FismaCompliance"));

        // JWT Authentication
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
        var keyBytes = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);
        var signingKey = new SymmetricSecurityKey(keyBytes);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(jwtSettings.ClockSkewSeconds),
                RequireExpirationTime = true,
            };

            // Support SignalR token via query string
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;

                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }

                    return Task.CompletedTask;
                },
            };
        });

        // CORS
        var corsSettings = configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>() ?? new CorsSettings();

        services.AddCors(options =>
        {
            options.AddPolicy(DefaultCorsPolicy, policy =>
            {
                policy.WithOrigins(corsSettings.AllowedOrigins)
                      .WithMethods(corsSettings.AllowedMethods)
                      .WithHeaders(corsSettings.AllowedHeaders)
                      .SetPreflightMaxAge(TimeSpan.FromSeconds(corsSettings.PreflightMaxAgeSeconds));

                if (corsSettings.AllowCredentials)
                {
                    policy.AllowCredentials();
                }
            });
        });

        return services;
    }

    /// <summary>
    /// Applies security middleware to the pipeline in the correct order.
    /// Call from Program.cs: <c>app.UseTerraFusionSecurity();</c>
    /// </summary>
    public static IApplicationBuilder UseTerraFusionSecurity(this IApplicationBuilder app)
    {
        app.UseCors(DefaultCorsPolicy);
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }
}
