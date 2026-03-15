// BIV-009: GIS Connector Optimizations — caching, pooling, batching
using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Core.GIS.Connectors;

// ── Spatial Index Cache ──────────────────────────────────────────────

/// <summary>
/// LRU-evicting cache for spatial query results. Keyed by a composite of
/// layer name, bounding box, and filter string. Thread-safe.
/// </summary>
public sealed class SpatialResultCache
{
    private readonly int _maxEntries;
    private readonly TimeSpan _ttl;
    private readonly ConcurrentDictionary<string, CacheEntry> _store = new();
    private readonly LinkedList<string> _accessOrder = new();
    private readonly object _evictionLock = new();

    /// <summary>Number of items currently in the cache.</summary>
    public int Count => _store.Count;

    /// <param name="maxEntries">Maximum entries before LRU eviction (default 2048).</param>
    /// <param name="ttl">Time-to-live per entry (default 5 minutes).</param>
    public SpatialResultCache(int maxEntries = 2048, TimeSpan? ttl = null)
    {
        _maxEntries = maxEntries;
        _ttl = ttl ?? TimeSpan.FromMinutes(5);
    }

    /// <summary>Build a deterministic cache key for a spatial query.</summary>
    public static string BuildKey(string layer, BoundingBox bbox, string? filter) =>
        $"{layer}|{bbox.MinLng:F6},{bbox.MinLat:F6},{bbox.MaxLng:F6},{bbox.MaxLat:F6}|{filter ?? ""}";

    /// <summary>Try to retrieve a cached feature collection.</summary>
    public bool TryGet(string key, out FeatureCollection? result)
    {
        if (_store.TryGetValue(key, out var entry) && entry.ExpiresAt > DateTimeOffset.UtcNow)
        {
            TouchKey(key);
            result = entry.Value;
            return true;
        }

        result = null;
        if (entry is not null)
            _store.TryRemove(key, out _);
        return false;
    }

    /// <summary>Store a feature collection in the cache with LRU eviction.</summary>
    public void Set(string key, FeatureCollection value)
    {
        var entry = new CacheEntry(value, DateTimeOffset.UtcNow.Add(_ttl));
        _store[key] = entry;
        TouchKey(key);
        Evict();
    }

    /// <summary>Remove all entries from the cache.</summary>
    public void Clear()
    {
        _store.Clear();
        lock (_evictionLock) { _accessOrder.Clear(); }
    }

    private void TouchKey(string key)
    {
        lock (_evictionLock)
        {
            _accessOrder.Remove(key);
            _accessOrder.AddLast(key);
        }
    }

    private void Evict()
    {
        lock (_evictionLock)
        {
            while (_accessOrder.Count > _maxEntries)
            {
                var oldest = _accessOrder.First;
                if (oldest is null) break;
                _accessOrder.RemoveFirst();
                _store.TryRemove(oldest.Value, out _);
            }
        }
    }

    private sealed record CacheEntry(FeatureCollection Value, DateTimeOffset ExpiresAt);
}

// ── Tile-Based Query Batcher ─────────────────────────────────────────

/// <summary>
/// Splits large bounding-box queries into tile-sized sub-queries for
/// efficient data retrieval and caching. Prevents single enormous
/// requests that can timeout on large datasets.
/// </summary>
public sealed class TileQueryBatcher
{
    private readonly double _tileSizeDegrees;
    private readonly ILogger _logger;

    /// <param name="tileSizeDegrees">
    /// Size of each tile in degrees. Default 0.01 (~1 km at mid-latitudes).
    /// </param>
    public TileQueryBatcher(double tileSizeDegrees = 0.01, ILogger? logger = null)
    {
        _tileSizeDegrees = tileSizeDegrees;
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger.Instance;
    }

