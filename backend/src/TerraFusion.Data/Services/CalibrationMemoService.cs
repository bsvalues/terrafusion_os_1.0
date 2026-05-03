using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;

namespace TerraFusion.Data.Services;

public class CalibrationMemoService : ICalibrationMemoService
{
    private readonly TerraFusionDbContext _db;

    public CalibrationMemoService(TerraFusionDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<CalibrationMemo> AutoDraftAsync(
        int matrixVersionId, Guid countyId, CancellationToken ct = default)
    {
        var version = await _db.MatrixVersions
            .Include(v => v.Findings)
            .FirstOrDefaultAsync(v => v.Id == matrixVersionId, ct)
            ?? throw new InvalidOperationException($"MatrixVersion {matrixVersionId} not found");

        var topFinding = version.Findings
            .OrderByDescending(f => Math.Abs((double)(f.EstimatedAvImpact ?? 0)))
            .FirstOrDefault();

        var memo = new CalibrationMemo
        {
            CountyId = countyId,
            Status = "DRAFT",
            Section1Purpose = topFinding != null
                ? $"Rate calibration initiated by AI diagnostic finding: {topFinding.Classification} detected in {topFinding.BuildingType} / {topFinding.RevalArea}. PRD={topFinding.PrdValue:F3}."
                : $"Routine annual rate matrix calibration for tax year {(version.EffectiveDate?.Year ?? DateTime.UtcNow.Year + 1)}.",
            Section2DataUsed = version.SalesWindowStart.HasValue
                ? $"Arm's-length sales {version.SalesWindowStart:yyyy-MM-dd} through {version.SalesWindowEnd:yyyy-MM-dd}. Exclusion rules: {version.SalesExclusionRules}."
                : "Sales window: rolling 24-month. Exclusions: non-arm's-length, REO, related-party transfers.",
            Section3Diagnostics = version.PrdBefore.HasValue
                ? $"Pre-calibration: PRD={version.PrdBefore:F3}, PRB={version.PrbBefore:F3}, COD={version.CodBefore:F1}%."
                : "Pre-calibration diagnostics: run AI diagnostic analysis to populate.",
            Section4ChangeMade = null,
            Section5Impact = version.CountyAvImpact.HasValue
                ? $"Estimated county AV impact: {version.CountyAvImpact:C0}. Post-adjustment PRD target: 0.98-1.03."
                : "Impact will be calculated when adjustments are applied.",
            Section6Verification = $"Post-change ratio study to be conducted within 90 days of effective date {version.EffectiveDate:yyyy-MM-dd}.",
            Section7SignOff = "[{\"role\":\"Analyst\",\"signed\":false},{\"role\":\"Chief Appraiser\",\"signed\":false},{\"role\":\"Assessor\",\"signed\":false}]",
            Section8Notes = null,
            CreatedBy = "system",
            UpdatedBy = "system",
        };

        memo.CompletenessScore = ScoreMemo(memo);
        _db.CalibrationMemos.Add(memo);
        await _db.SaveChangesAsync(ct);
        return memo;
    }

    public async System.Threading.Tasks.Task<CalibrationMemo> UpdateSectionAsync(
        int memoId, string sectionKey, string content, CancellationToken ct = default)
    {
        var memo = await _db.CalibrationMemos.FindAsync(new object[] { memoId }, ct)
            ?? throw new InvalidOperationException($"CalibrationMemo {memoId} not found");

        switch (sectionKey)
        {
            case "section1": memo.Section1Purpose = content; break;
            case "section2": memo.Section2DataUsed = content; break;
            case "section3": memo.Section3Diagnostics = content; break;
            case "section4": memo.Section4ChangeMade = content; break;
            case "section5": memo.Section5Impact = content; break;
            case "section6": memo.Section6Verification = content; break;
            case "section7": memo.Section7SignOff = content; break;
            case "section8": memo.Section8Notes = content; break;
            default: throw new ArgumentException($"Unknown section key: {sectionKey}");
        }

        memo.UpdatedAt = DateTime.UtcNow;
        memo.CompletenessScore = ScoreMemo(memo);
        if (memo.CompletenessScore == 100) memo.Status = "COMPLETE";

        await _db.SaveChangesAsync(ct);
        return memo;
    }

    public async System.Threading.Tasks.Task<int> ComputeCompletenessAsync(int memoId, CancellationToken ct = default)
    {
        var memo = await _db.CalibrationMemos.FindAsync(new object[] { memoId }, ct)
            ?? throw new InvalidOperationException($"CalibrationMemo {memoId} not found");
        return ScoreMemo(memo);
    }

    public async System.Threading.Tasks.Task<bool> IsReadyForReviewAsync(int memoId, CancellationToken ct = default)
    {
        var score = await ComputeCompletenessAsync(memoId, ct);
        return score >= 75;
    }

    private static int ScoreMemo(CalibrationMemo m)
    {
        int score = 0;
        if (!string.IsNullOrWhiteSpace(m.Section1Purpose))    score += 15;
        if (!string.IsNullOrWhiteSpace(m.Section2DataUsed))   score += 15;
        if (!string.IsNullOrWhiteSpace(m.Section3Diagnostics)) score += 15;
        if (!string.IsNullOrWhiteSpace(m.Section4ChangeMade))  score += 20;
        if (!string.IsNullOrWhiteSpace(m.Section5Impact))     score += 15;
        if (!string.IsNullOrWhiteSpace(m.Section6Verification)) score += 10;
        if (!string.IsNullOrWhiteSpace(m.Section7SignOff))    score += 5;
        if (!string.IsNullOrWhiteSpace(m.Section8Notes))      score += 5;
        return score;
    }
}
