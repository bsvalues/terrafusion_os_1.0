using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    public interface IAuthenticationService
    {
        Task<AuthenticationResult> AuthenticateAsync(AuthenticationRequest request);
        Task<AuthenticationResult> RefreshTokenAsync(string refreshToken);
        Task<ClaimsPrincipal> ValidateTokenAsync(string token);
        Task<bool> LogoutAsync(string userId, string sessionId);
        Task<PasswordChangeResult> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }

    public class AuthenticationRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public string? MfaCode { get; set; }
        public string? UserAgent { get; set; }
        public bool RequireMfa { get; set; }
    }
}
