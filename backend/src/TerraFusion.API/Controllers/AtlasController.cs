using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraAtlas — Parcel geometry, spatial queries, and layer endpoints.
/// Write-lane: atlas. County isolation enforced on all queries.
/// R2.10: Real GIS geometry storage with Haversine spatial queries.
/// </summary>
[ApiController]
[Route("api/atlas")]
[Authorize]
public class AtlasController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<AtlasController> _logger;

    public AtlasController(TerraFusionDbContext db, ILogger<AtlasController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── County Isolation Helper ──────────────────────────────────────

    private async Task<Guid?> ResolveCountyIdAsync()
    {
        var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
        if (!string.IsNullOrWhiteSpace(countyIdClaim) && Guid.TryParse(countyIdClaim, out var directCountyId))
            return directCountyId;

        var countyCodeClaim = User.FindFirst("countyCode")?.Value?.Trim();
        var nameCandidates = BuildCountyNameCandidates(countyIdClaim, countyCodeClaim);
        var fipsCandidates = BuildFipsCandidates(countyIdClaim, countyCodeClaim);

        IQueryable<County> countyQuery = _db.Counties.AsNoTracking();

        if (nameCandidates.Length > 0 && fipsCandidates.Length > 0)
        {
            countyQuery = countyQuery.Where(c =>
                nameCandidates.Contains(c.Name) ||
                (c.FipsCode != null && fipsCandidates.Contains(c.FipsCode)));
        }
        else if (nameCandidates.Length > 0)
        {
            countyQuery = countyQuery.Where(c => nameCandidates.Contains(c.Name));
        }
        else if (fipsCandidates.Length > 0)
        {
            countyQuery = countyQuery.Where(c => c.FipsCode != null && fipsCandidates.Contains(c.FipsCode));
        }
        else
        {
            return null;
        }

        return await countyQuery
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync();
    }

    private static string[] BuildCountyNameCandidates(params string?[] claims)
    {
        var candidates = new HashSet<string>(StringComparer.Ordinal);
        foreach (var claim in claims)
        {
            if (string.IsNullOrWhiteSpace(claim))
                continue;

            var trimmed = claim.Trim();
            AddCandidate(candidates, trimmed);

            var withoutSuffix = StripCountySuffix(trimmed);
            AddCandidate(candidates, withoutSuffix);

            var titleCase = ToTitleCaseWords(withoutSuffix);
            AddCandidate(candidates, titleCase);
            AddCandidate(candidates, $"{titleCase} County");
        }

        return candidates.ToArray();
    }

    private static string[] BuildFipsCandidates(params string?[] claims)
    {
        var candidates = new HashSet<string>(StringComparer.Ordinal);
        foreach (var claim in claims)
        {
            if (string.IsNullOrWhiteSpace(claim))
                continue;

            var trimmed = claim.Trim();
            AddCandidate(candidates, trimmed);

            var digitsOnly = new string(trimmed.Where(char.IsDigit).ToArray());
            AddCandidate(candidates, digitsOnly);
        }

        return candidates.ToArray();
    }

    private static string StripCountySuffix(string value)
    {
        return value.EndsWith(" County", StringComparison.OrdinalIgnoreCase)
            ? value[..^7].TrimEnd()
            : value;
    }

    private static string ToTitleCaseWords(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var words = value
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => word.Length == 1
                ? char.ToUpperInvariant(word[0]).ToString()
                : $"{char.ToUpperInvariant(word[0])}{word[1..].ToLowerInvariant()}");

        return string.Join(' ', words);
    }

    private static void AddCandidate(HashSet<string> candidates, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            candidates.Add(value.Trim());
    }

    // ── Validation ───────────────────────────────────────────────────

    private static readonly string[] DefaultLayers = ["boundary", "zoning", "flood", "aerial", "parcels"];
    private static readonly Regex ParcelIdPattern = new("^[A-Za-z0-9._-]{1,50}$", RegexOptions.Compiled);

    private static bool IsValidParcelId(string parcelId)
    {
        return !string.IsNullOrWhiteSpace(parcelId) && ParcelIdPattern.IsMatch(parcelId);
    }

    // ── Haversine Distance (SQLite-compatible spatial query) ─────────

    /// <summary>
    /// Haversine distance in miles between two WGS84 lat/lng points.
    /// Used for spatial proximity queries without PostGIS.
    /// </summary>
    private static double HaversineDistanceMiles(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 3958.8; // Earth radius in miles
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    // ── GET /api/atlas/parcels/{parcelId} ────────────────────────────

    /// <summary>
    /// Return parcel geometry, centroid, area, and zoning.
    /// R2.10: Returns real GeoJSON geometry when stored in ParcelGeometries table.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetParcelGeometry(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        _logger.LogDebug("Atlas geometry request for parcel {ParcelId} in county {CountyId}", parcelId, countyId);

        var property = await _db.Properties
            .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
            .Select(p => new
            {
                p.ParcelId,
                p.Address,
                p.PropertyType,
                p.CountyId,
            })
            .FirstOrDefaultAsync();

        if (property is null)
            return NotFound(new { error = "Parcel not found" });

        // R2.10: Look up real geometry from ParcelGeometries table
        var geometry = await _db.ParcelGeometries
            .AsNoTracking()
            .Where(g => g.ParcelId == parcelId && g.CountyId == countyId.Value)
            .Select(g => new
            {
                g.GeoJson,
                g.CentroidLat,
                g.CentroidLng,
                g.AreaSqft,
                g.AreaAcres,
                g.ZoningCode,
                g.ZoningDescription,
                g.Srid,
                g.Source,
                g.SourceDate,
            })
            .FirstOrDefaultAsync();

        var hasGeometry = geometry?.GeoJson != null;

        return Ok(new
        {
            parcelId = property.ParcelId,
            address = property.Address,
            propertyType = property.PropertyType,
            geometry = geometry?.GeoJson,
            centroid = geometry?.CentroidLat != null && geometry?.CentroidLng != null
                ? new { lat = geometry.CentroidLat, lng = geometry.CentroidLng }
                : null,
            areaSqft = geometry?.AreaSqft,
            areaAcres = geometry?.AreaAcres,
            zoning = geometry?.ZoningCode,
            zoningDescription = geometry?.ZoningDescription,
            srid = geometry?.Srid ?? 4326,
            geometrySource = geometry?.Source,
            geometryDate = geometry?.SourceDate,
            geometryAvailable = hasGeometry,
            layers = DefaultLayers,
        });
    }

    // ── GET /api/atlas/parcels/{parcelId}/centroid ────────────────────
    // R2.10: Quick centroid lookup for map pin placement

    /// <summary>
    /// Return centroid coordinates for a parcel.
    /// Lightweight endpoint for map pin placement without full geometry.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}/centroid")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetParcelCentroid(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        var centroid = await _db.ParcelGeometries
            .AsNoTracking()
            .Where(g => g.ParcelId == parcelId && g.CountyId == countyId.Value)
            .Select(g => new { g.CentroidLat, g.CentroidLng })
            .FirstOrDefaultAsync();

        if (centroid is null || centroid.CentroidLat is null || centroid.CentroidLng is null)
            return NotFound(new { error = "Centroid not available for this parcel" });

        return Ok(new
        {
            parcelId,
            lat = centroid.CentroidLat,
            lng = centroid.CentroidLng,
        });
    }

    // ── GET /api/atlas/parcels/{parcelId}/layers ─────────────────────

    /// <summary>
    /// Return available layer list for a parcel.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}/layers")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetParcelLayers(string parcelId)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        _logger.LogDebug("Atlas layers request for parcel {ParcelId} in county {CountyId}", parcelId, countyId);

        var exists = await _db.Properties
            .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

        if (!exists)
            return NotFound(new { error = "Parcel not found" });

        return Ok(new
        {
            parcelId,
            layers = DefaultLayers.Select(l => new
            {
                id = l,
                name = l switch
                {
                    "boundary" => "Parcel Boundary",
                    "zoning" => "Zoning Districts",
                    "flood" => "FEMA Flood Zones",
                    "aerial" => "Aerial Imagery (2025)",
                    "parcels" => "All Parcels",
                    _ => l,
                },
                available = true,
            }),
        });
    }

    // ── GET /api/atlas/parcels/{parcelId}/nearby ──────────────────────
    // R2.10: Upgraded with Haversine spatial proximity when geometry available

    /// <summary>
    /// Return nearby parcels in the same county.
    /// R2.10: Uses Haversine distance when centroids are available;
    /// falls back to parcel-ID prefix heuristic otherwise.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}/nearby")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetNearbyParcels(
        string parcelId,
        [FromQuery] string? propertyType = null,
        [FromQuery] int limit = 10,
        [FromQuery] double radiusMiles = 1.0)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        limit = Math.Clamp(limit, 1, 50);
        radiusMiles = Math.Clamp(radiusMiles, 0.1, 25.0);

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        _logger.LogDebug("Atlas nearby request for parcel {ParcelId} in county {CountyId}", parcelId, countyId);

        var subject = await _db.Properties
            .AsNoTracking()
            .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
            .Select(p => new { p.ParcelId, p.PropertyType, p.Address })
            .FirstOrDefaultAsync();

        if (subject is null)
            return NotFound(new { error = "Parcel not found" });

        // R3.0: Try spatial proximity — PostGIS ST_DWithin or Haversine fallback
        var subjectGeometry = await _db.ParcelGeometries
            .AsNoTracking()
            .Where(g => g.ParcelId == parcelId && g.CountyId == countyId.Value
                        && g.CentroidLat != null && g.CentroidLng != null)
            .Select(g => new { g.CentroidLat, g.CentroidLng })
            .FirstOrDefaultAsync();

        var effectiveType = propertyType ?? subject.PropertyType;
        var usingSpatial = subjectGeometry != null;
        var spatialEngine = _db.IsPostgres() ? "postgis" : "haversine";

        if (usingSpatial)
        {
            var subLat = subjectGeometry!.CentroidLat!.Value;
            var subLng = subjectGeometry.CentroidLng!.Value;

            // R3.0: Provider-aware spatial query (PostGIS ST_DWithin or Haversine)
            var nearbyParcelIds = await _db.FindNearbyParcelsAsync(
                countyId.Value, parcelId, subLat, subLng, radiusMiles);

            // Join with property data
            var nearbyIds = nearbyParcelIds.Select(n => n.ParcelId).ToHashSet();
            var distanceLookup = nearbyParcelIds.ToDictionary(n => n.ParcelId, n => n.DistanceMiles);

            var propertiesQuery = _db.Properties
                .AsNoTracking()
                .Where(p => p.CountyId == countyId.Value && nearbyIds.Contains(p.ParcelId));

            if (!string.IsNullOrWhiteSpace(effectiveType))
                propertiesQuery = propertiesQuery.Where(p => p.PropertyType == effectiveType);

            var properties = await propertiesQuery
                .Select(p => new
                {
                    p.ParcelId,
                    p.Address,
                    p.PropertyType,
                    p.AssessedValue,
                    p.YearBuilt,
                })
                .ToListAsync();

            var spatialResults = properties
                .Select(p => new
                {
                    parcelId = p.ParcelId,
                    address = p.Address,
                    propertyType = p.PropertyType,
                    assessedValue = p.AssessedValue,
                    yearBuilt = p.YearBuilt,
                    distanceMiles = Math.Round(distanceLookup.GetValueOrDefault(p.ParcelId), 3),
                })
                .OrderBy(p => p.distanceMiles)
                .Take(limit)
                .ToList();

            return Ok(new
            {
                subjectParcelId = parcelId,
                propertyTypeFilter = effectiveType,
                total = spatialResults.Count,
                gisProximity = true,
                spatialEngine,
                radiusMiles,
                parcels = spatialResults,
            });
        }

        // Fallback: prefix-based heuristic (no geometry available)
        var prefix = parcelId.Length >= 4 ? parcelId[..4] : parcelId;

        var query = _db.Properties
            .AsNoTracking()
            .Where(p => p.CountyId == countyId.Value && p.ParcelId != parcelId);

        if (!string.IsNullOrWhiteSpace(effectiveType))
            query = query.Where(p => p.PropertyType == effectiveType);

        var nearby = await query
            .OrderByDescending(p => p.ParcelId.StartsWith(prefix))
            .ThenBy(p => p.ParcelId)
            .Take(limit)
            .Select(p => new
            {
                parcelId = p.ParcelId,
                address = p.Address,
                propertyType = p.PropertyType,
                assessedValue = p.AssessedValue,
                yearBuilt = p.YearBuilt,
            })
            .ToListAsync();

        return Ok(new
        {
            subjectParcelId = parcelId,
            propertyTypeFilter = effectiveType,
            total = nearby.Count,
            gisProximity = false,
            parcels = nearby,
        });
    }

    // ── PUT /api/atlas/parcels/{parcelId}/geometry ────────────────────
    // R2.10: Upsert parcel geometry (for county data imports)

    /// <summary>
    /// Upsert GeoJSON geometry for a parcel.
    /// Used by county data import pipelines to store parcel boundaries.
    /// County isolation enforced.
    /// </summary>
    [HttpPut("parcels/{parcelId}/geometry")]
    [RequiresPermission("write:parcel")]
    public async Task<IActionResult> UpsertParcelGeometry(
        string parcelId,
        [FromBody] UpsertGeometryRequest request)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        // Verify parcel exists in this county
        var propertyExists = await _db.Properties
            .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

        if (!propertyExists)
            return NotFound(new { error = "Parcel not found in this county" });

        _logger.LogInformation("Upserting geometry for parcel {ParcelId} in county {CountyId}", parcelId, countyId);

        var existing = await _db.ParcelGeometries
            .FirstOrDefaultAsync(g => g.ParcelId == parcelId && g.CountyId == countyId.Value);

        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("email")?.Value ?? "system";

        // R3.0: Parse GeoJSON into NTS geometry + centroid for PostGIS
        Geometry? nativeGeom = null;
        Point? centroidPt = null;
        if (_db.IsPostgres() && !string.IsNullOrWhiteSpace(request.GeoJson))
        {
            try
            {
                var reader = new GeoJsonReader();
                nativeGeom = reader.Read<Geometry>(request.GeoJson);
                nativeGeom.SRID = request.Srid ?? 4326;
                var centroid = nativeGeom.Centroid;
                centroid.SRID = nativeGeom.SRID;
                centroidPt = centroid;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse GeoJSON for parcel {ParcelId}; native geometry will be null", parcelId);
            }
        }
        else if (_db.IsPostgres() && request.CentroidLat.HasValue && request.CentroidLng.HasValue)
        {
            // No GeoJSON but we have centroid coords — create a point
            var factory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(srid: request.Srid ?? 4326);
            centroidPt = factory.CreatePoint(new Coordinate(request.CentroidLng.Value, request.CentroidLat.Value));
        }

        if (existing != null)
        {
            existing.GeoJson = request.GeoJson;
            existing.CentroidLat = request.CentroidLat;
            existing.CentroidLng = request.CentroidLng;
            existing.AreaSqft = request.AreaSqft;
            existing.AreaAcres = request.AreaAcres;
            existing.ZoningCode = request.ZoningCode;
            existing.ZoningDescription = request.ZoningDescription;
            existing.Srid = request.Srid ?? 4326;
            existing.Source = request.Source;
            existing.SourceDate = request.SourceDate;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = userId;
            if (_db.IsPostgres())
            {
                existing.NativeGeometry = nativeGeom;
                existing.CentroidPoint = centroidPt;
            }
        }
        else
        {
            var newGeometry = new ParcelGeometry
            {
                ParcelId = parcelId,
                CountyId = countyId.Value,
                GeoJson = request.GeoJson,
                CentroidLat = request.CentroidLat,
                CentroidLng = request.CentroidLng,
                AreaSqft = request.AreaSqft,
                AreaAcres = request.AreaAcres,
                ZoningCode = request.ZoningCode,
                ZoningDescription = request.ZoningDescription,
                Srid = request.Srid ?? 4326,
                Source = request.Source,
                SourceDate = request.SourceDate,
                CreatedBy = userId,
                UpdatedBy = userId,
            };
            if (_db.IsPostgres())
            {
                newGeometry.NativeGeometry = nativeGeom;
                newGeometry.CentroidPoint = centroidPt;
            }
            _db.ParcelGeometries.Add(newGeometry);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            parcelId,
            status = existing != null ? "updated" : "created",
            geometryAvailable = request.GeoJson != null,
        });
    }

    // ── GET /api/atlas/geometry/stats ─────────────────────────────────
    // R2.10: County geometry coverage statistics

    /// <summary>
    /// Return geometry coverage statistics for the current county.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("geometry/stats")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetGeometryStats()
    {
        var countyId = await ResolveCountyIdAsync();
        if (countyId is null)
            return Forbid();

        var totalParcels = await _db.Properties
            .CountAsync(p => p.CountyId == countyId.Value);

        var withGeometry = await _db.ParcelGeometries
            .CountAsync(g => g.CountyId == countyId.Value && g.GeoJson != null);

        var withCentroid = await _db.ParcelGeometries
            .CountAsync(g => g.CountyId == countyId.Value
                             && g.CentroidLat != null && g.CentroidLng != null);

        var withZoning = await _db.ParcelGeometries
            .CountAsync(g => g.CountyId == countyId.Value
                             && g.ZoningCode != null);

        return Ok(new
        {
            countyId,
            totalParcels,
            withGeometry,
            withCentroid,
            withZoning,
            coveragePercent = totalParcels > 0
                ? Math.Round(100.0 * withGeometry / totalParcels, 1)
                : 0.0,
            centroidCoveragePercent = totalParcels > 0
                ? Math.Round(100.0 * withCentroid / totalParcels, 1)
                : 0.0,
        });
    }

    // ── GET /api/atlas/layers/{layerId} ───────────────────────────────

    /// <summary>
    /// Return metadata for a specific map layer.
    /// Static layer catalog — real tile/WMS sources deferred to R3.
    /// </summary>
    [HttpGet("layers/{layerId}")]
    [RequiresPermission("read:parcel")]
    public IActionResult GetLayerDetail(string layerId)
    {
        layerId = layerId.Trim().ToLowerInvariant();

        var layer = layerId switch
        {
            "boundary" => new
            {
                id = "boundary",
                name = "Parcel Boundary",
                description = "Legal parcel boundaries from county assessor records.",
                format = "vector",
                source = "county_assessor",
                attribution = "County Assessor Office",
                minZoom = 12,
                maxZoom = 20,
                available = true,
            },
            "zoning" => new
            {
                id = "zoning",
                name = "Zoning Districts",
                description = "Municipal and county zoning classifications.",
                format = "vector",
                source = "planning_department",
                attribution = "County Planning Department",
                minZoom = 10,
                maxZoom = 20,
                available = true,
            },
            "flood" => new
            {
                id = "flood",
                name = "FEMA Flood Zones",
                description = "FEMA National Flood Hazard Layer (NFHL) zones.",
                format = "vector",
                source = "fema_nfhl",
                attribution = "FEMA",
                minZoom = 8,
                maxZoom = 20,
                available = true,
            },
            "aerial" => new
            {
                id = "aerial",
                name = "Aerial Imagery (2025)",
                description = "High-resolution aerial orthoimagery, latest available.",
                format = "raster",
                source = "naip_usda",
                attribution = "USDA NAIP",
                minZoom = 5,
                maxZoom = 20,
                available = true,
            },
            "parcels" => new
            {
                id = "parcels",
                name = "All Parcels",
                description = "County-wide parcel overlay with assessed value shading.",
                format = "vector",
                source = "county_assessor",
                attribution = "County Assessor Office",
                minZoom = 10,
                maxZoom = 20,
                available = true,
            },
            _ => (object?)null,
        };

        if (layer is null)
            return NotFound(new { error = $"Layer '{layerId}' not found" });

        return Ok(layer);
    }
}

// ── Request Models ─────────────────────────────────────────────────

public class UpsertGeometryRequest
{
    /// <summary>GeoJSON geometry string (Polygon/MultiPolygon).</summary>
    public string? GeoJson { get; set; }

    /// <summary>Centroid latitude (WGS84).</summary>
    public double? CentroidLat { get; set; }

    /// <summary>Centroid longitude (WGS84).</summary>
    public double? CentroidLng { get; set; }

    /// <summary>Area in square feet.</summary>
    public double? AreaSqft { get; set; }

    /// <summary>Area in acres.</summary>
    public double? AreaAcres { get; set; }

    /// <summary>Zoning classification code.</summary>
    [StringLength(50)]
    public string? ZoningCode { get; set; }

    /// <summary>Human-readable zoning description.</summary>
    [StringLength(200)]
    public string? ZoningDescription { get; set; }

    /// <summary>SRID / coordinate reference system (default 4326 = WGS84).</summary>
    public int? Srid { get; set; }

    /// <summary>Source of geometry data.</summary>
    [StringLength(100)]
    public string? Source { get; set; }

    /// <summary>Date geometry was last updated from source.</summary>
    public DateTime? SourceDate { get; set; }
}
