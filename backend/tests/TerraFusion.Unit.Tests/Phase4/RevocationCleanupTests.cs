using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase4;

[Trait("Phase", "4")]
[Trait("Component", "TokenRevocation")]
[Trait("Category", "Security")]
public sealed class RevocationCleanupTests
{
    [Fact]
    public async Task ExpiredRevocations_AreRemoved()
    {
        var cache = new InMemoryDistributedCache();
        var nowUtc = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc);

        SeedBlacklist(cache, "expired-jti", nowUtc.AddMinutes(-10));
        SeedBlacklist(cache, "active-jti", nowUtc.AddMinutes(30));

        var sut = CreateSut(cache);

        var removed = await InvokeCleanupAsync(sut, nowUtc);

        removed.Should().Be(1, "cleanup should remove exactly the expired blacklist entry");
        (await cache.GetStringAsync("blacklist:expired-jti")).Should().BeNull();
        (await cache.GetStringAsync("blacklist:active-jti")).Should().NotBeNull();
    }

    [Fact]
    public async Task NonExpiredRevocations_ArePreserved()
    {
        var cache = new InMemoryDistributedCache();
        var nowUtc = new DateTime(2026, 2, 16, 0, 0, 0, DateTimeKind.Utc);

        SeedBlacklist(cache, "active-jti", nowUtc.AddMinutes(15));

        var sut = CreateSut(cache);

        var removedFirstRun = await InvokeCleanupAsync(sut, nowUtc);
        var removedSecondRun = await InvokeCleanupAsync(sut, nowUtc);

        removedFirstRun.Should().Be(0);
        removedSecondRun.Should().Be(0, "cleanup should be idempotent when no entries are expired");
        (await cache.GetStringAsync("blacklist:active-jti")).Should().NotBeNull();
    }

    private static AuthenticationService CreateSut(InMemoryDistributedCache cache)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "phase4-revocation-cleanup-secret-key-32",
                ["JwtSettings:Issuer"] = "TerraFusion.Test.Issuer",
                ["JwtSettings:Audience"] = "TerraFusion.Test.Audience"
            })
            .Build();

        var jwtService = new Mock<IJwtTokenService>(MockBehavior.Strict);
        jwtService
            .Setup(x => x.ValidateToken(It.IsAny<string>()))
            .Returns((System.Security.Claims.ClaimsPrincipal?)null);
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

    private static async Task<int> InvokeCleanupAsync(AuthenticationService sut, DateTime nowUtc)
    {
        var cleanupMethod = typeof(AuthenticationService).GetMethod(
            "CleanupExpiredBlacklistedTokensAsync",
            new[] { typeof(DateTime), typeof(CancellationToken) });

        cleanupMethod.Should().NotBeNull("Epic Z requires a callable cleanup API on AuthenticationService");

        var task = (Task<int>)cleanupMethod!.Invoke(sut, new object[] { nowUtc, CancellationToken.None })!;
        return await task.ConfigureAwait(false);
    }

    private static void SeedBlacklist(InMemoryDistributedCache cache, string jti, DateTime expiresAtUtc)
    {
        var payload = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["version"] = 1,
            ["jti"] = jti,
            ["revokedAt"] = expiresAtUtc.AddMinutes(-5),
            ["expiresAt"] = expiresAtUtc
        });

        cache.SetString($"blacklist:{jti}", payload);

        var currentIndexJson = cache.GetString("blacklist:index");
        var index = string.IsNullOrWhiteSpace(currentIndexJson)
            ? new Dictionary<string, DateTime>(StringComparer.Ordinal)
            : JsonSerializer.Deserialize<Dictionary<string, DateTime>>(currentIndexJson!)
              ?? new Dictionary<string, DateTime>(StringComparer.Ordinal);

        index[jti] = expiresAtUtc;
        cache.SetString("blacklist:index", JsonSerializer.Serialize(index));
    }

    private sealed class InMemoryDistributedCache : IDistributedCache
    {
        private readonly Dictionary<string, byte[]> _entries = new(StringComparer.Ordinal);

        public byte[]? Get(string key) => _entries.TryGetValue(key, out var value) ? value : null;

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
            => Task.FromResult(Get(key));

        public void Refresh(string key)
        {
            // no-op
        }

        public Task RefreshAsync(string key, CancellationToken token = default)
        {
            Refresh(key);
            return Task.CompletedTask;
        }

        public void Remove(string key)
        {
            _entries.Remove(key);
        }

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Remove(key);
            return Task.CompletedTask;
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
        {
            _entries[key] = value;
        }

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }
    }
}
