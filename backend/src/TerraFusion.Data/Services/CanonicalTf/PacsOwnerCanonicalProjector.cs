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
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsOwnerCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice B3: truth → canonical projector for PACS owners.
///
/// <list type="bullet">
///   <item><c>canonical-owner-source-batch-completed</c> — truth
///   batch must be COMPLETED. FAIL refuses projection.</item>
///   <item><c>canonical-owner-parcel-xref-coverage</c> —
///   informational; counts links built vs quarantined.</item>
///   <item><c>canonical-owner-source-xref-coverage</c> — every
///   <c>tf_owner</c> has a <c>source_xref</c> entry. FAIL on miss.</item>
///   <item><c>canonical-owner-county-isolation</c> — every
///   <c>tf_owner.CountyId</c> is non-empty. FAIL on miss.</item>
///   <item><c>canonical-owner-pii-redaction-policy</c> — every
///   confidential <c>tf_owner</c> has redacted display +
///   nulled PII. FAIL on any leak. (Defense-in-depth.)</item>
/// </list>
///
/// <para>v1 simplifications (recorded in code):
/// <list type="bullet">
///   <item>One <c>tf_owner</c> per unique <c>acct_id</c> in the
///   truth batch. Cross-batch identity stability is a v2 concern;
///   re-projecting the same truth batch is idempotent.</item>
///   <item>CountyId comes from the FIRST resolved parcel for the
///   given acct_id within this batch. Multi-county acct_id
///   collisions are out-of-scope for v1.</item>
///   <item><c>IsPrimary</c> on the link is set when
///   <c>PctOwnership &gt;= 50</c>.</item>
/// </list>
/// </para>
/// </summary>
public sealed class PacsOwnerCanonicalProjector : IPacsOwnerCanonicalProjector
{
    private const string OwnerEntityType = "owner";
    private const string ParcelEntityType = "parcel";
    // E4a (v1.4): quarantine reasons live in QuarantineReasons —
    // see docs/pacs/block-c-contract-v1.4.md.
    private const string ConfidentialDisplayName = "[Confidential]";
    private const decimal PrimaryOwnershipThreshold = 50m;

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsOwnerCanonicalProjector> _logger;

    public PacsOwnerCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsOwnerCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsOwnerCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-owner-projector",
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
            // ── Gate: truth batch MUST be COMPLETED. ──
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

