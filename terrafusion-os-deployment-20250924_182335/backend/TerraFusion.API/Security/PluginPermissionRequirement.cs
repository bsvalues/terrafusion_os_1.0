using Microsoft.AspNetCore.Authorization;

namespace TerraFusion.API.Security
{
    public class PluginPermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PluginPermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }
}
