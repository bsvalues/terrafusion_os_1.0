using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.GIS.ArcGisRest;

namespace TerraFusion.Data.Services.GisTf;

/// <summary>
/// Slice G1-D-1: persistence orchestrator for the ArcGIS REST adapter.
///
/// <para>One <c>SyncCountyAsync</c> call =
///   open <c>load_batch</c> (status IN_PROGRESS, family ARCGIS_REST)
///   → fetch features via <see cref="IArcGisFeatureServiceClient"/>
///   → upsert <c>gis_tf.tf_parcel_geom</c> by (CountyId, ArcGisObjectId)
///   → soft-delete features absent from this run
///   → ensure every active row has a <c>sync_bridge.source_xref</c> entry
///   → write a <c>promotion_gate_result</c>
///   → close <c>load_batch</c> (COMPLETED or FAILED).
/// </para>
///
/// <para>Doctrine invariant: every active <c>tf_parcel_geom</c> row
/// has a <c>source_xref</c>. The service verifies this at end of run
/// via the <c>gis-tf:source-xref-coverage</c> gate; any miss is a
/// gate FAIL but does not (yet) hard-fail the batch — v1 only logs
/// + records. G1-D-2 wires this into a hard rollback.</para>
/// </summary>
public sealed class ArcGisSyncService : IArcGisSyncService
{
    private const string EntityType = "parcel_geom";
    private const string GateName = "gis-tf:arcgis-sync-completion";
    private const string CoverageGateName = "gis-tf:source-xref-coverage";

    private readonly TerraFusionDbContext _db;
    private readonly IArcGisFeatureServiceClient _client;
    private readonly ILogger<ArcGisSyncService> _logger;

    public ArcGisSyncService(
        TerraFusionDbContext db,
        IArcGisFeatureServiceClient client,
        ILogger<ArcGisSyncService> logger)
    {
        _db = db;
        _client = client;
        _logger = logger;
    }

