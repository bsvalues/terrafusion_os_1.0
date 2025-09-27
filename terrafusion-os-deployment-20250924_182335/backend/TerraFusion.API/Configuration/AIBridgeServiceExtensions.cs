using TerraFusion.API.Services;

namespace TerraFusion.API.Configuration
{
    public static class AIBridgeServiceExtensions
    {
        public static IServiceCollection AddAIBridgeServices(this IServiceCollection services)
        {
            services.AddScoped<IAIModuleBridge, AIModuleBridge>();
            return services;
        }
    }
}