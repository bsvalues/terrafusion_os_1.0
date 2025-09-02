using TerraFusion.Security.Models;

namespace TerraFusion.Security.Interfaces
{
    public interface ILdapService
    {
        Task<LdapAuthResult> AuthenticateAsync(string username, string password);
        Task<ApplicationUser?> GetUserFromLdapAsync(string username);
        Task<bool> IsUserInGroupAsync(string username, string groupName);
        Task<List<string>> GetUserGroupsAsync(string username);
    }

    public class LdapAuthResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public ApplicationUser? User { get; set; }
        public List<string> Groups { get; set; } = new();
        
        public static LdapAuthResult SuccessResult(ApplicationUser user, List<string> groups)
        {
            return new LdapAuthResult { Success = true, User = user, Groups = groups };
        }
        
        public static LdapAuthResult FailureResult(string errorMessage)
        {
            return new LdapAuthResult { Success = false, ErrorMessage = errorMessage };
        }
    }
}
