using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Tests.Infrastructure;
using TerraFusion.Core.Security.Lockout;
using TerraFusion.Core.Security.TokenRevocation;
using TerraFusion.Core.Security.PasswordHistory;
using Xunit;

namespace TerraFusion.API.Tests.Security;

/// <summary>
/// Phase 4 Sprint 2: Integration tests for persistent auth security stores.
/// Tests Redis lockout, token revocation, and SQL password history stores
/// using the in-memory test infrastructure (MemoryDistributedCache + SQLite).
/// </summary>
public class AuthSecurityStoreTests : IClassFixture<ApiWebAppFactory>
{
    private readonly ApiWebAppFactory _factory;

    public AuthSecurityStoreTests(ApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // === LOCKOUT STORE TESTS ===

    [Fact]
    public async Task LockoutStore_IncrementFailedAttempts_ReturnsIncrementedCount()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ILockoutStore>();
        var userId = Guid.NewGuid();

        var count1 = await store.IncrementFailedAttemptsAsync(userId);
        var count2 = await store.IncrementFailedAttemptsAsync(userId);

        Assert.Equal(1, count1);
        Assert.Equal(2, count2);
    }

    [Fact]
    public async Task LockoutStore_ResetFailedAttempts_ClearsCount()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ILockoutStore>();
        var userId = Guid.NewGuid();

        await store.IncrementFailedAttemptsAsync(userId);
        await store.IncrementFailedAttemptsAsync(userId);
        await store.ResetFailedAttemptsAsync(userId);

        var count = await store.GetFailedAttemptsAsync(userId);
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task LockoutStore_SetLockout_IsLockedOutReturnsTrue()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ILockoutStore>();
        var userId = Guid.NewGuid();

        await store.SetLockoutAsync(userId, DateTime.UtcNow.AddMinutes(15));

        Assert.True(await store.IsLockedOutAsync(userId));
    }

    [Fact]
    public async Task LockoutStore_ExpiredLockout_IsLockedOutReturnsFalse()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ILockoutStore>();
        var userId = Guid.NewGuid();

        await store.SetLockoutAsync(userId, DateTime.UtcNow.AddSeconds(-1));

        Assert.False(await store.IsLockedOutAsync(userId));
    }

    [Fact]
    public async Task LockoutStore_NoLockout_IsLockedOutReturnsFalse()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ILockoutStore>();

        Assert.False(await store.IsLockedOutAsync(Guid.NewGuid()));
    }

    // === TOKEN REVOCATION STORE TESTS ===

    [Fact]
    public async Task TokenRevocationStore_RevokeToken_IsRevokedReturnsTrue()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ITokenRevocationStore>();
        var jti = Guid.NewGuid().ToString();

        await store.RevokeTokenAsync(jti);

        Assert.True(await store.IsTokenRevokedAsync(jti));
    }

    [Fact]
    public async Task TokenRevocationStore_UnrevokedToken_IsRevokedReturnsFalse()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ITokenRevocationStore>();

        Assert.False(await store.IsTokenRevokedAsync(Guid.NewGuid().ToString()));
    }

    [Fact]
    public async Task TokenRevocationStore_NullJti_IsRevokedReturnsFalse()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ITokenRevocationStore>();

        Assert.False(await store.IsTokenRevokedAsync(null!));
        Assert.False(await store.IsTokenRevokedAsync(""));
    }

    [Fact]
    public async Task TokenRevocationStore_RevokeAllUserTokens_SetsTimestamp()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ITokenRevocationStore>();
        var userId = "test-user-123";

        await store.RevokeAllUserTokensAsync(userId);

        var timestamp = await store.GetUserRevocationTimestampAsync(userId);
        Assert.NotNull(timestamp);
        Assert.True(timestamp.Value <= DateTime.UtcNow);
        Assert.True(timestamp.Value > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task TokenRevocationStore_NoRevocation_TimestampIsNull()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<ITokenRevocationStore>();

        var timestamp = await store.GetUserRevocationTimestampAsync("nonexistent-user");
        Assert.Null(timestamp);
    }

    // === PASSWORD HISTORY STORE TESTS ===

    [Fact]
    public async Task PasswordHistoryStore_AddAndRetrieve_ReturnsHash()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IPasswordHistoryStore>();
        var userId = Guid.NewGuid();
        var hash = "AQAAAAIAAYag-test-hash-1";

        await store.AddPasswordHashAsync(userId, hash);
        var recent = await store.GetRecentPasswordHashesAsync(userId, 5);

        Assert.Single(recent);
        Assert.Equal(hash, recent[0]);
    }

    [Fact]
    public async Task PasswordHistoryStore_IsHashInHistory_ReturnsTrueForExistingHash()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IPasswordHistoryStore>();
        var userId = Guid.NewGuid();
        var hash = "AQAAAAIAAYag-test-hash-2";

        await store.AddPasswordHashAsync(userId, hash);

        Assert.True(await store.IsHashInHistoryAsync(userId, hash));
    }

    [Fact]
    public async Task PasswordHistoryStore_IsHashInHistory_ReturnsFalseForNewHash()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IPasswordHistoryStore>();
        var userId = Guid.NewGuid();

        await store.AddPasswordHashAsync(userId, "old-hash");

        Assert.False(await store.IsHashInHistoryAsync(userId, "new-hash"));
    }

    [Fact]
    public async Task PasswordHistoryStore_RecentHashes_OrderedByMostRecent()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IPasswordHistoryStore>();
        var userId = Guid.NewGuid();

        await store.AddPasswordHashAsync(userId, "hash-1");
        await store.AddPasswordHashAsync(userId, "hash-2");
        await store.AddPasswordHashAsync(userId, "hash-3");

        var recent = await store.GetRecentPasswordHashesAsync(userId, 2);

        Assert.Equal(2, recent.Count);
        Assert.Equal("hash-3", recent[0]);
        Assert.Equal("hash-2", recent[1]);
    }

    [Fact]
    public async Task PasswordHistoryStore_EmptyHistory_ReturnsEmptyList()
    {
        using var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IPasswordHistoryStore>();

        var recent = await store.GetRecentPasswordHashesAsync(Guid.NewGuid(), 5);
        Assert.Empty(recent);
    }
}
