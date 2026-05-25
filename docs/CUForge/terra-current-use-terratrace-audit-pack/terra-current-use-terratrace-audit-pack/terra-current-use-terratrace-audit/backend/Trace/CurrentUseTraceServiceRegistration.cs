using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Modules.CurrentUse.Audit;

namespace TerraFusion.Modules.CurrentUse.Trace;

public static class CurrentUseTraceServiceRegistration
{
    public static IServiceCollection AddTerraCurrentUseTrace(this IServiceCollection services)
    {
        services.AddSingleton<ICurrentUseTraceService, CurrentUseTraceService>();

        // Replace the Phase 1 Noop audit sink with Trace-backed sink.
        services.AddScoped<ICurrentUseAuditSink, CurrentUseTraceAuditSink>();

        return services;
    }
}
