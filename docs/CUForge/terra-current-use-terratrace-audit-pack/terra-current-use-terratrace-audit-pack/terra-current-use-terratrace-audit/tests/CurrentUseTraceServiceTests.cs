using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Trace;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseTraceServiceTests
{
    [Fact]
    public async Task Appended_Events_Are_Returned_For_Parcel()
    {
        var service = new CurrentUseTraceService();
        var parcelId = Guid.NewGuid();

        await service.AppendAsync(
            new AppendCurrentUseTraceEventDto(
                Guid.NewGuid(),
                parcelId,
                null,
                null,
                CurrentUseTraceAction.ClassificationCreated,
                "unit.test",
                "Unit Test",
                "classification created",
                null,
                Array.Empty<Guid>(),
                null),
            CancellationToken.None);

        var events = await service.GetParcelTraceAsync(parcelId, CancellationToken.None);

        Assert.Single(events);
    }

    [Fact]
    public async Task Chain_Verifies_After_Multiple_Appends()
    {
        var service = new CurrentUseTraceService();
        var parcelId = Guid.NewGuid();
        var countyId = Guid.NewGuid();

        await service.AppendAsync(
            new AppendCurrentUseTraceEventDto(
                countyId,
                parcelId,
                null,
                null,
                CurrentUseTraceAction.ClassificationCreated,
                "unit.test",
                "Unit Test",
                "classification created",
                null,
                Array.Empty<Guid>(),
                null),
            CancellationToken.None);

        await service.AppendAsync(
            new AppendCurrentUseTraceEventDto(
                countyId,
                parcelId,
                null,
                null,
                CurrentUseTraceAction.RollbackCalculationRun,
                "unit.test",
                "Unit Test",
                "rollback calculated",
                "CU_ROLLBACK_ENGINE_v2026_03_01",
                Array.Empty<Guid>(),
                null),
            CancellationToken.None);

        var valid = await service.VerifyChainAsync(parcelId, CancellationToken.None);

        Assert.True(valid);
    }
}
