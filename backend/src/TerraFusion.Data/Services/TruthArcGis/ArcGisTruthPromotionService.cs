using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.LegacyArcGisRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthArcGis;
using TerraFusion.Core.Sync.ArcGisTruthPromotion;

namespace TerraFusion.Data.Services.TruthArcGis;

/// <summary>
/// Slice D2: raw → truth promoter for ArcGIS parcel polygons.
///
/// <list type="bullet">
///   <item><c>arcgis-truth-source-batches-completed</c> — every
///   raw landing batch covering tuples in scope is COMPLETED.
///   FAIL refuses promotion if any contributing batch is
///   FAILED / IN_PROGRESS.</item>
///   <item><c>arcgis-truth-latest-per-objectid</c> — every
///   promoted row is the maximum-LandingLoadBatchId entry for
///   its <c>(CountyId, ArcGisObjectId)</c> tuple. The unique
///   index on <c>truth_arcgis.parcel_geom_current</c> backs
///   this; the gate cross-checks from the DB after writes.</item>
///   <item><c>arcgis-truth-geometry-validity</c> — FAIL on any
///   raw row whose <c>GeomWkt</c> fails the WKT-shape check
///   (POLYGON/MULTIPOLYGON header + at least one ring + at
///   least 3 coordinate pairs per ring). Invalid rows are NOT
///   promoted; raw rows stay in place for audit.</item>
///   <item><c>arcgis-truth-aggregate</c> — informational; counts
///   + sum of <c>AreaSqFt</c> across promoted rows.</item>
/// </list>
/// </summary>
public sealed class ArcGisTruthPromotionService : IArcGisTruthPromotionService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<ArcGisTruthPromotionService> _logger;

    public ArcGisTruthPromotionService(
        TerraFusionDbContext db,
        ILogger<ArcGisTruthPromotionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ArcGisTruthPromotionResult> PromoteCountyAsync(
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-truth-promoter",
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
            // ── Pull all raw rows for the county. ──
            var rawRows = await _db.LegacyArcGisRawParcelGeoms
                .Where(r => r.CountyId == countyId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (rawRows.Count == 0)
            {
                // No raw data for this county → empty truth promote
                // is still a successful run with a clean batch.
                await ClearPriorTruthAsync(countyId, batch.LoadBatchId,
                    cancellationToken).ConfigureAwait(false);
                await WriteGatesAsync(batch, sourceBatchesStatus: "PASS",
                    sourceBatchesDetail: "no raw rows for county",
                    tuplesConsidered: 0, rowsPromoted: 0,
                    invalidGeometrySkipped: 0, areaSum: 0d,
                    cancellationToken).ConfigureAwait(false);

                batch.Status = "COMPLETED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.RowsExtracted = 0;
                batch.RowsPromoted = 0;
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new ArcGisTruthPromotionResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "COMPLETED",
                    TuplesConsidered = 0,
                    RowsPromoted = 0,
                    InvalidGeometrySkipped = 0,
                    PriorTruthRowsRemoved = 0,
                    AreaSqFtSum = 0d,
                };
            }

            // ── Gate 1: every contributing landing batch is COMPLETED. ──
            var contributingBatchIds = rawRows.Select(r => r.LoadBatchId)
                .Distinct().ToList();
            var landingBatches = await _db.SyncBridgeLoadBatches
                .Where(b => contributingBatchIds.Contains(b.LoadBatchId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var notCompletedBatches = landingBatches
                .Where(b => b.Status != "COMPLETED")
                .ToList();

            if (notCompletedBatches.Count > 0)
            {
                var detail =
                    $"refused: {notCompletedBatches.Count} contributing landing batch(es) " +
                    $"not COMPLETED ({string.Join(",",
                        notCompletedBatches.Select(b => $"{b.LoadBatchId}={b.Status}"))})";
                await WriteGatesAsync(batch, sourceBatchesStatus: "FAIL",
                    sourceBatchesDetail: detail,
                    tuplesConsidered: 0, rowsPromoted: 0,
                    invalidGeometrySkipped: 0, areaSum: 0d,
                    cancellationToken).ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = detail;
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new ArcGisTruthPromotionResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TuplesConsidered = 0,
                    RowsPromoted = 0,
                    InvalidGeometrySkipped = 0,
                    PriorTruthRowsRemoved = 0,
                    AreaSqFtSum = 0d,
                    ErrorSummary = detail,
                };
            }

            // ── Idempotency: clear prior truth rows for this county. ──
            var priorTruthRowsRemoved = await ClearPriorTruthAsync(countyId,
                batch.LoadBatchId, cancellationToken).ConfigureAwait(false);

            // ── Build latest-per-(CountyId, ArcGisObjectId) index. ──
            // Tie-breaker: when two raw rows for the same tuple have
            // the same LandingLoadBatchId (impossible by D1's unique
            // index, but defensive) — pick the most recently landed.
            var landedAtByBatch = landingBatches.ToDictionary(
                b => b.LoadBatchId, b => b.CompletedAt ?? b.StartedAt);

            var byTuple = rawRows
                .GroupBy(r => (r.CountyId, r.ArcGisObjectId))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(r => landedAtByBatch[r.LoadBatchId])
                          .ThenByDescending(r => r.LandedAt)
                          .First());

            var tuplesConsidered = byTuple.Count;
            var rowsPromoted = 0;
            var invalidGeometry = 0;
            double areaSum = 0d;
            var now = DateTime.UtcNow;

            foreach (var (_, latest) in byTuple)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!IsValidWkt(latest.GeomWkt))
                {
                    invalidGeometry++;
                    continue;
                }

                _db.TruthArcGisParcelGeomCurrents.Add(new TruthArcGisParcelGeomCurrent
                {
                    CountyId = latest.CountyId,
                    ArcGisObjectId = latest.ArcGisObjectId,
                    ArcGisApn = latest.ArcGisApn,
                    GeomWkt = latest.GeomWkt,
                    CentroidLat = latest.CentroidLat,
                    CentroidLon = latest.CentroidLon,
                    AreaSqFt = latest.AreaSqFt,
                    SourceServiceUrl = latest.SourceServiceUrl,
                    SourceLandedRowId = latest.LandedRowId,
                    LandingLoadBatchId = latest.LoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    PromotedAt = now,
                });
                rowsPromoted++;
                areaSum += latest.AreaSqFt;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteGatesAsync(batch, sourceBatchesStatus: "PASS",
                sourceBatchesDetail: $"{landingBatches.Count} contributing landing batch(es) all COMPLETED",
                tuplesConsidered: tuplesConsidered,
                rowsPromoted: rowsPromoted,
                invalidGeometrySkipped: invalidGeometry,
                areaSum: areaSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = tuplesConsidered;
            batch.RowsPromoted = rowsPromoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "ArcGIS parcel_geom truth promotion COMPLETED. batch={BatchId} county={CountyId} tuples={Tuples} promoted={Promoted} invalid={Invalid} priorRemoved={PriorRemoved} areaSum={AreaSum}",
                batch.LoadBatchId, countyId, tuplesConsidered, rowsPromoted,
                invalidGeometry, priorTruthRowsRemoved, areaSum);

            return new ArcGisTruthPromotionResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TuplesConsidered = tuplesConsidered,
                RowsPromoted = rowsPromoted,
                InvalidGeometrySkipped = invalidGeometry,
                PriorTruthRowsRemoved = priorTruthRowsRemoved,
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
                "ArcGIS truth promotion FAILED. batch={BatchId} county={CountyId} summary={Summary}",
                batch.LoadBatchId, countyId, summary);

            return new ArcGisTruthPromotionResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TuplesConsidered = 0,
                RowsPromoted = 0,
                InvalidGeometrySkipped = 0,
                PriorTruthRowsRemoved = 0,
                AreaSqFtSum = 0d,
                ErrorSummary = summary,
            };
        }
    }

    private async Task<int> ClearPriorTruthAsync(
        Guid countyId,
        Guid currentBatchId,
        CancellationToken cancellationToken)
    {
        var prior = await _db.TruthArcGisParcelGeomCurrents
            .Where(t => t.CountyId == countyId
                        && t.PromotionLoadBatchId != currentBatchId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        if (prior.Count > 0)
        {
            _db.TruthArcGisParcelGeomCurrents.RemoveRange(prior);
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        return prior.Count;
    }

    /// <summary>
    /// Lightweight WKT shape validator. Accepts strings whose
    /// outer header is <c>POLYGON</c> or <c>MULTIPOLYGON</c> and
    /// that contain at least three coordinate pairs (the minimum
    /// for a closed ring). Designed to catch the obvious failure
    /// modes (empty string, truncated WKT, "null", garbled input)
    /// without pulling in NetTopologySuite for full topology.
    /// </summary>
    internal static bool IsValidWkt(string? wkt)
    {
        if (string.IsNullOrWhiteSpace(wkt)) return false;

        var trimmed = wkt.TrimStart();
        if (!trimmed.StartsWith("POLYGON", StringComparison.OrdinalIgnoreCase)
            && !trimmed.StartsWith("MULTIPOLYGON", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Count coordinate pairs (a "x y" sequence). A closed ring
        // requires at least 3 distinct vertices + a closing repeat
        // — minimum 4 pairs for POLYGON, 4 per ring for MULTIPOLYGON.
        // Conservative count: ≥ 3 pairs anywhere.
        var commaCount = trimmed.Count(c => c == ',');
        if (commaCount < 3) return false;

        // Must contain at least one '(' and one ')'.
        if (!trimmed.Contains('(') || !trimmed.Contains(')')) return false;

        return true;
    }

    private async Task WriteGatesAsync(
        LoadBatch batch,
        string sourceBatchesStatus,
        string sourceBatchesDetail,
        int tuplesConsidered,
        int rowsPromoted,
        int invalidGeometrySkipped,
        double areaSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1) arcgis-truth-source-batches-completed.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-truth-source-batches-completed",
            GateStage = "RAW_TO_TRUTH",
            Status = sourceBatchesStatus,
            Expected = "all contributing batches COMPLETED",
            Actual = sourceBatchesStatus,
            Detail = sourceBatchesDetail,
            ExecutedAt = now,
        });

        // If the source-batch gate FAILED, the rest are skipped:
        // no truth rows were written.
        if (sourceBatchesStatus == "FAIL")
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return;
        }

        // 2) arcgis-truth-latest-per-objectid — cross-check from DB.
        var truthRows = await _db.TruthArcGisParcelGeomCurrents
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(t => new { t.CountyId, t.ArcGisObjectId })
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        var distinctTuples = truthRows
            .GroupBy(r => (r.CountyId, r.ArcGisObjectId))
            .Count();
        var collapseViolations = truthRows.Count - distinctTuples;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-truth-latest-per-objectid",
            GateStage = "RAW_TO_TRUTH",
            Status = collapseViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = collapseViolations.ToString(CultureInfo.InvariantCulture),
            Detail = collapseViolations == 0
                ? $"every (CountyId, ArcGisObjectId) appears exactly once in this promotion batch ({rowsPromoted} rows)"
                : $"{collapseViolations} (CountyId, ArcGisObjectId) tuples were promoted more than once",
            ExecutedAt = now,
        });

        // 3) arcgis-truth-geometry-validity.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-truth-geometry-validity",
            GateStage = "RAW_TO_TRUTH",
            Status = invalidGeometrySkipped == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = invalidGeometrySkipped.ToString(CultureInfo.InvariantCulture),
            Detail = invalidGeometrySkipped == 0
                ? $"every promoted row has a valid POLYGON/MULTIPOLYGON WKT ({rowsPromoted} checked)"
                : $"{invalidGeometrySkipped} raw rows had invalid WKT and were not promoted; raw rows preserved for audit",
            ExecutedAt = now,
        });

        // 4) arcgis-truth-aggregate.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "arcgis-truth-aggregate",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = rowsPromoted.ToString(CultureInfo.InvariantCulture),
            Detail = $"tuplesConsidered={tuplesConsidered} promoted={rowsPromoted} " +
                     $"invalidSkipped={invalidGeometrySkipped} " +
                     $"areaSqFtSum={areaSum.ToString("F2", CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
