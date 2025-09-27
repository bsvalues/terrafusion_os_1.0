using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly ITerraFusionDbContext _context;
        private readonly ILogger<PermissionService> _logger;

        public PermissionService(
            ITerraFusionDbContext context,
            ILogger<PermissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Permission Management

        public async Task<List<PermissionDto>> GetPermissionsAsync()
        {
            try
            {
                var permissions = await _context.Permissions
                    .OrderBy(p => p.Category)
                    .ThenBy(p => p.Name)
                    .ToListAsync();

                return permissions.Select(MapToPermissionDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting permissions");
                throw;
            }
        }

        public async Task<List<PermissionDto>> GetUserPermissionsAsync(string userId)
        {
            try
            {
                var userPermissions = await _context.UserPermissions
                    .Include(up => up.Permission)
                    .Where(up => up.UserId == userId && (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow))
                    .ToListAsync();

                // Get role-based permissions
                var user = await _context.CollaborationUsers.FindAsync(userId);
                var rolePermissions = await GetRolePermissionsAsync(user?.Role ?? UserRole.Guest);

                var allPermissions = userPermissions.Select(up => up.Permission).ToList();
                allPermissions.AddRange(rolePermissions);

                return allPermissions.Distinct().Select(MapToPermissionDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user permissions {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> HasPermissionAsync(string userId, string permissionName, string? entityId = null)
        {
            try
            {
                // Check direct user permissions
                var hasDirectPermission = await _context.UserPermissions
                    .Include(up => up.Permission)
                    .AnyAsync(up => up.UserId == userId 
                                 && up.Permission.Name == permissionName
                                 && (up.ExpiresAt == null || up.ExpiresAt > DateTime.UtcNow)
                                 && ValidatePermissionConditions(up, entityId));

                if (hasDirectPermission) return true;

                // Check role-based permissions
                var user = await _context.CollaborationUsers.FindAsync(userId);
                if (user == null) return false;

                var rolePermissions = await GetRolePermissionsAsync(user.Role);
                var hasRolePermission = rolePermissions.Any(p => p.Name == permissionName);

                if (hasRolePermission) return true;

                // Check entity-specific permissions
                if (!string.IsNullOrEmpty(entityId))
                {
                    return await HasEntityPermissionAsync(userId, permissionName, entityId);
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission {PermissionName} for user {UserId}", permissionName, userId);
                return false; // Fail securely
            }
        }

        public async Task<bool> GrantPermissionAsync(string userId, string permissionId, string grantedById, DateTime? expiresAt = null)
        {
            try
            {
                // Check if permission already exists
                var existingPermission = await _context.UserPermissions
                    .FirstOrDefaultAsync(up => up.UserId == userId && up.PermissionId == permissionId);

                if (existingPermission != null)
                {
                    // Update existing permission
                    existingPermission.ExpiresAt = expiresAt;
                    existingPermission.GrantedAt = DateTime.UtcNow;
                    existingPermission.GrantedById = grantedById;
                }
                else
                {
                    // Create new permission
                    var userPermission = new UserPermission
                    {
                        UserId = userId,
                        PermissionId = permissionId,
                        GrantedById = grantedById,
                        ExpiresAt = expiresAt
                    };

                    _context.UserPermissions.Add(userPermission);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Permission {PermissionId} granted to user {UserId} by {GrantedById}", 
                    permissionId, userId, grantedById);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error granting permission {PermissionId} to user {UserId}", permissionId, userId);
                throw;
            }
        }

        public async Task<bool> RevokePermissionAsync(string userId, string permissionId)
        {
            try
            {
                var userPermission = await _context.UserPermissions
                    .FirstOrDefaultAsync(up => up.UserId == userId && up.PermissionId == permissionId);

                if (userPermission == null) return false;

                _context.UserPermissions.Remove(userPermission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Permission {PermissionId} revoked from user {UserId}", permissionId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking permission {PermissionId} from user {UserId}", permissionId, userId);
                throw;
            }
        }

        public async Task<List<PermissionDto>> GetEntityPermissionsAsync(string entityType, string entityId)
        {
            try
            {
                // This is a placeholder - entity-specific permissions would require more complex logic
                // depending on the entity type (Project, Team, Document, etc.)
                
                var permissions = new List<Permission>();

                switch (entityType.ToLower())
                {
                    case "project":
                        var projectPermissions = await _context.ProjectParticipants
                            .Where(pp => pp.ProjectId == entityId && pp.IsActive)
                            .ToListAsync();
                        // Convert project roles to permissions
                        break;

                    case "team":
                        var teamPermissions = await _context.TeamMembers
                            .Where(tm => tm.TeamId == entityId && tm.IsActive)
                            .ToListAsync();
                        // Convert team roles to permissions
                        break;

                    case "document":
                        var docPermissions = await _context.DocumentPermissions
                            .Include(dp => dp.User)
                            .Where(dp => dp.DocumentId == entityId)
                            .ToListAsync();
                        // Convert document permissions
                        break;
                }

                return permissions.Select(MapToPermissionDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting entity permissions for {EntityType} {EntityId}", entityType, entityId);
                throw;
            }
        }

        #endregion

        #region Role-based Access Control

        public async Task<bool> CanAccessProjectAsync(string userId, string projectId, ProjectPermissionScope scope = ProjectPermissionScope.All)
        {
            try
            {
                // Check if user is project owner
                var project = await _context.Projects.FindAsync(projectId);
                if (project?.OwnerId == userId) return true;

                // Check if user is project participant
                var isParticipant = await _context.ProjectParticipants
                    .AnyAsync(pp => pp.ProjectId == projectId && pp.UserId == userId && pp.IsActive);

                if (isParticipant) return true;

                // Check if user is team member
                if (project != null)
                {
                    var isTeamMember = await _context.TeamMembers
                        .AnyAsync(tm => tm.TeamId == project.TeamId && tm.UserId == userId && tm.IsActive);

                    if (isTeamMember) return true;
                }

                // Check specific permission
                var permissionName = scope switch
                {
                    ProjectPermissionScope.Tasks => "project.tasks.view",
                    ProjectPermissionScope.Documents => "project.documents.view", 
                    ProjectPermissionScope.Team => "project.team.view",
                    ProjectPermissionScope.Settings => "project.settings.view",
                    _ => "project.view"
                };

                return await HasPermissionAsync(userId, permissionName, projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking project access for user {UserId} and project {ProjectId}", userId, projectId);
                return false; // Fail securely
            }
        }

        public async Task<bool> CanAccessTeamAsync(string userId, string teamId)
        {
            try
            {
                // Check if user is team member
                var isTeamMember = await _context.TeamMembers
                    .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId && tm.IsActive);

                if (isTeamMember) return true;

                // Check team access permission
                return await HasPermissionAsync(userId, "team.view", teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking team access for user {UserId} and team {TeamId}", userId, teamId);
                return false; // Fail securely
            }
        }

        public async Task<bool> CanAccessDocumentAsync(string userId, string documentId, DocumentPermissionLevel requiredLevel = DocumentPermissionLevel.View)
        {
            try
            {
                // Check document permissions
                var hasPermission = await _context.DocumentPermissions
                    .AnyAsync(dp => dp.DocumentId == documentId 
                                 && dp.UserId == userId
                                 && (int)dp.Level >= (int)requiredLevel);

                if (hasPermission) return true;

                // Check if user is document author
                var document = await _context.ProjectDocuments.FindAsync(documentId);
                if (document?.AuthorId == userId) return true;

                // Check if user has project access (which includes document access)
                if (document != null)
                {
                    return await CanAccessProjectAsync(userId, document.ProjectId, ProjectPermissionScope.Documents);
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking document access for user {UserId} and document {DocumentId}", userId, documentId);
                return false; // Fail securely
            }
        }

        public async Task<bool> CanModifyTaskAsync(string userId, string taskId)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null) return false;

                // Check if user is task assignee or reporter
                if (task.AssigneeId == userId || task.ReporterId == userId) return true;

                // Check if user can access the project
                return await CanAccessProjectAsync(userId, task.ProjectId, ProjectPermissionScope.Tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking task modification access for user {UserId} and task {TaskId}", userId, taskId);
                return false; // Fail securely
            }
        }

        #endregion

        #region Government Compliance

        public async Task<bool> ValidateSecurityClearanceAsync(string userId, SecurityClearance requiredClearance)
        {
            try
            {
                var user = await _context.CollaborationUsers.FindAsync(userId);
                if (user?.GovernmentClearance == null) return false;

                // Security clearance hierarchy validation
                var userClearanceLevel = GetClearanceLevel(user.GovernmentClearance.Value);
                var requiredClearanceLevel = GetClearanceLevel(requiredClearance);

                return userClearanceLevel >= requiredClearanceLevel;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating security clearance for user {UserId}", userId);
                return false; // Fail securely
            }
        }

        public async Task<List<string>> GetUserAccessibleEntitiesAsync(string userId, string entityType)
        {
            try
            {
                var accessibleEntities = new List<string>();

                switch (entityType.ToLower())
                {
                    case "project":
                        // Get projects where user is owner, participant, or team member
                        var userProjects = await _context.Projects
                            .Where(p => p.OwnerId == userId || 
                                       p.Participants.Any(pp => pp.UserId == userId && pp.IsActive) ||
                                       p.Team.Members.Any(tm => tm.UserId == userId && tm.IsActive))
                            .Select(p => p.Id)
                            .ToListAsync();
                        accessibleEntities.AddRange(userProjects);
                        break;

                    case "team":
                        var userTeams = await _context.Teams
                            .Where(t => t.Members.Any(tm => tm.UserId == userId && tm.IsActive))
                            .Select(t => t.Id)
                            .ToListAsync();
                        accessibleEntities.AddRange(userTeams);
                        break;

                    case "document":
                        var userDocuments = await _context.ProjectDocuments
                            .Where(d => d.AuthorId == userId ||
                                       d.Permissions.Any(dp => dp.UserId == userId))
                            .Select(d => d.Id)
                            .ToListAsync();
                        accessibleEntities.AddRange(userDocuments);
                        break;

                    case "task":
                        var userTasks = await _context.Tasks
                            .Where(t => t.AssigneeId == userId || t.ReporterId == userId)
                            .Select(t => t.Id)
                            .ToListAsync();
                        accessibleEntities.AddRange(userTasks);
                        break;
                }

                return accessibleEntities;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting accessible entities for user {UserId} and entity type {EntityType}", userId, entityType);
                throw;
            }
        }

        #endregion

        #region Private Helper Methods

        private async Task<List<Permission>> GetRolePermissionsAsync(UserRole role)
        {
            try
            {
                // Define role-based permissions
                var rolePermissionNames = GetRolePermissionNames(role);
                
                return await _context.Permissions
                    .Where(p => rolePermissionNames.Contains(p.Name))
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting role permissions for role {Role}", role);
                return new List<Permission>();
            }
        }

        private List<string> GetRolePermissionNames(UserRole role)
        {
            return role switch
            {
                UserRole.Administrator => new List<string>
                {
                    "system.admin",
                    "user.manage",
                    "team.manage", 
                    "project.manage",
                    "document.manage",
                    "audit.view"
                },
                UserRole.DepartmentHead => new List<string>
                {
                    "department.manage",
                    "team.manage",
                    "project.create",
                    "project.view",
                    "user.view",
                    "report.view"
                },
                UserRole.TeamLead => new List<string>
                {
                    "team.view",
                    "team.members.manage",
                    "project.create",
                    "project.manage",
                    "task.assign"
                },
                UserRole.ProjectManager => new List<string>
                {
                    "project.create",
                    "project.manage",
                    "task.manage",
                    "document.create",
                    "team.view"
                },
                UserRole.SeniorAnalyst => new List<string>
                {
                    "project.view",
                    "project.participate",
                    "task.create",
                    "task.manage",
                    "document.create",
                    "document.edit",
                    "report.create"
                },
                UserRole.Analyst => new List<string>
                {
                    "project.view",
                    "project.participate", 
                    "task.view",
                    "task.update",
                    "document.view",
                    "document.comment"
                },
                UserRole.Technician => new List<string>
                {
                    "project.view",
                    "task.view",
                    "task.update",
                    "document.view"
                },
                UserRole.Guest => new List<string>
                {
                    "project.view",
                    "document.view"
                },
                _ => new List<string>()
            };
        }

        private bool ValidatePermissionConditions(UserPermission userPermission, string? entityId)
        {
            if (string.IsNullOrEmpty(userPermission.ConditionsJson))
                return true;

            try
            {
                var conditions = JsonSerializer.Deserialize<List<PermissionConditionDto>>(userPermission.ConditionsJson);
                if (conditions == null || !conditions.Any())
                    return true;

                // Validate each condition
                foreach (var condition in conditions)
                {
                    if (!ValidateCondition(condition, entityId))
                        return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating permission conditions");
                return false; // Fail securely
            }
        }

        private bool ValidateCondition(PermissionConditionDto condition, string? entityId)
        {
            return condition.Type switch
            {
                ConditionType.TimeRange => ValidateTimeRangeCondition(condition),
                ConditionType.Department => ValidateDepartmentCondition(condition, entityId),
                ConditionType.Role => ValidateRoleCondition(condition),
                ConditionType.Clearance => ValidateClearanceCondition(condition),
                _ => true
            };
        }

        private bool ValidateTimeRangeCondition(PermissionConditionDto condition)
        {
            // Simplified time range validation
            var now = DateTime.UtcNow.TimeOfDay;
            return true; // Placeholder implementation
        }

        private bool ValidateDepartmentCondition(PermissionConditionDto condition, string? entityId)
        {
            // Simplified department validation
            return true; // Placeholder implementation
        }

        private bool ValidateRoleCondition(PermissionConditionDto condition)
        {
            // Simplified role validation
            return true; // Placeholder implementation
        }

        private bool ValidateClearanceCondition(PermissionConditionDto condition)
        {
            // Simplified clearance validation
            return true; // Placeholder implementation
        }

        private Task<bool> HasEntityPermissionAsync(string userId, string permissionName, string entityId)
        {
            // This would implement entity-specific permission checking
            // For example, checking if user has permission for specific project, document, etc.
            return System.Threading.Tasks.Task.FromResult(false); // Placeholder implementation
        }

        private int GetClearanceLevel(SecurityClearance clearance)
        {
            return clearance switch
            {
                SecurityClearance.Public => 1,
                SecurityClearance.Internal => 2,
                SecurityClearance.Confidential => 3,
                SecurityClearance.Secret => 4,
                SecurityClearance.TopSecret => 5,
                _ => 0
            };
        }

        private PermissionDto MapToPermissionDto(Permission permission)
        {
            return new PermissionDto
            {
                Id = permission.Id,
                Name = permission.Name,
                Description = permission.Description,
                Category = permission.Category,
                Level = permission.Level,
                Scope = permission.Scope,
                IsSystemPermission = permission.IsSystemPermission
            };
        }

        #endregion
    }
}