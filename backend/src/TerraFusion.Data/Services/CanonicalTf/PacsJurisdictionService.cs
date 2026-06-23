using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsJurisdiction;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): populates tf_tax_area / tf_tax_district
/// dictionaries + tf_tax_area_district (TCA→district) mapping, and projects
/// the current-year active-supplement parcel→tax-area assignment into
/// tf_parcel_tax_area (parcel resolved via the existing parcel spine xref).
/// </summary>
public sealed class PacsJurisdictionService : IPacsJurisdictionService
{
    private const string EntityType = "parcel_tax_area";
    private const string ParcelEntityType = "parcel";

    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsJurisdictionService> _logger;

    public PacsJurisdictionService(TerraFusionDbContext db, ILogger<PacsJurisdictionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsJurisdictionDictResult> PopulateTaxAreaDictAsync(
        IPacsJurisdictionSource source, Guid countyId, string operatorName, CancellationToken ct = default)
    {
        try
        {
            var batch = await NewBatch("canonical-tf-tax-area-dict", "tax_area", operatorName, ct).ConfigureAwait(false);
            var hash = Hash("tax_area@" + countyId);
            var existing = await _db.Set<TfTaxArea>().Where(d => d.CountyId == countyId)
                .ToDictionaryAsync(d => d.TaxAreaId, ct).ConfigureAwait(false);
            var n = 0; var now = DateTime.UtcNow;
            await foreach (var t in source.StreamTaxAreasAsync(ct).ConfigureAwait(false))
            {
                if (existing.TryGetValue(t.TaxAreaId, out var row))
                {
                    row.TaxAreaNumber = t.TaxAreaNumber; row.TaxAreaState = t.TaxAreaState;
                    row.TaxAreaDescription = t.TaxAreaDescription; row.InactiveAfterYear = t.InactiveAfterYear;
                    row.IsInactiveAfterYear = t.IsInactiveAfterYear; row.UpdatedAt = now; row.SourceQueryHash = hash;
                }
                else
                {
                    _db.Set<TfTaxArea>().Add(new TfTaxArea
                    {
                        CountyId = countyId, TaxAreaId = t.TaxAreaId, TaxAreaNumber = t.TaxAreaNumber,
                        TaxAreaState = t.TaxAreaState, TaxAreaDescription = t.TaxAreaDescription,
                        InactiveAfterYear = t.InactiveAfterYear, IsInactiveAfterYear = t.IsInactiveAfterYear,
                        LoadBatchId = batch.LoadBatchId, SourceQueryHash = hash, CreatedAt = now, UpdatedAt = now,
                    });
                }
                n++;
            }
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await CompleteBatch(batch, n, ct).ConfigureAwait(false);
            return new PacsJurisdictionDictResult { Status = "COMPLETED", Upserted = n };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        { return Fail<PacsJurisdictionDictResult>(ex, "tf_tax_area dict"); }
    }

    public async Task<PacsJurisdictionDictResult> PopulateTaxDistrictDictAsync(
        IPacsJurisdictionSource source, Guid countyId, string operatorName, CancellationToken ct = default)
    {
        try
        {
            var batch = await NewBatch("canonical-tf-tax-district-dict", "tax_district", operatorName, ct).ConfigureAwait(false);
            var hash = Hash("tax_district@" + countyId);
            var existing = await _db.Set<TfTaxDistrict>().Where(d => d.CountyId == countyId)
                .ToDictionaryAsync(d => d.TaxDistrictId, ct).ConfigureAwait(false);
            var n = 0; var now = DateTime.UtcNow;
            await foreach (var t in source.StreamTaxDistrictsAsync(ct).ConfigureAwait(false))
            {
                if (existing.TryGetValue(t.TaxDistrictId, out var row))
                {
                    row.TaxDistrictCd = t.TaxDistrictCd; row.TaxDistrictDesc = t.TaxDistrictDesc;
                    row.TaxDistrictTypeCd = t.TaxDistrictTypeCd; row.LocationCode = t.LocationCode;
                    row.UpdatedAt = now; row.SourceQueryHash = hash;
                }
                else
                {
                    _db.Set<TfTaxDistrict>().Add(new TfTaxDistrict
                    {
                        CountyId = countyId, TaxDistrictId = t.TaxDistrictId, TaxDistrictCd = t.TaxDistrictCd,
                        TaxDistrictDesc = t.TaxDistrictDesc, TaxDistrictTypeCd = t.TaxDistrictTypeCd,
                        LocationCode = t.LocationCode, LoadBatchId = batch.LoadBatchId, SourceQueryHash = hash,
                        CreatedAt = now, UpdatedAt = now,
                    });
                }
                n++;
            }
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await CompleteBatch(batch, n, ct).ConfigureAwait(false);
            return new PacsJurisdictionDictResult { Status = "COMPLETED", Upserted = n };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        { return Fail<PacsJurisdictionDictResult>(ex, "tf_tax_district dict"); }
    }

    public async Task<PacsJurisdictionDictResult> PopulateTaxAreaDistrictAsync(
        IPacsJurisdictionSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default)
    {
        try
        {
            var batch = await NewBatch("canonical-tf-tax-area-district", "tax_area_fund_assoc", operatorName, ct).ConfigureAwait(false);
            var hash = Hash($"tax_area_district@{countyId}@{year}");
            await _db.Set<TfTaxAreaDistrict>().Where(d => d.CountyId == countyId && d.TaxYr == year)
                .ExecuteDeleteAsync(ct).ConfigureAwait(false);
            var n = 0; var now = DateTime.UtcNow;
            await foreach (var t in source.StreamTaxAreaDistrictsAsync(year, ct).ConfigureAwait(false))
            {
                _db.Set<TfTaxAreaDistrict>().Add(new TfTaxAreaDistrict
                {
                    CountyId = countyId, TaxYr = year, TaxAreaId = t.TaxAreaId, TaxDistrictId = t.TaxDistrictId,
                    LoadBatchId = batch.LoadBatchId, SourceQueryHash = hash, CreatedAt = now, UpdatedAt = now,
                });
                n++;
            }
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            await CompleteBatch(batch, n, ct).ConfigureAwait(false);
            return new PacsJurisdictionDictResult { Status = "COMPLETED", Upserted = n };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        { return Fail<PacsJurisdictionDictResult>(ex, "tf_tax_area_district"); }
    }

    public async Task<PacsParcelTaxAreaResult> ProjectParcelTaxAreaAsync(
        IPacsJurisdictionSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default)
    {
        var batch = await NewBatch("canonical-tf-parcel-tax-area", $"property_tax_area@{year}", operatorName, ct).ConfigureAwait(false);
        try
        {
            // Land active-supp parcel→tax_area via COPY.
            var hash = Hash($"property_tax_area@{year}");
            var landed = 0;
            var connString = _db.Database.GetConnectionString();
            await using (var copyConn = new NpgsqlConnection(connString))
            {
                await copyConn.OpenAsync(ct).ConfigureAwait(false);
                await using var imp = await copyConn.BeginBinaryImportAsync(
                    "COPY legacy_pacs_raw.property_tax_area (\"LandedRowId\", \"PropId\", \"TaxYr\", \"SupNum\", " +
                    "\"TaxAreaId\", \"LoadBatchId\", \"SourceQueryHash\", \"SourceRowHash\", \"LandedAt\") FROM STDIN (FORMAT BINARY)",
                    ct).ConfigureAwait(false);
                await foreach (var s in source.StreamParcelTaxAreasAsync(year, ct).ConfigureAwait(false))
                {
                    await imp.StartRowAsync(ct).ConfigureAwait(false);
                    await imp.WriteAsync(Guid.NewGuid(), NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.PropId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.TaxYr, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.SupNum, NpgsqlDbType.Smallint, ct).ConfigureAwait(false);
                    await imp.WriteAsync(s.TaxAreaId, NpgsqlDbType.Integer, ct).ConfigureAwait(false);
                    await imp.WriteAsync(batch.LoadBatchId, NpgsqlDbType.Uuid, ct).ConfigureAwait(false);
                    await imp.WriteAsync(hash, NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(Hash($"{s.PropId}|{s.TaxYr}|{s.SupNum}|{s.TaxAreaId}"), NpgsqlDbType.Varchar, ct).ConfigureAwait(false);
                    await imp.WriteAsync(DateTime.UtcNow, NpgsqlDbType.TimestampTz, ct).ConfigureAwait(false);
                    landed++;
                }
                await imp.CompleteAsync(ct).ConfigureAwait(false);
            }

            var landedRows = await _db.LegacyPacsRawPropertyTaxAreas.AsNoTracking()
                .Where(r => r.LoadBatchId == batch.LoadBatchId)
                .ToListAsync(ct).ConfigureAwait(false);

            // Idempotency: clear prior canonical + xrefs for (county, year).
            var prior = await _db.TfParcelTaxAreas.Where(c => c.CountyId == countyId && c.TaxYr == year)
                .Select(c => c.TfParcelTaxAreaId).ToListAsync(ct).ConfigureAwait(false);
            if (prior.Count > 0)
            {
                var priorSet = prior.ToHashSet();
                var xr = await _db.SyncBridgeSourceXrefs
                    .Where(x => x.TfEntityType == EntityType && priorSet.Contains(x.TfEntityId))
                    .ToListAsync(ct).ConfigureAwait(false);
                if (xr.Count > 0) _db.SyncBridgeSourceXrefs.RemoveRange(xr);
                await _db.TfParcelTaxAreas.Where(c => c.CountyId == countyId && c.TaxYr == year)
                    .ExecuteDeleteAsync(ct).ConfigureAwait(false);
                await _db.SaveChangesAsync(ct).ConfigureAwait(false);
            }

            var parcelIndex = await BuildParcelIndexAsync(ct).ConfigureAwait(false);
            var dictTaxAreas = (await _db.Set<TfTaxArea>().Where(d => d.CountyId == countyId)
                .Select(d => d.TaxAreaId).ToListAsync(ct).ConfigureAwait(false)).ToHashSet();

            var projected = 0; var unresolved = 0; var dictUnbacked = 0; var now = DateTime.UtcNow;
            foreach (var l in landedRows)
            {
                ct.ThrowIfCancellationRequested();
                if (!parcelIndex.TryGetValue(l.PropId, out var parcel)) { unresolved++; continue; }
                if (!dictTaxAreas.Contains(l.TaxAreaId)) dictUnbacked++;
                var row = new TfParcelTaxArea
                {
                    CountyId = parcel.CountyId, TfParcelId = parcel.TfParcelId, SourcePropId = l.PropId,
                    TaxYr = l.TaxYr, TaxAreaId = l.TaxAreaId, SupNum = l.SupNum,
                    PromotionLoadBatchId = batch.LoadBatchId, CreatedAt = now, UpdatedAt = now,
                };
                _db.TfParcelTaxAreas.Add(row);
                _db.SyncBridgeSourceXrefs.Add(new SourceXref
                {
                    TfEntityType = EntityType, TfEntityId = row.TfParcelTaxAreaId, SourceSystem = "PACS_OLTP",
                    SourceTable = "property_tax_area",
                    SourceKeyJson = JsonSerializer.Serialize(new { prop_id = l.PropId, year = (int)l.TaxYr, sup_num = (int)l.SupNum, tax_area_id = l.TaxAreaId }),
                    SourceQueryHash = hash, LoadBatchId = batch.LoadBatchId, FirstSeenAt = now, LastSeenAt = now, IsActive = true,
                });
                projected++;
            }
            await _db.SaveChangesAsync(ct).ConfigureAwait(false);

            await Gate(batch, "canonical-parcel-tax-area-parcel-coverage", "PASS",
                $"landed={landed} projected={projected} unresolved={unresolved}", ct).ConfigureAwait(false);
            await Gate(batch, "canonical-parcel-tax-area-dict-backing", dictUnbacked == 0 ? "PASS" : "FAIL",
                dictUnbacked == 0 ? "every tax_area_id dict-backed" : $"{dictUnbacked} unbacked tax_area_id", ct).ConfigureAwait(false);
            var emptyCounty = await _db.TfParcelTaxAreas
                .Where(c => c.PromotionLoadBatchId == batch.LoadBatchId && c.CountyId == Guid.Empty)
                .CountAsync(ct).ConfigureAwait(false);
            await Gate(batch, "canonical-parcel-tax-area-county-isolation", emptyCounty == 0 ? "PASS" : "FAIL",
                $"emptyCounty={emptyCounty}", ct).ConfigureAwait(false);

            await CompleteBatch(batch, projected, ct, landed).ConfigureAwait(false);
            _logger.LogInformation("tf_parcel_tax_area projection COMPLETED. batch={B} landed={L} projected={P} unresolved={U} dictUnbacked={D}",
                batch.LoadBatchId, landed, projected, unresolved, dictUnbacked);
            return new PacsParcelTaxAreaResult
            {
                PromotionLoadBatchId = batch.LoadBatchId, Status = "COMPLETED",
                Landed = landed, Projected = projected, UnresolvedParcel = unresolved, DictUnbackedTaxArea = dictUnbacked,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            batch.Status = "FAILED"; batch.CompletedAt = DateTime.UtcNow; batch.ErrorSummary = summary;
            await _db.SaveChangesAsync(CancellationToken.None).ConfigureAwait(false);
            _logger.LogError(ex, "tf_parcel_tax_area projection FAILED. batch={B}", batch.LoadBatchId);
            return new PacsParcelTaxAreaResult { PromotionLoadBatchId = batch.LoadBatchId, Status = "FAILED", ErrorSummary = summary };
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
    private static string Hash(string s)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s ?? string.Empty)))[..16].ToLowerInvariant();
    private T Fail<T>(Exception ex, string what) where T : class, new()
    {
        _logger.LogError(ex, "{What} FAILED", what);
        var r = new T();
        var st = typeof(T).GetProperty("Status"); st?.SetValue(r, "FAILED");
        var es = typeof(T).GetProperty("ErrorSummary"); es?.SetValue(r, $"{ex.GetType().Name}: {ex.Message}");
        return r;
    }

    private sealed record ParcelLookup(Guid TfParcelId, Guid CountyId);
}
