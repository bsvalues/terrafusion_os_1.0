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
using TerraFusion.Core.Sync.PacsWsdorCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice B4: truth → canonical projector for the WSDOR roll.
///
/// <list type="bullet">
///   <item><c>canonical-wsdor-source-batch-completed</c> — truth
///   batch must be COMPLETED. FAIL refuses.</item>
///   <item><c>canonical-wsdor-parcel-xref-coverage</c> —
///   informational; counts projected vs quarantined-by-parcel-miss.</item>
///   <item><c>canonical-wsdor-owner-xref-coverage</c> —
///   informational; counts quarantined-by-owner-miss.</item>
///   <item><c>canonical-wsdor-source-xref-coverage</c> — every
///   projected row has a <c>source_xref</c>. FAIL on miss.</item>
///   <item><c>canonical-wsdor-county-isolation</c> — every projected
///   row has a non-empty CountyId. FAIL on miss.</item>
/// </list>
/// </summary>
public sealed class PacsWsdorCanonicalProjector : IPacsWsdorCanonicalProjector
{
    private const string EntityType = "assessment_wsdor";
    private const string ParcelEntityType = "parcel";
    private const string OwnerEntityType = "owner";
    // E4a (v1.4): quarantine reasons live in QuarantineReasons —
    // see docs/pacs/block-c-contract-v1.4.md.

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsWsdorCanonicalProjector> _logger;

    public PacsWsdorCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsWsdorCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsWsdorCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-wsdor-projector",
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
            // Gate: truth batch must be COMPLETED.
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

