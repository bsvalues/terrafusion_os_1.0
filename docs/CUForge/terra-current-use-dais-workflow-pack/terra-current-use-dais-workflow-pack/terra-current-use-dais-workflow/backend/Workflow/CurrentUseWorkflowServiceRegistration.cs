using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Workflow;

public static class CurrentUseWorkflowServiceRegistration
{
    public static IServiceCollection AddTerraCurrentUseWorkflow(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseWorkflowService, CurrentUseWorkflowService>();
        return services;
    }
}
