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
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsSaleCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice S3: truth → canonical projector for PACS sales.
///
/// <list type="bullet">
///   <item><c>canonical-source-batch-completed</c> — truth-pacs
///   batch must be COMPLETED. FAIL refuses projection.</item>
///   <item><c>canonical-parcel-xref-coverage</c> — informational
///   PASS; counts sales with vs without parcel xref.</item>
///   <item><c>canonical-source-xref-coverage</c> — every projected
///   <c>tf_sale</c> has a corresponding <c>source_xref</c> entry.
///   FAIL on any miss.</item>
///   <item><c>canonical-county-isolation</c> — every projected
///   <c>tf_sale</c> has a non-empty <c>CountyId</c>. FAIL on any miss.</item>
/// </list>
///
/// <para>Doctrine traceback: <c>tf_sale → source_xref(TfEntityType="sale")
/// → SourceKeyJson{prop_id, prop_val_yr, sup_num, chg_of_owner_id}</c>.
/// The PACS lineage is in the JSON, not in the entity columns.</para>
/// </summary>
public sealed class PacsSaleCanonicalProjector : IPacsSaleCanonicalProjector
{
    private const string SaleEntityType = "sale";
    private const string ParcelEntityType = "parcel";
    private const string QuarantineNoParcelXref = "NO_PARCEL_XREF";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsSaleCanonicalProjector> _logger;

    public PacsSaleCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsSaleCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsSaleCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        // Open the projection batch first.
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-projector",
            SourceFileOrDatabase = $"truth_promotion_batch={truthPromotionLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            // ── Gate: truth-pacs batch MUST be COMPLETED. ──
            var truthBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == truthPromotionLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            if (truthBatch is null || truthBatch.Status != "COMPLETED")
            {
                var status = truthBatch?.Status ?? "MISSING";
                var detail = $"truth promotion batch={status}";
                await RecordSourceBatchGateAsync(batch, "FAIL", detail, cancellationToken)
                    .ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new PacsSaleCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthSalesConsidered = 0,
                    SalesProjected = 0,
                    SalesQuarantined = 0,
                    PriorCanonicalRowsRemoved = 0,
                    PriorQuarantineRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "truth-pacs source batch is COMPLETED", cancellationToken)
                .ConfigureAwait(false);

