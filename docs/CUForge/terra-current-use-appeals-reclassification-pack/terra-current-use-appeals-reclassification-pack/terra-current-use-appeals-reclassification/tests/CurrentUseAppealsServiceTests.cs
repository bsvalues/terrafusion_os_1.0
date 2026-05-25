using TerraFusion.Modules.CurrentUse.Appeals;
using TerraFusion.Modules.CurrentUse.Dto;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseAppealsServiceTests
{
    [Fact]
    public async Task Create_Appeal_Window_Computes_Deadline()
    {
        var service = new CurrentUseAppealsService();
        var parcelId = Guid.NewGuid();

        var appeal = await service.CreateAppealWindowAsync(
            new CreateCurrentUseAppealDto(
                Guid.NewGuid(),
                parcelId,
                null,
                null,
                null,
                new DateOnly(2026, 3, 15),
                30,
                "Appeal window opened.",
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(new DateOnly(2026, 4, 14), appeal.AppealDeadline);
        Assert.Equal(CurrentUseAppealStatus.AppealWindowOpen, appeal.Status);
    }

    [Fact]
    public async Task Mark_Appeal_Filed_Sets_Board_Reference()
    {
        var service = new CurrentUseAppealsService();
        var parcelId = Guid.NewGuid();

        var appeal = await service.CreateAppealWindowAsync(
            new CreateCurrentUseAppealDto(
                Guid.NewGuid(),
                parcelId,
                null,
                null,
                null,
                new DateOnly(2026, 3, 15),
                30,
                "Appeal window opened.",
                "unit.test"),
            CancellationToken.None);

        var filed = await service.MarkAppealFiledAsync(
            appeal.AppealId,
            new FileCurrentUseAppealDto(new DateOnly(2026, 3, 20), "BOE-2026-001", "unit.test", null),
            CancellationToken.None);

        Assert.Equal(CurrentUseAppealStatus.Filed, filed.Status);
        Assert.Equal("BOE-2026-001", filed.BoardReferenceNumber);
    }

    [Fact]
    public async Task Reclassification_Option_Computes_Deadline()
    {
        var service = new CurrentUseAppealsService();
        var parcelId = Guid.NewGuid();

        var option = await service.CreateReclassificationOptionAsync(
            new CreateCurrentUseReclassificationOptionDto(
                Guid.NewGuid(),
                parcelId,
                null,
                "FARM_AND_AGRICULTURAL",
                "OPEN_SPACE",
                new DateOnly(2026, 3, 15),
                30,
                "Reclassification option opened.",
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(new DateOnly(2026, 4, 14), option.ApplicationDeadline);
        Assert.Equal(CurrentUseReclassificationStatus.OptionAvailable, option.Status);
    }
}
