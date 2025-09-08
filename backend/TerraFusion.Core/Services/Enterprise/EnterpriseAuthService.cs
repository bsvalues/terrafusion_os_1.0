using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Graph;
using Microsoft.Identity.Web;
using System.Security.Claims;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.Enterprise;

/// <summary>
/// Service for Azure Active Directory integration and enterprise authentication
/// </summary>
public interface IEnterpriseAuthService
{
    Task<AuthenticationResult> AuthenticateUserAsync(string token);
    Task<UserProfile> GetUserProfileAsync(string userId);
    Task<List<string>> GetUserRolesAsync(string userId);
    Task<bool> ValidatePermissionAsync(string userId, string resource, string action);
    Task<List<GroupMembership>> GetUserGroupsAsync(string userId);
    Task<AuthenticationContext> CreateAuthContextAsync(ClaimsPrincipal user);
    Task<bool> ValidateApiKeyAsync(string apiKey);
    Task LogAuthenticationEventAsync(string userId, string action, bool success, string? details = null);
}

public class EnterpriseAuthService : IEnterpriseAuthService
{
    private readonly GraphServiceClient _graphServiceClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EnterpriseAuthService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IRolePermissionService _rolePermissionService;

    public EnterpriseAuthService(
        GraphServiceClient graphServiceClient,
        IConfiguration configuration,
        ILogger<EnterpriseAuthService> logger,
        IStructuredLogger structuredLogger,
        IRolePermissionService rolePermissionService)
    {
        _graphServiceClient = graphServiceClient;
        _configuration = configuration;
        _logger = logger;
        _structuredLogger = structuredLogger;
        _rolePermissionService = rolePermissionService;
    }

