using Microsoft.AspNetCore.Authorization;

namespace TerraFusion.API.Security
{
    public class RequiresPermissionAttribute : AuthorizeAttribute
    {
        public const string PolicyPrefix = "RequiresPermission_";

        public RequiresPermissionAttribute(string permission)
        {
            Policy = $"{PolicyPrefix}{permission}";
        }
    }
}
