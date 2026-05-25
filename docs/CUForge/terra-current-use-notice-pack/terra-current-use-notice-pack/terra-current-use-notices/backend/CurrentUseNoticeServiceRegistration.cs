using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Modules.CurrentUse.Domain.Notices;
using TerraFusion.Modules.CurrentUse.Services;

namespace TerraFusion.Modules.CurrentUse;

public static class CurrentUseNoticeServiceRegistration
{
    public static IServiceCollection AddTerraCurrentUseNotices(this IServiceCollection services)
    {
        services.AddScoped<CurrentUseNoticeRenderer>();
        services.AddScoped<ICurrentUseNoticeService, CurrentUseNoticeService>();
        return services;
    }
}
