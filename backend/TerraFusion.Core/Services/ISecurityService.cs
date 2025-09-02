namespace TerraFusion.Core.Services
{
    /// <summary>
    /// Security service interface for TerraFusion OS
    /// Handles security validations, event logging, and access control
    /// </summary>
    public interface ISecurityService
    {
        /// <summary>
        /// Validate if an email belongs to a valid government user
        /// </summary>
        /// <param name="email">Email address to validate</param>
        /// <returns>True if valid government user</returns>
        Task<bool> IsValidGovernmentUserAsync(string email);

        /// <summary>
        /// Log a security event for audit purposes
        /// </summary>
        /// <param name="eventType">Type of security event</param>
        /// <param name="description">Human-readable description</param>
        /// <param name="details">Additional JSON-serializable details</param>
        Task LogSecurityEventAsync(string eventType, string description, string? details = null);

        /// <summary>
        /// Validate user credentials against the authentication backend
        /// </summary>
        /// <param name="email">User's email</param>
        /// <param name="password">User's password</param>
        /// <returns>True if credentials are valid</returns>
        Task<bool> ValidateUserCredentialsAsync(string email, string password);

        /// <summary>
        /// Get roles assigned to a user
        /// </summary>
        /// <param name="email">User's email</param>
        /// <returns>Collection of role names</returns>
        Task<IEnumerable<string>> GetUserRolesAsync(string email);

        /// <summary>
        /// Check if an account is currently locked
        /// </summary>
        /// <param name="email">User's email</param>
        /// <returns>True if account is locked</returns>
        Task<bool> IsAccountLockedAsync(string email);

        /// <summary>
        /// Record a failed login attempt for an account
        /// </summary>
        /// <param name="email">User's email</param>
        Task RecordFailedLoginAttemptAsync(string email);

        /// <summary>
        /// Reset failed login attempts after successful login
        /// </summary>
        /// <param name="email">User's email</param>
        Task ResetFailedLoginAttemptsAsync(string email);

        /// <summary>
        /// Get the number of failed login attempts for an account
        /// </summary>
        /// <param name="email">User's email</param>
        /// <returns>Number of failed attempts</returns>
        Task<int> GetFailedLoginAttemptsAsync(string email);

        /// <summary>
        /// Lock an account for security reasons
        /// </summary>
        /// <param name="email">User's email</param>
        /// <param name="duration">How long to lock the account</param>
        /// <param name="reason">Reason for locking</param>
        Task LockAccountAsync(string email, TimeSpan duration, string reason);

        /// <summary>
        /// Unlock an account
        /// </summary>
        /// <param name="email">User's email</param>
        Task UnlockAccountAsync(string email);

        /// <summary>
        /// Validate if an IP address is allowed
        /// </summary>
        /// <param name="ipAddress">IP address to validate</param>
        /// <returns>True if IP is allowed</returns>
        Task<bool> IsIpAddressAllowedAsync(string ipAddress);

        /// <summary>
        /// Check if a user has a specific permission
        /// </summary>
        /// <param name="userId">User identifier</param>
        /// <param name="permission">Permission to check</param>
        /// <returns>True if user has permission</returns>
        Task<bool> HasPermissionAsync(string userId, string permission);

        /// <summary>
        /// Check if a user has access to a specific module
        /// </summary>
        /// <param name="userId">User identifier</param>
        /// <param name="moduleId">Module identifier</param>
        /// <returns>True if user has module access</returns>
        Task<bool> HasModuleAccessAsync(string userId, string moduleId);
    }
}