using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.AI;

public static class CurrentUseAiServiceRegistration
{
    public static IServiceCollection AddTerraCurrentUseAiAssist(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseAiAssistService, CurrentUseAiAssistService>();
        return services;
    }
}