    public async Task<AuthenticationResult> AuthenticateUserAsync(string token)
    {
        try
        {
            _logger.LogInformation("Authenticating user with Azure AD token");

            // Validate the JWT token
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadJwtToken(token);

            var userId = jsonToken.Claims.FirstOrDefault(c => c.Type == "oid")?.Value 
                        ?? jsonToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Unable to extract user ID from token");
                return new AuthenticationResult { Success = false, ErrorMessage = "Invalid token format" };
            }

            // Get user profile from Microsoft Graph
            var userProfile = await GetUserProfileAsync(userId);
            if (userProfile == null)
            {
                _logger.LogWarning("User not found in Azure AD: {UserId}", userId);
                return new AuthenticationResult { Success = false, ErrorMessage = "User not found" };
            }

            // Get user roles and permissions
            var roles = await GetUserRolesAsync(userId);
            var groups = await GetUserGroupsAsync(userId);

            var result = new AuthenticationResult
            {
                Success = true,
                UserId = userId,
                UserProfile = userProfile,
                Roles = roles,
                Groups = groups,
                Token = token,
                ExpiresAt = jsonToken.ValidTo
            };

            await LogAuthenticationEventAsync(userId, "Login", true, "Successful Azure AD authentication");
            _structuredLogger.LogSecurityEvent("UserAuthentication", "User successfully authenticated", userId, new { 
                Method = "AzureAD",
                Roles = roles,
                Groups = groups.Select(g => g.DisplayName)
            });

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication failed");
            await LogAuthenticationEventAsync("unknown", "Login", false, ex.Message);
            _structuredLogger.LogSecurityEvent("AuthenticationFailure", "Authentication attempt failed", context: new { 
                Error = ex.Message,
                Method = "AzureAD"
            });

            return new AuthenticationResult { Success = false, ErrorMessage = "Authentication failed" };
        }
    }

    public async Task<UserProfile> GetUserProfileAsync(string userId)
    {
        try
        {
            var user = await _graphServiceClient.Users[userId].GetAsync();
            
            if (user == null)
                return null;

            return new UserProfile
            {
                Id = user.Id,
                DisplayName = user.DisplayName,
                Email = user.Mail ?? user.UserPrincipalName,
                FirstName = user.GivenName,
                LastName = user.Surname,
                JobTitle = user.JobTitle,
                Department = user.Department,
                Office = user.OfficeLocation,
                Manager = await GetManagerAsync(userId),
                PhotoUrl = await GetUserPhotoUrlAsync(userId),
                LastSignIn = user.SignInActivity?.LastSignInDateTime,
                AccountEnabled = user.AccountEnabled ?? false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user profile for {UserId}", userId);
            return null;
        }
    }

    public async Task<List<string>> GetUserRolesAsync(string userId)
    {
        try
        {
            var roles = new List<string>();

            // Get directory roles
            var directoryRoles = await _graphServiceClient.Users[userId].MemberOf.GetAsync();
            
            foreach (var role in directoryRoles?.Value ?? new List<Microsoft.Graph.Models.DirectoryObject>())
            {
                if (role is Microsoft.Graph.Models.DirectoryRole dirRole)
                {
                    roles.Add(dirRole.DisplayName);
                }
            }

            // Get application-specific roles from configuration or database
            var appRoles = await _rolePermissionService.GetUserApplicationRolesAsync(userId);
            roles.AddRange(appRoles);

            return roles.Distinct().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user roles for {UserId}", userId);
            return new List<string>();
        }
    }

    public async Task<bool> ValidatePermissionAsync(string userId, string resource, string action)
    {
        try
        {
            var userRoles = await GetUserRolesAsync(userId);
            var hasPermission = await _rolePermissionService.ValidatePermissionAsync(userRoles, resource, action);

            _structuredLogger.LogSecurityEvent("PermissionCheck", $"Permission validation for {resource}:{action}", userId, new {
                Resource = resource,
                Action = action,
                HasPermission = hasPermission,
                UserRoles = userRoles
            });

            return hasPermission;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Permission validation failed for user {UserId}, resource {Resource}, action {Action}", 
                userId, resource, action);
            return false;
        }
    }

    public async Task<List<GroupMembership>> GetUserGroupsAsync(string userId)
    {
        try
        {
            var groups = new List<GroupMembership>();
            var memberOf = await _graphServiceClient.Users[userId].MemberOf.GetAsync();

            foreach (var groupObject in memberOf?.Value ?? new List<Microsoft.Graph.Models.DirectoryObject>())
            {
                if (groupObject is Microsoft.Graph.Models.Group group)
                {
                    groups.Add(new GroupMembership
                    {
                        Id = group.Id,
                        DisplayName = group.DisplayName,
                        Description = group.Description,
                        GroupType = group.GroupTypes?.Contains("Unified") == true ? "Microsoft365" : "Security",
                        Mail = group.Mail
                    });
                }
            }

            return groups;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user groups for {UserId}", userId);
            return new List<GroupMembership>();
        }
    }

    public async Task<AuthenticationContext> CreateAuthContextAsync(ClaimsPrincipal user)
    {
        try
        {
            var userId = user.FindFirst("oid")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                throw new InvalidOperationException("User ID not found in claims");

            var userProfile = await GetUserProfileAsync(userId);
            var roles = await GetUserRolesAsync(userId);
            var groups = await GetUserGroupsAsync(userId);

            return new AuthenticationContext
            {
                UserId = userId,
                UserProfile = userProfile,
                Roles = roles,
                Groups = groups,
                Claims = user.Claims.ToDictionary(c => c.Type, c => c.Value),
                AuthenticatedAt = DateTimeOffset.UtcNow,
                SessionId = Guid.NewGuid().ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create authentication context");
            throw;
        }
    }

    public async Task<bool> ValidateApiKeyAsync(string apiKey)
    {
        try
        {
            // Validate API key against configured keys or database
            var validApiKeys = _configuration.GetSection("Authentication:ApiKeys").Get<string[]>() ?? Array.Empty<string>();
            
            var isValid = validApiKeys.Contains(apiKey);
            
            await LogAuthenticationEventAsync("api-key", "ApiKeyValidation", isValid, 
                isValid ? "Valid API key" : "Invalid API key");

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API key validation failed");
            return false;
        }
    }

    public async Task LogAuthenticationEventAsync(string userId, string action, bool success, string? details = null)
    {
        try
        {
            var authEvent = new AuthenticationEvent
            {
                UserId = userId,
                Action = action,
                Success = success,
                Details = details,
                Timestamp = DateTimeOffset.UtcNow,
                IpAddress = GetClientIpAddress(),
                UserAgent = GetUserAgent()
            };

            // Log to structured logging
            _structuredLogger.LogSecurityEvent("AuthenticationEvent", $"{action} {(success ? "succeeded" : "failed")}", userId, authEvent);

            // Store in audit trail (implement as needed)
            await StoreAuditEventAsync(authEvent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log authentication event");
        }
    }

    private async Task<string?> GetManagerAsync(string userId)
    {
        try
        {
            var manager = await _graphServiceClient.Users[userId].Manager.GetAsync();
            return manager is Microsoft.Graph.Models.User managerUser ? managerUser.DisplayName : null;
        }
        catch
        {
            return null;
        }
    }

    private async Task<string?> GetUserPhotoUrlAsync(string userId)
    {
        try
        {
            var photo = await _graphServiceClient.Users[userId].Photo.GetAsync();
            if (photo != null)
            {
                return $"/api/users/{userId}/photo";
            }
            return null;
        }
        catch
        {
            return null;
        }
    }

    private string? GetClientIpAddress()
    {
        // This would be injected from HTTP context in a real implementation
        return "127.0.0.1"; // Placeholder
    }

    private string? GetUserAgent()
    {
        // This would be injected from HTTP context in a real implementation
        return "TerraFusion/1.0"; // Placeholder
    }

    private async Task StoreAuditEventAsync(AuthenticationEvent authEvent)
    {
        // Implementation would store to database or audit service
        await Task.CompletedTask;
    }
}

// Data models
public class AuthenticationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string UserId { get; set; } = string.Empty;
    public UserProfile? UserProfile { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<GroupMembership> Groups { get; set; } = new();
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class UserProfile
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? JobTitle { get; set; }
    public string? Department { get; set; }
    public string? Office { get; set; }
    public string? Manager { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTimeOffset? LastSignIn { get; set; }
    public bool AccountEnabled { get; set; }
}

public class GroupMembership
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string GroupType { get; set; } = string.Empty;
    public string? Mail { get; set; }
}

public class AuthenticationContext
{
    public string UserId { get; set; } = string.Empty;
    public UserProfile? UserProfile { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<GroupMembership> Groups { get; set; } = new();
    public Dictionary<string, string> Claims { get; set; } = new();
    public DateTimeOffset AuthenticatedAt { get; set; }
    public string SessionId { get; set; } = string.Empty;
}

public class AuthenticationEvent
{
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Details { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
