using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces;

public class LockoutInfo
{
    public int FailedAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
}

public interface IUserRepository
{
    Task<LockoutInfo?> GetLockoutInfoAsync(string username);
    Task<LockoutInfo> IncrementFailedLoginAsync(string username);
    Task ClearFailedLoginAsync(string username);
    Task SetLockoutAsync(string username, DateTime lockedUntil);
    Task ClearLockoutAsync(string username);
    Task<List<string>> GetUserRolesAsync(string userId);
    Task<List<string>> GetUserPermissionsAsync(string userId);
    Task CreateAsync(ApplicationUser user);
}
