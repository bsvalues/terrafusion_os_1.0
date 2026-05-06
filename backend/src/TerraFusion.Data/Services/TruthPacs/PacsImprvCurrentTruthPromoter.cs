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
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.PacsImprvTruth;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// Slice C2: raw → truth promoter for PACS improvement parents.
/// Four T-* gates:
///
/// <list type="bullet">
///   <item><c>truth-pacs-imprv-source-batches-completed</c> — both
///   source batches must be COMPLETED. FAIL refuses promotion.</item>
///   <item><c>truth-pacs-imprv-supp-aware-join</c> — counts rejects
///   from no-supp-pointer or stale-sup-num. PASS at zero, WARN otherwise.</item>
///   <item><c>truth-pacs-imprv-promotion-coverage</c> — every truth
///   row carries lineage to both source raw rows.</item>
///   <item><c>truth-pacs-imprv-aggregate</c> — informational; sums
///   <c>ImprvVal</c> over the supp-filtered set so an operator can
///   compare against C1-A's aggregate gate.</item>
/// </list>
/// </summary>
public sealed class PacsImprvCurrentTruthPromoter : IPacsImprvCurrentTruthPromoter
{
    /// <summary>
    /// Default county tag used by the universe classifier when the
    /// promoter has no explicit county context. Matches the seed
    /// rules' County field. Multi-county hosts will need to surface
    /// a county tag through the orchestrator (out of scope for
    /// SYNC-DOCTRINE-4-IMPL).
    /// </summary>
    private const string DefaultCountyTag = "benton-wa";

