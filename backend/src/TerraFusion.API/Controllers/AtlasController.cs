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

    private ActionResult BuildPostR1DisabledResponse(string operation, string featureName, string detail, string problemType)
    {
        HttpContext.Response.Headers["X-R1-Scope"] = "Post-R1";

        _logger.LogWarning(
            "Atlas endpoint {Operation} was invoked, but {FeatureName} remains Post-R1 and is intentionally disabled",
            operation,
            featureName);

        var problem = new ProblemDetails
        {
            Title = $"{featureName} is not enabled for R1",
            Detail = detail,
            Status = StatusCodes.Status501NotImplemented,
            Type = $"https://terrafusion.local/problems/{problemType}"
        };

        problem.Extensions["scope"] = "Post-R1";
        problem.Extensions["operation"] = operation;
        problem.Extensions["feature"] = featureName;

        return StatusCode(StatusCodes.Status501NotImplemented, problem);
    }

    // ── Post-R1 Atlas Suite Carve-Outs ──────────────────────────────

    [HttpGet("layers")]
    [RequiresPermission("read:parcel")]
    public IActionResult GetLayers()
    {
        return BuildPostR1DisabledResponse(
            nameof(GetLayers),
            "Atlas layer catalog",
            "The current Atlas backend only supports per-parcel layer truth for R1. The broader layer catalog API is intentionally disabled until a real GIS implementation ships.",
            "atlas-layer-catalog-post-r1");
    }

    [HttpPost("parcels/search")]
    [RequiresPermission("read:parcel")]
    public IActionResult SearchParcels([FromBody] object? request)
    {
        return BuildPostR1DisabledResponse(
            nameof(SearchParcels),
            "Atlas parcel search",
            "The current Atlas backend only supports parcel-specific truth for R1. The broader parcel search API is intentionally disabled until a real GIS/search implementation ships.",
            "atlas-parcel-search-post-r1");
    }

    [HttpGet("zoning")]
    [RequiresPermission("read:parcel")]
    public IActionResult GetZoningDistricts()
    {
        return BuildPostR1DisabledResponse(
            nameof(GetZoningDistricts),
            "Atlas zoning overlays",
            "The current Atlas backend does not ship zoning overlay datasets in strict R1. This route is intentionally disabled until a real GIS overlay implementation ships.",
            "atlas-zoning-post-r1");
    }

    [HttpGet("flood-zones")]
    [RequiresPermission("read:parcel")]
    public IActionResult GetFloodZones()
    {
        return BuildPostR1DisabledResponse(
            nameof(GetFloodZones),
            "Atlas flood zones",
            "The current Atlas backend does not ship flood-zone overlays in strict R1. This route is intentionally disabled until a real GIS overlay implementation ships.",
            "atlas-flood-zones-post-r1");
    }

    [HttpGet("stats")]
    [RequiresPermission("read:parcel")]
    public IActionResult GetStats()
    {
        return BuildPostR1DisabledResponse(
            nameof(GetStats),
            "Atlas spatial stats",
            "The current Atlas backend does not ship a county-wide GIS stats API in strict R1. This route is intentionally disabled until a real GIS implementation ships.",
            "atlas-stats-post-r1");
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
