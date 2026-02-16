using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Stub implementation of IWhiteboardService.
/// Returns empty/default results for all whiteboard operations.
/// </summary>
public sealed class WhiteboardService : IWhiteboardService
{
    private readonly ILogger<WhiteboardService> _logger;

    public WhiteboardService(ILogger<WhiteboardService> logger)
    {
        _logger = logger;
    }

    public Task<WhiteboardSessionDto?> GetWhiteboardSessionAsync(string sessionId)
    {
        _logger.LogDebug("GetWhiteboardSession: {SessionId} (stub)", sessionId);
        return Task.FromResult<WhiteboardSessionDto?>(null);
    }

    public Task<WhiteboardSessionDto> CreateWhiteboardSessionAsync(string collaborationSessionId)
    {
        _logger.LogInformation("CreateWhiteboardSession: {SessionId} (stub)", collaborationSessionId);
        return Task.FromResult(new WhiteboardSessionDto
        {
            Id = Guid.NewGuid().ToString(),
            CollaborationSessionId = collaborationSessionId,
            LastModified = DateTime.UtcNow
        });
    }

    public Task<bool> UpdateWhiteboardCanvasAsync(string whiteboardId, List<CanvasElementDto> elements, string userId)
    {
        _logger.LogDebug("UpdateWhiteboardCanvas: {WhiteboardId} (stub)", whiteboardId);
        return Task.FromResult(true);
    }

    public Task<bool> AddCanvasElementAsync(string whiteboardId, CanvasElementDto element, string userId)
    {
        _logger.LogDebug("AddCanvasElement: {WhiteboardId} (stub)", whiteboardId);
        return Task.FromResult(true);
    }

    public Task<bool> UpdateCanvasElementAsync(string whiteboardId, string elementId, CanvasElementDto element, string userId)
    {
        _logger.LogDebug("UpdateCanvasElement: {WhiteboardId}/{ElementId} (stub)", whiteboardId, elementId);
        return Task.FromResult(true);
    }

    public Task<bool> DeleteCanvasElementAsync(string whiteboardId, string elementId, string userId)
    {
        _logger.LogDebug("DeleteCanvasElement: {WhiteboardId}/{ElementId} (stub)", whiteboardId, elementId);
        return Task.FromResult(true);
    }

    public Task<bool> ClearWhiteboardAsync(string whiteboardId, string userId)
    {
        _logger.LogDebug("ClearWhiteboard: {WhiteboardId} (stub)", whiteboardId);
        return Task.FromResult(true);
    }

    public Task<List<WhiteboardParticipantDto>> GetWhiteboardParticipantsAsync(string whiteboardId)
    {
        _logger.LogDebug("GetWhiteboardParticipants: {WhiteboardId} (stub)", whiteboardId);
        return Task.FromResult(new List<WhiteboardParticipantDto>());
    }

    public Task<bool> UpdateParticipantCursorAsync(string whiteboardId, string userId, PositionDto cursor)
    {
        return Task.FromResult(true);
    }

    public Task<bool> UpdateParticipantToolAsync(string whiteboardId, string userId, WhiteboardTool tool, string color)
    {
        return Task.FromResult(true);
    }
}
