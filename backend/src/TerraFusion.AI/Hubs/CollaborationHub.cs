/*
 * CollaborationHub - Multi-User Collaboration Management
 *
 * SignalR hub for multi-user sessions, presence tracking,
 * chat communication, and activity broadcasting.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 2
 */

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace TerraFusion.AI.Hubs;

/// <summary>
/// SignalR hub for multi-user collaboration
/// </summary>
public class CollaborationHub : Hub
{
    private readonly ILogger<CollaborationHub> _logger;

    // Track collaboration sessions
    private static readonly ConcurrentDictionary<string, CollaborationSession> _sessions = new();

    // Track user presence
    private static readonly ConcurrentDictionary<string, UserPresence> _userPresence = new();

    public CollaborationHub(ILogger<CollaborationHub> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Session Management

    /// <summary>
    /// Join a collaboration session
    /// </summary>
    public async Task JoinSession(string sessionId, UserInfo user)
    {
        var groupName = $"session_{sessionId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Get or create session
        var session = _sessions.GetOrAdd(sessionId, _ => new CollaborationSession
        {
            SessionId = sessionId,
            CreatedAt = DateTime.UtcNow,
            ActiveUsers = new ConcurrentDictionary<string, UserInfo>()
        });

        // Add user to session
        session.ActiveUsers[Context.ConnectionId] = user;
        session.LastActivityAt = DateTime.UtcNow;

        // Set user presence
        _userPresence[Context.ConnectionId] = new UserPresence
        {
            UserId = user.UserId,
            UserName = user.UserName,
            ConnectionId = Context.ConnectionId,
            SessionId = sessionId,
            Status = PresenceStatus.Active,
            JoinedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow
        };

        _logger.LogInformation("User {UserName} joined collaboration session {SessionId}",
            user.UserName, sessionId);

        // Notify other users
        await Clients.OthersInGroup(groupName).SendAsync("UserJoined", new
        {
            SessionId = sessionId,
            User = user,
            ConnectionId = Context.ConnectionId,
            JoinedAt = DateTime.UtcNow
        });

        // Send active users list to joining user
        var activeUsers = session.ActiveUsers.Values.ToList();
        await Clients.Caller.SendAsync("ActiveUsers", new
        {
            SessionId = sessionId,
            Users = activeUsers,
            TotalUsers = activeUsers.Count
        });

        // Update session statistics
        await BroadcastSessionStats(sessionId);
    }

    /// <summary>
    /// Leave a collaboration session
    /// </summary>
    public async Task LeaveSession(string sessionId)
    {
        var groupName = $"session_{sessionId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        // Remove user from session
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            if (session.ActiveUsers.TryRemove(Context.ConnectionId, out var user))
            {
                _logger.LogInformation("User {UserName} left collaboration session {SessionId}",
                    user.UserName, sessionId);

                // Notify other users
                await Clients.OthersInGroup(groupName).SendAsync("UserLeft", new
                {
                    SessionId = sessionId,
                    User = user,
                    ConnectionId = Context.ConnectionId,
                    LeftAt = DateTime.UtcNow
                });
            }

            // Clean up empty sessions
            if (session.ActiveUsers.IsEmpty)
            {
                _sessions.TryRemove(sessionId, out _);
                _logger.LogInformation("Collaboration session {SessionId} closed (no active users)", sessionId);
            }
            else
            {
                await BroadcastSessionStats(sessionId);
            }
        }

        // Remove user presence
        _userPresence.TryRemove(Context.ConnectionId, out _);
    }

    /// <summary>
    /// Get active users in session
    /// </summary>
    public Task<List<UserInfo>> GetActiveUsers(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            return Task.FromResult(session.ActiveUsers.Values.ToList());
        }

