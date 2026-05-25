
using TerraFusion.Modules.CurrentUse.Analytics;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseAnalyticsServiceTests
{
    [Fact]
    public async Task Summary_Returns_Kpis()
    {
        var service = new CurrentUseAnalyticsService();

        var summary = await service.GetOperationalSummaryAsync(
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.True(summary.TotalClassifiedParcels > 0);
        Assert.True(summary.Kpis.Count > 0);
    }
}
