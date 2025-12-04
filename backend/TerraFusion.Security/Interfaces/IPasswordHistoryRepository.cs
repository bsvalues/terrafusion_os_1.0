namespace TerraFusion.Security.Interfaces;

public interface IPasswordHistoryRepository
{
    Task<IEnumerable<string>> GetRecentHashesAsync(string userId, int count);
    Task SaveAsync(string userId, string passwordHash, DateTime savedAt);
}
