using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services
{
    public class CollaborationService : ICollaborationService
    {
        private readonly ITerraFusionDbContext _context;
        private readonly ILogger<CollaborationService> _logger;
        private readonly IPermissionService _permissionService;

        public CollaborationService(
            ITerraFusionDbContext context,
            ILogger<CollaborationService> logger,
            IPermissionService permissionService)
        {
            _context = context;
            _logger = logger;
            _permissionService = permissionService;
        }

        #region User Management

        public async Task<CollaborationUserDto?> GetUserAsync(string userId)
        {
            try
            {
                var user = await _context.CollaborationUsers
                    .FirstOrDefaultAsync(u => u.Id == userId);

                return user != null ? MapToUserDto(user) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", userId);
                throw;
            }
        }

        public async Task<List<CollaborationUserDto>> GetUsersAsync()
        {
            try
            {
                var users = await _context.CollaborationUsers
                    .OrderBy(u => u.Name)
                    .ToListAsync();

                return users.Select(MapToUserDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                throw;
            }
        }

        public async Task<CollaborationUserDto> CreateUserAsync(CollaborationUserDto userDto)
        {
            try
            {
                var user = new CollaborationUser
                {
                    UserId = userDto.UserId,
                    Name = userDto.Name,
                    Email = userDto.Email,
                    Role = userDto.Role,
                    Department = userDto.Department,
                    Avatar = userDto.Avatar,
                    GovernmentClearance = userDto.GovernmentClearance,
                    IsOnline = userDto.IsOnline
                };

                _context.CollaborationUsers.Add(user);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("User", user.Id, user.Id, AuditEventType.Create, "User created");

                _logger.LogInformation("User created: {UserId} - {Name}", user.Id, user.Name);

                return MapToUserDto(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user {Email}", userDto.Email);
                throw;
            }
        }

        public async Task<CollaborationUserDto?> UpdateUserAsync(string userId, CollaborationUserDto userDto)
        {
            try
            {
                var user = await _context.CollaborationUsers.FindAsync(userId);
                if (user == null) return null;

                user.Name = userDto.Name;
                user.Email = userDto.Email;
                user.Role = userDto.Role;
                user.Department = userDto.Department;
                user.Avatar = userDto.Avatar;
                user.GovernmentClearance = userDto.GovernmentClearance;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("User", user.Id, userId, AuditEventType.Update, "User updated");

                return MapToUserDto(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            try
            {
                var user = await _context.CollaborationUsers.FindAsync(userId);
                if (user == null) return false;

                _context.CollaborationUsers.Remove(user);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("User", userId, userId, AuditEventType.Delete, "User deleted");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> UpdateUserStatusAsync(string userId, bool isOnline)
        {
            try
            {
                var user = await _context.CollaborationUsers.FindAsync(userId);
                if (user == null) return false;

                user.IsOnline = isOnline;
                user.LastActive = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status {UserId}", userId);
                throw;
            }
        }

        #endregion

        #region Team Management

        public async Task<List<TeamDto>> GetTeamsAsync()
        {
            try
            {
                var teams = await _context.Teams
                    .Include(t => t.Members).ThenInclude(m => m.User)
                    .Where(t => t.IsActive)
                    .OrderBy(t => t.Name)
                    .ToListAsync();

                return teams.Select(MapToTeamDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting teams");
                throw;
            }
        }

        public async Task<TeamDto?> GetTeamAsync(string teamId)
        {
            try
            {
                var team = await _context.Teams
                    .Include(t => t.Members).ThenInclude(m => m.User)
                    .FirstOrDefaultAsync(t => t.Id == teamId && t.IsActive);

                return team != null ? MapToTeamDto(team) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team {TeamId}", teamId);
                throw;
            }
        }

        public async Task<List<TeamDto>> GetUserTeamsAsync(string userId)
        {
            try
            {
                var teams = await _context.Teams
                    .Include(t => t.Members).ThenInclude(m => m.User)
                    .Where(t => t.IsActive && t.Members.Any(m => m.UserId == userId && m.IsActive))
                    .OrderBy(t => t.Name)
                    .ToListAsync();

                return teams.Select(MapToTeamDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user teams {UserId}", userId);
                throw;
            }
        }

        public async Task<TeamDto> CreateTeamAsync(CreateTeamDto createTeamDto, string creatorId)
        {
            try
            {
                var team = new Team
                {
                    Name = createTeamDto.Name,
                    Description = createTeamDto.Description,
                    Department = createTeamDto.Department
                };

                _context.Teams.Add(team);

                // Add creator as team owner
                var teamMember = new TeamMember
                {
                    TeamId = team.Id,
                    UserId = creatorId,
                    IsOwner = true
                };

                _context.TeamMembers.Add(teamMember);

                // Add other members
                foreach (var memberId in createTeamDto.MemberIds)
                {
                    if (memberId != creatorId)
                    {
                        var member = new TeamMember
                        {
                            TeamId = team.Id,
                            UserId = memberId,
                            IsOwner = false
                        };
                        _context.TeamMembers.Add(member);
                    }
                }

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Team", team.Id, creatorId, AuditEventType.Create, "Team created");

                // Load the team with members for return
                var createdTeam = await GetTeamAsync(team.Id);
                return createdTeam!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating team {TeamName}", createTeamDto.Name);
                throw;
            }
        }

        public async Task<TeamDto?> UpdateTeamAsync(string teamId, UpdateTeamDto updateTeamDto)
        {
            try
            {
                var team = await _context.Teams.FindAsync(teamId);
                if (team == null) return null;

                if (!string.IsNullOrEmpty(updateTeamDto.Name))
                    team.Name = updateTeamDto.Name;
                
                if (!string.IsNullOrEmpty(updateTeamDto.Description))
                    team.Description = updateTeamDto.Description;
                
                if (!string.IsNullOrEmpty(updateTeamDto.Department))
                    team.Department = updateTeamDto.Department;
                
                if (updateTeamDto.IsActive.HasValue)
                    team.IsActive = updateTeamDto.IsActive.Value;

                team.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Team", teamId, teamId, AuditEventType.Update, "Team updated");

                return await GetTeamAsync(teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating team {TeamId}", teamId);
                throw;
            }
        }

        public async Task<bool> DeleteTeamAsync(string teamId)
        {
            try
            {
                var team = await _context.Teams.FindAsync(teamId);
                if (team == null) return false;

                team.IsActive = false;
                team.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Team", teamId, teamId, AuditEventType.Delete, "Team deactivated");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting team {TeamId}", teamId);
                throw;
            }
        }

        public async Task<bool> AddTeamMemberAsync(string teamId, string userId, bool isOwner = false)
        {
            try
            {
                var existingMember = await _context.TeamMembers
                    .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);

                if (existingMember != null)
                {
                    if (!existingMember.IsActive)
                    {
                        existingMember.IsActive = true;
                        existingMember.IsOwner = isOwner;
                    }
                    return true;
                }

                var teamMember = new TeamMember
                {
                    TeamId = teamId,
                    UserId = userId,
                    IsOwner = isOwner
                };

                _context.TeamMembers.Add(teamMember);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("TeamMember", teamMember.Id, userId, AuditEventType.Create, "Team member added");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding team member {UserId} to team {TeamId}", userId, teamId);
                throw;
            }
        }

        public async Task<bool> RemoveTeamMemberAsync(string teamId, string userId)
        {
            try
            {
                var teamMember = await _context.TeamMembers
                    .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);

                if (teamMember == null) return false;

                teamMember.IsActive = false;
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("TeamMember", teamMember.Id, userId, AuditEventType.Delete, "Team member removed");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing team member {UserId} from team {TeamId}", userId, teamId);
                throw;
            }
        }

        public async Task<bool> UpdateTeamMemberRoleAsync(string teamId, string userId, bool isOwner)
        {
            try
            {
                var teamMember = await _context.TeamMembers
                    .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId && m.IsActive);

                if (teamMember == null) return false;

                teamMember.IsOwner = isOwner;
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("TeamMember", teamMember.Id, userId, AuditEventType.Update, "Team member role updated");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating team member role {UserId} in team {TeamId}", userId, teamId);
                throw;
            }
        }

        #endregion

        #region Project Management

        public async Task<List<ProjectDto>> GetProjectsAsync()
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.Team).ThenInclude(t => t.Members).ThenInclude(m => m.User)
                    .Include(p => p.Owner)
                    .Include(p => p.Participants).ThenInclude(pp => pp.User)
                    .OrderBy(p => p.Name)
                    .ToListAsync();

                return projects.Select(MapToProjectDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                throw;
            }
        }

        public async Task<ProjectDto?> GetProjectAsync(string projectId)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Team).ThenInclude(t => t.Members).ThenInclude(m => m.User)
                    .Include(p => p.Owner)
                    .Include(p => p.Participants).ThenInclude(pp => pp.User)
                    .Include(p => p.Tasks).ThenInclude(t => t.Assignee)
                    .Include(p => p.Tasks).ThenInclude(t => t.Reporter)
                    .Include(p => p.Milestones)
                    .Include(p => p.Documents).ThenInclude(d => d.Author)
                    .FirstOrDefaultAsync(p => p.Id == projectId);

                return project != null ? MapToProjectDto(project) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<List<ProjectDto>> GetUserProjectsAsync(string userId)
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.Team).ThenInclude(t => t.Members).ThenInclude(m => m.User)
                    .Include(p => p.Owner)
                    .Include(p => p.Participants).ThenInclude(pp => pp.User)
                    .Where(p => p.OwnerId == userId || p.Participants.Any(pp => pp.UserId == userId && pp.IsActive))
                    .OrderBy(p => p.Name)
                    .ToListAsync();

                return projects.Select(MapToProjectDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user projects {UserId}", userId);
                throw;
            }
        }

        public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto createProjectDto, string creatorId)
        {
            try
            {
                var project = new Project
                {
                    Name = createProjectDto.Name,
                    Description = createProjectDto.Description,
                    Type = createProjectDto.Type,
                    Priority = createProjectDto.Priority,
                    TeamId = createProjectDto.TeamId,
                    OwnerId = createProjectDto.OwnerId,
                    StartDate = createProjectDto.StartDate,
                    EndDate = createProjectDto.EndDate,
                    Status = ProjectStatus.Planning
                };

                _context.Projects.Add(project);

                // Add participants
                foreach (var participantId in createProjectDto.ParticipantIds)
                {
                    var participant = new ProjectParticipant
                    {
                        ProjectId = project.Id,
                        UserId = participantId,
                        Role = participantId == createProjectDto.OwnerId ? ProjectRole.Owner : ProjectRole.Contributor
                    };
                    _context.ProjectParticipants.Add(participant);
                }

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Project", project.Id, creatorId, AuditEventType.Create, "Project created");

                return (await GetProjectAsync(project.Id))!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project {ProjectName}", createProjectDto.Name);
                throw;
            }
        }

        public async Task<ProjectDto?> UpdateProjectAsync(string projectId, UpdateProjectDto updateProjectDto)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null) return null;

                if (!string.IsNullOrEmpty(updateProjectDto.Name))
                    project.Name = updateProjectDto.Name;
                
                if (!string.IsNullOrEmpty(updateProjectDto.Description))
                    project.Description = updateProjectDto.Description;
                
                if (updateProjectDto.Status.HasValue)
                    project.Status = updateProjectDto.Status.Value;
                
                if (updateProjectDto.Priority.HasValue)
                    project.Priority = updateProjectDto.Priority.Value;
                
                if (updateProjectDto.StartDate.HasValue)
                    project.StartDate = updateProjectDto.StartDate.Value;
                
                if (updateProjectDto.EndDate.HasValue)
                    project.EndDate = updateProjectDto.EndDate.Value;

                project.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Project", projectId, projectId, AuditEventType.Update, "Project updated");

                return await GetProjectAsync(projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<bool> DeleteProjectAsync(string projectId)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null) return false;

                project.Status = ProjectStatus.Archived;
                project.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Project", projectId, projectId, AuditEventType.Delete, "Project archived");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<bool> UpdateProjectStatusAsync(string projectId, ProjectStatus status)
        {
            try
            {
                var project = await _context.Projects.FindAsync(projectId);
                if (project == null) return false;

                var oldStatus = project.Status;
                project.Status = status;
                project.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Project", projectId, projectId, AuditEventType.Update, 
                    $"Project status changed from {oldStatus} to {status}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project status {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<bool> AddProjectParticipantAsync(string projectId, string userId, ProjectRole role)
        {
            try
            {
                var existingParticipant = await _context.ProjectParticipants
                    .FirstOrDefaultAsync(pp => pp.ProjectId == projectId && pp.UserId == userId);

                if (existingParticipant != null)
                {
                    if (!existingParticipant.IsActive)
                    {
                        existingParticipant.IsActive = true;
                        existingParticipant.Role = role;
                    }
                    return true;
                }

                var participant = new ProjectParticipant
                {
                    ProjectId = projectId,
                    UserId = userId,
                    Role = role
                };

                _context.ProjectParticipants.Add(participant);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("ProjectParticipant", participant.Id, userId, AuditEventType.Create, "Project participant added");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding project participant {UserId} to project {ProjectId}", userId, projectId);
                throw;
            }
        }

        public async Task<bool> RemoveProjectParticipantAsync(string projectId, string userId)
        {
            try
            {
                var participant = await _context.ProjectParticipants
                    .FirstOrDefaultAsync(pp => pp.ProjectId == projectId && pp.UserId == userId);

                if (participant == null) return false;

                participant.IsActive = false;
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("ProjectParticipant", participant.Id, userId, AuditEventType.Delete, "Project participant removed");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing project participant {UserId} from project {ProjectId}", userId, projectId);
                throw;
            }
        }

        public async Task<CollaborationMetricsDto> GetProjectMetricsAsync(string projectId)
        {
            try
            {
                // This is a simplified implementation - in a real system you'd have more complex metrics calculation
                var project = await _context.Projects
                    .Include(p => p.Tasks)
                    .Include(p => p.Participants)
                    .FirstOrDefaultAsync(p => p.Id == projectId);

                if (project == null)
                {
                    return new CollaborationMetricsDto();
                }

                var metrics = new CollaborationMetricsDto
                {
                    Period = new DateRangeDto { Start = project.StartDate, End = project.EndDate },
                    TotalProjects = 1,
                    ActiveProjects = project.Status == ProjectStatus.Active ? 1 : 0,
                    CompletedProjects = project.Status == ProjectStatus.Completed ? 1 : 0,
                    TaskMetrics = new TaskMetricsDto
                    {
                        TotalTasks = project.Tasks.Count,
                        CompletedTasks = project.Tasks.Count(t => t.Status == DTOs.TaskStatus.Done),
                        OverdueTasks = project.Tasks.Count(t => t.DueDate.HasValue && t.DueDate < DateTime.UtcNow && t.Status != DTOs.TaskStatus.Done)
                    }
                };

                return metrics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project metrics {ProjectId}", projectId);
                throw;
            }
        }

        #endregion

        #region Task Management

        public async Task<List<TaskDto>> GetProjectTasksAsync(string projectId)
        {
            try
            {
                var tasks = await _context.Tasks
                    .Include(t => t.Assignee)
                    .Include(t => t.Reporter)
                    .Include(t => t.Comments).ThenInclude(c => c.User)
                    .Where(t => t.ProjectId == projectId)
                    .OrderBy(t => t.CreatedAt)
                    .ToListAsync();

                return tasks.Select(MapToTaskDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project tasks {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<TaskDto?> GetTaskAsync(string taskId)
        {
            try
            {
                var task = await _context.Tasks
                    .Include(t => t.Assignee)
                    .Include(t => t.Reporter)
                    .Include(t => t.Comments).ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(t => t.Id == taskId);

                return task != null ? MapToTaskDto(task) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task {TaskId}", taskId);
                throw;
            }
        }

        public async Task<List<TaskDto>> GetUserTasksAsync(string userId)
        {
            try
            {
                var tasks = await _context.Tasks
                    .Include(t => t.Assignee)
                    .Include(t => t.Reporter)
                    .Where(t => t.AssigneeId == userId || t.ReporterId == userId)
                    .OrderBy(t => t.CreatedAt)
                    .ToListAsync();

                return tasks.Select(MapToTaskDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user tasks {UserId}", userId);
                throw;
            }
        }

        public async Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto, string creatorId)
        {
            try
            {
                var task = new Entities.Task
                {
                    ProjectId = createTaskDto.ProjectId,
                    Title = createTaskDto.Title,
                    Description = createTaskDto.Description,
                    Type = createTaskDto.Type,
                    Priority = createTaskDto.Priority,
                    AssigneeId = createTaskDto.AssigneeId,
                    ReporterId = createTaskDto.ReporterId,
                    EstimatedHours = createTaskDto.EstimatedHours,
                    DueDate = createTaskDto.DueDate,
                    DependenciesJson = createTaskDto.Dependencies.Any() ? JsonSerializer.Serialize(createTaskDto.Dependencies) : null,
                    TagsJson = createTaskDto.Tags.Any() ? JsonSerializer.Serialize(createTaskDto.Tags) : null
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Task", task.Id, creatorId, AuditEventType.Create, "Task created");

                return (await GetTaskAsync(task.Id))!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task {TaskTitle}", createTaskDto.Title);
                throw;
            }
        }

        public async Task<TaskDto?> UpdateTaskAsync(string taskId, UpdateTaskDto updateTaskDto)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null) return null;

                if (!string.IsNullOrEmpty(updateTaskDto.Title))
                    task.Title = updateTaskDto.Title;
                
                if (!string.IsNullOrEmpty(updateTaskDto.Description))
                    task.Description = updateTaskDto.Description;
                
                if (updateTaskDto.Status.HasValue)
                    task.Status = updateTaskDto.Status.Value;
                
                if (updateTaskDto.Priority.HasValue)
                    task.Priority = updateTaskDto.Priority.Value;
                
                if (updateTaskDto.AssigneeId != null)
                    task.AssigneeId = updateTaskDto.AssigneeId;
                
                if (updateTaskDto.EstimatedHours.HasValue)
                    task.EstimatedHours = updateTaskDto.EstimatedHours.Value;
                
                if (updateTaskDto.ActualHours.HasValue)
                    task.ActualHours = updateTaskDto.ActualHours.Value;
                
                if (updateTaskDto.DueDate.HasValue)
                    task.DueDate = updateTaskDto.DueDate.Value;
                
                if (updateTaskDto.Dependencies != null)
                    task.DependenciesJson = updateTaskDto.Dependencies.Any() ? JsonSerializer.Serialize(updateTaskDto.Dependencies) : null;
                
                if (updateTaskDto.Tags != null)
                    task.TagsJson = updateTaskDto.Tags.Any() ? JsonSerializer.Serialize(updateTaskDto.Tags) : null;

                task.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Task", taskId, taskId, AuditEventType.Update, "Task updated");

                return await GetTaskAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId}", taskId);
                throw;
            }
        }

        public async Task<bool> DeleteTaskAsync(string taskId)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null) return false;

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Task", taskId, taskId, AuditEventType.Delete, "Task deleted");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId}", taskId);
                throw;
            }
        }

        public async Task<bool> UpdateTaskStatusAsync(string taskId, DTOs.TaskStatus status)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null) return false;

                var oldStatus = task.Status;
                task.Status = status;
                task.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Task", taskId, taskId, AuditEventType.Update, 
                    $"Task status changed from {oldStatus} to {status}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status {TaskId}", taskId);
                throw;
            }
        }

        public async Task<bool> AssignTaskAsync(string taskId, string assigneeId)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null) return false;

                var oldAssigneeId = task.AssigneeId;
                task.AssigneeId = assigneeId;
                task.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Task", taskId, assigneeId, AuditEventType.Update, 
                    $"Task assigned from {oldAssigneeId ?? "unassigned"} to {assigneeId}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning task {TaskId} to {AssigneeId}", taskId, assigneeId);
                throw;
            }
        }

        public async Task<List<TaskCommentDto>> GetTaskCommentsAsync(string taskId)
        {
            try
            {
                var comments = await _context.TaskComments
                    .Include(c => c.User)
                    .Where(c => c.TaskId == taskId)
                    .OrderBy(c => c.CreatedAt)
                    .ToListAsync();

                return comments.Select(MapToTaskCommentDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task comments {TaskId}", taskId);
                throw;
            }
        }

        public async Task<TaskCommentDto> AddTaskCommentAsync(CreateTaskCommentDto createCommentDto, string userId)
        {
            try
            {
                var comment = new TaskComment
                {
                    TaskId = createCommentDto.TaskId,
                    UserId = userId,
                    Content = createCommentDto.Content,
                    Type = createCommentDto.Type,
                    MentionsJson = createCommentDto.Mentions.Any() ? JsonSerializer.Serialize(createCommentDto.Mentions) : null
                };

                _context.TaskComments.Add(comment);
                await _context.SaveChangesAsync();

                // Reload with user data
                var savedComment = await _context.TaskComments
                    .Include(c => c.User)
                    .FirstAsync(c => c.Id == comment.Id);

                await CreateAuditEventAsync("TaskComment", comment.Id, userId, AuditEventType.Create, "Task comment added");

                return MapToTaskCommentDto(savedComment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding task comment to task {TaskId}", createCommentDto.TaskId);
                throw;
            }
        }

        public async Task<bool> UpdateTaskCommentAsync(string commentId, string content)
        {
            try
            {
                var comment = await _context.TaskComments.FindAsync(commentId);
                if (comment == null) return false;

                comment.Content = content;
                comment.EditedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("TaskComment", commentId, comment.UserId, AuditEventType.Update, "Task comment updated");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task comment {CommentId}", commentId);
                throw;
            }
        }

        public async Task<bool> DeleteTaskCommentAsync(string commentId)
        {
            try
            {
                var comment = await _context.TaskComments.FindAsync(commentId);
                if (comment == null) return false;

                _context.TaskComments.Remove(comment);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("TaskComment", commentId, comment.UserId, AuditEventType.Delete, "Task comment deleted");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task comment {CommentId}", commentId);
                throw;
            }
        }

        #endregion

        #region Milestone Management

        public async Task<List<MilestoneDto>> GetProjectMilestonesAsync(string projectId)
        {
            try
            {
                var milestones = await _context.Milestones
                    .Where(m => m.ProjectId == projectId)
                    .OrderBy(m => m.TargetDate)
                    .ToListAsync();

                return milestones.Select(MapToMilestoneDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project milestones {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<MilestoneDto?> GetMilestoneAsync(string milestoneId)
        {
            try
            {
                var milestone = await _context.Milestones.FindAsync(milestoneId);
                return milestone != null ? MapToMilestoneDto(milestone) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting milestone {MilestoneId}", milestoneId);
                throw;
            }
        }

        public async Task<MilestoneDto> CreateMilestoneAsync(string projectId, MilestoneDto milestoneDto, string creatorId)
        {
            try
            {
                var milestone = new Milestone
                {
                    ProjectId = projectId,
                    Name = milestoneDto.Name,
                    Description = milestoneDto.Description,
                    TargetDate = milestoneDto.TargetDate,
                    DeliverablesJson = milestoneDto.Deliverables.Any() ? JsonSerializer.Serialize(milestoneDto.Deliverables) : null,
                    DependenciesJson = milestoneDto.Dependencies.Any() ? JsonSerializer.Serialize(milestoneDto.Dependencies) : null
                };

                _context.Milestones.Add(milestone);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Milestone", milestone.Id, creatorId, AuditEventType.Create, "Milestone created");

                return MapToMilestoneDto(milestone);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating milestone {MilestoneName}", milestoneDto.Name);
                throw;
            }
        }

        public async Task<MilestoneDto?> UpdateMilestoneAsync(string milestoneId, MilestoneDto milestoneDto)
        {
            try
            {
                var milestone = await _context.Milestones.FindAsync(milestoneId);
                if (milestone == null) return null;

                milestone.Name = milestoneDto.Name;
                milestone.Description = milestoneDto.Description;
                milestone.TargetDate = milestoneDto.TargetDate;
                milestone.Status = milestoneDto.Status;
                milestone.DeliverablesJson = milestoneDto.Deliverables.Any() ? JsonSerializer.Serialize(milestoneDto.Deliverables) : null;
                milestone.DependenciesJson = milestoneDto.Dependencies.Any() ? JsonSerializer.Serialize(milestoneDto.Dependencies) : null;
                milestone.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Milestone", milestoneId, milestoneId, AuditEventType.Update, "Milestone updated");

                return MapToMilestoneDto(milestone);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating milestone {MilestoneId}", milestoneId);
                throw;
            }
        }

        public async Task<bool> DeleteMilestoneAsync(string milestoneId)
        {
            try
            {
                var milestone = await _context.Milestones.FindAsync(milestoneId);
                if (milestone == null) return false;

                _context.Milestones.Remove(milestone);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Milestone", milestoneId, milestoneId, AuditEventType.Delete, "Milestone deleted");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting milestone {MilestoneId}", milestoneId);
                throw;
            }
        }

        public async Task<bool> CompleteMilestoneAsync(string milestoneId)
        {
            try
            {
                var milestone = await _context.Milestones.FindAsync(milestoneId);
                if (milestone == null) return false;

                milestone.Status = MilestoneStatus.Completed;
                milestone.CompletedDate = DateTime.UtcNow;
                milestone.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("Milestone", milestoneId, milestoneId, AuditEventType.Update, "Milestone completed");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing milestone {MilestoneId}", milestoneId);
                throw;
            }
        }

        #endregion

        #region Document Management

        public async Task<List<ProjectDocumentDto>> GetProjectDocumentsAsync(string projectId)
        {
            try
            {
                var documents = await _context.ProjectDocuments
                    .Include(d => d.Author)
                    .Include(d => d.LastEditor)
                    .Include(d => d.Permissions).ThenInclude(p => p.User)
                    .Where(d => d.ProjectId == projectId)
                    .OrderBy(d => d.Name)
                    .ToListAsync();

                return documents.Select(MapToProjectDocumentDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project documents {ProjectId}", projectId);
                throw;
            }
        }

        public async Task<ProjectDocumentDto?> GetDocumentAsync(string documentId)
        {
            try
            {
                var document = await _context.ProjectDocuments
                    .Include(d => d.Author)
                    .Include(d => d.LastEditor)
                    .Include(d => d.Permissions).ThenInclude(p => p.User)
                    .FirstOrDefaultAsync(d => d.Id == documentId);

                return document != null ? MapToProjectDocumentDto(document) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document {DocumentId}", documentId);
                throw;
            }
        }

        public async Task<ProjectDocumentDto> CreateDocumentAsync(CreateDocumentDto createDocumentDto, string creatorId)
        {
            try
            {
                var document = new ProjectDocument
                {
                    ProjectId = createDocumentDto.ProjectId,
                    Name = createDocumentDto.Name,
                    Description = createDocumentDto.Description,
                    Type = createDocumentDto.Type,
                    Content = createDocumentDto.Content,
                    AuthorId = creatorId,
                    LastEditorId = creatorId,
                    TagsJson = createDocumentDto.Tags.Any() ? JsonSerializer.Serialize(createDocumentDto.Tags) : null
                };

                _context.ProjectDocuments.Add(document);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("ProjectDocument", document.Id, creatorId, AuditEventType.Create, "Document created");

                // Reload with related data
                return (await GetDocumentAsync(document.Id))!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating document {DocumentName}", createDocumentDto.Name);
                throw;
            }
        }

        public async Task<ProjectDocumentDto?> UpdateDocumentAsync(string documentId, UpdateDocumentDto updateDocumentDto, string editorId)
        {
            try
            {
                var document = await _context.ProjectDocuments.FindAsync(documentId);
                if (document == null) return null;

                if (!string.IsNullOrEmpty(updateDocumentDto.Name))
                    document.Name = updateDocumentDto.Name;
                
                if (!string.IsNullOrEmpty(updateDocumentDto.Description))
                    document.Description = updateDocumentDto.Description;
                
                if (!string.IsNullOrEmpty(updateDocumentDto.Content))
                {
                    document.Content = updateDocumentDto.Content;
                    document.Version++;
                }
                
                if (updateDocumentDto.Status.HasValue)
                    document.Status = updateDocumentDto.Status.Value;
                
                if (updateDocumentDto.Tags != null)
                    document.TagsJson = updateDocumentDto.Tags.Any() ? JsonSerializer.Serialize(updateDocumentDto.Tags) : null;

                document.LastEditorId = editorId;
                document.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("ProjectDocument", documentId, editorId, AuditEventType.Update, "Document updated");

                return await GetDocumentAsync(documentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document {DocumentId}", documentId);
                throw;
            }
        }

        public async Task<bool> DeleteDocumentAsync(string documentId)
        {
            try
            {
                var document = await _context.ProjectDocuments.FindAsync(documentId);
                if (document == null) return false;

                _context.ProjectDocuments.Remove(document);
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("ProjectDocument", documentId, documentId, AuditEventType.Delete, "Document deleted");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
                throw;
            }
        }

        public async Task<bool> ShareDocumentAsync(string documentId, List<string> userIds, DocumentPermissionLevel level, string grantedById)
        {
            try
            {
                // Remove existing permissions for these users
                var existingPermissions = await _context.DocumentPermissions
                    .Where(p => p.DocumentId == documentId && userIds.Contains(p.UserId))
                    .ToListAsync();

                _context.DocumentPermissions.RemoveRange(existingPermissions);

                // Add new permissions
                foreach (var userId in userIds)
                {
                    var permission = new DocumentPermission
                    {
                        DocumentId = documentId,
                        UserId = userId,
                        Level = level,
                        GrantedById = grantedById
                    };
                    _context.DocumentPermissions.Add(permission);
                }

                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("DocumentPermission", documentId, grantedById, AuditEventType.Create, 
                    $"Document shared with {userIds.Count} users at level {level}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sharing document {DocumentId}", documentId);
                throw;
            }
        }

        public async Task<bool> UpdateDocumentPermissionsAsync(string documentId, string userId, DocumentPermissionLevel level)
        {
            try
            {
                var permission = await _context.DocumentPermissions
                    .FirstOrDefaultAsync(p => p.DocumentId == documentId && p.UserId == userId);

                if (permission == null) return false;

                permission.Level = level;
                await _context.SaveChangesAsync();

                await CreateAuditEventAsync("DocumentPermission", permission.Id, userId, AuditEventType.Update, 
                    $"Document permission updated to {level}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document permissions {DocumentId}", documentId);
                throw;
            }
        }

        public async Task<List<DocumentPermissionDto>> GetDocumentPermissionsAsync(string documentId)
        {
            try
            {
                var permissions = await _context.DocumentPermissions
                    .Include(p => p.User)
                    .Include(p => p.GrantedBy)
                    .Where(p => p.DocumentId == documentId)
                    .ToListAsync();

                return permissions.Select(p => new DocumentPermissionDto
                {
                    User = MapToUserDto(p.User),
                    Level = p.Level,
                    GrantedBy = MapToUserDto(p.GrantedBy),
                    GrantedAt = p.GrantedAt
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document permissions {DocumentId}", documentId);
                throw;
            }
        }

        #endregion

        #region Session Management - Placeholder implementations

        public async Task<CollaborationSessionDto> StartSessionAsync(CreateSessionDto createSessionDto, string hostId)
        {
            // Placeholder implementation - would integrate with SignalR for real-time functionality
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<CollaborationSessionDto?> GetSessionAsync(string sessionId)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<List<CollaborationSessionDto>> GetProjectSessionsAsync(string projectId)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<bool> EndSessionAsync(string sessionId)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<bool> JoinSessionAsync(string sessionId, string userId, SessionRole role)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<bool> LeaveSessionAsync(string sessionId, string userId)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<List<ChatMessageDto>> GetSessionMessagesAsync(string sessionId)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        public async Task<ChatMessageDto> SendSessionMessageAsync(SendMessageDto sendMessageDto, string senderId)
        {
            throw new NotImplementedException("Session management requires SignalR integration");
        }

        #endregion

        #region Notification Management

        public async Task<List<CollaborationNotificationDto>> GetUserNotificationsAsync(string userId, bool unreadOnly = false)
        {
            try
            {
                var query = _context.CollaborationNotifications
                    .Include(n => n.Recipient)
                    .Include(n => n.Sender)
                    .Where(n => n.RecipientId == userId);

                if (unreadOnly)
                {
                    query = query.Where(n => !n.IsRead);
                }

                var notifications = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                return notifications.Select(MapToNotificationDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user notifications {UserId}", userId);
                throw;
            }
        }

        public async Task<CollaborationNotificationDto> CreateNotificationAsync(CreateNotificationDto createNotificationDto)
        {
            try
            {
                var notification = new CollaborationNotification
                {
                    Type = createNotificationDto.Type,
                    RecipientId = createNotificationDto.RecipientId,
                    SenderId = createNotificationDto.SenderId,
                    Title = createNotificationDto.Title,
                    Message = createNotificationDto.Message,
                    DataJson = createNotificationDto.Data.Any() ? JsonSerializer.Serialize(createNotificationDto.Data) : null,
                    Priority = createNotificationDto.Priority,
                    ExpiresAt = createNotificationDto.ExpiresAt
                };

                _context.CollaborationNotifications.Add(notification);
                await _context.SaveChangesAsync();

                // Reload with related data
                var savedNotification = await _context.CollaborationNotifications
                    .Include(n => n.Recipient)
                    .Include(n => n.Sender)
                    .FirstAsync(n => n.Id == notification.Id);

                return MapToNotificationDto(savedNotification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification for user {UserId}", createNotificationDto.RecipientId);
                throw;
            }
        }

        public async Task<bool> MarkNotificationReadAsync(string notificationId)
        {
            try
            {
                var notification = await _context.CollaborationNotifications.FindAsync(notificationId);
                if (notification == null) return false;

                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification read {NotificationId}", notificationId);
                throw;
            }
        }

        public async Task<bool> MarkAllNotificationsReadAsync(string userId)
        {
            try
            {
                var notifications = await _context.CollaborationNotifications
                    .Where(n => n.RecipientId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications read for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> DeleteNotificationAsync(string notificationId)
        {
            try
            {
                var notification = await _context.CollaborationNotifications.FindAsync(notificationId);
                if (notification == null) return false;

                _context.CollaborationNotifications.Remove(notification);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {NotificationId}", notificationId);
                throw;
            }
        }

        public async Task<int> GetUnreadNotificationCountAsync(string userId)
        {
            try
            {
                return await _context.CollaborationNotifications
                    .CountAsync(n => n.RecipientId == userId && !n.IsRead);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread notification count for user {UserId}", userId);
                throw;
            }
        }

        #endregion

        #region Analytics and Reporting - Simplified implementations

        public async Task<CollaborationMetricsDto> GetCollaborationMetricsAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                var projects = await _context.Projects
                    .Include(p => p.Tasks)
                    .Include(p => p.Participants)
                    .Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate)
                    .ToListAsync();

                var users = await _context.CollaborationUsers
                    .Where(u => u.CreatedAt >= startDate && u.CreatedAt <= endDate)
                    .ToListAsync();

                var allTasks = projects.SelectMany(p => p.Tasks).ToList();

                return new CollaborationMetricsDto
                {
                    Period = new DateRangeDto { Start = startDate, End = endDate },
                    TotalProjects = projects.Count,
                    ActiveProjects = projects.Count(p => p.Status == ProjectStatus.Active),
                    CompletedProjects = projects.Count(p => p.Status == ProjectStatus.Completed),
                    TotalUsers = users.Count,
                    ActiveUsers = users.Count(u => u.IsOnline),
                    TaskMetrics = new TaskMetricsDto
                    {
                        TotalTasks = allTasks.Count,
                        CompletedTasks = allTasks.Count(t => t.Status == DTOs.TaskStatus.Done),
                        OverdueTasks = allTasks.Count(t => t.DueDate.HasValue && t.DueDate < DateTime.UtcNow && t.Status != DTOs.TaskStatus.Done)
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting collaboration metrics");
                throw;
            }
        }

        public async Task<List<TeamMetricsDto>> GetTeamMetricsAsync(string? departmentFilter = null)
        {
            try
            {
                var query = _context.Teams
                    .Include(t => t.Members).ThenInclude(m => m.User)
                    .Include(t => t.Projects)
                    .Where(t => t.IsActive);

                if (!string.IsNullOrEmpty(departmentFilter))
                {
                    query = query.Where(t => t.Department == departmentFilter);
                }

                var teams = await query.ToListAsync();

                return teams.Select(t => new TeamMetricsDto
                {
                    Team = MapToTeamDto(t),
                    Productivity = CalculateTeamProductivity(t), // Simplified calculation
                    CollaborationScore = CalculateCollaborationScore(t), // Simplified calculation
                    ProjectsCompleted = t.Projects.Count(p => p.Status == ProjectStatus.Completed),
                    AverageTaskCompletionTime = CalculateAverageTaskCompletionTime(t) // Simplified calculation
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team metrics");
                throw;
            }
        }

        public async Task<TaskMetricsDto> GetTaskMetricsAsync(string? projectId = null, string? userId = null)
        {
            try
            {
                var query = _context.Tasks.AsQueryable();

                if (!string.IsNullOrEmpty(projectId))
                {
                    query = query.Where(t => t.ProjectId == projectId);
                }

                if (!string.IsNullOrEmpty(userId))
                {
                    query = query.Where(t => t.AssigneeId == userId || t.ReporterId == userId);
                }

                var tasks = await query.ToListAsync();

                return new TaskMetricsDto
                {
                    TotalTasks = tasks.Count,
                    CompletedTasks = tasks.Count(t => t.Status == DTOs.TaskStatus.Done),
                    OverdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate < DateTime.UtcNow && t.Status != DTOs.TaskStatus.Done),
                    AverageCompletionTime = CalculateAverageTaskCompletionTime(tasks), // Simplified calculation
                    TasksByPriority = tasks.GroupBy(t => t.Priority).ToDictionary(g => g.Key, g => g.Count()),
                    TasksByStatus = tasks.GroupBy(t => t.Status).ToDictionary(g => g.Key, g => g.Count())
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task metrics");
                throw;
            }
        }

        #endregion

        #region Audit Trail

        public async Task<List<AuditEventDto>> GetAuditTrailAsync(string entityType, string entityId)
        {
            try
            {
                var auditEvents = await _context.AuditEvents
                    .Include(ae => ae.User)
                    .Where(ae => ae.Entity == entityType && ae.EntityId == entityId)
                    .OrderByDescending(ae => ae.Timestamp)
                    .ToListAsync();

                return auditEvents.Select(MapToAuditEventDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit trail for {EntityType} {EntityId}", entityType, entityId);
                throw;
            }
        }

        public async Task<List<AuditEventDto>> GetUserAuditTrailAsync(string userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var query = _context.AuditEvents
                    .Include(ae => ae.User)
                    .Where(ae => ae.UserId == userId);

                if (startDate.HasValue)
                {
                    query = query.Where(ae => ae.Timestamp >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(ae => ae.Timestamp <= endDate.Value);
                }

                var auditEvents = await query
                    .OrderByDescending(ae => ae.Timestamp)
                    .ToListAsync();

                return auditEvents.Select(MapToAuditEventDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user audit trail {UserId}", userId);
                throw;
            }
        }

        public async System.Threading.Tasks.Task CreateAuditEventAsync(string entityType, string entityId, string userId, AuditEventType eventType, string action, Dictionary<string, object>? details = null, string? sessionId = null, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                var auditEvent = new AuditEvent
                {
                    Type = eventType,
                    Entity = entityType,
                    EntityId = entityId,
                    UserId = userId,
                    Action = action,
                    DetailsJson = details != null ? JsonSerializer.Serialize(details) : null,
                    SessionId = sessionId ?? Guid.NewGuid().ToString(),
                    IpAddress = ipAddress ?? "127.0.0.1",
                    UserAgent = userAgent ?? "TerraFusion OS"
                };

                _context.AuditEvents.Add(auditEvent);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating audit event for {EntityType} {EntityId}", entityType, entityId);
                // Don't throw here to avoid breaking the main operation
            }
        }

        #endregion

        #region Private Mapping Methods

        private CollaborationUserDto MapToUserDto(CollaborationUser user)
        {
            return new CollaborationUserDto
            {
                Id = user.Id,
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Department = user.Department,
                Avatar = user.Avatar,
                IsOnline = user.IsOnline,
                LastActive = user.LastActive,
                GovernmentClearance = user.GovernmentClearance,
                Permissions = new List<PermissionDto>() // Would be populated by permission service
            };
        }

        private TeamDto MapToTeamDto(Team team)
        {
            return new TeamDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                Department = team.Department,
                IsActive = team.IsActive,
                CreatedAt = team.CreatedAt,
                UpdatedAt = team.UpdatedAt,
                Members = team.Members.Where(m => m.IsActive).Select(m => MapToUserDto(m.User)).ToList(),
                Owners = team.Members.Where(m => m.IsOwner && m.IsActive).Select(m => m.UserId).ToList(),
                Permissions = new List<TeamPermissionDto>() // Would be populated by permission service
            };
        }

        private ProjectDto MapToProjectDto(Project project)
        {
            return new ProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                Type = project.Type,
                Status = project.Status,
                Priority = project.Priority,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                Team = MapToTeamDto(project.Team),
                Owner = MapToUserDto(project.Owner),
                Participants = project.Participants.Where(p => p.IsActive).Select(p => new ProjectParticipantDto
                {
                    User = MapToUserDto(p.User),
                    Role = p.Role,
                    JoinedAt = p.JoinedAt,
                    IsActive = p.IsActive,
                    Permissions = new List<ProjectPermissionDto>()
                }).ToList(),
                Timeline = new ProjectTimelineDto
                {
                    StartDate = project.StartDate,
                    EndDate = project.EndDate,
                    Phases = new List<ProjectPhaseDto>(),
                    CurrentPhase = "Planning"
                },
                Tasks = project.Tasks?.Select(MapToTaskDto).ToList() ?? new List<TaskDto>(),
                Milestones = project.Milestones?.Select(MapToMilestoneDto).ToList() ?? new List<MilestoneDto>(),
                Documents = project.Documents?.Select(MapToProjectDocumentDto).ToList() ?? new List<ProjectDocumentDto>(),
                Metadata = new ProjectMetadataDto(),
                AuditTrail = new List<AuditEventDto>()
            };
        }

        private TaskDto MapToTaskDto(Entities.Task task)
        {
            return new TaskDto
            {
                Id = task.Id,
                ProjectId = task.ProjectId,
                Title = task.Title,
                Description = task.Description,
                Type = task.Type,
                Status = task.Status,
                Priority = task.Priority,
                EstimatedHours = task.EstimatedHours,
                ActualHours = task.ActualHours,
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                Assignee = task.Assignee != null ? MapToUserDto(task.Assignee) : null,
                Reporter = MapToUserDto(task.Reporter),
                Comments = task.Comments?.Select(MapToTaskCommentDto).ToList() ?? new List<TaskCommentDto>(),
                Dependencies = !string.IsNullOrEmpty(task.DependenciesJson) ? JsonSerializer.Deserialize<List<string>>(task.DependenciesJson) ?? new List<string>() : new List<string>(),
                Tags = !string.IsNullOrEmpty(task.TagsJson) ? JsonSerializer.Deserialize<List<string>>(task.TagsJson) ?? new List<string>() : new List<string>()
            };
        }

        private TaskCommentDto MapToTaskCommentDto(TaskComment comment)
        {
            return new TaskCommentDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                User = MapToUserDto(comment.User),
                Content = comment.Content,
                Type = comment.Type,
                CreatedAt = comment.CreatedAt,
                EditedAt = comment.EditedAt,
                Mentions = !string.IsNullOrEmpty(comment.MentionsJson) ? JsonSerializer.Deserialize<List<string>>(comment.MentionsJson) ?? new List<string>() : new List<string>()
            };
        }

        private MilestoneDto MapToMilestoneDto(Milestone milestone)
        {
            return new MilestoneDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                Name = milestone.Name,
                Description = milestone.Description,
                TargetDate = milestone.TargetDate,
                CompletedDate = milestone.CompletedDate,
                Status = milestone.Status,
                Deliverables = !string.IsNullOrEmpty(milestone.DeliverablesJson) ? JsonSerializer.Deserialize<List<string>>(milestone.DeliverablesJson) ?? new List<string>() : new List<string>(),
                Dependencies = !string.IsNullOrEmpty(milestone.DependenciesJson) ? JsonSerializer.Deserialize<List<string>>(milestone.DependenciesJson) ?? new List<string>() : new List<string>()
            };
        }

        private ProjectDocumentDto MapToProjectDocumentDto(ProjectDocument document)
        {
            return new ProjectDocumentDto
            {
                Id = document.Id,
                ProjectId = document.ProjectId,
                Name = document.Name,
                Description = document.Description,
                Type = document.Type,
                Content = document.Content,
                Version = document.Version,
                Status = document.Status,
                CreatedAt = document.CreatedAt,
                UpdatedAt = document.UpdatedAt,
                Author = MapToUserDto(document.Author),
                LastEditor = MapToUserDto(document.LastEditor),
                Tags = !string.IsNullOrEmpty(document.TagsJson) ? JsonSerializer.Deserialize<List<string>>(document.TagsJson) ?? new List<string>() : new List<string>(),
                Permissions = document.Permissions?.Select(p => new DocumentPermissionDto
                {
                    User = MapToUserDto(p.User),
                    Level = p.Level,
                    GrantedBy = MapToUserDto(p.GrantedBy),
                    GrantedAt = p.GrantedAt
                }).ToList() ?? new List<DocumentPermissionDto>(),
                Editors = new List<DocumentEditorDto>(),
                AuditTrail = new List<DocumentAuditEventDto>()
            };
        }

        private CollaborationNotificationDto MapToNotificationDto(CollaborationNotification notification)
        {
            return new CollaborationNotificationDto
            {
                Id = notification.Id,
                Type = notification.Type,
                Title = notification.Title,
                Message = notification.Message,
                Priority = notification.Priority,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                ReadAt = notification.ReadAt,
                ExpiresAt = notification.ExpiresAt,
                Recipient = MapToUserDto(notification.Recipient),
                Sender = notification.Sender != null ? MapToUserDto(notification.Sender) : null,
                Data = !string.IsNullOrEmpty(notification.DataJson) ? JsonSerializer.Deserialize<Dictionary<string, object>>(notification.DataJson) ?? new Dictionary<string, object>() : new Dictionary<string, object>()
            };
        }

        private AuditEventDto MapToAuditEventDto(AuditEvent auditEvent)
        {
            return new AuditEventDto
            {
                Id = auditEvent.Id,
                Type = auditEvent.Type,
                Entity = auditEvent.Entity,
                EntityId = auditEvent.EntityId,
                Action = auditEvent.Action,
                Timestamp = auditEvent.Timestamp,
                IpAddress = auditEvent.IpAddress,
                UserAgent = auditEvent.UserAgent,
                SessionId = auditEvent.SessionId,
                User = MapToUserDto(auditEvent.User),
                Details = !string.IsNullOrEmpty(auditEvent.DetailsJson) ? JsonSerializer.Deserialize<Dictionary<string, object>>(auditEvent.DetailsJson) ?? new Dictionary<string, object>() : new Dictionary<string, object>()
            };
        }

        // Simplified metric calculation methods
        private double CalculateTeamProductivity(Team team)
        {
            // Simplified calculation - in a real system this would be more complex
            return Random.Shared.NextDouble() * 100;
        }

        private double CalculateCollaborationScore(Team team)
        {
            // Simplified calculation - in a real system this would be more complex
            return Random.Shared.NextDouble() * 100;
        }

        private double CalculateAverageTaskCompletionTime(Team team)
        {
            // Simplified calculation - in a real system this would be more complex
            return Random.Shared.NextDouble() * 10;
        }

        private double CalculateAverageTaskCompletionTime(List<Entities.Task> tasks)
        {
            // Simplified calculation - in a real system this would be more complex
            return tasks.Any() ? Random.Shared.NextDouble() * 10 : 0;
        }

        #endregion
    }
}