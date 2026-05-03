using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsOwnerTruth;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice B2-A: raw → truth promoter for PACS owners. Five T-* gates:
///
/// <list type="bullet">
///   <item><c>truth-pacs-owner-source-batches-completed</c> — all
///   three source batches must be COMPLETED. FAIL refuses promotion.</item>
///   <item><c>truth-pacs-owner-supp-aware-join</c> — counts rejects
///   from no-supp-pointer or stale-sup-num. PASS at zero, WARN otherwise.</item>
///   <item><c>truth-pacs-owner-account-link</c> — every owner's
///   <c>OwnerId</c> must resolve to an <c>account.acct_id</c>.
///   FAIL on any orphan.</item>
///   <item><c>truth-pacs-owner-pct-completeness</c> — every
///   <c>(prop_id, owner_tax_yr)</c> group's pct values sum to 100.
///   This is the HARD doctrine tightening over B1-B's informational
///   surface. FAIL on any violation.</item>
///   <item><c>truth-pacs-owner-promotion-coverage</c> — every truth
///   row carries lineage to all three source raw rows.</item>
/// </list>
/// </summary>
public sealed class PacsOwnerCurrentTruthPromoter : IPacsOwnerCurrentTruthPromoter
{
    private const decimal FullPctTolerance = 0.01m;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsOwnerCurrentTruthPromoter> _logger;

