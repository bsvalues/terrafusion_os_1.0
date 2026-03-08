using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// In-memory whiteboard collaboration service providing real-time canvas management,
/// participant tracking, and element CRUD operations for collaborative sessions.
/// </summary>
public sealed class WhiteboardService : IWhiteboardService
{
    private readonly ILogger<WhiteboardService> _logger;

    private readonly ConcurrentDictionary<string, WhiteboardSessionDto> _sessions = new();
    private readonly ConcurrentDictionary<string, List<CanvasElementDto>> _canvases = new();
    private readonly ConcurrentDictionary<string, List<WhiteboardParticipantDto>> _participants = new();

    public WhiteboardService(ILogger<WhiteboardService> logger)
    {
        _logger = logger;
    }

    public Task<WhiteboardSessionDto?> GetWhiteboardSessionAsync(string sessionId)
    {
        _logger.LogDebug("GetWhiteboardSession: {SessionId}", sessionId);

        if (_sessions.TryGetValue(sessionId, out var session))
        {
            // Attach live canvas and participants
            session.Canvas = _canvases.GetValueOrDefault(sessionId) ?? new List<CanvasElementDto>();
            session.Participants = _participants.GetValueOrDefault(sessionId) ?? new List<WhiteboardParticipantDto>();
            return Task.FromResult<WhiteboardSessionDto?>(session);
        }

        return Task.FromResult<WhiteboardSessionDto?>(null);
    }

    public Task<WhiteboardSessionDto> CreateWhiteboardSessionAsync(string collaborationSessionId)
    {
        var id = Guid.NewGuid().ToString();
        _logger.LogInformation("CreateWhiteboardSession: {CollaborationSessionId} -> {WhiteboardId}", collaborationSessionId, id);

        var session = new WhiteboardSessionDto
        {
            Id = id,
            CollaborationSessionId = collaborationSessionId,
            Canvas = new List<CanvasElementDto>(),
            Participants = new List<WhiteboardParticipantDto>(),
            Version = 1,
            LastModified = DateTime.UtcNow
        };

        _sessions[id] = session;
        _canvases[id] = new List<CanvasElementDto>();
        _participants[id] = new List<WhiteboardParticipantDto>();

        return Task.FromResult(session);
    }

    public Task<bool> UpdateWhiteboardCanvasAsync(string whiteboardId, List<CanvasElementDto> elements, string userId)
    {
        _logger.LogDebug("UpdateWhiteboardCanvas: {WhiteboardId}, {Count} elements by {UserId}", whiteboardId, elements.Count, userId);

        if (!_sessions.TryGetValue(whiteboardId, out var session))
        {
            _logger.LogWarning("Whiteboard session not found: {WhiteboardId}", whiteboardId);
            return Task.FromResult(false);
        }

        _canvases[whiteboardId] = elements;
        session.Version++;
        session.LastModified = DateTime.UtcNow;

        return Task.FromResult(true);
    }

    public Task<bool> AddCanvasElementAsync(string whiteboardId, CanvasElementDto element, string userId)
    {
        _logger.LogDebug("AddCanvasElement: {WhiteboardId}, type={ElementType} by {UserId}", whiteboardId, element.Type, userId);

        if (!_sessions.TryGetValue(whiteboardId, out var session))
        {
            return Task.FromResult(false);
        }

        if (string.IsNullOrEmpty(element.Id))
            element.Id = Guid.NewGuid().ToString();

        element.CreatedBy = userId;
        element.CreatedAt = DateTime.UtcNow;

        var canvas = _canvases.GetOrAdd(whiteboardId, _ => new List<CanvasElementDto>());
        lock (canvas)
        {
            canvas.Add(element);
        }

        session.Version++;
        session.LastModified = DateTime.UtcNow;

        return Task.FromResult(true);
    }