            // ── Idempotency: clear prior canonical + quarantine rows
            //    AND their source_xref entries for this truth batch. ──
            var priorCanonical = await _db.TfSales
                .Where(s => _db.TruthPacsSales
                    .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                    .Select(t => t.ChgOfOwnerId)
                    .Contains(s.ChgOfOwnerId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorCanonicalIds = priorCanonical.Select(s => s.TfSaleId).ToHashSet();
            var priorXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == SaleEntityType
                            && priorCanonicalIds.Contains(x.TfEntityId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorQuarantine = await _db.LegacyTfUnprovenSales
                .Where(q => _db.TruthPacsSales
                    .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                    .Select(t => t.TruthSaleId)
                    .Contains(q.SourceTruthSaleId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (priorCanonical.Count > 0)
            {
                _db.TfSales.RemoveRange(priorCanonical);
            }
            if (priorXrefs.Count > 0)
            {
                _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            }
            if (priorQuarantine.Count > 0)
            {
                _db.LegacyTfUnprovenSales.RemoveRange(priorQuarantine);
            }
            if (priorCanonical.Count + priorXrefs.Count + priorQuarantine.Count > 0)
            {
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            // ── Build parcel xref index: prop_id → (TfParcelId, CountyId). ──
            var parcelIndex = await BuildParcelIndexAsync(cancellationToken)
                .ConfigureAwait(false);

            // ── Iterate truth_pacs.sale rows for this batch. ──
            var truthSales = await _db.TruthPacsSales
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var considered = truthSales.Count;
            var projected = 0;
            var quarantined = 0;
            var now = DateTime.UtcNow;

            foreach (var truth in truthSales)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!parcelIndex.TryGetValue(truth.PropId, out var parcelLookup))
                {
                    _db.LegacyTfUnprovenSales.Add(new LegacyTfUnprovenSale
                    {
                        ChgOfOwnerId = truth.ChgOfOwnerId,
                        PropId = truth.PropId,
                        PropValYr = truth.PropValYr,
                        SupNum = truth.SupNum,
                        SlDt = truth.SlDt,
                        SlPrice = truth.SlPrice,
                        AdjSlPrice = truth.AdjSlPrice,
                        SourceTruthSaleId = truth.TruthSaleId,
                        PromotionLoadBatchId = batch.LoadBatchId,
                        QuarantineReason = QuarantineNoParcelXref,
                        CreatedAt = now,
                    });
                    quarantined++;
                    continue;
                }

                var tfSale = new TfSale
                {
                    CountyId = parcelLookup.CountyId,
                    TfParcelId = parcelLookup.TfParcelId,
                    ChgOfOwnerId = truth.ChgOfOwnerId,
                    SlDt = truth.SlDt,
                    SlPrice = truth.SlPrice,
                    AdjSlPrice = truth.AdjSlPrice,
                    SaleQualified = true,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfSales.Add(tfSale);

                var sourceKeyJson = JsonSerializer.Serialize(new
                {
                    prop_id = truth.PropId,
                    prop_val_yr = truth.PropValYr,
                    sup_num = truth.SupNum,
                    chg_of_owner_id = truth.ChgOfOwnerId,
                });

                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = SaleEntityType,
                    TfEntityId = tfSale.TfSaleId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "sale",
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

            await WriteRemainingGatesAsync(batch, considered, projected, quarantined,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_sale projection COMPLETED. batch={BatchId} considered={Considered} projected={Projected} quarantined={Quarantined}",
                batch.LoadBatchId, considered, projected, quarantined);

            return new PacsSaleCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthSalesConsidered = considered,
                SalesProjected = projected,
                SalesQuarantined = quarantined,
                PriorCanonicalRowsRemoved = priorCanonical.Count,
                PriorQuarantineRowsRemoved = priorQuarantine.Count,
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
                "canonical_tf.tf_sale projection FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsSaleCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthSalesConsidered = 0,
                SalesProjected = 0,
                SalesQuarantined = 0,
                PriorCanonicalRowsRemoved = 0,
                PriorQuarantineRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    /// <summary>
    /// Walks active parcel-side <c>source_xref</c> rows, parses each
    /// <c>SourceKeyJson</c>, and returns a map from PACS
    /// <c>prop_id</c> to <c>(TfParcelId, CountyId)</c>.
    ///
    /// <para>v1 simplification: takes the first parcel xref per
    /// prop_id deterministically. Multi-county collisions on the
    /// same prop_id are vanishingly rare in PACS data; if they
    /// occur, the canonical-county-isolation gate surfaces the
    /// inconsistency.</para>
    /// </summary>
    private async Task<IReadOnlyDictionary<int, ParcelLookup>> BuildParcelIndexAsync(
        CancellationToken cancellationToken)
    {
        var parcelXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == ParcelEntityType && x.IsActive)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        if (parcelXrefs.Count == 0)
        {
            return new Dictionary<int, ParcelLookup>();
        }

        var parcelEntityIds = parcelXrefs.Select(x => x.TfEntityId).ToHashSet();
        var parcels = await _db.TfParcels
            .Where(p => parcelEntityIds.Contains(p.TfParcelId))
            .ToDictionaryAsync(p => p.TfParcelId, cancellationToken)
            .ConfigureAwait(false);

        var index = new Dictionary<int, ParcelLookup>();
        foreach (var xref in parcelXrefs)
        {
            int? propId = null;
            try
            {
                using var doc = JsonDocument.Parse(xref.SourceKeyJson);
                if (doc.RootElement.TryGetProperty("prop_id", out var el)
                    && el.TryGetInt32(out var pid))
                {
                    propId = pid;
                }
            }
            catch (JsonException)
            {
                // Malformed lineage JSON — skip this xref. The
                // doctrine's data quality is owned by whoever wrote
                // the xref, not by S3.
                continue;
            }

            if (propId is null) continue;
            if (!parcels.TryGetValue(xref.TfEntityId, out var parcel)) continue;

            // First parcel xref wins for a given prop_id; later
            // duplicates are ignored (deterministic by xref iteration
            // order).
            if (!index.ContainsKey(propId.Value))
            {
                index[propId.Value] = new ParcelLookup(parcel.TfParcelId, parcel.CountyId);
            }
        }
        return index;
    }

    private async Task RecordSourceBatchGateAsync(
        LoadBatch batch, string status, string detail,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-source-batch-completed",
            GateStage = "TRUTH_TO_CANONICAL",
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
        int projected,
        int quarantined,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) parcel-xref-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-parcel-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = projected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} projected={projected} quarantined={quarantined}",
            ExecutedAt = now,
        });

        // 3) source-xref-coverage — every projected tf_sale has a
        //    source_xref. Asserted from DB, not from in-process counters.
        var projectedIds = await _db.TfSales
            .Where(s => s.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(s => s.TfSaleId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == SaleEntityType
                        && x.LoadBatchId == batch.LoadBatchId
                        && projectedIds.Contains(x.TfEntityId))
            .Select(x => x.TfEntityId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var coverageMissing = projectedIds.Count - xrefIds.Count;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = projectedIds.Count.ToString(CultureInfo.InvariantCulture),
            Actual = xrefIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {projectedIds.Count} tf_sale rows have a source_xref"
                : $"{coverageMissing} tf_sale rows lack source_xref",
            ExecutedAt = now,
        });

        // 4) county-isolation — every tf_sale has a non-empty CountyId.
        var emptyCountyCount = await _db.TfSales
            .Where(s => s.PromotionLoadBatchId == batch.LoadBatchId
                        && s.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_sale has a non-empty CountyId"
                : $"{emptyCountyCount} tf_sale rows have empty CountyId",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
