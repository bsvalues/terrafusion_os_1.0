using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Field inspection assignment management — backed by QueueItems (TaskType = FIELD_INSPECTION).
///
/// Endpoints:
///   GET  /api/field/assignments          — list active assignments (enriched with GIS + Properties)
///   POST /api/field/assignments          — create assignments for a batch of parcels
///   PATCH /api/field/assignments/{id}/status — advance assignment lifecycle
///
/// Write-lane owner: Dais (field operations).
/// Human review required before any assignment reaches "completed" status.
/// </summary>
[ApiController]
[Route("api/field")]
[AllowAnonymous]
public class FieldController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<FieldController> _logger;

    public FieldController(TerraFusionDbContext db, ILogger<FieldController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Returns field inspection assignments from the work queue.
    /// Enriched with parcel address and coordinates from GIS + Properties tables.
    ///
    /// By default excludes completed/failed assignments.
    /// Pass all=true to include the full history.
    /// Pass status= to filter by exact status.
    /// Pass assigneeId= to filter to a specific officer.
    /// </summary>
    [HttpGet("assignments")]
    public async Task<IActionResult> GetAssignments(
        [FromQuery] string? assigneeId = null,
        [FromQuery] string? status = null,
        [FromQuery] bool all = false)
    {
        try
        {
            var q = _db.QueueItems
                .AsNoTracking()
                .Where(qi => qi.TaskType == "FIELD_INSPECTION");

            if (!string.IsNullOrWhiteSpace(assigneeId))
                q = q.Where(qi => qi.AssignedTo == assigneeId);

            if (!string.IsNullOrWhiteSpace(status))
                q = q.Where(qi => qi.Status == status);
            else if (!all)
                q = q.Where(qi => qi.Status != "completed" && qi.Status != "failed");

            var items = await q
                .OrderBy(qi => qi.Priority == "urgent" ? 0 : qi.Priority == "high" ? 1 : 2)
                .ThenBy(qi => qi.SlaDeadline)
                .ThenBy(qi => qi.CreatedAt)
                .Take(100)
                .Select(qi => new
                {
                    qi.Id,
                    qi.ParcelId,
                    qi.Priority,
                    qi.Status,
                    qi.AssignedTo,
                    qi.SlaDeadline,
                    qi.Notes,
                    qi.CreatedAt,
                    qi.StartedAt,
                    qi.CompletedAt,
                })
                .ToListAsync();

            if (!items.Any())
                return Ok(new { assignments = Array.Empty<object>() });

            var parcelIds = items.Select(i => i.ParcelId).Distinct().ToList();

            // GIS enrichment: address + coordinates
            var gis = await _db.GisParcelGeometries
                .AsNoTracking()
                .Where(g => parcelIds.Contains(g.ParcelId))
                .Select(g => new { g.ParcelId, g.CentroidLat, g.CentroidLng, g.SitusAddress })
                .ToListAsync();

            var gisMap = gis
                .GroupBy(g => g.ParcelId)
                .ToDictionary(g => g.Key, g => g.First());

            // Properties enrichment: address fallback + assessed value
            var props = await _db.Properties
                .AsNoTracking()
                .Where(p => p.ParcelNumber != null && parcelIds.Contains(p.ParcelNumber))
                .Select(p => new { p.ParcelNumber, p.Address, p.City, p.AssessedValue })
                .ToListAsync();

            var propsMap = props
                .GroupBy(p => p.ParcelNumber!)
                .ToDictionary(g => g.Key, g => g.First());

            var assignments = items.Select(qi =>
            {
                gisMap.TryGetValue(qi.ParcelId, out var g);
                propsMap.TryGetValue(qi.ParcelId, out var p);

                return (object)new
                {
                    id = qi.Id.ToString(),
                    parcelId = qi.ParcelId,
                    parcelNumber = qi.ParcelId,
                    address = g?.SitusAddress ?? p?.Address ?? "",
                    city = p?.City ?? "",
                    latitude = g?.CentroidLat,
                    longitude = g?.CentroidLng,
                    currentValue = (decimal?)p?.AssessedValue,
                    propertyClass = "",
                    priority = qi.Priority,
                    // Map "queued" → "assigned" for the frontend FieldAssignment status enum
                    status = qi.Status == "queued" ? "assigned" : qi.Status,
                    assignedTo = qi.AssignedTo,
                    slaDeadline = qi.SlaDeadline,
                    notes = qi.Notes,
                    assignedAt = qi.CreatedAt.ToString("O"),
                    startedAt = qi.StartedAt?.ToString("O"),
                    completedAt = qi.CompletedAt?.ToString("O"),
                    inspectedAt = qi.CompletedAt?.ToString("O"),
                };
            }).ToList();

            return Ok(new { assignments });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving field assignments");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Creates field inspection assignments for a batch of parcels.
    /// Each parcel number becomes a QueueItem with TaskType=FIELD_INSPECTION.
    /// SlaDeadline is computed from SlaHours if provided.
    /// </summary>
    [HttpPost("assignments")]
    public async Task<IActionResult> CreateAssignments([FromBody] CreateFieldAssignmentsRequest req)
    {
        if (req.ParcelNumbers == null || req.ParcelNumbers.Count == 0)
            return BadRequest(new { message = "ParcelNumbers is required" });

        try
        {
            var now = DateTime.UtcNow;
            var items = req.ParcelNumbers.Select(pn => new QueueItem
            {
                Id = Guid.NewGuid(),
                ParcelId = pn,
                TaskType = "FIELD_INSPECTION",
                Priority = req.Priority ?? "normal",
                Status = "queued",
                AssignedTo = req.AssigneeId,
                Notes = req.Notes,
                SlaHours = req.SlaHours,
                SlaDeadline = req.SlaHours.HasValue ? now.AddHours(req.SlaHours.Value) : (DateTime?)null,
                CountyId = req.CountyId ?? Guid.Empty,
                CreatedAt = now,
                UpdatedAt = now,
            }).ToList();

            _db.QueueItems.AddRange(items);
            await _db.SaveChangesAsync();

            return Ok(new { created = items.Count, ids = items.Select(i => i.Id) });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating field assignments");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Updates the lifecycle status of a field assignment.
    /// Sets StartedAt on first transition to in_progress.
    /// Sets CompletedAt on completed or failed.
    /// Human sign-off on "completed" is enforced at the UI layer.
    /// </summary>
    [HttpPatch("assignments/{id}/status")]
    public async Task<IActionResult> UpdateAssignmentStatus(Guid id, [FromBody] UpdateFieldStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Status))
            return BadRequest(new { message = "Status is required" });

        try
        {
            var item = await _db.QueueItems.FindAsync(id);
            if (item == null) return NotFound();

            item.Status = req.Status;
            item.UpdatedAt = DateTime.UtcNow;

            if (req.Status == "in_progress" && item.StartedAt == null)
                item.StartedAt = DateTime.UtcNow;

            if (req.Status is "completed" or "failed")
                item.CompletedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating assignment status {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}

public record CreateFieldAssignmentsRequest(
    List<string>? ParcelNumbers,
    string? AssigneeId,
    string? Priority,
    string? Notes,
    int? SlaHours,
    Guid? CountyId);

public record UpdateFieldStatusRequest(string Status);
