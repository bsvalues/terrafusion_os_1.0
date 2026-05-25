using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Composition;

public static class CurrentUseFullModuleRegistration
{
    public static IServiceCollection AddTerraCurrentUseFullModule(this IServiceCollection services)
    {
        // Core
        services.AddTerraCurrentUse();

        // Optional slices. Uncomment only after each pack is integrated.
        //
        // services.AddTerraCurrentUseNotices();
        // services.AddTerraCurrentUseAiAssist();
        // services.AddTerraCurrentUseAtlas();
        // services.AddTerraCurrentUseWorkflow();
        // services.AddTerraCurrentUseDossier();
        // services.AddTerraCurrentUseTrace();
        // services.AddTerraCurrentUseTreasurerHandoff();
        // services.AddTerraCurrentUseAppeals();
        // services.AddTerraCurrentUsePolicy();
        // services.AddTerraCurrentUseCompliance();
        // services.AddTerraCurrentUseAnalytics();

        return services;
    }
}
