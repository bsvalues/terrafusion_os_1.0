using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Services.Dais;

public static class DaisAppealMutationRuntimeRegistration
{
    public static void AddDaisAppealMutationRuntime(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var options = configuration
            .GetSection(DaisAppealMutationOptions.SectionName)
            .Get<DaisAppealMutationOptions>() ?? new DaisAppealMutationOptions();
        if (!Enum.IsDefined(options.Mode))
        {
            throw new InvalidOperationException(
                $"Unsupported Dais appeal-mutation mode: {options.Mode}.");
        }
        if (options.TimeoutSeconds is < 1 or > 30)
        {
            throw new InvalidOperationException(
                "Dais appeal-mutation timeout must be between 1 and 30 seconds.");
        }

        if (options.Mode == DaisAppealMutationMode.Disabled)
        {
            AddUnavailableRuntime(
                services,
                options,
                "Canonical Dais appeal-mutation runtime is disabled.");
            return;
        }
        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Dais appeal-mutation LocalExact selection is restricted to Development.");
        }
        if (!DaisAppealWorkflowArtifactVerifier.TryResolveSovereignRoot(
                environment.ContentRootPath,
                out var sovereignRoot))
        {
            options.Mode = DaisAppealMutationMode.Disabled;
            AddUnavailableRuntime(
                services,
                options,
                "Published Development hosts do not contain the sovereign Dais mutation slot.");
            return;
        }

        AddLocalExactRuntime(
            services,
            options,
            new DaisAppealWorkflowArtifactVerifier(
                sovereignRoot,
                DaisAppealMutationArtifactExpectation.Canonical),
            DaisAppealWorkflowRuntimeRegistration.ResolveNodeExecutablePath());
    }

    internal static void AddLocalExactRuntime(
        IServiceCollection services,
        DaisAppealMutationOptions options,
        DaisAppealWorkflowArtifactVerifier verifier,
        string nodeExecutablePath)
    {
        var artifact = verifier.Verify();
        options.ModulePath = artifact.ModulePath;
        options.SchemaPath = artifact.SchemaPath;
        options.NodeExecutablePath = Path.GetFullPath(nodeExecutablePath);

        services.AddSingleton<IOptions<DaisAppealMutationOptions>>(Options.Create(options));
        services.AddSingleton(provider => new DaisAppealMutationProcessHost(
            provider.GetRequiredService<IOptions<DaisAppealMutationOptions>>()
                .Value.NodeExecutablePath,
            TimeSpan.FromSeconds(
                provider.GetRequiredService<IOptions<DaisAppealMutationOptions>>()
                    .Value.TimeoutSeconds)));
        services.AddSingleton<IDaisAppealMutationProcessHost>(provider =>
            new DaisAppealMutationVerifiedProcessHost(
                provider.GetRequiredService<DaisAppealMutationProcessHost>(),
                verifier));
        services.AddScoped<IDaisAppealMutationDecisionPort, DaisAppealMutationDecisionPort>();
    }

    private static void AddUnavailableRuntime(
        IServiceCollection services,
        DaisAppealMutationOptions options,
        string message)
    {
        services.AddSingleton<IOptions<DaisAppealMutationOptions>>(Options.Create(options));
        services.AddSingleton<IDaisAppealMutationDecisionPort>(
            new UnavailableDaisAppealMutationDecisionPort(message));
    }
}

internal sealed class DaisAppealMutationVerifiedProcessHost(
    DaisAppealMutationProcessHost inner,
    DaisAppealWorkflowArtifactVerifier verifier) : IDaisAppealMutationProcessHost
{
    public async Task<DaisAppealMutationProcessResult> DecideAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string requestJson,
        CancellationToken cancellationToken = default)
    {
        DaisAppealWorkflowVerifiedArtifact artifact;
        try
        {
            artifact = verifier.Verify();
        }
        catch (DaisAppealWorkflowArtifactException exception)
        {
            return IdentityFailure(exception.Message);
        }

        if (!string.Equals(
                modulePath,
                artifact.ModulePath,
                DaisAppealWorkflowArtifactVerifier.PathComparison)
            || !string.Equals(
                schemaPath,
                artifact.SchemaPath,
                DaisAppealWorkflowArtifactVerifier.PathComparison)
            || !string.Equals(
                expectedModuleSha256,
                DaisAppealMutationOptions.ExpectedModuleSha256,
                StringComparison.Ordinal)
            || !string.Equals(
                expectedSchemaSha256,
                DaisAppealMutationOptions.ExpectedSchemaSha256,
                StringComparison.Ordinal))
        {
            return IdentityFailure(
                "Dais mutation invocation did not request the verified canonical artifact identity.");
        }

        return await inner.DecideAsync(
                artifact.ModulePath,
                DaisAppealMutationOptions.ExpectedModuleSha256,
                artifact.SchemaPath,
                DaisAppealMutationOptions.ExpectedSchemaSha256,
                requestJson,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static DaisAppealMutationProcessResult IdentityFailure(string message) => new(
        DaisAppealMutationProcessFailure.RuntimeIdentityMismatch,
        null,
        null,
        null,
        null,
        null,
        message);
}

internal static class DaisAppealMutationArtifactExpectation
{
    internal static DaisAppealWorkflowArtifactExpectation Canonical { get; } = new(
        DaisAppealMutationOptions.ExpectedArtifactType,
        DaisAppealMutationOptions.ExpectedContract,
        DaisAppealMutationOptions.ExpectedRepository,
        DaisAppealMutationOptions.ExpectedSourceBranch,
        DaisAppealMutationOptions.ExpectedCommit,
        DaisAppealMutationOptions.ExpectedModulePath,
        DaisAppealMutationOptions.ExpectedModuleFilename,
        DaisAppealMutationOptions.ExpectedModuleSha256,
        DaisAppealMutationOptions.ExpectedModuleLength,
        DaisAppealMutationOptions.ExpectedSchemaPath,
        DaisAppealMutationOptions.ExpectedSchemaFilename,
        DaisAppealMutationOptions.ExpectedSchemaSha256,
        DaisAppealMutationOptions.ExpectedSchemaLength,
        DaisAppealMutationOptions.ExpectedSourceManifestPath,
        DaisAppealMutationOptions.ExpectedSourceManifestSha256,
        DaisAppealMutationOptions.ExpectedPublishedManifestSha256,
        DaisAppealMutationOptions.ExpectedPublishedManifestLength,
        DaisAppealMutationOptions.ExpectedContractSourceSha,
        DaisAppealMutationOptions.ExpectedSourceDtoSha256,
        DaisAppealMutationOptions.ExpectedTransport,
        DaisAppealMutationOptions.ArtifactSlotRelativePath,
        DaisAppealMutationOptions.ExpectedModuleGitBlob,
        DaisAppealMutationOptions.ExpectedSchemaGitBlob,
        DaisAppealMutationOptions.ExpectedSourceManifestLength,
        DaisAppealMutationOptions.ExpectedSourceManifestGitBlob,
        DaisAppealMutationOptions.ExpectedContractReviewedHeadSha);
}
