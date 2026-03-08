namespace TerraFusion.Core.Security.TokenRevocation;

/// <summary>
/// Phase 4 Sprint 2: Token revocation store interface
/// Persistent storage for revoked JWT tokens (survives app restart)
/// </summary>
public interface ITokenRevocationStore
{
    /// <summary>Check if a JWT (by jti claim) has been revoked</summary>
    Task<bool> IsTokenRevokedAsync(string jti);

    /// <summary>Revoke a specific token by jti. TTL = remaining token lifetime.</summary>
    Task RevokeTokenAsync(string jti, TimeSpan? ttl = null);

    /// <summary>Revoke all tokens for a user (by storing a revocation timestamp)</summary>
    Task RevokeAllUserTokensAsync(string userId);

    /// <summary>Check if all tokens issued before a certain time for a user are revoked</summary>
    Task<DateTime?> GetUserRevocationTimestampAsync(string userId);
}
