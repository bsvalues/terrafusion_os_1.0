using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Modules.CurrentUse.Import;

public static class CurrentUseImportRegistration
{
    public static IServiceCollection AddTerraCurrentUseImport(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUseImportValidator, ClassificationInventoryImportValidator>();
        services.AddScoped<ICurrentUseImportValidator, RollbackWorksheetImportValidator>();
        services.AddScoped<ICurrentUseImportService, CurrentUseImportService>();
        return services;
    }
}
