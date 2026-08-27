using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services.Dossier;

public static class DossierMutationRuntimeRegistration
{
    public static void AddDossierMutationRuntime(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var options = configuration
            .GetSection(DossierMutationOptions.SectionName)
            .Get<DossierMutationOptions>() ?? new DossierMutationOptions();
        if (!Enum.IsDefined(options.Mode))
        {
            throw new InvalidOperationException(
                $"Unsupported Dossier mutation-decision mode: {options.Mode}.");
        }
        if (options.TimeoutSeconds is < 1 or > 30)
        {
            throw new InvalidOperationException(
                "Dossier mutation-decision timeout must be between 1 and 30 seconds.");
        }

        if (options.Mode == DossierMutationMode.Disabled)
        {
            AddUnavailableRuntime(
                services,
                options,
                "Canonical Dossier mutation-decision runtime is disabled.");
            return;
        }
        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Dossier mutation-decision LocalExact selection is restricted to Development.");
        }
        if (!DossierEvidenceRegistryReadArtifactVerifier.TryResolveSovereignRoot(
                environment.ContentRootPath,
                out var sovereignRoot))
        {
            options.Mode = DossierMutationMode.Disabled;
            AddUnavailableRuntime(
                services,
                options,
                "Published Development hosts do not contain the sovereign Dossier mutation slot.");
            return;
        }

        AddLocalExactRuntime(
            services,
            options,
            new DossierEvidenceRegistryReadArtifactVerifier(
                sovereignRoot,
                DossierMutationArtifactExpectation.Canonical),
            DossierEvidenceRegistryReadRuntimeRegistration.ResolveNodeExecutablePath());
    }

    internal static void AddLocalExactRuntime(
        IServiceCollection services,
        DossierMutationOptions options,
        DossierEvidenceRegistryReadArtifactVerifier verifier,
        string nodeExecutablePath)
    {
        var artifact = verifier.Verify();
        options.ModulePath = artifact.ModulePath;
        options.SchemaPath = artifact.SchemaPath;
        options.NodeExecutablePath = Path.GetFullPath(nodeExecutablePath);

        services.AddSingleton<IOptions<DossierMutationOptions>>(Options.Create(options));
        services.AddSingleton(provider => new DossierMutationProcessHost(
            provider.GetRequiredService<IOptions<DossierMutationOptions>>()
                .Value.NodeExecutablePath,
            TimeSpan.FromSeconds(
                provider.GetRequiredService<IOptions<DossierMutationOptions>>()
                    .Value.TimeoutSeconds)));
        services.AddSingleton<IDossierMutationProcessHost>(provider =>
            new DossierMutationVerifiedProcessHost(
                provider.GetRequiredService<DossierMutationProcessHost>(),
                verifier));
        services.AddScoped<IDossierMutationDecisionPort, DossierMutationDecisionPort>();
    }

    private static void AddUnavailableRuntime(
        IServiceCollection services,
        DossierMutationOptions options,
        string message)
    {
        services.AddSingleton<IOptions<DossierMutationOptions>>(Options.Create(options));
        services.AddSingleton<IDossierMutationDecisionPort>(
            new UnavailableDossierMutationDecisionPort(message));
    }
}

internal sealed class DossierMutationVerifiedProcessHost(
    DossierMutationProcessHost inner,
    DossierEvidenceRegistryReadArtifactVerifier verifier) : IDossierMutationProcessHost
{
    public async Task<DossierMutationProcessResult> DecideAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string requestJson,
        CancellationToken cancellationToken = default)
    {
        DossierEvidenceRegistryReadVerifiedArtifact artifact;
        try
        {
            artifact = verifier.Verify();
        }
        catch (DossierEvidenceRegistryReadArtifactException exception)
        {
            return IdentityFailure(exception.Message);
        }

        if (!string.Equals(
                modulePath,
                artifact.ModulePath,
                DossierEvidenceRegistryReadArtifactVerifier.PathComparison)
            || !string.Equals(
                schemaPath,
                artifact.SchemaPath,
                DossierEvidenceRegistryReadArtifactVerifier.PathComparison)
            || !string.Equals(
                expectedModuleSha256,
                DossierMutationOptions.ExpectedModuleSha256,
                StringComparison.Ordinal)
            || !string.Equals(
                expectedSchemaSha256,
                DossierMutationOptions.ExpectedSchemaSha256,
                StringComparison.Ordinal))
        {
            return IdentityFailure(
                "Dossier mutation invocation did not request the verified canonical artifact identity.");
        }

        return await inner.DecideAsync(
                artifact.ModulePath,
                DossierMutationOptions.ExpectedModuleSha256,
                artifact.SchemaPath,
                DossierMutationOptions.ExpectedSchemaSha256,
                requestJson,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static DossierMutationProcessResult IdentityFailure(string message) => new(
        DossierMutationProcessFailure.RuntimeIdentityMismatch,
        null,
        null,
        null,
        null,
        null,
        message);
}

internal static class DossierMutationArtifactExpectation
{
    internal static DossierEvidenceRegistryReadArtifactExpectation Canonical { get; } = new(
        DossierMutationOptions.ExpectedArtifactType,
        DossierMutationOptions.ExpectedContract,
        DossierMutationOptions.ExpectedRepository,
        DossierMutationOptions.ExpectedSourceBranch,
        DossierMutationOptions.ExpectedCommit,
        DossierMutationOptions.ExpectedModulePath,
        DossierMutationOptions.ExpectedModuleFilename,
        DossierMutationOptions.ExpectedModuleSha256,
        DossierMutationOptions.ExpectedModuleLength,
        DossierMutationOptions.ExpectedSchemaPath,
        DossierMutationOptions.ExpectedSchemaFilename,
        DossierMutationOptions.ExpectedSchemaSha256,
        DossierMutationOptions.ExpectedSchemaLength,
        DossierMutationOptions.ExpectedSourceManifestPath,
        DossierMutationOptions.ExpectedSourceManifestSha256,
        DossierMutationOptions.ExpectedPublishedManifestSha256,
        DossierMutationOptions.ExpectedPublishedManifestLength,
        DossierMutationOptions.ExpectedContractSourceSha,
        DossierMutationOptions.ExpectedSourceDtoSha256,
        DossierMutationOptions.ExpectedTransport,
        DossierMutationOptions.ArtifactSlotRelativePath);
}
