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
using TerraFusion.Core.Sync.PacsExemption;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): truth → canonical projector for current
/// exemption facts. Resolves the parcel via existing parcel xref, retains
/// owner_id, and enforces that every projected exmpt_type_cd is backed by
/// canonical_tf.dict_exemption_type. Parcel-unresolved rows are counted +
/// gated (not projected).
/// </summary>
public sealed class PacsExemptionCanonicalProjector : IPacsExemptionCanonicalProjector
{
    private const string EntityType = "exemption";
    private const string ParcelEntityType = "parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsExemptionCanonicalProjector> _logger;

    public PacsExemptionCanonicalProjector(TerraFusionDbContext db, ILogger<PacsExemptionCanonicalProjector> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsExemptionCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId, string operatorName, CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "canonical-tf-exemption-projector",
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
                .FirstOrDefaultAsync(b => b.LoadBatchId == truthPromotionLoadBatchId, cancellationToken).ConfigureAwait(false);
            if (truthBatch is null || truthBatch.Status != "COMPLETED")
            {
                var detail = $"truth batch={truthBatch?.Status ?? "MISSING"}";
                await Gate(batch, "canonical-exemption-source-batch-completed", "FAIL", detail, cancellationToken).ConfigureAwait(false);
                batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                return new PacsExemptionCanonicalResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "REFUSED", ErrorSummary = detail };
            }
            await Gate(batch, "canonical-exemption-source-batch-completed", "PASS", "truth batch COMPLETED", cancellationToken).ConfigureAwait(false);

