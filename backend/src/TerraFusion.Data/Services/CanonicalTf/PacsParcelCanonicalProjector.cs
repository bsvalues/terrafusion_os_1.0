using System;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsParcelCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice S3 (SYNC-POP-4c): truth → canonical projector for PACS
/// parcels.
///
/// <list type="bullet">
///   <item><c>canonical-parcel-source-batch-completed</c> — truth-pacs
///   spine batch must be COMPLETED. FAIL refuses projection.</item>
///   <item><c>canonical-parcel-county-id-supplied</c> — caller MUST
///   provide a non-empty county id. FAIL refuses projection.</item>
///   <item><c>canonical-parcel-projection-coverage</c> — informational
///   PASS; counts truth rows projected.</item>
///   <item><c>canonical-parcel-source-xref-coverage</c> — every
///   projected <c>tf_parcel</c> has a matching <c>source_xref</c>
///   entry. FAIL on any miss.</item>
///   <item><c>canonical-parcel-county-isolation</c> — every
///   projected <c>tf_parcel</c> has a non-empty <c>CountyId</c>.
///   FAIL on any miss.</item>
/// </list>
///
/// <para>Doctrine traceback:
/// <c>tf_parcel → source_xref(TfEntityType="parcel") →
/// SourceKeyJson{prop_id}</c>. The PACS lineage is in the JSON, not
/// in the entity columns. Per the parcel-master semantics, the JSON
/// carries only <c>prop_id</c>; <c>prop_val_yr</c>/<c>sup_num</c> are
/// per-year/per-supplement axes that live on <c>property_val</c>, not
/// on the master identity table — so they are intentionally absent
/// from the parcel xref.</para>
/// </summary>
public sealed class PacsParcelCanonicalProjector : IPacsParcelCanonicalProjector
{
    private const string ParcelEntityType = "parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsParcelCanonicalProjector> _logger;

    public PacsParcelCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsParcelCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsParcelCanonicalResult> ProjectAsync(
        Guid spineTruthPromotionLoadBatchId,
        Guid countyId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        // Open the projection batch first so refusals still record.
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-parcel-projector",
            SourceFileOrDatabase = $"spine_promotion_batch={spineTruthPromotionLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            // ── Gate: county id must be supplied. ──
            if (countyId == Guid.Empty)
            {
                await RecordRefusalGateAsync(batch,
                    "canonical-parcel-county-id-supplied",
                    "FAIL", "countyId=Guid.Empty",
                    cancellationToken).ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = "refused: county id is required";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new PacsParcelCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthParcelsConsidered = 0,
                    ParcelsProjected = 0,
                    PriorCanonicalRowsRemoved = 0,
                    PriorXrefRowsRemoved = 0,
                    ErrorSummary = "county id is required",
                };
            }
            await RecordRefusalGateAsync(batch,
                "canonical-parcel-county-id-supplied",
                "PASS", $"countyId={countyId}",
                cancellationToken).ConfigureAwait(false);

