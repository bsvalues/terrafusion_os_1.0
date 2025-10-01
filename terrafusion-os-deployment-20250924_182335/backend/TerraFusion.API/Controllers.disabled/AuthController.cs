using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
            // Validate government user
            if (!await _securityService.IsValidGovernmentUserAsync(request.Email))
            {
                await _securityService.LogSecurityEventAsync("INVALID_LOGIN_ATTEMPT", 
                    $"Non-government user attempted login: {request.Email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // In production, validate against government directory (Active Directory, LDAP, etc.)
            var isValidCredentials = await ValidateUserCredentials(request.Email, request.Password);
            
            if (!isValidCredentials)
            {
                await _securityService.LogSecurityEventAsync("FAILED_LOGIN_ATTEMPT", 
                    $"Failed login attempt for user: {request.Email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Generate JWT token
            var roles = await GetUserRoles(request.Email);
            var token = await _authService.GenerateJwtTokenAsync(
                Guid.NewGuid().ToString(), 
                request.Email, 
                roles);

            await _securityService.LogSecurityEventAsync("SUCCESSFUL_LOGIN", 
                $"User successfully logged in: {request.Email}");

            return Ok(new LoginResponse
            {
                Token = token,
                Email = request.Email,
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

            var roles = await GetUserRoles(email);
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

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
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

    private async Task<bool> ValidateUserCredentials(string email, string password)
    {
        // In production, integrate with government authentication systems
        // For demo purposes, use simple validation
        await Task.Delay(100); // Simulate authentication delay
        
        // Government users with @gov., @state., @county. domains
        return email.EndsWith("@gov.") || 
               email.EndsWith("@state.") || 
               email.EndsWith("@county.") ||
               email.EndsWith("@terrafusion.gov");
    }

    private async Task<IEnumerable<string>> GetUserRoles(string email)
    {
        // In production, get from government directory or database
        await Task.Delay(50);
        
        var roles = new List<string> { "GovernmentUser" };
        
        if (email.Contains("admin"))
            roles.Add("Administrator");
        if (email.Contains("assessor"))
            roles.Add("PropertyAssessor");
        if (email.Contains("auditor"))
            roles.Add("CountyAuditor");
        
        return roles;
    }
}