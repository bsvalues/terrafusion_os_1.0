using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TerraFusion.API.Tests.Infrastructure;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests.Integration
{
    [Collection("Integration")]
    public class TokenRevocationFlowIntegrationTests : IClassFixture<ApiWebAppFactory>
    {
        private readonly ApiWebAppFactory _factory;

        public TokenRevocationFlowIntegrationTests(ApiWebAppFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "Phase4")]
        [Trait("Category", "Integration")]
        [Trait("Feature", "TokenRevocation")]
        public async Task RevokeEndpoint_RevokesToken_ForProtectedEndpoint()
        {
            var sharedCache = new SharedDistributedCache();
            using var factory = CreateFactoryWithSharedCache(_factory, sharedCache);
            var token = CreateRevocableJwt(_factory, $"phase4-jti-{Guid.NewGuid():N}");
            using var client = factory.CreateClient();

            var revokeResponse = await client.PostAsJsonAsync("/api/auth/revoke", new
            {
                token,
                reason = "phase4-integration-revoke"
            });

            revokeResponse.StatusCode.Should().NotBe(
                HttpStatusCode.NotFound,
                "the revocation endpoint must exist to enforce persistent token revocation");
            var revokeBody = await revokeResponse.Content.ReadAsStringAsync();
            revokeResponse.IsSuccessStatusCode.Should().BeTrue(
                $"expected /api/auth/revoke success but got {(int)revokeResponse.StatusCode} {revokeResponse.StatusCode}. Body: {revokeBody}");

            using var scope = factory.Services.CreateScope();
            var authService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
            var isRevoked = await authService.IsTokenBlacklistedAsync(token);
            isRevoked.Should().BeTrue("successful revoke must persist blacklist state for token validation");
        }

        [Fact]
        [Trait("Category", "Phase4")]
        [Trait("Category", "Integration")]
        [Trait("Feature", "TokenRevocation")]
        public async Task RevokedToken_RemainsRejected_AfterHostRestart()
        {
            var token = CreateRevocableJwt(_factory, $"phase4-jti-{Guid.NewGuid():N}");
            var sharedCache = new SharedDistributedCache();

            using (var initialFactory = new ApiWebAppFactory())
            using (var configuredInitialFactory = CreateFactoryWithSharedCache(initialFactory, sharedCache))
            using (var initialClient = configuredInitialFactory.CreateClient())
            {
                var revokeResponse = await initialClient.PostAsJsonAsync("/api/auth/revoke", new
                {
                    token,
                    reason = "phase4-restart-simulation"
                });

                revokeResponse.StatusCode.Should().NotBe(
                    HttpStatusCode.NotFound,
                    "revocation route must exist prior to restart simulation");
                var revokeBody = await revokeResponse.Content.ReadAsStringAsync();
                revokeResponse.IsSuccessStatusCode.Should().BeTrue(
                    $"expected /api/auth/revoke success before restart but got {(int)revokeResponse.StatusCode} {revokeResponse.StatusCode}. Body: {revokeBody}");
            }

            using (var restartedFactory = new ApiWebAppFactory())
            using (var configuredRestartedFactory = CreateFactoryWithSharedCache(restartedFactory, sharedCache))
            {
                using var scope = configuredRestartedFactory.Services.CreateScope();
                var authService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
                var isRevokedAfterRestart = await authService.IsTokenBlacklistedAsync(token);
                isRevokedAfterRestart.Should().BeTrue("revocation must survive host restart via durable persistence");
            }
        }

        private static string CreateRevocableJwt(ApiWebAppFactory factory, string jti)
        {
            using var scope = factory.Services.CreateScope();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            var secret = config["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("Missing JwtSettings:SecretKey");
            var issuer = config["JwtSettings:Issuer"] ?? throw new InvalidOperationException("Missing JwtSettings:Issuer");
            var audience = config["JwtSettings:Audience"] ?? throw new InvalidOperationException("Missing JwtSettings:Audience");

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: new List<Claim>
                {
                    new("sub", "phase4-user"),
                    new("email", "phase4-user@gov."),
                    new("jti", jti),
                    new("role", "GovernmentUser")
                },
                notBefore: DateTime.UtcNow.AddMinutes(-1),
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: signingCredentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static WebApplicationFactory<TerraFusion.API.Program> CreateFactoryWithSharedCache(
            ApiWebAppFactory baseFactory,
            IDistributedCache sharedCache)
        {
            return baseFactory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureTestServices(services =>
                {
                    services.RemoveAll<IDistributedCache>();
                    services.AddSingleton(sharedCache);
                });
            });
        }

        private sealed class SharedDistributedCache : IDistributedCache
        {
            private readonly Dictionary<string, CacheEntry> _entries = new(StringComparer.Ordinal);
            private readonly object _sync = new();

            public byte[]? Get(string key)
            {
                lock (_sync)
                {
                    if (!TryGetValue(key, out var value))
                    {
                        return null;
                    }

                    return value;
                }
            }

            public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
                => Task.FromResult(Get(key));

            public void Refresh(string key)
            {
                lock (_sync)
                {
                    TryGetValue(key, out _);
                }
            }

            public Task RefreshAsync(string key, CancellationToken token = default)
            {
                Refresh(key);
                return Task.CompletedTask;
            }

            public void Remove(string key)
            {
                lock (_sync)
                {
                    _entries.Remove(key);
                }
            }

            public Task RemoveAsync(string key, CancellationToken token = default)
            {
                Remove(key);
                return Task.CompletedTask;
            }

            public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
            {
                var expiresAt = options.AbsoluteExpirationRelativeToNow.HasValue
                    ? DateTimeOffset.UtcNow.Add(options.AbsoluteExpirationRelativeToNow.Value)
                    : options.AbsoluteExpiration;

                lock (_sync)
                {
                    _entries[key] = new CacheEntry(value, expiresAt);
                }
            }

            public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
            {
                Set(key, value, options);
                return Task.CompletedTask;
            }

            private bool TryGetValue(string key, out byte[] value)
            {
                if (_entries.TryGetValue(key, out var entry))
                {
                    if (!entry.ExpiresAt.HasValue || entry.ExpiresAt.Value > DateTimeOffset.UtcNow)
                    {
                        value = entry.Value;
                        return true;
                    }

                    _entries.Remove(key);
                }

                value = Array.Empty<byte>();
                return false;
            }

            private readonly record struct CacheEntry(byte[] Value, DateTimeOffset? ExpiresAt);
        }
    }
}
