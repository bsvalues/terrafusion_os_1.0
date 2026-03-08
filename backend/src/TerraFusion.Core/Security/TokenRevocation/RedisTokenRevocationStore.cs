using Microsoft.Extensions.Caching.Distributed;

namespace TerraFusion.Core.Security.TokenRevocation;

/// <summary>
/// Phase 4 Sprint 2: Redis-backed token revocation store
/// Uses IDistributedCache for token revocation persistence
/// </summary>
public class RedisTokenRevocationStore : ITokenRevocationStore
{
    private readonly IDistributedCache _cache;
    private const string REVOKED_PREFIX = "auth:revoked:";
    private const string USER_REVOKED_PREFIX = "auth:user-revoked:";
    private static readonly TimeSpan DEFAULT_TTL = TimeSpan.FromHours(9); // Slightly longer than max token lifetime (8h)

    public RedisTokenRevocationStore(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<bool> IsTokenRevokedAsync(string jti)
    {
        if (string.IsNullOrEmpty(jti)) return false;
        var value = await _cache.GetStringAsync($"{REVOKED_PREFIX}{jti}");
        return !string.IsNullOrEmpty(value);
    }

    public async Task RevokeTokenAsync(string jti, TimeSpan? ttl = null)
    {
        if (string.IsNullOrEmpty(jti)) return;
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl ?? DEFAULT_TTL
        };
        await _cache.SetStringAsync($"{REVOKED_PREFIX}{jti}", "1", options);
    }

    public async Task RevokeAllUserTokensAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return;
        var timestamp = DateTime.UtcNow.ToString("O");
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = DEFAULT_TTL
        };
        await _cache.SetStringAsync($"{USER_REVOKED_PREFIX}{userId}", timestamp, options);
    }

    public async Task<DateTime?> GetUserRevocationTimestampAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return null;
        var value = await _cache.GetStringAsync($"{USER_REVOKED_PREFIX}{userId}");
        if (string.IsNullOrEmpty(value)) return null;
        return DateTime.TryParse(value, out var dt) ? dt : null;
    }
}
