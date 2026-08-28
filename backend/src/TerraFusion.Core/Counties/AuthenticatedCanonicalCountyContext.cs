using TerraFusion.Core.Services;

namespace TerraFusion.Core.Counties;

/// <summary>
/// The data-free outcome of establishing an authenticated canonical county context.
/// </summary>
public enum AuthenticatedCanonicalCountyContextDecision
{
    Denied = 0,
    Established = 1,
}

/// <summary>
/// Immutable evidence that one protected authenticated binding maps to exactly one identity in the
/// canonical Washington county registry. This evidence grants no role, capability, activation, or
/// resource access.
/// </summary>
public sealed record AuthenticatedCanonicalCountyContextResult
{
    private AuthenticatedCanonicalCountyContextResult(
        AuthenticatedCanonicalCountyContextDecision decision,
        string? actorId,
        Guid? countyId,
        WashingtonCountyIdentity? county)
    {
        Decision = decision;
        ActorId = actorId;
        CountyId = countyId;
        County = county;
    }

    public AuthenticatedCanonicalCountyContextDecision Decision { get; }

    public string? ActorId { get; }

    public Guid? CountyId { get; }

    public WashingtonCountyIdentity? County { get; }

    internal static AuthenticatedCanonicalCountyContextResult Denied { get; } =
        new(AuthenticatedCanonicalCountyContextDecision.Denied, null, null, null);

    internal static AuthenticatedCanonicalCountyContextResult Established(
        string actorId,
        Guid countyId,
        WashingtonCountyIdentity county) =>
        new(AuthenticatedCanonicalCountyContextDecision.Established, actorId, countyId, county);
}

/// <summary>
/// Establishes a bounded canonical county context from protected authenticated binding evidence.
/// The resolver is used only to observe the persisted GUID for each exact canonical registry key.
/// </summary>
public sealed class AuthenticatedCanonicalCountyContext
{
    public const string ContractId = "wal.authenticated-canonical-county-context.v1";

    private const int ExpectedCanonicalCountyCount = 39;

    private readonly ICountyResolver _countyResolver;

    public AuthenticatedCanonicalCountyContext(ICountyResolver countyResolver)
    {
        _countyResolver = countyResolver
            ?? throw new ArgumentNullException(nameof(countyResolver));
    }

    public async Task<AuthenticatedCanonicalCountyContextResult> EstablishAsync(
        AuthenticatedCountyAuthorityBindingResult? binding,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (binding is null)
        {
            return AuthenticatedCanonicalCountyContextResult.Denied;
        }

        // The protected result is immutable, but copy its bounded scalar evidence before the first
        // await so this operation never consults caller or request state during the registry scan.
        var decision = binding.Decision;
        var actorId = binding.ActorId;
        var countyId = binding.CountyId;

        var canonicalCounties = WashingtonCountyRegistry.Counties;
        if (decision != AuthenticatedCountyAuthorityBindingDecision.Bound
            || string.IsNullOrWhiteSpace(actorId)
            || countyId is null
            || countyId == Guid.Empty
            || canonicalCounties.Count != ExpectedCanonicalCountyCount)
        {
            return AuthenticatedCanonicalCountyContextResult.Denied;
        }

        WashingtonCountyIdentity? matchedCounty = null;
        var matchCount = 0;

        foreach (var canonicalCounty in canonicalCounties)
        {
            var resolvedCountyId = await _countyResolver
                .TryResolveAsync(canonicalCounty.Key, cancellationToken)
                .ConfigureAwait(false);

            cancellationToken.ThrowIfCancellationRequested();

            if (resolvedCountyId == countyId.Value)
            {
                matchCount++;
                matchedCounty ??= canonicalCounty;
            }
        }

        return matchCount == 1 && matchedCounty is not null
            ? AuthenticatedCanonicalCountyContextResult.Established(
                actorId,
                countyId.Value,
                matchedCounty)
            : AuthenticatedCanonicalCountyContextResult.Denied;
    }
}
