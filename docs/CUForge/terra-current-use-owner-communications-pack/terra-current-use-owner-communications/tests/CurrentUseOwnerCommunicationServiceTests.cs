
using TerraFusion.Modules.CurrentUse.Communications;
using TerraFusion.Modules.CurrentUse.Dto;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseOwnerCommunicationServiceTests
{
    [Fact]
    public async Task Rollback_Summary_Includes_Disclaimer()
    {
        var service = new CurrentUseOwnerCommunicationService();

        var result = await service.GenerateAsync(
            new CreateCurrentUseOwnerCommunicationDto(
                Guid.NewGuid(),
                Guid.NewGuid(),
                CurrentUseCommunicationType.RollbackSummary,
                "Sample Owner",
                "FARM_AND_AGRICULTURAL",
                11240.55m,
                null,
                "en-US",
                "unit.test"),
            CancellationToken.None);

        Assert.Contains("not a substitute", result.PlainLanguageDisclaimer);
        Assert.Contains("rollback estimate", result.Body);
    }
}
