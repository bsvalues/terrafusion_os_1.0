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
    public async System.Threading.Tasks.Task<IActionResult> RunDiagnostics([FromBody] RunDiagnosticsRequest req)
    {
        var version = await _db.MatrixVersions.FindAsync(req.MatrixVersionId);
        if (version is null) return NotFound($"MatrixVersion {req.MatrixVersionId} not found.");

        var old = _db.CalibrationFindings.Where(f => f.MatrixVersionId == req.MatrixVersionId);
        _db.CalibrationFindings.RemoveRange(old);

        var findings = await _diagnosticService.RunDiagnosticsAsync(req.MatrixVersionId);
        _db.CalibrationFindings.AddRange(findings);
        await _db.SaveChangesAsync();

        return Ok(new { count = findings.Count, findings = findings.Select(ToDto) });
    }

    [HttpGet("findings")]
    public async System.Threading.Tasks.Task<IActionResult> GetFindings([FromQuery] int matrixVersionId)
    {
        var findings = await _db.CalibrationFindings
            .Where(f => f.MatrixVersionId == matrixVersionId)
            .OrderByDescending(f => Math.Abs((double)(f.EstimatedAvImpact ?? 0)))
            .AsNoTracking()
            .ToListAsync();
        return Ok(findings.Select(ToDto));
    }

    [HttpPatch("findings/{id:int}/resolve")]
    public async System.Threading.Tasks.Task<IActionResult> ResolveFinding(int id, [FromBody] ResolveFindingRequest req)
    {
        var finding = await _db.CalibrationFindings.FindAsync(id);
        if (finding is null) return NotFound();

        finding.ResolutionStatus = req.ResolutionStatus;
        finding.AppraiserNote = req.AppraiserNote;
        finding.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ToDto(finding));
    }

    private static object ToDto(TerraFusion.Core.Entities.CalibrationFinding f) => new
    {
        f.Id, f.MatrixVersionId, f.Classification, f.BuildingType, f.RevalArea,
        f.PrdValue, f.PrbValue, f.CodValue, f.ConfidenceLevel,
        f.ProposedAdjustmentPct, f.ProposedRateNew, f.EstimatedAvImpact,
        f.OutlierParcelIds, f.EvidenceSummary, f.ResolutionStatus, f.AppraiserNote,
        f.CreatedAt, f.UpdatedAt,
    };

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

    [HttpGet("reval-area-summary")]
    public async System.Threading.Tasks.Task<IActionResult> GetRevalAreaSummary([FromQuery] int matrixVersionId)
    {
        var sales = await _db.SaleRecords
            .Where(s => s.MatrixVersionId == matrixVersionId)
            .AsNoTracking()
            .ToListAsync();

        var groups = sales
            .GroupBy(s => new { s.RevalArea, s.BuildingType })
            .Select(g =>
            {
                var ratios = g.Select(s => (double)s.Ratio).ToList();
                var prd = ComputePrd(g.Select(s => ((double)s.AssessedValue, (double)s.SalePrice)));
                var prb = ComputePrb(g.Select(s => ((double)s.SalePrice, (double)s.Ratio)));
                var cod = ComputeCod(ratios);
                var healthStatus = GetHealthStatus(prd, prb, cod);
                return new
                {
                    revalArea = g.Key.RevalArea,
                    buildingType = g.Key.BuildingType,
                    prd = Math.Round(prd, 4),
                    prb = Math.Round(prb, 4),
                    cod = Math.Round(cod, 2),
                    saleCount = g.Count(),
                    healthStatus,
                };
            })
            .OrderBy(x => x.revalArea).ThenBy(x => x.buildingType)
            .ToList();

        return Ok(groups);
    }

    [HttpGet("parcel-evidence")]
    public async System.Threading.Tasks.Task<IActionResult> GetParcelEvidence(
        [FromQuery] int matrixVersionId,
        [FromQuery] string? revalArea,
        [FromQuery] string? buildingType)
    {
        var q = _db.SaleRecords
            .Where(s => s.MatrixVersionId == matrixVersionId);

        if (!string.IsNullOrEmpty(revalArea))
            q = q.Where(s => s.RevalArea == revalArea);
        if (!string.IsNullOrEmpty(buildingType))
            q = q.Where(s => s.BuildingType == buildingType);

        var records = await q.AsNoTracking().ToListAsync();

        var excludedIdsList = await _db.OutlierExclusions
            .Where(e => e.MatrixVersionId == matrixVersionId)
            .Select(e => e.SaleRecordId)
            .ToListAsync();
        var excludedIds = excludedIdsList.ToHashSet();

        var ratios = records.Select(s => (double)s.Ratio).ToList();
        double medianRatio = CalibMedian(ratios);
        double cod = ComputeCod(ratios);

        var result = new
        {
            medianRatio = Math.Round(medianRatio, 4),
            cod = Math.Round(cod, 2),
            saleCount = records.Count,
            outlierCount = records.Count(s => s.IsOutlierIqr),
            parcels = records.Select(s => new
            {
                s.Id, s.ParcelId, s.RevalArea, s.BuildingType,
                saleDate = s.SaleDate.ToString("yyyy-MM-dd"),
                s.SalePrice, s.AssessedValue, s.Ratio,
                s.IsOutlierIqr, s.AiClassification, s.PacsFlags,
                s.ValueQuintile, s.AgeBand,
                isExcluded = excludedIds.Contains(s.Id),
            }),
        };

        return Ok(result);
    }

    private static double ComputePrd(IEnumerable<(double av, double sp)> sales)
    {
        var list = sales.ToList();
        if (list.Count == 0) return 1.0;
        double meanRatio = list.Average(x => x.av / x.sp);
        double weightedMean = list.Sum(x => x.av) / list.Sum(x => x.sp);
        return weightedMean == 0 ? 1.0 : meanRatio / weightedMean;
    }

    private static double ComputePrb(IEnumerable<(double sp, double ratio)> sales)
    {
        var list = sales.Where(x => x.sp > 0).ToList();
        if (list.Count < 2) return 0.0;
        var xs = list.Select(x => Math.Log(x.sp)).ToList();
        var ys = list.Select(x => x.ratio - 1.0).ToList();
        double xMean = xs.Average();
        double yMean = ys.Average();
        double cov = xs.Zip(ys, (x, y) => (x - xMean) * (y - yMean)).Sum();
        double varX = xs.Sum(x => (x - xMean) * (x - xMean));
        return varX == 0 ? 0.0 : cov / varX;
    }

    private static double ComputeCod(IEnumerable<double> ratios)
    {
        var list = ratios.ToList();
        if (list.Count == 0) return 0.0;
        double med = CalibMedian(list);
        if (med == 0) return 0.0;
        return list.Average(r => Math.Abs(r - med)) / med * 100.0;
    }

    private static double CalibMedian(List<double> values)
    {
        if (values.Count == 0) return 0.0;
        var sorted = values.OrderBy(v => v).ToList();
        int mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2.0
            : sorted[mid];
    }

    private static string GetHealthStatus(double prd, double prb, double cod)
    {
        if (prd > 1.03 || prd < 0.98 || cod > 15 || Math.Abs(prb) > 0.05)
            return "RED";
        if (prd > 1.02 || cod > 12)
            return "YELLOW";
        return "GREEN";
    }

    [HttpPost("simulate")]
    public async System.Threading.Tasks.Task<IActionResult> Simulate([FromBody] SimulateRequest req)
    {
        var q = _db.SaleRecords.Where(s => s.MatrixVersionId == req.MatrixVersionId);
        if (!string.IsNullOrEmpty(req.RevalArea)) q = q.Where(s => s.RevalArea == req.RevalArea);
        if (!string.IsNullOrEmpty(req.BuildingType)) q = q.Where(s => s.BuildingType == req.BuildingType);

        var all = await q.AsNoTracking().ToListAsync();
        var active = all.Where(s => !req.ExcludedSaleIds.Contains(s.Id)).ToList();

        if (active.Count == 0) return BadRequest("No active sales after exclusions.");

        double factor = 1.0 + req.AdjustmentPct / 100.0;
        var projected = active.Select(s => new
        {
            AV = (double)s.AssessedValue * factor,
            SP = (double)s.SalePrice,
        }).ToList();

        double projPrd = ComputePrd(projected.Select(x => (x.AV, x.SP)));
        double projPrb = ComputePrb(projected.Select(x => (x.SP, x.AV / x.SP)));
        double projCod = ComputeCod(projected.Select(x => x.AV / x.SP).ToList());
        double projMedian = CalibMedian(projected.Select(x => x.AV / x.SP).ToList());
        decimal avImpact = active.Sum(s => s.AssessedValue) * (decimal)(factor - 1.0);

        var allSales = await _db.SaleRecords
            .Where(s => s.MatrixVersionId == req.MatrixVersionId)
            .AsNoTracking().ToListAsync();
        var crossArea = allSales
            .GroupBy(s => s.RevalArea)
            .Select(g =>
            {
                var activeSales = g.Where(s => !req.ExcludedSaleIds.Contains(s.Id)).ToList();
                if (activeSales.Count == 0) return new { revalArea = g.Key, projectedPrd = 1.0 };
                double prd = ComputePrd(activeSales.Select(s => ((double)s.AssessedValue * factor, (double)s.SalePrice)));
                return new { revalArea = g.Key, projectedPrd = Math.Round(prd, 4) };
            }).ToList();

        return Ok(new
        {
            projectedPrd = Math.Round(projPrd, 4),
            projectedPrb = Math.Round(projPrb, 4),
            projectedCod = Math.Round(projCod, 2),
            projectedMedianRatio = Math.Round(projMedian, 4),
            estimatedAvImpact = Math.Round(avImpact, 0),
            crossAreaImpact = crossArea,
        });
    }

    [HttpPost("solve-for-rate")]
    public async System.Threading.Tasks.Task<IActionResult> SolveForRate([FromBody] SolveForRateRequest req)
    {
        var q = _db.SaleRecords.Where(s => s.MatrixVersionId == req.MatrixVersionId);
        if (!string.IsNullOrEmpty(req.RevalArea)) q = q.Where(s => s.RevalArea == req.RevalArea);
        if (!string.IsNullOrEmpty(req.BuildingType)) q = q.Where(s => s.BuildingType == req.BuildingType);

        var all = await q.AsNoTracking().ToListAsync();
        var active = all.Where(s => !req.ExcludedSaleIds.Contains(s.Id)).ToList();
        if (active.Count == 0) return BadRequest("No active sales.");

        // Solve for the adjustment % that achieves the target median ratio.
        // Median ratio = median(AV/SP). A uniform factor k applied to all AVs
        // scales every ratio by k, so new_median = old_median * k.
        // Binary search converges quickly; analytical solution is factor = target/current.
        double lo = -50.0, hi = 100.0;
        double bestAdj = 0.0;
        for (int iter = 0; iter < 60; iter++)
        {
            double mid = (lo + hi) / 2.0;
            double factor = 1.0 + mid / 100.0;
            var projRatios = active.Select(s => (double)s.Ratio * factor).ToList();
            double projMedian = CalibMedian(projRatios);
            if (projMedian < req.TargetMedianRatio) lo = mid; else hi = mid;
            bestAdj = mid;
            if (Math.Abs(hi - lo) < 0.001) break;
        }

        double bestFactor = 1.0 + bestAdj / 100.0;
        var bestProj = active.Select(s => new { AV = (double)s.AssessedValue * bestFactor, SP = (double)s.SalePrice }).ToList();
        return Ok(new
        {
            suggestedAdjustmentPct = Math.Round(bestAdj, 3),
            projectedMedianRatio = Math.Round(CalibMedian(bestProj.Select(x => x.AV / x.SP).ToList()), 4),
            projectedPrd = Math.Round(ComputePrd(bestProj.Select(x => (x.AV, x.SP))), 4),
            projectedCod = Math.Round(ComputeCod(bestProj.Select(x => x.AV / x.SP).ToList()), 2),
            projectedPrb = Math.Round(ComputePrb(bestProj.Select(x => (x.SP, x.AV / x.SP))), 4),
        });
    }

    [HttpGet("stratified-equity")]
    public async System.Threading.Tasks.Task<IActionResult> GetStratifiedEquity(
        [FromQuery] int matrixVersionId,
        [FromQuery] string? revalArea,
        [FromQuery] string? buildingType)
    {
        var q = _db.SaleRecords.Where(s => s.MatrixVersionId == matrixVersionId);
        if (!string.IsNullOrEmpty(revalArea)) q = q.Where(s => s.RevalArea == revalArea);
        if (!string.IsNullOrEmpty(buildingType)) q = q.Where(s => s.BuildingType == buildingType);

        var records = await q.AsNoTracking().ToListAsync();

        var cells = records
            .GroupBy(s => new { s.ValueQuintile, s.AgeBand })
            .Select(g =>
            {
                var ratios = g.Select(s => (double)s.Ratio).ToList();
                return new
                {
                    quintile = g.Key.ValueQuintile,
                    ageBand = g.Key.AgeBand,
                    medianRatio = Math.Round(CalibMedian(ratios), 4),
                    cod = Math.Round(ComputeCod(ratios), 2),
                    saleCount = g.Count(),
                    parcelIds = g.Select(s => s.ParcelId).ToList(),
                };
            })
            .OrderBy(c => c.quintile).ThenBy(c => c.ageBand)
            .ToList();

        return Ok(cells);
    }

    [HttpPost("outlier-exclusions")]
    public async System.Threading.Tasks.Task<IActionResult> RecordOutlierExclusion([FromBody] OutlierExclusionRequest req)
    {
        var sale = await _db.SaleRecords.FindAsync(req.SaleRecordId);
        if (sale is null) return NotFound($"SaleRecord {req.SaleRecordId} not found.");

        var prior = await _db.OutlierExclusions
            .Where(e => e.MatrixVersionId == req.MatrixVersionId && e.SaleRecordId == req.SaleRecordId)
            .ToListAsync();
        _db.OutlierExclusions.RemoveRange(prior);

        var exclusion = new OutlierExclusion
        {
            MatrixVersionId = req.MatrixVersionId,
            SaleRecordId = req.SaleRecordId,
            DispositionType = req.DispositionType,
            AppraiserNote = req.AppraiserNote,
            DataProblemFlagged = req.DispositionType == "FLAGGED_DATA",
            CreatedBy = "appraiser",
        };
        _db.OutlierExclusions.Add(exclusion);

        if (exclusion.DataProblemFlagged)
        {
            _db.PropertyWorkbenchFlags.Add(new PropertyWorkbenchFlag
            {
                ParcelId = sale.ParcelId,
                Reason = $"Outlier flagged as DATA_PROBLEM in ratio study. Note: {req.AppraiserNote}",
                Status = "PENDING",
                CreatedBy = "calibration-workbench",
                UpdatedBy = "calibration-workbench",
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { exclusion.Id, exclusion.DispositionType, exclusion.DataProblemFlagged });
    }
}

public record ResolveFindingRequest(string ResolutionStatus, string? AppraiserNote);
public record RunDiagnosticsRequest(int MatrixVersionId);

public record SimulateRequest(
    int MatrixVersionId,
    string? RevalArea,
    string? BuildingType,
    double AdjustmentPct,
    List<int> ExcludedSaleIds);

public record SolveForRateRequest(
    int MatrixVersionId,
    string? RevalArea,
    string? BuildingType,
    double TargetMedianRatio,
    List<int> ExcludedSaleIds);

public record OutlierExclusionRequest(
    int MatrixVersionId,
    int SaleRecordId,
    string DispositionType,
    string? AppraiserNote);
