using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Modules.CurrentUse.Audit;
using TerraFusion.Modules.CurrentUse.Domain.Rollback;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse;

public static class CurrentUseModuleServiceCollectionExtensions
{
    public static IServiceCollection AddTerraCurrentUse(this IServiceCollection services)
    {
        services.AddScoped<RollbackCalculator>();
        services.AddScoped<ICurrentUseService, CurrentUseService>();

        // Phase 1 placeholder. Replace with TerraTrace sink when available.
        services.AddScoped<ICurrentUseAuditSink, NoopCurrentUseAuditSink>();

        return services;
    }
}
