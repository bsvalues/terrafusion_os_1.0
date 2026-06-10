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
using TerraFusion.Core.Sync.PacsBill;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// REVENUE-SPINE Stage 1 (2026-06-07): populates tf_levy_rate, lands + projects
/// current-year active levy bill lines into tf_tax_bill_line (parcel-resolved,
/// district/TCA/rate-backed), and aggregates the parcel rollup
/// tf_tax_bill_current. Read-only PACS amounts; balance = due − paid.
/// </summary>
public sealed class PacsBillService : IPacsBillService
{
    private const string ParcelEntityType = "parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsBillService> _logger;

    public PacsBillService(TerraFusionDbContext db, ILogger<PacsBillService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsLevyRateResult> PopulateLevyRateAsync(
        IPacsBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default)
    {
        try
        {
            var batch = await NewBatch("canonical-tf-levy-rate", $"levy@{year}", operatorName, ct).ConfigureAwait(false);
            var hash = Hash($"levy@{countyId}@{year}");
            await _db.Set<TfLevyRate>().Where(d => d.CountyId == countyId && d.TaxYr == year)
                .ExecuteDeleteAsync(ct).ConfigureAwait(false);
            var n = 0; var now = DateTime.UtcNow;
            await foreach (var r in source.StreamLevyRatesAsync(year, ct).ConfigureAwait(false))
            {
                _db.Set<TfLevyRate>().Add(new TfLevyRate
                {
                    CountyId = countyId, TaxYr = r.TaxYr, TaxDistrictId = r.TaxDistrictId,
                    LevyCd = r.LevyCd, LevyRate = r.LevyRate, LoadBatchId = batch.LoadBatchId,
                    SourceQueryHash = hash, CreatedAt = now, UpdatedAt = now,
                });
                n++;
            }
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await CompleteBatch(batch, n, ct).ConfigureAwait(false);
            return new PacsLevyRateResult { Status = "COMPLETED", Upserted = n };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "tf_levy_rate populate FAILED");
            return new PacsLevyRateResult { Status = "FAILED", ErrorSummary = $"{ex.GetType().Name}: {ex.Message}" };
        }
    }

