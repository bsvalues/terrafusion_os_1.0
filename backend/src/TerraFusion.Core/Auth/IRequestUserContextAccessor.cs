namespace TerraFusion.Core.Auth;

/// <summary>
/// Provides the request-scoped user context extracted from JWT claims.
/// Scoped per HTTP request. Inject into controllers and services.
/// </summary>
public interface IRequestUserContextAccessor
{
    /// <summary>Gets the current request's user context.</summary>
    RequestUserContext Current { get; }
}
