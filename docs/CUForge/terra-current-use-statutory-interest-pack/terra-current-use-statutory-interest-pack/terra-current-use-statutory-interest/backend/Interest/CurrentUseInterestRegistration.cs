using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Interest;

public static class CurrentUseInterestRegistration
{
    public static IServiceCollection AddTerraCurrentUseInterest(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseInterestRateProvider, CurrentUseInterestRateProvider>();
        services.AddScoped<ICurrentUseInterestCalculator, CurrentUseInterestCalculator>();
        return services;
    }
}
