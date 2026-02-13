using System.Security.Claims;
using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    /// <summary>
    /// Core authentication service interface for TerraFusion OS.
    /// Signatures match ProductionAuthenticationService implementation.
    /// </summary>
    public interface IAuthenticationService
    {
        Task<AuthenticationResult> AuthenticateAsync(AuthenticationRequest request);
        Task<AuthenticationResult> RefreshTokenAsync(string refreshToken);
        Task<ClaimsPrincipal> ValidateTokenAsync(string token);
        Task<bool> LogoutAsync(string userId, string sessionId);
        Task<PasswordChangeResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }

    /// <summary>
    /// Authentication request model with all fields used by ProductionAuthenticationService.
    /// </summary>
    public class AuthenticationRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? MfaCode { get; set; }
        public bool RequireMfa { get; set; }
    }
}
