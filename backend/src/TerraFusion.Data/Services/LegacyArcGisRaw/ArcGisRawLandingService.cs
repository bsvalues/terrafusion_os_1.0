using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.LegacyArcGisRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.GIS.ArcGisRest;
using TerraFusion.Core.Sync.ArcGisRawLanding;

namespace TerraFusion.Data.Services.LegacyArcGisRaw;

/// <summary>
/// Slice D1: drains the existing G1-C
/// <see cref="IArcGisFeatureServiceClient"/> for one county and
/// lands every feature verbatim into
/// <c>legacy_arcgis_raw.parcel_geom</c> with full provenance.
/// Records four R-* promotion gates per the doctrine pattern:
///
/// <list type="bullet">
///   <item><c>arcgis-raw-source-batch-completed</c> —
///   informational PASS once the LoadBatch closes.</item>
///   <item><c>arcgis-raw-key-uniqueness</c> — FAIL when any
///   <c>(CountyId, ArcGisObjectId)</c> tuple appears more than
///   once in the FeatureService response.</item>
///   <item><c>arcgis-raw-provenance-coverage</c> — FAIL when any
///   landed row lacks <c>LoadBatchId</c>, <c>SourceQueryHash</c>,
///   or <c>SourceRowHash</c>.</item>
///   <item><c>arcgis-raw-aggregate</c> — informational counts +
///   total area for spot-checking.</item>
/// </list>
///
/// <para>The G1-C client is reused as-is — no shape change. This
/// service exists solely to wrap the client output in the
/// 5-schema-doctrine landing layer that was missing before D1.</para>
/// </summary>
public sealed class ArcGisRawLandingService : IArcGisRawLandingService
{
    private readonly TerraFusionDbContext _db;
    private readonly IArcGisFeatureServiceClient _client;
    private readonly ILogger<ArcGisRawLandingService> _logger;

    public ArcGisRawLandingService(
        TerraFusionDbContext db,
        IArcGisFeatureServiceClient client,
        ILogger<ArcGisRawLandingService> logger)
    {
        _db = db;
        _client = client;
        _logger = logger;
    }

    public async Task<ArcGisRawLandingResult> LandParcelGeomsAsync(
        string fipsCode,
        Guid countyId,
        string operatorName,
        int? topN,
        CancellationToken cancellationToken = default)
    {
        // Stable hash encodes the exact query parameters so TopN=100 and TopN=500
        // (or full-corpus) produce distinct hashes, enabling provenance traceability.
        var topNPart = topN.HasValue
            ? $" topN={topN.Value.ToString(System.Globalization.CultureInfo.InvariantCulture)} orderByFields=OBJECTID+ASC"
            : " fullCorpus=true";
        var queryDescriptor = $"fips={fipsCode} county={countyId} f=geojson where=1=1 outSR=4326 returnGeometry=true{topNPart}";
        var queryHash = ComputeStableHash(queryDescriptor);

        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-feature-service",
            SourceFileOrDatabase = $"county:{countyId} fips={fipsCode}",
            SourceQueryHash = queryHash,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var features = await _client.FetchParcelsAsync(fipsCode, countyId, topN, cancellationToken)
                .ConfigureAwait(false);

            var considered = features.Count;
            var landed = 0;
            double areaSum = 0d;
            var keyCounts = new Dictionary<(Guid, long), int>();
            var now = DateTime.UtcNow;

            foreach (var feature in features)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var key = (feature.CountyId, feature.ArcGisObjectId);
                keyCounts[key] = keyCounts.TryGetValue(key, out var c) ? c + 1 : 1;

                _db.LegacyArcGisRawParcelGeoms.Add(new LegacyArcGisRawParcelGeom
                {
                    CountyId = feature.CountyId,
                    ArcGisObjectId = feature.ArcGisObjectId,
                    ArcGisApn = feature.ArcGisApn,
                    GeomWkt = feature.GeomWkt,
                    CentroidLat = feature.CentroidLat,
                    CentroidLon = feature.CentroidLon,
                    AreaSqFt = feature.AreaSqFt,
                    SourceServiceUrl = feature.SourceServiceUrl,
                    LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = queryHash,
                    SourceRowHash = ComputeRowHash(feature),
                    LandedAt = now,
                });
                landed++;
                areaSum += feature.AreaSqFt;
            }

            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            var duplicateKeyViolations = keyCounts.Values.Count(c => c > 1);

            await WriteGatesAsync(
                batch, considered, landed, duplicateKeyViolations, areaSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = landed;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "ArcGIS parcel_geom landing COMPLETED. batch={BatchId} county={CountyId} considered={Considered} landed={Landed} duplicates={Dups} areaSum={AreaSum}",
                batch.LoadBatchId, countyId, considered, landed, duplicateKeyViolations, areaSum);

            return new ArcGisRawLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                FeaturesConsidered = considered,
                FeaturesLanded = landed,
                DuplicateObjectIds = duplicateKeyViolations,
                AreaSqFtSum = areaSum,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogError(ex,
                "ArcGIS parcel_geom landing FAILED. batch={BatchId} county={CountyId} summary={Summary}",
                batch.LoadBatchId, countyId, summary);

