using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.API.Security;
using TerraFusion.API.Services;

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

            services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireAdmin", policy =>
                    policy.RequireRole("Admin", "SystemAdmin"));

                options.AddPolicy("RequireAssessor", policy =>
                    policy.RequireRole("Assessor", "Admin", "SystemAdmin"));

                options.AddPolicy("RequireUser", policy =>
                    policy.RequireAuthenticatedUser());
            });

            return services;
        }

        private static string GenerateDefaultKey()
        {
            return "TerraFusion-Default-Key-CHANGE-IN-PRODUCTION-2025-" + Guid.NewGuid().ToString().Substring(0, 8);
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
}
