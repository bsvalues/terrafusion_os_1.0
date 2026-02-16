using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Tokens;
using Moq;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase4;

[Trait("Phase", "4")]
[Trait("Component", "TokenRevocation")]
[Trait("Category", "Security")]
public sealed class TokenRevocationPersistenceTests
{
    private const string JwtIssuer = "TerraFusion.Test.Issuer";
    private const string JwtAudience = "TerraFusion.Test.Audience";
    private const string JwtSecret = "phase4-token-revocation-test-secret-key-32";

    [Fact]
    public async Task RevokedToken_IsRejected_AfterServiceRestart()
    {
        var cache = new InMemoryDistributedCache();
        var token = BuildToken("user-restart", "jti-restart");

        var firstInstance = CreateSut(cache, tokenAccepted: true);
        await firstInstance.BlacklistTokenAsync(token, DateTime.UtcNow.AddMinutes(30));

        var restartedInstance = CreateSut(cache, tokenAccepted: true);
        var principal = await restartedInstance.ValidateTokenAsync(token);

        principal.Should().BeNull("revoked JTIs must remain rejected after a service restart/new DI container");
    }

    [Fact]
    public async Task RevokeToken_PersistsJti_AndIsQueryable()
    {
        var cache = new InMemoryDistributedCache();
        var token = BuildToken("user-query", "jti-query");
        var sut = CreateSut(cache, tokenAccepted: true);

        await sut.BlacklistTokenAsync(token, DateTime.UtcNow.AddMinutes(45));

        var jti = new JwtSecurityTokenHandler()
            .ReadJwtToken(token)
            .Claims
            .First(c => c.Type == "jti")
            .Value;

        var stored = await cache.GetStringAsync($"blacklist:{jti}");
        stored.Should().NotBeNullOrWhiteSpace("revocation record must be persisted for lookup by JTI");
        stored.Should().Contain("\"jti\"", "revocation record should store structured metadata");
        stored.Should().Contain("\"revokedAt\"", "revocation record should include revocation timestamp");
    }

    [Fact]
    public async Task NonRevokedToken_RemainsValid()
    {
        var cache = new InMemoryDistributedCache();
        var token = BuildToken("user-valid", "jti-valid");
        var sut = CreateSut(cache, tokenAccepted: true);

        var principal = await sut.ValidateTokenAsync(token);

        principal.Should().NotBeNull("non-revoked token validation semantics must not regress");
        principal!.FindFirst(ClaimTypes.NameIdentifier)!.Value.Should().Be("user-valid");
    }

    private static AuthenticationService CreateSut(InMemoryDistributedCache cache, bool tokenAccepted)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = JwtSecret,
                ["JwtSettings:Issuer"] = JwtIssuer,
                ["JwtSettings:Audience"] = JwtAudience
            })
            .Build();

        var principal = tokenAccepted
            ? new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, "user-valid") },
                authenticationType: "Bearer"))
            : null;

        var jwtService = new Mock<IJwtTokenService>(MockBehavior.Strict);
        jwtService
            .Setup(x => x.ValidateToken(It.IsAny<string>()))
            .Returns(principal);
        jwtService
            .Setup(x => x.GenerateAccessToken(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string[]>(),
                It.IsAny<Dictionary<string, object>?>()))
            .Returns("unused");

        return new AuthenticationService(
            jwtService.Object,
            cache,
            NullLogger<AuthenticationService>.Instance,
            configuration);
    }

    private static string BuildToken(string userId, string jti)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            claims: new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, $"{userId}@terrafusion.test"),
                new Claim("jti", jti)
            },
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private sealed class InMemoryDistributedCache : IDistributedCache
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
