using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.ArcGisCanonical;

namespace TerraFusion.Data.Services.GisTf;

/// <summary>
/// Slice D3: truth → canonical projector for ArcGIS parcel
/// polygons.
///
/// <list type="bullet">
///   <item><c>canonical-geom-source-batch-completed</c> — most
///   recent D2 promotion batch for the target county must be
///   COMPLETED. FAIL refuses projection.</item>
///   <item><c>canonical-geom-source-xref-coverage</c> — every
///   projected <c>tf_parcel_geom</c> has a corresponding
///   <c>source_xref</c> entry with
///   <c>TfEntityType="geom_parcel"</c>. FAIL on any miss.</item>
///   <item><c>canonical-geom-county-isolation</c> — every
///   projected row carries a non-empty <c>CountyId</c>. FAIL
///   on any miss.</item>
///   <item><c>canonical-geom-apn-crosswalk-coverage</c> —
///   informational; counts resolved vs unresolved APN matches
///   against <c>tf_parcel.ParcelNumber</c>. Unresolved rows
///   project with <c>TfParcelId = null</c> (pending crosswalk).</item>
///   <item><c>canonical-geom-aggregate</c> — informational;
///   count + <c>AreaSqFt</c> sum.</item>
/// </list>
///
/// <para>Per Block-D execution plan §3.3 and contract v1.8: the
/// existing <c>TfParcelGeom</c> schema gains no new column in
/// D3 — the projector writes <c>SourceServiceUrl</c>,
/// <c>LastSyncedAt</c>, and the geometry fields verbatim from
/// truth. The crosswalk-pending state was already representable
/// (TfParcelId is nullable). v1.8 adds <c>TfEntityType =
/// "geom_parcel"</c> to the closed vocabulary and pins this
/// projector as the only writer to <c>gis_tf.tf_parcel_geom</c>
/// going forward.</para>
/// </summary>
public sealed class ArcGisCanonicalProjector : IArcGisCanonicalProjector
{
    private const string EntityType = "geom_parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ArcGisCanonicalProjector> _logger;

