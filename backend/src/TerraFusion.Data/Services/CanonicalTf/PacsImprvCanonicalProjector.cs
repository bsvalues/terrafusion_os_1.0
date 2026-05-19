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
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
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
    private const string DefaultCountyTag = "benton-wa";
    // E4a (v1.4): quarantine reasons live in QuarantineReasons —
    // see docs/pacs/block-c-contract-v1.4.md.

    private readonly TerraFusionDbContext _db;
    private readonly IPerUniverseAttributeDictionary _universeAttributeDictionary;
    private readonly ILogger<PacsImprvCanonicalProjector> _logger;

    public PacsImprvCanonicalProjector(
        TerraFusionDbContext db,
        IPerUniverseAttributeDictionary universeAttributeDictionary,
        ILogger<PacsImprvCanonicalProjector> logger)
    {
        _db = db;
        _universeAttributeDictionary = universeAttributeDictionary;
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
                    AttributesConsidered = 0,
                    AttributesResolved = 0,
                    AttributesQuarantined = 0,
                    PriorAttrQuarantineRowsRemoved = 0,
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

            // E4b (v1.5): canonical-layer imprv_attr quarantine
            // cleanup. Filter by QuarantineReason ==
            // UnknownAttribute so we never touch landing-layer
            // quarantine rows (which use UNKNOWN_I_ATTR_VAL_CD).
            var attrTruthKeys = truthRows
                .Select(t => (t.PropValYr, t.SupNum, t.PropId, t.ImprvId))
                .ToHashSet();
            var canonicalAttrQuarantineCandidates = await _db.LegacyTfUnprovenImprvAttrs
                .Where(q => q.QuarantineReason == QuarantineReasons.UnknownAttribute)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorAttrQuarantine = canonicalAttrQuarantineCandidates
                .Where(q => attrTruthKeys.Contains((q.PropValYr, q.SupNum, q.PropId, q.ImprvId)))
                .ToList();

            // 2026-05-18 atomicity fix: wrap DELETE-then-INSERT in a single
            // EF transaction so an INSERT-side failure (e.g. PACS varchar(32)
            // overflow on imprv_attr.IAttrValCd) rolls back the DELETE too.
            // Without this wrap, a single failing chunk wipes ALL prior chunks'
            // canonical work for the same truth-batch parcel set. See
            // evidence/2026-05-18-improvement-projector-regression.md.
            using var canonicalTxn = await _db.Database
                .BeginTransactionAsync(cancellationToken)
                .ConfigureAwait(false);

            if (priorFeatures.Count > 0)
                _db.TfImprovementFeatures.RemoveRange(priorFeatures);
            if (priorImprovements.Count > 0)
                _db.TfImprovements.RemoveRange(priorImprovements);
            if (priorXrefs.Count > 0)
                _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorQuarantine.Count > 0)
                _db.LegacyTfUnprovenImprvCurrents.RemoveRange(priorQuarantine);
            if (priorAttrQuarantine.Count > 0)
                _db.LegacyTfUnprovenImprvAttrs.RemoveRange(priorAttrQuarantine);
            if (priorFeatures.Count + priorImprovements.Count + priorXrefs.Count
                + priorQuarantine.Count + priorAttrQuarantine.Count > 0)
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

            // ── E4b (v1.5): pre-fetch raw imprv_attr rows that
            //    could link to truth-pacs imprvs in this batch
            //    (4-key match). The 5-key (incl. ImprvDetId) is
            //    not used for batch scoping — multiple attr rows
            //    can hang off the same parent improvement. ──
            var allRawAttrs = await _db.LegacyPacsRawImprvAttrs
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var attrsByImprv = allRawAttrs
                .Where(a => attrTruthKeys.Contains((a.PropValYr, a.SupNum, a.PropId, a.ImprvId)))
                .GroupBy(a => (a.PropValYr, a.SupNum, a.PropId, a.ImprvId))
                .ToDictionary(g => g.Key, g => g.ToList());

            // ── E4b (v1.5): pre-fetch active attribute_definition
            //    rows. (CountyId, IAttrId) is uniquely indexed per
            //    v1.2 §3.8; resolution looks up by that tuple. ──
            var allActiveDefs = await _db.AttributeDefinitions
                .Where(d => d.IsActive)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var defByCountyAndIAttrId = allActiveDefs
                .GroupBy(d => (d.CountyId, d.IAttrId))
                .ToDictionary(g => g.Key, g => g.First());

            // ── Walk truth rows. ──
            var considered = truthRows.Count;
            var improvementsProjected = 0;
            var featuresProjected = 0;
            var quarantined = 0;
            // E4b (v1.5) attribute-resolution counters.
            var attributesConsidered = 0;
            var attributesResolved = 0;
            var attributesQuarantined = 0;
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
                        QuarantineReason = QuarantineReasons.NoParcelXref,
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
                    // G2 (v1.11): era resolved via majority-of-truth.
                    // Single contributor → verbatim copy.
                    ConversionEra = ConversionEras.MajorityOfTruth(new[] { truth.ConversionEra }),
                    // SYNC-DOCTRINE-4: forward universe classification verbatim.
                    UniverseCode = truth.UniverseCode,
                    UniverseRuleId = truth.UniverseRuleId,
                    UniverseConfidence = truth.UniverseConfidence,
                    UniverseReason = truth.UniverseReason,
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
                // (v1.0 behavior — these features have AttributeId = NULL.)
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
                            // G2 (v1.11): feature inherits parent improvement's era verbatim.
                            ConversionEra = imprv.ConversionEra,
                            CreatedAt = now,
                            UpdatedAt = now,
                        });
                        featuresProjected++;
                    }
                }

                // E4b (v1.5): resolve raw imprv_attr rows against
                // canonical_tf.attribute_definition. On match: spawn
                // tf_improvement_feature with AttributeId. On miss:
                // quarantine to legacy_tf_unproven.imprv_attr with
                // QuarantineReasons.UnknownAttribute. See v1.5 §2.2.
                if (attrsByImprv.TryGetValue((truth.PropValYr, truth.SupNum, truth.PropId, truth.ImprvId),
                    out var rawAttrs))
                {
                    foreach (var attr in rawAttrs)
                    {
                        attributesConsidered++;

                        if (defByCountyAndIAttrId.TryGetValue(
                            (parcelLookup.CountyId, attr.IAttrValId), out var def))
                        {
                            // Resolved → tf_improvement_feature row
                            // with AttributeId populated. v1.5 §2.2
                            // step 3.
                            _db.TfImprovementFeatures.Add(new TfImprovementFeature
                            {
                                TfImprovementId = imprv.TfImprovementId,
                                FeatureCode = attr.IAttrValCd,
                                Value = attr.AttrValueNumeric,
                                AttributeId = def.AttributeDefinitionId,
                                // v1.5 §2.2 NB: column name says
                                // "ImprvDetail" but in the imprv_attr
                                // case it points at imprv_attr.LandedRowId.
                                SourceImprvDetailLandedRowId = attr.LandedRowId,
                                PromotionLoadBatchId = batch.LoadBatchId,
                                // G2 (v1.11): feature inherits parent improvement's era verbatim.
                                ConversionEra = imprv.ConversionEra,
                                CreatedAt = now,
                                UpdatedAt = now,
                            });
                            featuresProjected++;
                            attributesResolved++;
                        }
                        else
                        {
                            // Unresolved → canonical-layer quarantine
                            // (distinct from landing-layer quarantine
                            // which uses UNKNOWN_I_ATTR_VAL_CD). See
                            // v1.5 §2.2 step 4.
                            //
                            // SYNC-DOCTRINE-4: enrich the quarantine row
                            // with universe context so the operator can
                            // distinguish classification failure from
                            // dictionary-not-loaded from genuine
                            // unknown-code-within-known-universe.
                            var detailReason = await ResolveQuarantineReasonDetailAsync(
                                truth, attr, cancellationToken).ConfigureAwait(false);

                            _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
                            {
                                PropValYr = attr.PropValYr,
                                SupNum = attr.SupNum,
                                PropId = attr.PropId,
                                ImprvId = attr.ImprvId,
                                ImprvDetId = attr.ImprvDetId,
                                IAttrValId = attr.IAttrValId,
                                IAttrValCd = attr.IAttrValCd,
                                AttrValueText = attr.AttrValueText,
                                AttrValueNumeric = attr.AttrValueNumeric,
                                // v1.5 §2.2 NB: LandingLoadBatchId is
                                // reused for canonical-layer batch
                                // identity. Field name is a known
                                // awkwardness flagged for v1.6+ cleanup.
                                LandingLoadBatchId = batch.LoadBatchId,
                                QuarantineReason = QuarantineReasons.UnknownAttribute,
                                UniverseCode = truth.UniverseCode,
                                UniverseRuleId = truth.UniverseRuleId,
                                QuarantineReasonDetail = detailReason,
                                CreatedAt = now,
                            });
                            attributesQuarantined++;
                        }
                    }
                }
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, improvementsProjected,
                featuresProjected, quarantined,
                attributesConsidered, attributesResolved, attributesQuarantined,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = improvementsProjected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // 2026-05-18 atomicity fix: commit the DELETE+INSERT transaction
            // only on success path. On exception, the `using var canonicalTxn`
            // dispose rolls back, preserving prior chunks' canonical work.
            await canonicalTxn.CommitAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_improvement projection COMPLETED. batch={BatchId} considered={Considered} improvements={Improvements} features={Features} quarantined={Quarantined} attrConsidered={AttrConsidered} attrResolved={AttrResolved} attrQuarantined={AttrQuarantined}",
                batch.LoadBatchId, considered, improvementsProjected, featuresProjected, quarantined,
                attributesConsidered, attributesResolved, attributesQuarantined);

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
                AttributesConsidered = attributesConsidered,
                AttributesResolved = attributesResolved,
                AttributesQuarantined = attributesQuarantined,
                PriorAttrQuarantineRowsRemoved = priorAttrQuarantine.Count,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";

            // 2026-05-18 atomicity fix: when `using var canonicalTxn` disposes
            // on exception unwind, the DELETE+INSERT is rolled back. Clear the
            // EF change tracker so the FAILED status write below does not try
            // to re-apply the same projection changes that just failed; then
            // re-fetch the batch row (committed outside the rolled-back txn at
            // line 80) on a fresh implicit transaction.
            _db.ChangeTracker.Clear();

            var failedBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == batch.LoadBatchId, CancellationToken.None)
                .ConfigureAwait(false);
            if (failedBatch != null)
            {
                failedBatch.Status = "FAILED";
                failedBatch.CompletedAt = DateTime.UtcNow;
                failedBatch.ErrorSummary = summary;
                await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            }

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
                AttributesConsidered = 0,
                AttributesResolved = 0,
                AttributesQuarantined = 0,
                PriorAttrQuarantineRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    /// <summary>
    /// SYNC-DOCTRINE-4: derive a universe-aware quarantine-reason
    /// detail for an attribute that the global AttributeDefinition
    /// lookup couldn't resolve.
    ///
    /// <para>Five possible reasons (closed vocabulary in
    /// <see cref="UniverseQuarantineReasons"/>): UniverseNotEvaluated
    /// (truth row's universe is unclassified or UNKNOWN), then any of
    /// DictionaryNotLoadedForUniverse / UnknownForUniverseDictionary
    /// returned by the per-universe dictionary lookup. The
    /// LegacyClassificationUncertain reason is reserved for the
    /// classifier's hint surface and is not produced from the
    /// quarantine path.</para>
    /// </summary>
    private async Task<string> ResolveQuarantineReasonDetailAsync(
        TruthPacsImprvCurrent truth,
        LegacyPacsRawImprvAttr attr,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(truth.UniverseCode)
            || string.Equals(truth.UniverseCode, UniverseCodes.Unknown, StringComparison.OrdinalIgnoreCase))
        {
            return UniverseQuarantineReasons.UniverseNotEvaluated;
        }

        var lookup = await _universeAttributeDictionary.LookupAsync(
            DefaultCountyTag,
            truth.UniverseCode,
            truth.PropValYr,
            attr.IAttrValId.ToString(CultureInfo.InvariantCulture),
            attr.IAttrValCd,
            cancellationToken).ConfigureAwait(false);

        return lookup.QuarantineReason ?? UniverseQuarantineReasons.UnknownForUniverseDictionary;
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
        int attributesConsidered,
        int attributesResolved,
        int attributesQuarantined,
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

        // 6) E4b (v1.5): attribute-coverage — informational PASS.
        // Per v1.5 §3, this gate records resolved/considered/
        // quarantined attribute counts. It is intentionally
        // informational only; an unresolved attribute reflects
        // missing canonical_tf.attribute_definition data, not a
        // projector failure.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-imprv-attribute-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = attributesResolved.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={attributesConsidered} resolved={attributesResolved} quarantined={attributesQuarantined}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
