
using TerraFusion.Modules.CurrentUse.Reporting;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseStateReportingTests
{
    [Fact]
    public async Task Reporting_Batch_Generates()
    {
        var service = new CurrentUseStateReportingService();

        var batch = await service.GenerateBatchAsync(
            Guid.NewGuid(),
            "WA",
            "2026",
            "unit.test",
            CancellationToken.None);

        Assert.True(batch.RecordCount > 0);
    }
}