    public ArcGisCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<ArcGisCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ArcGisCanonicalResult> ProjectCountyAsync(
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "canonical-tf-arcgis-projector",
            SourceFileOrDatabase = $"county={countyId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var truthRows = await _db.TruthArcGisParcelGeomCurrents
                .Where(t => t.CountyId == countyId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // ── Gate 1: most recent contributing D2 batch is COMPLETED. ──
            var contributingBatchIds = truthRows
                .Select(t => t.PromotionLoadBatchId)
                .Distinct()
                .ToList();

            if (contributingBatchIds.Count == 0)
            {
                // No truth data for this county — empty projection
                // is still a successful run.
                await ClearPriorCanonicalAsync(countyId, batch.LoadBatchId,
                    cancellationToken).ConfigureAwait(false);
                await WriteGatesAsync(batch, sourceBatchStatus: "PASS",
                    sourceBatchDetail: "no truth rows for county",
                    truthRowsConsidered: 0, rowsProjected: 0,
                    apnResolved: 0, apnUnresolved: 0,
                    areaSum: 0d, cancellationToken).ConfigureAwait(false);

                batch.Status = "COMPLETED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.RowsExtracted = 0;
                batch.RowsPromoted = 0;
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new ArcGisCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "COMPLETED",
                    TruthRowsConsidered = 0,
                    RowsProjected = 0,
                    ApnCrosswalkResolved = 0,
                    ApnCrosswalkUnresolved = 0,
                    PriorCanonicalRowsRemoved = 0,
                    AreaSqFtSum = 0d,
                };
            }

            var truthBatches = await _db.SyncBridgeLoadBatches
                .Where(b => contributingBatchIds.Contains(b.LoadBatchId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var notCompletedBatches = truthBatches
                .Where(b => b.Status != "COMPLETED")
                .ToList();

            if (notCompletedBatches.Count > 0)
            {
                var detail =
                    $"refused: {notCompletedBatches.Count} contributing truth batch(es) " +
                    $"not COMPLETED ({string.Join(",",
                        notCompletedBatches.Select(b => $"{b.LoadBatchId}={b.Status}"))})";
                await WriteGatesAsync(batch, sourceBatchStatus: "FAIL",
                    sourceBatchDetail: detail,
                    truthRowsConsidered: 0, rowsProjected: 0,
                    apnResolved: 0, apnUnresolved: 0,
                    areaSum: 0d, cancellationToken).ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = detail;
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new ArcGisCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthRowsConsidered = 0,
                    RowsProjected = 0,
                    ApnCrosswalkResolved = 0,
                    ApnCrosswalkUnresolved = 0,
                    PriorCanonicalRowsRemoved = 0,
                    AreaSqFtSum = 0d,
                    ErrorSummary = detail,
                };
            }

            // ── Idempotency: clear prior canonical + xrefs for tuples
            //    in this county. ──
            var priorRemoved = await ClearPriorCanonicalAsync(
                countyId, batch.LoadBatchId, cancellationToken).ConfigureAwait(false);

            // ── APN crosswalk index: parcel_number → TfParcelId. ──
            var apnIndex = await _db.TfParcels
                .Where(p => p.CountyId == countyId
                            && p.ParcelNumber != null)
                .Select(p => new { p.ParcelNumber, p.TfParcelId })
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // APN-NORMALIZATION (2026-06-04): the ArcGIS APN (geo_id) lands
            // SPACE-PADDED (e.g. '112882020000008           ') while
            // tf_parcel.ParcelNumber is clean. A raw equality match resolved only
            // ~11,424 of 80,075 geoms; TRIM-normalizing BOTH sides recovers 79,460
            // (99.2%). Key the crosswalk index by trimmed ParcelNumber and look up
            // by trimmed ArcGisApn so the padding can no longer defeat the join.
            var apnByParcel = apnIndex
                .Where(x => !string.IsNullOrWhiteSpace(x.ParcelNumber))
                .GroupBy(x => x.ParcelNumber!.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    g => g.Key,
                    g => g.First().TfParcelId,
                    StringComparer.OrdinalIgnoreCase);

            // ── Project each truth row. ──
            var considered = truthRows.Count;
            var projected = 0;
            var apnResolved = 0;
            var apnUnresolved = 0;
            double areaSum = 0d;
            var now = DateTime.UtcNow;

            foreach (var truth in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                Guid? resolvedTfParcelId = null;
                if (!string.IsNullOrWhiteSpace(truth.ArcGisApn)
                    && apnByParcel.TryGetValue(truth.ArcGisApn.Trim(), out var pid))
                {
                    resolvedTfParcelId = pid;
                    apnResolved++;
                }
                else
                {
                    apnUnresolved++;
                }

                var canonical = new TfParcelGeom
                {
                    TfParcelId = resolvedTfParcelId,
                    CountyId = truth.CountyId,
                    ArcGisObjectId = truth.ArcGisObjectId,
                    ArcGisApn = truth.ArcGisApn,
                    GeomWkt = truth.GeomWkt,
                    CentroidLat = truth.CentroidLat,
                    CentroidLon = truth.CentroidLon,
                    AreaSqFt = truth.AreaSqFt,
                    SourceServiceUrl = truth.SourceServiceUrl,
                    LastSyncedAt = now,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfParcelGeoms.Add(canonical);

                var sourceKeyJson = JsonSerializer.Serialize(new
                {
                    county_id = truth.CountyId,
                    arcgis_object_id = truth.ArcGisObjectId,
                });
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType,
                    TfEntityId = canonical.TfParcelGeomId,
                    SourceSystem = "ARCGIS_REST",
                    SourceTable = "parcel_geom",
                    SourceKeyJson = sourceKeyJson,
                    SourceQueryHash = string.Empty,
                    LoadBatchId = batch.LoadBatchId,
                    FirstSeenAt = now,
                    LastSeenAt = now,
                    IsActive = true,
                });

                projected++;
                areaSum += truth.AreaSqFt;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteGatesAsync(batch,
                sourceBatchStatus: "PASS",
                sourceBatchDetail: $"{truthBatches.Count} contributing truth batch(es) all COMPLETED",
                truthRowsConsidered: considered,
                rowsProjected: projected,
                apnResolved: apnResolved,
                apnUnresolved: apnUnresolved,
                areaSum: areaSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "ArcGIS canonical projection COMPLETED. batch={BatchId} county={CountyId} considered={Considered} projected={Projected} apnResolved={ApnResolved} apnUnresolved={ApnUnresolved} priorRemoved={PriorRemoved} areaSum={AreaSum}",
                batch.LoadBatchId, countyId, considered, projected,
                apnResolved, apnUnresolved, priorRemoved, areaSum);

            return new ArcGisCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthRowsConsidered = considered,
                RowsProjected = projected,
                ApnCrosswalkResolved = apnResolved,
                ApnCrosswalkUnresolved = apnUnresolved,
                PriorCanonicalRowsRemoved = priorRemoved,
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
                "ArcGIS canonical projection FAILED. batch={BatchId} county={CountyId} summary={Summary}",
                batch.LoadBatchId, countyId, summary);

            return new ArcGisCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthRowsConsidered = 0,
                RowsProjected = 0,
                ApnCrosswalkResolved = 0,
                ApnCrosswalkUnresolved = 0,
                PriorCanonicalRowsRemoved = 0,
                AreaSqFtSum = 0d,
                ErrorSummary = summary,
            };
        }
    }

    private async Task<int> ClearPriorCanonicalAsync(
        Guid countyId,
        Guid currentBatchId,
        CancellationToken cancellationToken)
    {
        // Identify prior canonical rows by their county xref and
        // their xref's SourceKeyJson 2-tuple. Clean approach:
        // pull all source_xref entries of TfEntityType="geom_parcel"
        // whose SourceKeyJson contains the target CountyId, drop
        // their canonical rows + xrefs.
        var allXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == EntityType && x.IsActive)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var priorXrefs = new List<SourceXref>();
        var priorCanonicalIds = new HashSet<Guid>();
        foreach (var x in allXrefs)
        {
            try
            {
                using var doc = JsonDocument.Parse(x.SourceKeyJson);
                if (!doc.RootElement.TryGetProperty("county_id", out var cEl))
                    continue;
                var cidStr = cEl.GetString();
                if (cidStr is null || !Guid.TryParse(cidStr, out var cid))
                    continue;
                if (cid == countyId && x.LoadBatchId != currentBatchId)
                {
                    priorXrefs.Add(x);
                    priorCanonicalIds.Add(x.TfEntityId);
                }
            }
            catch (JsonException)
            {
                continue;
            }
        }

        var priorCanonical = await _db.TfParcelGeoms
            .Where(c => priorCanonicalIds.Contains(c.TfParcelGeomId))
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        if (priorCanonical.Count > 0) _db.TfParcelGeoms.RemoveRange(priorCanonical);
        if (priorXrefs.Count > 0) _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
        if (priorCanonical.Count + priorXrefs.Count > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        return priorCanonical.Count;
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        string sourceBatchStatus,
        string sourceBatchDetail,
        int truthRowsConsidered,
        int rowsProjected,
        int apnResolved,
        int apnUnresolved,
        double areaSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) canonical-geom-source-batch-completed.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-geom-source-batch-completed",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = sourceBatchStatus,
            Expected = "all contributing batches COMPLETED",
            Actual = sourceBatchStatus,
            Detail = sourceBatchDetail,
            ExecutedAt = now,
        });

        if (sourceBatchStatus == "FAIL")
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return;
        }

        // 2) canonical-geom-source-xref-coverage.
        var projectedIds = await _db.TfParcelGeoms
            .Where(c => c.IsActive)
            .Select(c => c.TfParcelGeomId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == EntityType
                        && x.LoadBatchId == batch.LoadBatchId
                        && projectedIds.Contains(x.TfEntityId))
            .Select(x => x.TfEntityId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        var coverageMissing = rowsProjected - xrefIds.Count;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-geom-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = rowsProjected.ToString(CultureInfo.InvariantCulture),
            Actual = xrefIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {rowsProjected} tf_parcel_geom rows have source_xref"
                : $"{coverageMissing} tf_parcel_geom rows lack source_xref",
            ExecutedAt = now,
        });

        // 3) canonical-geom-county-isolation.
        var emptyCountyCount = await _db.TfParcelGeoms
            .Where(c => projectedIds.Contains(c.TfParcelGeomId)
                        && c.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-geom-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_parcel_geom has a non-empty CountyId"
                : $"{emptyCountyCount} rows have empty CountyId",
            ExecutedAt = now,
        });

        // 4) canonical-geom-apn-crosswalk-coverage — informational.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-geom-apn-crosswalk-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = apnResolved.ToString(CultureInfo.InvariantCulture),
            Detail = $"projected={rowsProjected} apnResolved={apnResolved} apnUnresolved={apnUnresolved}",
            ExecutedAt = now,
        });

        // 5) canonical-geom-aggregate.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-geom-aggregate",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsProjected.ToString(CultureInfo.InvariantCulture),
            Detail = $"truthConsidered={truthRowsConsidered} projected={rowsProjected} " +
                     $"areaSqFtSum={areaSum.ToString("F2", CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
