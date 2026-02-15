using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Security.Interfaces;

namespace TerraFusion.API.Security.Services;

/// <summary>
/// In-memory session store with refresh-token rotation.
/// FISMA AC-12: 30-minute inactivity timeout.
/// Production: swap to Redis-backed implementation.
/// </summary>
public sealed class InMemorySessionManager : ISessionManager
{
    private readonly ConcurrentDictionary<string, SessionInfo> _sessions = new();
    private readonly ConcurrentDictionary<string, string> _refreshIndex = new(); // token → sessionId
    private readonly ILogger<InMemorySessionManager> _logger;

    private static readonly TimeSpan DefaultSessionTimeout = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    public InMemorySessionManager(ILogger<InMemorySessionManager> logger)
    {
        _logger = logger;
    }

    public Task<SessionInfo> CreateSessionAsync(string userId, string? ipAddress = null, string? userAgent = null)
    {
        var refreshToken = GenerateRefreshToken();
        var session = new SessionInfo
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            RefreshToken = refreshToken,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(DefaultSessionTimeout),
            LastActivityAt = DateTime.UtcNow,
            IsActive = true
        };

        _sessions[session.Id] = session;
        _refreshIndex[refreshToken] = session.Id;

        _logger.LogInformation("Session {SessionId} created for user {UserId}", session.Id, userId);
        return Task.FromResult(session);
    }

    public Task<bool> IsSessionValidAsync(string sessionId)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
            return Task.FromResult(false);

        var valid = session.IsActive && session.ExpiresAt > DateTime.UtcNow;
        return Task.FromResult(valid);
    }

    public Task<bool> InvalidateSessionAsync(string sessionId)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
            return Task.FromResult(false);

        session.IsActive = false;
        _refreshIndex.TryRemove(session.RefreshToken, out _);

        _logger.LogInformation("Session {SessionId} invalidated", sessionId);
        return Task.FromResult(true);
    }

    public Task<bool> ExtendSessionAsync(string sessionId, TimeSpan? extension = null)
    {
        if (!_sessions.TryGetValue(sessionId, out var session) || !session.IsActive)
            return Task.FromResult(false);

        session.ExpiresAt = DateTime.UtcNow.Add(extension ?? DefaultSessionTimeout);
        session.LastActivityAt = DateTime.UtcNow;
        return Task.FromResult(true);
    }

    public Task<int> GetActiveSessionCountAsync(string userId)
    {
        var count = _sessions.Values
            .Count(s => s.UserId == userId && s.IsActive && s.ExpiresAt > DateTime.UtcNow);
        return Task.FromResult(count);
    }

    public Task<SessionInfo?> GetSessionByRefreshTokenAsync(string refreshToken)
    {
        if (!_refreshIndex.TryGetValue(refreshToken, out var sessionId))
            return Task.FromResult<SessionInfo?>(null);

        if (!_sessions.TryGetValue(sessionId, out var session) || !session.IsActive)
            return Task.FromResult<SessionInfo?>(null);

        return Task.FromResult<SessionInfo?>(session);
    }

    public Task<string> RotateRefreshTokenAsync(string sessionId)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
            return Task.FromResult(string.Empty);

        // Remove old token from index
        _refreshIndex.TryRemove(session.RefreshToken, out _);

        // Issue new token
        var newToken = GenerateRefreshToken();
        session.RefreshToken = newToken;
        _refreshIndex[newToken] = sessionId;

        _logger.LogInformation("Refresh token rotated for session {SessionId}", sessionId);
        return Task.FromResult(newToken);
    }

    public Task InvalidateAllUserSessionsAsync(string userId, string? exceptSessionId = null)
    {
        foreach (var session in _sessions.Values.Where(s => s.UserId == userId && s.IsActive))
        {
            if (session.Id == exceptSessionId) continue;

            session.IsActive = false;
            _refreshIndex.TryRemove(session.RefreshToken, out _);
        }

        _logger.LogInformation("All sessions invalidated for user {UserId} (except {Except})", userId, exceptSessionId ?? "none");
        return Task.CompletedTask;
    }

    /// <summary>Generate a cryptographically random Base64URL refresh token.</summary>
    public static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
