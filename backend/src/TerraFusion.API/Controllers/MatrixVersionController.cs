using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class MatrixVersionController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ICalibrationMemoService _memoService;
    private readonly IGovernanceExportService _exportService;
    private readonly ILogger<MatrixVersionController> _logger;

    public MatrixVersionController(
        TerraFusionDbContext db,
        ICalibrationMemoService memoService,
        IGovernanceExportService exportService,
        ILogger<MatrixVersionController> logger)
    {
        _db = db;
        _memoService = memoService;
        _exportService = exportService;
        _logger = logger;
    }

    [HttpGet]
    public async System.Threading.Tasks.Task<IActionResult> GetAll([FromQuery] Guid? countyId)
    {
        var q = _db.MatrixVersions.Include(v => v.EvidenceAges).AsNoTracking();
        if (countyId.HasValue) q = q.Where(v => v.CountyId == countyId.Value);
        var versions = await q.OrderByDescending(v => v.CreatedAt).ToListAsync();
        return Ok(versions);
    }

    [HttpGet("{id:int}")]
    public async System.Threading.Tasks.Task<IActionResult> Get(int id)
    {
        var v = await _db.MatrixVersions
            .Include(v => v.EvidenceAges)
            .Include(v => v.Findings)
            .Include(v => v.CalibrationMemo)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id);
        return v is null ? NotFound() : Ok(v);
    }

    // Well-known Benton County GUID — used when the frontend doesn't supply one
    private static readonly Guid BentonCountyId = new("00000000-0000-0000-0000-000000000001");

    [HttpPost]
    public async System.Threading.Tasks.Task<IActionResult> Create([FromBody] CreateMatrixVersionRequest req)
    {
        var countyId = req.CountyId ?? BentonCountyId;

        var exists = await _db.MatrixVersions
            .AnyAsync(v => v.CountyId == countyId && v.Version == req.Version);
        if (exists) return Conflict($"Version {req.Version} already exists for this county.");

        var version = new MatrixVersion
        {
            CountyId = countyId,
            Version = req.Version,
            Status = "DRAFT",
            VersionType = req.VersionType ?? "CALIBRATED",
            TriggeringEvent = req.TriggeringEvent,
            SalesWindowStart = req.SalesWindowStart,
            SalesWindowEnd = req.SalesWindowEnd,
            ParentVersionId = req.ParentVersionId,
            RateSnapshot = req.RateSnapshot ?? SeedRateSnapshot(),
            CreatedBy = User.Identity?.Name ?? "system",
            UpdatedBy = User.Identity?.Name ?? "system",
        };

        _db.MatrixVersions.Add(version);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Created MatrixVersion {Version} for county {CountyId}", version.Version, version.CountyId);
        return CreatedAtAction(nameof(Get), new { id = version.Id }, version);
    }

    [HttpPost("{id:int}/transition")]
    public async System.Threading.Tasks.Task<IActionResult> Transition(int id, [FromBody] TransitionRequest req)
    {
        var version = await _db.MatrixVersions
            .Include(v => v.CalibrationMemo)
            .FirstOrDefaultAsync(v => v.Id == id);
        if (version is null) return NotFound();

        var allowed = version.Status switch
        {
            "DRAFT"    => new[] { "REVIEW" },
            "REVIEW"   => new[] { "APPROVED", "DRAFT" },
            "APPROVED" => new[] { "LOCKED" },
            "LOCKED"   => new[] { "ARCHIVED" },
            _          => Array.Empty<string>(),
        };

        if (!allowed.Contains(req.ToStatus))
            return BadRequest($"Cannot transition from {version.Status} to {req.ToStatus}.");

        if (req.ToStatus == "REVIEW")
        {
            if (version.CalibrationMemo is null || !await _memoService.IsReadyForReviewAsync(version.CalibrationMemo.Id))
                return BadRequest("Calibration Memo must be at least 75% complete before submitting for review.");
        }

        if (req.ToStatus == "LOCKED")
        {
            if (string.IsNullOrEmpty(req.RateSnapshot))
                return BadRequest("rateSnapshot is required when locking a version.");
            version.RateSnapshot = req.RateSnapshot;
            version.LockedAt = DateTime.UtcNow;
            version.LockedBy = User.Identity?.Name ?? "system";
        }

        version.Status = req.ToStatus;
        version.UpdatedAt = DateTime.UtcNow;
        version.UpdatedBy = User.Identity?.Name ?? "system";
        await _db.SaveChangesAsync();

        _logger.LogInformation("MatrixVersion {Id} transitioned to {Status}", id, req.ToStatus);
        return Ok(version);
    }

    [HttpPatch("{id:int}/rates")]
    public async System.Threading.Tasks.Task<IActionResult> UpdateRates(int id, [FromBody] MassAdjustmentRequest req)
    {
        var version = await _db.MatrixVersions.FindAsync(id);
        if (version is null) return NotFound();
        if (version.Status != "DRAFT") return BadRequest("Only DRAFT versions can have rates updated.");

        // Deserialize current snapshot (seed from BentonCostData if empty)
        var cells = System.Text.Json.JsonSerializer.Deserialize<List<RateCellDto>>(
            string.IsNullOrEmpty(version.RateSnapshot) || version.RateSnapshot == "{}"
                ? SeedRateSnapshot()
                : version.RateSnapshot,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new List<RateCellDto>();

        foreach (var cell in cells)
        {
            bool inScope = req.Scope switch
            {
                "all"       => true,
                "type"      => cell.BuildingType == req.BuildingType,
                "area"      => cell.RevalArea == req.RevalArea,
                "type_area" => cell.BuildingType == req.BuildingType && cell.RevalArea == req.RevalArea,
                _           => false,
            };

            if (!inScope) continue;

            cell.BaseRate = req.Mode == "percent"
                ? Math.Round(cell.BaseRate * (1m + req.Value / 100m), 2)
                : Math.Round(cell.BaseRate + req.Value, 2);
        }

        version.RateSnapshot = System.Text.Json.JsonSerializer.Serialize(cells, CamelCaseOptions);
        version.UpdatedAt = DateTime.UtcNow;
        version.UpdatedBy = User.Identity?.Name ?? "system";
        await _db.SaveChangesAsync();
        return Ok(version);
    }

    private static readonly System.Text.Json.JsonSerializerOptions CamelCaseOptions =
        new() { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };

    private static string SeedRateSnapshot()
    {
        // Seed from BentonCostData so a new draft has real starting rates
        var cells = CostForgeController.BentonCostData.CostMatrix
            .Select(c => new RateCellDto
            {
                BuildingType = c.BuildingType,
                RevalArea    = c.Region,
                BaseRate     = c.BaseCostPerSqft,
            })
            .ToList();
        return System.Text.Json.JsonSerializer.Serialize(cells, CamelCaseOptions);
    }

    [HttpGet("export/dor")]
    public async System.Threading.Tasks.Task<IActionResult> ExportDor(
        [FromQuery] Guid countyId, [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var package = await _exportService.BuildDorPackageAsync(countyId, from, to);
        return Ok(package);
    }

    [HttpGet("export/audit")]
    public async System.Threading.Tasks.Task<IActionResult> ExportAudit(
        [FromQuery] Guid countyId, [FromQuery] int years = 5)
    {
        var package = await _exportService.BuildLegislativeAuditPackageAsync(countyId, years);
        return Ok(package);
    }

    [HttpGet("export/provenance")]
    public async System.Threading.Tasks.Task<IActionResult> ExportProvenance([FromQuery] Guid countyId)
    {
        var report = await _exportService.BuildProvenanceReportAsync(countyId);
        return Ok(report);
    }

    [HttpPost("{id:int}/apply-adjustment")]
    public async System.Threading.Tasks.Task<IActionResult> ApplyAdjustment(int id, [FromBody] ApplyAdjustmentRequest req)
    {
        var version = await _db.MatrixVersions.FindAsync(id);
        if (version is null) return NotFound($"MatrixVersion {id} not found.");
        if (version.Status == "LOCKED")
            return BadRequest("Cannot adjust a LOCKED matrix version.");

        var snapshot = version.RateSnapshot is string s
            ? System.Text.Json.JsonSerializer.Deserialize<List<RateCellDto>>(s,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new()
            : new List<RateCellDto>();

        double factor = 1.0 + req.AdjustmentPct / 100.0;
        bool changed = false;
        foreach (var cell in snapshot)
        {
            bool matchArea = string.IsNullOrEmpty(req.RevalArea) || cell.RevalArea == req.RevalArea;
            bool matchType = string.IsNullOrEmpty(req.BuildingType) || cell.BuildingType == req.BuildingType;
            if (matchArea && matchType)
            {
                cell.BaseRate = Math.Round(cell.BaseRate * (decimal)factor, 4);
                changed = true;
            }
        }

        if (!changed) return BadRequest("No rate cells matched the specified area/type.");

        version.RateSnapshot = System.Text.Json.JsonSerializer.Serialize(snapshot, CamelCaseOptions);
        version.UpdatedAt = DateTime.UtcNow;

        var parts = version.Version.Split('.');
        if (parts.Length == 3 && int.TryParse(parts[2], out var patch))
            version.Version = $"{parts[0]}.{parts[1]}.{patch + 1}";

        var auditEntry = $"\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {req.AppraiserNote ?? "Adjustment applied."} " +
                         $"Area={req.RevalArea ?? "ALL"} Type={req.BuildingType ?? "ALL"} " +
                         $"Pct={req.AdjustmentPct:+0.###;-0.###;0}% IAAO={req.IaaoReference}";

        // Append audit entry to TriggeringEvent as a running log (AppraiserNote not on entity)
        version.TriggeringEvent = ((version.TriggeringEvent ?? "") + auditEntry).TrimStart();
        if (version.TriggeringEvent.Length > 500)
            version.TriggeringEvent = version.TriggeringEvent[^500..];

        await _db.SaveChangesAsync();
        return Ok(new { version.Id, version.Version, version.Status, auditEntry });
    }
}

public record CreateMatrixVersionRequest(
    string Version,
    string? VersionType,
    Guid? CountyId,
    string? TriggeringEvent,
    DateTime? SalesWindowStart,
    DateTime? SalesWindowEnd,
    int? ParentVersionId,
    string? RateSnapshot);

public record TransitionRequest(string ToStatus, string? RateSnapshot);

public record MassAdjustmentRequest(
    string Scope,
    string Mode,
    decimal Value,
    string? BuildingType,
    string? RevalArea);

public record ApplyAdjustmentRequest(
    string? RevalArea,
    string? BuildingType,
    double AdjustmentPct,
    List<int> ExcludedSaleIds,
    string? AppraiserNote,
    string? IaaoReference);

public class RateCellDto
{
    public string BuildingType { get; set; } = "";
    public string RevalArea { get; set; } = "";
    public decimal BaseRate { get; set; }
}
