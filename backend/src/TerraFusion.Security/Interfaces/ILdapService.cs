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

    // LdapAuthResult canonical definition is in Models/SecurityEntities.cs
}
