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
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsAssessment;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// ASSESSMENT-VALUE-SEAL (2026-06-07): truth → canonical projector for
/// current assessment values. Resolves the parcel via
/// <c>sync_bridge.source_xref</c> (TfEntityType="parcel"); rows whose
/// parcel cannot be resolved are counted + gated (not projected — the
/// first seal does not persist a quarantine table).
/// </summary>
public sealed class PacsAssessmentCanonicalProjector : IPacsAssessmentCanonicalProjector
{
    private const string EntityType = "assessment";
    private const string ParcelEntityType = "parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAssessmentCanonicalProjector> _logger;

    public PacsAssessmentCanonicalProjector(
        TerraFusionDbContext db,
        ILogger<PacsAssessmentCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAssessmentCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-assessment-projector",
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
            var truthBatch = await _db.SyncBridgeLoadBatches
                .FirstOrDefaultAsync(b => b.LoadBatchId == truthPromotionLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            if (truthBatch is null || truthBatch.Status != "COMPLETED")
            {
                var detail = $"truth promotion batch={truthBatch?.Status ?? "MISSING"}";
                await Gate(batch, "canonical-assessment-source-batch-completed", "FAIL", detail, cancellationToken)
                    .ConfigureAwait(false);
                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                return new PacsAssessmentCanonicalResult
                { PromotionLoadBatchId = batch.LoadBatchId, Status = "REFUSED", ErrorSummary = detail };
            }
            await Gate(batch, "canonical-assessment-source-batch-completed", "PASS",
                "truth-pacs source batch is COMPLETED", cancellationToken).ConfigureAwait(false);

            var truthRows = await _db.TruthPacsAssessmentCurrents
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // Idempotency: clear prior canonical + xrefs for this batch's keys.
            var keys = truthRows.Select(t => new { t.PropId, t.AssessmentYear }).ToHashSet();
            var allXrefs = await _db.SyncBridgeSourceXrefs
                .Where(x => x.TfEntityType == EntityType)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorXrefs = new List<SourceXref>();
            var priorIds = new HashSet<Guid>();
            foreach (var x in allXrefs)
            {
                try
                {
                    using var doc = JsonDocument.Parse(x.SourceKeyJson);
                    var root = doc.RootElement;
                    if (!root.TryGetProperty("prop_id", out var pEl) ||
                        !root.TryGetProperty("prop_val_yr", out var yEl)) continue;
                    var key = new { PropId = pEl.GetInt32(), AssessmentYear = (short)yEl.GetInt32() };
                    if (keys.Contains(key)) { priorXrefs.Add(x); priorIds.Add(x.TfEntityId); }
                }
                catch (JsonException) { continue; }
            }
            var priorRows = await _db.TfAssessments
                .Where(c => priorIds.Contains(c.TfAssessmentId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            if (priorRows.Count > 0) _db.TfAssessments.RemoveRange(priorRows);
            if (priorXrefs.Count > 0) _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorRows.Count + priorXrefs.Count > 0)
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            var parcelIndex = await BuildParcelIndexAsync(cancellationToken).ConfigureAwait(false);

            var considered = truthRows.Count;
            var projected = 0;
            var unresolved = 0;
            decimal assessedSum = 0m;
            var now = DateTime.UtcNow;

            foreach (var t in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                if (!parcelIndex.TryGetValue(t.PropId, out var parcel))
                {
                    unresolved++;
                    continue;
                }
                var row = new TfAssessment
                {
                    CountyId = parcel.CountyId,
                    TfParcelId = parcel.TfParcelId,
                    AssessmentYear = t.AssessmentYear,
                    SupNum = t.SupNum,
                    AssessedVal = t.AssessedVal,
                    AppraisedVal = t.AppraisedVal,
                    MarketVal = t.MarketVal,
                    LandHstdVal = t.LandHstdVal,
                    LandNonHstdVal = t.LandNonHstdVal,
                    ImprvHstdVal = t.ImprvHstdVal,
                    ImprvNonHstdVal = t.ImprvNonHstdVal,
                    AgUseVal = t.AgUseVal,
                    AgMarketVal = t.AgMarketVal,
                    TimberUseVal = t.TimberUseVal,
                    TimberMarketVal = t.TimberMarketVal,
                    HsCapNewVal = t.HsCapNewVal,
                    HsCapPrevVal = t.HsCapPrevVal,
                    PropertyUseCd = t.PropertyUseCd,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    ConversionEra = t.ConversionEra,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfAssessments.Add(row);
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType,
                    TfEntityId = row.TfAssessmentId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "property_val",
                    SourceKeyJson = JsonSerializer.Serialize(new
                    {
                        prop_id = t.PropId,
                        prop_val_yr = (int)t.AssessmentYear,
                        sup_num = (int)t.SupNum,
                    }),
                    SourceQueryHash = string.Empty,
                    LoadBatchId = batch.LoadBatchId,
                    FirstSeenAt = now,
                    LastSeenAt = now,
                    IsActive = true,
                });
                projected++;
                if (t.AssessedVal.HasValue) assessedSum += t.AssessedVal.Value;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await Gate(batch, "canonical-assessment-parcel-xref-coverage",
                "PASS", $"considered={considered} projected={projected} unresolved={unresolved}",
                cancellationToken).ConfigureAwait(false);
            var emptyCounty = await _db.TfAssessments
                .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId && c.CountyId == Guid.Empty)
                .CountAsync(cancellationToken).ConfigureAwait(false);
            await Gate(batch, "canonical-assessment-county-isolation",
                emptyCounty == 0 ? "PASS" : "FAIL", $"emptyCounty={emptyCounty}", cancellationToken)
                .ConfigureAwait(false);
            await Gate(batch, "canonical-assessment-aggregate", "PASS",
                $"assessedValSum={assessedSum.ToString(CultureInfo.InvariantCulture)}", cancellationToken)
                .ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "canonical_tf.tf_assessment projection COMPLETED. batch={BatchId} considered={C} projected={P} unresolved={U} assessedSum={A}",
                batch.LoadBatchId, considered, projected, unresolved, assessedSum);

            return new PacsAssessmentCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                TruthRowsConsidered = considered,
                AssessmentsProjected = projected,
                RowsUnresolved = unresolved,
                AssessedValProjected = assessedSum,
                PriorRowsRemoved = priorRows.Count,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "canonical_tf.tf_assessment projection FAILED. batch={BatchId} {Summary}",
                batch.LoadBatchId, summary);
            return new PacsAssessmentCanonicalResult
            { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
        }
    }

    private async Task<IReadOnlyDictionary<int, ParcelLookup>> BuildParcelIndexAsync(CancellationToken ct)
    {
        var parcelXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == ParcelEntityType && x.IsActive)
            .ToListAsync(ct).ConfigureAwait(false);
        if (parcelXrefs.Count == 0) return new Dictionary<int, ParcelLookup>();

        var ids = parcelXrefs.Select(x => x.TfEntityId).ToHashSet();
        var parcels = await _db.TfParcels
            .Where(p => ids.Contains(p.TfParcelId))
            .ToDictionaryAsync(p => p.TfParcelId, ct).ConfigureAwait(false);

        var index = new Dictionary<int, ParcelLookup>();
        foreach (var xref in parcelXrefs)
        {
            int? propId = null;
            try
            {
                using var doc = JsonDocument.Parse(xref.SourceKeyJson);
                if (doc.RootElement.TryGetProperty("prop_id", out var el) && el.TryGetInt32(out var pid))
                    propId = pid;
            }
            catch (JsonException) { continue; }
            if (propId is null) continue;
            if (!parcels.TryGetValue(xref.TfEntityId, out var parcel)) continue;
            if (!index.ContainsKey(propId.Value))
                index[propId.Value] = new ParcelLookup(parcel.TfParcelId, parcel.CountyId);
        }
        return index;
    }

    private async Task Gate(LoadBatch batch, string name, string status, string detail, CancellationToken ct)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = name,
            GateStage = "TRUTH_TO_CANONICAL",
            Status = status,
            Expected = status == "PASS" ? "ok" : "review",
            Actual = status,
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
