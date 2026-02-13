using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    /// <summary>
    /// Session management interface.
    /// Signatures match ProductionAuthenticationService usage.
    /// </summary>
    public interface ISessionManager
    {
        Task<UserSession> CreateSessionAsync(ApplicationUser user, string ipAddress, string? userAgent);
        Task<UserSession?> GetSessionByRefreshTokenAsync(string refreshToken);
        Task<UserSession> RotateRefreshTokenAsync(UserSession session);
        Task<bool> InvalidateSessionAsync(string sessionId);
        Task<bool> InvalidateAllUserSessionsExceptAsync(string userId, string? exceptSessionId);
        Task<bool> IsSessionValidAsync(string userId);
        Task<bool> ExtendSessionAsync(string sessionId);
        Task<int> GetActiveSessionCountAsync(string userId);
    }
}
