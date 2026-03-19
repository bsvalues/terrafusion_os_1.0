namespace TerraFusion.Core.Auth;

/// <summary>
/// Canonical request-scoped user identity. One shape, no controller snowflakes.
/// Populated by IRequestUserContextAccessor from JWT claims on each request.
/// </summary>
public sealed record RequestUserContext(
    bool IsAuthenticated,
    string? UserId,
    string? CountyId,
    IReadOnlyCollection<string> Roles
)
{
    /// <summary>Unauthenticated / default sentinel value.</summary>
    public static readonly RequestUserContext Anonymous = new(
        IsAuthenticated: false,
        UserId: null,
        CountyId: null,
        Roles: Array.Empty<string>()
    );
}
