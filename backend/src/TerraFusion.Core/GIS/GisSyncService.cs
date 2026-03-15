// TFR-085: GIS Sync Service — parcel geometry sync from ArcGIS
using Microsoft.Extensions.Logging;
using TerraFusion.Core.GIS.Connectors;
using TerraFusion.Core.GIS.Config;

namespace TerraFusion.Core.GIS;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Result of a GIS layer sync operation.</summary>
public record SyncResult(
    int TotalQueried,
    int NewFeatures,
    int UpdatedFeatures,
    int SkippedFeatures,
    int Errors,
    TimeSpan Duration,
    string? ErrorMessage = null)
{
    /// <summary>Whether the sync completed without fatal errors.</summary>
    public bool Success => string.IsNullOrEmpty(ErrorMessage);
}

/// <summary>Result of importing polygon geometries.</summary>
public record ImportResult(
    int TotalImported,
    int Duplicates,
    int Invalid,
    TimeSpan Duration);

/// <summary>Result of linking parcels to their polygon geometries.</summary>
public record LinkResult(
    int TotalLinked,
    int AlreadyLinked,
    int NotFound,
    TimeSpan Duration);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// Synchronizes parcel geometry data from ArcGIS REST services into
/// the local spatial store. Handles paginated queries, polygon import,
/// and parcel-to-polygon linking.
/// </summary>
public interface IGisSyncService
{
    /// <summary>
    /// Sync parcel features from an ArcGIS layer URL into local storage.
    /// Handles pagination for large datasets (89K+ parcels).
    /// </summary>
    /// <param name="layerUrl">Full ArcGIS REST query URL for the parcel layer.</param>
    /// <param name="batchSize">Records per page (default 1000, ArcGIS max).</param>
    Task<SyncResult> SyncParcelsFromArcGisAsync(
        string layerUrl,
        int batchSize = 1000,
        CancellationToken ct = default);

    /// <summary>Import polygon geometries from a parsed feature collection.</summary>
    /// <param name="features">Parsed features containing polygon geometries.</param>
    Task<ImportResult> ImportPolygonsAsync(
        FeatureCollection features,
        CancellationToken ct = default);

    /// <summary>
    /// Link parcel records to their polygon geometries by parcel ID.
    /// </summary>
    /// <param name="parcelIds">Parcel IDs to link.</param>
    Task<LinkResult> LinkParcelsToPolygonsAsync(
        IReadOnlyList<string> parcelIds,
        CancellationToken ct = default);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production GIS sync service. Queries ArcGIS REST endpoints with
/// pagination, deduplicates incoming features, and maintains a local
/// geometry store for spatial queries.
/// </summary>
public sealed class GisSyncService : IGisSyncService
{
    private readonly IGisConnector _connector;
    private readonly ILogger<GisSyncService> _logger;

    // In-memory geometry store (production would use PostGIS or similar)
    private readonly Dictionary<string, GisFeature> _geometryStore = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, string> _parcelPolygonLinks = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _storeLock = new();

