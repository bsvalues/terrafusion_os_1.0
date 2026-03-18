// TFT-082: Role-Based Access Control Middleware
// Enforces Admin > Developer > Viewer role hierarchy via JWT claims.

using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Security.Auth;

/// <summary>
/// Defines the TerraFusion role hierarchy. Higher numeric value = higher privilege.
/// Admin supersedes Developer, which supersedes Viewer.
/// </summary>
public enum TerraFusionRole
{
    Viewer = 0,
    Developer = 1,
    Admin = 2,
}

/// <summary>
/// Authorization attribute that enforces minimum role requirements.
/// Supports role hierarchy: Admin > Developer > Viewer.
/// </summary>
/// <example>
/// [RequireRole("Admin")]
/// public IActionResult DeleteUser(int id) { ... }
///
/// [RequireRole("Developer")]
/// public IActionResult DeployPlugin(int id) { ... }
/// </example>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class RequireRoleAttribute : Attribute, IAuthorizationFilter
{
    private readonly TerraFusionRole _minimumRole;

    public RequireRoleAttribute(string roleName)
    {
        if (!Enum.TryParse<TerraFusionRole>(roleName, ignoreCase: true, out var role))
            throw new ArgumentException($"Unknown role: {roleName}. Valid roles: Admin, Developer, Viewer.", nameof(roleName));

        _minimumRole = role;
    }

    public RequireRoleAttribute(TerraFusionRole minimumRole)
    {
        _minimumRole = minimumRole;
    }

    /// <summary>Gets the minimum role required to access the decorated endpoint.</summary>
    public TerraFusionRole MinimumRole => _minimumRole;

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity is not { IsAuthenticated: true })
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                error = "Authentication required",
                code = "AUTH_REQUIRED",
            });
            return;
        }

        var userRole = ExtractHighestRole(user);

        if (userRole < _minimumRole)
        {
            context.Result = new ObjectResult(new
            {
                error = "Insufficient permissions",
                code = "INSUFFICIENT_ROLE",
                required = _minimumRole.ToString(),
                current = userRole.ToString(),
            })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
        }
    }

    private static TerraFusionRole ExtractHighestRole(ClaimsPrincipal user)
    {
        var highestRole = TerraFusionRole.Viewer;

        var roleClaims = user.FindAll(ClaimTypes.Role)
            .Concat(user.FindAll("role"));

        foreach (var claim in roleClaims)
        {
            if (Enum.TryParse<TerraFusionRole>(claim.Value, ignoreCase: true, out var parsed) && parsed > highestRole)
            {
                highestRole = parsed;
            }
        }

        return highestRole;
    }
}

/// <summary>
/// ASP.NET Core middleware that injects resolved role information into HttpContext items
/// for downstream consumption. This does NOT block requests -- use <see cref="RequireRoleAttribute"/>
/// on controllers/actions for enforcement.
/// </summary>
public sealed class RbacMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RbacMiddleware> _logger;

    public const string RoleContextKey = "TerraFusion.ResolvedRole";
    public const string CountyContextKey = "TerraFusion.CountyId";

    public RbacMiddleware(RequestDelegate next, ILogger<RbacMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity is { IsAuthenticated: true })
        {
            var role = ResolveHighestRole(context.User);
            context.Items[RoleContextKey] = role;

            var countyId = context.User.FindFirstValue("county_id");
            if (!string.IsNullOrEmpty(countyId))
            {
                context.Items[CountyContextKey] = countyId;
            }

            _logger.LogDebug(
                "RBAC resolved: User={User}, Role={Role}, County={County}",
                context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown",
                role,
                countyId ?? "none");
        }

        await _next(context);
    }

    private static TerraFusionRole ResolveHighestRole(ClaimsPrincipal user)
    {
        var highestRole = TerraFusionRole.Viewer;

        var roleClaims = user.FindAll(ClaimTypes.Role)
            .Concat(user.FindAll("role"));

        foreach (var claim in roleClaims)
        {
            if (Enum.TryParse<TerraFusionRole>(claim.Value, ignoreCase: true, out var parsed) && parsed > highestRole)
            {
                highestRole = parsed;
            }
        }

        return highestRole;
    }
}

/// <summary>
/// Extension methods for registering RBAC middleware in the ASP.NET Core pipeline.
/// </summary>
public static class RbacMiddlewareExtensions
{
    /// <summary>
    /// Adds RBAC role resolution middleware to the pipeline. Place after UseAuthentication().
    /// </summary>
    public static IApplicationBuilder UseRbac(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RbacMiddleware>();
    }
}
