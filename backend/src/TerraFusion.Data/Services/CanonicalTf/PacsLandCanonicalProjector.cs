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
using TerraFusion.Core.Sync.PacsLandCanonical;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// Slice L3: truth → canonical projector for PACS land segments.
/// Five C-* gates:
///
/// <list type="bullet">
///   <item><c>canonical-land-source-batch-completed</c> — truth
///   batch must be COMPLETED. FAIL refuses.</item>
///   <item><c>canonical-land-parcel-xref-coverage</c> —
///   informational; counts projected vs quarantined.</item>
///   <item><c>canonical-land-source-xref-coverage</c> — every
///   <c>tf_land</c> row has a <c>source_xref</c>. FAIL on miss.</item>
///   <item><c>canonical-land-county-isolation</c> — every projected
///   row has a non-empty CountyId. FAIL on miss.</item>
///   <item><c>canonical-land-aggregate</c> — informational;
///   <c>SizeAcres</c> + <c>LandSegMarketVal</c> sums of projected rows
///   for spot-checking against L2's aggregate gate.</item>
/// </list>
/// </summary>
public sealed class PacsLandCanonicalProjector : IPacsLandCanonicalProjector
{
    private const string EntityType = "land";
    private const string ParcelEntityType = "parcel";
    // E4a (v1.4): quarantine reasons live in QuarantineReasons —
    // see docs/pacs/block-c-contract-v1.4.md.

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsLandCanonicalProjector> _logger;

    public PacsLandCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsLandCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsLandCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-land-projector",
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

