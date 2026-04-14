using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

// 'Task' is ambiguous: TerraFusion.Core.Entities.Task vs System.Threading.Tasks.Task
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Services;

/// <summary>
/// Hosted service that pulls parcel geometry from the Benton County ArcGIS
/// FeatureServer and upserts it into the local <see cref="GisParcelGeometry"/> table.
///
/// ISOLATION CONTRACT:
///   - ArcGIS is NEVER queried at request time.
///   - This service is the ONLY writer to GisParcelGeometries.
///   - All GIS read paths use the local DB mirror.
///   - ArcGIS is never written to.
///
/// Initial run: pages all ~89 K parcels (2 000 records per request).
/// Subsequent runs: skips sync when source layer version hasn't changed.
/// </summary>
public sealed class ArcGisSyncService : BackgroundService
{
    // ── Benton County ArcGIS FeatureServer ──────────────────────────────
    private const string BaseUrl =
        "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services" +
        "/Parcels_and_Assess/FeatureServer/0";

    /// <summary>How often to poll ArcGIS for updates after initial seed.</summary>
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(6);

    /// <summary>Records per paging request (ArcGIS maxRecordCount = 2 000).</summary>
    private const int PageSize = 2000;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<ArcGisSyncService> _logger;

    public ArcGisSyncService(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpFactory,
        ILogger<ArcGisSyncService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpFactory  = httpFactory;
        _logger       = logger;
    }

