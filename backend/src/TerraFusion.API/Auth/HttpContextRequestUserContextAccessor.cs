using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;

namespace TerraFusion.API.Auth;

/// <summary>
/// Implements IRequestUserContextAccessor by reading from the current HttpContext.
/// Extracts the same claim names used by the existing DaisController pattern.
/// </summary>
public sealed class HttpContextRequestUserContextAccessor : IRequestUserContextAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextRequestUserContextAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public RequestUserContext Current
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            var user = context?.User;

            if (user?.Identity?.IsAuthenticated != true)
                return RequestUserContext.Anonymous;

            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? user.FindFirst("sub")?.Value
                      ?? user.FindFirst("userId")?.Value;

            var countyId = ResolveUnambiguousCountyClaim(user);

            var roles = user.FindAll(ClaimTypes.Role)
                           .Select(c => c.Value)
                           .ToList()
                           .AsReadOnly();

            return new RequestUserContext(
                IsAuthenticated: true,
                UserId: userId,
                CountyId: countyId,
                Roles: roles
            );
        }
    }

    private static string? ResolveUnambiguousCountyClaim(ClaimsPrincipal user)
    {
        var values = new[] { "countyId", "county_id", "countyCode" }
            .SelectMany(user.FindAll)
            .Select(claim => claim.Value.Trim())
            .Where(value => value.Length > 0)
            .ToArray();

        var countyIds = new HashSet<Guid>();
        var countyAliases = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var value in values)
        {
            if (Guid.TryParse(value, out var countyId))
            {
                countyIds.Add(countyId);
                continue;
            }

            if (!WashingtonCountyRegistry.TryResolve(value, out var county))
            {
                return null;
            }

            countyAliases.Add(county.Name);
        }

        if (countyIds.Count > 1 || countyAliases.Count > 1)
        {
            return null;
        }

        // This persistence-free boundary cannot prove that a supplemental alias belongs
        // to an opaque county GUID. One distinct GUID is therefore authoritative while
        // all supplemental aliases must still resolve unambiguously among themselves.
        if (countyIds.Count == 1)
        {
            return countyIds.Single().ToString("D");
        }

        return countyAliases.Count == 1 ? countyAliases.Single() : null;
    }
}
