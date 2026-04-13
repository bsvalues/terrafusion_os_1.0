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
public class CalibrationDiagnosticController : ControllerBase
{
    private readonly IMatrixDiagnosticService _diagnosticService;
    private readonly TerraFusionDbContext _db;

    public CalibrationDiagnosticController(
        IMatrixDiagnosticService diagnosticService,
        TerraFusionDbContext db)
    {
        _diagnosticService = diagnosticService;
        _db = db;
    }

    [HttpPost("run")]
    public async System.Threading.Tasks.Task<IActionResult> RunDiagnostics([FromQuery] int matrixVersionId)
    {
        var version = await _db.MatrixVersions.FindAsync(matrixVersionId);
        if (version is null) return NotFound($"MatrixVersion {matrixVersionId} not found.");

        var old = _db.CalibrationFindings.Where(f => f.MatrixVersionId == matrixVersionId);
        _db.CalibrationFindings.RemoveRange(old);

        var findings = await _diagnosticService.RunDiagnosticsAsync(matrixVersionId);
        _db.CalibrationFindings.AddRange(findings);
        await _db.SaveChangesAsync();

        return Ok(new { count = findings.Count, findings });
    }

    [HttpGet("findings")]
    public async System.Threading.Tasks.Task<IActionResult> GetFindings([FromQuery] int matrixVersionId)
    {
        var findings = await _db.CalibrationFindings
            .Where(f => f.MatrixVersionId == matrixVersionId)
            .OrderByDescending(f => Math.Abs((double)(f.EstimatedAvImpact ?? 0)))
            .AsNoTracking()
            .ToListAsync();
        return Ok(findings);
    }

    [HttpPatch("findings/{id:int}/resolve")]
    public async System.Threading.Tasks.Task<IActionResult> ResolveFinding(int id, [FromBody] ResolveFindingRequest req)
    {
        var finding = await _db.CalibrationFindings.FindAsync(id);
        if (finding is null) return NotFound();

        finding.ResolutionStatus = req.Status;
        finding.AppraiserNote = req.Note;
        finding.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(finding);
    }

    [HttpGet("summary")]
    public async System.Threading.Tasks.Task<IActionResult> GetSummary()
    {
        var summary = await _diagnosticService.GetSummaryAsync();
        return Ok(summary);
    }

    [HttpPost("findings/{id:int}/flag-to-workbench")]
    public async System.Threading.Tasks.Task<IActionResult> FlagToWorkbench(int id)
    {
        var finding = await _db.CalibrationFindings.FindAsync(id);
        if (finding is null) return NotFound();
        if (finding.Classification != "DATA_PROBLEM")
            return BadRequest("Only DATA_PROBLEM findings can be flagged to Property Workbench.");

        var parcelIds = System.Text.Json.JsonSerializer.Deserialize<List<string>>(
            finding.OutlierParcelIds ?? "[]") ?? new List<string>();

        var flags = parcelIds.Select(pid => new PropertyWorkbenchFlag
        {
            CalibrationFindingId = finding.Id,
            ParcelId = pid,
            Reason = finding.EvidenceSummary ?? "AI diagnostic: outlier parcel in ratio study.",
            Status = "PENDING",
            CreatedBy = "calibration-workbench",
            UpdatedBy = "calibration-workbench",
        }).ToList();

        _db.PropertyWorkbenchFlags.AddRange(flags);
        finding.ResolutionStatus = "FLAGGED";
        await _db.SaveChangesAsync();

        return Ok(new { flagged = flags.Count, parcelIds });
    }
}

public record ResolveFindingRequest(string Status, string? Note);