    public PacsOwnerCurrentTruthPromoter(
        TerraFusionDbContext db,
        ILogger<PacsOwnerCurrentTruthPromoter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsOwnerCurrentTruthResult> PromoteAsync(
        Guid ownerLoadBatchId,
        Guid accountLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-owner-promoter",
            SourceFileOrDatabase =
                $"owner_batch={ownerLoadBatchId};account_batch={accountLoadBatchId};supp_batch={suppAssocLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            // ── Gate: all three source batches MUST be COMPLETED. ──
            var ownerBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == ownerLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            var accountBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == accountLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            var suppBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == suppAssocLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            var ownerOk = ownerBatch is not null && ownerBatch.Status == "COMPLETED";
            var accountOk = accountBatch is not null && accountBatch.Status == "COMPLETED";
            var suppOk = suppBatch is not null && suppBatch.Status == "COMPLETED";
            if (!ownerOk || !accountOk || !suppOk)
            {
                var detail = $"ownerBatch={(ownerBatch?.Status ?? "MISSING")} " +
                             $"accountBatch={(accountBatch?.Status ?? "MISSING")} " +
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
                "all three source batches COMPLETED", cancellationToken)
                .ConfigureAwait(false);

            // ── Idempotency: clear prior truth rows for this owner batch. ──
            var priorRows = await _db.TruthPacsOwnerCurrents
                .Where(t => t.OwnerLoadBatchId == ownerLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorRowsRemoved = priorRows.Count;
            if (priorRowsRemoved > 0)
            {
                _db.TruthPacsOwnerCurrents.RemoveRange(priorRows);
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            // ── Build supp pointer index from supp batch. ──
            var suppRows = await _db.LegacyPacsRawPropSuppAssocs
                .Where(p => p.LoadBatchId == suppAssocLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var suppIndex = suppRows
                .GroupBy(p => (p.PropId, p.PropValYr))
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(r => r.LandedAt).First());

            // ── Build account index from account batch. ──
            var accountRows = await _db.LegacyPacsRawAccounts
                .Where(a => a.LoadBatchId == accountLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var accountIndex = accountRows
                .GroupBy(a => a.AcctId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(r => r.LandedAt).First());

            // ── Iterate the owner batch and project. ──
            var ownerRows = await _db.LegacyPacsRawOwners
                .Where(o => o.LoadBatchId == ownerLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var considered = ownerRows.Count;
            var promoted = 0;
            var rejectedNoSupp = 0;
            var rejectedStaleSup = 0;
            var rejectedNoAccount = 0;

            // Pct accumulator across promoted rows only — the hard
            // gate applies to the COMPLETE truth-layer projection.
            var groupPctSums = new Dictionary<(int PropId, short Year), decimal?>();
            var now = DateTime.UtcNow;

            foreach (var owner in ownerRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!suppIndex.TryGetValue((owner.PropId, owner.OwnerTaxYr), out var suppPtr))
                {
                    rejectedNoSupp++;
                    continue;
                }
                if (suppPtr.SupNum != owner.SupNum)
                {
                    rejectedStaleSup++;
                    continue;
                }
                if (!accountIndex.TryGetValue(owner.OwnerId, out var account))
                {
                    rejectedNoAccount++;
                    continue;
                }

                _db.TruthPacsOwnerCurrents.Add(new TruthPacsOwnerCurrent
                {
                    PropId = owner.PropId,
                    OwnerTaxYr = owner.OwnerTaxYr,
                    SupNum = owner.SupNum,
                    OwnerId = owner.OwnerId,
                    AcctId = account.AcctId,
                    FileAsName = account.FileAsName,
                    FirstName = account.FirstName,
                    LastName = account.LastName,
                    ConfidentialFlag = account.ConfidentialFlag,
                    WebSuppression = account.WebSuppression,
                    PctOwnership = owner.PctOwnership,
                    TypeOfOwner = owner.TypeOfOwner,
                    UdiStatus = owner.UdiStatus,
                    BirthDt = owner.BirthDt,
                    SourceOwnerLandedRowId = owner.LandedRowId,
                    SourceAccountLandedRowId = account.LandedRowId,
                    SourceSuppAssocLandedRowId = suppPtr.LandedRowId,
                    OwnerLoadBatchId = ownerLoadBatchId,
                    AccountLoadBatchId = accountLoadBatchId,
                    SuppAssocLoadBatchId = suppAssocLoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    // G1 (v1.10): conversion-era marker derived from OwnerTaxYr.
                    ConversionEra = ConversionEras.FromYear(owner.OwnerTaxYr),
                    PromotedAt = now,
                });
                promoted++;

                var groupKey = (owner.PropId, owner.OwnerTaxYr);
                if (!groupPctSums.TryGetValue(groupKey, out var existing))
                {
                    groupPctSums[groupKey] = owner.PctOwnership;
                }
                else if (existing.HasValue && owner.PctOwnership.HasValue)
                {
                    groupPctSums[groupKey] = existing.Value + owner.PctOwnership.Value;
                }
                else
                {
                    groupPctSums[groupKey] = null; // NULL infects
                }
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            var pctViolations = groupPctSums.Values.Count(s =>
                !s.HasValue || Math.Abs(s.Value - 100m) > FullPctTolerance);

            await WriteRemainingGatesAsync(batch, considered, promoted,
                rejectedNoSupp, rejectedStaleSup, rejectedNoAccount,
                pctViolations, groupPctSums.Count,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.owner_current promotion COMPLETED. batch={BatchId} considered={Considered} promoted={Promoted} noSupp={NoSupp} staleSup={StaleSup} noAccount={NoAccount} pctViolations={PctV} prior={Prior}",
                batch.LoadBatchId, considered, promoted,
                rejectedNoSupp, rejectedStaleSup, rejectedNoAccount,
                pctViolations, priorRowsRemoved);

            return new PacsOwnerCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                OwnersConsidered = considered,
                OwnersPromoted = promoted,
                RejectedNoSuppPointer = rejectedNoSupp,
                RejectedStaleSupNum = rejectedStaleSup,
                RejectedNoAccount = rejectedNoAccount,
                PctCompletenessViolations = pctViolations,
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
                "truth_pacs.owner_current promotion FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsOwnerCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                OwnersConsidered = 0,
                OwnersPromoted = 0,
                RejectedNoSuppPointer = 0,
                RejectedStaleSupNum = 0,
                RejectedNoAccount = 0,
                PctCompletenessViolations = 0,
                PriorRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private static PacsOwnerCurrentTruthResult Refused(Guid promotionBatchId, string detail)
        => new()
        {
            PromotionLoadBatchId = promotionBatchId,
            Status = "REFUSED",
            OwnersConsidered = 0,
            OwnersPromoted = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            RejectedNoAccount = 0,
            PctCompletenessViolations = 0,
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
            GateName = "truth-pacs-owner-source-batches-completed",
            GateStage = "RAW_TO_TRUTH",
            Status = status,
            Expected = "all three COMPLETED",
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
        int rejectedNoAccount,
        int pctViolations,
        int totalGroups,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var suppRejects = rejectedNoSupp + rejectedStaleSup;

        // 2) supp-aware-join — PASS at zero, WARN otherwise.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-owner-supp-aware-join",
            GateStage = "RAW_TO_TRUTH",
            Status = suppRejects == 0 ? "PASS" : "WARN",
            Expected = "0",
            Actual = suppRejects.ToString(CultureInfo.InvariantCulture),
            Detail = $"noSuppPointer={rejectedNoSupp} staleSupNum={rejectedStaleSup}",
            ExecutedAt = now,
        });

        // 3) account-link — every owner has an account. Hard gate.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-owner-account-link",
            GateStage = "RAW_TO_TRUTH",
            Status = rejectedNoAccount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = rejectedNoAccount.ToString(CultureInfo.InvariantCulture),
            Detail = rejectedNoAccount == 0
                ? "every promoted owner resolved to an account"
                : $"{rejectedNoAccount} owner rows lacked a matching account row in the supplied account batch",
            ExecutedAt = now,
        });

        // 4) pct-completeness — HARD gate at truth layer.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-owner-pct-completeness",
            GateStage = "RAW_TO_TRUTH",
            Status = pctViolations == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = pctViolations.ToString(CultureInfo.InvariantCulture),
            Detail = pctViolations == 0
                ? $"all {totalGroups} (prop_id, owner_tax_yr) groups sum to 100"
                : $"{pctViolations} of {totalGroups} groups did not sum to 100 (or had NULL pct)",
            ExecutedAt = now,
        });

        // 5) promotion-coverage — full lineage on every projected row.
        var unprovenanced = await _db.TruthPacsOwnerCurrents
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId
                        && (t.SourceOwnerLandedRowId == Guid.Empty
                            || t.SourceAccountLandedRowId == Guid.Empty
                            || t.SourceSuppAssocLandedRowId == Guid.Empty
                            || t.OwnerLoadBatchId == Guid.Empty
                            || t.AccountLoadBatchId == Guid.Empty
                            || t.SuppAssocLoadBatchId == Guid.Empty))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-owner-promotion-coverage",
            GateStage = "RAW_TO_TRUTH",
            Status = unprovenanced == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = unprovenanced.ToString(CultureInfo.InvariantCulture),
            Detail = unprovenanced == 0
                ? $"all {promoted} promoted rows carry full lineage to all three source batches"
                : $"{unprovenanced} rows lack lineage",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
