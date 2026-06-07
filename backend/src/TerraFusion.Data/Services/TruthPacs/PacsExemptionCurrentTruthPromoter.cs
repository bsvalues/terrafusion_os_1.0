using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsExemption;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): promotes a landed exemption batch into
/// <c>truth_pacs.exemption_current</c>. Idempotent by parcel-year natural
/// key (clear-then-COPY) — re-promoting a (PropId, TaxYr) replaces all its
/// exemption-type rows.
/// </summary>
public sealed class PacsExemptionCurrentTruthPromoter : IPacsExemptionCurrentTruthPromoter
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsExemptionCurrentTruthPromoter> _logger;

    public PacsExemptionCurrentTruthPromoter(TerraFusionDbContext db, ILogger<PacsExemptionCurrentTruthPromoter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsExemptionTruthResult> PromoteAsync(
        Guid exemptionLoadBatchId, string operatorName, CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-exemption-promoter",
            SourceFileOrDatabase = $"exemption_batch={exemptionLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var src = await _db.SyncBridgeLoadBatches.AsNoTracking()
                .FirstOrDefaultAsync(b => b.LoadBatchId == exemptionLoadBatchId, cancellationToken).ConfigureAwait(false);
            if (src is null || src.Status != "COMPLETED")
            {
                var detail = $"exemptionBatch={(src?.Status ?? "MISSING")}";
                await Gate(batch, "truth-pacs-exemption-source-batch-completed", "FAIL", detail, cancellationToken).ConfigureAwait(false);
                batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                return new PacsExemptionTruthResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "REFUSED", ErrorSummary = detail };
            }
            await Gate(batch, "truth-pacs-exemption-source-batch-completed", "PASS", "batch COMPLETED", cancellationToken).ConfigureAwait(false);

            var landed = await _db.LegacyPacsRawPropertyExemptions.AsNoTracking()
                .Where(r => r.LoadBatchId == exemptionLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var considered = landed.Count;

            var propIds = landed.Select(l => l.PropId).Distinct().ToList();
            var years = landed.Select(l => l.ExmptTaxYr).Distinct().ToList();
            var priorRemoved = 0;
            if (propIds.Count > 0)
            {
                priorRemoved = await _db.TruthPacsExemptionCurrents
                    .Where(t => propIds.Contains(t.PropId) && years.Contains(t.TaxYr))
                    .ExecuteDeleteAsync(cancellationToken).ConfigureAwait(false);
            }

            var now = DateTime.UtcNow;
            var promoted = 0;
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(cancellationToken).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY truth_pacs.exemption_current (\"TruthExemptionId\", \"PropId\", \"OwnerId\", \"TaxYr\", " +
                    "\"SupNum\", \"ExmptTypeCd\", \"ExmptSubtypeCd\", \"ExemptionPct\", \"EffectiveDt\", " +
                    "\"TerminationDt\", \"QualifyYr\", \"OwnerTaxYr\", \"EffectiveTaxYr\", " +
                    "\"SourceExemptionLandedRowId\", \"ExemptionLoadBatchId\", \"PromotionLoadBatchId\", " +
                    "\"ConversionEra\", \"PromotedAt\") FROM STDIN (FORMAT BINARY)",
                    cancellationToken).ConfigureAwait(false);

                foreach (var l in landed)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var era = ConversionEras.FromYear(l.ExmptTaxYr);
                    await imp.StartRowAsync(cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.PropId, NpgsqlDbType.Integer, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.OwnerId, NpgsqlDbType.Bigint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.ExmptTaxYr, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.SupNum, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.ExmptTypeCd, NpgsqlDbType.Varchar, cancellationToken).ConfigureAwait(false);
                    await Txt(imp, l.ExmptSubtypeCd, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.ExemptionPct, cancellationToken).ConfigureAwait(false);
                    await Ts(imp, l.EffectiveDt, cancellationToken).ConfigureAwait(false);
                    await Ts(imp, l.TerminationDt, cancellationToken).ConfigureAwait(false);
                    await Sh(imp, l.QualifyYr, cancellationToken).ConfigureAwait(false);
                    await Sh(imp, l.OwnerTaxYr, cancellationToken).ConfigureAwait(false);
                    await Sh(imp, l.EffectiveTaxYr, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.LandedRowId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(exemptionLoadBatchId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await Txt(imp, era, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(now, NpgsqlDbType.TimestampTz, cancellationToken).ConfigureAwait(false);
                    promoted++;
                }
                await imp.CompleteAsync(cancellationToken).ConfigureAwait(false);
            }

            await Gate(batch, "truth-pacs-exemption-promotion-coverage", considered == promoted ? "PASS" : "WARN",
                $"considered={considered} promoted={promoted} priorRemoved={priorRemoved}", cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED"; batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered; batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("truth_pacs.exemption_current promotion COMPLETED. batch={B} considered={C} promoted={P} prior={Pr}",
                batch.LoadBatchId, considered, promoted, priorRemoved);
            return new PacsExemptionTruthResult
            { PromotionLoadBatchId = batch.LoadBatchId, Status = "COMPLETED", Considered = considered, Promoted = promoted, PriorRowsRemoved = priorRemoved };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "truth_pacs.exemption_current promotion FAILED. batch={B}", batch.LoadBatchId);
            return new PacsExemptionTruthResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
        }
    }

    private static async Task Num(NpgsqlBinaryImporter i, decimal? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(v.Value, NpgsqlDbType.Numeric, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Txt(NpgsqlBinaryImporter i, string? v, CancellationToken ct)
    { if (v is not null) await i.WriteAsync(v, NpgsqlDbType.Varchar, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Ts(NpgsqlBinaryImporter i, DateTime? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(DateTime.SpecifyKind(v.Value, DateTimeKind.Utc), NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Sh(NpgsqlBinaryImporter i, short? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(v.Value, NpgsqlDbType.Smallint, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }

    private async Task Gate(LoadBatch batch, string name, string status, string detail, CancellationToken ct)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId, GateName = name, GateStage = "RAW_TO_TRUTH",
            Status = status, Expected = status == "PASS" ? "ok" : "review", Actual = status,
            Detail = detail, ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
