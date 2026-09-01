using TerraFusion.Core.Auth;
using TerraFusion.Core.Services;

namespace TerraFusion.Core.Counties;

/// <summary>
/// The data-free outcome of binding authenticated request context to a persisted county identity.
/// Every refusal returns <see cref="Denied"/> and discloses no actor, county, or mismatch detail.
/// </summary>
public enum AuthenticatedCountyAuthorityBindingDecision
{
    Denied = 0,
    Bound = 1,
}

/// <summary>
/// Immutable evidence that an authenticated actor's county claim and a requested target resolved to
/// the same persisted county identifier. A bound result is necessary county-scope evidence only; it
/// does not grant a role, capability, data-mode activation, or resource-specific authorization.
/// </summary>
public sealed record AuthenticatedCountyAuthorityBindingResult
{
    private AuthenticatedCountyAuthorityBindingResult(
        AuthenticatedCountyAuthorityBindingDecision decision,
        string? actorId,
        Guid? countyId)
    {
        Decision = decision;
        ActorId = actorId;
        CountyId = countyId;
    }

    public AuthenticatedCountyAuthorityBindingDecision Decision { get; }

    public string? ActorId { get; }

    public Guid? CountyId { get; }

    internal static AuthenticatedCountyAuthorityBindingResult Denied { get; } =
        new(AuthenticatedCountyAuthorityBindingDecision.Denied, null, null);

    internal static AuthenticatedCountyAuthorityBindingResult Bound(
        string actorId,
        Guid countyId) =>
        new(AuthenticatedCountyAuthorityBindingDecision.Bound, actorId, countyId);
}

/// <summary>
/// Snapshots one authenticated request context and binds its county claim to one requested target
/// through the canonical persisted-county resolver. Selectors never create authority, and no county
/// is selected by default.
/// </summary>
public sealed class AuthenticatedCountyAuthorityBinding
{
    public const string ContractId = "wal.authenticated-county-authority-binding.v1";

    private readonly IRequestUserContextAccessor _contextAccessor;
    private readonly ICountyResolver _countyResolver;

    public AuthenticatedCountyAuthorityBinding(
        IRequestUserContextAccessor contextAccessor,
        ICountyResolver countyResolver)
    {
        _contextAccessor = contextAccessor
            ?? throw new ArgumentNullException(nameof(contextAccessor));
        _countyResolver = countyResolver
            ?? throw new ArgumentNullException(nameof(countyResolver));
    }

    public async Task<AuthenticatedCountyAuthorityBindingResult> BindAsync(
        string? targetCountyIdentifier,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        // Current may be backed by mutable request state. Read it once, then snapshot only the three
        // bounded scalar values used by this contract before the first await. Roles are deliberately
        // neither read nor retained because this component grants no capability.
        var context = _contextAccessor.Current;
        if (context is null)
        {
            return AuthenticatedCountyAuthorityBindingResult.Denied;
        }

        var isAuthenticated = context.IsAuthenticated;
        var actorId = context.UserId;
        var authorityCountyIdentifier = context.CountyId;

        if (!isAuthenticated
            || string.IsNullOrWhiteSpace(actorId)
            || string.IsNullOrWhiteSpace(authorityCountyIdentifier)
            || string.IsNullOrWhiteSpace(targetCountyIdentifier))
        {
            return AuthenticatedCountyAuthorityBindingResult.Denied;
        }

        var authorityCountyId = await _countyResolver
            .TryResolveAsync(authorityCountyIdentifier, cancellationToken)
            .ConfigureAwait(false);

        cancellationToken.ThrowIfCancellationRequested();

        if (authorityCountyId is null)
        {
            return AuthenticatedCountyAuthorityBindingResult.Denied;
        }

        var targetCountyId = await _countyResolver
            .TryResolveAsync(targetCountyIdentifier, cancellationToken)
            .ConfigureAwait(false);

        cancellationToken.ThrowIfCancellationRequested();

        return targetCountyId is not null && targetCountyId.Value == authorityCountyId.Value
            ? AuthenticatedCountyAuthorityBindingResult.Bound(actorId, authorityCountyId.Value)
            : AuthenticatedCountyAuthorityBindingResult.Denied;
    }
}