    public async Task<ArcGisSyncResult> SyncCountyAsync(
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "county-arcgis-rest",
            SourceFileOrDatabase = $"county:{countyId}",
            SourceQueryHash = string.Empty, // populated below once URL known
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var features = await _client
                .FetchParcelsAsync(countyId, topN: null, cancellationToken)
                .ConfigureAwait(false);

            // Lock in the source query hash from the first feature's
            // service URL (all features share it within one batch).
            if (features.Count > 0)
            {
                batch.SourceQueryHash = ComputeStableHash(features[0].SourceServiceUrl);
            }

            var (upserted, softDeleted) = await UpsertGeometryRowsAsync(
                batch, countyId, features, cancellationToken).ConfigureAwait(false);

            await EnsureSourceXrefCoverageAsync(
                batch, countyId, cancellationToken).ConfigureAwait(false);

            await WritePromotionGateResultAsync(
                batch, countyId, features.Count, upserted, softDeleted,
                "PASS",
                detail: $"fetched={features.Count}, upserted={upserted}, soft_deleted={softDeleted}",
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = features.Count;
            batch.RowsPromoted = upserted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "ArcGIS sync COMPLETED for county {CountyId}. fetched={Fetched} upserted={Upserted} softDeleted={SoftDeleted} batch={BatchId}",
                countyId, features.Count, upserted, softDeleted, batch.LoadBatchId);

            return new ArcGisSyncResult
            {
                LoadBatchId = batch.LoadBatchId,
                CountyId = countyId,
                Status = "COMPLETED",
                FeaturesFetched = features.Count,
                FeaturesUpserted = upserted,
                FeaturesSoftDeleted = softDeleted,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = SanitizeError(ex);
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;

            await WritePromotionGateResultAsync(
                batch, countyId, fetched: 0, upserted: 0, softDeleted: 0,
                status: "FAIL", detail: summary, cancellationToken)
                .ConfigureAwait(false);

            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);

            _logger.LogError(ex,
                "ArcGIS sync FAILED for county {CountyId}. batch={BatchId} summary={Summary}",
                countyId, batch.LoadBatchId, summary);

            return new ArcGisSyncResult
            {
                LoadBatchId = batch.LoadBatchId,
                CountyId = countyId,
                Status = "FAILED",
                FeaturesFetched = 0,
                FeaturesUpserted = 0,
                FeaturesSoftDeleted = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task<(int Upserted, int SoftDeleted)> UpsertGeometryRowsAsync(
        LoadBatch batch,
        Guid countyId,
        IReadOnlyList<ArcGisParcelFeature> features,
        CancellationToken cancellationToken)
    {
        var existing = await _db.TfParcelGeoms
            .Where(g => g.CountyId == countyId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var existingByObjectId = existing
            .GroupBy(g => g.ArcGisObjectId)
            .ToDictionary(g => g.Key, g => g.First());

        var seenObjectIds = new HashSet<long>(features.Count);
        var upserted = 0;
        var now = DateTime.UtcNow;

        foreach (var feature in features)
        {
            seenObjectIds.Add(feature.ArcGisObjectId);

            if (existingByObjectId.TryGetValue(feature.ArcGisObjectId, out var row))
            {
                row.ArcGisApn = feature.ArcGisApn;
                row.GeomWkt = feature.GeomWkt;
                row.CentroidLat = feature.CentroidLat;
                row.CentroidLon = feature.CentroidLon;
                row.AreaSqFt = feature.AreaSqFt;
                row.SourceServiceUrl = feature.SourceServiceUrl;
                row.LastSyncedAt = now;
                row.IsActive = true;
                row.UpdatedAt = now;
            }
            else
            {
                row = new TfParcelGeom
                {
                    CountyId = countyId,
                    ArcGisObjectId = feature.ArcGisObjectId,
                    ArcGisApn = feature.ArcGisApn,
                    GeomWkt = feature.GeomWkt,
                    CentroidLat = feature.CentroidLat,
                    CentroidLon = feature.CentroidLon,
                    AreaSqFt = feature.AreaSqFt,
                    SourceServiceUrl = feature.SourceServiceUrl,
                    LastSyncedAt = now,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfParcelGeoms.Add(row);
            }

            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // Source-xref idempotent write: one row per (CountyId, ArcGisObjectId)
            // → one (TfEntityType, TfEntityId) lineage entry.
            await EnsureSourceXrefAsync(batch, row, cancellationToken)
                .ConfigureAwait(false);

            upserted++;
        }

        // Soft-delete: any prior row whose ArcGisObjectId did not show
        // up in this run.
        var softDeleted = 0;
        foreach (var row in existing)
        {
            if (!seenObjectIds.Contains(row.ArcGisObjectId) && row.IsActive)
            {
                row.IsActive = false;
                row.UpdatedAt = now;
                softDeleted++;
            }
        }
        if (softDeleted > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        return (upserted, softDeleted);
    }

    private async Task EnsureSourceXrefAsync(
        LoadBatch batch,
        TfParcelGeom row,
        CancellationToken cancellationToken)
    {
        var existing = await _db.SyncBridgeSourceXrefs
            .FirstOrDefaultAsync(
                x => x.TfEntityType == EntityType && x.TfEntityId == row.TfParcelGeomId,
                cancellationToken).ConfigureAwait(false);

        var sourceKey = JsonSerializer.Serialize(new
        {
            arcgis_object_id = row.ArcGisObjectId,
            county_id = row.CountyId,
            source_service_url = row.SourceServiceUrl,
        });

        var now = DateTime.UtcNow;
        if (existing is null)
        {
            _db.SyncBridgeSourceXrefs.Add(new SourceXref
            {
                TfEntityType = EntityType,
                TfEntityId = row.TfParcelGeomId,
                SourceSystem = "ARCGIS_REST",
                SourceTable = "feature_service",
                SourceKeyJson = sourceKey,
                SourceQueryHash = batch.SourceQueryHash,
                LoadBatchId = batch.LoadBatchId,
                FirstSeenAt = now,
                LastSeenAt = now,
                IsActive = true,
            });
        }
        else
        {
            existing.SourceKeyJson = sourceKey;
            existing.SourceQueryHash = batch.SourceQueryHash;
            existing.LoadBatchId = batch.LoadBatchId;
            existing.LastSeenAt = now;
            existing.IsActive = true;
        }
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task EnsureSourceXrefCoverageAsync(
        LoadBatch batch,
        Guid countyId,
        CancellationToken cancellationToken)
    {
        // Doctrine gate: every ACTIVE tf_parcel_geom for this county
        // MUST have a corresponding source_xref row. v1 records the
        // coverage as a gate result; G1-D-2 will hard-fail the batch.
        var activeIds = await _db.TfParcelGeoms
            .Where(g => g.CountyId == countyId && g.IsActive)
            .Select(g => g.TfParcelGeomId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == EntityType
                        && activeIds.Contains(x.TfEntityId))
            .Select(x => x.TfEntityId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var covered = xrefIds.Count;
        var total = activeIds.Count;
        var missing = total - covered;

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = CoverageGateName,
            GateStage = "ARCH",
            Status = missing == 0 ? "PASS" : "FAIL",
            Expected = total.ToString(CultureInfo.InvariantCulture),
            Actual = covered.ToString(CultureInfo.InvariantCulture),
            Detail = missing == 0
                ? "every active tf_parcel_geom has a source_xref"
                : $"{missing} active tf_parcel_geom rows without source_xref",
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task WritePromotionGateResultAsync(
        LoadBatch batch,
        Guid countyId,
        int fetched,
        int upserted,
        int softDeleted,
        string status,
        string detail,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = GateName,
            GateStage = "ARCH",
            Status = status,
            Expected = fetched.ToString(CultureInfo.InvariantCulture),
            Actual = upserted.ToString(CultureInfo.InvariantCulture),
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string ComputeStableHash(string serviceUrl)
    {
        // Stable hash of the source URL — embedded into source_xref so
        // a URL change shows up as a lineage diff in future audits.
        // Keep it cheap: SHA-256 hex truncated to 16 chars is plenty.
        using var sha = System.Security.Cryptography.SHA256.Create();
        var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(serviceUrl));
        var hex = Convert.ToHexString(bytes);
        return hex[..16].ToLowerInvariant();
    }

    private static string SanitizeError(Exception ex)
    {
        // No secrets, no stack traces in error_summary — that lives
        // in structured logs. Top-level type + message only.
        var msg = ex.Message ?? "unknown";
        return $"{ex.GetType().Name}: {msg}";
    }
}
