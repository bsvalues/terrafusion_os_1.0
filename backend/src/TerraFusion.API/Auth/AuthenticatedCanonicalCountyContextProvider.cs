using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.Counties;

namespace TerraFusion.API.Auth;

/// <summary>
/// Establishes canonical Washington county context from only the current authenticated request.
/// The resulting evidence grants no role, capability, activation, or resource access.
/// </summary>
public sealed class AuthenticatedCanonicalCountyContextProvider
{
    public const string ContractId = "wal.authenticated-canonical-county-runtime-context.v1";

    private readonly AuthenticatedCountyAuthorityBinding _binding;
    private readonly AuthenticatedCanonicalCountyContext _canonicalContext;

    public AuthenticatedCanonicalCountyContextProvider(
        AuthenticatedCountyAuthorityBinding binding,
        AuthenticatedCanonicalCountyContext canonicalContext)
    {
        _binding = binding ?? throw new ArgumentNullException(nameof(binding));
        _canonicalContext = canonicalContext
            ?? throw new ArgumentNullException(nameof(canonicalContext));
    }

    /// <summary>
    /// Returns established canonical context or the shared data-free denial. No county selector is
    /// accepted; authority derives exclusively from the current authenticated request context.
    /// </summary>
    public async Task<AuthenticatedCanonicalCountyContextResult> GetCurrentAsync(
        CancellationToken cancellationToken = default)
    {
        var binding = await _binding
            .BindCurrentAsync(cancellationToken)
            .ConfigureAwait(false);

        return await _canonicalContext
            .EstablishAsync(binding, cancellationToken)
            .ConfigureAwait(false);
    }
}

/// <summary>
/// Registers the authenticated canonical county context chain with one instance of each component
/// per API request scope.
/// </summary>
public static class AuthenticatedCanonicalCountyContextServiceCollectionExtensions
{
    public static IServiceCollection AddAuthenticatedCanonicalCountyContext(
        this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<AuthenticatedCountyAuthorityBinding>();
        services.AddScoped<AuthenticatedCanonicalCountyContext>();
        services.AddScoped<AuthenticatedCanonicalCountyContextProvider>();

        return services;
    }
}