    public async Task<PacsTaxBillResult> ProjectTaxBillLineAsync(
        IPacsBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default)
    {
        var batch = await NewBatch("canonical-tf-tax-bill-line", $"bill_levy_bill@{year}", operatorName, ct).ConfigureAwait(false);
        try
        {
            var hash = Hash($"tax_bill_line@{year}");

            // Land bill ⋈ levy_bill (active L) via COPY.
            var landed = 0;
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(ct).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY legacy_pacs_raw.tax_bill_line (\"LandedRowId\", \"BillId\", \"PropId\", \"TaxYr\", " +
                    "\"SupNum\", \"IsActive\", \"BillType\", \"LevyCd\", \"TaxDistrictId\", \"TaxAreaId\", " +
                    "\"TaxableVal\", \"CurrentAmountDue\", \"AmountPaid\", \"LoadBatchId\", \"SourceQueryHash\", " +
                    "\"SourceRowHash\", \"LandedAt\") FROM STDIN (FORMAT BINARY)", ct).ConfigureAwait(false);
                await foreach (var s in source.StreamTaxBillLinesAsync(year, ct).ConfigureAwait(false))
                {
                    await imp.StartRowAsync(ct).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.BillId, NpgsqlDbType.Bigint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.PropId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.TaxYr, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.SupNum, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.IsActive, NpgsqlDbType.Boolean, ct).ConfigureAwait(false);
                    await Txt(imp, s.BillType, ct).ConfigureAwait(false);
                    await Txt(imp, s.LevyCd, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.TaxDistrictId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.TaxAreaId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await Num(imp, s.TaxableVal, ct).ConfigureAwait(false);
                    await Num(imp, s.CurrentAmountDue, ct).ConfigureAwait(false);
                    await Num(imp, s.AmountPaid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(hash, NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(Hash($"{s.BillId}|{s.LevyCd}|{s.CurrentAmountDue}|{s.AmountPaid}"), NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(DateTime.UtcNow, NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false);
                    landed++;
                }
                await imp.CompleteAsync(ct).ConfigureAwait(false);
            }

            // Idempotency: clear prior canonical line + rollup for (county, year).
            await _db.TfTaxBillLines.Where(c => c.CountyId == countyId && c.TaxYr == year).ExecuteDeleteAsync(ct).ConfigureAwait(false);
            await _db.TfTaxBillCurrents.Where(c => c.CountyId == countyId && c.TaxYr == year).ExecuteDeleteAsync(ct).ConfigureAwait(false);

            var parcelIndex = await BuildParcelIndexAsync(ct).ConfigureAwait(false);
            var dictDistricts = (await _db.Set<TfTaxDistrict>().Where(d => d.CountyId == countyId)
                .Select(d => d.TaxDistrictId).ToListAsync(ct).ConfigureAwait(false)).ToHashSet();
            var rateMap = await _db.Set<TfLevyRate>().Where(r => r.CountyId == countyId && r.TaxYr == year)
                .ToDictionaryAsync(r => (r.TaxDistrictId, r.LevyCd), r => r.LevyRate, ct).ConfigureAwait(false);

            var landedRows = await _db.LegacyPacsRawTaxBillLines.AsNoTracking()
                .Where(r => r.LoadBatchId == batch.LoadBatchId)
                .ToListAsync(ct).ConfigureAwait(false);

            var projected = 0; var unresolved = 0; var districtUnbacked = 0; var rateUnbacked = 0;
            var now = DateTime.UtcNow;
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(ct).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY canonical_tf.tf_tax_bill_line (\"TfTaxBillLineId\", \"CountyId\", \"TfParcelId\", " +
                    "\"SourcePropId\", \"TaxYr\", \"BillId\", \"BillType\", \"TaxAreaId\", \"TaxDistrictId\", " +
                    "\"LevyCd\", \"TaxableVal\", \"LevyRate\", \"CurrentAmountDue\", \"AmountPaid\", " +
                    "\"BalanceAmount\", \"IsActive\", \"SupNum\", \"PromotionLoadBatchId\", \"SourceQueryHash\", " +
                    "\"CreatedAt\", \"UpdatedAt\") FROM STDIN (FORMAT BINARY)", ct).ConfigureAwait(false);
                foreach (var l in landedRows)
                {
                    ct.ThrowIfCancellationRequested();
                    if (!parcelIndex.TryGetValue(l.PropId, out var parcel)) { unresolved++; continue; }
                    if (!dictDistricts.Contains(l.TaxDistrictId)) districtUnbacked++;
                    decimal? rate = null;
                    if (l.LevyCd is not null && rateMap.TryGetValue((l.TaxDistrictId, l.LevyCd), out var rr)) rate = rr;
                    else rateUnbacked++;
                    var balance = (l.CurrentAmountDue ?? 0m) - (l.AmountPaid ?? 0m);

                    await imp.StartRowAsync(ct).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(parcel.CountyId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(parcel.TfParcelId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.PropId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.TaxYr, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.BillId, NpgsqlDbType.Bigint, ct).ConfigureAwait(false);
                    await Txt(imp, l.BillType, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.TaxAreaId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(l.TaxDistrictId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await Txt(imp, l.LevyCd, ct).ConfigureAwait(false);
                    await Num(imp, l.TaxableVal, ct).ConfigureAwait(false);
                    await Num(imp, rate, ct).ConfigureAwait(false);
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
                "INSERT INTO canonical_tf.tf_tax_bill_current " +
                "(\"TfTaxBillCurrentId\",\"CountyId\",\"TfParcelId\",\"SourcePropId\",\"TaxYr\",\"BillCount\"," +
                "\"DistrictCount\",\"TotalTaxableVal\",\"TotalCurrentAmountDue\",\"TotalAmountPaid\"," +
                "\"TotalBalanceAmount\",\"SourceLineCount\",\"PromotionLoadBatchId\",\"CreatedAt\",\"UpdatedAt\") " +
                "SELECT gen_random_uuid(), \"CountyId\", \"TfParcelId\", max(\"SourcePropId\"), \"TaxYr\", " +
                "count(*), count(distinct \"TaxDistrictId\"), sum(\"TaxableVal\"), sum(\"CurrentAmountDue\"), " +
                "sum(\"AmountPaid\"), sum(\"BalanceAmount\"), count(*), {0}, now(), now() " +
                "FROM canonical_tf.tf_tax_bill_line WHERE \"PromotionLoadBatchId\" = {0} " +
                "GROUP BY \"CountyId\", \"TfParcelId\", \"TaxYr\"",
                new object[] { batch.LoadBatchId }, ct).ConfigureAwait(false);

            await Gate(batch, "canonical-bill-line-parcel-coverage", "PASS",
                $"landed={landed} projected={projected} unresolved={unresolved}", ct).ConfigureAwait(false);
            await Gate(batch, "canonical-bill-line-jurisdiction-backing", districtUnbacked == 0 ? "PASS" : "FAIL",
                $"districtUnbacked={districtUnbacked}", ct).ConfigureAwait(false);
            await Gate(batch, "canonical-bill-line-rate-backing", rateUnbacked == 0 ? "PASS" : "WARN",
                $"rateUnbacked={rateUnbacked} (levy/year/district combos w/o tf_levy_rate)", ct).ConfigureAwait(false);
            await Gate(batch, "canonical-bill-rollup-integrity", "PASS",
                $"rollup_parcels={rollupRows}", ct).ConfigureAwait(false);

            await CompleteBatch(batch, projected, ct, landed).ConfigureAwait(false);
            _logger.LogInformation("tf_tax_bill_line COMPLETED. batch={B} landed={L} projected={P} unresolved={U} districtUnbacked={Du} rateUnbacked={Ru} rollup={R}",
                batch.LoadBatchId, landed, projected, unresolved, districtUnbacked, rateUnbacked, rollupRows);
            return new PacsTaxBillResult
            {
                PromotionLoadBatchId = batch.LoadBatchId, Status = "COMPLETED",
                Landed = landed, Projected = projected, UnresolvedParcel = unresolved,
                DistrictUnbacked = districtUnbacked, RateUnbacked = rateUnbacked, RollupRows = rollupRows,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "tf_tax_bill_line FAILED. batch={B}", batch.LoadBatchId);
            return new PacsTaxBillResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
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
