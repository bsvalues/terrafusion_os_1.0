namespace TerraFusion.Core.Security.PasswordHistory;

/// <summary>
/// Phase 4 Sprint 1: Password history storage interface
/// Implements NIST 800-63B AC-2(7) password reuse prevention
/// </summary>
public interface IPasswordHistoryStore
{
    /// <summary>
    /// Add a password hash to user's history
    /// </summary>
    Task AddPasswordHashAsync(Guid userId, string passwordHash);
    
    /// <summary>
    /// Get user's recent password hashes (ordered by CreatedAt DESC)
    /// </summary>
    /// <param name="count">Number of recent hashes to retrieve (default: 5)</param>
    Task<List<string>> GetRecentPasswordHashesAsync(Guid userId, int count = 5);
    
    /// <summary>
    /// Check if a password hash exists in user's recent history
    /// Note: This does NOT verify the password, just checks hash presence
    /// </summary>
    Task<bool> IsHashInHistoryAsync(Guid userId, string passwordHash);
    
    /// <summary>
    /// Delete password history older than retention period (90 days)
    /// </summary>
    Task PruneOldHistoryAsync(int retentionDays = 90);
}
