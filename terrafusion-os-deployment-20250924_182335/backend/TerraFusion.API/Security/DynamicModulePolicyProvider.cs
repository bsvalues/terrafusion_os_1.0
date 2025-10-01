using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace TerraFusion.API.Security
{
    /// <summary>
    /// Builds authorization policies on-the-fly for names like "module:{name}".
    /// </summary>
    public sealed class DynamicModulePolicyProvider : IAuthorizationPolicyProvider
    {
        private readonly DefaultAuthorizationPolicyProvider _fallback;

        public DynamicModulePolicyProvider(IOptions<AuthorizationOptions> options)
        {
            _fallback = new DefaultAuthorizationPolicyProvider(options);
        }

        public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _fallback.GetDefaultPolicyAsync();

        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _fallback.GetFallbackPolicyAsync();

        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            if (policyName == null) return _fallback.GetPolicyAsync(policyName ?? "");

            if (policyName.StartsWith(RequiresPermissionAttribute.PolicyPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var permission = policyName.Substring(RequiresPermissionAttribute.PolicyPrefix.Length);
                var builder = new AuthorizationPolicyBuilder();
                builder.AddRequirements(new PluginPermissionRequirement(permission));
                return Task.FromResult<AuthorizationPolicy?>(builder.Build());
            }
            
            if (policyName.StartsWith("module:", StringComparison.OrdinalIgnoreCase))
            {
                var moduleName = policyName.Substring("module:".Length);
                var builder = new AuthorizationPolicyBuilder();
                builder.AddRequirements(new ModuleAccessRequirement(moduleName));
                return Task.FromResult<AuthorizationPolicy?>(builder.Build());
            }

            return _fallback.GetPolicyAsync(policyName);
        }
    }
}
