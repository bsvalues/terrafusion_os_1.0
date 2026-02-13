using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace TerraFusion.Core.Security.Lockout;

/// <summary>
/// Phase 4 Sprint 1: Redis-backed account lockout store
/// Implements ILockoutStore using IDistributedCache (Redis)
/// NIST 800-63B AC-2(4) progressive lockout tracking
/// </summary>
public class RedisLockoutStore : ILockoutStore
{
    private readonly IDistributedCache _cache;
    private const string LOCKOUT_PREFIX = "auth:lockout:";
    private const int LOCKOUT_TTL_HOURS = 2; // Max TTL for lockout keys

    public RedisLockoutStore(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<int> GetFailedAttemptsAsync(Guid userId)
    {
        var state = await GetLockoutStateAsync(userId);
        return state?.FailedAttempts ?? 0;
    }

    public async Task<int> IncrementFailedAttemptsAsync(Guid userId)
    {
        var state = await GetLockoutStateAsync(userId) ?? new LockoutState();
        state.FailedAttempts++;
        state.LastAttemptAt = DateTime.UtcNow;
        
        await SetLockoutStateAsync(userId, state);
        return state.FailedAttempts;
    }

    public async Task ResetFailedAttemptsAsync(Guid userId)
    {
        var key = GetKey(userId);
        await _cache.RemoveAsync(key);
    }

    public async Task<DateTime?> GetLockoutExpiryAsync(Guid userId)
    {
        var state = await GetLockoutStateAsync(userId);
        return state?.LockedUntil;
    }

    public async Task SetLockoutAsync(Guid userId, DateTime expiresAt)
    {
        var state = await GetLockoutStateAsync(userId) ?? new LockoutState();
        state.LockedUntil = expiresAt;
        
        await SetLockoutStateAsync(userId, state);
    }

    public async Task<bool> IsLockedOutAsync(Guid userId)
    {
        var expiry = await GetLockoutExpiryAsync(userId);
        return expiry.HasValue && expiry.Value > DateTime.UtcNow;
    }

    // Private helpers
    private string GetKey(Guid userId) => $"{LOCKOUT_PREFIX}{userId}";

    private async Task<LockoutState?> GetLockoutStateAsync(Guid userId)
    {
        var key = GetKey(userId);
        var json = await _cache.GetStringAsync(key);
        
        if (string.IsNullOrEmpty(json))
            return null;
        
        return JsonSerializer.Deserialize<LockoutState>(json);
    }

    private async Task SetLockoutStateAsync(Guid userId, LockoutState state)
    {
        var key = GetKey(userId);
        var json = JsonSerializer.Serialize(state);
        
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(LOCKOUT_TTL_HOURS)
        };
        
        await _cache.SetStringAsync(key, json, options);
    }

    private class LockoutState
    {
        public int FailedAttempts { get; set; }
        public DateTime? LockedUntil { get; set; }
        public DateTime? LastAttemptAt { get; set; }
    }
}
