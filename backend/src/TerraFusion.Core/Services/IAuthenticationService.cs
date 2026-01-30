using System.Security.Claims;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Core authentication service interface for TerraFusion OS
    /// Handles JWT token generation, validation, and refresh token management
    /// </summary>
    public interface IAuthenticationService
    {
        /// <summary>
        /// Generate a JWT access token for the specified user
        /// </summary>
        /// <param name="userId">Unique user identifier</param>
        /// <param name="email">User's email address</param>
        /// <param name="roles">User's assigned roles</param>
        /// <returns>JWT access token string</returns>
        Task<string> GenerateJwtTokenAsync(string userId, string email, IEnumerable<string> roles);

        /// <summary>
        /// Validate a JWT token and extract claims principal
        /// </summary>
        /// <param name="token">JWT token to validate</param>
        /// <returns>ClaimsPrincipal if valid, null otherwise</returns>
        Task<ClaimsPrincipal?> ValidateTokenAsync(string token);

        /// <summary>
        /// Generate both access and refresh tokens for a user
        /// </summary>
        /// <param name="userId">Unique user identifier</param>
        /// <param name="email">User's email address</param>
        /// <param name="roles">User's assigned roles</param>
        /// <returns>Tuple of access token and refresh token</returns>
        Task<(string AccessToken, string RefreshToken)> GenerateTokenPairAsync(string userId, string email, IEnumerable<string> roles);

        /// <summary>
        /// Validate a refresh token for a specific user
        /// </summary>
        /// <param name="userId">User identifier</param>
        /// <param name="refreshToken">Refresh token to validate</param>
        /// <returns>True if valid, false otherwise</returns>
        Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken);

        /// <summary>
        /// Revoke a refresh token (used during logout)
        /// </summary>
        /// <param name="userId">User identifier</param>
        /// <param name="refreshToken">Refresh token to revoke</param>
        Task RevokeRefreshTokenAsync(string userId, string refreshToken);

        /// <summary>
        /// Revoke all refresh tokens for a user (used for security events)
        /// </summary>
        /// <param name="userId">User identifier</param>
        /// <param name="reason">Reason for revocation</param>
        Task RevokeAllUserTokensAsync(string userId, string reason);

        /// <summary>
        /// Check if a token is blacklisted
        /// </summary>
        /// <param name="token">Token to check</param>
        /// <returns>True if blacklisted, false otherwise</returns>
        Task<bool> IsTokenBlacklistedAsync(string token);

        /// <summary>
        /// Add a token to the blacklist
        /// </summary>
        /// <param name="token">Token to blacklist</param>
        /// <param name="expiresAt">When the token naturally expires</param>
        Task BlacklistTokenAsync(string token, DateTime expiresAt);
    }
}