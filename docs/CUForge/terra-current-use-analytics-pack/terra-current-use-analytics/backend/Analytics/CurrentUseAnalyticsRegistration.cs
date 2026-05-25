
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Analytics;

public static class CurrentUseAnalyticsRegistration
{
    public static IServiceCollection AddTerraCurrentUseAnalytics(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseAnalyticsService, CurrentUseAnalyticsService>();
        return services;
    }
}