    // ── BackgroundService entry point ────────────────────────────────────

    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ArcGisSyncService: starting — will sync Benton County parcels from ArcGIS every {Hours}h",
            CheckInterval.TotalHours);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunSyncCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ArcGisSyncService: sync cycle failed — will retry in {Hours}h",
                    CheckInterval.TotalHours);
            }

            await System.Threading.Tasks.Task.Delay(CheckInterval, stoppingToken);
        }

        _logger.LogInformation("ArcGisSyncService: stopped");
    }

    // ── Sync cycle ────────────────────────────────────────────────────────

    private async System.Threading.Tasks.Task RunSyncCycleAsync(CancellationToken ct)
    {
        var sourceVersionMs = await GetSourceVersionAsync(ct);
        if (sourceVersionMs is null)
        {
            _logger.LogWarning("ArcGisSyncService: could not read source layer version — skipping cycle");
            return;
        }

        // Check if we already have records with this version
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var existingVersion = await db.GisParcelGeometries
            .AsNoTracking()
            .MaxAsync(g => (long?)g.SourceVersionMs, ct);

        if (existingVersion.HasValue && existingVersion.Value >= sourceVersionMs.Value)
        {
            _logger.LogInformation(
                "ArcGisSyncService: DB version {Existing} >= source {Source} — skipping sync",
                existingVersion.Value, sourceVersionMs.Value);
            return;
        }

        _logger.LogInformation(
            "ArcGisSyncService: source version {Version} — beginning full page-sync",
            sourceVersionMs.Value);

        var totalUpserted = 0;
        var offset = 0;
        var http = _httpFactory.CreateClient("arcgis");

        while (true)
        {
            ct.ThrowIfCancellationRequested();

            var batch = await FetchBatchAsync(http, offset, ct);
            if (batch is null || batch.Features.Count == 0)
                break;

            await UpsertBatchAsync(db, batch.Features, sourceVersionMs.Value, ct);
            totalUpserted += batch.Features.Count;
            _logger.LogDebug("ArcGisSyncService: upserted {Total} parcels (offset {Offset}…)",
                totalUpserted, offset);

            if (batch.Features.Count < PageSize)
                break; // last page

            offset += PageSize;

            // Brief yield to avoid starving other I/O
            await System.Threading.Tasks.Task.Delay(200, ct);
        }

        _logger.LogInformation(
            "ArcGisSyncService: sync complete — {Total} parcels upserted from ArcGIS",
            totalUpserted);
    }

    // ── ArcGIS HTTP helpers ───────────────────────────────────────────────

    private async System.Threading.Tasks.Task<long?> GetSourceVersionAsync(CancellationToken ct)
    {
        try
        {
            var http = _httpFactory.CreateClient("arcgis");
            var url  = $"{BaseUrl}?f=json";
            var info = await http.GetFromJsonAsync<ArcGisLayerInfo>(url, ct);
            return info?.EditingInfo?.DataLastEditDate;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ArcGisSyncService: failed to read layer info");
            return null;
        }
    }

    private async System.Threading.Tasks.Task<ArcGisFeatureSet?> FetchBatchAsync(
        HttpClient http, int offset, CancellationToken ct)
    {
        var url = $"{BaseUrl}/query" +
                  $"?where=1%3D1" +
                  $"&outFields=OBJECTID,Parcel_ID,owner_name,legal_desc,situs_address" +
                  $",tax_code_area,neighborhood_name,neighborhood_code" +
                  $",appraised_val,LandVal,imprv_val,ag_use_val" +
                  $",legal_acres,land_sqft,year_blt,primary_use" +
                  $",exmpt_type_cd,Image,Sketch,DocNumber,Base_Corrected,geo_id" +
                  $"&returnGeometry=true" +
                  $"&returnCentroid=true" +
                  $"&outSR=4326" +
                  $"&resultOffset={offset}" +
                  $"&resultRecordCount={PageSize}" +
                  $"&f=json";

        try
        {
            var result = await http.GetFromJsonAsync<ArcGisFeatureSet>(url, ct);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ArcGisSyncService: FetchBatch failed at offset {Offset}", offset);
            return null;
        }
    }

    private async System.Threading.Tasks.Task UpsertBatchAsync(
        TerraFusionDbContext db,
        List<ArcGisFeature> features,
        long sourceVersionMs,
        CancellationToken ct)
    {
        var parcelIds = features
            .Select(f => f.Attributes?.GetString("Parcel_ID"))
            .Where(id => !string.IsNullOrEmpty(id))
            .ToHashSet(StringComparer.OrdinalIgnoreCase)!;

        var existing = await db.GisParcelGeometries
            .Where(g => parcelIds.Contains(g.ParcelId))
            .ToDictionaryAsync(g => g.ParcelId, StringComparer.OrdinalIgnoreCase, ct);

        foreach (var feature in features)
        {
            var attrs    = feature.Attributes;
            var parcelId = attrs?.GetString("Parcel_ID");
            if (string.IsNullOrEmpty(parcelId))
                continue;

            // Extract rings from ArcGIS Polygon geometry
            string? ringJson  = null;
            double? centLat   = null;
            double? centLng   = null;

            if (feature.Geometry?.Rings is { Count: > 0 } rings)
            {
                try
                {
                    ringJson = JsonSerializer.Serialize(rings[0]); // outer ring only
                }
                catch { /* non-fatal */ }
            }

            if (feature.Centroid is not null)
            {
                centLng = feature.Centroid.X;
                centLat = feature.Centroid.Y;
            }
            else if (ringJson is not null)
            {
                // Derive centroid from ring bounding box midpoint
                try
                {
                    var coords = JsonSerializer.Deserialize<List<List<double>>>(ringJson);
                    if (coords?.Count > 0)
                    {
                        centLng = coords.Average(c => c[0]);
                        centLat = coords.Average(c => c[1]);
                    }
                }
                catch { /* non-fatal */ }
            }

            if (existing.TryGetValue(parcelId, out var row))
            {
                // Update in-place
                row.CentroidLat      = centLat;
                row.CentroidLng      = centLng;
                row.RingJson         = ringJson;
                row.OwnerName        = attrs?.GetString("owner_name");
                row.LegalDescription = attrs?.GetString("legal_desc");
                row.SitusAddress     = attrs?.GetString("situs_address");
                row.TaxCodeArea      = attrs?.GetString("tax_code_area");
                row.NeighborhoodName = attrs?.GetString("neighborhood_name");
                row.NeighborhoodCode = attrs?.GetString("neighborhood_code");
                row.AppraisedValue   = attrs?.GetDouble("appraised_val");
                row.LandValue        = attrs?.GetDouble("LandVal");
                row.ImprovementValue = attrs?.GetDouble("imprv_val");
                row.AgUseValue       = attrs?.GetDouble("ag_use_val");
                row.AreaSqFt         = attrs?.GetDouble("land_sqft");
                row.AreaAcres        = attrs?.GetDouble("legal_acres");
                row.YearBuilt        = (short?)attrs?.GetInt("year_blt");
                row.PrimaryUse       = attrs?.GetString("primary_use");
                row.ExemptTypeCode   = attrs?.GetString("exmpt_type_cd");
                row.ImageUrl         = attrs?.GetString("Image");
                row.SketchUrl        = attrs?.GetString("Sketch");
                row.DocumentNumber   = attrs?.GetString("DocNumber");
                row.BaseCorrected    = attrs?.GetString("Base_Corrected");
                row.ArcGisObjectId   = attrs?.GetInt("OBJECTID");
                row.SyncedAt         = DateTime.UtcNow;
                row.SourceVersionMs  = sourceVersionMs;
            }
            else
            {
                db.GisParcelGeometries.Add(new GisParcelGeometry
                {
                    ParcelId         = parcelId,
                    CentroidLat      = centLat,
                    CentroidLng      = centLng,
                    RingJson         = ringJson,
                    OwnerName        = attrs?.GetString("owner_name"),
                    LegalDescription = attrs?.GetString("legal_desc"),
                    SitusAddress     = attrs?.GetString("situs_address"),
                    TaxCodeArea      = attrs?.GetString("tax_code_area"),
                    NeighborhoodName = attrs?.GetString("neighborhood_name"),
                    NeighborhoodCode = attrs?.GetString("neighborhood_code"),
                    AppraisedValue   = attrs?.GetDouble("appraised_val"),
                    LandValue        = attrs?.GetDouble("LandVal"),
                    ImprovementValue = attrs?.GetDouble("imprv_val"),
                    AgUseValue       = attrs?.GetDouble("ag_use_val"),
                    AreaSqFt         = attrs?.GetDouble("land_sqft"),
                    AreaAcres        = attrs?.GetDouble("legal_acres"),
                    YearBuilt        = (short?)attrs?.GetInt("year_blt"),
                    PrimaryUse       = attrs?.GetString("primary_use"),
                    ExemptTypeCode   = attrs?.GetString("exmpt_type_cd"),
                    ImageUrl         = attrs?.GetString("Image"),
                    SketchUrl        = attrs?.GetString("Sketch"),
                    DocumentNumber   = attrs?.GetString("DocNumber"),
                    BaseCorrected    = attrs?.GetString("Base_Corrected"),
                    ArcGisObjectId   = attrs?.GetInt("OBJECTID"),
                    SyncedAt         = DateTime.UtcNow,
                    SourceVersionMs  = sourceVersionMs,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    // ── ArcGIS JSON DTOs ─────────────────────────────────────────────────

    private sealed class ArcGisLayerInfo
    {
        [JsonPropertyName("editingInfo")]
        public ArcGisEditingInfo? EditingInfo { get; set; }
    }

    private sealed class ArcGisEditingInfo
    {
        [JsonPropertyName("dataLastEditDate")]
        public long DataLastEditDate { get; set; }
    }

    private sealed class ArcGisFeatureSet
    {
        [JsonPropertyName("features")]
        public List<ArcGisFeature> Features { get; set; } = new();
    }

    private sealed class ArcGisFeature
    {
        [JsonPropertyName("attributes")]
        public ArcGisAttributes? Attributes { get; set; }

        [JsonPropertyName("geometry")]
        public ArcGisPolygon? Geometry { get; set; }

        [JsonPropertyName("centroid")]
        public ArcGisPoint? Centroid { get; set; }
    }

    private sealed class ArcGisPolygon
    {
        [JsonPropertyName("rings")]
        public List<List<List<double>>>? Rings { get; set; }
    }

    private sealed class ArcGisPoint
    {
        [JsonPropertyName("x")]
        public double X { get; set; }

        [JsonPropertyName("y")]
        public double Y { get; set; }
    }

    /// <summary>
    /// Attribute bag from ArcGIS — uses <see cref="JsonExtensionData"/> to capture
    /// any field the FeatureServer returns without enumerating every property in a DTO.
    /// </summary>
    private sealed class ArcGisAttributes
    {
        [JsonExtensionData]
        public Dictionary<string, JsonElement>? Extra { get; set; }

        private bool TryGet(string key, out JsonElement el)
        {
            el = default;
            if (Extra is null) return false;
            // Try exact match first, then case-insensitive scan
            if (Extra.TryGetValue(key, out el)) return true;
            foreach (var (k, v) in Extra)
            {
                if (string.Equals(k, key, StringComparison.OrdinalIgnoreCase))
                {
                    el = v;
                    return true;
                }
            }
            return false;
        }

        public string? GetString(string key)
        {
            if (!TryGet(key, out var el)) return null;
            return el.ValueKind == JsonValueKind.String ? el.GetString() : null;
        }

        public double? GetDouble(string key)
        {
            if (!TryGet(key, out var el)) return null;
            if (el.ValueKind == JsonValueKind.Number && el.TryGetDouble(out var d)) return d;
            return null;
        }

        public int? GetInt(string key)
        {
            if (!TryGet(key, out var el)) return null;
            if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out var i)) return i;
            return null;
        }
    }
}