                return new PacsOwnerCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthRowsConsidered = 0,
                    OwnersProjected = 0,
                    LinksProjected = 0,
                    RowsQuarantined = 0,
                    PriorOwnersRemoved = 0,
                    PriorLinksRemoved = 0,
                    PriorQuarantineRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "truth-pacs source batch is COMPLETED", cancellationToken)
                .ConfigureAwait(false);

            // ── Idempotency: clear prior owner / xref / link / quarantine
            //    rows produced from this truth batch. ──
            var truthRowIds = await _db.TruthPacsOwnerCurrents
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .Select(t => t.TruthOwnerCurrentId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var truthIdSet = truthRowIds.ToHashSet();

            var priorLinks = await _db.TfParcelOwnerLinks
                .Where(l => truthIdSet.Contains(l.SourceTruthOwnerCurrentId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // Owners are identified by being referenced by any prior link
            // whose source truth row was in this batch.
            var priorOwnerIds = priorLinks.Select(l => l.TfOwnerId).ToHashSet();
            var priorOwners = await _db.TfOwners
                .Where(o => priorOwnerIds.Contains(o.TfOwnerId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorOwnerIdSet = priorOwners.Select(o => o.TfOwnerId).ToHashSet();

            var priorXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == OwnerEntityType
                            && priorOwnerIdSet.Contains(x.TfEntityId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorQuarantine = await _db.LegacyTfUnprovenOwnerCurrents
                .Where(q => truthIdSet.Contains(q.SourceTruthOwnerCurrentId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (priorLinks.Count > 0) _db.TfParcelOwnerLinks.RemoveRange(priorLinks);
            if (priorOwners.Count > 0) _db.TfOwners.RemoveRange(priorOwners);
            if (priorXrefs.Count > 0) _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorQuarantine.Count > 0) _db.LegacyTfUnprovenOwnerCurrents.RemoveRange(priorQuarantine);
            if (priorLinks.Count + priorOwners.Count + priorXrefs.Count + priorQuarantine.Count > 0)
            {
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            // ── Build parcel xref index: prop_id → (TfParcelId, CountyId). ──
            var parcelIndex = await BuildParcelIndexAsync(cancellationToken)
                .ConfigureAwait(false);

            // ── Walk truth rows. Group by acct_id within this run. ──
            var truthRows = await _db.TruthPacsOwnerCurrents
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var considered = truthRows.Count;
            var ownersProjected = 0;
            var linksProjected = 0;
            var quarantined = 0;

            // acct_id → TfOwner (created lazily on first encounter).
            var ownerByAcctId = new Dictionary<long, TfOwner>();
            var now = DateTime.UtcNow;

            foreach (var truth in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!parcelIndex.TryGetValue(truth.PropId, out var parcelLookup))
                {
                    _db.LegacyTfUnprovenOwnerCurrents.Add(new LegacyTfUnprovenOwnerCurrent
                    {
                        PropId = truth.PropId,
                        OwnerTaxYr = truth.OwnerTaxYr,
                        SupNum = truth.SupNum,
                        OwnerId = truth.OwnerId,
                        AcctId = truth.AcctId,
                        FileAsName = truth.FileAsName,
                        ConfidentialFlag = truth.ConfidentialFlag,
                        WebSuppression = truth.WebSuppression,
                        SourceTruthOwnerCurrentId = truth.TruthOwnerCurrentId,
                        PromotionLoadBatchId = batch.LoadBatchId,
                        QuarantineReason = QuarantineReasons.NoParcelXref,
                        CreatedAt = now,
                    });
                    quarantined++;
                    continue;
                }

                // First time we see this acct_id in this run? Create
                // the TfOwner with PII redaction applied.
                if (!ownerByAcctId.TryGetValue(truth.AcctId, out var owner))
                {
                    owner = ProjectOwner(truth, parcelLookup.CountyId, batch.LoadBatchId, now);
                    _db.TfOwners.Add(owner);
                    ownerByAcctId[truth.AcctId] = owner;

                    var sourceKeyJson = JsonSerializer.Serialize(new { acct_id = truth.AcctId });
                    _db.SyncBridgeSourceXrefs.Add(new SourceXref
                    {
                        TfEntityType = OwnerEntityType,
                        TfEntityId = owner.TfOwnerId,
                        SourceSystem = "PACS_OLTP",
                        SourceTable = "account",
                        SourceKeyJson = sourceKeyJson,
                        SourceQueryHash = string.Empty,
                        LoadBatchId = batch.LoadBatchId,
                        FirstSeenAt = now,
                        LastSeenAt = now,
                        IsActive = true,
                    });
                    ownersProjected++;
                }

                _db.TfParcelOwnerLinks.Add(new TfParcelOwnerLink
                {
                    TfParcelId = parcelLookup.TfParcelId,
                    TfOwnerId = owner.TfOwnerId,
                    OwnerTaxYr = truth.OwnerTaxYr,
                    PctOwnership = truth.PctOwnership,
                    IsPrimary = (truth.PctOwnership ?? 0m) >= PrimaryOwnershipThreshold,
                    SourceTruthOwnerCurrentId = truth.TruthOwnerCurrentId,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
                linksProjected++;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(
                batch, considered, ownersProjected, linksProjected, quarantined,
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = ownersProjected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_owner projection COMPLETED. batch={BatchId} considered={Considered} owners={Owners} links={Links} quarantined={Quarantined}",
                batch.LoadBatchId, considered, ownersProjected, linksProjected, quarantined);

            return new PacsOwnerCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthRowsConsidered = considered,
                OwnersProjected = ownersProjected,
                LinksProjected = linksProjected,
                RowsQuarantined = quarantined,
                PriorOwnersRemoved = priorOwners.Count,
                PriorLinksRemoved = priorLinks.Count,
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
                "canonical_tf.tf_owner projection FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsOwnerCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthRowsConsidered = 0,
                OwnersProjected = 0,
                LinksProjected = 0,
                RowsQuarantined = 0,
                PriorOwnersRemoved = 0,
                PriorLinksRemoved = 0,
                PriorQuarantineRowsRemoved = 0,
                ErrorSummary = summary,
            };
        }
    }

    /// <summary>
    /// Project a truth-pacs row into a TfOwner with PII redaction
    /// applied per the doctrine's confidential-flag policy.
    /// </summary>
    private static TfOwner ProjectOwner(
        TerraFusion.Core.Entities.TruthPacs.TruthPacsOwnerCurrent truth,
        Guid countyId,
        Guid promotionBatchId,
        DateTime now)
    {
        if (truth.ConfidentialFlag)
        {
            return new TfOwner
            {
                CountyId = countyId,
                AcctId = truth.AcctId,
                DisplayName = ConfidentialDisplayName,
                FirstName = null,
                LastName = null,
                BirthDt = null,
                ConfidentialFlag = true,
                WebSuppression = truth.WebSuppression,
                TypeOfOwner = truth.TypeOfOwner,
                PromotionLoadBatchId = promotionBatchId,
                // G2 (v1.11): era resolved via majority-of-truth.
                // Single contributor → verbatim copy.
                ConversionEra = ConversionEras.MajorityOfTruth(new[] { truth.ConversionEra }),
                CreatedAt = now,
                UpdatedAt = now,
            };
        }
        return new TfOwner
        {
            CountyId = countyId,
            AcctId = truth.AcctId,
            DisplayName = truth.FileAsName ?? string.Empty,
            FirstName = truth.FirstName,
            LastName = truth.LastName,
            BirthDt = truth.BirthDt,
            ConfidentialFlag = false,
            WebSuppression = truth.WebSuppression,
            TypeOfOwner = truth.TypeOfOwner,
            PromotionLoadBatchId = promotionBatchId,
            // G2 (v1.11): era resolved via majority-of-truth.
            // Single contributor → verbatim copy.
            ConversionEra = ConversionEras.MajorityOfTruth(new[] { truth.ConversionEra }),
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Mirrors S3's parcel-xref index: walks active parcel-side
    /// <c>source_xref</c> rows, parses each <c>SourceKeyJson</c>,
    /// returns a map from PACS <c>prop_id</c> to
    /// <c>(TfParcelId, CountyId)</c>.
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
                continue;
            }

            if (propId is null) continue;
            if (!parcels.TryGetValue(xref.TfEntityId, out var parcel)) continue;

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
            GateName = "canonical-owner-source-batch-completed",
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
        int ownersProjected,
        int linksProjected,
        int quarantined,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) parcel-xref-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-owner-parcel-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = linksProjected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} owners={ownersProjected} links={linksProjected} quarantined={quarantined}",
            ExecutedAt = now,
        });

        // 3) source-xref-coverage — every TfOwner has a source_xref.
        var projectedOwnerIds = await _db.TfOwners
            .Where(o => o.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(o => o.TfOwnerId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == OwnerEntityType
                        && x.LoadBatchId == batch.LoadBatchId
                        && projectedOwnerIds.Contains(x.TfEntityId))
            .Select(x => x.TfEntityId)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var coverageMissing = projectedOwnerIds.Count - xrefIds.Count;
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-owner-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = projectedOwnerIds.Count.ToString(CultureInfo.InvariantCulture),
            Actual = xrefIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {projectedOwnerIds.Count} tf_owner rows have a source_xref"
                : $"{coverageMissing} tf_owner rows lack source_xref",
            ExecutedAt = now,
        });

        // 4) county-isolation — every tf_owner has a non-empty CountyId.
        var emptyCountyCount = await _db.TfOwners
            .Where(o => o.PromotionLoadBatchId == batch.LoadBatchId
                        && o.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-owner-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_owner has a non-empty CountyId"
                : $"{emptyCountyCount} tf_owner rows have empty CountyId",
            ExecutedAt = now,
        });

        // 5) pii-redaction-policy — every confidential row is redacted.
        // Defense-in-depth: queries the persisted state, not in-memory
        // counters, so even a buggy projection drift surfaces here.
        var leaks = await _db.TfOwners
            .Where(o => o.PromotionLoadBatchId == batch.LoadBatchId
                        && o.ConfidentialFlag
                        && (o.DisplayName != ConfidentialDisplayName
                            || o.FirstName != null
                            || o.LastName != null
                            || o.BirthDt != null))
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-owner-pii-redaction-policy",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = leaks == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = leaks.ToString(CultureInfo.InvariantCulture),
            Detail = leaks == 0
                ? "every confidential tf_owner has redacted display + nulled PII"
                : $"{leaks} confidential tf_owner rows leaked PII at canonical layer",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
