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
using TerraFusion.Core.Sync.PacsImprvCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice C3: truth → canonical projector for PACS improvements.
///
/// <list type="bullet">
///   <item><c>canonical-imprv-source-batch-completed</c> — truth
///   batch must be COMPLETED. FAIL refuses projection.</item>
///   <item><c>canonical-imprv-parcel-xref-coverage</c> —
///   informational; counts projected vs quarantined-by-parcel-miss.</item>
///   <item><c>canonical-imprv-source-xref-coverage</c> — every
///   <c>tf_improvement</c> has a <c>source_xref</c>. FAIL on miss.</item>
///   <item><c>canonical-imprv-county-isolation</c> — every projected
///   row has a non-empty CountyId. FAIL on miss.</item>
///   <item><c>canonical-imprv-feature-coverage</c> — informational;
///   counts feature rows materialized + improvements with vs
///   without features.</item>
/// </list>
///
/// <para>v1: <c>tf_improvement_feature</c> rows derive from the
/// raw <c>imprv_detail</c> table joined to truth-pacs imprv parents
/// by the 4-key. <c>imprv_attr</c> enrichment is a future C3-B
/// concern.</para>
/// </summary>
public sealed class PacsImprvCanonicalProjector : IPacsImprvCanonicalProjector
{
    private const string EntityType = "improvement";
    private const string ParcelEntityType = "parcel";
    private const string QuarantineNoParcelXref = "NO_PARCEL_XREF";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsImprvCanonicalProjector> _logger;

    public PacsImprvCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsImprvCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsImprvCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-imprv-projector",
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