            // ── Gate: truth spine batch must be COMPLETED. ──
            var truthBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == spineTruthPromotionLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            if (truthBatch is null || truthBatch.Status != "COMPLETED")
            {
                var status = truthBatch?.Status ?? "MISSING";
                var detail = $"spine truth batch={status}";
                await RecordRefusalGateAsync(batch,
                    "canonical-parcel-source-batch-completed",
                    "FAIL", detail, cancellationToken).ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new PacsParcelCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthParcelsConsidered = 0,
                    ParcelsProjected = 0,
                    PriorCanonicalRowsRemoved = 0,
                    PriorXrefRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordRefusalGateAsync(batch,
                "canonical-parcel-source-batch-completed",
                "PASS", "spine truth batch COMPLETED",
                cancellationToken).ConfigureAwait(false);

            // ── Load the truth spine for this batch. ──
            var truthRows = await _db.TruthPacsParcelSpines
                .Where(t => t.PromotionLoadBatchId == spineTruthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // ── Idempotency: clear prior tf_parcel + source_xref for
            //    these prop_ids. We compare against the JSON shape of
            //    the existing xref to find prior projections. ──
            var spinePropIds = truthRows.Select(t => t.PropId).ToHashSet();

            var priorParcelXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == ParcelEntityType && x.IsActive)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorParcelEntityIds = new System.Collections.Generic.HashSet<Guid>();
            var priorXrefRows = new System.Collections.Generic.List<SourceXref>();
            foreach (var x in priorParcelXrefs)
            {
                int? propId = TryReadPropIdFromJson(x.SourceKeyJson);
                if (propId is int pid && spinePropIds.Contains(pid))
                {
                    priorParcelEntityIds.Add(x.TfEntityId);
                    priorXrefRows.Add(x);
                }
            }

            var priorParcels = priorParcelEntityIds.Count == 0
                ? new System.Collections.Generic.List<TfParcel>()
                : await _db.TfParcels
                    .Where(p => priorParcelEntityIds.Contains(p.TfParcelId))
                    .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (priorParcels.Count > 0)
            {
                _db.TfParcels.RemoveRange(priorParcels);
            }
            if (priorXrefRows.Count > 0)
            {
                _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefRows);
            }
            if (priorParcels.Count + priorXrefRows.Count > 0)
            {
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            // ── Iterate truth spine and project. ──
            var considered = truthRows.Count;
            var projected = 0;
            var now = DateTime.UtcNow;

            foreach (var truth in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var tfParcel = new TfParcel
                {
                    CountyId = countyId,
                    ParcelNumber = truth.GeoId,
                    SitusAddress = null,         // not on dbo.property; resolves later
                    LegalDescription = null,     // not on dbo.property; resolves later
                    ParcelStatus = "ACTIVE",     // lifecycle resolution deferred
                    PropertyType = truth.PropTypeCd,  // 'R' by spine construction
                    CurrentOwnerId = null,       // Phase-2 owner attachment
                    CurrentAssessmentId = null,  // Phase-2 assessment attachment
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfParcels.Add(tfParcel);

                // Doctrine note: parcel master is single-keyed (prop_id only).
                // The (prop_val_yr, sup_num) axis lives on property_val, not
                // on dbo.property — so the parcel xref's SourceKeyJson does
                // NOT include those fields.
                var sourceKeyJson = JsonSerializer.Serialize(new
                {
                    prop_id = truth.PropId,
                });

                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = ParcelEntityType,
                    TfEntityId = tfParcel.TfParcelId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "property",
                    SourceKeyJson = sourceKeyJson,
                    SourceQueryHash = string.Empty,
                    LoadBatchId = batch.LoadBatchId,
                    FirstSeenAt = now,
                    LastSeenAt = now,
                    IsActive = true,
                });
                projected++;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, projected, cancellationToken)
                .ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_parcel projection COMPLETED. batch={BatchId} considered={Considered} projected={Projected} priorParcels={PrP} priorXrefs={PrX}",
                batch.LoadBatchId, considered, projected, priorParcels.Count, priorXrefRows.Count);

            return new PacsParcelCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthParcelsConsidered = considered,
                ParcelsProjected = projected,
                PriorCanonicalRowsRemoved = priorParcels.Count,
                PriorXrefRowsRemoved = priorXrefRows.Count,
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
                "canonical_tf.tf_parcel projection FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsParcelCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthParcelsConsidered = 0,
                ParcelsProjected = 0,
                PriorCanonicalRowsRemoved = 0,
                PriorXrefRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private static int? TryReadPropIdFromJson(string sourceKeyJson)
    {
        if (string.IsNullOrWhiteSpace(sourceKeyJson)) return null;
        try
        {
            using var doc = JsonDocument.Parse(sourceKeyJson);
            if (doc.RootElement.TryGetProperty("prop_id", out var el)
                && el.TryGetInt32(out var pid))
            {
                return pid;
            }
        }
        catch (JsonException) { /* malformed — ignore */ }
        return null;
    }

    private async Task RecordRefusalGateAsync(
        LoadBatch batch, string gateName, string status, string detail,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = gateName,
            GateStage = "TRUTH_TO_CANONICAL",
            Status = status,
            Expected = "PASS",
            Actual = status,
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task WriteRemainingGatesAsync(
        LoadBatch batch,
        int considered,
        int projected,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 3) projection-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-parcel-projection-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = projected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} projected={projected}",
            ExecutedAt = now,
        });

        // 4) source-xref-coverage — every projected tf_parcel has a
        //    source_xref. Asserted from DB.
        var projectedIds = await _db.TfParcels
            .Where(p => _db.SyncBridgeSourceXrefs
                .Any(x => x.LoadBatchId == batch.LoadBatchId
                          && x.TfEntityType == ParcelEntityType
                          && x.TfEntityId == p.TfParcelId))
            .Select(p => p.TfParcelId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var coverageMissing = projected - projectedIds.Count;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-parcel-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = projected.ToString(CultureInfo.InvariantCulture),
            Actual = projectedIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {projected} tf_parcel rows have a source_xref"
                : $"{coverageMissing} tf_parcel rows lack source_xref",
            ExecutedAt = now,
        });

        // 5) county-isolation — every tf_parcel has a non-empty CountyId.
        // (We pass countyId in, but defense-in-depth in case future
        // refactors lose it.)
        var emptyCountyCount = await _db.SyncBridgeSourceXrefs
            .Where(x => x.LoadBatchId == batch.LoadBatchId
                        && x.TfEntityType == ParcelEntityType)
            .Join(_db.TfParcels,
                  x => x.TfEntityId,
                  p => p.TfParcelId,
                  (x, p) => p)
            .Where(p => p.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-parcel-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_parcel has a non-empty CountyId"
                : $"{emptyCountyCount} tf_parcel rows have empty CountyId",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