    /// <summary>
    /// Decompose a bounding box into a grid of tile-sized sub-boxes.
    /// </summary>
    public IReadOnlyList<BoundingBox> SplitIntoTiles(BoundingBox bbox)
    {
        var tiles = new List<BoundingBox>();
        for (var lng = bbox.MinLng; lng < bbox.MaxLng; lng += _tileSizeDegrees)
        {
            for (var lat = bbox.MinLat; lat < bbox.MaxLat; lat += _tileSizeDegrees)
            {
                tiles.Add(new BoundingBox(
                    lng,
                    lat,
                    Math.Min(lng + _tileSizeDegrees, bbox.MaxLng),
                    Math.Min(lat + _tileSizeDegrees, bbox.MaxLat)));
            }
        }

        _logger.LogDebug("Split bbox into {TileCount} tiles", tiles.Count);
        return tiles;
    }

    /// <summary>
    /// Execute a spatial query in parallel across tiles, merging results.
    /// Uses the cache to skip tiles that have already been fetched.
    /// </summary>
    public async Task<FeatureCollection> QueryWithTilesAsync(
        IGisConnector connector,
        string layerName,
        BoundingBox bbox,
        string? filter,
        SpatialResultCache cache,
        int maxParallelism = 4,
        CancellationToken ct = default)
    {
        var tiles = SplitIntoTiles(bbox);
        var allFeatures = new ConcurrentBag<GisFeature>();
        var semaphore = new SemaphoreSlim(maxParallelism);

        var tasks = tiles.Select(async tile =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                var key = SpatialResultCache.BuildKey(layerName, tile, filter);
                if (cache.TryGet(key, out var cached) && cached is not null)
                {
                    foreach (var f in cached.Features) allFeatures.Add(f);
                    return;
                }

                var result = await connector.QueryFeaturesAsync(layerName, tile, filter, ct);
                cache.Set(key, result);
                foreach (var f in result.Features) allFeatures.Add(f);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);

        // Deduplicate by feature ID
        var unique = allFeatures
            .GroupBy(f => f.Id)
            .Select(g => g.First())
            .ToList();

        return new FeatureCollection(unique, unique.Count);
    }
}

// ── Connection Pool Wrapper ──────────────────────────────────────────

/// <summary>
/// Manages a pool of <see cref="IGisConnector"/> instances for providers
/// that benefit from connection reuse (e.g., persistent HTTP/2 connections).
/// </summary>
public sealed class GisConnectorPool : IDisposable
{
    private readonly ConcurrentBag<IGisConnector> _pool = new();
    private readonly Func<IGisConnector> _factory;
    private readonly int _maxSize;
    private int _currentCount;

    /// <param name="factory">Factory to create new connector instances.</param>
    /// <param name="maxSize">Maximum pool size (default 8).</param>
    public GisConnectorPool(Func<IGisConnector> factory, int maxSize = 8)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
        _maxSize = maxSize;
    }

    /// <summary>Lease a connector from the pool. Returns it via Dispose on the lease.</summary>
    public ConnectorLease Acquire()
    {
        if (_pool.TryTake(out var connector))
            return new ConnectorLease(connector, this);

        if (Interlocked.Increment(ref _currentCount) <= _maxSize)
            return new ConnectorLease(_factory(), this);

        Interlocked.Decrement(ref _currentCount);

        // Pool exhausted — spin-wait briefly then create overflow
        SpinWait.SpinUntil(() => _pool.TryTake(out connector), TimeSpan.FromSeconds(2));
        return connector is not null
            ? new ConnectorLease(connector, this)
            : new ConnectorLease(_factory(), this);
    }

    internal void Return(IGisConnector connector) => _pool.Add(connector);

    public void Dispose()
    {
        while (_pool.TryTake(out var connector))
        {
            if (connector is IDisposable d) d.Dispose();
        }
    }

    /// <summary>Disposable lease that returns the connector to the pool.</summary>
    public sealed class ConnectorLease : IDisposable
    {
        public IGisConnector Connector { get; }
        private readonly GisConnectorPool _pool;

        internal ConnectorLease(IGisConnector connector, GisConnectorPool pool)
        {
            Connector = connector;
            _pool = pool;
        }

        public void Dispose() => _pool.Return(Connector);
    }
}
