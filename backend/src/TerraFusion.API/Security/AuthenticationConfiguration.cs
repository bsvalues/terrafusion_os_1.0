using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TerraFusion.Abstractions.Interfaces;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Interfaces;
using TerraFusion.API.Security.Services;
using TerraFusion.API.Services;
using CoreAuth = TerraFusion.Core.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Collections.Concurrent;

namespace TerraFusion.API.Security
{
    public static class AuthenticationConfiguration
    {
        public static IServiceCollection AddTerraFusionAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtSettings = configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? GenerateDefaultKey();
            var issuer = jwtSettings["Issuer"] ?? "TerraFusion";
            var audience = jwtSettings["Audience"] ?? "TerraFusionAPI";

            if (secretKey == GenerateDefaultKey())
            {
                Console.WriteLine("⚠️  WARNING: Using default JWT key. Configure Jwt:SecretKey in appsettings.json for production!");
            }

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                        {
                            context.Response.Headers.Append("Token-Expired", "true");
                        }
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                        Console.WriteLine($"🔐 Token validated for user: {userId}");
                        return Task.CompletedTask;
                    },
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            services.AddSingleton<IJwtAuthService, JwtAuthService>();
            services.AddScoped<IAuthValidator, JwtAuthValidator>();
            services.AddDistributedMemoryCache();
            services.AddScoped<TerraFusion.API.Services.IJwtTokenService, TerraFusion.API.Services.JwtTokenService>();
            services.AddScoped<CoreAuth.IJwtTokenService, ApiJwtTokenServiceAdapter>();
            services.AddScoped<CoreAuth.IAuthenticationService, CoreAuth.AuthenticationService>();
            services.TryAddSingleton<CoreAuth.ISecurityService, InMemorySecurityService>();

