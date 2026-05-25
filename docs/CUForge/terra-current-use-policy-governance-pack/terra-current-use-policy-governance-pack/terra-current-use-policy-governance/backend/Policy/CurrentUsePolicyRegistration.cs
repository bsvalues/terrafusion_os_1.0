
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Policy;

public static class CurrentUsePolicyRegistration
{
    public static IServiceCollection AddTerraCurrentUsePolicy(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUsePolicyService, CurrentUsePolicyService>();
        return services;
    }
}
