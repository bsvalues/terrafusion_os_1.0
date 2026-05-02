using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice B2-B: raw → truth promoter for PACS
/// <c>wash_prop_owner_val</c>. Four T-* gates:
///
/// <list type="bullet">
///   <item><c>truth-pacs-wpov-source-batches-completed</c> — both
///   batches must be COMPLETED. FAIL refuses promotion.</item>
///   <item><c>truth-pacs-wpov-supp-aware-join</c> — counts rejects
///   from no-supp-pointer or stale-sup-num. PASS at zero, WARN otherwise.</item>
///   <item><c>truth-pacs-wpov-promotion-coverage</c> — every truth
///   row carries lineage to both source raw rows.</item>
///   <item><c>truth-pacs-wpov-aggregate</c> — informational; sums
///   <c>AssessedVal</c> + <c>MarketVal</c> over the supp-filtered
///   set so an operator can compare against B1-C's aggregate gate.</item>
/// </list>
/// </summary>
public sealed class PacsWashPropOwnerValTruthPromoter : IPacsWashPropOwnerValTruthPromoter
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsWashPropOwnerValTruthPromoter> _logger;

    public PacsWashPropOwnerValTruthPromoter(
        TerraFusionDbContext db,
        ILogger<PacsWashPropOwnerValTruthPromoter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsWashPropOwnerValTruthResult> PromoteAsync(
        Guid wpovLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-wpov-promoter",
            SourceFileOrDatabase =
                $"wpov_batch={wpovLoadBatchId};supp_batch={suppAssocLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var wpovBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == wpovLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            var suppBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == suppAssocLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            var wpovOk = wpovBatch is not null && wpovBatch.Status == "COMPLETED";
            var suppOk = suppBatch is not null && suppBatch.Status == "COMPLETED";
            if (!wpovOk || !suppOk)
            {
                var detail = $"wpovBatch={(wpovBatch?.Status ?? "MISSING")} " +
                             $"suppBatch={(suppBatch?.Status ?? "MISSING")}";
                await RecordSourceBatchGateAsync(batch, "FAIL", detail, cancellationToken)
                    .ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return Refused(batch.LoadBatchId, detail);
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "both source batches COMPLETED", cancellationToken).ConfigureAwait(false);

            // Idempotency: clear prior truth rows for this wpov batch.
            var priorRows = await _db.TruthPacsWashPropOwnerVals
                .Where(t => t.WpovLoadBatchId == wpovLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorRowsRemoved = priorRows.Count;
            if (priorRowsRemoved > 0)
            {
                _db.TruthPacsWashPropOwnerVals.RemoveRange(priorRows);
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            // Build supp pointer index from supp batch.
            var suppRows = await _db.LegacyPacsRawPropSuppAssocs
                .Where(p => p.LoadBatchId == suppAssocLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var suppIndex = suppRows
                .GroupBy(p => (p.PropId, p.PropValYr))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(r => r.LandedAt).First());

            // Iterate wpov rows.
            var wpovRows = await _db.LegacyPacsRawWashPropOwnerVals
                .Where(w => w.LoadBatchId == wpovLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var considered = wpovRows.Count;
            var promoted = 0;
            var rejectedNoSupp = 0;
            var rejectedStaleSup = 0;
            decimal assessedSum = 0m;
            decimal marketSum = 0m;
            var now = DateTime.UtcNow;

            foreach (var wpov in wpovRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!suppIndex.TryGetValue((wpov.PropId, wpov.PropValYr), out var suppPtr))
                {
                    rejectedNoSupp++;
                    continue;
                }
                if (suppPtr.SupNum != wpov.SupNum)
                {
                    rejectedStaleSup++;
                    continue;
                }

                _db.TruthPacsWashPropOwnerVals.Add(new TruthPacsWashPropOwnerVal
                {
                    PropValYr = wpov.PropValYr,
                    SupNum = wpov.SupNum,
                    PropId = wpov.PropId,
                    OwnerId = wpov.OwnerId,
                    AssessedVal = wpov.AssessedVal,
                    MarketVal = wpov.MarketVal,
                    AppraisedVal = wpov.AppraisedVal,
                    TaxableClassified = wpov.TaxableClassified,
                    TaxableNonClassified = wpov.TaxableNonClassified,
                    LandTaxableClassified = wpov.LandTaxableClassified,
                    LandTaxableNonClassified = wpov.LandTaxableNonClassified,
                    ImprvTaxableClassified = wpov.ImprvTaxableClassified,
                    ImprvTaxableNonClassified = wpov.ImprvTaxableNonClassified,
                    StateValueClassified = wpov.StateValueClassified,
                    StateValueNonClassified = wpov.StateValueNonClassified,
                    BoeStatus = wpov.BoeStatus,
                    DisasterProrationPct = wpov.DisasterProrationPct,
                    SnrFrzImprvHs = wpov.SnrFrzImprvHs,
                    SnrFrzLandHs = wpov.SnrFrzLandHs,
                    SourceWpovLandedRowId = wpov.LandedRowId,
                    SourceSuppAssocLandedRowId = suppPtr.LandedRowId,
                    WpovLoadBatchId = wpovLoadBatchId,
                    SuppAssocLoadBatchId = suppAssocLoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    PromotedAt = now,
                });
                promoted++;

                if (wpov.AssessedVal.HasValue) assessedSum += wpov.AssessedVal.Value;
                if (wpov.MarketVal.HasValue) marketSum += wpov.MarketVal.Value;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, promoted,
                rejectedNoSupp, rejectedStaleSup, assessedSum, marketSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.wash_prop_owner_val promotion COMPLETED. batch={BatchId} considered={Considered} promoted={Promoted} noSupp={NoSupp} staleSup={StaleSup} assessedSum={AS} marketSum={MS} prior={Prior}",
                batch.LoadBatchId, considered, promoted, rejectedNoSupp, rejectedStaleSup,
                assessedSum, marketSum, priorRowsRemoved);

            return new PacsWashPropOwnerValTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                RowsConsidered = considered,
                RowsPromoted = promoted,
                RejectedNoSuppPointer = rejectedNoSupp,
                RejectedStaleSupNum = rejectedStaleSup,
                AssessedValSum = assessedSum,
                MarketValSum = marketSum,
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
                "truth_pacs.wash_prop_owner_val promotion FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsWashPropOwnerValTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                RowsConsidered = 0,
                RowsPromoted = 0,
                RejectedNoSuppPointer = 0,
                RejectedStaleSupNum = 0,
                AssessedValSum = 0m,
                MarketValSum = 0m,
                PriorRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private static PacsWashPropOwnerValTruthResult Refused(Guid promotionBatchId, string detail)
        => new()
        {
            PromotionLoadBatchId = promotionBatchId,
            Status = "REFUSED",
            RowsConsidered = 0,
            RowsPromoted = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            AssessedValSum = 0m,
            MarketValSum = 0m,
            PriorRowsRemoved = 0,
            ErrorSummary = detail,
        };

    private async Task RecordSourceBatchGateAsync(
        LoadBatch batch, string status, string detail,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-wpov-source-batches-completed",
            GateStage = "RAW_TO_TRUTH",
            Status = status,
            Expected = "both COMPLETED",
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
        int rejectedNoSupp,
        int rejectedStaleSup,
        decimal assessedSum,
        decimal marketSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var suppRejects = rejectedNoSupp + rejectedStaleSup;

        // 2) supp-aware-join — PASS at zero, WARN otherwise.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-wpov-supp-aware-join",
            GateStage = "RAW_TO_TRUTH",
            Status = suppRejects == 0 ? "PASS" : "WARN",
            Expected = "0",
            Actual = suppRejects.ToString(CultureInfo.InvariantCulture),
            Detail = $"noSuppPointer={rejectedNoSupp} staleSupNum={rejectedStaleSup}",
            ExecutedAt = now,
        });

        // 3) promotion-coverage — full lineage on every projected row.
        var unprovenanced = await _db.TruthPacsWashPropOwnerVals
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId
                        && (t.SourceWpovLandedRowId == Guid.Empty
                            || t.SourceSuppAssocLandedRowId == Guid.Empty
                            || t.WpovLoadBatchId == Guid.Empty
                            || t.SuppAssocLoadBatchId == Guid.Empty))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-wpov-promotion-coverage",
            GateStage = "RAW_TO_TRUTH",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {promoted} promoted rows carry full lineage"
                : $"{unprovenanced} rows lack lineage",
            ExecutedAt = now,
        });

        // 4) aggregate — informational; sum after supp filter.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-wpov-aggregate",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = promoted.ToString(CultureInfo.InvariantCulture),
            Detail = $"assessedValSum={assessedSum.ToString(CultureInfo.InvariantCulture)} " +
                     $"marketValSum={marketSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
