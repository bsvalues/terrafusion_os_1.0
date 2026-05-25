using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Compliance;

public static class CurrentUseComplianceRegistration
{
    public static IServiceCollection AddTerraCurrentUseCompliance(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseComplianceService, CurrentUseComplianceService>();
        return services;
    }
}
