namespace TerraFusion.API.Security.Interfaces;

/// <summary>
/// Session lifecycle management with refresh-token rotation.
/// FISMA AC-12: 30-minute inactivity timeout.
/// </summary>
public interface ISessionManager
{
    Task<SessionInfo> CreateSessionAsync(string userId, string? ipAddress = null, string? userAgent = null);
    Task<bool> IsSessionValidAsync(string sessionId);
    Task<bool> InvalidateSessionAsync(string sessionId);
    Task<bool> ExtendSessionAsync(string sessionId, TimeSpan? extension = null);
    Task<int> GetActiveSessionCountAsync(string userId);
    Task<SessionInfo?> GetSessionByRefreshTokenAsync(string refreshToken);
    Task<string> RotateRefreshTokenAsync(string sessionId);
    Task InvalidateAllUserSessionsAsync(string userId, string? exceptSessionId = null);
}

/// <summary>Serializable session DTO (Redis-ready).</summary>
public sealed class SessionInfo
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public bool IsActive { get; set; }
}
