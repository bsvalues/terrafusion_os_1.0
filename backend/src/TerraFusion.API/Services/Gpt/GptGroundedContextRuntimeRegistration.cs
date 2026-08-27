using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;

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
