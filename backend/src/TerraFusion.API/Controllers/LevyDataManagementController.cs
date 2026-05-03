using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-023: Levy data management operations.
/// Ports a subset of <c>routes_data_management.py</c> (15 Flask routes) — currently
/// PARTIAL_BLOCKED. See <c>docs/levy/port-audit/gap-matrix.md</c> for the per-route status.
/// <para>
/// Endpoints that have required schema and utility ports are wired against
/// <see cref="LevyDbContext"/>. Endpoints whose dependencies are missing return
/// <c>501 Not Implemented</c> with a structured payload naming the blocker — we
/// refuse to return fake success bodies.
/// </para>
/// <para>Unblock conditions for the remaining endpoints:</para>
/// <list type="bullet">
///   <item><description><b>Tax codes</b>: no <c>TaxCode</c> entity exists in the .NET schema; needs migration.</description></item>
///   <item><description><b>Import / Export / history / preview</b>: no <c>ImportLog</c> / <c>ExportLog</c> entities and no port of <c>utils/import_utils.py</c> + <c>utils/district_utils.py</c>.</description></item>
/// </list>
/// </summary>
[ApiController]
[Route("api/levy/data")]
[Authorize]
public class LevyDataManagementController : ControllerBase
{
    private readonly LevyDbContext _db;
    private readonly ILogger<LevyDataManagementController> _logger;

    public LevyDataManagementController(
        LevyDbContext db,
        ILogger<LevyDataManagementController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private IActionResult NotImplementedYet(string operation, string blockedBy)
    {
        _logger.LogInformation(
            "LEV-023: {Operation} requested but not yet implemented (blocked by {BlockedBy})",
            operation, blockedBy);
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            success = false,
            error = "not_implemented",
            operation,
            blockedBy,
            tracker = "docs/levy/port-audit/gap-matrix.md (routes_data_management.py)",
        });
    }

    /// <summary>Import levy data from an uploaded file.</summary>
    [HttpPost("import")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Import([FromForm] IFormFile? file, [FromQuery] string? format) =>
        NotImplementedYet("import", "ImportLog entity + utils/import_utils.py port");

    /// <summary>Export levy data for the current county.</summary>
    [HttpGet("export")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Export([FromQuery] string? format, [FromQuery] int? year) =>
        NotImplementedYet("export", "ExportLog entity + export utility port");

    /// <summary>
    /// List all tax districts (optional county + name/code search).
    /// Ports Flask <c>GET /data/tax-districts</c>.
    /// </summary>
    [HttpGet("districts")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDistricts(
        [FromQuery] string? search,
        [FromQuery] string? county,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 500);

        IQueryable<District> q = _db.Districts.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(county))
        {
            q = q.Where(d => d.CountyId == county);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(d =>
                EF.Functions.ILike(d.Name, $"%{s}%") ||
                EF.Functions.ILike(d.DistrictCode, $"%{s}%"));
        }

        var items = await q
            .OrderBy(d => d.CountyId)
            .ThenBy(d => d.DistrictCode)
            .Take(take)
            .Select(d => new
            {
                id = d.Id,
                countyId = d.CountyId,
                districtCode = d.DistrictCode,
                name = d.Name,
                districtType = d.DistrictType,
                totalAssessedValue = d.TotalAssessedValue,
                parcelCount = d.ParcelCount,
                isActive = d.IsActive,
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            success = true,
            count = items.Count,
            items,
        });
    }

    /// <summary>
    /// Get a single district by Id. Ports Flask <c>GET /data/tax-districts/&lt;id&gt;</c>.
    /// </summary>
    [HttpGet("districts/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDistrictById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var district = await _db.Districts
            .AsNoTracking()
            .Where(d => d.Id == id)
            .Select(d => new
            {
                id = d.Id,
                countyId = d.CountyId,
                districtCode = d.DistrictCode,
                name = d.Name,
                description = d.Description,
                districtType = d.DistrictType,
                totalAssessedValue = d.TotalAssessedValue,
                parcelCount = d.ParcelCount,
                isActive = d.IsActive,
                createdAt = d.CreatedAt,
                updatedAt = d.UpdatedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (district is null)
        {
            return NotFound(new { success = false, error = "district_not_found", id });
        }

        return Ok(new { success = true, district });
    }

    /// <summary>List all tax codes for the current county.</summary>
    [HttpGet("tax-codes")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTaxCodes([FromQuery] string? districtId) =>
        NotImplementedYet("tax-codes.list", "TaxCode entity (no .NET schema)");
}
