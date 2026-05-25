using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Modules.CurrentUse.Health;

namespace TerraFusion.Modules.CurrentUse.Observability;

public static class CurrentUseObservabilityRegistration
{
    public static IServiceCollection AddTerraCurrentUseObservability(this IServiceCollection services)
    {
        services.AddSingleton<ICurrentUseTelemetryService, CurrentUseTelemetryService>();
        services.AddScoped<ICurrentUseHealthService, CurrentUseHealthService>();
        return services;
    }
}
