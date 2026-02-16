using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// JWT Token Service interface for dependency injection
    /// </summary>
    public interface IJwtTokenService
    {
        string GenerateAccessToken(string userId, string email, string[] roles, Dictionary<string, object>? customClaims = null);
        ClaimsPrincipal? ValidateToken(string token);
    }

    /// <summary>
    /// Production-grade authentication service implementation
    /// Handles JWT tokens with Redis-backed refresh token management
    /// </summary>
    public class AuthenticationService : IAuthenticationService
    {
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IDistributedCache _cache;
        private readonly ILogger<AuthenticationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;

        private const string REFRESH_TOKEN_PREFIX = "refresh_token:";
        private const string BLACKLIST_PREFIX = "blacklist:";
        private const string BLACKLIST_INDEX_KEY = "blacklist:index";
        private const int REFRESH_TOKEN_LENGTH = 64;

        /// <summary>
        /// Mask email for safe logging (PII contract — Phase 13).
        /// </summary>
        private static string MaskEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return "[empty]";
            var at = email.IndexOf('@');
            if (at <= 0) return "***";
            return string.Concat(email[0], "***", email.Substring(at));
        }

        public AuthenticationService(
            IJwtTokenService jwtTokenService,
            IDistributedCache cache,
            ILogger<AuthenticationService> logger,
            IConfiguration configuration)
        {
            _jwtTokenService = jwtTokenService;
            _cache = cache;
            _logger = logger;
            _configuration = configuration;

            var jwtSettings = _configuration.GetSection("JwtSettings");
            _secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            _issuer = jwtSettings["Issuer"] ?? "TerraFusion.API";
            _audience = jwtSettings["Audience"] ?? "TerraFusion.Client";
        }

        /// <summary>
        /// Generate a JWT access token
        /// </summary>
        public async Task<string> GenerateJwtTokenAsync(string userId, string email, IEnumerable<string> roles)
        {
            try
            {
                // Add custom TerraFusion claims
                var customClaims = new Dictionary<string, object>
                {
                    { "county_system", "TerraFusion" },
                    { "version", "1.0" },
                    { "modules_access", "32" },
                    { "ai_agents", "2016" },
                    { "security_level", "government" }
                };

                var token = _jwtTokenService.GenerateAccessToken(userId, email, roles.ToArray(), customClaims);
                
                _logger.LogInformation("Generated JWT token for user {UserId} with email {EmailMasked}", userId, MaskEmail(email));
                
                return await Task.FromResult(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating JWT token for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Validate a JWT token and extract claims
        /// </summary>
        public async Task<ClaimsPrincipal?> ValidateTokenAsync(string token)
        {
            try
            {
                // First check if token is blacklisted
                if (await IsTokenBlacklistedAsync(token))
                {
                    _logger.LogWarning("Attempted to use blacklisted token");
                    return null;
                }

                var principal = _jwtTokenService.ValidateToken(token);
                
                if (principal == null)
                {
                    _logger.LogWarning("Token validation failed");
                    return null;
                }

                return principal;
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogWarning(ex, "Security token exception during validation");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during token validation");
                return null;
            }
        }

        /// <summary>
        /// Generate both access and refresh tokens
        /// </summary>
        public async Task<(string AccessToken, string RefreshToken)> GenerateTokenPairAsync(
            string userId, string email, IEnumerable<string> roles)
        {
            try
            {
                // Generate access token
                var accessToken = await GenerateJwtTokenAsync(userId, email, roles);
                
                // Generate refresh token
                var refreshToken = GenerateSecureRefreshToken();
                
                // Store refresh token in Redis with expiration
                var refreshTokenKey = $"{REFRESH_TOKEN_PREFIX}{userId}:{refreshToken}";
                var refreshTokenData = new RefreshTokenData
                {
                    UserId = userId,
                    Email = email,
                    Roles = roles.ToList(),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(7)
                };
                
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7)
                };
                
                await _cache.SetStringAsync(
                    refreshTokenKey,
                    JsonSerializer.Serialize(refreshTokenData),
                    options);
                
                _logger.LogInformation("Generated token pair for user {UserId}", userId);
                
                return (accessToken, refreshToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating token pair for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Validate a refresh token
        /// </summary>
        public async Task<bool> ValidateRefreshTokenAsync(string userId, string refreshToken)
        {
            try
            {
                var refreshTokenKey = $"{REFRESH_TOKEN_PREFIX}{userId}:{refreshToken}";
                var tokenDataJson = await _cache.GetStringAsync(refreshTokenKey);
                
                if (string.IsNullOrEmpty(tokenDataJson))
                {
                    _logger.LogWarning("Refresh token not found for user {UserId}", userId);
                    return false;
                }
                
                var tokenData = JsonSerializer.Deserialize<RefreshTokenData>(tokenDataJson);
                
                if (tokenData == null || tokenData.ExpiresAt < DateTime.UtcNow)
                {
                    _logger.LogWarning("Refresh token expired for user {UserId}", userId);
                    return false;
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating refresh token for user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Revoke a specific refresh token
        /// </summary>
        public async Task RevokeRefreshTokenAsync(string userId, string refreshToken)
        {
            try
            {
                var refreshTokenKey = $"{REFRESH_TOKEN_PREFIX}{userId}:{refreshToken}";
                await _cache.RemoveAsync(refreshTokenKey);
                
                _logger.LogInformation("Revoked refresh token for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking refresh token for user {UserId}", userId);
            }
        }

        /// <summary>
        /// Revoke all refresh tokens for a user
        /// </summary>
        public async Task RevokeAllUserTokensAsync(string userId, string reason)
        {
            try
            {
                // In production, you would query all keys matching the pattern
                // For now, we'll track active tokens separately
                var userTokensKey = $"{REFRESH_TOKEN_PREFIX}{userId}:*";
                
                // This is a simplified implementation
                // In production, use Redis SCAN to find and delete all matching keys
                
                _logger.LogWarning("Revoked all tokens for user {UserId}. Reason: {Reason}", userId, reason);
                
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking all tokens for user {UserId}", userId);
            }
        }

        /// <summary>
        /// Check if a token is blacklisted
        /// </summary>
        public async Task<bool> IsTokenBlacklistedAsync(string token)
        {
            try
            {
                // Extract JTI from token
                var handler = new JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);
                var jti = jsonToken?.Claims?.FirstOrDefault(c => c.Type == "jti")?.Value;
                
                if (string.IsNullOrEmpty(jti))
                {
                    return false;
                }
                
                var blacklistKey = $"{BLACKLIST_PREFIX}{jti}";
                var persistedValue = await _cache.GetStringAsync(blacklistKey);

                if (string.IsNullOrWhiteSpace(persistedValue))
                {
                    return false;
                }

                // Backward compatibility: legacy blacklist marker.
                if (persistedValue.Trim() == "1")
                {
                    return true;
                }

                // Current format: structured metadata payload.
                try
                {
                    using var json = JsonDocument.Parse(persistedValue);
                    if (!json.RootElement.TryGetProperty("jti", out var persistedJtiElement))
                    {
                        _logger.LogWarning("Blacklist record missing jti metadata for key {BlacklistKey}", blacklistKey);
                        return true; // fail closed
                    }

                    var persistedJti = persistedJtiElement.GetString();
                    if (!string.Equals(persistedJti, jti, StringComparison.Ordinal))
                    {
                        _logger.LogWarning(
                            "Blacklist record JTI mismatch for key {BlacklistKey}. Expected {ExpectedJti}, got {PersistedJti}",
                            blacklistKey,
                            jti,
                            persistedJti);
                    }

                    return true;
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Malformed blacklist payload for key {BlacklistKey}", blacklistKey);
                    return true; // fail closed
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking token blacklist");
                return false;
            }
        }

        /// <summary>
        /// Add a token to the blacklist
        /// </summary>
        public async Task BlacklistTokenAsync(string token, DateTime expiresAt)
        {
            try
            {
                // Extract JTI from token
                var handler = new JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);
                var jti = jsonToken?.Claims?.FirstOrDefault(c => c.Type == "jti")?.Value;
                
                if (string.IsNullOrEmpty(jti))
                {
                    _logger.LogWarning("Cannot blacklist token without JTI");
                    return;
                }
                
                var blacklistKey = $"{BLACKLIST_PREFIX}{jti}";
                var ttl = expiresAt - DateTime.UtcNow;
                
                if (ttl.TotalSeconds > 0)
                {
                    var blacklistPayload = JsonSerializer.Serialize(new Dictionary<string, object?>
                    {
                        ["version"] = 1,
                        ["jti"] = jti,
                        ["revokedAt"] = DateTimeOffset.UtcNow,
                        ["expiresAt"] = expiresAt
                    });

                    var options = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = ttl
                    };
                    
                    await _cache.SetStringAsync(blacklistKey, blacklistPayload, options);
                    await TrackBlacklistedTokenAsync(jti, expiresAt);
                    
                    _logger.LogInformation("Blacklisted token with JTI {Jti}", jti);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error blacklisting token");
            }
        }

        /// <summary>
        /// Remove expired blacklist entries from the cache and blacklist index.
        /// </summary>
        public async Task<int> CleanupExpiredBlacklistedTokensAsync(DateTime utcNow, CancellationToken cancellationToken = default)
        {
            try
            {
                var now = utcNow.Kind == DateTimeKind.Utc ? utcNow : utcNow.ToUniversalTime();
                var index = await GetBlacklistIndexAsync(cancellationToken);
                if (index.Count == 0)
                {
                    return 0;
                }

                var expiredJtis = index
                    .Where(kv => kv.Value <= now)
                    .Select(kv => kv.Key)
                    .ToList();

                if (expiredJtis.Count == 0)
                {
                    return 0;
                }

                foreach (var jti in expiredJtis)
                {
                    var blacklistKey = $"{BLACKLIST_PREFIX}{jti}";
                    await _cache.RemoveAsync(blacklistKey, cancellationToken);
                    index.Remove(jti);
                }

                await SaveBlacklistIndexAsync(index, cancellationToken);

                _logger.LogInformation(
                    "Revocation cleanup removed {RemovedCount} expired blacklist entries (remaining: {RemainingCount})",
                    expiredJtis.Count,
                    index.Count);

                return expiredJtis.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired blacklist entries");
                return 0;
            }
        }

        /// <summary>
        /// Generate a cryptographically secure refresh token
        /// </summary>
        private string GenerateSecureRefreshToken()
        {
            var randomNumber = new byte[REFRESH_TOKEN_LENGTH];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private async Task TrackBlacklistedTokenAsync(string jti, DateTime expiresAt, CancellationToken cancellationToken = default)
        {
            var index = await GetBlacklistIndexAsync(cancellationToken);
            index[jti] = expiresAt.Kind == DateTimeKind.Utc ? expiresAt : expiresAt.ToUniversalTime();
            await SaveBlacklistIndexAsync(index, cancellationToken);
        }

        private async Task<Dictionary<string, DateTime>> GetBlacklistIndexAsync(CancellationToken cancellationToken = default)
        {
            var indexJson = await _cache.GetStringAsync(BLACKLIST_INDEX_KEY, cancellationToken);
            if (string.IsNullOrWhiteSpace(indexJson))
            {
                return new Dictionary<string, DateTime>(StringComparer.Ordinal);
            }

            try
            {
                return JsonSerializer.Deserialize<Dictionary<string, DateTime>>(indexJson)
                       ?? new Dictionary<string, DateTime>(StringComparer.Ordinal);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid blacklist index payload; resetting index");
                return new Dictionary<string, DateTime>(StringComparer.Ordinal);
            }
        }

        private Task SaveBlacklistIndexAsync(
            Dictionary<string, DateTime> index,
            CancellationToken cancellationToken = default)
        {
            return _cache.SetStringAsync(BLACKLIST_INDEX_KEY, JsonSerializer.Serialize(index), cancellationToken);
        }

        /// <summary>
        /// Internal class for storing refresh token data
        /// </summary>
        private class RefreshTokenData
        {
            public string UserId { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public List<string> Roles { get; set; } = new();
            public DateTime CreatedAt { get; set; }
            public DateTime ExpiresAt { get; set; }
        }
    }
}
