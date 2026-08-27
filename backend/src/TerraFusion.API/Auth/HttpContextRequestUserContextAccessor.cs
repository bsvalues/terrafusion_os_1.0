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
            .Select(NormalizeCountyClaim)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        // Claim order is not authority. Repeated equivalent values are safe,
        // but competing values must fail closed for downstream authorization.
        return values.Length == 1 ? values[0] : null;
    }

    private static string NormalizeCountyClaim(string value)
    {
        if (WashingtonCountyRegistry.TryResolve(value, out var county))
            return county.Key;

        return Guid.TryParse(value, out var countyId)
            ? countyId.ToString("D")
            : value;
    }
}