                return new PacsLandCanonicalResult
                {
                    PromotionLoadBatchId = batch.LoadBatchId,
                    Status = "REFUSED",
                    TruthRowsConsidered = 0,
                    LandsProjected = 0,
                    RowsQuarantined = 0,
                    SizeAcresProjected = 0m,
                    LandSegMarketValProjected = 0m,
                    PriorLandsRemoved = 0,
                    PriorQuarantineRowsRemoved = 0,
                    ErrorSummary = detail,
                };
            }
            await RecordSourceBatchGateAsync(batch, "PASS",
                "truth-pacs source batch is COMPLETED", cancellationToken).ConfigureAwait(false);

            // ── Idempotency: clear prior canonical + xrefs + quarantine
            //    rows produced from this truth batch. ──
            var truthRows = await _db.TruthPacsLandCurrents
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var truthIdSet = truthRows.Select(t => t.TruthLandId).ToHashSet();

            var keys = truthRows.Select(t => new
            {
                t.PropValYr, t.SupNum, t.PropId, t.LandSegId,
            }).ToHashSet();

            var allXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == EntityType)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            var priorXrefs = new List<SourceXref>();
            var priorLandIds = new HashSet<Guid>();
            foreach (var x in allXrefs)
            {
                try
                {
                    using var doc = JsonDocument.Parse(x.SourceKeyJson);
                    var root = doc.RootElement;
                    if (!root.TryGetProperty("prop_val_yr", out var yEl) ||
                        !root.TryGetProperty("sup_num", out var sEl) ||
                        !root.TryGetProperty("prop_id", out var pEl) ||
                        !root.TryGetProperty("land_seg_id", out var lEl))
                        continue;
                    var key = new
                    {
                        PropValYr = (short)yEl.GetInt32(),
                        SupNum = (short)sEl.GetInt32(),
                        PropId = pEl.GetInt32(),
                        LandSegId = lEl.GetInt64(),
                    };
                    if (keys.Contains(key))
                    {
                        priorXrefs.Add(x);
                        priorLandIds.Add(x.TfEntityId);
                    }
                }
                catch (JsonException) { continue; }
            }

            var priorLands = await _db.TfLands
                .Where(c => priorLandIds.Contains(c.TfLandId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorQuarantine = await _db.LegacyTfUnprovenLandCurrents
                .Where(q => truthIdSet.Contains(q.SourceTruthLandId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            if (priorLands.Count > 0) _db.TfLands.RemoveRange(priorLands);
            if (priorXrefs.Count > 0) _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorQuarantine.Count > 0) _db.LegacyTfUnprovenLandCurrents.RemoveRange(priorQuarantine);
            if (priorLands.Count + priorXrefs.Count + priorQuarantine.Count > 0)
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            // ── Build parcel xref index. ──
            var parcelIndex = await BuildParcelIndexAsync(cancellationToken)
                .ConfigureAwait(false);

            // ── Walk truth rows. ──
            var considered = truthRows.Count;
            var projected = 0;
            var quarantined = 0;
            decimal acresSum = 0m;
            decimal marketValSum = 0m;
            var now = DateTime.UtcNow;

            foreach (var truth in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!parcelIndex.TryGetValue(truth.PropId, out var parcelLookup))
                {
                    _db.LegacyTfUnprovenLandCurrents.Add(new LegacyTfUnprovenLandCurrent
                    {
                        PropValYr = truth.PropValYr,
                        SupNum = truth.SupNum,
                        PropId = truth.PropId,
                        LandSegId = truth.LandSegId,
                        LandSegTypeCd = truth.LandSegTypeCd,
                        LandSegUseCd = truth.LandSegUseCd,
                        SizeAcres = truth.SizeAcres,
                        LandSegMarketVal = truth.LandSegMarketVal,
                        SourceTruthLandId = truth.TruthLandId,
                        PromotionLoadBatchId = batch.LoadBatchId,
                        QuarantineReason = QuarantineReasons.NoParcelXref,
                        CreatedAt = now,
                    });
                    quarantined++;
                    continue;
                }

                var land = new TfLand
                {
                    CountyId = parcelLookup.CountyId,
                    TfParcelId = parcelLookup.TfParcelId,
                    LandSegTypeCd = truth.LandSegTypeCd,
                    LandSegStateCd = truth.LandSegStateCd,
                    LandSegClassCd = truth.LandSegClassCd,
                    LandSegUseCd = truth.LandSegUseCd,
                    SoilCd = truth.SoilCd,
                    IsHomesite = string.Equals(truth.LandSegHomesite, "Y", StringComparison.OrdinalIgnoreCase),
                    SizeAcres = truth.SizeAcres,
                    SizeSquareFeet = truth.SizeSquareFeet,
                    LandSegMarketVal = truth.LandSegMarketVal,
                    LandSegAgValue = truth.LandSegAgValue,
                    LandSegAssessedVal = truth.LandSegAssessedVal,
                    LandSegEffAge = truth.LandSegEffAge,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfLands.Add(land);

                var sourceKeyJson = JsonSerializer.Serialize(new
                {
                    prop_id = truth.PropId,
                    prop_val_yr = (int)truth.PropValYr,
                    sup_num = (int)truth.SupNum,
                    land_seg_id = truth.LandSegId,
                });
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType,
                    TfEntityId = land.TfLandId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "land_detail",
                    SourceKeyJson = sourceKeyJson,
                    SourceQueryHash = string.Empty,
                    LoadBatchId = batch.LoadBatchId,
                    FirstSeenAt = now,
                    LastSeenAt = now,
                    IsActive = true,
                });
                projected++;

                if (truth.SizeAcres.HasValue) acresSum += truth.SizeAcres.Value;
                if (truth.LandSegMarketVal.HasValue) marketValSum += truth.LandSegMarketVal.Value;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await WriteRemainingGatesAsync(batch, considered, projected, quarantined,
                acresSum, marketValSum, cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_land projection COMPLETED. batch={BatchId} considered={Considered} projected={Projected} quarantined={Quarantined} acresSum={Acres} marketSum={Market}",
                batch.LoadBatchId, considered, projected, quarantined, acresSum, marketValSum);

            return new PacsLandCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthRowsConsidered = considered,
                LandsProjected = projected,
                RowsQuarantined = quarantined,
                SizeAcresProjected = acresSum,
                LandSegMarketValProjected = marketValSum,
                PriorLandsRemoved = priorLands.Count,
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
                "canonical_tf.tf_land projection FAILED. batch={BatchId} summary={Summary}",
                batch.LoadBatchId, summary);

            return new PacsLandCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "FAILED",
                TruthRowsConsidered = 0,
                LandsProjected = 0,
                RowsQuarantined = 0,
                SizeAcresProjected = 0m,
                LandSegMarketValProjected = 0m,
                PriorLandsRemoved = 0,
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
            GateName = "canonical-land-source-batch-completed",
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
        decimal acresSum,
        decimal marketValSum,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 2) parcel-xref-coverage — informational PASS.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-land-parcel-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = projected.ToString(CultureInfo.InvariantCulture),
            Detail = $"considered={considered} projected={projected} quarantined={quarantined}",
            ExecutedAt = now,
        });

        // 3) source-xref-coverage — every projected tf_land has source_xref.
        var projectedIds = await _db.TfLands
            .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId)
            .Select(c => c.TfLandId)
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
            GateName = "canonical-land-source-xref-coverage",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = coverageMissing == 0 ? "PASS" : "FAIL",
            Expected = projectedIds.Count.ToString(CultureInfo.InvariantCulture),
            Actual = xrefIds.Count.ToString(CultureInfo.InvariantCulture),
            Detail = coverageMissing == 0
                ? $"all {projectedIds.Count} tf_land rows have source_xref"
                : $"{coverageMissing} tf_land rows lack source_xref",
            ExecutedAt = now,
        });

        // 4) county-isolation — every projected row has CountyId.
        var emptyCountyCount = await _db.TfLands
            .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId
                        && c.CountyId == Guid.Empty)
            .CountAsync(cancellationToken).ConfigureAwait(false);
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-land-county-isolation",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = emptyCountyCount == 0 ? "PASS" : "FAIL",
            Expected = "0",
            Actual = emptyCountyCount.ToString(CultureInfo.InvariantCulture),
            Detail = emptyCountyCount == 0
                ? "every tf_land has a non-empty CountyId"
                : $"{emptyCountyCount} rows have empty CountyId",
            ExecutedAt = now,
        });

        // 5) aggregate — informational; sums of projected rows.
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = "canonical-land-aggregate",
            GateStage = "TRUTH_TO_CANONICAL",
            Status = "PASS",
            Expected = "informational",
            Actual = projected.ToString(CultureInfo.InvariantCulture),
            Detail = $"sizeAcresSum={acresSum.ToString(CultureInfo.InvariantCulture)} " +
                     $"landSegMarketValSum={marketValSum.ToString(CultureInfo.InvariantCulture)}",
            ExecutedAt = now,
        });

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
