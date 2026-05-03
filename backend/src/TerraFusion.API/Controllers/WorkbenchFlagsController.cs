using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using TerraFusion.API.Security;
using TerraFusion.Core.Entities;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Supervisor queue for PropertyWorkbenchFlags.
/// Flags are created by FieldController (PENDING_REVIEW) and ForgeController (RECONCILIATION_PENDING).
/// Supervisors use PATCH /{id}/status to approve or reject.
/// </summary>
[ApiController]
[Route("api/workbench/flags")]
[Authorize]
public class WorkbenchFlagsController : ControllerBase
{
    private readonly DataDbContext _db;
    private readonly ILogger<WorkbenchFlagsController> _logger;

    public WorkbenchFlagsController(DataDbContext db, ILogger<WorkbenchFlagsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/workbench/flags
    /// Returns paginated flags filterable by status and parcelId.
    /// Supervisors poll this to see what needs action.
    /// Default: all non-terminal statuses (PENDING_REVIEW, RECONCILIATION_PENDING).
    /// </summary>
    [HttpGet]
    [RequiresPermission("access:dais")]
    [ProducesResponseType(typeof(FlagPageResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListFlags(
        [FromQuery] string? status,
        [FromQuery] string? parcelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 25;

        var query = _db.PropertyWorkbenchFlags.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(parcelId))
            query = query.Where(f => f.ParcelId == parcelId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            // Allow comma-separated list: "PENDING_REVIEW,RECONCILIATION_PENDING"
            var statuses = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            query = query.Where(f => statuses.Contains(f.Status));
        }
        else
        {
            // Default: open/actionable flags
            query = query.Where(f => f.Status == "PENDING_REVIEW" || f.Status == "RECONCILIATION_PENDING");
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FlagSummary
            {
                Id = f.Id,
                ParcelId = f.ParcelId,
                Status = f.Status,
                Reason = f.Reason,
                CreatedAt = f.CreatedAt,
                CreatedBy = f.CreatedBy,
                UpdatedAt = f.UpdatedAt,
                UpdatedBy = f.UpdatedBy,
            })
            .ToListAsync(ct);

        return Ok(new FlagPageResult
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            Items = items,
        });
    }

    /// <summary>
    /// GET /api/workbench/flags/{id}
    /// Returns a single flag by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [RequiresPermission("access:dais")]
    [ProducesResponseType(typeof(FlagSummary), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFlag(int id, CancellationToken ct)
    {
        var flag = await _db.PropertyWorkbenchFlags
            .AsNoTracking()
            .Where(f => f.Id == id)
            .Select(f => new FlagSummary
            {
                Id = f.Id,
                ParcelId = f.ParcelId,
                Status = f.Status,
                Reason = f.Reason,
                CreatedAt = f.CreatedAt,
                CreatedBy = f.CreatedBy,
                UpdatedAt = f.UpdatedAt,
                UpdatedBy = f.UpdatedBy,
            })
            .FirstOrDefaultAsync(ct);

        if (flag is null) return NotFound(new { error = $"Flag {id} not found." });
        return Ok(flag);
    }

    /// <summary>
    /// PATCH /api/workbench/flags/{id}/status
    /// Supervisor resolves a flag: APPROVED or REJECTED.
    /// Appends supervisorNote to the existing Reason JSON blob.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [RequiresPermission("access:dais")]
    [ProducesResponseType(typeof(FlagResolutionResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveFlag(
        int id,
        [FromBody] FlagResolutionRequest request,
        CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var allowed = new[] { "APPROVED", "REJECTED" };
        if (!allowed.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { error = "Status must be APPROVED or REJECTED." });

        var flag = await _db.PropertyWorkbenchFlags.FindAsync(new object[] { id }, ct);
        if (flag is null) return NotFound(new { error = $"Flag {id} not found." });

        var supervisorId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name ?? "supervisor";

        flag.Status = request.Status.ToUpperInvariant();
        flag.UpdatedAt = DateTime.UtcNow;
        flag.UpdatedBy = supervisorId;

        // Append supervisorNote to the JSON reason blob without overwriting original
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(flag.Reason);
            var root = doc.RootElement.Clone();
            var dict = new Dictionary<string, object?>();
            foreach (var prop in root.EnumerateObject())
                dict[prop.Name] = prop.Value.Clone();
            dict["supervisorNote"] = request.SupervisorNote;
            dict["resolvedBy"] = supervisorId;
            dict["resolvedAt"] = DateTime.UtcNow.ToString("O");
            flag.Reason = System.Text.Json.JsonSerializer.Serialize(dict);
        }
        catch
        {
            // Reason was plain text — append note as suffix
            flag.Reason = $"{flag.Reason} | Supervisor: {request.SupervisorNote}";
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Flag {FlagId} parcel {ParcelId} resolved to {Status} by {Supervisor}",
            flag.Id, flag.ParcelId, flag.Status, supervisorId);

        return Ok(new FlagResolutionResult
        {
            Id = flag.Id,
            ParcelId = flag.ParcelId,
            Status = flag.Status,
            ResolvedBy = supervisorId,
            ResolvedAt = flag.UpdatedAt,
        });
    }
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

public record FlagSummary
{
    public int Id { get; init; }
    public string ParcelId { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime UpdatedAt { get; init; }
    public string UpdatedBy { get; init; } = string.Empty;
}

public record FlagPageResult
{
    public int Total { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public List<FlagSummary> Items { get; init; } = [];
}

public record FlagResolutionRequest
{
    [Required]
    public string Status { get; init; } = string.Empty;

    [StringLength(500)]
    public string? SupervisorNote { get; init; }
}

public record FlagResolutionResult
{
    public int Id { get; init; }
    public string ParcelId { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string ResolvedBy { get; init; } = string.Empty;
    public DateTime ResolvedAt { get; init; }
}
