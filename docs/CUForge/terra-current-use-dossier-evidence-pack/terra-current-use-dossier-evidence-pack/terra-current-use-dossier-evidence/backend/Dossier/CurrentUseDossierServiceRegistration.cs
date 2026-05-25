using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Dossier;

public static class CurrentUseDossierServiceRegistration
{
    public static IServiceCollection AddTerraCurrentUseDossier(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseDossierService, CurrentUseDossierService>();
        return services;
    }
}
