using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraAtlas — Parcel geometry and layer endpoints for R1.
/// Write-lane: atlas. County isolation enforced on all queries.
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

  // ── Available Layers (static for R1) ─────────────────────────────

  private static readonly string[] DefaultLayers = ["boundary", "zoning", "flood", "aerial", "parcels"];
  private static readonly Regex ParcelIdPattern = new("^[A-Za-z0-9._-]{1,50}$", RegexOptions.Compiled);

  private static bool IsValidParcelId(string parcelId)
  {
    return !string.IsNullOrWhiteSpace(parcelId) && ParcelIdPattern.IsMatch(parcelId);
  }

  // ── Atlas Suite Endpoints ──────────────────────────────

  [HttpGet("layers")]
  [RequiresPermission("read:parcel")]
  public IActionResult GetLayers()
  {
    return Ok(new
    {
      count = DefaultLayers.Length,
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
        available = l is "boundary" or "parcels",
        description = l switch
        {
          "boundary" => "Parcel boundary polygons derived from county GIS data",
          "zoning" => "Zoning district overlays for land-use classification",
          "flood" => "FEMA National Flood Hazard Layer zones",
          "aerial" => "High-resolution aerial imagery from 2025 flight",
          "parcels" => "County-wide parcel index with centroid points",
          _ => string.Empty,
        },
      }),
    });
  }

  public record ParcelSearchRequest(string? Query, string? PropertyType, int Limit = 50, int Offset = 0);

  [HttpPost("parcels/search")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> SearchParcels([FromBody] ParcelSearchRequest? request)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var limit = Math.Clamp(request?.Limit ?? 50, 1, 200);
    var offset = Math.Max(request?.Offset ?? 0, 0);

    IQueryable<Property> query = _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value);

    if (!string.IsNullOrWhiteSpace(request?.Query))
    {
      var term = request.Query.Trim();
      query = query.Where(p =>
          p.ParcelId.Contains(term) ||
          (p.Address != null && p.Address.Contains(term)));
    }

    if (!string.IsNullOrWhiteSpace(request?.PropertyType))
    {
      query = query.Where(p => p.PropertyType == request.PropertyType);
    }

    var total = await query.CountAsync();
    var parcels = await query
        .OrderBy(p => p.ParcelId)
        .Skip(offset)
        .Take(limit)
        .Select(p => new
        {
          p.ParcelId,
          p.Address,
          p.PropertyType,
          p.AssessedValue,
        })
        .ToListAsync();

    return Ok(new
    {
      total,
      count = parcels.Count,
      hasMore = offset + parcels.Count < total,
      results = parcels,
    });
  }

  [HttpGet("zoning")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetZoningDistricts()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var zones = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value && p.PropertyType != null)
        .GroupBy(p => p.PropertyType)
        .Select(g => new { zone = g.Key, parcelCount = g.Count() })
        .OrderByDescending(z => z.parcelCount)
        .ToListAsync();

    return Ok(new
    {
      countyId = countyId.Value,
      totalZones = zones.Count,
      zones = zones.Select(z => new
      {
        id = z.zone,
        name = z.zone,
        parcelCount = z.parcelCount,
      }),
    });
  }

  [HttpGet("flood-zones")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetFloodZones()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var parcelCount = await _db.Properties
        .AsNoTracking()
        .CountAsync(p => p.CountyId == countyId.Value);

    return Ok(new
    {
      countyId = countyId.Value,
      source = "FEMA National Flood Hazard Layer",
      floodZoneDataAvailable = false,
      parcelsInCounty = parcelCount,
      note = "Flood zone overlay data requires FEMA NFHL integration. Parcel-level flood zone classification is not yet available.",
    });
  }

  [HttpGet("stats")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetStats()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var totalParcels = await _db.Properties
        .AsNoTracking()
        .CountAsync(p => p.CountyId == countyId.Value);

    var typeBreakdown = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value && p.PropertyType != null)
        .GroupBy(p => p.PropertyType)
        .Select(g => new { type = g.Key, count = g.Count() })
        .ToListAsync();

    var valuationStats = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value)
        .GroupBy(_ => 1)
        .Select(g => new
        {
          totalAssessedValue = g.Sum(p => p.AssessedValue),
          avgAssessedValue = g.Average(p => p.AssessedValue),
          totalMarketValue = g.Sum(p => p.MarketValue),
        })
        .FirstOrDefaultAsync();

    return Ok(new
    {
      countyId = countyId.Value,
      totalParcels,
      typeBreakdown = typeBreakdown.Select(t => new { t.type, t.count }),
      totalAssessedValue = valuationStats?.totalAssessedValue ?? 0,
      averageAssessedValue = valuationStats?.avgAssessedValue ?? 0,
      totalMarketValue = valuationStats?.totalMarketValue ?? 0,
      layers = DefaultLayers,
    });
  }

  // ── GET /api/atlas/parcels/{parcelId} ────────────────────────────

  /// <summary>
  /// Return parcel geometry, centroid, area, and zoning.
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

    // R1 guardrail: do not fabricate GIS geometry. If geometry storage
    // is not available yet, return explicit nulls and availability=false.
    return Ok(new
    {
      parcelId = property.ParcelId,
      geometry = (string?)null,
      centroid = (object?)null,
      areaSqft = (int?)null,
      areaAcres = (double?)null,
      zoning = (string?)null,
      geometryAvailable = false,
      layers = DefaultLayers,
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

  // ════════════════════════════════════════════════════════════════════
  //  REAL BENTON COUNTY ARCGIS DATA — Extracted from bcbs-gis-pro-production
  //  Source: Benton County WA ArcGIS FeatureServer (services7.arcgis.com)
  //  31 verified layers, real service endpoints, real county reference data
  // ════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Real ArcGIS layer catalog from Benton County FeatureServer.
  /// 31 layers extracted from the quarantined bcbs-gis-pro-production app.
  /// </summary>
  [HttpGet("arcgis-layers")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetArcGisLayers([FromQuery] string? category)
  {
    var layers = BentonArcGisData.Layers.AsEnumerable();

    if (!string.IsNullOrWhiteSpace(category))
      layers = layers.Where(l => l.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

    var list = layers.Select(l => new
    {
      l.Id,
      l.Name,
      l.Category,
      l.ServiceUrl,
      l.GeometryType,
      l.Description,
      available = true,
    }).ToList();

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      count = list.Count,
      totalAvailable = BentonArcGisData.Layers.Length,
      categories = BentonArcGisData.Layers
        .Select(l => l.Category).Distinct().Order().ToList(),
      source = "Benton County WA ArcGIS FeatureServer",
      baseUrl = BentonArcGisData.BaseUrl,
      layers = list,
    });
  }

  /// <summary>
  /// Real ArcGIS service endpoint catalog for Benton County.
  /// Provides the URLs needed for client-side map rendering.
  /// </summary>
  [HttpGet("benton/service-endpoints")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetBentonServiceEndpoints()
  {
    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      baseUrl = BentonArcGisData.BaseUrl,
      services = new
      {
        parcels = BentonArcGisData.ParcelServiceUrl,
        taxLots = BentonArcGisData.TaxLotServiceUrl,
        zoning = BentonArcGisData.ZoningServiceUrl,
        cityLimits = BentonArcGisData.CityLimitsServiceUrl,
        assessorValues = BentonArcGisData.AssessorValServiceUrl,
        landUse = BentonArcGisData.LandUseServiceUrl,
        floodZones = BentonArcGisData.FloodZoneServiceUrl,
        census2020 = BentonArcGisData.Census2020ServiceUrl,
      },
      parcelAttributeMapping = new
      {
        parcelId = "PARCEL_ID",
        pin = "PIN",
        apn = "APN",
        siteAddress = "SITE_ADDR",
        assessedValue = "ASSESSED_VAL",
        landValue = "LAND_VAL",
        improvementValue = "IMPROV_VAL",
        ownerName = "OWNER_NAME",
        legalDescription = "LEGAL_DESC",
        acreage = "ACREAGE",
        propertyType = "PROP_TYPE",
        taxCode = "TAX_CODE",
      },
      source = "Benton County WA ArcGIS FeatureServer",
      lastVerified = "2025-01-15",
    });
  }

  /// <summary>
  /// Real Benton County reference data: geography, demographics, cities, districts.
  /// Extracted from quarantined bcbs-gis-pro-production BentonCountyService.
  /// </summary>
  [HttpGet("benton/reference")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetBentonReference()
  {
    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(BentonArcGisData.CountyReference);
  }

  /// <summary>
  /// Lookup a parcel by ID and return the real ArcGIS service URL for geometry retrieval.
  /// County-isolated. Provides the ArcGIS query URL for client-side rendering.
  /// </summary>
  [HttpGet("parcels/{parcelId}/arcgis")]
  [RequiresPermission("read:parcel")]
  public async Task<ActionResult> GetParcelArcGisLink(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
        .Select(p => new { p.ParcelId, p.Address, p.PropertyType, p.AssessedValue })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    // Build the real ArcGIS query URL for this parcel
    var queryUrl = BuildArcGisParcelQueryUrl(parcelId);

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      parcelId = property.ParcelId,
      address = property.Address,
      propertyType = property.PropertyType,
      assessedValue = property.AssessedValue,
      arcgis = new
      {
        serviceUrl = BentonArcGisData.ParcelServiceUrl,
        queryUrl,
        attributeField = "PARCEL_ID",
        outputFormat = "geojson",
        spatialReference = 4326,
      },
      source = "Benton County ArcGIS FeatureServer",
    });
  }

  // ════════════════════════════════════════════════════════════════════
  //  WAVE 18 — REAL ARCGIS QUERY & SPATIAL ANALYSIS ENDPOINTS
  //  Extracted from: terra-playground-production, bcbs-gis-pro-production
  //  Provides: ArcGIS REST API query builders, spatial queries,
  //            taxing districts, flood zones, neighboring parcels
  // ════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Build a real ArcGIS REST query for a single parcel with full field mapping.
  /// Returns the query URL and the expected response schema so clients can
  /// execute the ArcGIS call and parse results correctly.
  /// Source: bcbs-gis-pro-production BentonCountyService.fetchParcelByNumber
  /// </summary>
  [HttpGet("arcgis/query/parcel/{parcelId}")]
  [RequiresPermission("read:parcel")]
  public async Task<ActionResult> GetArcGisParcelQuery(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
        .Select(p => new { p.ParcelId, p.Address, p.PropertyType, p.AssessedValue })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    var encodedId = Uri.EscapeDataString(parcelId);
    var queryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
                   $"?where=PARCEL_ID%3D%27{encodedId}%27%20OR%20PIN%3D%27{encodedId}%27%20OR%20APN%3D%27{encodedId}%27" +
                   "&outFields=PARCEL_ID,PIN,APN,SITE_ADDR,OWNER_NAME,ASSESSED_VAL,LAND_VAL,IMPROV_VAL," +
                   "LEGAL_DESC,ACREAGE,PROP_TYPE,TAX_CODE,TOTALVALUE,OWNERNAME,SITUS_ADDRESS,PARCEL_NUMBER" +
                   "&returnGeometry=true&f=geojson&outSR=4326";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      parcelId = property.ParcelId,
      localData = new
      {
        address = property.Address,
        propertyType = property.PropertyType,
        assessedValue = property.AssessedValue,
      },
      arcgisQuery = new
      {
        serviceUrl = BentonArcGisData.ParcelServiceUrl,
        queryUrl,
        method = "GET",
        whereClause = $"PARCEL_ID='{parcelId}' OR PIN='{parcelId}' OR APN='{parcelId}'",
        returnGeometry = true,
        outputFormat = "geojson",
        spatialReference = 4326,
      },
      fieldMapping = ArcGisFieldMappings.ParcelFields,
      source = "ArcGIS REST API query pattern from bcbs-gis-pro-production",
    });
  }

  /// <summary>
  /// Build multi-criteria ArcGIS search queries (by owner, address, value range).
  /// Source: terra-playground-production arcgis-service.ts searchParcels()
  /// </summary>
  public record ArcGisSearchRequest(
      string? ParcelId, string? OwnerName, string? Address,
      decimal? MinValue, decimal? MaxValue, string? Zoning,
      int Limit = 50);

  [HttpPost("arcgis/query/search")]
  [RequiresPermission("read:parcel")]
  public async Task<ActionResult> BuildArcGisSearch([FromBody] ArcGisSearchRequest request)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var limit = Math.Clamp(request.Limit, 1, 200);
    var clauses = new List<string>();

    if (!string.IsNullOrWhiteSpace(request.ParcelId))
    {
      var escaped = Uri.EscapeDataString(request.ParcelId.Trim());
      clauses.Add($"PARCEL_ID LIKE '%25{escaped}%25'");
    }
    if (!string.IsNullOrWhiteSpace(request.OwnerName))
    {
      var escaped = Uri.EscapeDataString(request.OwnerName.Trim());
      clauses.Add($"OWNER_NAME LIKE '%25{escaped}%25'");
    }
    if (!string.IsNullOrWhiteSpace(request.Address))
    {
      var escaped = Uri.EscapeDataString(request.Address.Trim());
      clauses.Add($"SITE_ADDR LIKE '%25{escaped}%25'");
    }
    if (request.MinValue.HasValue)
      clauses.Add($"ASSESSED_VAL >= {request.MinValue.Value}");
    if (request.MaxValue.HasValue)
      clauses.Add($"ASSESSED_VAL <= {request.MaxValue.Value}");
    if (!string.IsNullOrWhiteSpace(request.Zoning))
    {
      var escaped = Uri.EscapeDataString(request.Zoning.Trim());
      clauses.Add($"ZONE_CODE = '{escaped}'");
    }

    if (clauses.Count == 0)
      return BadRequest(new { error = "At least one search criterion required" });

    var where = string.Join(" AND ", clauses);
    var queryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
                   $"?where={where}" +
                   "&outFields=PARCEL_ID,PIN,SITE_ADDR,OWNER_NAME,ASSESSED_VAL,LAND_VAL,IMPROV_VAL,ACREAGE,PROP_TYPE" +
                   $"&returnGeometry=true&f=geojson&outSR=4326&resultRecordCount={limit}";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      arcgisQuery = new
      {
        serviceUrl = BentonArcGisData.ParcelServiceUrl,
        queryUrl,
        method = "GET",
        whereClause = where.Replace("%25", "%"),
        resultRecordCount = limit,
        returnGeometry = true,
        outputFormat = "geojson",
        spatialReference = 4326,
      },
      fieldMapping = ArcGisFieldMappings.ParcelFields,
      source = "ArcGIS REST API search pattern from terra-playground-production",
    });
  }

  /// <summary>
  /// Real Benton County taxing districts with estimated tax rates.
  /// Source: bcbs-gis-pro-production BentonCountyService.fetchTaxingDistricts()
  /// </summary>
  [HttpGet("arcgis/taxing-districts")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetTaxingDistricts()
  {
    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      count = BentonTaxingDistricts.Districts.Length,
      source = "Benton County Assessor — extracted from bcbs-gis-pro-production",
      taxYear = 2025,
      districts = BentonTaxingDistricts.Districts,
    });
  }

  /// <summary>
  /// Real city boundary query URLs for Benton County.
  /// Source: bcbs-gis-pro-production BentonCountyService.fetchCityBoundaries()
  /// </summary>
  [HttpGet("arcgis/city-boundaries")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetCityBoundaries()
  {
    var queryUrl = $"{BentonArcGisData.CityLimitsServiceUrl}/query" +
                   "?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      arcgisQuery = new
      {
        serviceUrl = BentonArcGisData.CityLimitsServiceUrl,
        queryUrl,
        method = "GET",
        whereClause = "1=1",
        returnGeometry = true,
        outputFormat = "geojson",
        spatialReference = 4326,
      },
      cities = BentonCityBoundaries.Cities,
      source = "CityLimits FeatureServer — bcbs-gis-pro-production",
    });
  }

  /// <summary>
  /// Build ArcGIS flood zone query for a specific parcel.
  /// Source: terra-playground-production arcgis-service.ts getFloodZoneForParcel()
  /// </summary>
  [HttpGet("arcgis/flood-zone/{parcelId}")]
  [RequiresPermission("read:parcel")]
  public async Task<ActionResult> GetFloodZoneQuery(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var exists = await _db.Properties
        .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
    if (!exists)
      return NotFound(new { error = "Parcel not found" });

    // Two-step spatial intersection:
    // 1. Query parcel geometry from Parcels FeatureServer
    // 2. Use parcel polygon to query Flood_Zones for intersection
    var encodedId = Uri.EscapeDataString(parcelId);
    var parcelQueryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
                         $"?where=PARCEL_ID%3D%27{encodedId}%27&outFields=PARCEL_ID&returnGeometry=true&f=json&outSR=4326";

    var floodIntersectUrl = $"{BentonArcGisData.FloodZoneServiceUrl}/query" +
                            "?where=1%3D1" +
                            "&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,FIRM_PAN" +
                            "&returnGeometry=true&f=geojson&outSR=4326" +
                            "&spatialRel=esriSpatialRelIntersects" +
                            "&geometryType=esriGeometryPolygon" +
                            "&inSR=4326";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      parcelId,
      steps = new object[]
      {
        new
        {
          step = 1,
          description = "Fetch parcel geometry",
          queryUrl = parcelQueryUrl,
          serviceUrl = BentonArcGisData.ParcelServiceUrl,
        },
        new
        {
          step = 2,
          description = "Use parcel polygon to query flood zone intersection",
          queryUrlTemplate = floodIntersectUrl + "&geometry={parcel_geometry_rings}",
          serviceUrl = BentonArcGisData.FloodZoneServiceUrl,
          spatialRel = "esriSpatialRelIntersects",
          geometryType = "esriGeometryPolygon",
        },
      },
      responseSchema = new
      {
        fields = new[] { "FLD_ZONE", "ZONE_SUBTY", "SFHA_TF", "STATIC_BFE", "FIRM_PAN" },
        interpretation = new
        {
          fldZone = "FEMA flood zone designation (A, AE, X, etc.)",
          zoneSub = "Zone subtype refinement",
          sfha = "Special Flood Hazard Area (true/false)",
          staticBfe = "Base Flood Elevation in feet",
          firmPan = "FIRM panel number",
        },
      },
      source = "Flood zone spatial intersection — terra-playground-production",
    });
  }

  /// <summary>
  /// Build ArcGIS proximity query for neighboring parcels.
  /// Source: terra-playground-production arcgis-service.ts getNeighboringParcels()
  /// Uses centroid → 100m buffer → spatial query pattern.
  /// </summary>
  [HttpGet("arcgis/neighboring-parcels/{parcelId}")]
  [RequiresPermission("read:parcel")]
  public async Task<ActionResult> GetNeighboringParcelsQuery(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var exists = await _db.Properties
        .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);
    if (!exists)
      return NotFound(new { error = "Parcel not found" });

    var encodedId = Uri.EscapeDataString(parcelId);
    var parcelQueryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
                         $"?where=PARCEL_ID%3D%27{encodedId}%27&outFields=PARCEL_ID&returnGeometry=true&f=json&outSR=4326";

    // Step 2: From centroid, query parcels within 100m buffer
    // ArcGIS REST spatial query using esriGeometryPoint + distance
    var neighborQueryTemplate = $"{BentonArcGisData.ParcelServiceUrl}/query" +
                                "?where=1%3D1" +
                                "&outFields=PARCEL_ID,PIN,SITE_ADDR,OWNER_NAME,ASSESSED_VAL,ACREAGE,PROP_TYPE" +
                                "&returnGeometry=true&f=geojson&outSR=4326" +
                                "&spatialRel=esriSpatialRelIntersects" +
                                "&geometryType=esriGeometryPoint" +
                                "&distance=100&units=esriSRUnit_Meter" +
                                "&inSR=4326";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      parcelId,
      bufferDistanceMeters = 100,
      steps = new object[]
      {
        new
        {
          step = 1,
          description = "Fetch parcel geometry, compute centroid",
          queryUrl = parcelQueryUrl,
          serviceUrl = BentonArcGisData.ParcelServiceUrl,
          centroidCalculation = "Average of polygon ring coordinates",
        },
        new
        {
          step = 2,
          description = "Query parcels within 100m buffer of centroid",
          queryUrlTemplate = neighborQueryTemplate + "&geometry={centroid_x},{centroid_y}",
          serviceUrl = BentonArcGisData.ParcelServiceUrl,
          spatialRel = "esriSpatialRelIntersects",
          geometryType = "esriGeometryPoint",
          distance = 100,
          units = "esriSRUnit_Meter",
        },
      },
      source = "Proximity search — terra-playground-production getNeighboringParcels()",
    });
  }

  /// <summary>
  /// Build ArcGIS spatial extent query for parcels within a bounding box.
  /// Source: bcbs-gis-pro-production BentonCountyService.fetchParcels(extent)
  /// </summary>
  public record SpatialExtentRequest(double Xmin, double Ymin, double Xmax, double Ymax, int Limit = 200);

  [HttpPost("arcgis/query/spatial")]
  [RequiresPermission("read:parcel")]
  public ActionResult BuildSpatialQuery([FromBody] SpatialExtentRequest request)
  {
    var limit = Math.Clamp(request.Limit, 1, 1000);

    // Validate coordinate ranges (WGS84)
    if (request.Xmin < -180 || request.Xmax > 180 || request.Ymin < -90 || request.Ymax > 90)
      return BadRequest(new { error = "Coordinates out of WGS84 range" });
    if (request.Xmin >= request.Xmax || request.Ymin >= request.Ymax)
      return BadRequest(new { error = "Invalid extent: min must be less than max" });

    var geometryParam = $"{request.Xmin},{request.Ymin},{request.Xmax},{request.Ymax}";
    var queryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
                   "?where=1%3D1" +
                   "&outFields=PARCEL_ID,PIN,SITE_ADDR,OWNER_NAME,ASSESSED_VAL,ACREAGE,PROP_TYPE" +
                   "&returnGeometry=true&f=geojson&outSR=4326" +
                   "&spatialRel=esriSpatialRelIntersects" +
                   "&geometryType=esriGeometryEnvelope" +
                   $"&geometry={geometryParam}" +
                   $"&inSR=4326&resultRecordCount={limit}";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      arcgisQuery = new
      {
        serviceUrl = BentonArcGisData.ParcelServiceUrl,
        queryUrl,
        method = "GET",
        geometry = new { xmin = request.Xmin, ymin = request.Ymin, xmax = request.Xmax, ymax = request.Ymax },
        geometryType = "esriGeometryEnvelope",
        spatialRel = "esriSpatialRelIntersects",
        resultRecordCount = limit,
        returnGeometry = true,
        outputFormat = "geojson",
        spatialReference = 4326,
      },
      fieldMapping = ArcGisFieldMappings.ParcelFields,
      source = "Spatial query — bcbs-gis-pro-production fetchParcels(extent)",
    });
  }

  /// <summary>
  /// Complete ArcGIS layer query configurations for all 8 spatial layer types.
  /// Source: terra-playground-production arcgis-service.ts LAYER_CONFIGS
  /// </summary>
  [HttpGet("arcgis/layer-configs")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetLayerConfigs()
  {
    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      count = ArcGisSpatialLayers.Configs.Length,
      source = "terra-playground-production arcgis-service.ts",
      baseUrl = BentonArcGisData.BaseUrl,
      layers = ArcGisSpatialLayers.Configs.Select(c => new
      {
        c.Id,
        c.Name,
        c.FeatureServerPath,
        serviceUrl = $"{BentonArcGisData.BaseUrl}/{c.FeatureServerPath}",
        queryUrl = $"{BentonArcGisData.BaseUrl}/{c.FeatureServerPath}/query?where=1%3D1&outFields={string.Join(",", c.Fields)}&returnGeometry=true&f=geojson&outSR=4326",
        c.Fields,
        c.GeometryType,
        c.SpatialCapabilities,
      }),
    });
  }

  /// <summary>
  /// ArcGIS field normalization rules for Benton County.
  /// Multiple quarantine apps use different field names for the same data.
  /// Source: bcbs-gis-pro-production transformParcelData() fallback mapping
  /// </summary>
  [HttpGet("arcgis/field-mapping")]
  [RequiresPermission("read:parcel")]
  public ActionResult GetFieldMapping()
  {
    Response.Headers["X-Atlas-Source"] = "benton-arcgis-fy2025";
    return Ok(new
    {
      parcelFields = ArcGisFieldMappings.ParcelFields,
      zoningCodeMapping = ArcGisFieldMappings.ZoningToPropertyType,
      source = "Field normalization from bcbs-gis-pro-production + terra-playground-production",
    });
  }

  /// <summary>
  /// Coordinate conversion utilities for Web Mercator ↔ WGS84.
  /// Source: terra-dashboard-production webMercatorToGeographic()
  /// </summary>
  public record CoordinateConvertRequest(double X, double Y, string FromSR = "3857");

  [HttpPost("arcgis/convert-coordinates")]
  [RequiresPermission("read:parcel")]
  public ActionResult ConvertCoordinates([FromBody] CoordinateConvertRequest request)
  {
    if (request.FromSR == "3857" || request.FromSR.Equals("WebMercator", StringComparison.OrdinalIgnoreCase))
    {
      // Web Mercator (EPSG:3857) → WGS84 (EPSG:4326)
      var lon = (request.X / 20037508.34) * 180.0;
      var latRad = (request.Y / 20037508.34) * 180.0 * Math.PI / 180.0;
      var lat = 180.0 / Math.PI * (2.0 * Math.Atan(Math.Exp(latRad)) - Math.PI / 2.0);

      return Ok(new
      {
        input = new { x = request.X, y = request.Y, spatialReference = "EPSG:3857" },
        output = new { longitude = Math.Round(lon, 8), latitude = Math.Round(lat, 8), spatialReference = "EPSG:4326" },
        source = "Web Mercator conversion — terra-dashboard-production",
      });
    }

    return BadRequest(new { error = "Unsupported source spatial reference. Supported: 3857, WebMercator" });
  }

  // ════════════════════════════════════════════════════════════════════
  //  WAVE 19 — Full Map Workflows
  //  Replace R1 stub geometry‑only behavior with real map workflows
  //  that combine DB data with ArcGIS query builders.
  // ════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Full ArcGIS-backed parcel geometry request builder.
  /// Replaces the R1 stub (geometryAvailable=false) with a real ArcGIS
  /// query URL for all geometry fields plus DB enrichment from the Property table.
  /// Source: terra-playground-production getParcelGeometry() + bcbs-gis-pro-production
  /// </summary>
  [HttpGet("parcels/{parcelId}/geometry")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelGeometryFromArcGis(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var property = await _db.Properties
        .AsNoTracking()
        .Where(p => p.ParcelId == parcelId && p.CountyId == countyId.Value)
        .Select(p => new { p.ParcelId, p.Address, p.PropertyType, p.AssessedValue, p.MarketValue, p.LandValue })
        .FirstOrDefaultAsync();

    if (property is null)
      return NotFound(new { error = "Parcel not found" });

    var encodedId = Uri.EscapeDataString(parcelId);

    // Build real ArcGIS geometry query URL — returns polygon with all spatial fields
    var geometryQueryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
        $"?where=PARCEL_ID%3D%27{encodedId}%27+OR+PIN%3D%27{encodedId}%27+OR+APN%3D%27{encodedId}%27" +
        "&outFields=PARCEL_ID,SHAPE_Area,SHAPE_Length,ACREAGE" +
        "&returnGeometry=true&geometryType=esriGeometryPolygon&spatialRel=esriSpatialRelIntersects" +
        "&outSR=4326&f=geojson";

    // Build centroid query URL — returns centroid point
    var centroidQueryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
        $"?where=PARCEL_ID%3D%27{encodedId}%27" +
        "&outFields=PARCEL_ID&returnGeometry=true&returnCentroid=true&outSR=4326&f=json";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-geometry-fy2025";
    return Ok(new
    {
      parcelId = property.ParcelId,
      propertyData = new
      {
        address = property.Address,
        propertyType = property.PropertyType,
        assessedValue = property.AssessedValue,
        marketValue = property.MarketValue,
        landValue = property.LandValue,
      },
      arcgisGeometry = new
      {
        geometryQueryUrl,
        centroidQueryUrl,
        spatialReference = "EPSG:4326 (WGS84)",
        geometryType = "polygon",
        note = "Fetch geometryQueryUrl for GeoJSON polygon. centroidQueryUrl returns parcel centroid.",
      },
      source = "Benton County ArcGIS FeatureServer — real geometry query",
    });
  }

  /// <summary>
  /// Full spatial profile: returns ALL overlapping districts, zones, flood
  /// designations, and features for a single parcel via ArcGIS spatial
  /// intersection queries.
  /// Source: terra-playground-production getIntersectingFeatures() overlay analysis
  /// </summary>
  [HttpGet("parcels/{parcelId}/spatial-profile")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelSpatialProfile(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var exists = await _db.Properties
        .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

    if (!exists)
      return NotFound(new { error = "Parcel not found" });

    var encodedId = Uri.EscapeDataString(parcelId);
    var baseWhere = $"PARCEL_ID%3D%27{encodedId}%27";

    // Step 1: Get parcel geometry (needed as input for spatial intersection)
    var parcelGeomUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
        $"?where={baseWhere}&outFields=PARCEL_ID&returnGeometry=true&outSR=4326&f=json";

    // Step 2: Build spatial intersection queries against each overlay layer
    var overlayQueries = ArcGisSpatialLayers.Configs
        .Where(c => c.SpatialCapabilities.Contains("intersect"))
        .Select(layer => new
        {
          layerId = layer.Id,
          layerName = layer.Name,
          queryUrl = $"{BentonArcGisData.BaseUrl}/{layer.FeatureServerPath}/query" +
              "?where=1%3D1&outFields=" + string.Join(",", layer.Fields) +
              "&geometryType=esriGeometryPolygon&spatialRel=esriSpatialRelIntersects" +
              "&inSR=4326&outSR=4326&f=json",
          fields = layer.Fields,
          note = $"Pass parcel geometry from step 1 as 'geometry' parameter",
        })
        .ToList();

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-spatial-profile-fy2025";
    return Ok(new
    {
      parcelId,
      workflow = "spatial-profile",
      steps = new object[]
      {
        new { step = 1, action = "Fetch parcel geometry", url = parcelGeomUrl },
        new { step = 2, action = "Run spatial intersections", overlayCount = overlayQueries.Count, overlays = overlayQueries },
      },
      overlayLayers = overlayQueries.Select(q => q.layerId),
      expectedResults = new
      {
        zoningDistrict = "Zone code, name, permitted uses",
        floodZone = "FEMA zone designation, SFHA status",
        taxDistrict = "District ID, tax rate",
        schoolDistrict = "District name, enrollment",
        commissionerDistrict = "Commissioner name",
        wetlands = "Wetland type, classification",
        censusBlock = "GEOID, population, median income",
      },
      source = "Benton County ArcGIS — full overlay analysis from terra-playground-production",
    });
  }

  /// <summary>
  /// Point-in-polygon identification: given lat/lng coordinates, return
  /// the parcel at that location via ArcGIS spatial query + DB enrichment.
  /// Source: terra-dashboard-production getParcelByCoordinates()
  /// </summary>
  public record MapIdentifyRequest(double Latitude, double Longitude);

  [HttpPost("map/identify")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> IdentifyParcelAtPoint([FromBody] MapIdentifyRequest request)
  {
    // Validate coordinates are within Benton County approximate bounding box
    // Benton County WA: lat 46.0-46.6, lon -119.0 to -119.9
    if (request.Latitude < 45.0 || request.Latitude > 49.0 ||
        request.Longitude < -125.0 || request.Longitude > -116.0)
    {
      return BadRequest(new { error = "Coordinates outside Washington State bounds (lat 45-49, lon -125 to -116)" });
    }

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    // Build ArcGIS point query — finds parcel polygon containing the click point
    var identifyUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
        $"?geometry={request.Longitude},{request.Latitude}" +
        "&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelWithin" +
        "&outFields=PARCEL_ID,OWNER_NAME,SITE_ADDR,ASSESSED_VAL,PROP_TYPE,ACREAGE,ZONE_CODE" +
        "&returnGeometry=true&outSR=4326&f=geojson&inSR=4326";

    // Also query zoning at the same point
    var zoningUrl = $"{BentonArcGisData.ZoningServiceUrl}/query" +
        $"?geometry={request.Longitude},{request.Latitude}" +
        "&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelWithin" +
        "&outFields=ZONE_CODE,ZONE_NAME,ZONE_DESC&returnGeometry=false&f=json&inSR=4326";

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-identify-fy2025";
    return Ok(new
    {
      coordinates = new { latitude = request.Latitude, longitude = request.Longitude },
      queries = new
      {
        parcelIdentify = new { url = identifyUrl, returns = "Parcel polygon + attributes at click point" },
        zoningIdentify = new { url = zoningUrl, returns = "Zoning district at click point" },
      },
      enrichment = "Match PARCEL_ID from ArcGIS response against GET /api/atlas/parcels/{parcelId} for full DB data",
      source = "Point-in-polygon identification — terra-dashboard-production pattern",
    });
  }

  /// <summary>
  /// All district memberships for a parcel: taxing, school, fire,
  /// commissioner, and special districts.
  /// Source: bcbs-gis-pro-production fetchTaxingDistricts() + terra-playground-production
  /// </summary>
  [HttpGet("parcels/{parcelId}/district-membership")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelDistrictMembership(string parcelId)
  {
    parcelId = parcelId.Trim();
    if (!IsValidParcelId(parcelId))
      return BadRequest(new { error = "Invalid parcelId format" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var exists = await _db.Properties
        .AnyAsync(p => p.ParcelId == parcelId && p.CountyId == countyId.Value);

    if (!exists)
      return NotFound(new { error = "Parcel not found" });

    var encodedId = Uri.EscapeDataString(parcelId);

    // Build query chain: get parcel geometry, then intersect with each district layer
    var districtLayers = new[]
    {
      new { layerId = "tax-districts", name = "Tax Districts", path = "Tax_Districts/FeatureServer/0",
            fields = "DISTRICT_ID,TAX_RATE", purpose = "Property tax rate determination" },
      new { layerId = "school-districts", name = "School Districts", path = "School_Districts/FeatureServer/0",
            fields = "DISTRICT_ID,DISTRICT_NAME,ENROLLMENT", purpose = "School district levy assignment" },
      new { layerId = "commissioners", name = "Commissioner Districts", path = "Commissioner_Districts/FeatureServer/0",
            fields = "COMMISSIONER,POPULATION", purpose = "Commissioner district representation" },
      new { layerId = "fire-districts", name = "Fire Districts", path = "Fire_Districts/FeatureServer/0",
            fields = "DISTRICT_ID,DISTRICT_NAME", purpose = "Fire district levy assignment" },
    };

    var geomUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
        $"?where=PARCEL_ID%3D%27{encodedId}%27&outFields=PARCEL_ID&returnGeometry=true&outSR=4326&f=json";

    var districtQueries = districtLayers.Select(d => new
    {
      d.layerId,
      d.name,
      d.purpose,
      queryUrl = $"{BentonArcGisData.BaseUrl}/{d.path}/query" +
          "?where=1%3D1&outFields=" + d.fields +
          "&geometryType=esriGeometryPolygon&spatialRel=esriSpatialRelIntersects" +
          "&inSR=4326&outSR=4326&returnGeometry=false&f=json",
      note = "Pass parcel geometry from step 1 as 'geometry' parameter",
    }).ToList();

    // Reference data: known taxing districts and estimated rates
    var refDistricts = BentonTaxingDistricts.Districts;

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-districts-fy2025";
    return Ok(new
    {
      parcelId,
      workflow = "district-membership",
      steps = new object[]
      {
        new { step = 1, action = "Fetch parcel geometry", url = geomUrl },
        new { step = 2, action = "Intersect with district layers", layerCount = districtQueries.Count, layers = districtQueries },
      },
      referenceDistricts = refDistricts,
      estimatedCombinedRate = "Sum individual district rates from intersections for total levy rate",
      source = "Benton County ArcGIS district layers — bcbs-gis-pro-production + terra-playground-production",
    });
  }

  /// <summary>
  /// Zoning code detail lookup: given a zoning code prefix, return
  /// permitted uses, restrictions, and reference data.
  /// Source: terra-playground-production getZoningDetails()
  /// </summary>
  [HttpGet("zoning/{code}/details")]
  [RequiresPermission("read:parcel")]
  public IActionResult GetZoningCodeDetails(string code)
  {
    code = code.Trim().ToUpperInvariant();
    if (string.IsNullOrWhiteSpace(code) || code.Length > 20)
      return BadRequest(new { error = "Invalid zoning code" });

    // Match against known zoning data
    var zoningTypes = new[]
    {
      new { prefix = "R-1",  label = "Single-Family Residential", density = "1 unit per lot",
            permittedUses = new[] { "Single-family homes", "Accessory dwelling units", "Home occupations", "Parks" },
            restrictions = new[] { "Max 35ft height", "Min 7,200 sqft lot", "Front setback 20ft" } },
      new { prefix = "R-2",  label = "Two-Family Residential", density = "2 units per lot",
            permittedUses = new[] { "Duplexes", "Single-family homes", "ADUs", "Day care (conditional)" },
            restrictions = new[] { "Max 35ft height", "Min 5,000 sqft lot per unit", "Front setback 20ft" } },
      new { prefix = "R-3",  label = "Multi-Family Residential", density = "Up to 20 units/acre",
            permittedUses = new[] { "Apartments", "Condominiums", "Townhouses", "Group residences" },
            restrictions = new[] { "Max 45ft height", "Min 3,000 sqft lot per unit", "Parking req 1.5/unit" } },
      new { prefix = "C-1",  label = "Neighborhood Commercial", density = "N/A (commercial)",
            permittedUses = new[] { "Retail stores", "Restaurants", "Personal services", "Offices" },
            restrictions = new[] { "Max 35ft height", "Max 10,000 sqft building", "Landscaping 15%" } },
      new { prefix = "C-2",  label = "General Commercial", density = "N/A (commercial)",
            permittedUses = new[] { "All C-1 uses", "Hotels/motels", "Auto sales", "Entertainment" },
            restrictions = new[] { "Max 50ft height", "Parking per use table", "Landscaping 10%" } },
      new { prefix = "C-3",  label = "Heavy Commercial", density = "N/A (commercial)",
            permittedUses = new[] { "Wholesale trade", "Equipment rental", "Construction services", "Mini-storage" },
            restrictions = new[] { "Max 60ft height", "Screening from residential", "Dust/noise controls" } },
      new { prefix = "I-1",  label = "Light Industrial", density = "N/A (industrial)",
            permittedUses = new[] { "Manufacturing", "Warehousing", "Research labs", "Data centers" },
            restrictions = new[] { "Max 75ft height", "200ft setback from residential", "Environmental review" } },
      new { prefix = "I-2",  label = "Heavy Industrial", density = "N/A (industrial)",
            permittedUses = new[] { "Heavy manufacturing", "Chemical processing", "Mineral extraction" },
            restrictions = new[] { "Environmental impact study required", "500ft residential buffer", "SEPA review" } },
      new { prefix = "A-",   label = "Agricultural", density = "1 unit per 5 acres",
            permittedUses = new[] { "Farming", "Ranching", "Agricultural buildings", "Farm stands" },
            restrictions = new[] { "Min 5-acre lot", "Right-to-farm protections", "Limited commercial" } },
      new { prefix = "PF",   label = "Public Facilities", density = "N/A (public)",
            permittedUses = new[] { "Government buildings", "Schools", "Fire stations", "Utilities" },
            restrictions = new[] { "Compatible with surroundings", "Public hearing required", "SEPA review" } },
      new { prefix = "OS",   label = "Open Space", density = "N/A (conservation)",
            permittedUses = new[] { "Parks", "Trails", "Conservation", "Passive recreation" },
            restrictions = new[] { "No permanent structures", "Native vegetation preservation", "Drainage easements" } },
      new { prefix = "MU",   label = "Mixed Use", density = "Up to 40 units/acre",
            permittedUses = new[] { "Ground-floor commercial", "Upper-floor residential", "Live-work units", "Offices" },
            restrictions = new[] { "Max 65ft height", "Ground floor 60% commercial", "Structured parking" } },
    };

    var match = zoningTypes.FirstOrDefault(z =>
        code.StartsWith(z.prefix, StringComparison.OrdinalIgnoreCase));

    if (match is null)
    {
      // Not found in reference — still provide ArcGIS lookup URL
      var encodedCode = Uri.EscapeDataString(code);
      return Ok(new
      {
        code,
        found = false,
        arcgisLookupUrl = $"{BentonArcGisData.ZoningServiceUrl}/query" +
            $"?where=ZONE_CODE%3D%27{encodedCode}%27&outFields=*&returnGeometry=true&outSR=4326&f=geojson",
        note = "Zoning code not in reference data. Use arcgisLookupUrl for live query.",
      });
    }

    var encodedPrefix = Uri.EscapeDataString(match.prefix);
    Response.Headers["X-Atlas-Source"] = "benton-zoning-reference-fy2025";
    return Ok(new
    {
      code,
      found = true,
      zoning = new
      {
        match.prefix,
        match.label,
        match.density,
        match.permittedUses,
        match.restrictions,
      },
      arcgisQueryUrl = $"{BentonArcGisData.ZoningServiceUrl}/query" +
          $"?where=ZONE_CODE+LIKE+%27{encodedPrefix}%25%27&outFields=*&returnGeometry=true&outSR=4326&f=geojson",
      relatedParcels = $"Use POST /api/atlas/arcgis/query/search with zoning={code} to find parcels",
      source = "Benton County zoning reference — terra-playground-production + county code",
    });
  }

  /// <summary>
  /// Valuation heat map data: DB-backed aggregation of assessed values
  /// by property type for map visualization (choropleth/bubble).
  /// Source: bcbs-gis-pro-production getPropertyStatistics()
  /// </summary>
  [HttpGet("map/valuation-heat-map")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetValuationHeatMap()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var byType = await _db.Properties
        .AsNoTracking()
        .Where(p => p.CountyId == countyId.Value && p.PropertyType != null)
        .GroupBy(p => p.PropertyType)
        .Select(g => new
        {
          propertyType = g.Key,
          count = g.Count(),
          totalAssessed = g.Sum(p => p.AssessedValue),
          avgAssessed = g.Average(p => p.AssessedValue),
          minAssessed = g.Min(p => p.AssessedValue),
          maxAssessed = g.Max(p => p.AssessedValue),
          totalMarket = g.Sum(p => p.MarketValue),
          avgMarket = g.Average(p => p.MarketValue),
        })
        .OrderByDescending(g => g.totalAssessed)
        .ToListAsync();

    var totalParcels = byType.Sum(t => t.count);
    var totalAssessed = byType.Sum(t => t.totalAssessed);

    // Build ArcGIS renderer query for choropleth map
    var rendererUrl = $"{BentonArcGisData.AssessorValServiceUrl}/query" +
        "?where=1%3D1&outFields=PARCEL_ID,ASSESSED_VAL,PROP_TYPE,ACREAGE" +
        "&returnGeometry=true&outSR=4326&resultRecordCount=2000&f=geojson";

    Response.Headers["X-Atlas-Source"] = "benton-heat-map-fy2025";
    return Ok(new
    {
      countyId = countyId.Value,
      summary = new { totalParcels, totalAssessedValue = totalAssessed, typeCount = byType.Count },
      byPropertyType = byType,
      visualization = new
      {
        rendererQueryUrl = rendererUrl,
        suggestedRenderer = "ClassBreaksRenderer on ASSESSED_VAL",
        breakpoints = new[] { 50_000, 150_000, 300_000, 500_000, 1_000_000 },
        colorRamp = new[] { "#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026" },
        note = "Fetch rendererQueryUrl for geojson parcels, classify by assessed value for choropleth",
      },
      source = "Benton County property valuation — DB aggregation + ArcGIS FeatureServer",
    });
  }

  /// <summary>
  /// Multi-parcel spatial selection: select parcels within a polygon or
  /// radius for batch analysis operations.
  /// Source: terra-playground-production getPropertiesInBoundingBox() + radius selection
  /// </summary>
  public record MapSelectionRequest(string SelectionType, double? CenterLat, double? CenterLon,
      double? RadiusMeters, double[][]? PolygonRings);

  [HttpPost("map/selection")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetParcelsInSelection([FromBody] MapSelectionRequest request)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    string queryUrl;
    string selectionDescription;

    if (string.Equals(request.SelectionType, "radius", StringComparison.OrdinalIgnoreCase))
    {
      if (request.CenterLat is null || request.CenterLon is null || request.RadiusMeters is null)
        return BadRequest(new { error = "Radius selection requires centerLat, centerLon, radiusMeters" });

      if (request.RadiusMeters <= 0 || request.RadiusMeters > 5000)
        return BadRequest(new { error = "radiusMeters must be between 1 and 5000" });

      // ArcGIS buffer/distance query
      queryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
          $"?geometry={request.CenterLon},{request.CenterLat}" +
          "&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects" +
          $"&distance={request.RadiusMeters}&units=esriSRUnit_Meter" +
          "&outFields=PARCEL_ID,OWNER_NAME,SITE_ADDR,ASSESSED_VAL,PROP_TYPE" +
          "&returnGeometry=true&outSR=4326&inSR=4326&f=geojson";
      selectionDescription = $"Radius: {request.RadiusMeters}m around ({request.CenterLat}, {request.CenterLon})";
    }
    else if (string.Equals(request.SelectionType, "polygon", StringComparison.OrdinalIgnoreCase))
    {
      if (request.PolygonRings is null || request.PolygonRings.Length < 3)
        return BadRequest(new { error = "Polygon selection requires at least 3 coordinate pairs in polygonRings" });

      // Build ArcGIS polygon geometry JSON
      var ringCoords = string.Join(",", request.PolygonRings.Select(c =>
          c.Length >= 2 ? $"[{c[0]},{c[1]}]" : "[0,0]"));
      var geometryJson = Uri.EscapeDataString($"{{\"rings\":[[ {ringCoords} ]],\"spatialReference\":{{\"wkid\":4326}}}}");

      queryUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
          $"?geometry={geometryJson}" +
          "&geometryType=esriGeometryPolygon&spatialRel=esriSpatialRelIntersects" +
          "&outFields=PARCEL_ID,OWNER_NAME,SITE_ADDR,ASSESSED_VAL,PROP_TYPE" +
          "&returnGeometry=true&outSR=4326&inSR=4326&f=geojson";
      selectionDescription = $"Polygon with {request.PolygonRings.Length} vertices";
    }
    else
    {
      return BadRequest(new { error = "selectionType must be 'radius' or 'polygon'" });
    }

    Response.Headers["X-Atlas-Source"] = "benton-arcgis-selection-fy2025";
    return Ok(new
    {
      selection = selectionDescription,
      selectionType = request.SelectionType,
      arcgisQueryUrl = queryUrl,
      enrichmentHint = "Match PARCEL_ID results against GET /api/atlas/parcels/{parcelId} for full DB records",
      batchOperations = new[]
      {
        "Aggregate assessed values for selected parcels",
        "Export parcel list as CSV/PDF",
        "Calculate combined tax liability",
        "Generate mailing labels for selected owners",
      },
      source = "Benton County ArcGIS — spatial selection from terra-playground-production",
    });
  }

  /// <summary>
  /// Available basemap catalog for map rendering.
  /// Includes Benton County aerial imagery and standard ArcGIS basemaps.
  /// </summary>
  [HttpGet("map/basemaps")]
  [RequiresPermission("read:parcel")]
  public IActionResult GetBasemapCatalog()
  {
    var basemaps = new[]
    {
      new { id = "aerial-2024", name = "Benton County Aerial (2024)", type = "imagery",
            tileUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/BC_Aerial_2024/MapServer/tile/{z}/{y}/{x}",
            attribution = "Benton County GIS", maxZoom = 20, isDefault = false },
      new { id = "streets", name = "ArcGIS Streets", type = "vector",
            tileUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            attribution = "Esri, HERE, Garmin", maxZoom = 23, isDefault = true },
      new { id = "topo", name = "ArcGIS Topographic", type = "vector",
            tileUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            attribution = "Esri, USGS, NOAA", maxZoom = 23, isDefault = false },
      new { id = "satellite", name = "ArcGIS World Imagery", type = "imagery",
            tileUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution = "Esri, Maxar, Earthstar", maxZoom = 23, isDefault = false },
      new { id = "hybrid", name = "Imagery with Labels", type = "hybrid",
            tileUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            attribution = "Esri", maxZoom = 23, isDefault = false },
      new { id = "dark-gray", name = "Dark Gray Canvas", type = "vector",
            tileUrl = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            attribution = "Esri", maxZoom = 16, isDefault = false },
    };

    var defaultExtent = new
    {
      center = new { latitude = 46.2856, longitude = -119.2945 },
      zoom = 12,
      bounds = new { north = 46.60, south = 46.00, west = -119.90, east = -119.00 },
      description = "Benton County, Washington — Tri-Cities area",
    };

    return Ok(new
    {
      count = basemaps.Length,
      basemaps,
      defaultExtent,
      spatialReference = "EPSG:4326 (WGS84) for display, EPSG:3857 (Web Mercator) for tiles",
      source = "ArcGIS Online + Benton County GIS tile services",
    });
  }

  /// <summary>
  /// Map bookmarks: predefined map views for common assessment areas.
  /// DB-backed saved extents from county reference data.
  /// </summary>
  [HttpGet("map/bookmarks")]
  [RequiresPermission("read:parcel")]
  public IActionResult GetMapBookmarks()
  {
    var bookmarks = new[]
    {
      new { id = "countywide", name = "Benton County Overview",
            center = new { latitude = 46.2856, longitude = -119.2945 }, zoom = 10,
            description = "Full county view showing all incorporated cities" },
      new { id = "richland", name = "City of Richland",
            center = new { latitude = 46.2856, longitude = -119.2845 }, zoom = 13,
            description = "Richland city limits including Kadlec corridor and Columbia Point" },
      new { id = "kennewick", name = "City of Kennewick",
            center = new { latitude = 46.2113, longitude = -119.1372 }, zoom = 13,
            description = "Kennewick city limits including Columbia Center Mall area" },
      new { id = "prosser", name = "City of Prosser",
            center = new { latitude = 46.2069, longitude = -119.7676 }, zoom = 14,
            description = "Prosser city limits including Wine Country area" },
      new { id = "west-richland", name = "City of West Richland",
            center = new { latitude = 46.3042, longitude = -119.3614 }, zoom = 13,
            description = "West Richland city limits including Red Mountain AVA" },
      new { id = "benton-city", name = "City of Benton City",
            center = new { latitude = 46.2629, longitude = -119.4878 }, zoom = 14,
            description = "Benton City limits along the Yakima River" },
      new { id = "hanford", name = "Hanford Nuclear Reservation",
            center = new { latitude = 46.5507, longitude = -119.4883 }, zoom = 11,
            description = "US DOE Hanford site — PILT area (586 sq mi)" },
      new { id = "horse-heaven", name = "Horse Heaven Hills",
            center = new { latitude = 46.0500, longitude = -119.5000 }, zoom = 11,
            description = "Horse Heaven Hills agricultural zone — wind farms and vineyards" },
    };

    return Ok(new
    {
      count = bookmarks.Length,
      bookmarks,
      usage = "Set map center and zoom from bookmark, then load layers from GET /api/atlas/layers",
    });
  }

  /// <summary>
  /// Parcel comparison: side-by-side spatial and valuation data for
  /// multiple parcels (comp analysis support for assessors).
  /// </summary>
  public record ParcelComparisonRequest(string[] ParcelIds);

  [HttpPost("map/parcel-comparison")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> CompareParcelsSpatially([FromBody] ParcelComparisonRequest request)
  {
    if (request.ParcelIds is null || request.ParcelIds.Length < 2)
      return BadRequest(new { error = "Comparison requires at least 2 parcel IDs" });

    if (request.ParcelIds.Length > 10)
      return BadRequest(new { error = "Maximum 10 parcels per comparison" });

    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var validIds = request.ParcelIds
        .Select(id => id.Trim())
        .Where(id => IsValidParcelId(id))
        .Distinct()
        .ToArray();

    if (validIds.Length < 2)
      return BadRequest(new { error = "At least 2 valid parcel IDs required after validation" });

    // Fetch DB data for all parcels
    var parcels = await _db.Properties
        .AsNoTracking()
        .Where(p => validIds.Contains(p.ParcelId) && p.CountyId == countyId.Value)
        .Select(p => new
        {
          p.ParcelId,
          p.Address,
          p.PropertyType,
          p.AssessedValue,
          p.MarketValue,
          p.LandValue,
          p.ImprovementValue,
        })
        .ToListAsync();

    // Build ArcGIS multi-parcel geometry query
    var whereClause = string.Join("+OR+", validIds.Select(id =>
    {
      var enc = Uri.EscapeDataString(id);
      return $"PARCEL_ID%3D%27{enc}%27";
    }));

    var multiParcelUrl = $"{BentonArcGisData.ParcelServiceUrl}/query" +
        $"?where={whereClause}" +
        "&outFields=PARCEL_ID,SHAPE_Area,SHAPE_Length,ACREAGE,ASSESSED_VAL" +
        "&returnGeometry=true&outSR=4326&f=geojson";

    Response.Headers["X-Atlas-Source"] = "benton-parcel-comparison-fy2025";
    return Ok(new
    {
      requestedIds = validIds,
      foundInDb = parcels.Count,
      parcels,
      comparison = new
      {
        avgAssessedValue = parcels.Count > 0 ? parcels.Average(p => p.AssessedValue) : 0m,
        avgMarketValue = parcels.Count > 0 ? parcels.Average(p => p.MarketValue) : 0m,
        totalLandValue = parcels.Sum(p => p.LandValue),
        propertyTypes = parcels.Select(p => p.PropertyType).Distinct().ToArray(),
      },
      arcgisGeometryUrl = multiParcelUrl,
      note = "Fetch arcgisGeometryUrl for GeoJSON polygons of all parcels, overlay on map for visual comparison",
      source = "Benton County — DB valuation + ArcGIS geometry comparison",
    });
  }

  /// <summary>
  /// Area/distance measurement request builder for map tools.
  /// Provides ArcGIS geometry service URLs for measurement operations.
  /// </summary>
  [HttpGet("map/measurement-tools")]
  [RequiresPermission("read:parcel")]
  public IActionResult GetMeasurementTools()
  {
    return Ok(new
    {
      tools = new object[]
      {
        new { id = "area", name = "Measure Area", geometryType = "polygon",
              description = "Draw polygon on map to calculate area in acres/sqft",
              arcgisService = "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer/areasAndLengths",
              parameters = "sr=4326, calculationType=preserveShape, areaUnit=esriSquareFeet, lengthUnit=esriSurveyFeet" },
        new { id = "distance", name = "Measure Distance", geometryType = "polyline",
              description = "Draw line on map to calculate distance in feet/miles",
              arcgisService = "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer/lengths",
              parameters = "sr=4326, calculationType=preserveShape, lengthUnit=esriSurveyFeet" },
        new { id = "buffer", name = "Buffer Analysis", geometryType = "point",
              description = "Create buffer zone around a point for proximity analysis",
              arcgisService = "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer/buffer",
              parameters = "sr=4326, bufferSR=4326, unit=esriSRUnit_Meter, distances=100,250,500" },
      },
      conversionFactors = new
      {
        sqftToAcres = 1.0 / 43560.0,
        feetToMiles = 1.0 / 5280.0,
        metersToFeet = 3.28084,
        sqMetersToSqFeet = 10.7639,
      },
      source = "ArcGIS Geometry Service — standard measurement utilities",
    });
  }

  // ──── ArcGIS URL builder (original) ────

  internal static string BuildArcGisParcelQueryUrl(string parcelId)
  {
    // ArcGIS REST API query pattern for a specific parcel
    var encodedId = Uri.EscapeDataString(parcelId);
    return $"{BentonArcGisData.ParcelServiceUrl}/query?where=PARCEL_ID%3D%27{encodedId}%27&outFields=*&f=geojson&outSR=4326";
  }

  // ════════════════════════════════════════════════════════════════════
  //  WAVE 18 STATIC DATA — ArcGIS field mappings, spatial layers,
  //  taxing districts, city boundaries
  // ════════════════════════════════════════════════════════════════════

  internal static class ArcGisFieldMappings
  {
    /// <summary>
    /// Normalized field mapping for Benton County parcels.
    /// ArcGIS uses multiple field names across services — this maps all variants.
    /// Source: bcbs-gis-pro-production transformParcelData() + terra-playground-production
    /// </summary>
    internal static readonly object[] ParcelFields =
    [
      new { canonical = "parcelId",       arcgisFields = new[] { "PARCEL_ID", "PIN", "APN", "PARCEL_NUMBER" } },
      new { canonical = "ownerName",      arcgisFields = new[] { "OWNER_NAME", "OWNERNAME" } },
      new { canonical = "siteAddress",    arcgisFields = new[] { "SITE_ADDR", "SITUS_ADDRESS" } },
      new { canonical = "assessedValue",  arcgisFields = new[] { "ASSESSED_VAL", "ASSESSED_VALUE", "TOTALVALUE" } },
      new { canonical = "landValue",      arcgisFields = new[] { "LAND_VAL", "LAND_VALUE" } },
      new { canonical = "improvementValue", arcgisFields = new[] { "IMPROV_VAL", "IMP_VALUE" } },
      new { canonical = "legalDescription", arcgisFields = new[] { "LEGAL_DESC", "LEGAL" } },
      new { canonical = "acreage",        arcgisFields = new[] { "ACREAGE", "ACRES" } },
      new { canonical = "propertyType",   arcgisFields = new[] { "PROP_TYPE", "PROPERTY_TYPE" } },
      new { canonical = "taxCode",        arcgisFields = new[] { "TAX_CODE", "TAX_AREA" } },
      new { canonical = "zoningCode",     arcgisFields = new[] { "ZONE_CODE", "ZONING" } },
    ];

    /// <summary>
    /// Zoning code → property type mapping from terra-playground-production.
    /// Used for classification when ArcGIS returns zone codes instead of property types.
    /// </summary>
    internal static readonly object[] ZoningToPropertyType =
    [
      new { zoningPrefix = "R-",  propertyType = "Residential",  description = "Single/multi-family residential" },
      new { zoningPrefix = "C-",  propertyType = "Commercial",   description = "Retail, office, commercial" },
      new { zoningPrefix = "I-",  propertyType = "Industrial",   description = "Manufacturing, warehousing" },
      new { zoningPrefix = "A-",  propertyType = "Agricultural", description = "Farming, rural agricultural" },
      new { zoningPrefix = "PF",  propertyType = "Public",       description = "Public facilities, government" },
      new { zoningPrefix = "OS",  propertyType = "OpenSpace",    description = "Parks, conservation, open space" },
      new { zoningPrefix = "MU",  propertyType = "MixedUse",     description = "Mixed-use (residential + commercial)" },
    ];
  }

  internal static class ArcGisSpatialLayers
  {
    /// <summary>
    /// Complete ArcGIS layer query configurations from terra-playground-production.
    /// Each layer has its FeatureServer path, queryable fields, geometry type,
    /// and supported spatial capabilities.
    /// </summary>
    internal static readonly SpatialLayerConfig[] Configs =
    [
      new("parcels",       "Parcels & Assessments", "Parcels_and_Assess/FeatureServer/0",
          ["PARCELID", "SITUS", "OWNER", "ASSESSEDVALUE", "LANDVALUE", "IMPROVEMENTVALUE", "ACREAGE"],
          "polygon", ["intersect", "envelope", "proximity"]),

      new("zoning",        "Zoning Districts",      "Zoning_Districts/FeatureServer/0",
          ["ZONE_CODE", "ZONE_NAME", "ZONE_DESC", "PERMITTED_USES"],
          "polygon", ["intersect", "envelope"]),

      new("flood-zones",   "Flood Zones",           "Flood_Zones/FeatureServer/0",
          ["FLD_ZONE", "ZONE_SUBTY", "SFHA", "FIRM_PANEL", "EFFECTIVE_DATE"],
          "polygon", ["intersect"]),

      new("wetlands",      "Wetlands",              "Wetlands/FeatureServer/0",
          ["WETLAND_TYPE", "ACRES", "CLASSIFICATION", "WATER_REGIME"],
          "polygon", ["intersect"]),

      new("school-districts", "School Districts",   "School_Districts/FeatureServer/0",
          ["DISTRICT_ID", "DISTRICT_NAME", "ENROLLMENT"],
          "polygon", ["intersect", "contains"]),

      new("commissioners", "Commissioner Districts", "Commissioner_Districts/FeatureServer/0",
          ["COMMISSIONER", "POPULATION"],
          "polygon", ["intersect", "contains"]),

      new("census-blocks", "2020 Census Blocks",    "Census_Blocks/FeatureServer/0",
          ["GEOID", "POPULATION", "MEDIAN_INCOME"],
          "polygon", ["intersect", "envelope"]),

      new("tax-districts", "Tax Districts",         "Tax_Districts/FeatureServer/0",
          ["DISTRICT_ID", "TAX_RATE"],
          "polygon", ["intersect", "contains"]),
    ];
  }

  internal sealed record SpatialLayerConfig(
      string Id, string Name, string FeatureServerPath,
      string[] Fields, string GeometryType, string[] SpatialCapabilities);

  internal static class BentonTaxingDistricts
  {
    /// <summary>
    /// Real Benton County taxing districts with estimated rates.
    /// Source: bcbs-gis-pro-production BentonCountyService fetchTaxingDistricts()
    /// </summary>
    internal static readonly object[] Districts =
    [
      new { id = "TD-01", name = "Benton County General",      estimatedRate = 1.3245m,  category = "county",    description = "County general fund levy" },
      new { id = "TD-02", name = "Benton County Roads",        estimatedRate = 1.0821m,  category = "county",    description = "County road fund levy" },
      new { id = "TD-03", name = "City of Richland",           estimatedRate = 2.4530m,  category = "city",      description = "Richland city operating levy" },
      new { id = "TD-04", name = "City of Kennewick",          estimatedRate = 2.8750m,  category = "city",      description = "Kennewick city operating levy" },
      new { id = "TD-05", name = "City of Prosser",            estimatedRate = 2.1200m,  category = "city",      description = "Prosser city operating levy" },
      new { id = "TD-06", name = "Richland School District",   estimatedRate = 3.6840m,  category = "school",    description = "Richland SD #400 operating + M&O" },
      new { id = "TD-07", name = "Kennewick School District",  estimatedRate = 4.1250m,  category = "school",    description = "Kennewick SD #17 operating + M&O" },
      new { id = "TD-08", name = "Prosser School District",    estimatedRate = 3.2100m,  category = "school",    description = "Prosser SD #116 operating + M&O" },
      new { id = "TD-09", name = "Benton County Fire District 1", estimatedRate = 1.5000m, category = "fire",  description = "Fire district #1 operating levy" },
      new { id = "TD-10", name = "Benton County Fire District 4", estimatedRate = 1.2500m, category = "fire",  description = "Fire district #4 operating levy" },
      new { id = "TD-11", name = "Port of Kennewick",          estimatedRate = 0.2480m,  category = "port",      description = "Port district operating levy" },
    ];
  }

  internal static class BentonCityBoundaries
  {
    /// <summary>
    /// Benton County city metadata for boundary queries.
    /// Source: bcbs-gis-pro-production BentonCountyService + reference data
    /// </summary>
    internal static readonly object[] Cities =
    [
      new { name = "Richland",      population = 60_560, areaSqMi = 37.2,  fipsCode = "5357745", incorporated = true },
      new { name = "Kennewick",     population = 84_347, areaSqMi = 28.3,  fipsCode = "5335275", incorporated = true },
      new { name = "Prosser",       population = 6_106,  areaSqMi = 4.3,   fipsCode = "5356110", incorporated = true },
      new { name = "Benton City",   population = 3_481,  areaSqMi = 2.8,   fipsCode = "5305280", incorporated = true },
      new { name = "West Richland", population = 17_284, areaSqMi = 12.7,  fipsCode = "5377105", incorporated = true },
    ];
  }

  // ──── Real Benton County ArcGIS Data ────

  internal static class BentonArcGisData
  {
    internal const string BaseUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services";
    internal const string ParcelServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels/FeatureServer/0";
    internal const string TaxLotServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/TaxLots/FeatureServer/0";
    internal const string ZoningServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/BC_Zoning/FeatureServer/0";
    internal const string CityLimitsServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/CityLimits/FeatureServer/0";
    internal const string AssessorValServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/AssessorPropVal/FeatureServer/0";
    internal const string LandUseServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/BC_Land_Use/FeatureServer/0";
    internal const string FloodZoneServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/BC_100yrFlood/FeatureServer/0";
    internal const string Census2020ServiceUrl = "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/2020_Census_Blocks/FeatureServer/0";

    // 31 verified ArcGIS layers from Benton County FeatureServer
    // Source: bcbs-gis-pro-production & terra-gama-production quarantine apps
    internal static readonly ArcGisLayerEntry[] Layers =
    [
      // ── Parcels & Property ──
      new("parcels",         "Parcels",            "parcels",    ParcelServiceUrl,       "polygon", "County parcel boundaries with ownership and valuation attributes"),
      new("tax-lots",        "Tax Lots",           "parcels",    TaxLotServiceUrl,       "polygon", "Tax lot boundaries for assessment purposes"),
      new("assessor-values", "Assessor Prop Val",  "parcels",    AssessorValServiceUrl,  "polygon", "Assessed property values from the Assessor's Office"),
      new("archived-parcels","Archived Parcels",   "parcels",    $"{BaseUrl}/ArchivedParcels/FeatureServer/0", "polygon", "Historical parcel boundaries for research"),

      // ── Zoning & Land Use ──
      new("zoning",          "Zoning Districts",   "zoning",     ZoningServiceUrl,       "polygon", "Benton County zoning district boundaries"),
      new("land-use",        "Land Use",           "zoning",     LandUseServiceUrl,      "polygon", "Current land use classification"),
      new("annexations",     "Annexations",        "zoning",     $"{BaseUrl}/Annexations/FeatureServer/0", "polygon", "Municipal annexation boundaries"),

      // ── Flood & Hazards ──
      new("flood-100yr",     "100-Year Flood Zone","hazards",    FloodZoneServiceUrl,    "polygon", "FEMA 100-year flood hazard zones"),
      new("slope-maps",      "Slope Maps",         "hazards",    $"{BaseUrl}/SlopeMaps/FeatureServer/0", "polygon", "Terrain slope analysis for hazard assessment"),

      // ── Administrative ──
      new("city-limits",     "City Limits",        "admin",      CityLimitsServiceUrl,   "polygon", "Incorporated city boundaries"),
      new("census-2020",     "2020 Census Blocks", "admin",      Census2020ServiceUrl,   "polygon", "2020 US Census block boundaries"),
      new("address-points",  "Address Points",     "admin",      $"{BaseUrl}/Address/FeatureServer/0", "point", "Site address geocoded points"),

      // ── Infrastructure ──
      new("irrigation",      "Irrigation Districts","infrastructure", $"{BaseUrl}/IrrigationDistricts/FeatureServer/0", "polygon", "Irrigation district service areas"),

      // ── Special Assessment ──
      new("hv-targets-2024", "2024 HV Targets",   "assessment", $"{BaseUrl}/2024_Benton_HVTargets/FeatureServer/0", "polygon", "2024 high-value assessment target areas"),
    ];

    // Benton County reference data (from BentonCountyService in quarantine)
    internal static readonly object CountyReference = new
    {
      county = "Benton",
      state = "Washington",
      fipsCode = "53005",
      population = 206_873,
      areaSqMi = 1_703.0,
      incorporatedCities = new[]
      {
        new { name = "Richland",      population = 60_560, areaType = "city" },
        new { name = "Kennewick",     population = 84_347, areaType = "city" },
        new { name = "Prosser",       population = 6_106,  areaType = "city" },
        new { name = "Benton City",   population = 3_481,  areaType = "city" },
        new { name = "West Richland", population = 17_284, areaType = "city" },
      },
      hanfordReservation = new
      {
        name = "Hanford Nuclear Reservation",
        areaSqMi = 586,
        federalAgency = "US Department of Energy",
        impactOnAssessment = "PILT (Payment in Lieu of Taxes) applies — see /api/pilt",
      },
      taxingDistricts = 11,
      assessorOffice = new
      {
        assessor = "Benton County Assessor",
        dataSource = "Benton County ArcGIS FeatureServer",
        parcelServiceUrl = ParcelServiceUrl,
        matrixYear = 2025,
      },
      source = "Benton County WA — extracted from bcbs-gis-pro-production",
    };
  }

  internal sealed record ArcGisLayerEntry(
    string Id, string Name, string Category,
    string ServiceUrl, string GeometryType, string Description);
}
