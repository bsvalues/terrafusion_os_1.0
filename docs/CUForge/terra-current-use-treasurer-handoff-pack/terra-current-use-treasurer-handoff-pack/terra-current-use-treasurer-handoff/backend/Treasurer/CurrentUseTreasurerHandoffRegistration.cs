using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Treasurer;

public static class CurrentUseTreasurerHandoffRegistration
{
    public static IServiceCollection AddTerraCurrentUseTreasurerHandoff(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseTreasurerHandoffService, CurrentUseTreasurerHandoffService>();
        return services;
    }
}
