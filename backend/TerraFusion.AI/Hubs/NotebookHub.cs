/**
 * NotebookHub - Real-Time Notebook Collaboration
 *
 * SignalR hub for real-time notebook collaboration, live cell execution,
 * and multi-user cursor tracking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 1
 */

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Hubs;

/// <summary>
/// SignalR hub for real-time notebook collaboration
/// </summary>
public class NotebookHub : Hub
{
    private readonly IQuantumNotebookRepository _notebookRepository;
    private readonly ILogger<NotebookHub> _logger;

    // Track which users are in which notebooks
    private static readonly ConcurrentDictionary<int, HashSet<string>> _notebookUsers = new();

    // Track user cursors
    private static readonly ConcurrentDictionary<string, CursorPosition> _userCursors = new();

    public NotebookHub(
        IQuantumNotebookRepository notebookRepository,
        ILogger<NotebookHub> logger)
    {
        _notebookRepository = notebookRepository ?? throw new ArgumentNullException(nameof(notebookRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Connection Management

    /// <summary>
    /// Join a notebook collaboration session
    /// </summary>
    public async Task JoinNotebook(int notebookId, Guid userId, Guid countyId, string userName)
    {
        // Verify access to notebook
        var hasAccess = await _notebookRepository.HasAccessAsync(notebookId, userId, countyId);
        if (!hasAccess)
        {
            _logger.LogWarning("User {UserId} attempted to join notebook {NotebookId} without access", userId, notebookId);
            throw new HubException("Access denied to notebook");
        }

        // Add user to notebook group
        await Groups.AddToGroupAsync(Context.ConnectionId, $"notebook_{notebookId}");

        // Track user in notebook
        _notebookUsers.AddOrUpdate(
            notebookId,
            new HashSet<string> { Context.ConnectionId },
            (_, users) =>
            {
                users.Add(Context.ConnectionId);
                return users;
            });

        _logger.LogInformation("User {UserName} (connection {ConnectionId}) joined notebook {NotebookId}",
            userName, Context.ConnectionId, notebookId);

        // Notify other users
        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("UserJoined", new
        {
            ConnectionId = Context.ConnectionId,
            UserId = userId,
            UserName = userName,
            JoinedAt = DateTime.UtcNow
        });

        // Send current active users to joining user
        var activeUsers = GetActiveUsers(notebookId);
        await Clients.Caller.SendAsync("ActiveUsers", activeUsers);
    }

    /// <summary>
    /// Leave a notebook collaboration session
    /// </summary>
    public async Task LeaveNotebook(int notebookId, string userName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"notebook_{notebookId}");

        // Remove user from tracking
        if (_notebookUsers.TryGetValue(notebookId, out var users))
        {
            users.Remove(Context.ConnectionId);
            if (users.Count == 0)
            {
                _notebookUsers.TryRemove(notebookId, out _);
            }
        }

        _userCursors.TryRemove(Context.ConnectionId, out _);

        _logger.LogInformation("User {UserName} (connection {ConnectionId}) left notebook {NotebookId}",
            userName, Context.ConnectionId, notebookId);

        // Notify other users
        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("UserLeft", new
        {
            ConnectionId = Context.ConnectionId,
            UserName = userName,
            LeftAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Handle disconnection
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up user from all notebooks
        var notebooksToClean = _notebookUsers
            .Where(kvp => kvp.Value.Contains(Context.ConnectionId))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var notebookId in notebooksToClean)
        {
            if (_notebookUsers.TryGetValue(notebookId, out var users))
            {
                users.Remove(Context.ConnectionId);
                if (users.Count == 0)
                {
                    _notebookUsers.TryRemove(notebookId, out _);
                }
            }

            await Clients.Group($"notebook_{notebookId}").SendAsync("UserDisconnected", new
            {
                ConnectionId = Context.ConnectionId,
                DisconnectedAt = DateTime.UtcNow
            });
        }

        _userCursors.TryRemove(Context.ConnectionId, out _);

        _logger.LogInformation("Connection {ConnectionId} disconnected", Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Cell Operations

    /// <summary>
    /// Update cell content (broadcast to other users)
    /// </summary>
    public async Task UpdateCell(int notebookId, int cellIndex, string content, string cellType)
    {
        _logger.LogDebug("Cell {CellIndex} updated in notebook {NotebookId}", cellIndex, notebookId);

        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("CellUpdated", new
        {
            CellIndex = cellIndex,
            Content = content,
            CellType = cellType,
            UpdatedBy = Context.ConnectionId,
            UpdatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Execute cell and stream results with kernel execution service
    /// </summary>
    public async Task ExecuteCell(int notebookId, int cellIndex, string code, string language = "python")
    {
        _logger.LogInformation("Executing cell {CellIndex} in notebook {NotebookId} with language {Language}",
            cellIndex, notebookId, language);

        // Notify execution started
        await Clients.Group($"notebook_{notebookId}").SendAsync("CellExecutionStarted", new
        {
            CellIndex = cellIndex,
            Language = language,
            StartedAt = DateTime.UtcNow,
            ExecutedBy = Context.ConnectionId
        });

        try
        {
            // Note: For Phase 2 Week 5 Day 5 demo, using simulated execution
            // Production deployment will integrate KernelExecutionService
            // when python3/node/dotnet runtimes are available

            // Simulate streaming output
            await Task.Delay(50);
            await Clients.Group($"notebook_{notebookId}").SendAsync("StreamOutput", new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                OutputType = "stdout",
                Content = $"Executing {language} code...",
                Timestamp = DateTime.UtcNow
            });

            await Task.Delay(100);
            await Clients.Group($"notebook_{notebookId}").SendAsync("StreamOutput", new
            {
                NotebookId = notebookId,
                CellIndex = cellIndex,
                OutputType = "stdout",
                Content = "Processing complete.",
                Timestamp = DateTime.UtcNow
            });

            var result = new
            {
                Output = $"// Simulated execution result for cell {cellIndex}\n// Code:\n{code}\n// Status: Success",
                ExecutionTime = 150,
                Status = "success"
            };

            // Broadcast execution result
            await Clients.Group($"notebook_{notebookId}").SendAsync("CellExecutionCompleted", new
            {
                CellIndex = cellIndex,
                Result = result,
                CompletedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing cell {CellIndex} in notebook {NotebookId}", cellIndex, notebookId);

            await Clients.Group($"notebook_{notebookId}").SendAsync("CellExecutionFailed", new
            {
                CellIndex = cellIndex,
                Error = ex.Message,
                FailedAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Insert new cell
    /// </summary>
    public async Task InsertCell(int notebookId, int cellIndex, string cellType)
    {
        _logger.LogDebug("Inserting {CellType} cell at index {CellIndex} in notebook {NotebookId}",
            cellType, cellIndex, notebookId);

        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("CellInserted", new
        {
            CellIndex = cellIndex,
            CellType = cellType,
            InsertedBy = Context.ConnectionId,
            InsertedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Delete cell
    /// </summary>
    public async Task DeleteCell(int notebookId, int cellIndex)
    {
        _logger.LogDebug("Deleting cell {CellIndex} in notebook {NotebookId}", cellIndex, notebookId);

        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("CellDeleted", new
        {
            CellIndex = cellIndex,
            DeletedBy = Context.ConnectionId,
            DeletedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Move cell
    /// </summary>
    public async Task MoveCell(int notebookId, int fromIndex, int toIndex)
    {
        _logger.LogDebug("Moving cell from {FromIndex} to {ToIndex} in notebook {NotebookId}",
            fromIndex, toIndex, notebookId);

        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("CellMoved", new
        {
            FromIndex = fromIndex,
            ToIndex = toIndex,
            MovedBy = Context.ConnectionId,
            MovedAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Cursor Tracking

    /// <summary>
    /// Update cursor position
    /// </summary>
    public async Task UpdateCursor(int notebookId, CursorPosition position)
    {
        _userCursors[Context.ConnectionId] = position;

        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("CursorUpdated", new
        {
            ConnectionId = Context.ConnectionId,
            Position = position
        });
    }

    /// <summary>
    /// Update text selection
    /// </summary>
    public async Task UpdateSelection(int notebookId, SelectionRange selection)
    {
        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("SelectionUpdated", new
        {
            ConnectionId = Context.ConnectionId,
            Selection = selection
        });
    }

    #endregion

    #region Comments & Annotations

    /// <summary>
    /// Add comment to cell
    /// </summary>
    public async Task AddComment(int notebookId, int cellIndex, string comment, int userId, string userName)
    {
        _logger.LogInformation("Adding comment to cell {CellIndex} in notebook {NotebookId}", cellIndex, notebookId);

        var commentData = new
        {
            CellIndex = cellIndex,
            Comment = comment,
            UserId = userId,
            UserName = userName,
            CreatedAt = DateTime.UtcNow,
            CommentId = Guid.NewGuid()
        };

        await Clients.Group($"notebook_{notebookId}").SendAsync("CommentAdded", commentData);
    }

    /// <summary>
    /// Reply to comment
    /// </summary>
    public async Task ReplyToComment(int notebookId, Guid commentId, string reply, int userId, string userName)
    {
        _logger.LogDebug("Replying to comment {CommentId} in notebook {NotebookId}", commentId, notebookId);

        await Clients.Group($"notebook_{notebookId}").SendAsync("CommentReplyAdded", new
        {
            CommentId = commentId,
            Reply = reply,
            UserId = userId,
            UserName = userName,
            CreatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Delete comment
    /// </summary>
    public async Task DeleteComment(int notebookId, Guid commentId)
    {
        _logger.LogDebug("Deleting comment {CommentId} in notebook {NotebookId}", commentId, notebookId);

        await Clients.Group($"notebook_{notebookId}").SendAsync("CommentDeleted", new
        {
            CommentId = commentId,
            DeletedAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Collaboration Messages

    /// <summary>
    /// Broadcast message to all users in notebook
    /// </summary>
    public async Task BroadcastMessage(int notebookId, string message, string userName)
    {
        await Clients.Group($"notebook_{notebookId}").SendAsync("MessageReceived", new
        {
            Message = message,
            UserName = userName,
            ConnectionId = Context.ConnectionId,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Send typing indicator
    /// </summary>
    public async Task SendTypingIndicator(int notebookId, int cellIndex, bool isTyping)
    {
        await Clients.OthersInGroup($"notebook_{notebookId}").SendAsync("TypingIndicator", new
        {
            ConnectionId = Context.ConnectionId,
            CellIndex = cellIndex,
            IsTyping = isTyping
        });
    }

    #endregion

    #region Helper Methods

    private List<object> GetActiveUsers(int notebookId)
    {
        if (!_notebookUsers.TryGetValue(notebookId, out var connectionIds))
        {
            return new List<object>();
        }

        // Cast anonymous projections to object to satisfy List<object> return type
        return connectionIds
            .Select(connId => (object)new
            {
                ConnectionId = connId,
                CursorPosition = _userCursors.TryGetValue(connId, out var cursor) ? cursor : null
            })
            .ToList();
    }

    #endregion
}

#region DTOs

/// <summary>
/// Cursor position in notebook
/// </summary>
public record CursorPosition(int CellIndex, int Line, int Column);

/// <summary>
/// Text selection range
/// </summary>
public record SelectionRange(
    int CellIndex,
    int StartLine,
    int StartColumn,
    int EndLine,
    int EndColumn);

#endregion
