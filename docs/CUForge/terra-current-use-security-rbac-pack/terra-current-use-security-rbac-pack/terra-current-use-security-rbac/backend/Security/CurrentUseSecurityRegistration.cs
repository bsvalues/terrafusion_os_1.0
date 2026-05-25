using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Security;

public static class CurrentUseSecurityRegistration
{
    public static IServiceCollection AddTerraCurrentUseSecurity(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseAuthorizationService, CurrentUseAuthorizationService>();
        return services;
    }
}