                return new PacsImprvCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthRowsConsidered = 0,
                    ImprovementsProjected = 0,
                    FeaturesProjected = 0,
                    RowsQuarantined = 0,
                    PriorImprovementsRemoved = 0,
                    PriorFeaturesRemoved = 0,
                    PriorQuarantineRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "truth-pacs source batch is COMPLETED", cancellationToken).ConfigureAwait(false);

            // ── Idempotency: clear prior canonical + xrefs + features
            //    + quarantine rows produced from this truth batch. ──
            var truthRows = await _db.TruthPacsImprvCurrents
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var truthIdSet = truthRows.Select(t => t.TruthImprvId).ToHashSet();

            // Find prior xrefs by parsing JSON for our 4-tuples.
            var keys = truthRows.Select(t => new
            {
                t.PropValYr, t.SupNum, t.PropId, t.ImprvId,
            }).ToHashSet();

            var allXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == EntityType)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorXrefs = new List<SourceXref>();
            var priorImprvIds = new HashSet<Guid>();
            foreach (var x in allXrefs)
            {
                try
                {
                    using var doc = JsonDocument.Parse(x.SourceKeyJson);
                    var root = doc.RootElement;
                    if (!root.TryGetProperty("prop_val_yr", out var yEl) ||
                        !root.TryGetProperty("sup_num", out var sEl) ||
                        !root.TryGetProperty("prop_id", out var pEl) ||
                        !root.TryGetProperty("imprv_id", out var iEl))
                        continue;
                    var key = new
                    {
                        PropValYr = (short)yEl.GetInt32(),
                        SupNum = (short)sEl.GetInt32(),
                        PropId = pEl.GetInt32(),
                        ImprvId = iEl.GetInt64(),
                    };
                    if (keys.Contains(key))
                    {
                        priorXrefs.Add(x);
                        priorImprvIds.Add(x.TfEntityId);
                    }
                }
                catch (JsonException) { continue; }
            }

            var priorImprovements = await _db.TfImprovements
                .Where(c => priorImprvIds.Contains(c.TfImprovementId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorFeatures = await _db.TfImprovementFeatures
                .Where(f => priorImprvIds.Contains(f.TfImprovementId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorQuarantine = await _db.LegacyTfUnprovenImprvCurrents
                .Where(q => truthIdSet.Contains(q.SourceTruthImprvId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (priorFeatures.Count > 0)
                _db.TfImprovementFeatures.RemoveRange(priorFeatures);
            if (priorImprovements.Count > 0)
                _db.TfImprovements.RemoveRange(priorImprovements);
            if (priorXrefs.Count > 0)
                _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorQuarantine.Count > 0)
                _db.LegacyTfUnprovenImprvCurrents.RemoveRange(priorQuarantine);
            if (priorFeatures.Count + priorImprovements.Count + priorXrefs.Count + priorQuarantine.Count > 0)
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // ── Build parcel xref index. ──
            var parcelIndex = await BuildParcelIndexAsync(cancellationToken)
                .ConfigureAwait(false);

            // ── Pre-fetch all imprv_detail rows that COULD link to
            //    truth-pacs imprvs in this batch (4-key match). ──
            var truthKeys = truthRows
                .Select(t => (t.PropId, t.PropValYr, t.SupNum, t.ImprvId))
                .ToHashSet();

            var allDetails = await _db.LegacyPacsRawImprvDetails
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var detailsByKey = allDetails
                .Where(d => truthKeys.Contains((d.PropId, d.PropValYr, d.SupNum, d.ImprvId)))
                .GroupBy(d => (d.PropId, d.PropValYr, d.SupNum, d.ImprvId))
                .ToDictionary(g => g.Key, g => g.ToList());

            // ── Walk truth rows. ──
            var considered = truthRows.Count;
            var improvementsProjected = 0;
            var featuresProjected = 0;
            var quarantined = 0;
            var now = DateTime.UtcNow;

            foreach (var truth in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!parcelIndex.TryGetValue(truth.PropId, out var parcelLookup))
                {
                    _db.LegacyTfUnprovenImprvCurrents.Add(new LegacyTfUnprovenImprvCurrent
                    {
                        PropValYr = truth.PropValYr,
                        SupNum = truth.SupNum,
                        PropId = truth.PropId,
                        ImprvId = truth.ImprvId,
                        ImprvTypeCd = truth.ImprvTypeCd,
                        ImprvDesc = truth.ImprvDesc,
                        ImprvVal = truth.ImprvVal,
                        SourceTruthImprvId = truth.TruthImprvId,
                        PromotionLoadBatchId = batch.LoadBatchId,
                        QuarantineReason = QuarantineNoParcelXref,
                        CreatedAt = now,
                    });
                    quarantined++;
                    continue;
                }

                var imprv = new TfImprovement
                {
                    CountyId = parcelLookup.CountyId,
                    TfParcelId = parcelLookup.TfParcelId,
                    ImprvTypeCd = truth.ImprvTypeCd,
                    ImprvClassCd = truth.ImprvClassCd,
                    IsHomesite = string.Equals(truth.ImprvHomesite, "Y", StringComparison.OrdinalIgnoreCase),
                    ImprvVal = truth.ImprvVal,
                    ImprvDesc = truth.ImprvDesc,
                    YearBuilt = truth.YearBuilt,
                    EffectiveYearBuilt = truth.EffectiveYearBuilt,
                    ActualYearBuilt = truth.ActualYearBuilt,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfImprovements.Add(imprv);

                var sourceKeyJson = JsonSerializer.Serialize(new
                {
                    prop_id = truth.PropId,
                    prop_val_yr = (int)truth.PropValYr,
                    sup_num = (int)truth.SupNum,
                    imprv_id = truth.ImprvId,
                });
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType,
                    TfEntityId = imprv.TfImprovementId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "imprv",
                    SourceKeyJson = sourceKeyJson,
                    SourceQueryHash = string.Empty,
                    LoadBatchId = batch.LoadBatchId,
                    FirstSeenAt = now,
                    LastSeenAt = now,
                    IsActive = true,
                });
                improvementsProjected++;

                // Project secondary-feature children from raw imprv_detail.
                if (detailsByKey.TryGetValue((truth.PropId, truth.PropValYr, truth.SupNum, truth.ImprvId),
                    out var details))
                {
                    foreach (var detail in details)
                    {
                        _db.TfImprovementFeatures.Add(new TfImprovementFeature
                        {
                            TfImprovementId = imprv.TfImprovementId,
                            FeatureCode = detail.ImprvDetTypeCd ?? string.Empty,
                            MethodCd = detail.ImprvDetMethCd,
                            ClassCd = detail.ImprvDetClassCd,
                            SubClassCd = detail.ImprvDetSubClassCd,
                            ConditionCd = detail.ConditionCd,
                            Area = detail.ImprvDetArea,
                            Value = detail.ImprvDetVal,
                            NumUnits = detail.NumUnits,
                            YrBuilt = detail.YrBuilt,
                            SourceImprvDetailLandedRowId = detail.LandedRowId,
                            PromotionLoadBatchId = batch.LoadBatchId,
                            CreatedAt = now,
                            UpdatedAt = now,
                        });
                        featuresProjected++;
                    }
                }
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, improvementsProjected,
                featuresProjected, quarantined, cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = improvementsProjected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_improvement projection COMPLETED. batch={BatchId} considered={Considered} improvements={Improvements} features={Features} quarantined={Quarantined}",
                batch.LoadBatchId, considered, improvementsProjected, featuresProjected, quarantined);

            return new PacsImprvCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthRowsConsidered = considered,
                ImprovementsProjected = improvementsProjected,
                FeaturesProjected = featuresProjected,
                RowsQuarantined = quarantined,
                PriorImprovementsRemoved = priorImprovements.Count,
                PriorFeaturesRemoved = priorFeatures.Count,
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
                "canonical_tf.tf_improvement projection FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsImprvCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthRowsConsidered = 0,
                ImprovementsProjected = 0,
                FeaturesProjected = 0,
                RowsQuarantined = 0,
                PriorImprovementsRemoved = 0,
                PriorFeaturesRemoved = 0,
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

    private async Task RecordSourceBatchGateAsync(
        LoadBatch batch, string status, string detail,
        CancellationToken cancellationToken)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-imprv-source-batch-completed",
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
        int improvementsProjected,
        int featuresProjected,
        int quarantined,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) parcel-xref-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-imprv-parcel-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = improvementsProjected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} projected={improvementsProjected} quarantined={quarantined}",
            ExecutedAt = now,
        });

        // 3) source-xref-coverage — every projected tf_improvement has source_xref.
        var projectedIds = await _db.TfImprovements
            .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(c => c.TfImprovementId)
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
            GateName = "canonical-imprv-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = projectedIds.Count.ToString(CultureInfo.InvariantCulture),
            Actual = xrefIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {projectedIds.Count} tf_improvement rows have source_xref"
                : $"{coverageMissing} tf_improvement rows lack source_xref",
            ExecutedAt = now,
        });

        // 4) county-isolation — every projected row has CountyId.
        var emptyCountyCount = await _db.TfImprovements
            .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId
                        && c.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-imprv-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_improvement has a non-empty CountyId"
                : $"{emptyCountyCount} rows have empty CountyId",
            ExecutedAt = now,
        });

        // 5) feature-coverage — informational; how many improvements
        //    have feature children.
        var imprvsWithFeatures = await _db.TfImprovementFeatures
            .Where(f => f.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(f => f.TfImprovementId)
            .Distinct()
            .CountAsync(cancellationToken).ConfigureAwait(false);
        var imprvsWithoutFeatures = improvementsProjected - imprvsWithFeatures;

        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-imprv-feature-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = featuresProjected.ToString(CultureInfo.InvariantCulture),
            Detail = $"features={featuresProjected} improvementsWithFeatures={imprvsWithFeatures} improvementsWithoutFeatures={imprvsWithoutFeatures}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
