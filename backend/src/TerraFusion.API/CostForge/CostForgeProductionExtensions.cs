using FluentValidation;
using TerraFusion.API.Controllers;

namespace TerraFusion.API.CostForge;

/// <summary>
/// Production service extensions for CostForge module.
/// Registers validators, health check, audit service, and exception middleware.
/// Call AddCostForgeProductionServices() in Program.cs ConfigureServices.
/// Call UseCostForgeExceptionHandling() in Program.cs middleware pipeline.
/// </summary>
public static class CostForgeProductionExtensions
{
    public static IServiceCollection AddCostForgeProductionServices(this IServiceCollection services)
    {
        // FluentValidation validators
        services.AddScoped<IValidator<CostEstimateRequest>, CostEstimateRequestValidator>();
        services.AddScoped<IValidator<DepreciationCalculationRequest>, DepreciationCalculationRequestValidator>();
        services.AddScoped<IValidator<PropertyCostCalculationRequest>, PropertyCostCalculationRequestValidator>();
        services.AddScoped<IValidator<CostForgeController.NoiCalculationRequest>, NoiCalculationRequestValidator>();
        services.AddScoped<IValidator<CostForgeController.IncomeValuationRequest>, IncomeValuationRequestValidator>();
        services.AddScoped<IValidator<ScaleAgentsRequest>, ScaleAgentsRequestValidator>();

        // Audit trail (singleton — in-memory hash chain)
        services.AddSingleton<ICostForgeAuditService, CostForgeAuditService>();

        // Health check
        services.AddHealthChecks()
            .AddCheck<CostForgeHealthCheck>(
                "costforge-engine",
                tags: new[] { "costforge", "ready" });

        return services;
    }

    public static IApplicationBuilder UseCostForgeExceptionHandling(this IApplicationBuilder app)
    {
        app.UseMiddleware<CostForgeExceptionMiddleware>();
        return app;
    }
}
