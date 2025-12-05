using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Hubs
{
    /// <summary>
    /// TerraFusion OS 1.0 - CollaborationHub
    /// Government-Grade Real-time Collaboration Platform
    /// 
    /// SignalR Hub for real-time multi-user collaboration functionality
    /// integrating with 1,008-agent AI swarm and government compliance requirements.
    /// </summary>
    [Authorize]
    public class CollaborationHub : Hub
    {
        private readonly ICollaborationService _collaborationService;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<CollaborationHub> _logger;
        private static readonly Dictionary<string, UserConnectionInfo> _connections = new();
        private static readonly Dictionary<string, HashSet<string>> _projectGroups = new();
        private static readonly Dictionary<string, HashSet<string>> _teamGroups = new();
        private static readonly Dictionary<string, SessionInfo> _activeSessions = new();

        public CollaborationHub(
            ICollaborationService collaborationService,
            IPermissionService permissionService,
            ILogger<CollaborationHub> logger)
        {
            _collaborationService = collaborationService;
            _permissionService = permissionService;
            _logger = logger;
        }

        #region Connection Management

        public override async Task OnConnectedAsync()
        {
            var userId = GetCurrentUserId();
            var connectionId = Context.ConnectionId;

            try
            {
                // Store user connection info
                var userInfo = new UserConnectionInfo
                {
                    UserId = userId,
                    ConnectionId = connectionId,
                    ConnectedAt = DateTime.UtcNow,
                    UserAgent = Context.GetHttpContext()?.Request.Headers.UserAgent.ToString() ?? "Unknown",
                    IpAddress = Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1"
                };

                _connections[connectionId] = userInfo;

                // Update user online status
                await _collaborationService.UpdateUserStatusAsync(userId, true);

                // Join user to their personal channel
                await Groups.AddToGroupAsync(connectionId, $"User_{userId}");

                // Auto-join user to their teams and projects
                await JoinUserContextGroups(userId, connectionId);

                // Notify other users that this user came online
                await Clients.All.SendAsync("UserStatusChanged", new { UserId = userId, IsOnline = true, ConnectedAt = DateTime.UtcNow });

                _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during connection for user {UserId}", userId);
                throw;
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connectionId = Context.ConnectionId;

            try
            {
                if (_connections.TryGetValue(connectionId, out var userInfo))
                {
                    var userId = userInfo.UserId;

                    // Remove from connection tracking
                    _connections.Remove(connectionId);

                    // Check if user has other active connections
                    var hasOtherConnections = _connections.Values.Any(c => c.UserId == userId);

                    if (!hasOtherConnections)
                    {
                        // Update user offline status only if no other connections
                        await _collaborationService.UpdateUserStatusAsync(userId, false);

                        // Notify other users that this user went offline
                        await Clients.All.SendAsync("UserStatusChanged", new { UserId = userId, IsOnline = false, DisconnectedAt = DateTime.UtcNow });
                    }

                    // Clean up any active sessions
                    await CleanupUserSessions(userId, connectionId);

                    _logger.LogInformation("User {UserId} disconnected from connection {ConnectionId}", userId, connectionId);
                }

                if (exception != null)
                {
                    _logger.LogError(exception, "User disconnected with error from connection {ConnectionId}", connectionId);
                }

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during disconnection for connection {ConnectionId}", connectionId);
            }
        }

        private async Task JoinUserContextGroups(string userId, string connectionId)
        {
            try
            {
                // Join user's teams
                var userTeams = await _collaborationService.GetUserTeamsAsync(userId);
                foreach (var team in userTeams)
                {
                    await Groups.AddToGroupAsync(connectionId, $"Team_{team.Id}");
                    
                    if (!_teamGroups.ContainsKey(team.Id))
                        _teamGroups[team.Id] = new HashSet<string>();
                    _teamGroups[team.Id].Add(connectionId);
                }

                // Join user's projects
                var userProjects = await _collaborationService.GetUserProjectsAsync(userId);
                foreach (var project in userProjects)
                {
                    await Groups.AddToGroupAsync(connectionId, $"Project_{project.Id}");
                    
                    if (!_projectGroups.ContainsKey(project.Id))
                        _projectGroups[project.Id] = new HashSet<string>();
                    _projectGroups[project.Id].Add(connectionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining user context groups for user {UserId}", userId);
            }
        }

        private async Task CleanupUserSessions(string userId, string connectionId)
        {
            try
            {
                // Remove from project groups
                foreach (var projectGroup in _projectGroups)
                {
                    projectGroup.Value.Remove(connectionId);
                }

                // Remove from team groups
                foreach (var teamGroup in _teamGroups)
                {
                    teamGroup.Value.Remove(connectionId);
                }

                // End any active collaboration sessions where user was participating
                var sessionsToEnd = _activeSessions.Values
                    .Where(s => s.Participants.ContainsKey(userId))
                    .ToList();

                foreach (var session in sessionsToEnd)
                {
                    await LeaveSession(session.SessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up sessions for user {UserId}", userId);
            }
        }

        #endregion

        #region Group Management

        /// <summary>
        /// Join a project channel for real-time updates
        /// </summary>
        public async Task JoinProjectChannel(string projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                // Check permissions
                if (!await _permissionService.CanAccessProjectAsync(userId, projectId))
                {
                    await Clients.Caller.SendAsync("Error", "Insufficient permissions to join this project channel");
                    return;
                }

                await Groups.AddToGroupAsync(connectionId, $"Project_{projectId}");
                
                if (!_projectGroups.ContainsKey(projectId))
                    _projectGroups[projectId] = new HashSet<string>();
                _projectGroups[projectId].Add(connectionId);

                await Clients.Caller.SendAsync("JoinedProjectChannel", projectId);
                await Clients.Group($"Project_{projectId}").SendAsync("UserJoinedProject", new { UserId = userId, ProjectId = projectId });

                _logger.LogDebug("User {UserId} joined project channel {ProjectId}", userId, projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining project channel {ProjectId}", projectId);
                await Clients.Caller.SendAsync("Error", "Failed to join project channel");
            }
        }

        /// <summary>
        /// Leave a project channel
        /// </summary>
        public async Task LeaveProjectChannel(string projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                await Groups.RemoveFromGroupAsync(connectionId, $"Project_{projectId}");
                
                if (_projectGroups.ContainsKey(projectId))
                {
                    _projectGroups[projectId].Remove(connectionId);
                }

                await Clients.Caller.SendAsync("LeftProjectChannel", projectId);
                await Clients.Group($"Project_{projectId}").SendAsync("UserLeftProject", new { UserId = userId, ProjectId = projectId });

                _logger.LogDebug("User {UserId} left project channel {ProjectId}", userId, projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving project channel {ProjectId}", projectId);
            }
        }

        /// <summary>
        /// Join a team channel for real-time updates
        /// </summary>
        public async Task JoinTeamChannel(string teamId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                // Check permissions
                if (!await _permissionService.CanAccessTeamAsync(userId, teamId))
                {
                    await Clients.Caller.SendAsync("Error", "Insufficient permissions to join this team channel");
                    return;
                }

                await Groups.AddToGroupAsync(connectionId, $"Team_{teamId}");
                
                if (!_teamGroups.ContainsKey(teamId))
                    _teamGroups[teamId] = new HashSet<string>();
                _teamGroups[teamId].Add(connectionId);

                await Clients.Caller.SendAsync("JoinedTeamChannel", teamId);
                await Clients.Group($"Team_{teamId}").SendAsync("UserJoinedTeam", new { UserId = userId, TeamId = teamId });

                _logger.LogDebug("User {UserId} joined team channel {TeamId}", userId, teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining team channel {TeamId}", teamId);
                await Clients.Caller.SendAsync("Error", "Failed to join team channel");
            }
        }

        /// <summary>
        /// Leave a team channel
        /// </summary>
        public async Task LeaveTeamChannel(string teamId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                await Groups.RemoveFromGroupAsync(connectionId, $"Team_{teamId}");
                
                if (_teamGroups.ContainsKey(teamId))
                {
                    _teamGroups[teamId].Remove(connectionId);
                }

                await Clients.Caller.SendAsync("LeftTeamChannel", teamId);
                await Clients.Group($"Team_{teamId}").SendAsync("UserLeftTeam", new { UserId = userId, TeamId = teamId });

                _logger.LogDebug("User {UserId} left team channel {TeamId}", userId, teamId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving team channel {TeamId}", teamId);
            }
        }

        #endregion

        #region Real-time Collaboration Sessions

        /// <summary>
        /// Start a real-time collaboration session
        /// </summary>
        public async Task StartCollaborationSession(string projectId, SessionType sessionType, string sessionName)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                // Check permissions
                if (!await _permissionService.CanAccessProjectAsync(userId, projectId, ProjectPermissionScope.All))
                {
                    await Clients.Caller.SendAsync("Error", "Insufficient permissions to start collaboration session");
                    return;
                }

                var sessionId = Guid.NewGuid().ToString();
                var session = new SessionInfo
                {
                    SessionId = sessionId,
                    ProjectId = projectId,
                    SessionType = sessionType,
                    Name = sessionName,
                    HostUserId = userId,
                    StartTime = DateTime.UtcNow,
                    Status = SessionStatus.Active,
                    Participants = new Dictionary<string, SessionParticipantInfo>()
                };

                // Add host as first participant
                session.Participants[userId] = new SessionParticipantInfo
                {
                    UserId = userId,
                    Role = SessionRole.Host,
                    JoinTime = DateTime.UtcNow,
                    ConnectionId = connectionId,
                    IsPresenting = false,
                    IsMuted = false,
                    HasVideo = false
                };

                _activeSessions[sessionId] = session;

                // Join session group
                await Groups.AddToGroupAsync(connectionId, $"Session_{sessionId}");

                // Notify project members about new session
                await Clients.Group($"Project_{projectId}").SendAsync("CollaborationSessionStarted", new
                {
                    SessionId = sessionId,
                    ProjectId = projectId,
                    SessionType = sessionType,
                    Name = sessionName,
                    HostUserId = userId,
                    StartTime = session.StartTime
                });

                await Clients.Caller.SendAsync("CollaborationSessionCreated", session);

                _logger.LogInformation("Collaboration session {SessionId} started by user {UserId} in project {ProjectId}", sessionId, userId, projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting collaboration session in project {ProjectId}", projectId);
                await Clients.Caller.SendAsync("Error", "Failed to start collaboration session");
            }
        }

        /// <summary>
        /// Join an existing collaboration session
        /// </summary>
        public async Task JoinSession(string sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    await Clients.Caller.SendAsync("Error", "Session not found or has ended");
                    return;
                }

                // Check permissions for the project
                if (!await _permissionService.CanAccessProjectAsync(userId, session.ProjectId))
                {
                    await Clients.Caller.SendAsync("Error", "Insufficient permissions to join this session");
                    return;
                }

                // Add participant
                session.Participants[userId] = new SessionParticipantInfo
                {
                    UserId = userId,
                    Role = SessionRole.Participant,
                    JoinTime = DateTime.UtcNow,
                    ConnectionId = connectionId,
                    IsPresenting = false,
                    IsMuted = true, // Default to muted when joining
                    HasVideo = false
                };

                // Join session group
                await Groups.AddToGroupAsync(connectionId, $"Session_{sessionId}");

                // Notify session participants
                await Clients.Group($"Session_{sessionId}").SendAsync("ParticipantJoined", new
                {
                    SessionId = sessionId,
                    UserId = userId,
                    JoinTime = DateTime.UtcNow
                });

                // Send current session state to new participant
                await Clients.Caller.SendAsync("SessionState", session);

                _logger.LogInformation("User {UserId} joined collaboration session {SessionId}", userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining session {SessionId}", sessionId);
                await Clients.Caller.SendAsync("Error", "Failed to join session");
            }
        }

        /// <summary>
        /// Leave a collaboration session
        /// </summary>
        public async Task LeaveSession(string sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    return; // Session doesn't exist, nothing to do
                }

                // Remove participant
                if (session.Participants.ContainsKey(userId))
                {
                    session.Participants.Remove(userId);

                    // Leave session group
                    await Groups.RemoveFromGroupAsync(connectionId, $"Session_{sessionId}");

                    // Notify remaining participants
                    await Clients.Group($"Session_{sessionId}").SendAsync("ParticipantLeft", new
                    {
                        SessionId = sessionId,
                        UserId = userId,
                        LeaveTime = DateTime.UtcNow
                    });

                    _logger.LogInformation("User {UserId} left collaboration session {SessionId}", userId, sessionId);
                }

                // If host leaves or no participants remain, end the session
                if (session.HostUserId == userId || session.Participants.Count == 0)
                {
                    await EndCollaborationSession(sessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving session {SessionId}", sessionId);
            }
        }

        /// <summary>
        /// End a collaboration session
        /// </summary>
        public async Task EndCollaborationSession(string sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    await Clients.Caller.SendAsync("Error", "Session not found");
                    return;
                }

                // Only host can end session
                if (session.HostUserId != userId)
                {
                    await Clients.Caller.SendAsync("Error", "Only the session host can end the session");
                    return;
                }

                session.Status = SessionStatus.Ended;
                session.EndTime = DateTime.UtcNow;

                // Notify all participants
                await Clients.Group($"Session_{sessionId}").SendAsync("CollaborationSessionEnded", new
                {
                    SessionId = sessionId,
                    EndTime = session.EndTime
                });

                // Remove all participants from session group
                foreach (var participant in session.Participants.Values)
                {
                    await Groups.RemoveFromGroupAsync(participant.ConnectionId, $"Session_{sessionId}");
                }

                // Remove from active sessions
                _activeSessions.Remove(sessionId);

                _logger.LogInformation("Collaboration session {SessionId} ended by host {UserId}", sessionId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ending session {SessionId}", sessionId);
                await Clients.Caller.SendAsync("Error", "Failed to end session");
            }
        }

        #endregion

        #region Session Communication

        /// <summary>
        /// Send message in collaboration session
        /// </summary>
        public async Task SendSessionMessage(string sessionId, string message, MessageType messageType = MessageType.Text, List<string>? mentions = null)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    await Clients.Caller.SendAsync("Error", "Session not found");
                    return;
                }

                if (!session.Participants.ContainsKey(userId))
                {
                    await Clients.Caller.SendAsync("Error", "You are not a participant in this session");
                    return;
                }

                var chatMessage = new SessionChatMessage
                {
                    Id = Guid.NewGuid().ToString(),
                    SessionId = sessionId,
                    UserId = userId,
                    Content = message,
                    MessageType = messageType,
                    Timestamp = DateTime.UtcNow,
                    Mentions = mentions ?? new List<string>()
                };

                // Broadcast message to all session participants
                await Clients.Group($"Session_{sessionId}").SendAsync("SessionMessageReceived", chatMessage);

                // Send mentions to specific users
                if (mentions != null && mentions.Any())
                {
                    foreach (var mentionedUserId in mentions)
                    {
                        await Clients.User(mentionedUserId).SendAsync("MessageMention", new
                        {
                            SessionId = sessionId,
                            Message = chatMessage,
                            MentionedBy = userId
                        });
                    }
                }

                _logger.LogDebug("Message sent in session {SessionId} by user {UserId}", sessionId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending session message in session {SessionId}", sessionId);
                await Clients.Caller.SendAsync("Error", "Failed to send message");
            }
        }

        /// <summary>
        /// Update participant media status (audio/video)
        /// </summary>
        public async Task UpdateMediaStatus(string sessionId, bool isMuted, bool hasVideo)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    await Clients.Caller.SendAsync("Error", "Session not found");
                    return;
                }

                if (session.Participants.TryGetValue(userId, out var participant))
                {
                    participant.IsMuted = isMuted;
                    participant.HasVideo = hasVideo;

                    // Notify all session participants of media status change
                    await Clients.Group($"Session_{sessionId}").SendAsync("ParticipantMediaStatusChanged", new
                    {
                        SessionId = sessionId,
                        UserId = userId,
                        IsMuted = isMuted,
                        HasVideo = hasVideo
                    });

                    _logger.LogDebug("Media status updated for user {UserId} in session {SessionId}: muted={IsMuted}, video={HasVideo}", 
                        userId, sessionId, isMuted, hasVideo);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating media status for user {UserId} in session {SessionId}", GetCurrentUserId(), sessionId);
            }
        }

        /// <summary>
        /// Start screen sharing
        /// </summary>
        public async Task StartScreenShare(string sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    await Clients.Caller.SendAsync("Error", "Session not found");
                    return;
                }

                if (!session.Participants.ContainsKey(userId))
                {
                    await Clients.Caller.SendAsync("Error", "You are not a participant in this session");
                    return;
                }

                // Check if someone else is already presenting
                var currentPresenter = session.Participants.Values.FirstOrDefault(p => p.IsPresenting);
                if (currentPresenter != null && currentPresenter.UserId != userId)
                {
                    await Clients.Caller.SendAsync("Error", $"User {currentPresenter.UserId} is already presenting");
                    return;
                }

                // Set user as presenting
                session.Participants[userId].IsPresenting = true;

                // Notify all session participants
                await Clients.Group($"Session_{sessionId}").SendAsync("ScreenShareStarted", new
                {
                    SessionId = sessionId,
                    PresenterId = userId,
                    StartTime = DateTime.UtcNow
                });

                _logger.LogInformation("Screen share started by user {UserId} in session {SessionId}", userId, sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting screen share for user {UserId} in session {SessionId}", GetCurrentUserId(), sessionId);
                await Clients.Caller.SendAsync("Error", "Failed to start screen share");
            }
        }

        /// <summary>
        /// Stop screen sharing
        /// </summary>
        public async Task StopScreenShare(string sessionId)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (!_activeSessions.TryGetValue(sessionId, out var session))
                {
                    await Clients.Caller.SendAsync("Error", "Session not found");
                    return;
                }

                if (session.Participants.TryGetValue(userId, out var participant) && participant.IsPresenting)
                {
                    participant.IsPresenting = false;

                    // Notify all session participants
                    await Clients.Group($"Session_{sessionId}").SendAsync("ScreenShareStopped", new
                    {
                        SessionId = sessionId,
                        PresenterId = userId,
                        StopTime = DateTime.UtcNow
                    });

                    _logger.LogInformation("Screen share stopped by user {UserId} in session {SessionId}", userId, sessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping screen share for user {UserId} in session {SessionId}", GetCurrentUserId(), sessionId);
            }
        }

        #endregion

        #region Typing Indicators

        /// <summary>
        /// Send typing indicator for task comments or documents
        /// </summary>
        public async Task SendTypingIndicator(string entityType, string entityId, bool isTyping)
        {
            try
            {
                var userId = GetCurrentUserId();
                var groupName = $"{entityType}_{entityId}";

                await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("TypingIndicator", new
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    UserId = userId,
                    IsTyping = isTyping,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending typing indicator for {EntityType} {EntityId}", entityType, entityId);
            }
        }

        #endregion

        #region Presence and Activity

        /// <summary>
        /// Update user presence information
        /// </summary>
        public async Task UpdatePresence(string status, string? customMessage = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var connectionId = Context.ConnectionId;

                if (_connections.TryGetValue(connectionId, out var userInfo))
                {
                    userInfo.Status = status;
                    userInfo.StatusMessage = customMessage;
                    userInfo.LastActivity = DateTime.UtcNow;

                    // Broadcast presence update to all users
                    await Clients.All.SendAsync("UserPresenceUpdated", new
                    {
                        UserId = userId,
                        Status = status,
                        StatusMessage = customMessage,
                        LastActivity = userInfo.LastActivity
                    });

                    _logger.LogDebug("Presence updated for user {UserId}: {Status}", userId, status);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating presence for user {UserId}", GetCurrentUserId());
            }
        }

        /// <summary>
        /// Get online users for a project
        /// </summary>
        public async Task GetProjectOnlineUsers(string projectId)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Check permissions
                if (!await _permissionService.CanAccessProjectAsync(userId, projectId))
                {
                    await Clients.Caller.SendAsync("Error", "Insufficient permissions to view project users");
                    return;
                }

                // Get connections in this project group
                var projectConnections = _projectGroups.ContainsKey(projectId) ? _projectGroups[projectId] : new HashSet<string>();
                var onlineUsers = _connections.Values
                    .Where(c => projectConnections.Contains(c.ConnectionId))
                    .Select(c => new
                    {
                        UserId = c.UserId,
                        Status = c.Status,
                        StatusMessage = c.StatusMessage,
                        LastActivity = c.LastActivity
                    })
                    .GroupBy(u => u.UserId)
                    .Select(g => g.First()) // Remove duplicates (user might have multiple connections)
                    .ToList();

                await Clients.Caller.SendAsync("ProjectOnlineUsers", new
                {
                    ProjectId = projectId,
                    OnlineUsers = onlineUsers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting online users for project {ProjectId}", projectId);
            }
        }

        #endregion

        #region Health Check and Diagnostics

        /// <summary>
        /// Ping method for connection health check
        /// </summary>
        public async Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
        }

        /// <summary>
        /// Get connection diagnostics (admin only)
        /// </summary>
        public async Task GetConnectionDiagnostics()
        {
            try
            {
                var userId = GetCurrentUserId();

                // Check admin permissions
                if (!await _permissionService.HasPermissionAsync(userId, "system.admin"))
                {
                    await Clients.Caller.SendAsync("Error", "Insufficient permissions for diagnostics");
                    return;
                }

                var diagnostics = new
                {
                    TotalConnections = _connections.Count,
                    ActiveSessions = _activeSessions.Count,
                    ProjectGroups = _projectGroups.Count,
                    TeamGroups = _teamGroups.Count,
                    Connections = _connections.Values.Select(c => new
                    {
                        c.UserId,
                        c.ConnectionId,
                        c.ConnectedAt,
                        c.LastActivity,
                        c.Status,
                        c.IpAddress,
                        c.UserAgent
                    }).ToList(),
                    Sessions = _activeSessions.Values.Select(s => new
                    {
                        s.SessionId,
                        s.ProjectId,
                        s.HostUserId,
                        s.SessionType,
                        s.Status,
                        ParticipantCount = s.Participants.Count,
                        s.StartTime,
                        s.EndTime
                    }).ToList()
                };

                await Clients.Caller.SendAsync("ConnectionDiagnostics", diagnostics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connection diagnostics");
            }
        }

        #endregion

        #region Helper Methods

        private string GetCurrentUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                   Context.User?.FindFirst("sub")?.Value ?? 
                   "anonymous";
        }

        private string GetCurrentUserEmail()
        {
            return Context.User?.FindFirst(ClaimTypes.Email)?.Value ?? "unknown@terrafusion.com";
        }

        #endregion

        #region Data Classes

        public class UserConnectionInfo
        {
            public string UserId { get; set; } = string.Empty;
            public string ConnectionId { get; set; } = string.Empty;
            public DateTime ConnectedAt { get; set; }
            public DateTime LastActivity { get; set; }
            public string Status { get; set; } = "Online";
            public string? StatusMessage { get; set; }
            public string IpAddress { get; set; } = string.Empty;
            public string UserAgent { get; set; } = string.Empty;
        }

        public class SessionInfo
        {
            public string SessionId { get; set; } = string.Empty;
            public string ProjectId { get; set; } = string.Empty;
            public SessionType SessionType { get; set; }
            public string Name { get; set; } = string.Empty;
            public string HostUserId { get; set; } = string.Empty;
            public SessionStatus Status { get; set; }
            public DateTime StartTime { get; set; }
            public DateTime? EndTime { get; set; }
            public Dictionary<string, SessionParticipantInfo> Participants { get; set; } = new();
        }

        public class SessionParticipantInfo
        {
            public string UserId { get; set; } = string.Empty;
            public string ConnectionId { get; set; } = string.Empty;
            public SessionRole Role { get; set; }
            public DateTime JoinTime { get; set; }
            public DateTime? LeaveTime { get; set; }
            public bool IsPresenting { get; set; }
            public bool IsMuted { get; set; }
            public bool HasVideo { get; set; }
        }

        public class SessionChatMessage
        {
            public string Id { get; set; } = string.Empty;
            public string SessionId { get; set; } = string.Empty;
            public string UserId { get; set; } = string.Empty;
            public string Content { get; set; } = string.Empty;
            public MessageType MessageType { get; set; }
            public DateTime Timestamp { get; set; }
            public List<string> Mentions { get; set; } = new();
        }

        #endregion
    }
}