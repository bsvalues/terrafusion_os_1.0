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

    // ── GET /api/atlas/parcels/{parcelId}/nearby ──────────────────────
    // R2 Wave 2: Nearby parcels search (same county, optional type filter)

    /// <summary>
    /// Return nearby parcels in the same county.
    /// Uses property-type matching and parcel-ID prefix proximity
    /// as a heuristic until full GIS geometry is available.
    /// County isolation enforced.
    /// </summary>
    [HttpGet("parcels/{parcelId}/nearby")]
    [RequiresPermission("read:parcel")]
    public async Task<IActionResult> GetNearbyParcels(
        string parcelId,
        [FromQuery] string? propertyType = null,
        [FromQuery] int limit = 10)
    {
        parcelId = parcelId.Trim();
        if (!IsValidParcelId(parcelId))
            return BadRequest(new { error = "Invalid parcelId format" });

        limit = Math.Clamp(limit, 1, 50);

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

        // Heuristic proximity: parcels sharing a prefix (common in county numbering)
        var prefix = parcelId.Length >= 4 ? parcelId[..4] : parcelId;
        var effectiveType = propertyType ?? subject.PropertyType;

        var query = _db.Properties
            .AsNoTracking()
            .Where(p => p.CountyId == countyId.Value && p.ParcelId != parcelId);

        if (!string.IsNullOrWhiteSpace(effectiveType))
            query = query.Where(p => p.PropertyType == effectiveType);

        // Prefer parcels with same prefix (neighbors in numbering scheme)
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
            gisProximity = false, // R2: no GIS geometry yet, prefix-based heuristic
            parcels = nearby,
        });
    }

    // ── GET /api/atlas/layers/{layerId} ───────────────────────────────
    // R2 Wave 2: Layer metadata detail

    /// <summary>
    /// Return metadata for a specific map layer.
    /// Static layer catalog for R2 — real tile/WMS sources deferred to R3.
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
