using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    public interface IAuthenticationService
    {
        Task<AuthenticationResult> AuthenticateAsync(AuthenticationRequest request);
        Task<AuthenticationResult> RefreshTokenAsync(string refreshToken);
        Task<ClaimsPrincipal> ValidateTokenAsync(string token);
        Task<bool> LogoutAsync(string userId);
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<bool> ValidatePasswordAsync(string password);
    }

    public class AuthenticationRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public bool RequireMfa { get; set; }
    }
}