    public Task<bool> UpdateCanvasElementAsync(string whiteboardId, string elementId, CanvasElementDto element, string userId)
    {
        _logger.LogDebug("UpdateCanvasElement: {WhiteboardId}/{ElementId} by {UserId}", whiteboardId, elementId, userId);

        if (!_sessions.TryGetValue(whiteboardId, out var session))
        {
            return Task.FromResult(false);
        }

        if (!_canvases.TryGetValue(whiteboardId, out var canvas))
        {
            return Task.FromResult(false);
        }

        lock (canvas)
        {
            var index = canvas.FindIndex(e => e.Id == elementId);
            if (index < 0)
            {
                return Task.FromResult(false);
            }

            element.Id = elementId;
            element.Version = canvas[index].Version + 1;
            canvas[index] = element;
        }

        session.Version++;
        session.LastModified = DateTime.UtcNow;

        return Task.FromResult(true);
    }

    public Task<bool> DeleteCanvasElementAsync(string whiteboardId, string elementId, string userId)
    {
        _logger.LogDebug("DeleteCanvasElement: {WhiteboardId}/{ElementId} by {UserId}", whiteboardId, elementId, userId);

        if (!_sessions.TryGetValue(whiteboardId, out var session))
        {
            return Task.FromResult(false);
        }

        if (!_canvases.TryGetValue(whiteboardId, out var canvas))
        {
            return Task.FromResult(false);
        }

        bool removed;
        lock (canvas)
        {
            removed = canvas.RemoveAll(e => e.Id == elementId) > 0;
        }

        if (removed)
        {
            session.Version++;
            session.LastModified = DateTime.UtcNow;
        }

        return Task.FromResult(removed);
    }

    public Task<bool> ClearWhiteboardAsync(string whiteboardId, string userId)
    {
        _logger.LogInformation("ClearWhiteboard: {WhiteboardId} by {UserId}", whiteboardId, userId);

        if (!_sessions.TryGetValue(whiteboardId, out var session))
        {
            return Task.FromResult(false);
        }

        if (_canvases.TryGetValue(whiteboardId, out var canvas))
        {
            lock (canvas)
            {
                canvas.Clear();
            }
        }

        session.Version++;
        session.LastModified = DateTime.UtcNow;

        return Task.FromResult(true);
    }

    public Task<List<WhiteboardParticipantDto>> GetWhiteboardParticipantsAsync(string whiteboardId)
    {
        _logger.LogDebug("GetWhiteboardParticipants: {WhiteboardId}", whiteboardId);

        var participants = _participants.GetValueOrDefault(whiteboardId) ?? new List<WhiteboardParticipantDto>();
        return Task.FromResult(participants.ToList());
    }

    public Task<bool> UpdateParticipantCursorAsync(string whiteboardId, string userId, PositionDto cursor)
    {
        if (!_sessions.ContainsKey(whiteboardId))
            return Task.FromResult(false);

        var participants = _participants.GetOrAdd(whiteboardId, _ => new List<WhiteboardParticipantDto>());
        lock (participants)
        {
            var participant = participants.FirstOrDefault(p => p.User.UserId == userId);
            if (participant != null)
            {
                participant.Cursor = cursor;
            }
            else
            {
                participants.Add(new WhiteboardParticipantDto
                {
                    User = new CollaborationUserDto { UserId = userId, Name = userId },
                    Cursor = cursor,
                    Tool = WhiteboardTool.Cursor,
                    Color = "#000000"
                });
            }
        }

        return Task.FromResult(true);
    }

    public Task<bool> UpdateParticipantToolAsync(string whiteboardId, string userId, WhiteboardTool tool, string color)
    {
        if (!_sessions.ContainsKey(whiteboardId))
            return Task.FromResult(false);

        var participants = _participants.GetOrAdd(whiteboardId, _ => new List<WhiteboardParticipantDto>());
        lock (participants)
        {
            var participant = participants.FirstOrDefault(p => p.User.UserId == userId);
            if (participant != null)
            {
                participant.Tool = tool;
                participant.Color = color;
            }
            else
            {
                participants.Add(new WhiteboardParticipantDto
                {
                    User = new CollaborationUserDto { UserId = userId, Name = userId },
                    Cursor = new PositionDto(),
                    Tool = tool,
                    Color = color
                });
            }
        }

        return Task.FromResult(true);
    }
}
