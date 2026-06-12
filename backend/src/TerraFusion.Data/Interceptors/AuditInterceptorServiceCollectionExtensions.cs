using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.Time;

namespace TerraFusion.Data.Interceptors;

/// <summary>
/// DI wiring for the WS-3 / AU-2 audit-stamping interceptor.
/// </summary>
public static class AuditInterceptorServiceCollectionExtensions
{
    /// <summary>
    /// Registers the audit-stamping interceptor and its UTC clock. Call once during service
    /// setup (before AddDbContext&lt;TerraFusionDbContext&gt;); the context's DI constructor
    /// picks it up and wires it via OnConfiguring so every write is stamped + audited.
    /// Requires IRequestUserContextAccessor to be registered (AddHttpContextAccessor + the
    /// HttpContextRequestUserContextAccessor) for real user attribution; falls back to "system".
    /// </summary>
    public static IServiceCollection AddAuditableEntityStamping(this IServiceCollection services)
    {
        services.AddSingleton<IClock, SystemClock>();
        services.AddScoped<AuditableEntityInterceptor>();
        return services;
    }
}
