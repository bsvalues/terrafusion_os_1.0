using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using TerraFusion.API.Hubs;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using CollaborationTaskStatus = TerraFusion.Core.DTOs.TaskStatus;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// TerraFusion OS 1.0 - Collaboration API Controller
    /// Government-Grade Multi-User Collaboration Platform
    /// 
    /// Provides comprehensive REST API endpoints for enterprise collaboration functionality
    /// with real-time SignalR integration and government compliance features.
    /// </summary>
    [ApiController]
    [Route("api/collaboration")]
    [Authorize]
    public class CollaborationController : ControllerBase
    {
        private readonly ICollaborationService _collaborationService;
        private readonly IPermissionService _permissionService;
        private readonly IHubContext<CollaborationHub> _hubContext;
        private readonly ILogger<CollaborationController> _logger;

        public CollaborationController(
            ICollaborationService collaborationService,
            IPermissionService permissionService,
            IHubContext<CollaborationHub> hubContext,
            ILogger<CollaborationController> logger)
        {
            _collaborationService = collaborationService;
            _permissionService = permissionService;
            _hubContext = hubContext;
            _logger = logger;
        }

        #region User Management

        /// <summary>
        /// Get all collaboration users
        /// </summary>
        [HttpGet("users")]
        [ProducesResponseType(typeof(List<CollaborationUserDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<CollaborationUserDto>>> GetUsers()
        {
            try
            {
                var users = await _collaborationService.GetUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get specific collaboration user by ID
        /// </summary>
        [HttpGet("users/{userId}")]
        [ProducesResponseType(typeof(CollaborationUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<CollaborationUserDto>> GetUser(string userId)
        {
            try
            {
                var user = await _collaborationService.GetUserAsync(userId);
                if (user == null)
                    return NotFound($"User {userId} not found");

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create new collaboration user
        /// </summary>
        [HttpPost("users")]
        [ProducesResponseType(typeof(CollaborationUserDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<ActionResult<CollaborationUserDto>> CreateUser([FromBody] CollaborationUserDto userDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "user.create"))
                    return Forbid("Insufficient permissions to create users");

                var createdUser = await _collaborationService.CreateUserAsync(userDto);

                // Notify other users
                await _hubContext.Clients.All.SendAsync("UserCreated", createdUser);

                return CreatedAtAction(nameof(GetUser), new { userId = createdUser.Id }, createdUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update collaboration user
        /// </summary>
        [HttpPut("users/{userId}")]
        [ProducesResponseType(typeof(CollaborationUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<CollaborationUserDto>> UpdateUser(string userId, [FromBody] CollaborationUserDto userDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId && !await _permissionService.HasPermissionAsync(currentUserId, "user.manage"))
                    return Forbid("Insufficient permissions to update this user");

                var updatedUser = await _collaborationService.UpdateUserAsync(userId, userDto);
                if (updatedUser == null)
                    return NotFound($"User {userId} not found");

                // Notify other users
                await _hubContext.Clients.All.SendAsync("UserUpdated", updatedUser);

                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update user online status
        /// </summary>
        [HttpPut("users/{userId}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> UpdateUserStatus(string userId, [FromBody] bool isOnline)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId)
                    return Forbid("Can only update own status");

                var success = await _collaborationService.UpdateUserStatusAsync(userId, isOnline);
                if (!success)
                    return NotFound($"User {userId} not found");

                // Notify other users about status change
                await _hubContext.Clients.All.SendAsync("UserStatusChanged", new { UserId = userId, IsOnline = isOnline });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete collaboration user
        /// </summary>
        [HttpDelete("users/{userId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> DeleteUser(string userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "user.delete"))
                    return Forbid("Insufficient permissions to delete users");

                var success = await _collaborationService.DeleteUserAsync(userId);
                if (!success)
                    return NotFound($"User {userId} not found");

                // Notify other users
                await _hubContext.Clients.All.SendAsync("UserDeleted", userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get teams for a specific user
        /// </summary>
        [HttpGet("users/{userId}/teams")]
        [ProducesResponseType(typeof(List<TeamDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<TeamDto>>> GetUserTeams(string userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId && !await _permissionService.HasPermissionAsync(currentUserId, "user.view.teams"))
                    return Forbid("Insufficient permissions to view user teams");

                var teams = await _collaborationService.GetUserTeamsAsync(userId);
                return Ok(teams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user teams {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get projects for a specific user
        /// </summary>
        [HttpGet("users/{userId}/projects")]
        [ProducesResponseType(typeof(List<ProjectDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<ProjectDto>>> GetUserProjects(string userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId && !await _permissionService.HasPermissionAsync(currentUserId, "user.view.projects"))
                    return Forbid("Insufficient permissions to view user projects");

                var projects = await _collaborationService.GetUserProjectsAsync(userId);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user projects {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get tasks for a specific user
        /// </summary>
        [HttpGet("users/{userId}/tasks")]
        [ProducesResponseType(typeof(List<TaskDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> GetUserTasks(string userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId && !await _permissionService.HasPermissionAsync(currentUserId, "user.view.tasks"))
                    return Forbid("Insufficient permissions to view user tasks");

                var tasks = await _collaborationService.GetUserTasksAsync(userId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user tasks {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get notifications for a specific user
        /// </summary>
        [HttpGet("users/{userId}/notifications")]
        [ProducesResponseType(typeof(List<CollaborationNotificationDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<CollaborationNotificationDto>>> GetUserNotifications(
            string userId, 
            [FromQuery] bool unreadOnly = false)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId)
                    return Forbid("Can only view own notifications");

                var notifications = await _collaborationService.GetUserNotificationsAsync(userId, unreadOnly);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user notifications {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Team Management

        /// <summary>
        /// Get all teams
        /// </summary>
        [HttpGet("teams")]
        [ProducesResponseType(typeof(List<TeamDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<TeamDto>>> GetTeams()
        {
            try
            {
                var teams = await _collaborationService.GetTeamsAsync();
                return Ok(teams);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting teams");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get specific team by ID
        /// </summary>
        [HttpGet("teams/{teamId}")]
        [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<TeamDto>> GetTeam(string teamId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessTeamAsync(currentUserId, teamId))
                    return Forbid("Insufficient permissions to view this team");

                var team = await _collaborationService.GetTeamAsync(teamId);
                if (team == null)
                    return NotFound($"Team {teamId} not found");

                return Ok(team);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team {TeamId}", teamId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create new team
        /// </summary>
        [HttpPost("teams")]
        [ProducesResponseType(typeof(TeamDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<ActionResult<TeamDto>> CreateTeam([FromBody] CreateTeamDto createTeamDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "team.create"))
                    return Forbid("Insufficient permissions to create teams");

                var createdTeam = await _collaborationService.CreateTeamAsync(createTeamDto, currentUserId);

                // Notify team members
                await _hubContext.Clients.Group($"Team_{createdTeam.Id}").SendAsync("TeamCreated", createdTeam);

                return CreatedAtAction(nameof(GetTeam), new { teamId = createdTeam.Id }, createdTeam);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating team");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update team
        /// </summary>
        [HttpPut("teams/{teamId}")]
        [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<TeamDto>> UpdateTeam(string teamId, [FromBody] UpdateTeamDto updateTeamDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "team.manage", teamId))
                    return Forbid("Insufficient permissions to update this team");

                var updatedTeam = await _collaborationService.UpdateTeamAsync(teamId, updateTeamDto);
                if (updatedTeam == null)
                    return NotFound($"Team {teamId} not found");

                // Notify team members
                await _hubContext.Clients.Group($"Team_{teamId}").SendAsync("TeamUpdated", updatedTeam);

                return Ok(updatedTeam);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating team {TeamId}", teamId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete team
        /// </summary>
        [HttpDelete("teams/{teamId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> DeleteTeam(string teamId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "team.delete", teamId))
                    return Forbid("Insufficient permissions to delete this team");

                var success = await _collaborationService.DeleteTeamAsync(teamId);
                if (!success)
                    return NotFound($"Team {teamId} not found");

                // Notify team members
                await _hubContext.Clients.Group($"Team_{teamId}").SendAsync("TeamDeleted", teamId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting team {TeamId}", teamId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Add member to team
        /// </summary>
        [HttpPost("teams/{teamId}/members")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<IActionResult> AddTeamMember(string teamId, [FromBody] AddTeamMemberRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "team.members.manage", teamId))
                    return Forbid("Insufficient permissions to manage team members");

                var success = await _collaborationService.AddTeamMemberAsync(teamId, request.UserId, request.IsOwner);
                if (!success)
                    return BadRequest("Failed to add team member");

                // Notify team and user
                await _hubContext.Clients.Group($"Team_{teamId}").SendAsync("TeamMemberAdded", new { TeamId = teamId, UserId = request.UserId });
                await _hubContext.Clients.User(request.UserId).SendAsync("AddedToTeam", teamId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding team member {UserId} to team {TeamId}", request.UserId, teamId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Remove member from team
        /// </summary>
        [HttpDelete("teams/{teamId}/members/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> RemoveTeamMember(string teamId, string userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId && !await _permissionService.HasPermissionAsync(currentUserId, "team.members.manage", teamId))
                    return Forbid("Insufficient permissions to remove team members");

                var success = await _collaborationService.RemoveTeamMemberAsync(teamId, userId);
                if (!success)
                    return NotFound("Team member not found");

                // Notify team and user
                await _hubContext.Clients.Group($"Team_{teamId}").SendAsync("TeamMemberRemoved", new { TeamId = teamId, UserId = userId });
                await _hubContext.Clients.User(userId).SendAsync("RemovedFromTeam", teamId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing team member {UserId} from team {TeamId}", userId, teamId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Project Management

        /// <summary>
        /// Get all projects
        /// </summary>
        [HttpGet("projects")]
        [ProducesResponseType(typeof(List<ProjectDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<ProjectDto>>> GetProjects()
        {
            try
            {
                var projects = await _collaborationService.GetProjectsAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get specific project by ID
        /// </summary>
        [HttpGet("projects/{projectId}")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<ProjectDto>> GetProject(string projectId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessProjectAsync(currentUserId, projectId))
                    return Forbid("Insufficient permissions to view this project");

                var project = await _collaborationService.GetProjectAsync(projectId);
                if (project == null)
                    return NotFound($"Project {projectId} not found");

                return Ok(project);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create new project
        /// </summary>
        [HttpPost("projects")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto createProjectDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "project.create"))
                    return Forbid("Insufficient permissions to create projects");

                var createdProject = await _collaborationService.CreateProjectAsync(createProjectDto, currentUserId);

                // Notify project participants
                await _hubContext.Clients.Group($"Project_{createdProject.Id}").SendAsync("ProjectCreated", createdProject);

                return CreatedAtAction(nameof(GetProject), new { projectId = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update project
        /// </summary>
        [HttpPut("projects/{projectId}")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<ProjectDto>> UpdateProject(string projectId, [FromBody] UpdateProjectDto updateProjectDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessProjectAsync(currentUserId, projectId, ProjectPermissionScope.Settings))
                    return Forbid("Insufficient permissions to update this project");

                var updatedProject = await _collaborationService.UpdateProjectAsync(projectId, updateProjectDto);
                if (updatedProject == null)
                    return NotFound($"Project {projectId} not found");

                // Notify project participants
                await _hubContext.Clients.Group($"Project_{projectId}").SendAsync("ProjectUpdated", updatedProject);

                return Ok(updatedProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update project status
        /// </summary>
        [HttpPut("projects/{projectId}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> UpdateProjectStatus(string projectId, [FromBody] ProjectStatusUpdateRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessProjectAsync(currentUserId, projectId, ProjectPermissionScope.Settings))
                    return Forbid("Insufficient permissions to update project status");

                var success = await _collaborationService.UpdateProjectStatusAsync(projectId, request.Status);
                if (!success)
                    return NotFound($"Project {projectId} not found");

                // Notify project participants
                await _hubContext.Clients.Group($"Project_{projectId}").SendAsync("ProjectStatusChanged", new { ProjectId = projectId, Status = request.Status });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project status {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete project
        /// </summary>
        [HttpDelete("projects/{projectId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> DeleteProject(string projectId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "project.delete", projectId))
                    return Forbid("Insufficient permissions to delete this project");

                var success = await _collaborationService.DeleteProjectAsync(projectId);
                if (!success)
                    return NotFound($"Project {projectId} not found");

                // Notify project participants
                await _hubContext.Clients.Group($"Project_{projectId}").SendAsync("ProjectDeleted", projectId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get project tasks
        /// </summary>
        [HttpGet("projects/{projectId}/tasks")]
        [ProducesResponseType(typeof(List<TaskDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<TaskDto>>> GetProjectTasks(string projectId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessProjectAsync(currentUserId, projectId, ProjectPermissionScope.Tasks))
                    return Forbid("Insufficient permissions to view project tasks");

                var tasks = await _collaborationService.GetProjectTasksAsync(projectId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project tasks {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get project metrics
        /// </summary>
        [HttpGet("projects/{projectId}/metrics")]
        [ProducesResponseType(typeof(CollaborationMetricsDto), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<CollaborationMetricsDto>> GetProjectMetrics(string projectId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessProjectAsync(currentUserId, projectId))
                    return Forbid("Insufficient permissions to view project metrics");

                var metrics = await _collaborationService.GetProjectMetricsAsync(projectId);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project metrics {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Task Management

        /// <summary>
        /// Get specific task by ID
        /// </summary>
        [HttpGet("tasks/{taskId}")]
        [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<TaskDto>> GetTask(string taskId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to view this task");

                var task = await _collaborationService.GetTaskAsync(taskId);
                if (task == null)
                    return NotFound($"Task {taskId} not found");

                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create new task in project
        /// </summary>
        [HttpPost("projects/{projectId}/tasks")]
        [ProducesResponseType(typeof(TaskDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<ActionResult<TaskDto>> CreateTask(string projectId, [FromBody] CreateTaskDto createTaskDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (createTaskDto.ProjectId != projectId)
                    return BadRequest("Project ID mismatch");

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanAccessProjectAsync(currentUserId, projectId, ProjectPermissionScope.Tasks))
                    return Forbid("Insufficient permissions to create tasks in this project");

                var createdTask = await _collaborationService.CreateTaskAsync(createTaskDto, currentUserId);

                // Notify project participants
                await _hubContext.Clients.Group($"Project_{projectId}").SendAsync("TaskCreated", createdTask);

                // Notify assignee if different from creator
                if (!string.IsNullOrEmpty(createdTask.Assignee?.Id) && createdTask.Assignee.Id != currentUserId)
                {
                    await _hubContext.Clients.User(createdTask.Assignee.Id).SendAsync("TaskAssigned", createdTask);
                }

                return CreatedAtAction(nameof(GetTask), new { taskId = createdTask.Id }, createdTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task in project {ProjectId}", projectId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update task
        /// </summary>
        [HttpPut("tasks/{taskId}")]
        [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<ActionResult<TaskDto>> UpdateTask(string taskId, [FromBody] UpdateTaskDto updateTaskDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to update this task");

                var updatedTask = await _collaborationService.UpdateTaskAsync(taskId, updateTaskDto);
                if (updatedTask == null)
                    return NotFound($"Task {taskId} not found");

                // Notify project participants
                await _hubContext.Clients.Group($"Project_{updatedTask.ProjectId}").SendAsync("TaskUpdated", updatedTask);

                return Ok(updatedTask);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update task status
        /// </summary>
        [HttpPut("tasks/{taskId}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> UpdateTaskStatus(string taskId, [FromBody] TaskStatusUpdateRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to update this task");

                var success = await _collaborationService.UpdateTaskStatusAsync(taskId, request.Status);
                if (!success)
                    return NotFound($"Task {taskId} not found");

                // Get task details for notification
                var task = await _collaborationService.GetTaskAsync(taskId);
                if (task != null)
                {
                    // Notify project participants
                    await _hubContext.Clients.Group($"Project_{task.ProjectId}").SendAsync("TaskStatusChanged", 
                        new { TaskId = taskId, Status = request.Status });
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Assign task to user
        /// </summary>
        [HttpPut("tasks/{taskId}/assign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> AssignTask(string taskId, [FromBody] AssignTaskRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to assign this task");

                var success = await _collaborationService.AssignTaskAsync(taskId, request.AssigneeId);
                if (!success)
                    return NotFound($"Task {taskId} not found");

                // Get task details for notification
                var task = await _collaborationService.GetTaskAsync(taskId);
                if (task != null)
                {
                    // Notify project participants
                    await _hubContext.Clients.Group($"Project_{task.ProjectId}").SendAsync("TaskAssigned", 
                        new { TaskId = taskId, AssigneeId = request.AssigneeId });

                    // Notify assignee
                    await _hubContext.Clients.User(request.AssigneeId).SendAsync("TaskAssigned", task);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning task {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete task
        /// </summary>
        [HttpDelete("tasks/{taskId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> DeleteTask(string taskId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to delete this task");

                // Get task details before deletion for notification
                var task = await _collaborationService.GetTaskAsync(taskId);
                
                var success = await _collaborationService.DeleteTaskAsync(taskId);
                if (!success)
                    return NotFound($"Task {taskId} not found");

                // Notify project participants
                if (task != null)
                {
                    await _hubContext.Clients.Group($"Project_{task.ProjectId}").SendAsync("TaskDeleted", taskId);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get task comments
        /// </summary>
        [HttpGet("tasks/{taskId}/comments")]
        [ProducesResponseType(typeof(List<TaskCommentDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<TaskCommentDto>>> GetTaskComments(string taskId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to view task comments");

                var comments = await _collaborationService.GetTaskCommentsAsync(taskId);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task comments {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Add comment to task
        /// </summary>
        [HttpPost("tasks/{taskId}/comments")]
        [ProducesResponseType(typeof(TaskCommentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<ActionResult<TaskCommentDto>> AddTaskComment(string taskId, [FromBody] CreateTaskCommentDto createCommentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (createCommentDto.TaskId != taskId)
                    return BadRequest("Task ID mismatch");

                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.CanModifyTaskAsync(currentUserId, taskId))
                    return Forbid("Insufficient permissions to comment on this task");

                var createdComment = await _collaborationService.AddTaskCommentAsync(createCommentDto, currentUserId);

                // Get task details for notification
                var task = await _collaborationService.GetTaskAsync(taskId);
                if (task != null)
                {
                    // Notify project participants
                    await _hubContext.Clients.Group($"Project_{task.ProjectId}").SendAsync("TaskCommentAdded", createdComment);
                }

                return CreatedAtAction(nameof(GetTaskComments), new { taskId }, createdComment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding task comment to task {TaskId}", taskId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Notification Management

        /// <summary>
        /// Create notification
        /// </summary>
        [HttpPost("notifications")]
        [ProducesResponseType(typeof(CollaborationNotificationDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async System.Threading.Tasks.Task<ActionResult<CollaborationNotificationDto>> CreateNotification([FromBody] CreateNotificationDto createNotificationDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var currentUserId = GetCurrentUserId();
                createNotificationDto.SenderId = currentUserId;

                var createdNotification = await _collaborationService.CreateNotificationAsync(createNotificationDto);

                // Send real-time notification
                await _hubContext.Clients.User(createNotificationDto.RecipientId).SendAsync("NotificationReceived", createdNotification);

                return CreatedAtAction(nameof(GetUserNotifications), new { userId = createNotificationDto.RecipientId }, createdNotification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Mark notification as read
        /// </summary>
        [HttpPut("notifications/{notificationId}/read")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> MarkNotificationRead(string notificationId)
        {
            try
            {
                var success = await _collaborationService.MarkNotificationReadAsync(notificationId);
                if (!success)
                    return NotFound($"Notification {notificationId} not found");

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification read {NotificationId}", notificationId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Mark all notifications as read for user
        /// </summary>
        [HttpPut("users/{userId}/notifications/read-all")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<IActionResult> MarkAllNotificationsRead(string userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId)
                    return Forbid("Can only mark own notifications as read");

                var success = await _collaborationService.MarkAllNotificationsReadAsync(userId);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications read for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete notification
        /// </summary>
        [HttpDelete("notifications/{notificationId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async System.Threading.Tasks.Task<IActionResult> DeleteNotification(string notificationId)
        {
            try
            {
                var success = await _collaborationService.DeleteNotificationAsync(notificationId);
                if (!success)
                    return NotFound($"Notification {notificationId} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {NotificationId}", notificationId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Analytics and Reporting

        /// <summary>
        /// Get collaboration metrics for date range
        /// </summary>
        [HttpPost("metrics")]
        [ProducesResponseType(typeof(CollaborationMetricsDto), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<CollaborationMetricsDto>> GetCollaborationMetrics([FromBody] MetricsRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "analytics.view"))
                    return Forbid("Insufficient permissions to view analytics");

                var metrics = await _collaborationService.GetCollaborationMetricsAsync(request.StartDate, request.EndDate);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting collaboration metrics");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get team metrics
        /// </summary>
        [HttpGet("metrics/teams")]
        [ProducesResponseType(typeof(List<TeamMetricsDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<TeamMetricsDto>>> GetTeamMetrics([FromQuery] string? department = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "analytics.view"))
                    return Forbid("Insufficient permissions to view analytics");

                var metrics = await _collaborationService.GetTeamMetricsAsync(department);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting team metrics");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get task metrics
        /// </summary>
        [HttpGet("metrics/tasks")]
        [ProducesResponseType(typeof(TaskMetricsDto), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<TaskMetricsDto>> GetTaskMetrics([FromQuery] string? projectId = null, [FromQuery] string? userId = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "analytics.view"))
                    return Forbid("Insufficient permissions to view analytics");

                var metrics = await _collaborationService.GetTaskMetricsAsync(projectId, userId);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task metrics");
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Audit Trail

        /// <summary>
        /// Get audit trail for entity
        /// </summary>
        [HttpGet("audit/{entityType}/{entityId}")]
        [ProducesResponseType(typeof(List<AuditEventDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<AuditEventDto>>> GetAuditTrail(string entityType, string entityId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (!await _permissionService.HasPermissionAsync(currentUserId, "audit.view"))
                    return Forbid("Insufficient permissions to view audit trail");

                var auditTrail = await _collaborationService.GetAuditTrailAsync(entityType, entityId);
                return Ok(auditTrail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit trail for {EntityType} {EntityId}", entityType, entityId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get user audit trail
        /// </summary>
        [HttpGet("audit/users/{userId}")]
        [ProducesResponseType(typeof(List<AuditEventDto>), StatusCodes.Status200OK)]
        public async System.Threading.Tasks.Task<ActionResult<List<AuditEventDto>>> GetUserAuditTrail(
            string userId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId != userId && !await _permissionService.HasPermissionAsync(currentUserId, "audit.view"))
                    return Forbid("Insufficient permissions to view audit trail");

                var auditTrail = await _collaborationService.GetUserAuditTrailAsync(userId, startDate, endDate);
                return Ok(auditTrail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user audit trail {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Helper Methods

        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "anonymous";
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ?? "unknown@terrafusion.com";
        }

        private string GetClientIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }

        private string GetUserAgent()
        {
            return HttpContext.Request.Headers.UserAgent.ToString();
        }

        #endregion

        #region Request/Response Models

        public class AddTeamMemberRequest
        {
            public string UserId { get; set; } = string.Empty;
            public bool IsOwner { get; set; }
        }

        public class ProjectStatusUpdateRequest
        {
            public ProjectStatus Status { get; set; }
        }

        public class TaskStatusUpdateRequest
        {
            public CollaborationTaskStatus Status { get; set; }
        }

        public class AssignTaskRequest
        {
            public string AssigneeId { get; set; } = string.Empty;
        }

        public class MetricsRequest
        {
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
        }

        #endregion
    }
}