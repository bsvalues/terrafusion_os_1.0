using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    public interface ISessionManager
    {
        Task<bool> IsSessionValidAsync(string userId);
        Task<string> CreateSessionAsync(string userId);
        Task<Session> CreateSessionAsync(ApplicationUser user, string? ipAddress, string? userAgent);
        Task<Session?> GetSessionByRefreshTokenAsync(string refreshToken);
        Task<string> RotateRefreshTokenAsync(Session session);
        Task<bool> InvalidateSessionAsync(string sessionId);
        Task<bool> ExtendSessionAsync(string sessionId);
        Task<int> GetActiveSessionCountAsync(string userId);
        Task InvalidateAllUserSessionsExceptAsync(string userId, string? exceptSessionId);
    }
}
