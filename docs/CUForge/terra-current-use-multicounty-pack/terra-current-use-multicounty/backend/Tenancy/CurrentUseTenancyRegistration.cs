using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Tenancy;

public static class CurrentUseTenancyRegistration
{
    public static IServiceCollection AddTerraCurrentUseTenancy(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseTenantService, CurrentUseTenantService>();
        return services;
    }
}