        return Task.FromResult(new List<UserInfo>());
    }

    /// <summary>
    /// Get session statistics
    /// </summary>
    public Task<object> GetSessionStats(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            var stats = new
            {
                SessionId = sessionId,
                ActiveUsers = session.ActiveUsers.Count,
                CreatedAt = session.CreatedAt,
                LastActivityAt = session.LastActivityAt,
                DurationMinutes = (DateTime.UtcNow - session.CreatedAt).TotalMinutes
            };

            return Task.FromResult<object>(stats);
        }

        return Task.FromResult<object>(new { SessionId = sessionId, Active = false });
    }

    #endregion

    #region Presence Tracking

    /// <summary>
    /// Update user presence status
    /// </summary>
    public async Task UpdatePresence(string sessionId, PresenceStatus status)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            presence.Status = status;
            presence.LastActivityAt = DateTime.UtcNow;

            await Clients.OthersInGroup($"session_{sessionId}").SendAsync("PresenceUpdated", new
            {
                ConnectionId = Context.ConnectionId,
                UserId = presence.UserId,
                UserName = presence.UserName,
                Status = status,
                UpdatedAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Broadcast user activity (heartbeat)
    /// </summary>
    public async Task SendHeartbeat(string sessionId)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            presence.LastActivityAt = DateTime.UtcNow;
        }

        if (_sessions.TryGetValue(sessionId, out var session))
        {
            session.LastActivityAt = DateTime.UtcNow;
        }

        // No broadcast for heartbeats (reduce network traffic)
    }

    /// <summary>
    /// Broadcast user is typing indicator
    /// </summary>
    public async Task SendTypingIndicator(string sessionId, bool isTyping, string? context = null)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            await Clients.OthersInGroup($"session_{sessionId}").SendAsync("TypingIndicator", new
            {
                UserId = presence.UserId,
                UserName = presence.UserName,
                IsTyping = isTyping,
                Context = context, // e.g., "chat", "notebook", "workflow"
                Timestamp = DateTime.UtcNow
            });
        }
    }

    #endregion

    #region Communication

    /// <summary>
    /// Send chat message to session
    /// </summary>
    public async Task SendChatMessage(string sessionId, ChatMessage message)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            var chatMessage = new
            {
                MessageId = Guid.NewGuid(),
                SessionId = sessionId,
                UserId = presence.UserId,
                UserName = presence.UserName,
                Content = message.Content,
                MessageType = message.MessageType, // text, code, image, file
                Timestamp = DateTime.UtcNow,
                Metadata = message.Metadata
            };

            _logger.LogDebug("Chat message from {UserName} in session {SessionId}: {Content}",
                presence.UserName, sessionId, message.Content);

            await Clients.Group($"session_{sessionId}").SendAsync("ChatMessageReceived", chatMessage);

            // Update session activity
            if (_sessions.TryGetValue(sessionId, out var session))
            {
                session.LastActivityAt = DateTime.UtcNow;
            }
        }
    }

    /// <summary>
    /// Send direct message to specific user
    /// </summary>
    public async Task SendDirectMessage(string targetConnectionId, DirectMessage message)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var senderPresence))
        {
            var directMessage = new
            {
                MessageId = Guid.NewGuid(),
                FromUserId = senderPresence.UserId,
                FromUserName = senderPresence.UserName,
                Content = message.Content,
                Timestamp = DateTime.UtcNow
            };

            await Clients.Client(targetConnectionId).SendAsync("DirectMessageReceived", directMessage);

            _logger.LogDebug("Direct message from {FromUser} to connection {ToConnection}",
                senderPresence.UserName, targetConnectionId);
        }
    }

    /// <summary>
    /// Broadcast notification to session
    /// </summary>
    public async Task BroadcastNotification(string sessionId, Notification notification)
    {
        await Clients.Group($"session_{sessionId}").SendAsync("NotificationReceived", new
        {
            NotificationId = Guid.NewGuid(),
            SessionId = sessionId,
            Type = notification.Type, // info, success, warning, error
            Title = notification.Title,
            Message = notification.Message,
            Timestamp = DateTime.UtcNow,
            Metadata = notification.Metadata
        });
    }

    #endregion

    #region Activity Broadcasting

    /// <summary>
    /// Broadcast user activity event
    /// </summary>
    public async Task BroadcastActivity(string sessionId, ActivityEvent activity)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            await Clients.OthersInGroup($"session_{sessionId}").SendAsync("ActivityBroadcast", new
            {
                ActivityId = Guid.NewGuid(),
                SessionId = sessionId,
                UserId = presence.UserId,
                UserName = presence.UserName,
                ActivityType = activity.Type, // cell_executed, file_saved, etc.
                Description = activity.Description,
                Metadata = activity.Metadata,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Broadcast cursor/pointer position
    /// </summary>
    public async Task BroadcastPointer(string sessionId, PointerPosition position)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            await Clients.OthersInGroup($"session_{sessionId}").SendAsync("PointerUpdate", new
            {
                UserId = presence.UserId,
                UserName = presence.UserName,
                Position = position,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Broadcast screen share started
    /// </summary>
    public async Task StartScreenShare(string sessionId)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            _logger.LogInformation("User {UserName} started screen sharing in session {SessionId}",
                presence.UserName, sessionId);

            await Clients.Group($"session_{sessionId}").SendAsync("ScreenShareStarted", new
            {
                UserId = presence.UserId,
                UserName = presence.UserName,
                ConnectionId = Context.ConnectionId,
                StartedAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Broadcast screen share stopped
    /// </summary>
    public async Task StopScreenShare(string sessionId)
    {
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            _logger.LogInformation("User {UserName} stopped screen sharing in session {SessionId}",
                presence.UserName, sessionId);

            await Clients.Group($"session_{sessionId}").SendAsync("ScreenShareStopped", new
            {
                UserId = presence.UserId,
                UserName = presence.UserName,
                StoppedAt = DateTime.UtcNow
            });
        }
    }

    #endregion

    #region Connection Management

    /// <summary>
    /// Handle disconnection cleanup
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Get user's session
        if (_userPresence.TryGetValue(Context.ConnectionId, out var presence))
        {
            var sessionId = presence.SessionId;

            // Remove from session
            if (_sessions.TryGetValue(sessionId, out var session))
            {
                if (session.ActiveUsers.TryRemove(Context.ConnectionId, out var user))
                {
                    _logger.LogInformation("User {UserName} disconnected from session {SessionId}",
                        user.UserName, sessionId);

                    // Notify other users
                    await Clients.Group($"session_{sessionId}").SendAsync("UserDisconnected", new
                    {
                        SessionId = sessionId,
                        User = user,
                        ConnectionId = Context.ConnectionId,
                        DisconnectedAt = DateTime.UtcNow
                    });

                    await BroadcastSessionStats(sessionId);
                }

                // Clean up empty sessions
                if (session.ActiveUsers.IsEmpty)
                {
                    _sessions.TryRemove(sessionId, out _);
                }
            }

            _userPresence.TryRemove(Context.ConnectionId, out _);
        }

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Helper Methods

    private async Task BroadcastSessionStats(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            await Clients.Group($"session_{sessionId}").SendAsync("SessionStatsUpdated", new
            {
                SessionId = sessionId,
                ActiveUsers = session.ActiveUsers.Count,
                LastActivityAt = session.LastActivityAt
            });
        }
    }

    #endregion
}

#region DTOs

/// <summary>
/// User information
/// </summary>
public record UserInfo(
    int UserId,
    string UserName,
    string? Avatar = null,
    string? Role = null);

/// <summary>
/// User presence information
/// </summary>
public class UserPresence
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public PresenceStatus Status { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
}

/// <summary>
/// Presence status enumeration
/// </summary>
public enum PresenceStatus
{
    Active,
    Away,
    Busy,
    Offline
}

/// <summary>
/// Collaboration session
/// </summary>
public class CollaborationSession
{
    public string SessionId { get; set; } = string.Empty;
    public ConcurrentDictionary<string, UserInfo> ActiveUsers { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
}

/// <summary>
/// Chat message
/// </summary>
public record ChatMessage(
    string Content,
    string MessageType = "text",
    Dictionary<string, object>? Metadata = null);

/// <summary>
/// Direct message
/// </summary>
public record DirectMessage(string Content);

/// <summary>
/// Notification
/// </summary>
public record Notification(
    string Type,
    string Title,
    string Message,
    Dictionary<string, object>? Metadata = null);

/// <summary>
/// Activity event
/// </summary>
public record ActivityEvent(
    string Type,
    string Description,
    Dictionary<string, object>? Metadata = null);

/// <summary>
/// Pointer position
/// </summary>
public record PointerPosition(
    int X,
    int Y,
    string? Context = null);

#endregion
