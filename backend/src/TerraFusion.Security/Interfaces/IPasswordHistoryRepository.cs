namespace TerraFusion.Security.Interfaces;

/// <summary>
/// Repository for storing and retrieving password hashes to enforce password history policies.
/// </summary>
public interface IPasswordHistoryRepository
{
    /// <summary>
    /// Returns the most recent password hashes for the given user.
    /// </summary>
    Task<IEnumerable<string>> GetRecentHashesAsync(string userId, int count);

    /// <summary>
    /// Persists a new password hash entry for the given user.
    /// </summary>
    Task SaveAsync(string userId, string passwordHash, DateTime savedAt);
}
