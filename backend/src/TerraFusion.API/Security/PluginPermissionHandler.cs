using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using TerraFusion.Data.Repositories;
using System.Text.Json;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System; 

namespace TerraFusion.API.Security
{
    public class PluginPermissionHandler : AuthorizationHandler<PluginPermissionRequirement>
    {
        private readonly IPluginRepository _pluginRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PluginPermissionHandler(IPluginRepository pluginRepository, IHttpContextAccessor httpContextAccessor)
        {
            _pluginRepository = pluginRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PluginPermissionRequirement requirement)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                return;
            }

            // Extract the Plugin ID from a request header, e.g., "X-Plugin-Id"
            if (!httpContext.Request.Headers.TryGetValue("X-Plugin-Id", out var pluginIdHeader) || !Guid.TryParse(pluginIdHeader.FirstOrDefault(), out var pluginId))
            {
                return; // No plugin ID found, so we can't verify permission
            }

            var plugin = await _pluginRepository.GetByIdAsync(pluginId);
            if (plugin == null || string.IsNullOrEmpty(plugin.PermissionsJson))
            {
                return; // Plugin not found or has no permissions defined
            }

            try
            {
                var permissions = JsonSerializer.Deserialize<string[]>(plugin.PermissionsJson);
                if (permissions != null && permissions.Contains(requirement.Permission, StringComparer.OrdinalIgnoreCase))
                {
                    context.Succeed(requirement);
                }
            }
            catch (JsonException)
            {
                // Log this error in a real application
            }
        }
    }
}
