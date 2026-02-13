namespace TerraFusion.Core.Security.Lockout;

/// <summary>
/// Phase 4 Sprint 1: Account lockout state storage interface
/// Implements NIST 800-63B AC-2(4) progressive lockout tracking
/// </summary>
public interface ILockoutStore
{
    /// <summary>
    /// Get current failed login attempt count for user
    /// </summary>
    Task<int> GetFailedAttemptsAsync(Guid userId);
    
    /// <summary>
    /// Increment failed login attempt counter
    /// </summary>
    /// <returns>New attempt count after increment</returns>
    Task<int> IncrementFailedAttemptsAsync(Guid userId);
    
    /// <summary>
    /// Reset failed attempts (after successful login)
    /// </summary>
    Task ResetFailedAttemptsAsync(Guid userId);
    
    /// <summary>
    /// Get lockout expiry timestamp (null if not locked)
    /// </summary>
    Task<DateTime?> GetLockoutExpiryAsync(Guid userId);
    
    /// <summary>
    /// Set account lockout until specified time
    /// </summary>
    Task SetLockoutAsync(Guid userId, DateTime expiresAt);
    
    /// <summary>
    /// Check if user is currently locked out
    /// </summary>
    Task<bool> IsLockedOutAsync(Guid userId);
}
