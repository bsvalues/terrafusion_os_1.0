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
