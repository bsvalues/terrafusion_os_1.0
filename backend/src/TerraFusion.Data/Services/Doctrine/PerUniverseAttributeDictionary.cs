using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: default <see cref="IPerUniverseAttributeDictionary"/>
/// backed by <c>doctrine_tf.tf_doctrine_attribute_dictionary</c>.
///
/// <para>Registered Singleton; cached per <c>(county, universe)</c>.
/// Cache contains a <see cref="HashSet{T}"/> of
/// <c>(imprv_attr_id || '|' || i_attr_val_cd)</c> pairs alongside
/// the matching <see cref="TfDoctrineAttributeDictionary"/> row for
/// returning the dictionary row id.</para>
///
/// <para>Empty cache for a known universe yields
/// <see cref="DictionaryLookupResult.DictionaryNotLoaded"/> rather
/// than <see cref="DictionaryLookupResult.UnknownForUniverse"/>;
/// this lets the operator distinguish "code is genuinely absent"
/// from "we haven't seeded this universe's dictionary yet".</para>
/// </summary>
public sealed class PerUniverseAttributeDictionary : IPerUniverseAttributeDictionary
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PerUniverseAttributeDictionary> _logger;

    // (county, universe) → dictionary entries (active only).
    private readonly ConcurrentDictionary<(string County, string Universe),
        IReadOnlyList<TfDoctrineAttributeDictionary>> _cache =
            new(new CountyUniverseKeyComparer());

    public PerUniverseAttributeDictionary(
        IServiceScopeFactory scopeFactory,
        ILogger<PerUniverseAttributeDictionary> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<DictionaryLookupResult> LookupAsync(
        string county,
        string universeCode,
        int year,
        string imprvAttrId,
        string iAttrValCd,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(county))
            throw new ArgumentException("County is required.", nameof(county));
        if (string.IsNullOrWhiteSpace(universeCode))
            return DictionaryLookupResult.NotEvaluated();

        // UNKNOWN sentinel never has dictionary entries by definition.
        if (string.Equals(universeCode, UniverseCodes.Unknown, StringComparison.OrdinalIgnoreCase))
            return DictionaryLookupResult.NotEvaluated();

        var entries = await GetEntriesAsync(county, universeCode, cancellationToken)
            .ConfigureAwait(false);

        if (entries.Count == 0)
            return DictionaryLookupResult.DictionaryNotLoaded();

        var match = entries
            .Where(e => year >= e.EffectiveStartYear
                     && (e.EffectiveEndYear == null || year <= e.EffectiveEndYear))
            .Where(e => string.Equals(e.ImprvAttrId, imprvAttrId, StringComparison.Ordinal)
                     && string.Equals(e.IAttrValCd, iAttrValCd, StringComparison.Ordinal))
            .OrderByDescending(e => e.ApprovedAt ?? e.CreatedAt)
            .FirstOrDefault();

        return match is null
            ? DictionaryLookupResult.UnknownForUniverse()
            : DictionaryLookupResult.Known(match.DictionaryRowId);
    }

    public async Task<int> CountForUniverseAsync(
        string county, string universeCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(county) || string.IsNullOrWhiteSpace(universeCode)) return 0;
        if (string.Equals(universeCode, UniverseCodes.Unknown, StringComparison.OrdinalIgnoreCase))
            return 0;

        var entries = await GetEntriesAsync(county, universeCode, cancellationToken)
            .ConfigureAwait(false);
        return entries.Count;
    }

    public void InvalidateCache(string? county = null)
    {
        if (county is null) { _cache.Clear(); return; }
        var keys = _cache.Keys.Where(k =>
            string.Equals(k.County, county, StringComparison.OrdinalIgnoreCase)).ToList();
        foreach (var k in keys) _cache.TryRemove(k, out _);
    }

    // ── private ────────────────────────────────────────────────────────

    private async Task<IReadOnlyList<TfDoctrineAttributeDictionary>> GetEntriesAsync(
        string county, string universeCode, CancellationToken cancellationToken)
    {
        var key = (county, universeCode);
        if (_cache.TryGetValue(key, out var cached)) return cached;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var entries = await db.TfDoctrineAttributeDictionaries
            .AsNoTracking()
            .Where(e => e.County == county
                     && e.UniverseCode == universeCode
                     && e.ActiveFlag)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        _logger.LogDebug(
            "PerUniverseAttributeDictionary: loaded {Count} entries for ({County}, {Universe})",
            entries.Count, county, universeCode);

        _cache[key] = entries;
        return entries;
    }

    private sealed class CountyUniverseKeyComparer
        : IEqualityComparer<(string County, string Universe)>
    {
        public bool Equals(
            (string County, string Universe) x,
            (string County, string Universe) y) =>
            StringComparer.OrdinalIgnoreCase.Equals(x.County, y.County)
            && StringComparer.OrdinalIgnoreCase.Equals(x.Universe, y.Universe);

        public int GetHashCode((string County, string Universe) obj) =>
            HashCode.Combine(
                StringComparer.OrdinalIgnoreCase.GetHashCode(obj.County ?? string.Empty),
                StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Universe ?? string.Empty));
    }
}
