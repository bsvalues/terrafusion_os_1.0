using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.Enterprise;

/// <summary>
/// Service for managing role-based access control (RBAC) and permissions
/// </summary>
public interface IRolePermissionService
{
    Task<List<string>> GetUserApplicationRolesAsync(string userId);
    Task<bool> ValidatePermissionAsync(List<string> userRoles, string resource, string action);
    Task<List<Permission>> GetPermissionsForRoleAsync(string role);
    Task<bool> AssignRoleToUserAsync(string userId, string role);
    Task<bool> RemoveRoleFromUserAsync(string userId, string role);
    Task<List<Role>> GetAllRolesAsync();
    Task<Role?> CreateRoleAsync(string roleName, string description, List<Permission> permissions);
    Task<bool> UpdateRolePermissionsAsync(string roleName, List<Permission> permissions);
    Task<AuditTrail> GetPermissionAuditTrailAsync(string userId, TimeSpan period);
}

public class RolePermissionService : IRolePermissionService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RolePermissionService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly ConcurrentDictionary<string, List<string>> _userRoles;
    private readonly ConcurrentDictionary<string, List<Permission>> _rolePermissions;

    public RolePermissionService(
        IConfiguration configuration,
        ILogger<RolePermissionService> logger,
        IStructuredLogger structuredLogger)
    {
        _configuration = configuration;
        _logger = logger;
        _structuredLogger = structuredLogger;
        _userRoles = new ConcurrentDictionary<string, List<string>>();
        _rolePermissions = new ConcurrentDictionary<string, List<Permission>>();

        InitializeDefaultRoles();
    }

    public async Task<List<string>> GetUserApplicationRolesAsync(string userId)
    {
        try
        {
            // Get roles from cache/database
            if (_userRoles.TryGetValue(userId, out var roles))
            {
                return roles;
            }

            // Load from database (simulated)
            var userRoles = await LoadUserRolesFromDatabaseAsync(userId);
            _userRoles.TryAdd(userId, userRoles);

            return userRoles;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get application roles for user {UserId}", userId);
            return new List<string>();
        }
    }

    public async Task<bool> ValidatePermissionAsync(List<string> userRoles, string resource, string action)
    {
        try
        {
            foreach (var role in userRoles)
            {
                var permissions = await GetPermissionsForRoleAsync(role);
                var hasPermission = permissions.Any(p => 
                    (p.Resource == "*" || p.Resource.Equals(resource, StringComparison.OrdinalIgnoreCase)) &&
                    (p.Action == "*" || p.Action.Equals(action, StringComparison.OrdinalIgnoreCase)));

                if (hasPermission)
                {
                    _structuredLogger.LogSecurityEvent("PermissionGranted", 
                        $"Permission granted for {resource}:{action}", 
                        context: new { 
                            Resource = resource, 
                            Action = action, 
                            Role = role,
                            UserRoles = userRoles 
                        });
                    return true;
                }
            }

            _structuredLogger.LogSecurityEvent("PermissionDenied", 
                $"Permission denied for {resource}:{action}", 
                context: new { 
                    Resource = resource, 
                    Action = action, 
                    UserRoles = userRoles 
                });
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Permission validation failed for resource {Resource}, action {Action}", 
                resource, action);
            return false;
        }
    }

    public async Task<List<Permission>> GetPermissionsForRoleAsync(string role)
    {
        try
        {
            if (_rolePermissions.TryGetValue(role, out var permissions))
            {
                return permissions;
            }

            // Load from database (simulated)
            var rolePermissions = await LoadRolePermissionsFromDatabaseAsync(role);
            _rolePermissions.TryAdd(role, rolePermissions);

            return rolePermissions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get permissions for role {Role}", role);
            return new List<Permission>();
        }
    }

    public async Task<bool> AssignRoleToUserAsync(string userId, string role)
    {
        try
        {
            var userRoles = await GetUserApplicationRolesAsync(userId);
            if (!userRoles.Contains(role))
            {
                userRoles.Add(role);
                _userRoles.AddOrUpdate(userId, userRoles, (key, oldValue) => userRoles);

                // Persist to database
                await SaveUserRolesToDatabaseAsync(userId, userRoles);

                _structuredLogger.LogSecurityEvent("RoleAssigned", 
                    $"Role {role} assigned to user", userId, 
                    new { Role = role, AllRoles = userRoles });

                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assign role {Role} to user {UserId}", role, userId);
            return false;
        }
    }

    public async Task<bool> RemoveRoleFromUserAsync(string userId, string role)
    {
        try
        {
            var userRoles = await GetUserApplicationRolesAsync(userId);
            if (userRoles.Remove(role))
            {
                _userRoles.AddOrUpdate(userId, userRoles, (key, oldValue) => userRoles);

                // Persist to database
                await SaveUserRolesToDatabaseAsync(userId, userRoles);

                _structuredLogger.LogSecurityEvent("RoleRemoved", 
                    $"Role {role} removed from user", userId, 
                    new { Role = role, RemainingRoles = userRoles });

                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove role {Role} from user {UserId}", role, userId);
            return false;
        }
    }

    public async Task<List<Role>> GetAllRolesAsync()
    {
        try
        {
            var roles = new List<Role>();

            foreach (var rolePermission in _rolePermissions)
            {
                var role = new Role
                {
                    Name = rolePermission.Key,
                    Description = GetRoleDescription(rolePermission.Key),
                    Permissions = rolePermission.Value,
                    CreatedAt = DateTimeOffset.UtcNow, // Would be from database
                    IsActive = true
                };
                roles.Add(role);
            }

            return roles;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all roles");
            return new List<Role>();
        }
    }

    public async Task<Role?> CreateRoleAsync(string roleName, string description, List<Permission> permissions)
    {
        try
        {
            if (_rolePermissions.ContainsKey(roleName))
            {
                _logger.LogWarning("Role {RoleName} already exists", roleName);
                return null;
            }

            _rolePermissions.TryAdd(roleName, permissions);

            // Persist to database
            await SaveRoleToDatabase(roleName, description, permissions);

            var role = new Role
            {
                Name = roleName,
                Description = description,
                Permissions = permissions,
                CreatedAt = DateTimeOffset.UtcNow,
                IsActive = true
            };

            _structuredLogger.LogSecurityEvent("RoleCreated", 
                $"New role {roleName} created", 
                context: new { 
                    RoleName = roleName, 
                    Description = description, 
                    PermissionCount = permissions.Count 
                });

            return role;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create role {RoleName}", roleName);
            return null;
        }
    }

    public async Task<bool> UpdateRolePermissionsAsync(string roleName, List<Permission> permissions)
    {
        try
        {
            if (!_rolePermissions.ContainsKey(roleName))
            {
                _logger.LogWarning("Role {RoleName} does not exist", roleName);
                return false;
            }

            _rolePermissions.AddOrUpdate(roleName, permissions, (key, oldValue) => permissions);

            // Persist to database
            await UpdateRoleInDatabase(roleName, permissions);

            _structuredLogger.LogSecurityEvent("RoleUpdated", 
                $"Role {roleName} permissions updated", 
                context: new { 
                    RoleName = roleName, 
                    PermissionCount = permissions.Count 
                });

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update role {RoleName}", roleName);
            return false;
        }
    }

    public async Task<AuditTrail> GetPermissionAuditTrailAsync(string userId, TimeSpan period)
    {
        try
        {
            // This would query audit logs from database
            var auditTrail = new AuditTrail
            {
                UserId = userId,
                Period = period,
                Events = new List<AuditEvent>()
            };

            // Simulated audit events
            var events = await LoadAuditEventsFromDatabase(userId, period);
            auditTrail.Events = events;

            return auditTrail;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get audit trail for user {UserId}", userId);
            return new AuditTrail { UserId = userId, Period = period, Events = new List<AuditEvent>() };
        }
    }

    private void InitializeDefaultRoles()
    {
        // Initialize default system roles
        var defaultRoles = new Dictionary<string, List<Permission>>
        {
            ["SystemAdmin"] = new List<Permission>
            {
                new Permission { Resource = "*", Action = "*", Description = "Full system access" }
            },
            ["PropertyManager"] = new List<Permission>
            {
                new Permission { Resource = "Properties", Action = "Read", Description = "View properties" },
                new Permission { Resource = "Properties", Action = "Create", Description = "Create properties" },
                new Permission { Resource = "Properties", Action = "Update", Description = "Update properties" },
                new Permission { Resource = "Properties", Action = "Delete", Description = "Delete properties" },
                new Permission { Resource = "Reports", Action = "Read", Description = "View reports" }
            },
            ["Assessor"] = new List<Permission>
            {
                new Permission { Resource = "Properties", Action = "Read", Description = "View properties" },
                new Permission { Resource = "Properties", Action = "Update", Description = "Update property assessments" },
                new Permission { Resource = "Assessments", Action = "*", Description = "Full assessment access" }
            },
            ["Viewer"] = new List<Permission>
            {
                new Permission { Resource = "Properties", Action = "Read", Description = "View properties" },
                new Permission { Resource = "Reports", Action = "Read", Description = "View reports" }
            },
            ["TaxCollector"] = new List<Permission>
            {
                new Permission { Resource = "Properties", Action = "Read", Description = "View properties" },
                new Permission { Resource = "TaxRecords", Action = "*", Description = "Full tax record access" },
                new Permission { Resource = "Payments", Action = "*", Description = "Full payment access" }
            }
        };

        foreach (var role in defaultRoles)
        {
            _rolePermissions.TryAdd(role.Key, role.Value);
        }
    }

    private async Task<List<string>> LoadUserRolesFromDatabaseAsync(string userId)
    {
        // Simulated database load
        await Task.Delay(10);
        
        // Default role assignment logic
        return new List<string> { "Viewer" };
    }

    private async Task<List<Permission>> LoadRolePermissionsFromDatabaseAsync(string role)
    {
        // Simulated database load
        await Task.Delay(10);
        
        return new List<Permission>();
    }

    private async Task SaveUserRolesToDatabaseAsync(string userId, List<string> roles)
    {
        // Simulated database save
        await Task.Delay(10);
    }

    private async Task SaveRoleToDatabase(string roleName, string description, List<Permission> permissions)
    {
        // Simulated database save
        await Task.Delay(10);
    }

    private async Task UpdateRoleInDatabase(string roleName, List<Permission> permissions)
    {
        // Simulated database update
        await Task.Delay(10);
    }

    private async Task<List<AuditEvent>> LoadAuditEventsFromDatabase(string userId, TimeSpan period)
    {
        // Simulated audit event loading
        await Task.Delay(10);
        
        return new List<AuditEvent>
        {
            new AuditEvent
            {
                UserId = userId,
                Action = "RoleAssigned",
                Resource = "Viewer",
                Timestamp = DateTimeOffset.UtcNow.Subtract(TimeSpan.FromHours(1)),
                Success = true,
                Details = "User assigned Viewer role"
            }
        };
    }

    private string GetRoleDescription(string roleName)
    {
        return roleName switch
        {
            "SystemAdmin" => "Full system administrator with all permissions",
            "PropertyManager" => "Manages property records and generates reports",
            "Assessor" => "Conducts property assessments and valuations",
            "Viewer" => "Read-only access to properties and reports",
            "TaxCollector" => "Manages tax records and payment processing",
            _ => $"Custom role: {roleName}"
        };
    }
}

// Data models
public class Permission
{
    public string Resource { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class Role
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<Permission> Permissions { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AuditTrail
{
    public string UserId { get; set; } = string.Empty;
    public TimeSpan Period { get; set; }
    public List<AuditEvent> Events { get; set; } = new();
}

public class AuditEvent
{
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public bool Success { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
