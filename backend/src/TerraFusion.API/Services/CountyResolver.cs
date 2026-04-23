using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services;

/// <summary>
/// Default implementation of <see cref="ICountyResolver"/>.
/// Caches county Guid ↔ Name lookups in memory for 5 minutes. The county table
/// is small (~39 WA counties) and changes rarely — caching is free.
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

        // Precedence 2: name match, case-insensitive.
        if (lookup.NameToId.TryGetValue(input, out var byName))
            return byName;

        return null;
    }

    private async Task<CountyLookup> GetLookupAsync(CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey, out CountyLookup? cached) && cached != null)
            return cached;

        var rows = await _db.Counties
            .AsNoTracking()
            .Select(c => new { c.Id, c.Name })
            .ToListAsync(ct);

        var lookup = new CountyLookup
        {
            IdSet = rows.Select(r => r.Id).ToHashSet(),
            NameToId = rows.ToDictionary(
                r => r.Name,
                r => r.Id,
                StringComparer.OrdinalIgnoreCase),
        };

        _cache.Set(CacheKey, lookup, CacheTtl);
        _logger.LogDebug("[CountyResolver] Cached lookup for {Count} counties", rows.Count);
        return lookup;
    }

    private sealed class CountyLookup
    {
        public required HashSet<Guid> IdSet { get; init; }
        public required Dictionary<string, Guid> NameToId { get; init; }
    }
}