                return new PacsWsdorCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthRowsConsidered = 0,
                    RowsProjected = 0,
                    RowsQuarantined = 0,
                    RejectedNoParcelXref = 0,
                    RejectedNoOwnerXref = 0,
                    RejectedBothMissing = 0,
                    PriorRowsRemoved = 0,
                    PriorQuarantineRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "truth-pacs source batch is COMPLETED", cancellationToken)
                .ConfigureAwait(false);

            // ── Idempotency: clear prior canonical + xrefs + quarantine
            //    rows produced from this truth batch. ──
            var truthRowIds = await _db.TruthPacsWashPropOwnerVals
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .Select(t => t.TruthWpovId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var truthIdSet = truthRowIds.ToHashSet();

            // Find prior canonical rows by their source xref's
            // SourceKeyJson — tedious. Simpler: use the prior
            // PromotionLoadBatchId index. But that means a different
            // promotion batch may exist for the same truth batch.
            //
            // Cleanest: walk all canonical rows that came from the
            // SAME (year, sup_num, prop_id, owner_id) tuples present
            // in the current truth batch. We have those tuples in
            // memory already.
            var truthRows = await _db.TruthPacsWashPropOwnerVals
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var keys = truthRows.Select(t => new
            {
                t.PropValYr, t.SupNum, t.PropId, t.OwnerId
            }).ToHashSet();

            // Pre-fetch all assessment-wsdor source-xrefs and match
            // by the JSON tuple. This is O(canonical_count) per run
            // but bounded by what's already in canonical for these
            // identities — small.
            var allXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == EntityType)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorXrefs = new List<SourceXref>();
            var priorCanonicalIds = new HashSet<Guid>();
            foreach (var x in allXrefs)
            {
                try
                {
                    using var doc = JsonDocument.Parse(x.SourceKeyJson);
                    var root = doc.RootElement;
                    if (!root.TryGetProperty("year", out var yEl) ||
                        !root.TryGetProperty("sup_num", out var sEl) ||
                        !root.TryGetProperty("prop_id", out var pEl) ||
                        !root.TryGetProperty("owner_id", out var oEl))
                        continue;
                    var key = new
                    {
                        PropValYr = (short)yEl.GetInt32(),
                        SupNum = (short)sEl.GetInt32(),
                        PropId = pEl.GetInt32(),
                        OwnerId = oEl.GetInt64(),
                    };
                    if (keys.Contains(key))
                    {
                        priorXrefs.Add(x);
                        priorCanonicalIds.Add(x.TfEntityId);
                    }
                }
                catch (JsonException) { continue; }
            }

            var priorCanonical = await _db.TfAssessmentWsdors
                .Where(c => priorCanonicalIds.Contains(c.TfAssessmentWsdorId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorQuarantine = await _db.LegacyTfUnprovenWashPropOwnerVals
                .Where(q => truthIdSet.Contains(q.SourceTruthWpovId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (priorCanonical.Count > 0)
                _db.TfAssessmentWsdors.RemoveRange(priorCanonical);
            if (priorXrefs.Count > 0)
                _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorQuarantine.Count > 0)
                _db.LegacyTfUnprovenWashPropOwnerVals.RemoveRange(priorQuarantine);
            if (priorCanonical.Count + priorXrefs.Count + priorQuarantine.Count > 0)
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // ── Build parcel + owner xref indices. ──
            var parcelIndex = await BuildParcelIndexAsync(cancellationToken).ConfigureAwait(false);
            var ownerIndex = await BuildOwnerIndexAsync(cancellationToken).ConfigureAwait(false);

            var considered = truthRows.Count;
            var projected = 0;
            var quarantined = 0;
            var rejectedNoParcel = 0;
            var rejectedNoOwner = 0;
            var rejectedBoth = 0;
            var now = DateTime.UtcNow;

            foreach (var truth in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var hasParcel = parcelIndex.TryGetValue(truth.PropId, out var parcelLookup);
                var hasOwner = ownerIndex.TryGetValue(truth.OwnerId, out var ownerId);

                if (!hasParcel || !hasOwner)
                {
                    string reason;
                    if (!hasParcel && !hasOwner) { rejectedBoth++; reason = QuarantineReasons.BothMissing; }
                    else if (!hasParcel) { rejectedNoParcel++; reason = QuarantineReasons.NoParcelXref; }
                    else { rejectedNoOwner++; reason = QuarantineReasons.NoOwnerXref; }

                    _db.LegacyTfUnprovenWashPropOwnerVals.Add(new LegacyTfUnprovenWashPropOwnerVal
                    {
                        PropValYr = truth.PropValYr,
                        SupNum = truth.SupNum,
                        PropId = truth.PropId,
                        OwnerId = truth.OwnerId,
                        AssessedVal = truth.AssessedVal,
                        MarketVal = truth.MarketVal,
                        BoeStatus = truth.BoeStatus,
                        SourceTruthWpovId = truth.TruthWpovId,
                        PromotionLoadBatchId = batch.LoadBatchId,
                        QuarantineReason = reason,
                        CreatedAt = now,
                    });
                    quarantined++;
                    continue;
                }

                var assessment = new TfAssessmentWsdor
                {
                    CountyId = parcelLookup!.CountyId,
                    TfParcelId = parcelLookup.TfParcelId,
                    TfOwnerId = ownerId,
                    AssessmentYear = truth.PropValYr,
                    SupNum = truth.SupNum,
                    AssessedVal = truth.AssessedVal,
                    MarketVal = truth.MarketVal,
                    AppraisedVal = truth.AppraisedVal,
                    TaxableClassified = truth.TaxableClassified,
                    TaxableNonClassified = truth.TaxableNonClassified,
                    LandTaxableClassified = truth.LandTaxableClassified,
                    LandTaxableNonClassified = truth.LandTaxableNonClassified,
                    ImprvTaxableClassified = truth.ImprvTaxableClassified,
                    ImprvTaxableNonClassified = truth.ImprvTaxableNonClassified,
                    StateValueClassified = truth.StateValueClassified,
                    StateValueNonClassified = truth.StateValueNonClassified,
                    BoeStatus = truth.BoeStatus,
                    DisasterProrationPct = truth.DisasterProrationPct,
                    SnrFrzImprvHs = truth.SnrFrzImprvHs,
                    SnrFrzLandHs = truth.SnrFrzLandHs,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfAssessmentWsdors.Add(assessment);

                var sourceKeyJson = JsonSerializer.Serialize(new
                {
                    year = (int)truth.PropValYr,
                    sup_num = (int)truth.SupNum,
                    prop_id = truth.PropId,
                    owner_id = truth.OwnerId,
                });
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType,
                    TfEntityId = assessment.TfAssessmentWsdorId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "wash_prop_owner_val",
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
                rejectedNoParcel, rejectedNoOwner, rejectedBoth,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_assessment_wsdor projection COMPLETED. batch={BatchId} considered={Considered} projected={Projected} quarantined={Quarantined} (parcel={NoP} owner={NoO} both={Both})",
                batch.LoadBatchId, considered, projected, quarantined,
                rejectedNoParcel, rejectedNoOwner, rejectedBoth);

            return new PacsWsdorCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthRowsConsidered = considered,
                RowsProjected = projected,
                RowsQuarantined = quarantined,
                RejectedNoParcelXref = rejectedNoParcel,
                RejectedNoOwnerXref = rejectedNoOwner,
                RejectedBothMissing = rejectedBoth,
                PriorRowsRemoved = priorCanonical.Count,
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
                "canonical_tf.tf_assessment_wsdor projection FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsWsdorCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthRowsConsidered = 0,
                RowsProjected = 0,
                RowsQuarantined = 0,
                RejectedNoParcelXref = 0,
                RejectedNoOwnerXref = 0,
                RejectedBothMissing = 0,
                PriorRowsRemoved = 0,
                PriorQuarantineRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    private async Task<IReadOnlyDictionary<int, ParcelLookup>> BuildParcelIndexAsync(
        CancellationToken cancellationToken)
    {
        var parcelXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == ParcelEntityType && x.IsActive)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        if (parcelXrefs.Count == 0)
            return new Dictionary<int, ParcelLookup>();

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
            catch (JsonException) { continue; }

            if (propId is null) continue;
            if (!parcels.TryGetValue(xref.TfEntityId, out var parcel)) continue;

            if (!index.ContainsKey(propId.Value))
                index[propId.Value] = new ParcelLookup(parcel.TfParcelId, parcel.CountyId);
        }
        return index;
    }

    private async Task<IReadOnlyDictionary<long, Guid>> BuildOwnerIndexAsync(
        CancellationToken cancellationToken)
    {
        // Owner xrefs from B3 carry SourceKeyJson = {"acct_id":...}.
        // PACS owner_id == acct_id in the same id space.
        var ownerXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == OwnerEntityType && x.IsActive)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var index = new Dictionary<long, Guid>();
        foreach (var xref in ownerXrefs)
        {
            try
            {
                using var doc = JsonDocument.Parse(xref.SourceKeyJson);
                if (doc.RootElement.TryGetProperty("acct_id", out var el)
                    && el.TryGetInt64(out var acctId)
                    && !index.ContainsKey(acctId))
                {
                    index[acctId] = xref.TfEntityId;
                }
            }
            catch (JsonException) { continue; }
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
            GateName = "canonical-wsdor-source-batch-completed",
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
        int considered, int projected, int quarantined,
        int rejectedNoParcel, int rejectedNoOwner, int rejectedBoth,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) parcel-xref-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-wsdor-parcel-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = projected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} projected={projected} noParcel={rejectedNoParcel} bothMissing={rejectedBoth}",
            ExecutedAt = now,
        });

        // 3) owner-xref-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-wsdor-owner-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = projected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} projected={projected} noOwner={rejectedNoOwner} bothMissing={rejectedBoth}",
            ExecutedAt = now,
        });

        // 4) source-xref-coverage — every projected row has a source_xref.
        var projectedIds = await _db.TfAssessmentWsdors
            .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(c => c.TfAssessmentWsdorId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == EntityType
                        && x.LoadBatchId == batch.LoadBatchId
                        && projectedIds.Contains(x.TfEntityId))
            .Select(x => x.TfEntityId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var coverageMissing = projectedIds.Count - xrefIds.Count;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-wsdor-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = projectedIds.Count.ToString(CultureInfo.InvariantCulture),
            Actual = xrefIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {projectedIds.Count} tf_assessment_wsdor rows have a source_xref"
                : $"{coverageMissing} tf_assessment_wsdor rows lack source_xref",
            ExecutedAt = now,
        });

        // 5) county-isolation — every projected row has non-empty CountyId.
        var emptyCountyCount = await _db.TfAssessmentWsdors
            .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId
                        && c.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-wsdor-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_assessment_wsdor has a non-empty CountyId"
                : $"{emptyCountyCount} rows have empty CountyId",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
