using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace TerraFusion.API.Services
{
    /// <summary>
    /// Divine JWT Token Service - The Key to Your Kingdom
    /// Generates secure JWT tokens with refresh capability
    /// </summary>
    public interface IJwtTokenService
    {
        string GenerateAccessToken(string userId, string email, string[] roles, Dictionary<string, object>? customClaims = null);
        string GenerateRefreshToken();
        ClaimsPrincipal? ValidateToken(string token);
        (string AccessToken, string RefreshToken) GenerateTokenPair(string userId, string email, string[] roles);
    }

    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtTokenService> _logger;
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _expirationMinutes;
        private readonly int _refreshTokenExpirationDays;

        public JwtTokenService(IConfiguration configuration, ILogger<JwtTokenService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            
            // Load JWT settings with validation
            var jwtSettings = _configuration.GetSection("JwtSettings");
            _secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            _issuer = jwtSettings["Issuer"] ?? "TerraFusion.API";
            _audience = jwtSettings["Audience"] ?? "TerraFusion.Client";
            _expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");
            _refreshTokenExpirationDays = int.Parse(jwtSettings["RefreshTokenExpirationDays"] ?? "7");

            // Validate security requirements
            if (_secretKey.Length < 32)
            {
                throw new InvalidOperationException("JWT SecretKey must be at least 32 characters for production security");
            }
        }

        /// <summary>
        /// Generate a secure JWT access token with custom claims
        /// </summary>
        public string GenerateAccessToken(string userId, string email, string[] roles, Dictionary<string, object>? customClaims = null)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_secretKey);
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim("jti", Guid.NewGuid().ToString()), // JWT ID for tracking
                new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new Claim("terrafusion_version", "1.0"),
                new Claim("ai_agents", "2016"), // Your actual AI agent count!
                new Claim("modules", "32") // Your actual module count!
            };

            // Add roles
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Add custom claims for TerraFusion specifics
            if (customClaims != null)
            {
                foreach (var claim in customClaims)
                {
                    claims.Add(new Claim(claim.Key, claim.Value.ToString() ?? string.Empty));
                }
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_expirationMinutes),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                ),
                NotBefore = DateTime.UtcNow
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            _logger.LogInformation("Generated access token for user {UserId} with {RoleCount} roles", 
                userId, roles.Length);

            return tokenString;
        }

        /// <summary>
        /// Generate a cryptographically secure refresh token
        /// </summary>
        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            
            // Create a URL-safe base64 string
            return Convert.ToBase64String(randomNumber)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        /// <summary>
        /// Validate a JWT token and extract claims
        /// </summary>
        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_secretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                
                // Additional validation for algorithm
                if (validatedToken is JwtSecurityToken jwtToken &&
                    !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    _logger.LogWarning("Token validation failed: Invalid algorithm {Algorithm}", jwtToken.Header.Alg);
                    return null;
                }

                return principal;
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogWarning(ex, "Token validation failed");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during token validation");
                return null;
            }
        }

        /// <summary>
        /// Generate both access and refresh tokens as a pair
        /// </summary>
        public (string AccessToken, string RefreshToken) GenerateTokenPair(string userId, string email, string[] roles)
        {
            var accessToken = GenerateAccessToken(userId, email, roles);
            var refreshToken = GenerateRefreshToken();
            
            _logger.LogInformation("Generated token pair for user {UserId}", userId);
            
            return (accessToken, refreshToken);
        }
    }
}
