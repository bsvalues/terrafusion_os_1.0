using Microsoft.Extensions.DependencyInjection;
using TerraFusion.CurrentUse.Domain.Rollback;
using TerraFusion.CurrentUse.Services;

namespace TerraFusion.CurrentUse;

/// <summary>
/// DI registration for TerraFusion Current Use Alpha module.
/// Call builder.Services.AddTerraCurrentUseAlpha() in Program.cs.
/// </summary>
public static class CurrentUseAlphaRegistration
{
    public static IServiceCollection AddTerraCurrentUseAlpha(this IServiceCollection services)
    {
        services.AddScoped<CurrentUseAlphaRollbackEngine>();
        services.AddScoped<ICurrentUseAlphaService, CurrentUseAlphaService>();
        return services;
    }
}
