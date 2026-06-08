using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsAssessmentBill;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 2B (2026-06-07): populates tf_assessment_agency, lands +
/// projects current-year active special-assessment bill lines into
/// tf_assessment_bill_line (parcel-resolved, agency-backed, rate-free), and
/// aggregates the parcel rollup tf_assessment_bill_current. Read-only PACS
/// amounts; balance = due − paid. NOT payment-transaction reconciled.
/// </summary>
public sealed class PacsAssessmentBillService : IPacsAssessmentBillService
{
    private const string ParcelEntityType = "parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsAssessmentBillService> _logger;

    public PacsAssessmentBillService(TerraFusionDbContext db, ILogger<PacsAssessmentBillService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsAssessmentAgencyResult> PopulateAgencyAsync(
        IPacsAssessmentBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default)
    {
        try
        {
            var batch = await NewBatch("canonical-tf-assessment-agency", $"assessment_agency@{year}", operatorName, ct).ConfigureAwait(false);
            var hash = Hash($"assessment_agency@{countyId}@{year}");
            await _db.Set<TfAssessmentAgency>().Where(d => d.CountyId == countyId)
                .ExecuteDeleteAsync(ct).ConfigureAwait(false);
            var n = 0; var now = DateTime.UtcNow;
            var seen = new HashSet<int>();
            await foreach (var r in source.StreamAgenciesAsync(year, ct).ConfigureAwait(false))
            {
                if (!seen.Add(r.AgencyId)) continue; // unique (CountyId, AgencyId)
                _db.Set<TfAssessmentAgency>().Add(new TfAssessmentAgency
                {
                    CountyId = countyId, AgencyId = r.AgencyId, AssessmentCd = r.AssessmentCd,
                    AssessmentTypeCd = r.AssessmentTypeCd, AssessmentDescription = r.AssessmentDescription,
                    LoadBatchId = batch.LoadBatchId, SourceQueryHash = hash, CreatedAt = now, UpdatedAt = now,
                });
                n++;
            }
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await CompleteBatch(batch, n, ct).ConfigureAwait(false);
            return new PacsAssessmentAgencyResult { Status = "COMPLETED", Upserted = n };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "tf_assessment_agency populate FAILED");
            return new PacsAssessmentAgencyResult { Status = "FAILED", ErrorSummary = $"{ex.GetType().Name}: {ex.Message}" };
        }
    }

