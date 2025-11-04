using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Security;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IJwtAuthService _jwtAuthService;
        private readonly ILogger<AuthController> _logger;
        private readonly IAuditLogger _auditLogger;

        public AuthController(IJwtAuthService jwtAuthService, ILogger<AuthController> logger, IAuditLogger auditLogger)
        {
            _jwtAuthService = jwtAuthService;
            _logger = logger;
            _auditLogger = auditLogger;
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
                // Log failed refresh attempt for security monitoring
                await _auditLogger.LogSecurityEventAsync("REFRESH_TOKEN_FAILED", "Invalid token provided", "ANONYMOUS");
                return Unauthorized(new { message = "Invalid token" });
            }

            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var roles = new List<string> { "Admin" };

            var newToken = _jwtAuthService.GenerateToken(userId ?? "", email ?? "", roles);
            var newRefreshToken = GenerateRefreshToken();

            // Log successful token refresh for audit compliance
            await _auditLogger.LogAuthenticationAsync(userId ?? "UNKNOWN", true, "Token refreshed successfully");

            return Ok(new LoginResponse
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                ExpiresIn = 3600,
                UserId = userId ?? "",
                Email = email ?? "",
                Roles = roles
            });
        }

        [HttpPost("validate")]
        [Authorize]
        public async Task<IActionResult> ValidateToken()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

            // Log token validation for FISMA audit compliance
            await _auditLogger.LogAuthenticationAsync(userId ?? "UNKNOWN", true, "Token validation successful");

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

            // FISMA compliance: Log logout event with audit trail
            await _auditLogger.LogUserActionAsync("LOGOUT", userId ?? "UNKNOWN", "User session terminated");
            _logger.LogInformation($"User logged out: {userId}");

            return Ok(new { message = "Logged out successfully" });
        }

        private async Task<(bool isValid, string userId, string email, List<string> roles)> ValidateCredentials(string username, string password)
        {
            await Task.Delay(100);

            if (username == "admin" && password == "TerraFusion2025!")
            {
                return (true, "admin-001", "admin@terrafusion.gov", new List<string> { "Admin", "SystemAdmin" });
            }
            else if (username == "assessor" && password == "Assessor2025!")
            {
                return (true, "assessor-001", "assessor@bentoncounty.gov", new List<string> { "Assessor", "User" });
            }
            else if (username == "demo" && password == "Demo2025!")
            {
                return (true, "demo-001", "demo@terrafusion.com", new List<string> { "User" });
            }

            return (false, "", "", new List<string>());
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
