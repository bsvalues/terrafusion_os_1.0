using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Services;
using TerraFusion.Data;

namespace TerraFusion.API.Services.Gpt;

public static class GptGroundedContextRuntimeRegistration
{
    public static void AddGptGroundedContextRuntime(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        AddGroundedAnswer(services, configuration, environment);

        var options = configuration
            .GetSection(GptGroundedContextRuntimeOptions.SectionName)
            .Get<GptGroundedContextRuntimeOptions>() ?? new GptGroundedContextRuntimeOptions();
        if (!Enum.IsDefined(options.Mode))
        {
            throw new InvalidOperationException(
                $"Unsupported GPT grounded-context mode: {options.Mode}.");
        }
        if (options.TimeoutSeconds is < 1 or > 30)
        {
            throw new InvalidOperationException(
                "GPT grounded-context timeout must be between 1 and 30 seconds.");
        }

        if (options.Mode == GptGroundedContextRuntimeMode.Disabled)
        {
            services.AddSingleton<IOptions<GptGroundedContextRuntimeOptions>>(Options.Create(options));
            return;
        }
        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "GPT LocalExact selection is restricted to the Development environment.");
        }
        if (!TryResolveSovereignRoot(environment.ContentRootPath, out var sovereignRoot))
        {
            // Published Development images do not contain the local OS-managed artifact slot.
            options.Mode = GptGroundedContextRuntimeMode.Disabled;
            services.AddSingleton<IOptions<GptGroundedContextRuntimeOptions>>(Options.Create(options));
            return;
        }

        var artifactSlot = Path.GetFullPath(Path.Combine(
            sovereignRoot,
            GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace(
                '/',
                Path.DirectorySeparatorChar)));
        options.ModulePath = Path.Combine(
            artifactSlot,
            GptGroundedContextRuntimeOptions.ExpectedModuleFilename);
        options.SchemaPath = Path.Combine(
            artifactSlot,
            GptGroundedContextRuntimeOptions.ExpectedSchemaFilename);
        options.NodeExecutablePath = ResolveNodeExecutablePath();

        services.AddSingleton<IOptions<GptGroundedContextRuntimeOptions>>(Options.Create(options));
        services.AddSingleton<GptGroundedContextProcessHost>(provider =>
            new GptGroundedContextProcessHost(
                sovereignRoot,
                provider.GetRequiredService<IOptions<GptGroundedContextRuntimeOptions>>()
                    .Value.NodeExecutablePath,
                TimeSpan.FromSeconds(
                    provider.GetRequiredService<IOptions<GptGroundedContextRuntimeOptions>>()
                        .Value.TimeoutSeconds),
                logger: provider.GetRequiredService<ILogger<GptGroundedContextProcessHost>>()));
        services.AddSingleton<IGptGroundedContextProcessHost>(provider =>
            provider.GetRequiredService<GptGroundedContextProcessHost>());
        services.AddScoped<IGptGroundedContextConsumer, GptGroundedContextConsumer>();
    }

    private static void AddGroundedAnswer(IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        var local = configuration.GetSection(GptLocalInferenceOptions.SectionName).Get<GptLocalInferenceOptions>() ?? new();
        var runtime = configuration.GetSection(GptGroundedAnswerRuntimeOptions.SectionName).Get<GptGroundedAnswerRuntimeOptions>() ?? new();
        if (!Enum.IsDefined(runtime.Mode) || runtime.TimeoutSeconds is < 1 or > 30)
            throw new InvalidOperationException("Invalid GPT grounded-answer runtime selection.");
        if (runtime.Mode == GptGroundedContextRuntimeMode.LocalExact && !environment.IsDevelopment())
            throw new InvalidOperationException("GPT grounded-answer LocalExact is Development-only.");
        var hasRoot = TryResolveSovereignRoot(environment.ContentRootPath, out var root);
        var enabled = runtime.Mode == GptGroundedContextRuntimeMode.LocalExact && hasRoot;
        services.AddSingleton<IOptions<GptLocalInferenceOptions>>(Options.Create(local));
        services.AddSingleton<IOptions<GptGroundedAnswerRuntimeOptions>>(Options.Create(runtime));
        services.AddHttpClient<GptLocalInferenceProvider>(client => client.Timeout = Timeout.InfiniteTimeSpan)
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            { AllowAutoRedirect = false, UseProxy = false, UseCookies = false, UseDefaultCredentials = false });
        services.AddScoped<IGptLocalInferenceProvider>(provider => provider.GetRequiredService<GptLocalInferenceProvider>());
        services.AddSingleton(new GptGroundedAnswerProcessHost(root,
            enabled ? ResolveNodeExecutablePath() : string.Empty, TimeSpan.FromSeconds(runtime.TimeoutSeconds), enabled));
        services.AddSingleton<IGptGroundedAnswerProcessHost>(provider => provider.GetRequiredService<GptGroundedAnswerProcessHost>());
        // Construct the dedicated retrieval chain with the admitted local adapter. Never resolve
        // the global IEmbeddingService/IRAGService registrations, which may select a remote factory.
        RAGService LocalRag(IServiceProvider provider) => new(
            provider.GetRequiredService<TerraFusionDbContext>(), provider.GetRequiredService<IRAGEmbeddingRepository>(),
            provider.GetRequiredService<GptLocalInferenceProvider>(), provider.GetRequiredService<ILogger<RAGService>>());
        services.AddKeyedScoped<IRAGService>("gpt-local-retrieval", (provider, _) => LocalRag(provider));
        // Controller diagnostics also eagerly depend on RAG. Keep their existing implementations
        // but scope their dependency graph to local retrieval, not the ambient remote factory.
        services.AddKeyedScoped<IBentonRagReadinessService>("gpt-local-retrieval", (provider, _) =>
            new BentonRagReadinessService(LocalRag(provider), provider.GetRequiredService<ILogger<BentonRagReadinessService>>()));
        services.AddKeyedScoped<ISystemGptRagFleetService>("gpt-local-retrieval", (provider, _) =>
            new SystemGptRagFleetService(provider.GetRequiredService<ILogger<SystemGptRagFleetService>>(),
                provider.GetRequiredKeyedService<IBentonRagReadinessService>("gpt-local-retrieval")));
        services.AddKeyedScoped<ISystemGptFederatedOverviewService>("gpt-local-retrieval", (provider, _) =>
            new SystemGptFederatedOverviewService(provider.GetRequiredService<ILogger<SystemGptFederatedOverviewService>>(),
                provider.GetService<ISystemGptMetricsService>(), provider.GetService<ISystemGptModeService>(),
                provider.GetRequiredKeyedService<IBentonRagReadinessService>("gpt-local-retrieval")));
        services.AddKeyedScoped<ISystemGptAtlasService>("gpt-local-retrieval", (provider, _) =>
            new SystemGptAtlasService(provider.GetRequiredService<ILogger<SystemGptAtlasService>>(),
                provider.GetRequiredKeyedService<ISystemGptFederatedOverviewService>("gpt-local-retrieval"),
                provider.GetRequiredKeyedService<ISystemGptRagFleetService>("gpt-local-retrieval"),
                provider.GetService<ISystemGptGuardrailService>()));
        services.AddKeyedScoped<ISystemGptAtlasLiveService>("gpt-local-retrieval", (provider, _) =>
            new SystemGptAtlasLiveService(
                new SystemGptAtlasTelemetrySource(provider.GetRequiredKeyedService<ISystemGptAtlasService>("gpt-local-retrieval"),
                    provider.GetRequiredService<ILogger<SystemGptAtlasTelemetrySource>>()),
                ActivatorUtilities.GetServiceOrCreateInstance<SystemGptAtlasClassifier>(provider),
                provider.GetRequiredService<IOptions<TerraFusion.AI.Models.SystemGptAtlasLiveOptions>>(),
                provider.GetRequiredService<ILogger<SystemGptAtlasLiveService>>()));
        services.AddScoped<IGptGroundedAnswerService>(provider => new GptGroundedAnswerService(
            provider.GetRequiredService<TerraFusionDbContext>(),
            new GptGroundedContextConsumer(provider.GetRequiredService<GptGroundedAnswerProcessHost>(), LocalRag(provider),
                provider.GetRequiredService<ILogger<GptGroundedContextConsumer>>()),
            provider.GetRequiredService<IGptLocalInferenceProvider>(), provider.GetRequiredService<IGptGroundedAnswerProcessHost>(),
            provider.GetRequiredService<IOptions<GptLocalInferenceOptions>>()));
        services.AddScoped<IGPTOrchestrationService>(provider => new GPTOrchestrationService(
            provider.GetRequiredService<TerraFusionDbContext>(), provider.GetRequiredService<ILogger<GPTOrchestrationService>>(),
            LocalRag(provider), provider.GetRequiredService<GptLocalInferenceProvider>(),
            provider.GetService<ISystemGptMetricsService>(), provider.GetRequiredService<IGptGroundedAnswerService>()));
    }

    internal static bool TryResolveSovereignRoot(string contentRoot, out string sovereignRoot)
    {
        sovereignRoot = string.Empty;
        if (string.IsNullOrWhiteSpace(contentRoot) || !Path.IsPathFullyQualified(contentRoot))
        {
            return false;
        }
        var current = new DirectoryInfo(Path.GetFullPath(contentRoot));
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "PATH_CANON_REGISTER.md"))
                && File.Exists(Path.Combine(
                    current.FullName,
                    "backend",
                    "src",
                    "TerraFusion.API",
                    "TerraFusion.API.csproj")))
            {
                sovereignRoot = current.FullName;
                return true;
            }
            current = current.Parent;
        }
        return false;
    }

    internal static string ResolveNodeExecutablePath(string? searchPath = null)
    {
        var path = searchPath ?? Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException(
                "PATH is unavailable; the exact GPT runtime cannot resolve Node.");
        }
        var names = OperatingSystem.IsWindows() ? new[] { "node.exe" } : new[] { "node" };
        foreach (var entry in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var directory = entry.Trim().Trim('"');
            if (!Path.IsPathFullyQualified(directory)) continue;
            foreach (var name in names)
            {
                var candidate = Path.GetFullPath(Path.Combine(directory, name));
                var info = new FileInfo(candidate);
                if (info.Exists
                    && !info.Attributes.HasFlag(FileAttributes.ReparsePoint)
                    && info.LinkTarget is null)
                {
                    return candidate;
                }
            }
        }
        throw new InvalidOperationException("A canonical Node executable was not found on PATH.");
    }
}