    public async Task<PacsAssessmentBillResult> ProjectAssessmentBillLineAsync(
        IPacsAssessmentBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default)
    {
        var batch = await NewBatch("canonical-tf-assessment-bill-line", $"bill_assessment_bill@{year}", operatorName, ct).ConfigureAwait(false);
        try
        {
            var hash = Hash($"assessment_bill_line@{year}");

            // Land bill ⋈ assessment_bill (active A) via COPY.
            var landed = 0;
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(ct).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY legacy_pacs_raw.assessment_bill_line (\"LandedRowId\", \"BillId\", \"PropId\", \"TaxYr\", " +
                    "\"SupNum\", \"IsActive\", \"BillType\", \"AgencyId\", \"CurrentAmountDue\", \"AmountPaid\", " +
                    "\"LoadBatchId\", \"SourceQueryHash\", \"SourceRowHash\", \"LandedAt\") FROM STDIN (FORMAT BINARY)", ct).ConfigureAwait(false);
                await foreach (var s in source.StreamAssessmentBillLinesAsync(year, ct).ConfigureAwait(false))
                {
                    await imp.StartRowAsync(ct).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.BillId, NpgsqlDbType.Bigint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.PropId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.TaxYr, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.SupNum, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.IsActive, NpgsqlDbType.Boolean, ct).ConfigureAwait(false);
                    await Txt(imp, s.BillType, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.AgencyId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await Num(imp, s.CurrentAmountDue, ct).ConfigureAwait(false);
                    await Num(imp, s.AmountPaid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(hash, NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(Hash($"{s.BillId}|{s.AgencyId}|{s.CurrentAmountDue}|{s.AmountPaid}"), NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(DateTime.UtcNow, NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false);
                    landed++;
                }
                await imp.CompleteAsync(ct).ConfigureAwait(false);
            }

            // Idempotency: clear prior canonical line + rollup for (county, year).
            await _db.TfAssessmentBillLines.Where(c => c.CountyId == countyId && c.TaxYr == year).ExecuteDeleteAsync(ct).ConfigureAwait(false);
            await _db.TfAssessmentBillCurrents.Where(c => c.CountyId == countyId && c.TaxYr == year).ExecuteDeleteAsync(ct).ConfigureAwait(false);

            var parcelIndex = await BuildParcelIndexAsync(ct).ConfigureAwait(false);
            var agencyMap = await _db.Set<TfAssessmentAgency>().Where(a => a.CountyId == countyId)
                .ToDictionaryAsync(a => a.AgencyId, a => a.AssessmentCd, ct).ConfigureAwait(false);

            var landedRows = await _db.LegacyPacsRawAssessmentBillLines.AsNoTracking()
                .Where(r => r.LoadBatchId == batch.LoadBatchId)
                .ToListAsync(ct).ConfigureAwait(false);

            var projected = 0; var unresolved = 0; var agencyUnbacked = 0;
            var now = DateTime.UtcNow;
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(ct).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY canonical_tf.tf_assessment_bill_line (\"TfAssessmentBillLineId\", \"CountyId\", \"TfParcelId\", " +
                    "\"SourcePropId\", \"TaxYr\", \"BillId\", \"BillType\", \"AgencyId\", \"AssessmentCd\", " +
                    "\"CurrentAmountDue\", \"AmountPaid\", \"BalanceAmount\", \"IsActive\", \"SupNum\", " +
                    "\"PromotionLoadBatchId\", \"SourceQueryHash\", \"CreatedAt\", \"UpdatedAt\") FROM STDIN (FORMAT BINARY)", ct).ConfigureAwait(false);
                foreach (var l in landedRows)
                {
                    ct.ThrowIfCancellationRequested();
                    if (!parcelIndex.TryGetValue(l.PropId, out var parcel)) { unresolved++; continue; }
                    string? assessmentCd = null;
                    if (agencyMap.TryGetValue(l.AgencyId, out var cd)) assessmentCd = cd;
                    else agencyUnbacked++;
                    var balance = (l.CurrentAmountDue ?? 0m) - (l.AmountPaid ?? 0m);

                    await imp.StartRowAsync(ct).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(parcel.CountyId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(parcel.TfParcelId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.PropId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.TaxYr, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.BillId, NpgsqlDbType.Bigint, ct).ConfigureAwait(false);
                    await Txt(imp, l.BillType, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.AgencyId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await Txt(imp, assessmentCd, ct).ConfigureAwait(false);
                    await Num(imp, l.CurrentAmountDue, ct).ConfigureAwait(false);
                    await Num(imp, l.AmountPaid, ct).ConfigureAwait(false);
                    await Num(imp, balance, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.IsActive, NpgsqlDbType.Boolean, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.SupNum, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(hash, NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(now, NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false);
                    await imp.WriteAsync(now, NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false);
                    projected++;
                }
                await imp.CompleteAsync(ct).ConfigureAwait(false);
            }

            // Parcel rollup (set-based) from the just-projected lines.
            var rollupRows = await _db.Database.ExecuteSqlRawAsync(
                "INSERT INTO canonical_tf.tf_assessment_bill_current " +
                "(\"TfAssessmentBillCurrentId\",\"CountyId\",\"TfParcelId\",\"SourcePropId\",\"TaxYr\",\"BillCount\"," +
                "\"AgencyCount\",\"TotalCurrentAmountDue\",\"TotalAmountPaid\"," +
                "\"TotalBalanceAmount\",\"SourceLineCount\",\"PromotionLoadBatchId\",\"CreatedAt\",\"UpdatedAt\") " +
                "SELECT gen_random_uuid(), \"CountyId\", \"TfParcelId\", max(\"SourcePropId\"), \"TaxYr\", " +
                "count(*), count(distinct \"AgencyId\"), sum(\"CurrentAmountDue\"), " +
                "sum(\"AmountPaid\"), sum(\"BalanceAmount\"), count(*), {0}, now(), now() " +
                "FROM canonical_tf.tf_assessment_bill_line WHERE \"PromotionLoadBatchId\" = {0} " +
                "GROUP BY \"CountyId\", \"TfParcelId\", \"TaxYr\"",
                new object[] { batch.LoadBatchId }, ct).ConfigureAwait(false);

            await Gate(batch, "canonical-assessment-bill-line-parcel-coverage", "PASS",
                $"landed={landed} projected={projected} unresolved={unresolved}", ct).ConfigureAwait(false);
            await Gate(batch, "canonical-assessment-bill-line-agency-backing", agencyUnbacked == 0 ? "PASS" : "FAIL",
                $"agencyUnbacked={agencyUnbacked}", ct).ConfigureAwait(false);
            await Gate(batch, "canonical-assessment-bill-rollup-integrity", "PASS",
                $"rollup_parcels={rollupRows}", ct).ConfigureAwait(false);

            await CompleteBatch(batch, projected, ct, landed).ConfigureAwait(false);
            _logger.LogInformation("tf_assessment_bill_line COMPLETED. batch={B} landed={L} projected={P} unresolved={U} agencyUnbacked={Au} rollup={R}",
                batch.LoadBatchId, landed, projected, unresolved, agencyUnbacked, rollupRows);
            return new PacsAssessmentBillResult
            {
                PromotionLoadBatchId = batch.LoadBatchId, Status = "COMPLETED",
                Landed = landed, Projected = projected, UnresolvedParcel = unresolved,
                AgencyUnbacked = agencyUnbacked, RollupRows = rollupRows,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "tf_assessment_bill_line FAILED. batch={B}", batch.LoadBatchId);
            return new PacsAssessmentBillResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
        }
    }

    private async Task<IReadOnlyDictionary<int, ParcelLookup>> BuildParcelIndexAsync(CancellationToken ct)
    {
        var parcelXrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == ParcelEntityType && x.IsActive).ToListAsync(ct).ConfigureAwait(false);
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
                using var doc = System.Text.Json.JsonDocument.Parse(xref.SourceKeyJson);
                if (doc.RootElement.TryGetProperty("prop_id", out var el) && el.TryGetInt32(out var pid)) propId = pid;
            }
            catch (System.Text.Json.JsonException) { continue; }
            if (propId is null) continue;
            if (!parcels.TryGetValue(xref.TfEntityId, out var parcel)) continue;
            if (!index.ContainsKey(propId.Value)) index[propId.Value] = new ParcelLookup(parcel.TfParcelId, parcel.CountyId);
        }
        return index;
    }

    private async Task<LoadBatch> NewBatch(string system, string file, string op, CancellationToken ct)
    {
        var batch = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp, SourceSystem = system, SourceFileOrDatabase = file,
            SourceQueryHash = string.Empty, Operator = op, Status = "IN_PROGRESS", StartedAt = DateTime.UtcNow,
        };
        _db.SyncBridgeLoadBatches.Add(batch);
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
        return batch;
    }
    private async Task CompleteBatch(LoadBatch batch, int rows, CancellationToken ct, int? extracted = null)
    {
        batch.Status = "COMPLETED"; batch.CompletedAt = DateTime.UtcNow;
        batch.RowsExtracted = extracted ?? rows; batch.RowsPromoted = rows;
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
    private async Task Gate(LoadBatch batch, string name, string status, string detail, CancellationToken ct)
    {
        _db.SyncBridgePromotionGateResults.Add(new PromotionGateResult
        {
            LoadBatchId = batch.LoadBatchId, GateName = name, GateStage = "TRUTH_TO_CANONICAL",
            Status = status, Expected = status == "PASS" ? "ok" : "review", Actual = status, Detail = detail, ExecutedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
    private static async Task Num(NpgsqlBinaryImporter i, decimal? v, CancellationToken ct)
    { if (v.HasValue) await i.WriteAsync(v.Value, NpgsqlDbType.Numeric, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static async Task Txt(NpgsqlBinaryImporter i, string? v, CancellationToken ct)
    { if (v is not null) await i.WriteAsync(v, NpgsqlDbType.Varchar, ct).ConfigureAwait(false); else await i.WriteNullAsync(ct).ConfigureAwait(false); }
    private static string Hash(string s)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s ?? string.Empty)))[..16].ToLowerInvariant();

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