    public GisSyncService(IGisConnector connector, ILogger<GisSyncService> logger)
    {
        _connector = connector ?? throw new ArgumentNullException(nameof(connector));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<SyncResult> SyncParcelsFromArcGisAsync(
        string layerUrl,
        int batchSize = 1000,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(layerUrl);
        _logger.LogInformation("Starting parcel sync from ArcGIS: {Url}", layerUrl);

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var totalQueried = 0;
        var newCount = 0;
        var updatedCount = 0;
        var skippedCount = 0;
        var errorCount = 0;
        var offset = 0;
        var hasMore = true;

        try
        {
            while (hasMore && !ct.IsCancellationRequested)
            {
                _logger.LogDebug("Querying batch at offset {Offset}, size {Size}", offset, batchSize);

                // Query a page of parcels using a full-extent bbox
                var bbox = new BoundingBox(-180, -90, 180, 90);
                var filter = $"1=1 ORDER BY OBJECTID ASC OFFSET {offset} ROWS FETCH NEXT {batchSize} ROWS ONLY";

                FeatureCollection batch;
                try
                {
                    batch = await _connector.QueryFeaturesAsync("Parcels", bbox, filter, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to query batch at offset {Offset}", offset);
                    errorCount++;
                    break;
                }

                if (batch.Features.Count == 0)
                {
                    hasMore = false;
                    continue;
                }

                totalQueried += batch.Features.Count;

                lock (_storeLock)
                {
                    foreach (var feature in batch.Features)
                    {
                        var parcelId = feature.Attributes.TryGetValue("PARCEL_ID", out var pid)
                            ? pid?.ToString()
                            : null;

                        if (string.IsNullOrEmpty(parcelId))
                        {
                            skippedCount++;
                            continue;
                        }

                        if (_geometryStore.ContainsKey(parcelId))
                        {
                            _geometryStore[parcelId] = feature;
                            updatedCount++;
                        }
                        else
                        {
                            _geometryStore[parcelId] = feature;
                            newCount++;
                        }
                    }
                }

                offset += batchSize;

                // If we got fewer than batchSize, we've reached the end
                if (batch.Features.Count < batchSize)
                    hasMore = false;
            }

            sw.Stop();
            _logger.LogInformation(
                "Parcel sync complete: {Total} queried, {New} new, {Updated} updated, {Skipped} skipped in {Duration}",
                totalQueried, newCount, updatedCount, skippedCount, sw.Elapsed);

            return new SyncResult(totalQueried, newCount, updatedCount, skippedCount, errorCount, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Parcel sync failed after {Duration}", sw.Elapsed);
            return new SyncResult(totalQueried, newCount, updatedCount, skippedCount, errorCount + 1, sw.Elapsed, ex.Message);
        }
    }

    /// <inheritdoc />
    public Task<ImportResult> ImportPolygonsAsync(FeatureCollection features, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(features);
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var imported = 0;
        var duplicates = 0;
        var invalid = 0;

        _logger.LogInformation("Importing {Count} polygon features", features.Features.Count);

        lock (_storeLock)
        {
            foreach (var feature in features.Features)
            {
                if (feature.GeometryType is not ("Polygon" or "MultiPolygon"))
                {
                    invalid++;
                    continue;
                }

                if (feature.Coordinates.Count < 3)
                {
                    invalid++;
                    continue;
                }

                if (_geometryStore.ContainsKey(feature.Id))
                {
                    duplicates++;
                    continue;
                }

                _geometryStore[feature.Id] = feature;
                imported++;
            }
        }

        sw.Stop();
        _logger.LogInformation("Import complete: {Imported} imported, {Dup} duplicates, {Invalid} invalid",
            imported, duplicates, invalid);

        return Task.FromResult(new ImportResult(imported, duplicates, invalid, sw.Elapsed));
    }

    /// <inheritdoc />
    public Task<LinkResult> LinkParcelsToPolygonsAsync(IReadOnlyList<string> parcelIds, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(parcelIds);
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var linked = 0;
        var alreadyLinked = 0;
        var notFound = 0;

        _logger.LogInformation("Linking {Count} parcels to polygon geometries", parcelIds.Count);

        lock (_storeLock)
        {
            foreach (var parcelId in parcelIds)
            {
                if (_parcelPolygonLinks.ContainsKey(parcelId))
                {
                    alreadyLinked++;
                    continue;
                }

                if (_geometryStore.ContainsKey(parcelId))
                {
                    _parcelPolygonLinks[parcelId] = parcelId;
                    linked++;
                }
                else
                {
                    notFound++;
                }
            }
        }

        sw.Stop();
        _logger.LogInformation("Link complete: {Linked} linked, {Already} already linked, {NotFound} not found",
            linked, alreadyLinked, notFound);

        return Task.FromResult(new LinkResult(linked, alreadyLinked, notFound, sw.Elapsed));
    }
}
