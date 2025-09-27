using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TerraFusion.Core.Services.Enterprise;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// TerraFusion OS 1.0 - User API Controller
    /// Trust Fabric Enforced User Management
    /// 
    /// Provides basic user profile and authentication endpoints
    /// Required by frontend for user authentication state management.
    /// </summary>
    [ApiController]
    [Route("")]
    public class UserController : ControllerBase
    {
        private readonly IEnterpriseAuthService _authService;
        private readonly ILogger<UserController> _logger;
        private readonly AuditLogger _auditLogger;

        public UserController(
            IEnterpriseAuthService authService,
            ILogger<UserController> logger,
            AuditLogger auditLogger)
        {
            _authService = authService;
            _logger = logger;
            _auditLogger = auditLogger;
        }

        /// <summary>
        /// Get current user profile
        /// GET /user
        /// </summary>
        [HttpGet("user")]
        [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<UserProfileResponse>> GetCurrentUser()
        {
            try 
            {
                // For development/demo purposes, create a demo user
                // In production, this would authenticate against Azure AD
                var demoUser = new UserProfileResponse
                {
                    Id = "demo-user-001",
                    Username = "demo.user",
                    Email = "demo.user@terrafusion.local",
                    FirstName = "Demo",
                    LastName = "User", 
                    DisplayName = "Demo User",
                    Role = "Administrator",
                    Department = "TerraFusion OS",
                    IsAuthenticated = true,
                    Permissions = new List<string> { "admin", "user.create", "user.read", "user.update", "system.access" },
                    LastLogin = DateTime.UtcNow.AddMinutes(-5),
                    Avatar = "/assets/default-avatar.png",
                    Theme = "dark"
                };

                await _auditLogger.LogAsync("GET /user", "Retrieved current user", true);

                return Ok(demoUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current user");
                await _auditLogger.LogErrorAsync("GET /user", ex);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get user profile by ID
        /// GET /api/users/{userId}
        /// </summary>
        [HttpGet("api/users/{userId}")]
        [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserProfileResponse>> GetUserById(string userId)
        {
            try
            {
                // Demo implementation - in production would lookup real user
                if (userId == "demo-user-001")
                {
                    var user = new UserProfileResponse
                    {
                        Id = userId,
                        Username = "demo.user",
                        Email = "demo.user@terrafusion.local", 
                        FirstName = "Demo",
                        LastName = "User",
                        DisplayName = "Demo User",
                        Role = "Administrator",
                        Department = "TerraFusion OS",
                        IsAuthenticated = true,
                        Permissions = new List<string> { "admin", "user.create", "user.read", "user.update", "system.access" },
                        LastLogin = DateTime.UtcNow.AddMinutes(-5),
                        Avatar = "/assets/default-avatar.png",
                        Theme = "dark"
                    };

                    await _auditLogger.LogAsync($"GET /api/users/{userId}", "Retrieved user by ID", true);
                    return Ok(user);
                }

                await _auditLogger.LogAsync($"GET /api/users/{userId}", "User not found", false);
                return NotFound(new { message = "User not found", userId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user {UserId}", userId);
                await _auditLogger.LogErrorAsync($"GET /api/users/{userId}", ex);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Check authentication status
        /// GET /api/auth/status
        /// </summary>
        [HttpGet("api/auth/status")]
        [ProducesResponseType(typeof(AuthStatusResponse), StatusCodes.Status200OK)]
        public async Task<ActionResult<AuthStatusResponse>> GetAuthStatus()
        {
            try
            {
                var authStatus = new AuthStatusResponse
                {
                    IsAuthenticated = true,
                    UserId = "demo-user-001",
                    SessionValid = true,
                    ExpiresAt = DateTime.UtcNow.AddHours(8),
                    Roles = new List<string> { "Administrator" },
                    Permissions = new List<string> { "admin", "user.create", "user.read", "user.update", "system.access" }
                };

                await _auditLogger.LogAsync("GET /api/auth/status", "Retrieved authentication status", true);
                return Ok(authStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking auth status");
                await _auditLogger.LogErrorAsync("GET /api/auth/status", ex);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }

    /// <summary>
    /// User profile response model
    /// </summary>
    public class UserProfileResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public bool IsAuthenticated { get; set; }
        public List<string> Permissions { get; set; } = new List<string>();
        public DateTime? LastLogin { get; set; }
        public string Avatar { get; set; } = string.Empty;
        public string Theme { get; set; } = "light";
    }

    /// <summary>
    /// Authentication status response model
    /// </summary>
    public class AuthStatusResponse
    {
        public bool IsAuthenticated { get; set; }
        public string UserId { get; set; } = string.Empty;
        public bool SessionValid { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public List<string> Permissions { get; set; } = new List<string>();
    }
}
