namespace TerraFusion.Security.Interfaces
{
    public interface IAuditService
    {
        Task LogAuthenticationAttemptAsync(string username, string? ipAddress);
        Task LogAuthenticationSuccessAsync(string username, string? ipAddress);
        Task LogAuthenticationFailureAsync(string username, string? ipAddress, string reason);
        Task LogPasswordChangeAsync(string userId);
        Task LogTokenRefreshAsync(string userId);
        Task LogLogoutAsync(string userId);
        Task LogSecurityEventAsync(string eventType, string userId, string details);
    }
}