    /// <summary>Year boundary for CONVERSION_LEGACY's CREATED_DT_PRE_2017 marker.</summary>
    private static readonly DateTime LegacyMarkerCutoff =
        new(2017, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;
    private readonly IPropertyUniverseClassifier _universeClassifier;
    private readonly ILogger<PacsImprvCurrentTruthPromoter> _logger;

    public PacsImprvCurrentTruthPromoter(
        TerraFusionDbContext db,
        IPropertyUniverseClassifier universeClassifier,
        ILogger<PacsImprvCurrentTruthPromoter> logger)
    {
        _db = db;
        _universeClassifier = universeClassifier;
        _logger = logger;
    }

    public async Task<PacsImprvCurrentTruthResult> PromoteAsync(
        Guid imprvLoadBatchId,
        Guid suppAssocLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-imprv-promoter",
            SourceFileOrDatabase =
                $"imprv_batch={imprvLoadBatchId};supp_batch={suppAssocLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var imprvBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == imprvLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            var suppBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == suppAssocLoadBatchId, cancellationToken)
                .ConfigureAwait(false);

            var imprvOk = imprvBatch is not null && imprvBatch.Status == "COMPLETED";
            var suppOk = suppBatch is not null && suppBatch.Status == "COMPLETED";
            if (!imprvOk || !suppOk)
            {
                var detail = $"imprvBatch={(imprvBatch?.Status ?? "MISSING")} " +
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

            // Idempotency: clear prior truth rows for this imprv batch.
            var priorRows = await _db.TruthPacsImprvCurrents
                .Where(t => t.ImprvLoadBatchId == imprvLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorRowsRemoved = priorRows.Count;
            if (priorRowsRemoved > 0)
            {
                _db.TruthPacsImprvCurrents.RemoveRange(priorRows);
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

            // Iterate imprv rows.
            var imprvRows = await _db.LegacyPacsRawImprvs
                .Where(i => i.LoadBatchId == imprvLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // SYNC-DOCTRINE-4: build a property-row index for universe
            // classification. Latest LandedAt per prop_id wins. Property
            // rows live in legacy_pacs_raw.property and are populated by
            // the SYNC-POP-4a property landing slice; rows arriving here
            // without a matching property row classify as UNKNOWN /
            // UniverseNotEvaluated, which the operator can use as a
            // signal to run the property landing first.
            var imprvPropIds = imprvRows.Select(i => i.PropId).Distinct().ToList();
            var propertyIndex = await _db.LegacyPacsRawProperties
                .Where(p => imprvPropIds.Contains(p.PropId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var latestPropertyByPropId = propertyIndex
                .GroupBy(p => p.PropId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(p => p.LandedAt).First());

            // SYNC-DOCTRINE-4-IMPL-V3: build a (prop_id, prop_val_yr)
            // → ag-program signal index from legacy_pacs_raw.land_detail.
            // Aggregate semantics:
            //   AgApply = 'T'  if ANY land segment has ag_apply='T'
            //                  (under PACS char coding 'Y'/'T' both
            //                   indicate participation; we accept either)
            //   AgApply = 'F'  if NO segment has ag_apply='T' AND
            //                  at least one has ag_apply='F' / 'N'
            //   AgApply = NULL otherwise (no land_detail rows landed)
            //
            //   AgUseCd       = first non-null ag_use_cd from a segment
            //                   that has ag_apply='T' (most-relevant);
            //                   else first non-null overall; else NULL.
            //
            // The classifier only checks AgApply='T' for AG_CURRENT_USE
            // today, so the OR-aggregate is safe: any single ag-segment
            // routes the parcel to AG_CURRENT_USE regardless of how
            // many residential segments it also has.
            var imprvKeys = imprvRows
                .Select(i => (i.PropId, i.PropValYr))
                .Distinct()
                .ToList();
            var landDetailRows = await _db.LegacyPacsRawLandDetails
                .Where(l => imprvPropIds.Contains(l.PropId))
                .Select(l => new { l.PropId, l.PropValYr, l.AgApply, l.AgUseCd, l.LandedAt })
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var agSignalByKey = new Dictionary<(int PropId, short PropValYr),
                (string? AgApply, string? AgUseCd)>();
            foreach (var grp in landDetailRows.GroupBy(l => (l.PropId, l.PropValYr)))
            {
                var rows = grp.OrderByDescending(l => l.LandedAt).ToList();
                var anyT = rows.Any(r =>
                    !string.IsNullOrEmpty(r.AgApply) &&
                    (r.AgApply.Equals("T", StringComparison.OrdinalIgnoreCase) ||
                     r.AgApply.Equals("Y", StringComparison.OrdinalIgnoreCase)));
                var anyF = rows.Any(r =>
                    !string.IsNullOrEmpty(r.AgApply) &&
                    (r.AgApply.Equals("F", StringComparison.OrdinalIgnoreCase) ||
                     r.AgApply.Equals("N", StringComparison.OrdinalIgnoreCase)));
                var agApply = anyT ? "T" : (anyF ? "F" : (string?)null);
                var agUseCd = rows
                    .Where(r =>
                        !string.IsNullOrEmpty(r.AgApply) &&
                        (r.AgApply.Equals("T", StringComparison.OrdinalIgnoreCase) ||
                         r.AgApply.Equals("Y", StringComparison.OrdinalIgnoreCase)) &&
                        !string.IsNullOrEmpty(r.AgUseCd))
                    .Select(r => r.AgUseCd)
                    .FirstOrDefault()
                    ?? rows.Select(r => r.AgUseCd).FirstOrDefault(c => !string.IsNullOrEmpty(c));
                agSignalByKey[grp.Key] = (agApply, agUseCd);
            }

            var considered = imprvRows.Count;
            var promoted = 0;
            var rejectedNoSupp = 0;
            var rejectedStaleSup = 0;
            // G4 (v1.13): pre-conversion-share gate counter.
            var preConversionPromoted = 0;
            // SYNC-DOCTRINE-4: per-batch universe distribution counter.
            var universeCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            decimal imprvValSum = 0m;
            var now = DateTime.UtcNow;

            foreach (var imprv in imprvRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!suppIndex.TryGetValue((imprv.PropId, imprv.PropValYr), out var suppPtr))
                {
                    rejectedNoSupp++;
                    continue;
                }
                if (suppPtr.SupNum != imprv.SupNum)
                {
                    rejectedStaleSup++;
                    continue;
                }

                // G1 (v1.10): conversion-era marker derived from PropValYr.
                var era = ConversionEras.FromYear(imprv.PropValYr);
                if (era == ConversionEras.PreConversion2017) preConversionPromoted++;

                // SYNC-DOCTRINE-4: classify universe.
                var universe = await ClassifyUniverseAsync(
                    imprv, latestPropertyByPropId, agSignalByKey, cancellationToken).ConfigureAwait(false);
                if (!universeCounts.TryAdd(universe.UniverseCode, 1))
                    universeCounts[universe.UniverseCode]++;

                _db.TruthPacsImprvCurrents.Add(new TruthPacsImprvCurrent
                {
                    PropValYr = imprv.PropValYr,
                    SupNum = imprv.SupNum,
                    PropId = imprv.PropId,
                    ImprvId = imprv.ImprvId,
                    ImprvTypeCd = imprv.ImprvTypeCd,
                    ImprvStateCd = imprv.ImprvStateCd,
                    ImprvClassCd = imprv.ImprvClassCd,
                    ImprvHomesite = imprv.ImprvHomesite,
                    ImprvVal = imprv.ImprvVal,
                    ImprvDesc = imprv.ImprvDesc,
                    YearBuilt = imprv.YearBuilt,
                    EffectiveYearBuilt = imprv.EffectiveYearBuilt,
                    ActualYearBuilt = imprv.ActualYearBuilt,
                    SourceImprvLandedRowId = imprv.LandedRowId,
                    SourceSuppAssocLandedRowId = suppPtr.LandedRowId,
                    ImprvLoadBatchId = imprvLoadBatchId,
                    SuppAssocLoadBatchId = suppAssocLoadBatchId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    ConversionEra = era,
                    UniverseCode = universe.UniverseCode,
                    UniverseRuleId = universe.RuleId,
                    UniverseConfidence = universe.Confidence,
                    UniverseReason = universe.Reason,
                    PromotedAt = now,
                });
                promoted++;

                if (imprv.ImprvVal.HasValue) imprvValSum += imprv.ImprvVal.Value;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // G4 (v1.13): pre-conversion-share gate. Queued before the
            // remaining-gate writes so they batch into a single save.
            ConversionEraGate.AddShareGate(
                _db, batch, ConversionEraGate.Lanes.Imprv,
                promoted, preConversionPromoted);

            await WriteRemainingGatesAsync(batch, considered, promoted,
                rejectedNoSupp, rejectedStaleSup, imprvValSum,
                cancellationToken).ConfigureAwait(false);

            // SYNC-DOCTRINE-4: informational per-batch universe distribution gate.
            await WriteUniverseDistributionGateAsync(batch, universeCounts, cancellationToken)
                .ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.imprv_current promotion COMPLETED. batch={BatchId} considered={Considered} promoted={Promoted} noSupp={NoSupp} staleSup={StaleSup} valSum={VS} prior={Prior}",
                batch.LoadBatchId, considered, promoted, rejectedNoSupp, rejectedStaleSup,
                imprvValSum, priorRowsRemoved);

            return new PacsImprvCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                ImprvsConsidered = considered,
                ImprvsPromoted = promoted,
                RejectedNoSuppPointer = rejectedNoSupp,
                RejectedStaleSupNum = rejectedStaleSup,
                ImprvValSum = imprvValSum,
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
                "truth_pacs.imprv_current promotion FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsImprvCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                ImprvsConsidered = 0,
                ImprvsPromoted = 0,
                RejectedNoSuppPointer = 0,
                RejectedStaleSupNum = 0,
                ImprvValSum = 0m,
                PriorRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private static PacsImprvCurrentTruthResult Refused(Guid promotionBatchId, string detail)
        => new()
        {
            PromotionLoadBatchId = promotionBatchId,
            Status = "REFUSED",
            ImprvsConsidered = 0,
            ImprvsPromoted = 0,
            RejectedNoSuppPointer = 0,
            RejectedStaleSupNum = 0,
            ImprvValSum = 0m,
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
            GateName = "truth-pacs-imprv-source-batches-completed",
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
        decimal imprvValSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var suppRejects = rejectedNoSupp + rejectedStaleSup;

        // 2) supp-aware-join — PASS at zero, WARN otherwise.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-imprv-supp-aware-join",
            GateStage = "RAW_TO_TRUTH",
            Status = suppRejects == 0 ? "PASS" : "WARN",
            Expected = "0",
            Actual = suppRejects.ToString(CultureInfo.InvariantCulture),
            Detail = $"noSuppPointer={rejectedNoSupp} staleSupNum={rejectedStaleSup}",
            ExecutedAt = now,
        });

        // 3) promotion-coverage — full lineage on every projected row.
        var unprovenanced = await _db.TruthPacsImprvCurrents
            .Where(t => t.PromotionLoadBatchId == batch.LoadBatchId
                        && (t.SourceImprvLandedRowId == Guid.Empty
                            || t.SourceSuppAssocLandedRowId == Guid.Empty
                            || t.ImprvLoadBatchId == Guid.Empty
                            || t.SuppAssocLoadBatchId == Guid.Empty))
            .CountAsync(cancellationToken).ConfigureAwait(false);

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-imprv-promotion-coverage",
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
            GateName = "truth-pacs-imprv-aggregate",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = promoted.ToString(CultureInfo.InvariantCulture),
            Detail = $"imprvValSum={imprvValSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// SYNC-DOCTRINE-4: classify a single improvement row's universe.
    /// Looks up the latest property row for the prop_id; if missing,
    /// returns UNKNOWN with reason UniverseNotEvaluated. land_detail
    /// signals (ag_apply, ag_use_cd) and per-year property_use_cd are
    /// not consulted in this slice — they require additional joins
    /// outside the current promoter contract. Future enhancement.
    /// </summary>
    private async Task<UniverseClassification> ClassifyUniverseAsync(
        LegacyPacsRawImprv imprv,
        IReadOnlyDictionary<int, LegacyPacsRawProperty> propertyIndex,
        IReadOnlyDictionary<(int PropId, short PropValYr), (string? AgApply, string? AgUseCd)> agSignalIndex,
        CancellationToken cancellationToken)
    {
        if (!propertyIndex.TryGetValue(imprv.PropId, out var property))
        {
            return new UniverseClassification(
                UniverseCode: UniverseCodes.Unknown,
                RuleId: null,
                Confidence: "LOW",
                Reason: $"property row not landed for prop_id={imprv.PropId}; cannot classify universe",
                QuarantineReasonHint: UniverseQuarantineReasons.UniverseNotEvaluated);
        }

        var hasLegacyMarker = property.PropCreateDt.HasValue
                              && property.PropCreateDt.Value < LegacyMarkerCutoff;

        // SYNC-DOCTRINE-4-IMPL-V3: pass real ag-program signals from
        // legacy_pacs_raw.land_detail when available. NULL (no land_detail
        // rows landed for this prop_id+yr) is still possible and is
        // accepted by the V2 classifier — modern rules with wildcard
        // ag_apply guards will still match.
        agSignalIndex.TryGetValue((imprv.PropId, imprv.PropValYr), out var agSignal);

        var input = new UniverseClassifierInput(
            County: DefaultCountyTag,
            PropValYr: imprv.PropValYr,
            PropTypeCd: property.PropTypeCd,
            PropertyUseCd: null,   // future: join dbo.property_val per (prop_id, prop_val_yr, sup_num)
            AgApply: agSignal.AgApply,
            AgUseCd: agSignal.AgUseCd,
            HasLegacyMarker: hasLegacyMarker);

        return await _universeClassifier.ClassifyAsync(input, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>
    /// SYNC-DOCTRINE-4: per-batch universe distribution gate.
    /// Informational; never FAIL (the universe column itself is the
    /// signal an operator inspects).
    /// </summary>
    private async Task WriteUniverseDistributionGateAsync(
        LoadBatch batch,
        IReadOnlyDictionary<string, int> counts,
        CancellationToken cancellationToken)
    {
        var detail = counts.Count == 0
            ? "no rows promoted"
            : string.Join(" ", counts
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .Select(kv => $"{kv.Key}={kv.Value}"));

        var totalRows = counts.Values.Sum();

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "truth-pacs-imprv-universe-distribution",
            GateStage = "RAW_TO_TRUTH",
            Status = "PASS",
            Expected = "informational",
            Actual = totalRows.ToString(CultureInfo.InvariantCulture),
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
