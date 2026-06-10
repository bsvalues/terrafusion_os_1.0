using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsAssessment;

namespace TerraFusion.Data.Services.TruthPacs;

/// <summary>
/// ASSESSMENT-VALUE-SEAL (2026-06-07): promotes a landed
/// active-supplement assessment-value batch into
/// <c>truth_pacs.assessment_current</c>. Idempotent by natural key
/// (PropId, AssessmentYear) — clear-then-COPY, mirroring the owner/land
/// promoters. The active supplement was already resolved at the source,
/// so the promoter simply carries the live values forward.
/// </summary>
public sealed class PacsAssessmentCurrentTruthPromoter : IPacsAssessmentCurrentTruthPromoter
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAssessmentCurrentTruthPromoter> _logger;

    public PacsAssessmentCurrentTruthPromoter(
        TerraFusionDbContext db,
        ILogger<PacsAssessmentCurrentTruthPromoter> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAssessmentCurrentTruthResult> PromoteAsync(
        Guid assessmentValueLoadBatchId,
        string operatorName,
        CancellationToken cancellationToken = default)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "truth-pacs-assessment-promoter",
            SourceFileOrDatabase = $"assessment_value_batch={assessmentValueLoadBatchId}",
            SourceQueryHash = string.Empty,
            Operator = operatorName,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            var srcBatch = await _db.SyncBridgeLoadBatches.AsNoTracking()
                .FirstOrDefaultAsync(b => b.LoadBatchId == assessmentValueLoadBatchId, cancellationToken)
                .ConfigureAwait(false);
            if (srcBatch is null || srcBatch.Status != "COMPLETED")
            {
                var detail = $"assessmentValueBatch={(srcBatch?.Status ?? "MISSING")}";
                await Gate(batch, "truth-pacs-assessment-source-batch-completed", "FAIL", detail, cancellationToken)
                    .ConfigureAwait(false);
                batch.Status = "FAILED";
                batch.CompletedAt = DateTime.UtcNow;
                batch.ErrorSummary = $"refused: {detail}";
                await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                return new PacsAssessmentCurrentTruthResult
                { PromotionLoadBatchId = batch.LoadBatchId, Status = "REFUSED", ErrorSummary = detail };
            }
            await Gate(batch, "truth-pacs-assessment-source-batch-completed", "PASS",
                "assessment-value batch COMPLETED", cancellationToken).ConfigureAwait(false);

            // Read the landed active-supplement rows for this batch.
            var landed = await _db.LegacyPacsRawPropertyVals.AsNoTracking()
                .Where(r => r.LoadBatchId == assessmentValueLoadBatchId)
                .ToListAsync(cancellationToken).ConfigureAwait(false);
            var considered = landed.Count;

            // Idempotency: clear prior truth by NATURAL KEY (PropId, AssessmentYear).
            var propIds = landed.Select(l => l.PropId).Distinct().ToList();
            var years = landed.Select(l => l.PropValYr).Distinct().ToList();
            var priorRemoved = 0;
            if (propIds.Count > 0)
            {
                priorRemoved = await _db.TruthPacsAssessmentCurrents
                    .Where(t => propIds.Contains(t.PropId) && years.Contains(t.AssessmentYear))
                    .ExecuteDeleteAsync(cancellationToken).ConfigureAwait(false);
            }

            // COPY truth rows in.
            var now = DateTime.UtcNow;
            var promoted = 0;
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(cancellationToken).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY truth_pacs.assessment_current (\"TruthAssessmentId\", \"PropId\", \"AssessmentYear\", " +
                    "\"SupNum\", \"AssessedVal\", \"AppraisedVal\", \"MarketVal\", \"LandHstdVal\", \"LandNonHstdVal\", " +
                    "\"ImprvHstdVal\", \"ImprvNonHstdVal\", \"AgUseVal\", \"AgMarketVal\", \"TimberUseVal\", " +
                    "\"TimberMarketVal\", \"HsCapNewVal\", \"HsCapPrevVal\", \"PropertyUseCd\", " +
                    "\"SourcePropertyValLandedRowId\", \"PropertyValLoadBatchId\", \"PromotionLoadBatchId\", " +
                    "\"ConversionEra\", \"PromotedAt\") FROM STDIN (FORMAT BINARY)",
                    cancellationToken).ConfigureAwait(false);

                foreach (var l in landed)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var era = ConversionEras.FromYear(l.PropValYr);
                    await imp.StartRowAsync(cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.PropId, NpgsqlDbType.Integer, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.PropValYr, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.SupNum, NpgsqlDbType.Smallint, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.AssessedVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.AppraisedVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.MarketVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.LandHstdVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.LandNonHstdVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.ImprvHstdVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.ImprvNonHstdVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.AgUseVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.AgMarketVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.TimberUseVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.TimberMarketVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.HsCapNewVal, cancellationToken).ConfigureAwait(false);
                    await Num(imp, l.HsCapPrevVal, cancellationToken).ConfigureAwait(false);
                    await Txt(imp, l.PropertyUseCd, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(l.LandedRowId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(assessmentValueLoadBatchId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, cancellationToken).ConfigureAwait(false);
                    await Txt(imp, era, cancellationToken).ConfigureAwait(false);
                    await imp.WriteAsync(now, NpgsqlDbType.TimestampTz, cancellationToken).ConfigureAwait(false);
                    promoted++;
                }
                await imp.CompleteAsync(cancellationToken).ConfigureAwait(false);
            }

            await Gate(batch, "truth-pacs-assessment-promotion-coverage",
                considered == promoted ? "PASS" : "WARN",
                $"considered={considered} promoted={promoted} priorRemoved={priorRemoved}",
                cancellationToken).ConfigureAwait(false);

            batch.Status = "COMPLETED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.RowsExtracted = considered;
            batch.RowsPromoted = promoted;
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "truth_pacs.assessment_current promotion COMPLETED. batch={BatchId} considered={C} promoted={P} prior={Prior}",
                batch.LoadBatchId, considered, promoted, priorRemoved);

            return new PacsAssessmentCurrentTruthResult
            {
                PromotionLoadBatchId = batch.LoadBatchId,
                Status = "COMPLETED",
                Considered = considered,
                Promoted = promoted,
                PriorRowsRemoved = priorRemoved,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED";
            batch.CompletedAt = DateTime.UtcNow;
            batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "truth_pacs.assessment_current promotion FAILED. batch={BatchId} {Summary}",
                batch.LoadBatchId, summary);
            return new PacsAssessmentCurrentTruthResult
            { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
        }
    }

    private static async Task Num(NpgsqlBinaryImporter imp, decimal? v, CancellationToken ct)
    {
        if (v.HasValue) await imp.WriteAsync(v.Value, NpgsqlDbType.Numeric, ct).ConfigureAwait(false);
        else await imp.WriteNullAsync(ct).ConfigureAwait(false);
    }

    private static async Task Txt(NpgsqlBinaryImporter imp, string? v, CancellationToken ct)
    {
        if (v is not null) await imp.WriteAsync(v, NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
        else await imp.WriteNullAsync(ct).ConfigureAwait(false);
    }

    private async Task Gate(LoadBatch batch, string name, string status, string detail, CancellationToken ct)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId,
            GateName = name,
            GateStage = "RAW_TO_TRUTH",
            Status = status,
            Expected = status == "PASS" ? "ok" : "review",
            Actual = status,
            Detail = detail,
            ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
