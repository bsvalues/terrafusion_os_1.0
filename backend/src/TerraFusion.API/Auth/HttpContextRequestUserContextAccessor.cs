using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using TerraFusion.Core.Auth;

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

            var countyId = user.FindFirst("countyId")?.Value
                        ?? user.FindFirst("county_id")?.Value
                        ?? user.FindFirst("countyCode")?.Value;

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
}
