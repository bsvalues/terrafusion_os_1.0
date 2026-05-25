
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Analytics;

public interface ICurrentUseAnalyticsService
{
    Task<CurrentUseOperationalSummaryDto> GetOperationalSummaryAsync(
        Guid countyId,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseAnalyticsService : ICurrentUseAnalyticsService
{
    public Task<CurrentUseOperationalSummaryDto> GetOperationalSummaryAsync(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        var summary = new CurrentUseOperationalSummaryDto(
            countyId,
            1248,
            58214.42m,
            12450221.12m,
            138,
            22,
            14,
            77,
            new[]
            {
                new CurrentUseKpiDto(
                    "classified_parcels",
                    "Classified Parcels",
                    1248,
                    "count",
                    "stable"),

                new CurrentUseKpiDto(
                    "rollback_exposure",
                    "Rollback Exposure",
                    12450221.12m,
                    "usd",
                    "up")
            },
            DateTimeOffset.UtcNow);

        return Task.FromResult(summary);
    }
}
