using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Notices;

public static class CurrentUseNoticeIssuanceRegistration
{
    public static IServiceCollection AddTerraCurrentUseNoticeIssuance(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseNoticeIssuanceService, CurrentUseNoticeIssuanceService>();
        return services;
    }
}
