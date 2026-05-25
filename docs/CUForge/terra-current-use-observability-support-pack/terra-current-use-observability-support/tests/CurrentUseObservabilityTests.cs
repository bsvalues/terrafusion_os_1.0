using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Health;
using TerraFusion.Modules.CurrentUse.Observability;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseObservabilityTests
{
    [Fact]
    public async Task Health_Returns_Module_Status()
    {
        var service = new CurrentUseHealthService();

        var health = await service.CheckAsync(CancellationToken.None);

        Assert.Equal("terra-current-use", health.ModuleId);
        Assert.NotEmpty(health.Checks);
    }

    [Fact]
    public void Telemetry_Records_Errors()
    {
        var telemetry = new CurrentUseTelemetryService();

        telemetry.RecordError(new CurrentUseErrorDto(
            CurrentUseErrorCodes.RollbackMissingTaxYearData,
            "warning",
            "Missing tax year data.",
            "Missing year 2023.",
            "corr-001",
            DateTimeOffset.UtcNow));

        Assert.Single(telemetry.GetRecentErrors());
    }
}
