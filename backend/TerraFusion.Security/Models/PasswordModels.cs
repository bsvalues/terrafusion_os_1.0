namespace TerraFusion.Security.Models
{
    public class PasswordChangeResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        
        public static PasswordChangeResult SuccessResult()
        {
            return new PasswordChangeResult { Success = true };
        }
        
        public static PasswordChangeResult FailureResult(string errorMessage)
        {
            return new PasswordChangeResult { Success = false, ErrorMessage = errorMessage };
        }
    }
    
    public class PasswordValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
        
        public static PasswordValidationResult ValidResult()
        {
            return new PasswordValidationResult { IsValid = true };
        }
        
        public static PasswordValidationResult InvalidResult(List<string> errors)
        {
            return new PasswordValidationResult { IsValid = false, Errors = errors };
        }
    }
    
    public class LdapAuthResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public ApplicationUser? User { get; set; }
        
        public static LdapAuthResult SuccessResult(ApplicationUser user)
        {
            return new LdapAuthResult { Success = true, User = user };
        }
        
        public static LdapAuthResult FailureResult(string errorMessage)
        {
            return new LdapAuthResult { Success = false, ErrorMessage = errorMessage };
        }
    }
}
