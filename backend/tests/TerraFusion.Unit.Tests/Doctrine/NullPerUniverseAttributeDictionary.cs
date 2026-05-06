using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Unit.Tests.Doctrine;

/// <summary>
/// Test double for <see cref="IPerUniverseAttributeDictionary"/> that
/// behaves as if no universe-aware dictionary entries exist. Every
/// known-universe lookup returns
/// <see cref="DictionaryLookupOutcome.DictionaryNotLoaded"/>; every
/// unknown-universe call returns
/// <see cref="DictionaryLookupOutcome.UniverseNotEvaluated"/>.
///
/// <para>Use this double when a test asserts on universe-aware
/// quarantine context but does not need to populate a per-universe
/// dictionary itself.</para>
/// </summary>
public sealed class NullPerUniverseAttributeDictionary : IPerUniverseAttributeDictionary
{
    public Task<DictionaryLookupResult> LookupAsync(
        string county,
        string universeCode,
        int year,
        string imprvAttrId,
        string iAttrValCd,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(universeCode)
            || universeCode.Equals(UniverseCodes.Unknown, System.StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(DictionaryLookupResult.NotEvaluated());
        }

        return Task.FromResult(DictionaryLookupResult.DictionaryNotLoaded());
    }

    public Task<int> CountForUniverseAsync(
        string county, string universeCode, CancellationToken cancellationToken = default) =>
        Task.FromResult(0);

    public void InvalidateCache(string? county = null) { /* no-op */ }
}
