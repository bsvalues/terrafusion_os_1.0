using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services.Dossier;

public static class DossierPacketWorkflowRuntimeRegistration
{
    public static void AddDossierPacketWorkflowRuntime(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var options = configuration.GetSection("DossierPacketWorkflow").Get<DossierPacketWorkflowOptions>() ?? new();
        if (options.Mode is not ("Disabled" or "LocalExact") || options.TimeoutSeconds is < 1 or > 30)
            throw new InvalidOperationException("Unsupported Dossier packet workflow mode or timeout.");
        services.AddScoped<DossierPacketWorkflowService>();
        if (options.Mode == "Disabled")
        {
            services.AddSingleton<IDossierPacketWorkflowDecisionPort>(new DossierPacketWorkflowDecisionPort(null));
            return;
        }
        if (!environment.IsDevelopment()) throw new InvalidOperationException("Dossier packet workflow LocalExact is Development-only.");
        if (!DossierEvidenceRegistryReadArtifactVerifier.TryResolveSovereignRoot(environment.ContentRootPath, out var root))
            throw new InvalidOperationException("Dossier packet workflow requires an owned sovereign checkout.");
        services.AddSingleton(_ => new DossierPacketWorkflowProcessHost(
            DossierEvidenceRegistryReadRuntimeRegistration.ResolveNodeExecutablePath(),
            Path.Combine(root, DossierPacketWorkflowOptions.ArtifactSlot), Path.Combine(root, ".tmp", "dossier-packet-invocations"),
            TimeSpan.FromSeconds(options.TimeoutSeconds)));
        services.AddScoped<IDossierPacketWorkflowDecisionPort, DossierPacketWorkflowDecisionPort>();
    }
}
