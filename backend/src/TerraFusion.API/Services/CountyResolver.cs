using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services;

/// <summary>
/// Default implementation of <see cref="ICountyResolver"/>.
/// Caches persisted county GUIDs and canonical Washington identity mappings in
/// memory for 5 minutes. Unknown or ambiguous identity never selects a default.
/// </summary>
public class CountyResolver : ICountyResolver
{
    private const string CacheKey = "tf.counties.lookup";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private readonly ITerraFusionDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CountyResolver> _logger;

    public CountyResolver(
        ITerraFusionDbContext db,
        IMemoryCache cache,
        ILogger<CountyResolver> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Guid> ResolveAsync(string countyIdOrCode, CancellationToken ct = default)
    {
        var resolved = await TryResolveAsync(countyIdOrCode, ct);
        return resolved ?? throw new CountyNotFoundException(countyIdOrCode);
    }

    public async Task<Guid?> TryResolveAsync(string countyIdOrCode, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(countyIdOrCode)) return null;

        var lookup = await GetLookupAsync(ct);
        var input = countyIdOrCode.Trim();

        // Precedence 1: Guid parse succeeds and county with that Id exists.
        if (Guid.TryParse(input, out var guid) && lookup.IdSet.Contains(guid))
            return guid;

        // Precedence 2: a canonical Washington key, slug, name, FIPS or alias
        // may resolve only when exactly one internally consistent persisted row
        // represents that canonical identity. Preserve the established slug
        // compatibility path while validating it through the canonical registry.
        var canonicalInput = TryGetCountyNameFromSlug(input) ?? input;
        if (WashingtonCountyRegistry.TryResolve(canonicalInput, out var county)
            && lookup.CanonicalKeyToId.TryGetValue(county.Key, out var canonicalId))
            return canonicalId;

        return null;
    }

    private static string? TryGetCountyNameFromSlug(string input)
    {
        var parts = input.Split(
            '-',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length < 2)
        {
            return null;
        }

        var hasWashingtonPrefix =
            string.Equals(parts[0], "wa", StringComparison.OrdinalIgnoreCase);
        var hasWashingtonSuffix =
            string.Equals(parts[^1], "wa", StringComparison.OrdinalIgnoreCase);
        if (!hasWashingtonPrefix && !hasWashingtonSuffix)
        {
            return null;
        }

        return WashingtonCountyRegistry.TryResolve(input, out var county)
            ? county.Name
            : null;
    }

    private async Task<CountyLookup> GetLookupAsync(CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey, out CountyLookup? cached) && cached != null)
            return cached;

        var rows = await _db.Counties
            .AsNoTracking()
            .Select(c => new { c.Id, c.Name, c.State, c.FipsCode })
            .ToListAsync(ct);

        var canonicalRows = rows
            .Where(row => string.Equals(row.State, "WA", StringComparison.OrdinalIgnoreCase))
            .Select(row => new
            {
                row.Id,
                Identity = ResolveConsistentIdentity(row.Name, row.FipsCode),
            })
            .Where(row => row.Identity is not null)
            .GroupBy(row => row.Identity!.Key, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() == 1)
            .ToDictionary(
                group => group.Key,
                group => group.Single().Id,
                StringComparer.OrdinalIgnoreCase);

        var lookup = new CountyLookup
        {
            IdSet = canonicalRows.Values.ToHashSet(),
            CanonicalKeyToId = canonicalRows,
        };

        // The shared IMemoryCache is configured with a SizeLimit in Program.cs,
        // so every entry MUST declare a Size. We use 1 — the county lookup is a
        // single logical entry regardless of row count, and the limit is used
        // purely to bound total cached entries, not byte cost.
        _cache.Set(CacheKey, lookup, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheTtl,
            Size = 1,
        });
        _logger.LogDebug(
            "[CountyResolver] Cached {RowCount} county rows with {CanonicalCount} unambiguous Washington identities",
            rows.Count,
            canonicalRows.Count);
        return lookup;
    }

    private static WashingtonCountyIdentity? ResolveConsistentIdentity(string name, string? fipsCode)
    {
        if (string.IsNullOrWhiteSpace(name) ||
            !WashingtonCountyRegistry.TryResolve(name, out var byName))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(fipsCode))
        {
            return byName;
        }

        if (!WashingtonCountyRegistry.TryResolve(fipsCode, out var byFips))
        {
            return null;
        }

        return byName == byFips ? byName : null;
    }

    private sealed class CountyLookup
    {
        public required HashSet<Guid> IdSet { get; init; }
        public required Dictionary<string, Guid> CanonicalKeyToId { get; init; }
    }
}
