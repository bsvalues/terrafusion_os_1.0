using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.PacsSaleTruth;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice S2-B: raw → truth promoter for PACS sales.
///
/// <list type="bullet">
///   <item><c>truth-pacs-source-batch-completed</c> — both source
///   batches must be COMPLETED. FAIL refuses promotion.</item>
///   <item><c>truth-pacs-qualification-filter</c> — informational;
///   counts qualified vs not-qualified.</item>
///   <item><c>truth-pacs-supp-aware-join</c> — counts rejected by
///   no-supp-pointer or stale-sup_num. PASS when both are 0,
///   WARN otherwise (truth still lands the kept rows; this is the
///   doctrine's visibility surface).</item>
///   <item><c>truth-pacs-stale-axis-rejected</c> — defense-in-depth
///   over the S1 gate; FAIL if any '01'/'02' rows reach truth.</item>
///   <item><c>truth-pacs-promotion-coverage</c> — every truth row
///   has SourceSaleLandedRowId, SourceSuppAssocLandedRowId, and
///   both source batch ids populated. FAIL otherwise.</item>
/// </list>
/// </summary>
public sealed class PacsSaleTruthPromoter : IPacsSaleTruthPromoter
{
    // SYNC-DOCTRINE-2 (B2): the hardcoded ValidSaleCode = "100" filter
    // is REMOVED. Qualification is now per-sale evaluation against
    // tf_doctrine_ratio_policy via IRatioQualificationPolicy. A sale
    // is promoted to truth_pacs.sale if it qualifies for AT LEAST ONE
    // of the two ratio studies (DOR_RATIO or COUNTY_INTERNAL_RATIO).
    private static readonly HashSet<string> StaleValidSaleCodes =
        new(StringComparer.OrdinalIgnoreCase) { "01", "02" };

    // SYNC-DOCTRINE-2 (B2): single-county Benton hardcode. Multi-county
    // future will inject this via an IOperatorContext or similar.
    private const string CountySlug = "benton-wa";

    private readonly TerraFusionDbContext _db;
    private readonly IRatioQualificationPolicy _policy;
    private readonly ILogger<PacsSaleTruthPromoter> _logger;

    public PacsSaleTruthPromoter(
        TerraFusionDbContext db,
        IRatioQualificationPolicy policy,
        ILogger<PacsSaleTruthPromoter> logger)
    {
        _db = db;
        _policy = policy;
        _logger = logger;
    }

