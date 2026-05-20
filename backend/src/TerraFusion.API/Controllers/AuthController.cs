using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("ApiPolicy")]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationService _authService;
    private readonly ISecurityService _securityService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthenticationService authService,
        ISecurityService securityService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _securityService = securityService;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var email = request.Email.Trim();

            // Validate government user
            if (!await _securityService.IsValidGovernmentUserAsync(email))
            {
                await _securityService.LogSecurityEventAsync("INVALID_LOGIN_ATTEMPT", 
                    $"Non-government user attempted login: {email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var isValidCredentials = await _securityService.ValidateUserCredentialsAsync(email, request.Password);
            
            if (!isValidCredentials)
            {
                await _securityService.LogSecurityEventAsync("FAILED_LOGIN_ATTEMPT", 
                    $"Failed login attempt for user: {email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Generate JWT token
            var roles = await _securityService.GetUserRolesAsync(email);
            var token = await _authService.GenerateJwtTokenAsync(
                Guid.NewGuid().ToString(),
                email,
                roles);

            await _securityService.LogSecurityEventAsync("SUCCESSFUL_LOGIN", 
                $"User successfully logged in: {email}");

            return Ok(new LoginResponse
            {
                Token = token,
                Email = email,
                Roles = roles.ToArray(),
                ExpiresAt = DateTime.UtcNow.AddHours(8)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user {Email}", request.Email);
            await _securityService.LogSecurityEventAsync("LOGIN_ERROR", 
                $"Error during login for user: {request.Email}", ex.Message);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("access-policy")]
    [AllowAnonymous]
    public IActionResult GetAccessPolicy()
    {
        return Ok(new
        {
            signupMode = "provisioned_access_only",
            publicSignupEnabled = false,
            accessRequestUrl = "mailto:support@terrafusionmarket.com?subject=TerraFusion%20OS%20Provisioned%20Access%20Request",
            supportEmail = "support@terrafusionmarket.com",
            message = "TerraFusion access is provisioned by an administrator. Public self-signup is disabled. Request provisioned access from support@terrafusionmarket.com."
        });
    }

    [HttpPost("refresh")]
    [Authorize]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var principal = await _authService.ValidateTokenAsync(request.Token);
            if (principal == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var email = principal.FindFirst("email")?.Value;
            var userId = principal.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Invalid token claims" });
            }

            var roles = await _securityService.GetUserRolesAsync(email);
            var newToken = await _authService.GenerateJwtTokenAsync(userId, email, roles);

            await _securityService.LogSecurityEventAsync("TOKEN_REFRESH", 
                $"Token refreshed for user: {email}");

            return Ok(new LoginResponse
            {
                Token = newToken,
                Email = email,
                Roles = roles.ToArray(),
                ExpiresAt = DateTime.UtcNow.AddHours(8)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var email = User.FindFirst("email")?.Value;
            
            // In production, invalidate the token by adding to blacklist
            await _securityService.LogSecurityEventAsync("USER_LOGOUT", 
                $"User logged out: {email}");

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("revoke")]
    [AllowAnonymous]
    public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequest(new { message = "Token is required" });
            }

            if (!TryParseRevocationMetadata(request.Token, out var jti, out var expiresAtUtc))
            {
                return BadRequest(new { message = "Token must be a valid JWT containing jti and exp claims" });
            }

            await _authService.BlacklistTokenAsync(request.Token, expiresAtUtc);
            try
            {
                await _securityService.LogSecurityEventAsync(
                    "TOKEN_REVOKED",
                    $"Token revoked for JTI: {jti} (expires: {expiresAtUtc:O})");
            }
            catch (Exception logEx)
            {
                _logger.LogWarning(logEx, "Security event logging failed during token revoke for JTI {Jti}", jti);
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token revocation");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        await Task.CompletedTask;
        await Task.CompletedTask;
        try
        {
            var email = User.FindFirst("email")?.Value;
            var roles = User.FindAll("role").Select(c => c.Value).ToArray();

            return Ok(new UserProfile
            {
                Email = email!,
                Roles = roles,
                LastLogin = DateTime.UtcNow // In production, get from database
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private static bool TryParseRevocationMetadata(string token, out string jti, out DateTime expiresAtUtc)
    {
        jti = string.Empty;
        expiresAtUtc = DateTime.MinValue;

        try
        {
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(token))
            {
                return false;
            }

            var jwt = handler.ReadJwtToken(token);
            jti = jwt.Claims.FirstOrDefault(c => c.Type == "jti")?.Value ?? string.Empty;
            if (string.IsNullOrWhiteSpace(jti))
            {
                return false;
            }

            if (jwt.ValidTo == DateTime.MinValue)
            {
                return false;
            }

            expiresAtUtc = jwt.ValidTo.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(jwt.ValidTo, DateTimeKind.Utc)
                : jwt.ValidTo.ToUniversalTime();

            return true;
        }
        catch
        {
            return false;
        }
    }
}
