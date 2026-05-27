using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsParcelTruth;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice S2-B (SYNC-POP-4b): raw → truth promoter for PACS parcels.
///
/// <list type="bullet">
///   <item><c>truth-pacs-parcel-source-batch-completed</c> — the
///   source S1 property batch must be COMPLETED. FAIL refuses
///   promotion.</item>
///   <item><c>truth-pacs-parcel-real-property-filter</c> —
///   informational; counts real-property vs not-real (P, MH, etc.).</item>
///   <item><c>truth-pacs-parcel-prop-id-uniqueness</c> — FAIL when
///   any <c>prop_id</c> appears more than once in the promoted spine
///   (defense-in-depth over the S1 uniqueness gate).</item>
///   <item><c>truth-pacs-parcel-promotion-coverage</c> — every
///   promoted row carries SourcePropertyLandedRowId and
///   PropertyLoadBatchId. FAIL otherwise.</item>
/// </list>
/// </summary>
public sealed class PacsParcelSpineTruthPromoter : IPacsParcelSpineTruthPromoter
{
    private const string RealPropertyCode = "R";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsParcelSpineTruthPromoter> _logger;

    public PacsParcelSpineTruthPromoter(
        TerraFusionDbContext db,
        ILogger<PacsParcelSpineTruthPromoter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsParcelSpineTruthPromotionResult> PromoteAsync(
        Guid propertyLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        // ── Open the promotion batch FIRST so a refusal still records. ──
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-parcel-promoter",
            SourceFileOrDatabase = $"property_batch={propertyLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            // ── Gate: source batch MUST be COMPLETED. ──
            var srcBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == propertyLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            var srcOk = srcBatch is not null && srcBatch.Status == "COMPLETED";
            if (!srcOk)
            {
                var detail = $"propertyBatch={(srcBatch?.Status ?? "MISSING")}";
                await RecordSourceBatchGateAsync(batch, "FAIL", detail, cancellationToken)
                    .ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new PacsParcelSpineTruthPromotionResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    ParcelsConsidered = 0,
                    ParcelsPromoted = 0,
                    RejectedNotRealProperty = 0,
                    RejectedDuplicatePropId = 0,
                    PriorRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "source property batch COMPLETED", cancellationToken)
                .ConfigureAwait(false);

            // ── Idempotency (FIX 2026-05-27): dedup by NATURAL KEY (prop_id),
            //    NOT PropertyLoadBatchId. Clearing only same-landing-batch rows
            //    let re-drains of the same parcels under new landing batches stack
            //    duplicate spine rows (observed 8.2x: 681,457 rows / 83,326 distinct
            //    prop_id across 321 batches). The real delete — keyed by the
            //    prop_ids this batch promotes — runs after we load the parcels. ──
            var priorRowsRemoved = 0;

            // ── Iterate and project. ──
            var parcels = await _db.LegacyPacsRawProperties
                .Where(p => p.LoadBatchId == propertyLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var batchPropIds = parcels.Select(p => p.PropId).Distinct().ToList();
            if (batchPropIds.Count > 0)
            {
                priorRowsRemoved = await _db.TruthPacsParcelSpines
                    .Where(t => batchPropIds.Contains(t.PropId))
                    .ExecuteDeleteAsync(cancellationToken).ConfigureAwait(false);
            }

            var considered = parcels.Count;
            var promoted = 0;
            var rejectedNotRealProperty = 0;
            var rejectedDuplicatePropId = 0;
            var seenPropIds = new System.Collections.Generic.HashSet<int>();

            var now = DateTime.UtcNow;
            foreach (var parcel in parcels)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // Type filter — the only qualification axis at this
                // layer. Doctrine: spine is for real-property parcels;
                // P/MH/A/MN parcels remain in legacy_pacs_raw for audit
                // but never reach truth.
                if (!string.Equals(parcel.PropTypeCd, RealPropertyCode, StringComparison.Ordinal))
                {
                    rejectedNotRealProperty++;
                    continue;
                }

                // Duplicate prop_id within the same promotion: skip
                // and count. Defense-in-depth — if the S1 uniqueness
                // gate passed, this counter is always zero. If the
                // S1 gate FAILED but promotion was still requested,
                // we surface it here without crashing.
                if (!seenPropIds.Add(parcel.PropId))
                {
                    rejectedDuplicatePropId++;
                    continue;
                }

                _db.TruthPacsParcelSpines.Add(new TruthPacsParcelSpine
                {
                    PropId = parcel.PropId,
                    PropTypeCd = RealPropertyCode,
                    GeoId = parcel.GeoId,
                    RefId1 = parcel.RefId1,
                    RefId2 = parcel.RefId2,
                    DbaName = parcel.DbaName,
                    AltDbaName = parcel.AltDbaName,
                    PropCreateDt = parcel.PropCreateDt,
                    SourcePropertyLandedRowId = parcel.LandedRowId,
                    PropertyLoadBatchId = propertyLoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    PromotedAt = now,
                });
                promoted++;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, promoted,
                rejectedNotRealProperty, rejectedDuplicatePropId,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.parcel_spine promotion COMPLETED. batch={BatchId} considered={Considered} promoted={Promoted} notReal={NotR} dupPropId={Dup} prior={Prior}",
                batch.LoadBatchId, considered, promoted,
                rejectedNotRealProperty, rejectedDuplicatePropId, priorRowsRemoved);

            return new PacsParcelSpineTruthPromotionResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                ParcelsConsidered = considered,
                ParcelsPromoted = promoted,
                RejectedNotRealProperty = rejectedNotRealProperty,
                RejectedDuplicatePropId = rejectedDuplicatePropId,
                PriorRowsRemoved = priorRowsRemoved,
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
                "truth_pacs.parcel_spine promotion FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsParcelSpineTruthPromotionResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                ParcelsConsidered = 0,
                ParcelsPromoted = 0,
                RejectedNotRealProperty = 0,
                RejectedDuplicatePropId = 0,
                PriorRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task RecordSourceBatchGateAsync(
        LoadBatch batch, string status, string detail,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-parcel-source-batch-completed",
            GateStage = "RAW_TO_TRUTH",
            Status = status,
            Expected = "COMPLETED",
            Actual = status,
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task WriteRemainingGatesAsync(
        LoadBatch batch,
        int considered,
        int promoted,
        int rejectedNotRealProperty,
        int rejectedDuplicatePropId,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) real-property-filter — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-parcel-real-property-filter",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = promoted.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} realProperty={promoted} notRealProperty={rejectedNotRealProperty}",
            ExecutedAt = now,
        });

        // 3) prop-id-uniqueness within the spine.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-parcel-prop-id-uniqueness",
            GateStage = "RAW_TO_TRUTH",
            Status = rejectedDuplicatePropId == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = rejectedDuplicatePropId.ToString(CultureInfo.InvariantCulture),
            Detail = rejectedDuplicatePropId == 0
                ? "every promoted prop_id is unique within the spine"
                : $"{rejectedDuplicatePropId} duplicate prop_id rows skipped at promotion (S1 uniqueness gate should have caught these)",
            ExecutedAt = now,
        });

        // 4) promotion-coverage — every spine row carries lineage.
        var unprovenanced = await _db.TruthPacsParcelSpines
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId
                        && (t.SourcePropertyLandedRowId == Guid.Empty
                            || t.PropertyLoadBatchId == Guid.Empty))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-parcel-promotion-coverage",
            GateStage = "RAW_TO_TRUTH",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {promoted} promoted rows carry full lineage"
                : $"{unprovenanced} rows lack lineage",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