    public async Task<PacsSaleTruthPromotionResult> PromoteAsync(
        Guid saleLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        // ── Open the promotion batch FIRST so a refusal still leaves
        //    a recorded row in load_batch / promotion_gate_result. ──
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-promoter",
            SourceFileOrDatabase = $"sale_batch={saleLoadBatchId};supp_batch={suppAssocLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            // ── Gate: source batches MUST be COMPLETED. ──
            var saleBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == saleLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            var suppBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == suppAssocLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            var saleOk = saleBatch is not null && saleBatch.Status == "COMPLETED";
            var suppOk = suppBatch is not null && suppBatch.Status == "COMPLETED";
            if (!saleOk || !suppOk)
            {
                var detail =
                    $"saleBatch={(saleBatch?.Status ?? "MISSING")} " +
                    $"suppBatch={(suppBatch?.Status ?? "MISSING")}";
                await RecordSourceBatchGateAsync(batch, "FAIL", detail, cancellationToken)
                    .ConfigureAwait(false);

                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                return new PacsSaleTruthPromotionResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    SalesConsidered = 0,
                    SalesPromoted = 0,
                    RejectedNotQualified = 0,
                    RejectedNoSuppPointer = 0,
                    RejectedStaleSupNum = 0,
                    RejectedStaleAxis = 0,
                    PriorRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "both source batches COMPLETED", cancellationToken).ConfigureAwait(false);

            // ── Iterate the sale batch and project. ──
            var sales = await _db.LegacyPacsRawSales
                .Where(s => s.LoadBatchId == saleLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // ── Idempotency: clear prior truth rows by NATURAL KEY (the
            //    sale-event identity (ChgOfOwnerId, PropId) carried by this
            //    batch's sales), NOT by SaleLoadBatchId. Batch-scoped clearing
            //    never removed rows promoted under an earlier batch id, so
            //    re-draining the same sales duplicated truth (observed 1.96x on
            //    truth_pacs.sale). Same root cause + fix as the improvement
            //    (76027e412) and land (bfe989350) promoters. Clearing by the
            //    (ChgOfOwnerId, PropId) set the batch covers makes re-drains
            //    idempotent regardless of which batch first promoted them. ──
            var batchChgIds = sales.Select(s => s.ChgOfOwnerId).Distinct().ToList();
            var batchPropIds = sales.Select(s => s.PropId).Distinct().ToList();
            var priorRowsRemoved = 0;
            if (batchChgIds.Count > 0)
            {
                priorRowsRemoved = await _db.TruthPacsSales
                    .Where(t => batchChgIds.Contains(t.ChgOfOwnerId) && batchPropIds.Contains(t.PropId))
                    .ExecuteDeleteAsync(cancellationToken).ConfigureAwait(false);
            }

            // ── Build the supp pointer index from the supp batch. ──
            var suppRows = await _db.LegacyPacsRawPropSuppAssocs
                .Where(p => p.LoadBatchId == suppAssocLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // Doctrine: (PropId, PropValYr) is unique. If the supp
            // batch passed the S2-A uniqueness gate, .First() is
            // safe; if not, take the first deterministically and let
            // the S2-A gate's FAIL surface the issue.
            var suppIndex = suppRows
                .GroupBy(p => (p.PropId, p.PropValYr))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(r => r.LandedAt).First());

            var considered = sales.Count;
            var promoted = 0;
            var rejectedNotQualified = 0;
            var rejectedNoSuppPointer = 0;
            var rejectedStaleSupNum = 0;
            var rejectedStaleAxis = 0;
            // G4 (v1.13): pre-conversion-share gate counter.
            var preConversionPromoted = 0;
            // SYNC-DOCTRINE-2 (B2): dual-surface telemetry counters.
            var promotedDorOnly = 0;
            var promotedCountyOnly = 0;
            var promotedBothStudies = 0;

            var now = DateTime.UtcNow;
            foreach (var sale in sales)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // Defense-in-depth stale-axis rejection (pre-conversion
                // legacy '01'/'02' codes are unconditionally dropped).
                if (sale.SlCountyRatioCd is not null
                    && StaleValidSaleCodes.Contains(sale.SlCountyRatioCd))
                {
                    rejectedStaleAxis++;
                    continue;
                }

                // FK gates (sup-aware-validated identity) MUST hold
                // regardless of qualification.
                if (!suppIndex.TryGetValue((sale.PropId, sale.PropValYr), out var suppPtr))
                {
                    rejectedNoSuppPointer++;
                    continue;
                }

                if (suppPtr.SupNum != sale.SupNum)
                {
                    rejectedStaleSupNum++;
                    continue;
                }

                // SYNC-DOCTRINE-2 (B2): dual-surface qualification
                // evaluation. Replaces the hardcoded sl_county_ratio_cd='100'
                // filter. The promoter evaluates BOTH studies and writes
                // both booleans to truth_pacs.sale; promotion happens iff
                // at least one study qualifies the sale.
                var saleYear = sale.SlDt?.Year
                    ?? (sale.PropValYr > 0 ? (int)sale.PropValYr : 0);

                var dorEval = await _policy.EvaluateAsync(
                    CountySlug,
                    "DOR_RATIO",
                    saleYear,
                    sale.SlRatioTypeCd,
                    cancellationToken).ConfigureAwait(false);

                var countyEval = await _policy.EvaluateAsync(
                    CountySlug,
                    "COUNTY_INTERNAL_RATIO",
                    saleYear,
                    sale.SlCountyRatioCd,
                    cancellationToken).ConfigureAwait(false);

                if (!dorEval.Qualified && !countyEval.Qualified)
                {
                    rejectedNotQualified++;
                    continue;
                }

                if (dorEval.Qualified && countyEval.Qualified) promotedBothStudies++;
                else if (dorEval.Qualified) promotedDorOnly++;
                else promotedCountyOnly++;

                // G1 (v1.10): conversion-era marker derived from PropValYr.
                var era = ConversionEras.FromYear(sale.PropValYr);
                if (era == ConversionEras.PreConversion2017) preConversionPromoted++;

                _db.TruthPacsSales.Add(new TruthPacsSale
                {
                    ChgOfOwnerId = sale.ChgOfOwnerId,
                    PropId = sale.PropId,
                    PropValYr = sale.PropValYr,
                    SupNum = sale.SupNum,
                    // Verbatim: pre-DOCTRINE-2 this was forced to '100';
                    // now it's the raw value (may be NULL or any code).
                    SlCountyRatioCd = sale.SlCountyRatioCd,
                    DorRatioQualified = dorEval.Qualified,
                    CountyRatioReviewed = countyEval.Reviewed,
                    CountyRatioQualified = countyEval.Qualified,
                    CountyRatioCode = sale.SlCountyRatioCd,
                    CountyRatioDescription =
                        CountyRatioCodebook.Describe(sale.SlCountyRatioCd),
                    SlDt = sale.SlDt,
                    SlPrice = sale.SlPrice,
                    AdjSlPrice = sale.AdjSlPrice,
                    SourceSaleLandedRowId = sale.LandedRowId,
                    SourceSuppAssocLandedRowId = suppPtr.LandedRowId,
                    SaleLoadBatchId = saleLoadBatchId,
                    SuppAssocLoadBatchId = suppAssocLoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    ConversionEra = era,
                    PromotedAt = now,
                });
                promoted++;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // SYNC-DOCTRINE-2 (B2): dual-surface summary gate.
            await RecordDualSurfaceGateAsync(
                batch, promoted, promotedDorOnly, promotedCountyOnly,
                promotedBothStudies, cancellationToken).ConfigureAwait(false);

            // G4 (v1.13): pre-conversion-share gate.
            ConversionEraGate.AddShareGate(
                _db, batch, ConversionEraGate.Lanes.Sale,
                promoted, preConversionPromoted);

            await WriteRemainingGatesAsync(batch, considered, promoted,
                rejectedNotQualified, rejectedNoSuppPointer, rejectedStaleSupNum,
                rejectedStaleAxis, cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.sale promotion COMPLETED. batch={BatchId} considered={Considered} promoted={Promoted} notQual={NotQ} noSupp={NoSupp} staleSup={StaleSup} staleAxis={StaleAxis} prior={Prior}",
                batch.LoadBatchId, considered, promoted,
                rejectedNotQualified, rejectedNoSuppPointer, rejectedStaleSupNum,
                rejectedStaleAxis, priorRowsRemoved);

            return new PacsSaleTruthPromotionResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                SalesConsidered = considered,
                SalesPromoted = promoted,
                RejectedNotQualified = rejectedNotQualified,
                RejectedNoSuppPointer = rejectedNoSuppPointer,
                RejectedStaleSupNum = rejectedStaleSupNum,
                RejectedStaleAxis = rejectedStaleAxis,
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
                "truth_pacs.sale promotion FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsSaleTruthPromotionResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                SalesConsidered = 0,
                SalesPromoted = 0,
                RejectedNotQualified = 0,
                RejectedNoSuppPointer = 0,
                RejectedStaleSupNum = 0,
                RejectedStaleAxis = 0,
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
            GateName = "truth-pacs-source-batch-completed",
            GateStage = "RAW_TO_TRUTH",
            Status = status,
            Expected = "both COMPLETED",
            Actual = status,
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// SYNC-DOCTRINE-2 (B2): informational gate recording how many
    /// promoted truth rows qualified for DOR only, county only, or
    /// both studies. Always PASS (data observation, not pass/fail).
    /// </summary>
    private async Task RecordDualSurfaceGateAsync(
        LoadBatch batch,
        int promoted,
        int dorOnly,
        int countyOnly,
        int bothStudies,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-dual-surface-summary",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = promoted.ToString(CultureInfo.InvariantCulture),
            Detail =
                $"promoted={promoted} dorOnly={dorOnly} " +
                $"countyOnly={countyOnly} bothStudies={bothStudies}",
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task WriteRemainingGatesAsync(
        LoadBatch batch,
        int considered,
        int promoted,
        int rejectedNotQualified,
        int rejectedNoSuppPointer,
        int rejectedStaleSupNum,
        int rejectedStaleAxis,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) qualification-filter — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-qualification-filter",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = promoted.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} qualified={promoted} notQualified={rejectedNotQualified}",
            ExecutedAt = now,
        });

        // 3) supp-aware-join — PASS when no rejects, WARN otherwise.
        var suppRejects = rejectedNoSuppPointer + rejectedStaleSupNum;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-supp-aware-join",
            GateStage = "RAW_TO_TRUTH",
            Status = suppRejects == 0 ? "PASS" : "WARN",
            Expected = "0",
            Actual = suppRejects.ToString(CultureInfo.InvariantCulture),
            Detail = $"noSuppPointer={rejectedNoSuppPointer} staleSupNum={rejectedStaleSupNum}",
            ExecutedAt = now,
        });

        // 4) stale-axis-rejected — FAIL on any leak (defense-in-depth).
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-stale-axis-rejected",
            GateStage = "RAW_TO_TRUTH",
            Status = rejectedStaleAxis == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = rejectedStaleAxis.ToString(CultureInfo.InvariantCulture),
            Detail = rejectedStaleAxis == 0
                ? "no stale '01'/'02' codes reached the truth layer"
                : $"{rejectedStaleAxis} rows with stale legacy axis were rejected at the truth layer (S1 gate should have caught these earlier)",
            ExecutedAt = now,
        });

        // 5) promotion-coverage — every truth row carries lineage.
        var unprovenanced = await _db.TruthPacsSales
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId
                        && (t.SourceSaleLandedRowId == Guid.Empty
                            || t.SourceSuppAssocLandedRowId == Guid.Empty
                            || t.SaleLoadBatchId == Guid.Empty
                            || t.SuppAssocLoadBatchId == Guid.Empty))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-promotion-coverage",
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
