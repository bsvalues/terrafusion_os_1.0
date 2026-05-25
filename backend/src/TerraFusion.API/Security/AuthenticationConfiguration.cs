using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TerraFusion.Abstractions.Interfaces;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Interfaces;
using TerraFusion.API.Security.Services;
using TerraFusion.API.Services;
using TerraFusion.Data.Repositories;
using CoreAuth = TerraFusion.Core.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Security
{
    public static class AuthenticationConfiguration
    {
        public static IServiceCollection AddTerraFusionAuthentication(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment? environment = null)
        {
            var jwtSettings = configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"] ?? "TerraFusion";
            var audience = jwtSettings["Audience"] ?? "TerraFusionAPI";

            // PR-2 (Prometheus T3 #5): fail-fast in non-Development when JWT key is missing.
            // Previously a random "TerraFusion-Default-Key-..." key was synthesized at
            // startup with only a Console.WriteLine warning — producing a working-but-
            // forgeable JWT signer in any environment that hadn't been explicitly
            // configured. Production must throw; Development gets a long, fixed
            // padding key so local dev keeps working without env vars.
            var isDevelopment = environment?.IsDevelopment() ?? false;
            if (string.IsNullOrWhiteSpace(secretKey) && !isDevelopment)
            {
                throw new InvalidOperationException(
                    "JwtSettings:SecretKey is required in non-Development environments. " +
                    "Configure via env var JwtSettings__SecretKey or appsettings.{Env}.local.json.");
            }
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                // Dev-only fallback. 64+ chars to satisfy HS256 minimum.
                secretKey = "TerraFusion-Dev-Secret-Key-DEV-ONLY-NEVER-USE-IN-PROD-PADDING-XXXXXXXXXXXXXXXXXXXX";
                Console.WriteLine("⚠️  WARNING: Using Development JWT fallback key. NEVER use this in production.");
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

            services.TryAddSingleton(configuration);
            services.AddSingleton<IJwtAuthService, JwtAuthService>();
            services.AddScoped<IAuthValidator, JwtAuthValidator>();
            services.AddDistributedMemoryCache();
            services.AddScoped<TerraFusion.API.Services.IJwtTokenService, TerraFusion.API.Services.JwtTokenService>();
            services.AddScoped<CoreAuth.IJwtTokenService, ApiJwtTokenServiceAdapter>();
            services.AddScoped<CoreAuth.IAuthenticationService, CoreAuth.AuthenticationService>();
            services.AddScoped<DatabaseProvisionedSecurityService>();
            if (ConfiguredBootstrapSecurityService.HasBootstrapCredentials(configuration))
            {
                services.AddSingleton(provider =>
                    new ConfiguredBootstrapSecurityService(
                        configuration,
                        provider.GetRequiredService<ILogger<ConfiguredBootstrapSecurityService>>()));
            }
            services.TryAddSingleton<InMemorySecurityService>();
            services.TryAddScoped<LegacyProvisionedUserContextProvider>();
            services.TryAddScoped<CoreAuth.ISecurityService>(provider =>
                provider.GetService<DataDbContext>() is not null
                    ? provider.GetRequiredService<DatabaseProvisionedSecurityService>()
                    : (CoreAuth.ISecurityService?)provider.GetService<ConfiguredBootstrapSecurityService>()
                        ?? provider.GetRequiredService<InMemorySecurityService>());
            services.TryAddScoped<IProvisionedUserContextProvider>(provider =>
                provider.GetService<DataDbContext>() is not null
                    ? provider.GetRequiredService<DatabaseProvisionedSecurityService>()
                    : provider.GetRequiredService<LegacyProvisionedUserContextProvider>());
            services.AddHostedService<CoreAuth.RevocationCleanupBackgroundService>();

            services.AddAuthorization(options =>
            {
                // PR-2 (Prometheus T3 #1): require authentication by default.
                // Any controller without an explicit [Authorize] or [AllowAnonymous]
                // attribute now gets 401 instead of silently defaulting to anonymous.
                // Controllers that intentionally run anonymously (Workbench F/G/H,
                // FullCorpus, Doctrine*) must be tagged with [AllowAnonymous] explicitly.
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();

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

            // CX-18D: Enable dynamic permission policy resolution.
            // DynamicModulePolicyProvider resolves RequiresPermission_* and module:* policies.
            // PluginPermissionHandler enforces per-plugin permission checks via X-Plugin-Id header.
            // ModuleAccessHandler enforces module-level access via "perm" claims.
            services.AddSingleton<IAuthorizationPolicyProvider, DynamicModulePolicyProvider>();
            services.AddScoped<IAuthorizationHandler, PluginPermissionHandler>();
            services.AddScoped<IAuthorizationHandler, ModuleAccessHandler>();
            services.AddScoped<IPluginRepository, PluginRepository>();

            return services;
        }

        /// <summary>
        /// Registers MFA, Session Management, and LDAP security services.
        /// Phase 5: Security Service Runtime Completeness.
        /// Phase 9: DevelopmentLdapService is now guarded by environment check.
        /// PR-2 (Prometheus T3 #4): non-Development now registers
        /// <see cref="FailClosedLdapService"/> (throws on every method) instead
        /// of the in-memory dev stub, which previously was registered in BOTH
        /// branches despite a comment claiming "rejects all logins".
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
                // PR-2 (Prometheus T3 #4): fail-closed in non-Development. Every method
                // throws NotImplementedException so any code path that reaches LDAP in
                // prod surfaces loud instead of silently succeeding via dev stub.
                // TODO: Replace with ProductionLdapService backed by AD/OAuth2.
                services.AddSingleton<ILdapService, FailClosedLdapService>();
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

    internal sealed class ConfiguredBootstrapSecurityService : CoreAuth.ISecurityService
    {
        private static readonly string[] DefaultRoles =
        {
            "GovernmentUser",
            "Administrator",
            "FullSystemAccess"
        };

        private readonly string _email;
        private readonly string _password;
        private readonly string[] _roles;
        private readonly ConcurrentDictionary<string, int> _failedAttempts = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, DateTimeOffset> _lockedAccounts = new(StringComparer.OrdinalIgnoreCase);
        private readonly ILogger<ConfiguredBootstrapSecurityService> _logger;

        public ConfiguredBootstrapSecurityService(
            IConfiguration configuration,
            ILogger<ConfiguredBootstrapSecurityService> logger)
        {
            _email = ReadSetting(configuration, "Auth:Bootstrap:Email", "TERRAFUSION_BOOTSTRAP_EMAIL").Trim();
            _password = ReadSetting(configuration, "Auth:Bootstrap:Password", "TERRAFUSION_BOOTSTRAP_PASSWORD");
            _roles = ReadRoles(configuration);
            _logger = logger;
        }

        public static bool HasBootstrapCredentials(IConfiguration configuration)
        {
            return !string.IsNullOrWhiteSpace(ReadSetting(configuration, "Auth:Bootstrap:Email", "TERRAFUSION_BOOTSTRAP_EMAIL"))
                && !string.IsNullOrWhiteSpace(ReadSetting(configuration, "Auth:Bootstrap:Password", "TERRAFUSION_BOOTSTRAP_PASSWORD"));
        }

        public Task<bool> IsValidGovernmentUserAsync(string email)
        {
            return Task.FromResult(IsConfiguredUser(email));
        }

        public Task LogSecurityEventAsync(string eventType, string description, string? details = null)
        {
            _logger.LogInformation("Security event {EventType}: {Description} {Details}", eventType, description, details);
            return Task.CompletedTask;
        }

        public Task<bool> ValidateUserCredentialsAsync(string email, string password)
        {
            if (!IsConfiguredUser(email) || string.IsNullOrEmpty(password))
            {
                return Task.FromResult(false);
            }

            return Task.FromResult(FixedTimeEquals(password, _password));
        }

        public Task<IEnumerable<string>> GetUserRolesAsync(string email)
        {
            IEnumerable<string> roles = IsConfiguredUser(email) ? _roles : Array.Empty<string>();
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
            _logger.LogWarning("Account locked for configured bootstrap user hash {EmailHash}. Reason: {Reason}", email.GetHashCode(), reason);
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
            return Task.FromResult(IsConfiguredUser(userId) && HasElevatedRole());
        }

        public Task<bool> HasModuleAccessAsync(string userId, string moduleId)
        {
            return Task.FromResult(IsConfiguredUser(userId) && HasElevatedRole());
        }

        private bool IsConfiguredUser(string email)
        {
            return !string.IsNullOrWhiteSpace(email)
                && string.Equals(email.Trim(), _email, StringComparison.OrdinalIgnoreCase);
        }

        private bool HasElevatedRole()
        {
            return _roles.Any(role =>
                role.Equals("Administrator", StringComparison.OrdinalIgnoreCase)
                || role.Equals("Admin", StringComparison.OrdinalIgnoreCase)
                || role.Equals("SystemAdmin", StringComparison.OrdinalIgnoreCase)
                || role.Equals("SystemAdministrator", StringComparison.OrdinalIgnoreCase)
                || role.Equals("FullSystemAccess", StringComparison.OrdinalIgnoreCase));
        }

        private static string ReadSetting(IConfiguration configuration, string key, string envKey)
        {
            return configuration[key] ?? configuration[envKey] ?? string.Empty;
        }

        private static string[] ReadRoles(IConfiguration configuration)
        {
            var raw = ReadSetting(configuration, "Auth:Bootstrap:Roles", "TERRAFUSION_BOOTSTRAP_ROLES");
            if (string.IsNullOrWhiteSpace(raw))
            {
                return DefaultRoles;
            }

            var roles = raw
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            return roles.Length == 0 ? DefaultRoles : roles;
        }

        private static bool FixedTimeEquals(string provided, string expected)
        {
            var providedBytes = Encoding.UTF8.GetBytes(provided);
            var expectedBytes = Encoding.UTF8.GetBytes(expected);
            return providedBytes.Length == expectedBytes.Length
                && CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
        }
    }

    internal sealed class LegacyProvisionedUserContextProvider : IProvisionedUserContextProvider
    {
        private readonly CoreAuth.ISecurityService _securityService;
        private readonly IConfiguration _configuration;

        public LegacyProvisionedUserContextProvider(
            CoreAuth.ISecurityService securityService,
            IConfiguration configuration)
        {
            _securityService = securityService;
            _configuration = configuration;
        }

        public async Task<ProvisionedUserAuthContext?> GetProvisionedUserContextAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)
                || !await _securityService.IsValidGovernmentUserAsync(email))
            {
                return null;
            }

            var normalizedEmail = email.Trim();
            var roles = (await _securityService.GetUserRolesAsync(normalizedEmail))
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
            if (roles.Length == 0)
            {
                roles = ["GovernmentUser"];
            }

            return new ProvisionedUserAuthContext(
                CreateStableUserId(normalizedEmail),
                normalizedEmail,
                roles,
                Array.Empty<string>(),
                ReadCountyId(),
                ReadOptional("DefaultCounty:Name"),
                ReadOptional("DefaultCounty:State"),
                ReadOptional("DefaultCounty:FipsCode"));
        }

        public Task<bool> IsUserSessionValidAsync(Guid userId, string? sessionToken)
        {
            return Task.FromResult(!string.IsNullOrWhiteSpace(sessionToken));
        }

        public Task RecordUserSessionAsync(
            Guid userId,
            string sessionToken,
            string refreshToken,
            DateTime expiresAtUtc,
            string? ipAddress,
            string? userAgent)
        {
            return Task.CompletedTask;
        }

        private Guid? ReadCountyId()
        {
            var raw = ReadOptional("DefaultCounty:Id");
            return Guid.TryParse(raw, out var countyId) ? countyId : null;
        }

        private string? ReadOptional(string key)
        {
            var value = _configuration[key];
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static Guid CreateStableUserId(string email)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(email.ToUpperInvariant()));
            Span<byte> bytes = stackalloc byte[16];
            hash.AsSpan(0, 16).CopyTo(bytes);
            return new Guid(bytes);
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
            // PR-2 (Prometheus T3 #3): fail-closed default. Previously accepted any
            // non-empty email + password (silent allow-all). InMemorySecurityService
            // is the fallback registration (services.TryAddSingleton); a real
            // credential validator should replace it before any reliance is placed
            // on this method. Until then, every call is denied + warns.
            _logger.LogWarning(
                "InMemorySecurityService.ValidateUserCredentialsAsync called for email-hash {EmailHash}; " +
                "fail-closed default returning false. Register a real ISecurityService implementation.",
                email?.GetHashCode());
            return Task.FromResult(false);
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
            _logger.LogWarning("Account locked for {EmailHash}. Reason: {Reason}", email.GetHashCode(), reason);
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
            // PR-2 (Prometheus T3 #2): fail-closed default. Previously returned true
            // for every (userId, permission) tuple — silent allow-all that defeated
            // any caller that relied on this method as a real authorization check.
            // A real ISecurityService implementation should replace this before any
            // permission decision relies on it; until then, every call is denied.
            _logger.LogWarning(
                "InMemorySecurityService.HasPermissionAsync called for permission '{Permission}'; " +
                "fail-closed default returning false. Register a real ISecurityService implementation.",
                permission);
            return Task.FromResult(false);
        }

        public Task<bool> HasModuleAccessAsync(string userId, string moduleId)
        {
            // PR-2 (Prometheus T3 #2 sibling): same fail-closed treatment as
            // HasPermissionAsync. Module-access checks should go through a real
            // ISecurityService; the in-memory fallback denies and warns.
            _logger.LogWarning(
                "InMemorySecurityService.HasModuleAccessAsync called for module '{ModuleId}'; " +
                "fail-closed default returning false. Register a real ISecurityService implementation.",
                moduleId);
            return Task.FromResult(false);
        }
    }
}
