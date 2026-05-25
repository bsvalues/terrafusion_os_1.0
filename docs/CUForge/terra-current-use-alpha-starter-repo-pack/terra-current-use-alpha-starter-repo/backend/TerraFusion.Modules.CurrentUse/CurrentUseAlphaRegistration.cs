using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Modules.CurrentUse.Domain.Rollback;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse;

public static class CurrentUseAlphaRegistration
{
    public static IServiceCollection AddTerraCurrentUseAlpha(this IServiceCollection services)
    {
        services.AddScoped<CurrentUseAlphaRollbackEngine>();
        services.AddScoped<ICurrentUseAlphaService, CurrentUseAlphaService>();
        return services;
    }
}
