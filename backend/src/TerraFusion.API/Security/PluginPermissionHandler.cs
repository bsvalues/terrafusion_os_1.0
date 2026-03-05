using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Hosting;
using System.Threading.Tasks;
using TerraFusion.Data.Repositories;
using System.Text.Json;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System;

namespace TerraFusion.API.Security
{
    /// <summary>
    /// Resolves <see cref="PluginPermissionRequirement"/> by checking the
    /// X-Plugin-Id header against the plugin's PermissionsJson.
    ///
    /// CX-16 / CX-27: In Development, authenticated government users are
    /// granted all module permissions without requiring an X-Plugin-Id header.
    /// This unblocks local development and runtime validation while preserving
    /// the plugin-based access model in production.
    /// </summary>
    public class PluginPermissionHandler : AuthorizationHandler<PluginPermissionRequirement>
    {
        private readonly IPluginRepository _pluginRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly bool _isDevelopment;

        public PluginPermissionHandler(
            IPluginRepository pluginRepository,
            IHttpContextAccessor httpContextAccessor,
            IHostEnvironment hostEnvironment)
        {
            _pluginRepository = pluginRepository;
            _httpContextAccessor = httpContextAccessor;
            _isDevelopment = hostEnvironment.IsDevelopment();
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PluginPermissionRequirement requirement)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                return;
            }

            // ── Plugin-based path: X-Plugin-Id header present ──────────────
            if (httpContext.Request.Headers.TryGetValue("X-Plugin-Id", out var pluginIdHeader)
                && Guid.TryParse(pluginIdHeader.FirstOrDefault(), out var pluginId))
            {
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
                    // Malformed PermissionsJson — deny silently
                }
                return;
            }

            // ── CX-16: Development user-claim fallback ─────────────────────
            // In Development, any authenticated user (has identity) is granted
            // module permissions directly.  This avoids requiring a marketplace
            // plugin install just to test API endpoints locally.
            if (_isDevelopment && context.User.Identity?.IsAuthenticated == true)
            {
                context.Succeed(requirement);
                return;
            }

            // No plugin ID and not in development → deny (implicit)
        }
    }
}
