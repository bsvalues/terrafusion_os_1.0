
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Communications;

public static class CurrentUseOwnerCommunicationRegistration
{
    public static IServiceCollection AddTerraCurrentUseOwnerCommunications(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseOwnerCommunicationService, CurrentUseOwnerCommunicationService>();
        return services;
    }
}
