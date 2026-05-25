using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Modules.CurrentUse.Domain;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse;

public static class CurrentUseRegistration
{
    public static IServiceCollection AddTerraCurrentUse(this IServiceCollection services)
    {
        services.AddScoped<RollbackCalculator>();
        services.AddScoped<ICurrentUseService, CurrentUseService>();
        return services;
    }
}
