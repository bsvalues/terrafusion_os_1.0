using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Services;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Services;

public class GovernanceExportService : IGovernanceExportService
{
    private readonly TerraFusionDbContext _db;

    public GovernanceExportService(TerraFusionDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<GovernancePackage> BuildDorPackageAsync(
        Guid countyId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var versions = await _db.MatrixVersions
            .Include(v => v.CalibrationMemo)
            .Include(v => v.EvidenceAges)
            .Where(v => v.CountyId == countyId
                && v.EffectiveDate >= from
                && v.EffectiveDate <= to)
            .OrderBy(v => v.EffectiveDate)
            .ToListAsync(ct);

        var data = versions.Select(v => new
        {
            v.Version,
            v.Status,
            v.VersionType,
            v.EffectiveDate,
            v.LockedAt,
            v.LockedBy,
            v.PrdBefore,
            v.PrdAfter,
            v.CodBefore,
            v.CodAfter,
            v.CountyAvImpact,
            MemoCompleteness = v.CalibrationMemo?.CompletenessScore,
            MemoStatus = v.CalibrationMemo?.Status,
            EvidenceAreas = v.EvidenceAges.Select(e => new
            {
                e.RevalArea,
                e.EvidenceStatus,
                e.EvidenceAgeMonths,
                e.SaleCount,
                e.MedianRatio,
            }),
        }).ToList();

        return new GovernancePackage("DOR_EQUALIZATION", countyId, DateTime.UtcNow, data);
    }

    public async System.Threading.Tasks.Task<GovernancePackage> BuildLegislativeAuditPackageAsync(
        Guid countyId, int years, CancellationToken ct = default)
    {
        var cutoff = DateTime.UtcNow.AddYears(-years);
        var versions = await _db.MatrixVersions
            .Include(v => v.Findings)
            .Where(v => v.CountyId == countyId && v.CreatedAt >= cutoff)
            .OrderBy(v => v.EffectiveDate)
            .ToListAsync(ct);

        var data = new
        {
            YearsRequested = years,
            TotalVersions = versions.Count,
            LockedVersions = versions.Count(v => v.Status == "LOCKED"),
            EquityTrend = versions.Where(v => v.PrdBefore.HasValue).Select(v => new
            {
                v.Version,
                v.EffectiveDate,
                v.PrdBefore,
                v.PrdAfter,
                v.CodBefore,
                v.CodAfter,
            }),
            AllFindings = versions.SelectMany(v => v.Findings).Select(f => new
            {
                f.Classification,
                f.BuildingType,
                f.RevalArea,
                f.PrdValue,
                f.ResolutionStatus,
            }),
        };

        return new GovernancePackage("LEGISLATIVE_AUDIT", countyId, DateTime.UtcNow, data);
    }

    public async System.Threading.Tasks.Task<ProvenanceReport> BuildProvenanceReportAsync(
        Guid countyId, CancellationToken ct = default)
    {
        var lockedVersion = await _db.MatrixVersions
            .Include(v => v.EvidenceAges)
            .Where(v => v.CountyId == countyId && v.Status == "LOCKED")
            .OrderByDescending(v => v.LockedAt)
            .FirstOrDefaultAsync(ct);

        var matrix = CostForgeController.BentonCostData.CostMatrix;
        var entries = matrix.Select(e =>
        {
            var evidence = lockedVersion?.EvidenceAges
                .FirstOrDefault(a => a.RevalArea == e.Region);
            return new ProvenanceEntry(
                e.BuildingType,
                e.Region,
                e.BaseCostPerSqft,
                lockedVersion?.LockedAt ?? DateTime.UtcNow.AddYears(-1),
                lockedVersion?.LockedBy ?? "unknown",
                evidence?.EvidenceAgeMonths ?? 0,
                evidence?.EvidenceStatus ?? "UNKNOWN");
        }).ToList();

        return new ProvenanceReport(countyId, DateTime.UtcNow, entries);
    }
}
