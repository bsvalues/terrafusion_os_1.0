using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using TerraFusion.API.Security.Services;
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
    private readonly IProvisionedUserContextProvider _provisionedUsers;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthenticationService authService,
        ISecurityService securityService,
        IProvisionedUserContextProvider provisionedUsers,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _securityService = securityService;
        _provisionedUsers = provisionedUsers;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var email = request.Email.Trim();
            var provisionedUser = await _provisionedUsers.GetProvisionedUserContextAsync(email);

            if (provisionedUser is null)
            {
                await _securityService.LogSecurityEventAsync("UNPROVISIONED_LOGIN_ATTEMPT",
                    $"Unprovisioned account attempted login: {email}");
                return Unauthorized(new { message = "Account not provisioned" });
            }

            var isValidCredentials = await _securityService.ValidateUserCredentialsAsync(email, request.Password);
            
            if (!isValidCredentials)
            {
                await _securityService.LogSecurityEventAsync("FAILED_LOGIN_ATTEMPT", 
                    $"Failed login attempt for user: {email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var claims = BuildProvisionedClaims(provisionedUser);
            var tokenPair = await _authService.GenerateTokenPairAsync(
                provisionedUser.UserId.ToString(),
                provisionedUser.Email,
                provisionedUser.Roles,
                claims);

            await _provisionedUsers.RecordUserSessionAsync(
                provisionedUser.UserId,
                tokenPair.AccessToken,
                tokenPair.RefreshToken,
                DateTime.UtcNow.AddDays(7),
                ControllerContext.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                ControllerContext.HttpContext?.Request.Headers.UserAgent.ToString());

            await _securityService.LogSecurityEventAsync("SUCCESSFUL_LOGIN", 
                $"User successfully logged in: {provisionedUser.Email}");

            return Ok(new LoginResponse
            {
                Token = tokenPair.AccessToken,
                RefreshToken = tokenPair.RefreshToken,
                Email = provisionedUser.Email,
                Roles = provisionedUser.Roles,
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
            message = "TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."
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

            var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                ?? principal.FindFirst("email")?.Value;
            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Invalid token claims" });
            }

            var provisionedUser = await _provisionedUsers.GetProvisionedUserContextAsync(email);
            if (provisionedUser is null || provisionedUser.UserId.ToString() != userId)
            {
                return Unauthorized(new { message = "Account not provisioned" });
            }

            var newToken = await _authService.GenerateJwtTokenAsync(
                userId,
                provisionedUser.Email,
                provisionedUser.Roles,
                BuildProvisionedClaims(provisionedUser));

            await _securityService.LogSecurityEventAsync("TOKEN_REFRESH", 
                $"Token refreshed for user: {email}");

            return Ok(new LoginResponse
            {
                Token = newToken,
                Email = provisionedUser.Email,
                Roles = provisionedUser.Roles,
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

    private static Dictionary<string, object> BuildProvisionedClaims(ProvisionedUserAuthContext user)
    {
        var claims = new Dictionary<string, object>
        {
            ["perm"] = user.Permissions
        };

        if (user.CountyId.HasValue)
        {
            claims["countyId"] = user.CountyId.Value.ToString();
        }

        if (!string.IsNullOrWhiteSpace(user.CountyName))
        {
            claims["countyName"] = user.CountyName;
        }

        if (!string.IsNullOrWhiteSpace(user.CountyState))
        {
            claims["countyState"] = user.CountyState;
        }

        if (!string.IsNullOrWhiteSpace(user.CountyFipsCode))
        {
            claims["countyFipsCode"] = user.CountyFipsCode;
        }

        return claims;
    }
}
