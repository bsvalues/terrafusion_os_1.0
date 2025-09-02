namespace TerraFusion.Security.Interfaces
{
    public interface ISessionManager
    {
        Task<bool> IsSessionValidAsync(string userId);
        Task<string> CreateSessionAsync(string userId);
        Task<bool> InvalidateSessionAsync(string sessionId);
        Task<bool> ExtendSessionAsync(string sessionId);
        Task<int> GetActiveSessionCountAsync(string userId);
    }
}
