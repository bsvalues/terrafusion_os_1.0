using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace TerraFusion.API.Security
{
    public sealed class ModuleAccessHandler : AuthorizationHandler<ModuleAccessRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ModuleAccessRequirement requirement)
        {
            // Expect permissions to be present as claims (e.g., type "perm")
            // Example: perm = "load:cama-core"
            var hasPermission = context.User?.Claims?
                .Where(c => c.Type == "perm")
                .Select(c => c.Value)
                .Any(v => string.Equals(v, requirement.PermissionKey, System.StringComparison.OrdinalIgnoreCase)) == true;

            if (hasPermission)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
