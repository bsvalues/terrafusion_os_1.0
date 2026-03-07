using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
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
  private readonly Data.TerraFusionDbContext _db;
  private readonly ILogger<AtlasController> _logger;
  private readonly IAtlasService _atlasService;

  public AtlasController(Data.TerraFusionDbContext db, ILogger<AtlasController> logger, IAtlasService atlasService)
  {
    _db = db;
    _logger = logger;
    _atlasService = atlasService;
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

  // ── R2 Atlas Endpoints (real Benton County GIS data) ─────────────

  [HttpGet("layers")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetLayers()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var layers = await _atlasService.GetLayersAsync(countyId.Value);
    return Ok(new { layers });
  }

  [HttpPost("parcels/search")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> SearchParcels([FromBody] AtlasParcelSearchRequest? request)
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    request ??= new AtlasParcelSearchRequest();
    var result = await _atlasService.SearchParcelsAsync(request, countyId.Value);
    return Ok(result);
  }

  [HttpGet("zoning")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetZoningDistricts()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var districts = await _atlasService.GetZoningDistrictsAsync(countyId.Value);
    return Ok(new { districts });
  }

  [HttpGet("flood-zones")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetFloodZones()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var zones = await _atlasService.GetFloodZonesAsync(countyId.Value);
    return Ok(new { zones });
  }

  [HttpGet("stats")]
  [RequiresPermission("read:parcel")]
  public async Task<IActionResult> GetStats()
  {
    var countyId = await ResolveCountyIdAsync();
    if (countyId is null)
      return Forbid();

    var stats = await _atlasService.GetSpatialStatsAsync(countyId.Value);
    return Ok(stats);
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

    var result = await _atlasService.GetParcelGeometryAsync(parcelId, countyId.Value);
    if (result is null)
      return NotFound(new { error = "Parcel not found" });

    return Ok(result);
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

    var layers = await _atlasService.GetParcelLayersAsync(parcelId, countyId.Value);
    if (layers.Count == 0)
      return NotFound(new { error = "Parcel not found" });

    return Ok(new { parcelId, layers });
  }
}
