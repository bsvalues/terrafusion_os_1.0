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
}