            return new ArcGisRawLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                FeaturesConsidered = 0,
                FeaturesLanded = 0,
                DuplicateObjectIds = 0,
                AreaSqFtSum = 0d,
                ErrorSummary = summary,
            };
        }
    }

    public async Task<ArcGisRawLandingResult> LandParcelGeomsPagedAsync(
        string fipsCode,
        Guid countyId,
        string operatorName,
        int pageSize,
        int? topN,
        CancellationToken cancellationToken = default)
    {
        if (pageSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(pageSize), pageSize, "PageSize must be greater than zero.");

        // Preflight: get total feature count so we know when to stop and can set the safety cap.
        int preflightCount;
        try
        {
            preflightCount = await _client.FetchCountAsync(fipsCode, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var countErr = $"FetchCountAsync failed: {ex.GetType().Name}: {ex.Message}";
            _logger.LogError(ex, "ArcGIS paged landing: preflight count failed for fips={Fips}", fipsCode);
            return new ArcGisRawLandingResult
            {
                LoadBatchId = Guid.Empty,
                Status = "FAILED",
                FeaturesConsidered = 0,
                FeaturesLanded = 0,
                DuplicateObjectIds = 0,
                AreaSqFtSum = 0d,
                ErrorSummary = countErr,
            };
        }

        _logger.LogInformation(
            "ArcGIS paged landing preflight: fips={Fips} county={CountyId} preflightCount={Count} pageSize={PageSize} topN={TopN}",
            fipsCode, countyId, preflightCount, pageSize, topN);

        // Effective max: topN cap or full preflight count.
        var effectiveMax = topN.HasValue ? Math.Min(topN.Value, preflightCount) : preflightCount;
        // targetCount: how many features to collect before stopping.
        // Drive the loop on this, not on exceededTransferLimit (advisory only).
        var targetCount = Math.Min(preflightCount, effectiveMax);
        // Safety cap: 2× pages needed plus 1.
        var maxPages = (int)Math.Ceiling((double)targetCount / pageSize) * 2 + 1;

        var baseDescriptor = $"fips={fipsCode} county={countyId} f=geojson where=1=1 outSR=4326 returnGeometry=true paged=true pageSize={pageSize.ToString(CultureInfo.InvariantCulture)}";

        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-feature-service",
            SourceFileOrDatabase = $"county:{countyId} fips={fipsCode}",
            SourceQueryHash = ComputeStableHash(baseDescriptor),
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var seenKeys = new HashSet<(Guid, long)>();
            int totalConsidered = 0, totalLanded = 0, totalDuplicates = 0;
            double totalAreaSum = 0d;
            int pageIndex = 0;

            while (pageIndex < maxPages)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // Primary termination: we've seen enough of the corpus.
                if (totalConsidered >= targetCount) break;

                var offset = pageIndex * pageSize;
                var remaining = targetCount - totalConsidered;
                var thisPageSize = Math.Min(pageSize, remaining);

                var (features, exceededLimit) = await _client.FetchPageAsync(
                    fipsCode, countyId, offset, thisPageSize, cancellationToken).ConfigureAwait(false);

                totalConsidered += features.Count;

                if (features.Count == 0)
                {
                    _logger.LogInformation("[Paged:D1] page={Page} returned 0 features — stopping", pageIndex);
                    break;
                }

                var now = DateTime.UtcNow;
                var pageDescriptor = $"{baseDescriptor} offset={offset.ToString(CultureInfo.InvariantCulture)}";
                var pageQueryHash = ComputeStableHash(pageDescriptor);

                foreach (var feature in features)
                {
                    var key = (feature.CountyId, feature.ArcGisObjectId);
                    if (!seenKeys.Add(key))
                    {
                        totalDuplicates++;
                        continue;
                    }

                    _db.LegacyArcGisRawParcelGeoms.Add(new LegacyArcGisRawParcelGeom
                    {
                        CountyId = feature.CountyId,
                        ArcGisObjectId = feature.ArcGisObjectId,
                        ArcGisApn = feature.ArcGisApn,
                        GeomWkt = feature.GeomWkt,
                        CentroidLat = feature.CentroidLat,
                        CentroidLon = feature.CentroidLon,
                        AreaSqFt = feature.AreaSqFt,
                        SourceServiceUrl = feature.SourceServiceUrl,
                        LoadBatchId = batch.LoadBatchId,
                        SourceQueryHash = pageQueryHash,
                        SourceRowHash = ComputeRowHash(feature),
                        LandedAt = now,
                    });
                    totalLanded++;
                    totalAreaSum += feature.AreaSqFt;
                }

                // Per-page save keeps memory bounded across large corpus.
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                // GEOM-011B-H1: detach the geometry entities just persisted so the EF
                // ChangeTracker does not accumulate thousands of landed rows across pages
                // during a full-corpus (~80k row) run — a memory/throughput risk flagged in
                // GEOM-011B review. Only the page's LegacyArcGisRawParcelGeom entries are
                // detached; the LoadBatch entity stays tracked so the COMPLETED finalize
                // below (and the FAILED update in the catch path) still persist correctly.
                // A blanket ChangeTracker.Clear() would detach the batch and break those
                // updates, so detaching by type is the batch-safe equivalent.
                foreach (var entry in _db.ChangeTracker
                             .Entries<LegacyArcGisRawParcelGeom>().ToList())
                    entry.State = EntityState.Detached;

                if (exceededLimit)
                    _logger.LogDebug(
                        "[Paged:D1] page={Page} server set exceededTransferLimit (advisory — continuing to next page)",
                        pageIndex);

                _logger.LogInformation(
                    "[Paged:D1] page={Page} offset={Offset} features={Count} exceeded={Exceeded} totalConsidered={Total}",
                    pageIndex, offset, features.Count, exceededLimit, totalConsidered);

                pageIndex++;
            }

            await WriteGatesAsync(
                batch, totalConsidered, totalLanded, totalDuplicates, totalAreaSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = totalConsidered;
            batch.RowsPromoted = totalLanded;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "ArcGIS paged landing COMPLETED. batch={BatchId} county={CountyId} pages={Pages} considered={Considered} landed={Landed} dupes={Dups}",
                batch.LoadBatchId, countyId, pageIndex, totalConsidered, totalLanded, totalDuplicates);

            return new ArcGisRawLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                FeaturesConsidered = totalConsidered,
                FeaturesLanded = totalLanded,
                DuplicateObjectIds = totalDuplicates,
                AreaSqFtSum = totalAreaSum,
                TotalPages = pageIndex,
                PaginatedMode = true,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogError(ex,
                "ArcGIS paged landing FAILED. batch={BatchId} county={CountyId} summary={Summary}",
                batch.LoadBatchId, countyId, summary);

            return new ArcGisRawLandingResult
            {
                LoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                FeaturesConsidered = 0,
                FeaturesLanded = 0,
                DuplicateObjectIds = 0,
                AreaSqFtSum = 0d,
                ErrorSummary = summary,
                TotalPages = 0,
                PaginatedMode = true,
            };
        }
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        int considered,
        int landed,
        int duplicateKeyViolations,
        double areaSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) arcgis-raw-source-batch-completed — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-raw-source-batch-completed",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = considered.ToString(CultureInfo.InvariantCulture),
            Detail = $"FeatureService returned {considered} features for batch={batch.LoadBatchId}",
            ExecutedAt = now,
        });

        // 2) arcgis-raw-key-uniqueness — doctrine invariant.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-raw-key-uniqueness",
            GateStage = "SOURCE_TO_RAW",
            Status = duplicateKeyViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = duplicateKeyViolations.ToString(CultureInfo.InvariantCulture),
            Detail = duplicateKeyViolations == 0
                ? "every (CountyId, ArcGisObjectId) is unique"
                : $"{duplicateKeyViolations} (CountyId, ArcGisObjectId) tuples appeared more than once",
            ExecutedAt = now,
        });

        // 3) arcgis-raw-provenance-coverage — assert from DB.
        var unprovenanced = await _db.LegacyArcGisRawParcelGeoms
            .Where(r => r.LoadBatchId == batch.LoadBatchId
                        && (r.LoadBatchId == Guid.Empty
                            || string.IsNullOrEmpty(r.SourceQueryHash)
                            || string.IsNullOrEmpty(r.SourceRowHash)))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-raw-provenance-coverage",
            GateStage = "SOURCE_TO_RAW",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {landed} landed rows have load_batch_id, source_query_hash, source_row_hash"
                : $"{unprovenanced} rows lack provenance",
            ExecutedAt = now,
        });

        // 4) arcgis-raw-aggregate — informational counts.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-raw-aggregate",
            GateStage = "SOURCE_TO_RAW",
            Status = "PASS",
            Expected = "informational",
            Actual = landed.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} landed={landed} " +
                     $"areaSqFtSum={areaSum.ToString("F2", CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string ComputeStableHash(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        // 16-hex-char prefix mirrors LegacyPacsRaw landing services.
        var sb = new StringBuilder(16);
        for (var i = 0; i < 8; i++)
        {
            sb.Append(hash[i].ToString("x2", CultureInfo.InvariantCulture));
        }
        return sb.ToString();
    }

    private static string ComputeRowHash(ArcGisParcelFeature feature)
    {
        // Per-row content hash so D2 can detect content drift across
        // batches without parsing WKT. Includes the geometry text so
        // any polygon edit flips the hash.
        var raw = string.Concat(
            feature.CountyId.ToString(),
            "",
            feature.ArcGisObjectId.ToString(CultureInfo.InvariantCulture),
            "",
            feature.ArcGisApn ?? string.Empty,
            "",
            feature.GeomWkt,
            "",
            feature.CentroidLat.ToString("R", CultureInfo.InvariantCulture),
            "",
            feature.CentroidLon.ToString("R", CultureInfo.InvariantCulture),
            "",
            feature.AreaSqFt.ToString("R", CultureInfo.InvariantCulture));
        return ComputeStableHash(raw);
    }
}
