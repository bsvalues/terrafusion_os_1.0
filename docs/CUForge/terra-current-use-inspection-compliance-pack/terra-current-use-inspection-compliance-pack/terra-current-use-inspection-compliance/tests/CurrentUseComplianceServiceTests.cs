using TerraFusion.Modules.CurrentUse.Compliance;
using TerraFusion.Modules.CurrentUse.Dto;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseComplianceServiceTests
{
    [Fact]
    public async Task No_Inspection_Creates_Monitoring_Risk()
    {
        var service = new CurrentUseComplianceService();

        var summary = await service.GetComplianceSummaryAsync(
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.True(summary.RiskScore > 0);
        Assert.Contains(summary.RiskReasons, x => x.Contains("No inspection"));
    }

    [Fact]
    public async Task Schedule_Inspection_Creates_Scheduled_Record()
    {
        var service = new CurrentUseComplianceService();
        var parcelId = Guid.NewGuid();

        var inspection = await service.ScheduleInspectionAsync(
            new ScheduleCurrentUseInspectionDto(
                Guid.NewGuid(),
                parcelId,
                null,
                new DateOnly(2026, 4, 1),
                "inspector-1",
                "Inspector One",
                "Initial inspection.",
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(CurrentUseInspectionStatus.Scheduled, inspection.Status);
    }

    [Fact]
    public async Task Risk_Finding_Requires_Followup()
    {
        var service = new CurrentUseComplianceService();
        var parcelId = Guid.NewGuid();

        var inspection = await service.ScheduleInspectionAsync(
            new ScheduleCurrentUseInspectionDto(
                Guid.NewGuid(),
                parcelId,
                null,
                new DateOnly(2026, 4, 1),
                "inspector-1",
                "Inspector One",
                "Initial inspection.",
                "unit.test"),
            CancellationToken.None);

        var completed = await service.CompleteInspectionAsync(
            inspection.InspectionId,
            new CompleteCurrentUseInspectionDto(
                new DateOnly(2026, 4, 1),
                new[]
                {
                    new CurrentUseInspectionFindingDto(
                        CurrentUseInspectionFindingType.NoCommercialUseObserved,
                        "No commercial agricultural activity observed.",
                        true)
                },
                "Follow up required.",
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(CurrentUseInspectionStatus.RequiresFollowup, completed.Status);
    }
}
