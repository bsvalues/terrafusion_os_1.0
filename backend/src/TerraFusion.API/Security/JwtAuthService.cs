using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace TerraFusion.API.Security
{
    public interface IJwtAuthService
    {
        string GenerateToken(string userId, string email, IEnumerable<string> roles);
        ClaimsPrincipal? ValidateToken(string token);
        Task<bool> ValidateAsync(string token);
    }

    public class JwtAuthService : IJwtAuthService
    {
        /// <summary>
        /// Sentinel prefix used to detect when no JwtSettings:SecretKey is configured.
        /// Phase 9: Fixed — previously GenerateDefaultKey() used Guid.NewGuid() making
        /// the equality check always false (warning never fired).
        /// </summary>
        private const string DefaultKeyPrefix = "TerraFusion-Default-Key-CHANGE-IN-PRODUCTION-";

        private readonly IConfiguration _configuration;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly string _secretKey;
        private readonly bool _usingDefaultKey;
        private readonly int _expirationMinutes;

        public JwtAuthService(IConfiguration configuration)
        {
            _configuration = configuration;
            _issuer = _configuration["JwtSettings:Issuer"] ?? "TerraFusion";
            _audience = _configuration["JwtSettings:Audience"] ?? "TerraFusionAPI";

            var configuredKey = _configuration["JwtSettings:SecretKey"];
            _usingDefaultKey = string.IsNullOrEmpty(configuredKey);
            _secretKey = configuredKey ?? GenerateDefaultKey();
            _expirationMinutes = int.Parse(_configuration["JwtSettings:ExpirationMinutes"] ?? "60");

            if (_usingDefaultKey)
            {
                Console.WriteLine("⚠️  WARNING: No JwtSettings:SecretKey configured — using a random default key. " +
                    "Tokens will NOT survive app restarts. Set JwtSettings:SecretKey in appsettings.json for production!");
            }
        }

        private static string GenerateDefaultKey()
        {
            return DefaultKeyPrefix + Guid.NewGuid().ToString();
        }

        public string GenerateToken(string userId, string email, IEnumerable<string> roles)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(_expirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = GetValidationParameters();

            try
            {
                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                return principal;
            }
            catch (Exception)
            {
                return null; // Government-grade: Explicit null return for invalid tokens
            }
        }

        public async Task<bool> ValidateAsync(string token)
        {
            return await Task.Run(() => ValidateToken(token) != null);
        }

        private TokenValidationParameters GetValidationParameters()
        {
            return new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
                ClockSkew = TimeSpan.Zero
            };
        }
    }
}
