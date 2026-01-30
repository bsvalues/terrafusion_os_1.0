using Microsoft.AspNetCore.Authorization;

namespace TerraFusion.API.Security
{
    public sealed class ModuleAccessRequirement : IAuthorizationRequirement
    {
        public string ModuleName { get; }
        public string PermissionKey { get; }

        public ModuleAccessRequirement(string moduleName)
        {
            ModuleName = moduleName;
            PermissionKey = $"load:{moduleName}";
        }
    }
}
