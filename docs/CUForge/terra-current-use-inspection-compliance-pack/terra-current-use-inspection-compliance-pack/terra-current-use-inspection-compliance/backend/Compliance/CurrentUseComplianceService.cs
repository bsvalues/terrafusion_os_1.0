using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Compliance;

public interface ICurrentUseComplianceService
{
    Task<CurrentUseComplianceSummaryDto> GetComplianceSummaryAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<CurrentUseInspectionDto> ScheduleInspectionAsync(
        ScheduleCurrentUseInspectionDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseInspectionDto> CompleteInspectionAsync(
        Guid inspectionId,
        CompleteCurrentUseInspectionDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseComplianceService : ICurrentUseComplianceService
{
    private static readonly List<CurrentUseInspectionDto> Inspections = new();

    public Task<CurrentUseComplianceSummaryDto> GetComplianceSummaryAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        var recent = Inspections
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        var riskReasons = new List<string>();
        var riskScore = 0;

        if (!recent.Any())
        {
            riskScore += 15;
            riskReasons.Add("No inspection record found.");
        }

        var latest = recent.FirstOrDefault(x => x.Status == CurrentUseInspectionStatus.Complete);

        if (latest?.Findings.Any(x => x.RiskFlag) == true)
        {
            var riskFindings = latest.Findings.Count(x => x.RiskFlag);
            riskScore += riskFindings * 20;
            riskReasons.Add($"{riskFindings} risk finding(s) from latest inspection.");
        }

        var status = riskScore switch
        {
            >= 60 => CurrentUseComplianceStatus.RemovalReviewRecommended,
            >= 35 => CurrentUseComplianceStatus.AtRisk,
            >= 15 => CurrentUseComplianceStatus.Monitoring,
            _ => CurrentUseComplianceStatus.Compliant
        };

        var summary = new CurrentUseComplianceSummaryDto(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            parcelId,
            latest?.ClassificationId,
            status,
            latest?.CompletedDate,
            latest?.CompletedDate?.AddYears(1),
            null,
            DateOnly.FromDateTime(DateTime.UtcNow).AddYears(3),
            riskScore,
            riskReasons,
            recent);

        return Task.FromResult(summary);
    }

    public Task<CurrentUseInspectionDto> ScheduleInspectionAsync(
        ScheduleCurrentUseInspectionDto request,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var inspection = new CurrentUseInspectionDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            CurrentUseInspectionStatus.Scheduled,
            request.ScheduledDate,
            null,
            request.InspectorId,
            request.InspectorName,
            Array.Empty<CurrentUseInspectionFindingDto>(),
            request.Notes,
            now,
            request.CreatedBy,
            now,
            request.CreatedBy);

        Inspections.Add(inspection);

        return Task.FromResult(inspection);
    }

    public Task<CurrentUseInspectionDto> CompleteInspectionAsync(
        Guid inspectionId,
        CompleteCurrentUseInspectionDto request,
        CancellationToken cancellationToken)
    {
        var existing = Inspections.FirstOrDefault(x => x.InspectionId == inspectionId)
            ?? throw new InvalidOperationException($"Current Use inspection not found: {inspectionId}");

        var updated = existing with
        {
            Status = request.Findings.Any(x => x.RiskFlag)
                ? CurrentUseInspectionStatus.RequiresFollowup
                : CurrentUseInspectionStatus.Complete,
            CompletedDate = request.CompletedDate,
            Findings = request.Findings,
            Notes = request.Notes,
            UpdatedAt = DateTimeOffset.UtcNow,
            UpdatedBy = request.UpdatedBy
        };

        Inspections.Remove(existing);
        Inspections.Add(updated);

        return Task.FromResult(updated);
    }
}
