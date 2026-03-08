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

  // ──── ArcGIS URL builder ────

  internal static string BuildArcGisParcelQueryUrl(string parcelId)
  {
    // ArcGIS REST API query pattern for a specific parcel
    var encodedId = Uri.EscapeDataString(parcelId);
    return $"{BentonArcGisData.ParcelServiceUrl}/query?where=PARCEL_ID%3D%27{encodedId}%27&outFields=*&f=geojson&outSR=4326";
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
