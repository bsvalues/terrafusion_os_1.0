using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Security;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IJwtAuthService _jwtAuthService;
        private readonly ILogger<AuthController> _logger;
        private readonly IConfiguration _configuration;
        private readonly ISecureConfigurationService _secureConfig;

        public AuthController(
            IJwtAuthService jwtAuthService, 
            ILogger<AuthController> logger, 
            IConfiguration configuration,
            ISecureConfigurationService secureConfig)
        {
            _jwtAuthService = jwtAuthService;
            _logger = logger;
            _configuration = configuration;
            _secureConfig = secureConfig;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            _logger.LogInformation($"Login attempt for user: {request.Username}");

            var (isValid, userId, email, roles) = await ValidateCredentials(request.Username, request.Password);

            if (!isValid)
            {
                _logger.LogWarning($"Failed login attempt for user: {request.Username}");
                return Unauthorized(new { message = "Invalid username or password" });
            }

            var token = _jwtAuthService.GenerateToken(userId, email, roles);
            var refreshToken = GenerateRefreshToken();

            _logger.LogInformation($"Successful login for user: {request.Username}");

            return Ok(new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresIn = 3600,
                UserId = userId,
                Email = email,
                Roles = roles
            });
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var principal = _jwtAuthService.ValidateToken(request.Token);
            
            if (principal == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var roles = new List<string> { "Admin" };

            var newToken = _jwtAuthService.GenerateToken(userId, email, roles);
            var newRefreshToken = GenerateRefreshToken();

            return Ok(new LoginResponse
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                ExpiresIn = 3600,
                UserId = userId,
                Email = email,
                Roles = roles
            });
        }

        [HttpPost("validate")]
        [Authorize]
        public async Task<IActionResult> ValidateToken()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

            return Ok(new
            {
                valid = true,
                userId,
                email,
                timestamp = DateTime.UtcNow
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation($"User logged out: {userId}");

            return Ok(new { message = "Logged out successfully" });
        }

        private async Task<(bool isValid, string userId, string email, List<string> roles)> ValidateCredentials(string username, string password)
        {
            await Task.Delay(100);

            try
            {
                // Load credentials from secure configuration (Azure Key Vault or fallback to config)
                var adminPassword = await _secureConfig.GetSecretAsync("Authentication--AdminPassword");
                var assessorPassword = await _secureConfig.GetSecretAsync("Authentication--AssessorPassword");
                var demoPassword = await _secureConfig.GetSecretAsync("Authentication--DemoPassword");

                // Check credentials against standard usernames
                if (username == "admin" && !string.IsNullOrEmpty(adminPassword) && password == adminPassword)
                {
                    _logger.LogInformation("Admin user authenticated successfully");
                    return (true, "admin-001", "admin@terrafusion.gov", new List<string> { "Admin", "SystemAdmin" });
                }
                else if (username == "assessor" && !string.IsNullOrEmpty(assessorPassword) && password == assessorPassword)
                {
                    _logger.LogInformation("Assessor user authenticated successfully");
                    return (true, "assessor-001", "assessor@bentoncounty.gov", new List<string> { "Assessor", "User" });
                }
                else if (username == "demo" && !string.IsNullOrEmpty(demoPassword) && password == demoPassword)
                {
                    _logger.LogInformation("Demo user authenticated successfully");
                    return (true, "demo-001", "demo@terrafusion.com", new List<string> { "User" });
                }

                _logger.LogWarning("Authentication failed for username: {Username}", username);
                return (false, null, null, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during credential validation for username: {Username}", username);
                return (false, null, null, null);
            }
        }

        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("/", "_")
                .Replace("+", "-")
                .Replace("=", "");
        }
    }

    public class LoginRequest
    {
        [Required]
        public required string Username { get; set; }

        [Required]
        public required string Password { get; set; }
    }

    public class RefreshTokenRequest
    {
        [Required]
        public required string Token { get; set; }

        [Required]
        public required string RefreshToken { get; set; }
    }

    public class LoginResponse
    {
        public required string Token { get; set; }
        public required string RefreshToken { get; set; }
        public int ExpiresIn { get; set; }
        public required string UserId { get; set; }
        public required string Email { get; set; }
        public required List<string> Roles { get; set; }
    }
}
