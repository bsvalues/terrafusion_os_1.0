namespace TerraFusion.Security.Models
{
    public class PasswordChangeResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Error
        {
            get => ErrorMessage;
            set => ErrorMessage = value;
        }
        
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
        public string? Error
        {
            get => Errors.Count > 0 ? string.Join("; ", Errors) : null;
            set { if (value != null) { Errors.Clear(); Errors.Add(value); } }
        }
        
        public static PasswordValidationResult ValidResult()
        {
            return new PasswordValidationResult { IsValid = true };
        }
        
        public static PasswordValidationResult InvalidResult(List<string> errors)
        {
            return new PasswordValidationResult { IsValid = false, Errors = errors };
        }
    }
}
