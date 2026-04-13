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

    [HttpPost]
    public async System.Threading.Tasks.Task<IActionResult> Create([FromBody] CreateMatrixVersionRequest req)
    {
        var exists = await _db.MatrixVersions
            .AnyAsync(v => v.CountyId == req.CountyId && v.Version == req.Version);
        if (exists) return Conflict($"Version {req.Version} already exists for this county.");

        var version = new MatrixVersion
        {
            CountyId = req.CountyId,
            Version = req.Version,
            Status = "DRAFT",
            VersionType = req.VersionType ?? "CALIBRATED",
            TriggeringEvent = req.TriggeringEvent,
            SalesWindowStart = req.SalesWindowStart,
            SalesWindowEnd = req.SalesWindowEnd,
            ParentVersionId = req.ParentVersionId,
            RateSnapshot = req.RateSnapshot ?? "{}",
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
    public async System.Threading.Tasks.Task<IActionResult> UpdateRates(int id, [FromBody] UpdateRatesRequest req)
    {
        var version = await _db.MatrixVersions.FindAsync(id);
        if (version is null) return NotFound();
        if (version.Status != "DRAFT") return BadRequest("Only DRAFT versions can have rates updated.");

        version.RateSnapshot = req.RateSnapshot;
        version.PrdAfter = req.PrdAfter;
        version.PrbAfter = req.PrbAfter;
        version.CodAfter = req.CodAfter;
        version.CountyAvImpact = req.CountyAvImpact;
        version.UpdatedAt = DateTime.UtcNow;
        version.UpdatedBy = User.Identity?.Name ?? "system";
        await _db.SaveChangesAsync();
        return Ok(version);
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
}

public record CreateMatrixVersionRequest(
    Guid CountyId,
    string Version,
    string? VersionType,
    string? TriggeringEvent,
    DateTime? SalesWindowStart,
    DateTime? SalesWindowEnd,
    int? ParentVersionId,
    string? RateSnapshot);

public record TransitionRequest(string ToStatus, string? RateSnapshot);

public record UpdateRatesRequest(
    string RateSnapshot,
    decimal? PrdAfter,
    decimal? PrbAfter,
    decimal? CodAfter,
    decimal? CountyAvImpact);
