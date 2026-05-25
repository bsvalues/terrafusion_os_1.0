using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Security;

public interface ICurrentUseAuthorizationService
{
    CurrentUseAuthorizationResultDto Authorize(CurrentUseAuthorizationRequestDto request);
}

public sealed class CurrentUseAuthorizationService : ICurrentUseAuthorizationService
{
    public CurrentUseAuthorizationResultDto Authorize(CurrentUseAuthorizationRequestDto request)
    {
        var roles = CurrentUseRoleCatalog.GetRoles()
            .Where(role => request.Roles.Contains(role.RoleKey))
            .ToArray();

        if (roles.Length == 0)
        {
            return new CurrentUseAuthorizationResultDto(
                false,
                "User has no Current Use role.",
                request.Permission);
        }

        var allowed = roles.Any(role => role.Permissions.Contains(request.Permission));

        if (!allowed)
        {
            return new CurrentUseAuthorizationResultDto(
                false,
                $"Permission denied: {request.Permission}.",
                request.Permission);
        }

        return new CurrentUseAuthorizationResultDto(
            true,
            "Allowed.",
            request.Permission);
    }
}