            var truthRows = await _db.TruthPacsExemptionCurrents
                .Where(t => t.PromotionLoadBatchId == truthPromotionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            // Idempotency: clear prior canonical + xrefs for this batch's keys.
            var keys = truthRows.Select(t => new { t.PropId, t.TaxYr, t.OwnerId, t.ExmptTypeCd }).ToHashSet();
            var allXrefs = await _db.SyncBridgeSourceXrefs.Where(x => x.TfEntityType == EntityType)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var priorXrefs = new List<SourceXref>();
            var priorIds = new HashSet<Guid>();
            foreach (var x in allXrefs)
            {
                try
                {
                    using var doc = JsonDocument.Parse(x.SourceKeyJson);
                    var r = doc.RootElement;
                    if (!r.TryGetProperty("prop_id", out var p) || !r.TryGetProperty("exmpt_tax_yr", out var y)
                        || !r.TryGetProperty("owner_id", out var o) || !r.TryGetProperty("exmpt_type_cd", out var tc)) continue;
                    var key = new { PropId = p.GetInt32(), TaxYr = (short)y.GetInt32(), OwnerId = o.GetInt64(), ExmptTypeCd = tc.GetString() ?? "" };
                    if (keys.Contains(key)) { priorXrefs.Add(x); priorIds.Add(x.TfEntityId); }
                }
                catch (JsonException) { continue; }
            }
            var priorRows = await _db.TfExemptions.Where(c => priorIds.Contains(c.TfExemptionId))
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            if (priorRows.Count > 0) _db.TfExemptions.RemoveRange(priorRows);
            if (priorXrefs.Count > 0) _db.SyncBridgeSourceXrefs.RemoveRange(priorXrefs);
            if (priorRows.Count + priorXrefs.Count > 0) await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            var parcelIndex = await BuildParcelIndexAsync(cancellationToken).ConfigureAwait(false);

            var considered = truthRows.Count;
            var projected = 0;
            var unresolved = 0;
            var dictUnbacked = 0;
            var now = DateTime.UtcNow;
            var dictCache = new Dictionary<Guid, HashSet<string>>();

            foreach (var t in truthRows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                if (!parcelIndex.TryGetValue(t.PropId, out var parcel)) { unresolved++; continue; }

                // dict-backing check (county-scoped).
                if (!dictCache.TryGetValue(parcel.CountyId, out var codes))
                {
                    codes = (await _db.Set<DictExemptionType>().Where(d => d.CountyId == parcel.CountyId)
                        .Select(d => d.ExemptionTypeCd).ToListAsync(cancellationToken).ConfigureAwait(false)).ToHashSet();
                    dictCache[parcel.CountyId] = codes;
                }
                if (!codes.Contains(t.ExmptTypeCd)) dictUnbacked++;

                var row = new TfExemption
                {
                    CountyId = parcel.CountyId,
                    TfParcelId = parcel.TfParcelId,
                    SourcePropId = t.PropId,
                    SourceOwnerId = t.OwnerId,
                    TaxYr = t.TaxYr,
                    ExmptTypeCd = t.ExmptTypeCd,
                    ExmptSubtypeCd = t.ExmptSubtypeCd,
                    ExemptionPct = t.ExemptionPct,
                    EffectiveDt = t.EffectiveDt,
                    TerminationDt = t.TerminationDt,
                    QualifyYr = t.QualifyYr,
                    OwnerTaxYr = t.OwnerTaxYr,
                    EffectiveTaxYr = t.EffectiveTaxYr,
                    SupNum = t.SupNum,
                    PromotionLoadBatchId = batch.LoadBatchId,
                    ConversionEra = t.ConversionEra,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.TfExemptions.Add(row);
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType,
                    TfEntityId = row.TfExemptionId,
                    SourceSystem = "PACS_OLTP",
                    SourceTable = "property_exemption",
                    SourceKeyJson = JsonSerializer.Serialize(new
                    {
                        prop_id = t.PropId,
                        owner_id = t.OwnerId,
                        exmpt_tax_yr = (int)t.TaxYr,
                        exmpt_type_cd = t.ExmptTypeCd,
                        sup_num = (int)t.SupNum,
                    }),
                    SourceQueryHash = string.Empty,
                    LoadBatchId = batch.LoadBatchId,
                    FirstSeenAt = now,
                    LastSeenAt = now,
                    IsActive = true,
                });
                projected++;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            await Gate(batch, "canonical-exemption-parcel-xref-coverage", "PASS",
                $"considered={considered} projected={projected} unresolvedParcel={unresolved}", cancellationToken).ConfigureAwait(false);
            await Gate(batch, "canonical-exemption-dict-backing", dictUnbacked == 0 ? "PASS" : "FAIL",
                dictUnbacked == 0 ? "every projected type is dict-backed" : $"{dictUnbacked} rows have unbacked type code", cancellationToken).ConfigureAwait(false);
            var emptyCounty = await _db.TfExemptions
                .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId && c.CountyId == Guid.Empty)
                .CountAsync(cancellationToken).ConfigureAwait(false);
            await Gate(batch, "canonical-exemption-county-isolation", emptyCounty == 0 ? "PASS" : "FAIL",
                $"emptyCounty={emptyCounty}", cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED"; batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered; batch.RowsPromoted = projected;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("canonical_tf.tf_exemption projection COMPLETED. batch={B} considered={C} projected={P} unresolved={U} dictUnbacked={D}",
                batch.LoadBatchId, considered, projected, unresolved, dictUnbacked);
            return new PacsExemptionCanonicalResult
            {
                PromotionLoadBatchId = batch.LoadBatchId, Status = "COMPLETED",
                TruthRowsConsidered = considered, ExemptionsProjected = projected,
                RowsUnresolvedParcel = unresolved, DictUnbackedTypes = dictUnbacked,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "canonical_tf.tf_exemption projection FAILED. batch={B}", batch.LoadBatchId);
            return new PacsExemptionCanonicalResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
        }
    }

    private async Task<IReadOnlyDictionary<int, ParcelLookup>> BuildParcelIndexAsync(CancellationToken ct)
    {
        var parcelXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == ParcelEntityType && x.IsActive)
            .ToListAsync(ct).ConfigureAwait(false);
        if (parcelXrefs.Count == 0) return new Dictionary<int, ParcelLookup>();
        var ids = parcelXrefs.Select(x => x.TfEntityId).ToHashSet();
        var parcels = await _db.TfParcels.Where(p => ids.Contains(p.TfParcelId))
            .ToDictionaryAsync(p => p.TfParcelId, ct).ConfigureAwait(false);
        var index = new Dictionary<int, ParcelLookup>();
        foreach (var xref in parcelXrefs)
        {
            int? propId = null;
            try
            {
                using var doc = JsonDocument.Parse(xref.SourceKeyJson);
                if (doc.RootElement.TryGetProperty("prop_id", out var el) && el.TryGetInt32(out var pid)) propId = pid;
            }
            catch (JsonException) { continue; }
            if (propId is null) continue;
            if (!parcels.TryGetValue(xref.TfEntityId, out var parcel)) continue;
            if (!index.ContainsKey(propId.Value)) index[propId.Value] = new ParcelLookup(parcel.TfParcelId, parcel.CountyId);
        }
        return index;
    }

    private async Task Gate(LoadBatch batch, string name, string status, string detail, CancellationToken ct)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId, GateName = name, GateStage = "TRUTH_TO_CANONICAL",
            Status = status, Expected = status == "PASS" ? "ok" : "review", Actual = status,
            Detail = detail, ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
