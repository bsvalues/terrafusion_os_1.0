using System;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsLandTruth;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice L2: raw → truth promoter for PACS land segments. Four
/// T-* gates:
///
/// <list type="bullet">
///   <item><c>truth-pacs-land-source-batches-completed</c> — both
///   source batches must be COMPLETED. FAIL refuses promotion.</item>
///   <item><c>truth-pacs-land-supp-aware-join</c> — counts rejects
///   from no-supp-pointer or stale-sup-num. PASS at zero, WARN otherwise.</item>
///   <item><c>truth-pacs-land-promotion-coverage</c> — every truth
///   row carries lineage to both source raw rows.</item>
///   <item><c>truth-pacs-land-aggregate</c> — informational; sums
///   <c>SizeAcres</c> + <c>LandSegMarketVal</c> over the supp-filtered
///   set so an operator can compare against L1's aggregate gate.</item>
/// </list>
/// </summary>
public sealed class PacsLandCurrentTruthPromoter : IPacsLandCurrentTruthPromoter
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsLandCurrentTruthPromoter> _logger;

    public PacsLandCurrentTruthPromoter(
        TerraFusionDbContext db,
        ILogger<PacsLandCurrentTruthPromoter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsLandCurrentTruthResult> PromoteAsync(
        Guid landLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-land-promoter",
            SourceFileOrDatabase =
                $"land_batch={landLoadBatchId};supp_batch={suppAssocLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var landBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == landLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            var suppBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == suppAssocLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            var landOk = landBatch is not null && landBatch.Status == "COMPLETED";
            var suppOk = suppBatch is not null && suppBatch.Status == "COMPLETED";
            if (!landOk || !suppOk)
            {
                var detail = $"landBatch={(landBatch?.Status ?? "MISSING")} " +
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

            // Idempotency: clear prior truth rows for this land batch.
            var priorRows = await _db.TruthPacsLandCurrents
                .Where(t => t.LandLoadBatchId == landLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorRowsRemoved = priorRows.Count;
            if (priorRowsRemoved > 0)
            {
                _db.TruthPacsLandCurrents.RemoveRange(priorRows);
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

            // Iterate land_detail rows.
            var landRows = await _db.LegacyPacsRawLandDetails
                .Where(l => l.LoadBatchId == landLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var considered = landRows.Count;
            var promoted = 0;
            var rejectedNoSupp = 0;
            var rejectedStaleSup = 0;
            decimal acresSum = 0m;
            decimal marketValSum = 0m;
            var now = DateTime.UtcNow;

            foreach (var land in landRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!suppIndex.TryGetValue((land.PropId, land.PropValYr), out var suppPtr))
                {
                    rejectedNoSupp++;
                    continue;
                }
                if (suppPtr.SupNum != land.SupNum)
                {
                    rejectedStaleSup++;
                    continue;
                }

                _db.TruthPacsLandCurrents.Add(new TruthPacsLandCurrent
                {
                    PropValYr = land.PropValYr,
                    SupNum = land.SupNum,
                    PropId = land.PropId,
                    LandSegId = land.LandSegId,
                    LandSegTypeCd = land.LandSegTypeCd,
                    LandSegStateCd = land.LandSegStateCd,
                    LandSegClassCd = land.LandSegClassCd,
                    LandSegUseCd = land.LandSegUseCd,
                    SoilCd = land.SoilCd,
                    LandSegHomesite = land.LandSegHomesite,
                    SizeAcres = land.SizeAcres,
                    SizeSquareFeet = land.SizeSquareFeet,
                    LandSegMarketVal = land.LandSegMarketVal,
                    LandSegAgValue = land.LandSegAgValue,
                    LandSegAssessedVal = land.LandSegAssessedVal,
                    LandSegEffAge = land.LandSegEffAge,
                    SourceLandLandedRowId = land.LandedRowId,
                    SourceSuppAssocLandedRowId = suppPtr.LandedRowId,
                    LandLoadBatchId = landLoadBatchId,
                    SuppAssocLoadBatchId = suppAssocLoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    PromotedAt = now,
                });
                promoted++;

                if (land.SizeAcres.HasValue) acresSum += land.SizeAcres.Value;
                if (land.LandSegMarketVal.HasValue) marketValSum += land.LandSegMarketVal.Value;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, promoted,
                rejectedNoSupp, rejectedStaleSup, acresSum, marketValSum,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.land_current promotion COMPLETED. batch={BatchId} considered={Considered} promoted={Promoted} noSupp={NoSupp} staleSup={StaleSup} acresSum={Acres} marketValSum={MV} prior={Prior}",
                batch.LoadBatchId, considered, promoted, rejectedNoSupp, rejectedStaleSup,
                acresSum, marketValSum, priorRowsRemoved);

            return new PacsLandCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                LandSegsConsidered = considered,
                LandSegsPromoted = promoted,
                RejectedNoSuppPointer = rejectedNoSupp,
                RejectedStaleSupNum = rejectedStaleSup,
                SizeAcresSum = acresSum,
                LandSegMarketValSum = marketValSum,
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
                "truth_pacs.land_current promotion FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsLandCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                LandSegsConsidered = 0,
                LandSegsPromoted = 0,
                RejectedNoSuppPointer = 0,
                RejectedStaleSupNum = 0,
                SizeAcresSum = 0m,
                LandSegMarketValSum = 0m,
                PriorRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private static PacsLandCurrentTruthResult Refused(Guid promotionBatchId, string detail)
        => new()
        {
            PromotionLoadBatchId = promotionBatchId,
            Status = "REFUSED",
            LandSegsConsidered = 0,
            LandSegsPromoted = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            SizeAcresSum = 0m,
            LandSegMarketValSum = 0m,
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
            GateName = "truth-pacs-land-source-batches-completed",
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
        decimal acresSum,
        decimal marketValSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var suppRejects = rejectedNoSupp + rejectedStaleSup;

        // 2) supp-aware-join — PASS at zero, WARN otherwise.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-land-supp-aware-join",
            GateStage = "RAW_TO_TRUTH",
            Status = suppRejects == 0 ? "PASS" : "WARN",
            Expected = "0",
            Actual = suppRejects.ToString(CultureInfo.InvariantCulture),
            Detail = $"noSuppPointer={rejectedNoSupp} staleSupNum={rejectedStaleSup}",
            ExecutedAt = now,
        });

        // 3) promotion-coverage — full lineage on every projected row.
        var unprovenanced = await _db.TruthPacsLandCurrents
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId
                        && (t.SourceLandLandedRowId == Guid.Empty
                            || t.SourceSuppAssocLandedRowId == Guid.Empty
                            || t.LandLoadBatchId == Guid.Empty
                            || t.SuppAssocLoadBatchId == Guid.Empty))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-land-promotion-coverage",
            GateStage = "RAW_TO_TRUTH",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {promoted} promoted rows carry full lineage"
                : $"{unprovenanced} rows lack lineage",
            ExecutedAt = now,
        });

        // 4) aggregate — informational; sums after supp filter.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-land-aggregate",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = promoted.ToString(CultureInfo.InvariantCulture),
            Detail = $"sizeAcresSum={acresSum.ToString(CultureInfo.InvariantCulture)} " +
                     $"landSegMarketValSum={marketValSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
