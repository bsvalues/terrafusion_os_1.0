namespace TerraFusion.Security.Models
{
    public class AuthenticationResult
    {
        public bool Success { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Error
        {
            get => ErrorMessage;
            set => ErrorMessage = value;
        }
        public string? SessionId { get; set; }
        public string? ErrorCode { get; set; }
        public bool RequiresMfa { get; set; }
        public string? MfaChallengeId { get; set; }
        public UserInfo? User { get; set; }
        public DateTime ExpiresAt { get; set; }
        
        public static AuthenticationResult SuccessResult(string token, string refreshToken, ApplicationUser user, DateTime expiresAt)
        {
            return new AuthenticationResult
            {
                Success = true,
                Token = token,
                RefreshToken = refreshToken,
                User = UserInfo.FromApplicationUser(user),
                ExpiresAt = expiresAt
            };
        }
        
        public static AuthenticationResult FailureResult(string errorMessage)
        {
            return new AuthenticationResult
            {
                Success = false,
                ErrorMessage = errorMessage
            };
        }
    }
}
