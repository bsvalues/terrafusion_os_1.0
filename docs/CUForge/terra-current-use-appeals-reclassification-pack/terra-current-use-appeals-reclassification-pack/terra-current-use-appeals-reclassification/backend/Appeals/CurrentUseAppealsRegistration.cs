using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Appeals;

public static class CurrentUseAppealsRegistration
{
    public static IServiceCollection AddTerraCurrentUseAppeals(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseAppealsService, CurrentUseAppealsService>();
        return services;
    }
}
