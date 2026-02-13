using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    /// <summary>
    /// Multi-factor authentication service interface.
    /// Signatures match ProductionAuthenticationService usage.
    /// </summary>
    public interface IMfaService
    {
        Task<bool> SendMfaChallengeAsync(ApplicationUser user);
        Task<bool> ValidateMfaCodeAsync(ApplicationUser user, string code);
        Task<string> GenerateMfaCodeAsync(string userId);
        Task<bool> IsMfaEnabledAsync(string userId);
        Task EnableMfaAsync(string userId, string secret);
        Task DisableMfaAsync(string userId);
    }
}