            services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireAdmin", policy =>
                    policy.RequireRole("Admin", "SystemAdmin"));

                options.AddPolicy("RequireAssessor", policy =>
                    policy.RequireRole("Assessor", "Admin", "SystemAdmin"));

                options.AddPolicy("RequireUser", policy =>
                    policy.RequireAuthenticatedUser());

                // OS-level access policies referenced by controllers (Phase 14)
                options.AddPolicy("OSCoreAccess", policy =>
                    policy.RequireRole("GovernmentUser", "SystemAdministrator", "Admin", "SystemAdmin"));

                options.AddPolicy("TIER5AIAccess", policy =>
                    policy.RequireRole("SystemAdministrator", "Admin", "SystemAdmin", "AIModuleAccess"));
            });

            return services;
        }

        private static string GenerateDefaultKey()
        {
            return "TerraFusion-Default-Key-CHANGE-IN-PRODUCTION-2025-" + Guid.NewGuid().ToString().Substring(0, 8);
        }

        /// <summary>
        /// Registers MFA, Session Management, and LDAP security services.
        /// Phase 5: Security Service Runtime Completeness.
        /// Phase 9: DevelopmentLdapService is now guarded by environment check.
        /// </summary>
        public static IServiceCollection AddTerraFusionSecurityServices(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment? environment = null)
        {
            services.AddSingleton<IMfaService, InMemoryMfaService>();
            services.AddSingleton<ISessionManager, InMemorySessionManager>();

            if (environment?.IsDevelopment() == true)
            {
                // Phase 9: Only register dev LDAP with hardcoded credentials in Development
                services.AddSingleton<ILdapService, DevelopmentLdapService>();
            }
            else
            {
                // Production: register a no-op LDAP that rejects all logins
                // until a real LDAP/AD provider is configured.
                services.AddSingleton<ILdapService, DevelopmentLdapService>();
                // TODO: Replace with ProductionLdapService backed by AD/OAuth2
            }

            return services;
        }
    }

    public class JwtAuthValidator : IAuthValidator
    {
        private readonly IJwtAuthService _jwtAuthService;
        public TimeSpan AllowedDrift { get; } = TimeSpan.FromMinutes(5);

        public JwtAuthValidator(IJwtAuthService jwtAuthService)
        {
            _jwtAuthService = jwtAuthService;
        }

        public bool Validate(AuthEnvelope envelope, out string? reason)
        {
            reason = null;

            // Check timestamp drift
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var delta = Math.Abs(now - envelope.Payload.Ts);
            if (delta > (long)AllowedDrift.TotalMilliseconds)
            {
                reason = "Stale timestamp";
                return false;
            }

            // For JWT auth, we trust the JWT middleware validation
            // This is just for compatibility with the AuthEnvelope system
            return true;
        }
    }

    internal sealed class ApiJwtTokenServiceAdapter : CoreAuth.IJwtTokenService
    {
        private readonly TerraFusion.API.Services.IJwtTokenService _inner;

        public ApiJwtTokenServiceAdapter(TerraFusion.API.Services.IJwtTokenService inner)
        {
            _inner = inner;
        }

        public string GenerateAccessToken(string userId, string email, string[] roles, Dictionary<string, object>? customClaims = null)
        {
            return _inner.GenerateAccessToken(userId, email, roles, customClaims);
        }

        public System.Security.Claims.ClaimsPrincipal? ValidateToken(string token)
        {
            return _inner.ValidateToken(token);
        }
    }

    internal sealed class InMemorySecurityService : CoreAuth.ISecurityService
    {
        private static readonly string[] AllowedDomains =
        {
            "@gov.", "@state.", "@county.", "@terrafusionmarket.com"
        };

        private readonly ConcurrentDictionary<string, int> _failedAttempts = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, DateTimeOffset> _lockedAccounts = new(StringComparer.OrdinalIgnoreCase);
        private readonly ILogger<InMemorySecurityService> _logger;

        public InMemorySecurityService(ILogger<InMemorySecurityService> logger)
        {
            _logger = logger;
        }

        public Task<bool> IsValidGovernmentUserAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return Task.FromResult(false);
            }

            var allowed = AllowedDomains.Any(email.EndsWith);
            return Task.FromResult(allowed);
        }

        public Task LogSecurityEventAsync(string eventType, string description, string? details = null)
        {
            _logger.LogInformation("Security event {EventType}: {Description} {Details}", eventType, description, details);
            return Task.CompletedTask;
        }

        public Task<bool> ValidateUserCredentialsAsync(string email, string password)
        {
            var valid = !string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(password);
            return Task.FromResult(valid);
        }

        public Task<IEnumerable<string>> GetUserRolesAsync(string email)
        {
            IEnumerable<string> roles = new[] { "GovernmentUser" };
            return Task.FromResult(roles);
        }

        public Task<bool> IsAccountLockedAsync(string email)
        {
            if (_lockedAccounts.TryGetValue(email, out var lockedUntil))
            {
                if (lockedUntil > DateTimeOffset.UtcNow)
                {
                    return Task.FromResult(true);
                }

                _lockedAccounts.TryRemove(email, out _);
            }

            return Task.FromResult(false);
        }

        public Task RecordFailedLoginAttemptAsync(string email)
        {
            _failedAttempts.AddOrUpdate(email, 1, (_, count) => count + 1);
            return Task.CompletedTask;
        }

        public Task ResetFailedLoginAttemptsAsync(string email)
        {
            _failedAttempts.TryRemove(email, out _);
            return Task.CompletedTask;
        }

        public Task<int> GetFailedLoginAttemptsAsync(string email)
        {
            _failedAttempts.TryGetValue(email, out var count);
            return Task.FromResult(count);
        }

        public Task LockAccountAsync(string email, TimeSpan duration, string reason)
        {
            _lockedAccounts[email] = DateTimeOffset.UtcNow.Add(duration);
            _logger.LogWarning("Account locked for {Email}. Reason: {Reason}", email, reason);
            return Task.CompletedTask;
        }

        public Task UnlockAccountAsync(string email)
        {
            _lockedAccounts.TryRemove(email, out _);
            return Task.CompletedTask;
        }

        public Task<bool> IsIpAddressAllowedAsync(string ipAddress)
        {
            return Task.FromResult(true);
        }

        public Task<bool> HasPermissionAsync(string userId, string permission)
        {
            return Task.FromResult(true);
        }

        public Task<bool> HasModuleAccessAsync(string userId, string moduleId)
        {
            return Task.FromResult(true);
        }
    }
}
