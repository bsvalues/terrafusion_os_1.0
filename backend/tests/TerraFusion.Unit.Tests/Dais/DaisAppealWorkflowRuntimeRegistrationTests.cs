using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dais;
using Xunit;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisAppealWorkflowRuntimeRegistrationTests
{
    private static readonly string[] ManifestFields =
    [
        "schemaVersion",
        "artifactType",
        "contract",
        "repository",
        "sourceBranch",
        "commit",
        "modulePath",
        "moduleFilename",
        "moduleLength",
        "moduleSha256",
        "schemaPath",
        "schemaFilename",
        "schemaLength",
        "schemaSha256",
        "sourceManifestPath",
        "sourceManifestSha256",
        "contractSourceSha",
        "sourceDtoSha256",
        "transport",
    ];

    [Fact]
    public void CanonicalExpectation_PinsEveryPublishedManifestField()
    {
        var expected = DaisAppealWorkflowArtifactExpectation.Canonical;

        expected.ArtifactType.Should().Be("dais.appeal-workflow.projection-module@1");
        expected.Contract.Should().Be("dais.appeal-workflow@1.0.0");
        expected.Repository.Should().Be("bsvalues/terrafusion-dais");
        expected.SourceBranch.Should().Be("main");
        expected.Commit.Should().Be("6932bbbf014cf70d7362e070a1dad2a8a680ad47");
        expected.ModuleSourcePath.Should().Be(
            "src/appeal-workflow/project-dais-appeal-workflow.mjs");
        expected.ModuleFilename.Should().Be("project-dais-appeal-workflow.mjs");
        expected.ModuleSha256.Should().Be(
            "5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb");
        expected.ModuleLength.Should().Be(9269);
        expected.SchemaSourcePath.Should().Be(
            "contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json");
        expected.SchemaFilename.Should().Be("dais.appeal-workflow.v1.schema.json");
        expected.SchemaSha256.Should().Be(
            "b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c");
        expected.SchemaLength.Should().Be(3496);
        expected.SourceManifestPath.Should().Be(
            "contract-compat/dais.appeal-workflow.v1/manifest.json");
        expected.SourceManifestSha256.Should().Be(
            "6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859");
        expected.PublishedManifestSha256.Should().Be(
            "e9ffd2acd811d7f2d309929757661f7f5dd3873b1027fa1af500b0d7eadb9186");
        expected.PublishedManifestLength.Should().Be(1161);
        expected.ContractSourceSha.Should().Be("e57b1eca9c3291d10203efaa1fd586bcbce13f94");
        expected.SourceDtoSha256.Should().Be(
            "c9bb02054fc5a211ed609a3e9d7fe604e34cd0613701a57f6f2788d312348f47");
        expected.Transport.Should().Be("local-os-managed-artifact-slot");
    }

    [Fact]
    public void Verifier_AcceptsOnlyTheExactThreeFileInventoryAndIdentity()
    {
        using var scope = new ArtifactScope();

        var verified = scope.Verifier.Verify();

        verified.ModulePath.Should().Be(scope.ModulePath);
        verified.SchemaPath.Should().Be(scope.SchemaPath);
        verified.ManifestPath.Should().Be(scope.ManifestPath);
        verified.Repository.Should().Be(scope.Expectation.Repository);
        verified.Commit.Should().Be(scope.Expectation.Commit);
        verified.ManifestSha256.Should().Be(scope.Expectation.PublishedManifestSha256);
        verified.ManifestLength.Should().Be(scope.Expectation.PublishedManifestLength);
        verified.ModuleSha256.Should().Be(scope.Expectation.ModuleSha256);
        verified.ModuleLength.Should().Be(scope.Expectation.ModuleLength);
        verified.SchemaSha256.Should().Be(scope.Expectation.SchemaSha256);
        verified.SchemaLength.Should().Be(scope.Expectation.SchemaLength);
    }

    [Theory]
    [MemberData(nameof(EveryManifestField))]
    public void Verifier_RejectsEveryManifestIdentityMutation(string field)
    {
        using var scope = new ArtifactScope();
        scope.MutateManifest(field);

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DaisAppealWorkflowArtifactException>();
    }

    [Fact]
    public void Verifier_RejectsMissingOrAdditionalManifestFields()
    {
        using var scope = new ArtifactScope();
        var missing = scope.ExactManifest();
        missing.Remove("sourceDtoSha256");
        scope.WriteManifest(missing);

        var missingAction = () => scope.Verifier.Verify();

        missingAction.Should().Throw<DaisAppealWorkflowArtifactException>();

        var additional = scope.ExactManifest();
        additional["mutableAlias"] = "forbidden";
        scope.WriteManifest(additional);

        var additionalAction = () => scope.Verifier.Verify();

        additionalAction.Should().Throw<DaisAppealWorkflowArtifactException>();
    }

    [Fact]
    public void Verifier_RejectsWhitespaceOrPropertyOrderOnlyManifestMutation()
    {
        using var scope = new ArtifactScope();
        scope.AppendManifestWhitespace();

        var whitespaceAction = () => scope.Verifier.Verify();

        whitespaceAction.Should().Throw<DaisAppealWorkflowArtifactException>()
            .WithMessage("*published manifest length mismatch*");

        scope.WriteManifest();
        var reordered = new Dictionary<string, object>(StringComparer.Ordinal);
        foreach (var property in scope.ExactManifest().Reverse())
        {
            reordered[property.Key] = property.Value;
        }
        scope.WriteManifest(reordered);

        var orderAction = () => scope.Verifier.Verify();

        orderAction.Should().Throw<DaisAppealWorkflowArtifactException>()
            .WithMessage("*published manifest hash mismatch*");
    }

    [Fact]
    public void Verifier_RejectsRedirectedArtifactAncestor()
    {
        using var scope = new ArtifactScope();
        var runtimePath = Path.Combine(scope.Root, ".terrafusion", "runtime");
        var redirectedRuntimePath = Path.Combine(scope.Root, "redirected-runtime");
        Directory.Move(runtimePath, redirectedRuntimePath);
        CreateDirectoryLink(runtimePath, redirectedRuntimePath);

        try
        {
            var action = () => scope.Verifier.Verify();

            action.Should().Throw<DaisAppealWorkflowArtifactException>()
                .WithMessage("*artifact path component*non-link directory*");
        }
        finally
        {
            Directory.Delete(runtimePath);
            Directory.Move(redirectedRuntimePath, runtimePath);
        }
    }

    [Fact]
    public void Verifier_RejectsModuleOrSchemaMutationAndUnexpectedSidecars()
    {
        using var scope = new ArtifactScope();
        File.AppendAllText(scope.ModulePath, "\n", new UTF8Encoding(false));

        var mutatedModule = () => scope.Verifier.Verify();

        mutatedModule.Should().Throw<DaisAppealWorkflowArtifactException>();

        scope.RewriteExactModule();
        File.AppendAllText(scope.SchemaPath, "\n", new UTF8Encoding(false));

        var mutatedSchema = () => scope.Verifier.Verify();

        mutatedSchema.Should().Throw<DaisAppealWorkflowArtifactException>();

        scope.RewriteExactSchema();
        File.WriteAllText(Path.Combine(scope.ArtifactSlot, "mutable-sidecar.txt"), "unexpected");

        var unexpectedSidecar = () => scope.Verifier.Verify();

        unexpectedSidecar.Should().Throw<DaisAppealWorkflowArtifactException>();
    }

    [Fact]
    public async Task InvocationWrapper_ReverifiesExactManifestBytesAndRefusesBeforeProcessStart()
    {
        using var scope = new ArtifactScope();
        var inner = new DaisAppealWorkflowProcessHost(
            FindNodeExecutable(),
            temporaryRoot: scope.Root);
        var host = new DaisAppealWorkflowVerifiedProcessHost(inner, scope.Verifier);
        scope.AppendManifestWhitespace();

        var result = await host.ValidateAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            scope.SchemaPath,
            scope.Expectation.SchemaSha256,
            "{}",
            CancellationToken.None);

        result.Failure.Should().Be(DaisAppealWorkflowFailure.RuntimeIdentityMismatch);
        Directory.Exists(Path.Combine(scope.Root, "terrafusion-dais-appeal-workflow-host"))
            .Should().BeFalse("identity refusal must precede the disposable process path");
    }

    [Fact]
    public async Task InvocationWrapper_ReverifiesBothModuleAndSchemaBytes()
    {
        using var scope = new ArtifactScope();
        var inner = new DaisAppealWorkflowProcessHost(
            FindNodeExecutable(),
            temporaryRoot: scope.Root);
        var host = new DaisAppealWorkflowVerifiedProcessHost(inner, scope.Verifier);
        File.AppendAllText(scope.SchemaPath, "\n", new UTF8Encoding(false));

        var schemaResult = await host.ValidateAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            scope.SchemaPath,
            scope.Expectation.SchemaSha256,
            "{}",
            CancellationToken.None);

        schemaResult.Failure.Should().Be(DaisAppealWorkflowFailure.RuntimeIdentityMismatch);
        scope.RewriteExactSchema();
        File.AppendAllText(scope.ModulePath, "\n", new UTF8Encoding(false));

        var moduleResult = await host.ValidateAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            scope.SchemaPath,
            scope.Expectation.SchemaSha256,
            "{}",
            CancellationToken.None);

        moduleResult.Failure.Should().Be(DaisAppealWorkflowFailure.RuntimeIdentityMismatch);
    }

    [Theory]
    [InlineData("modulePath")]
    [InlineData("moduleHash")]
    [InlineData("schemaPath")]
    [InlineData("schemaHash")]
    public async Task InvocationWrapper_RejectsCallerIdentityRedirection(string mutation)
    {
        using var scope = new ArtifactScope();
        var inner = new DaisAppealWorkflowProcessHost(
            FindNodeExecutable(),
            temporaryRoot: scope.Root);
        var host = new DaisAppealWorkflowVerifiedProcessHost(inner, scope.Verifier);
        var modulePath = mutation == "modulePath"
            ? Path.Combine(scope.Root, "alternate-module.mjs")
            : scope.ModulePath;
        var moduleHash = mutation == "moduleHash"
            ? new string('f', 64)
            : scope.Expectation.ModuleSha256;
        var schemaPath = mutation == "schemaPath"
            ? Path.Combine(scope.Root, "alternate-schema.json")
            : scope.SchemaPath;
        var schemaHash = mutation == "schemaHash"
            ? new string('e', 64)
            : scope.Expectation.SchemaSha256;

        var result = await host.ValidateAsync(
            modulePath,
            moduleHash,
            schemaPath,
            schemaHash,
            "{}",
            CancellationToken.None);

        result.Failure.Should().Be(DaisAppealWorkflowFailure.RuntimeIdentityMismatch);
    }

    [Fact]
    public void DisabledSelection_RegistersNoRuntimeHost()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                [$"{DaisAppealWorkflowOptions.SectionName}:Mode"] = "Disabled",
            }).Build();

        services.AddDaisAppealWorkflowRuntime(
            configuration,
            new TestHostEnvironment("Development", Path.GetTempPath()));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<DaisAppealWorkflowOptions>>().Value.Mode
            .Should().Be(DaisAppealWorkflowMode.Disabled);
        provider.GetService<IDaisAppealWorkflowProcessHost>().Should().BeNull();
        provider.GetService<DaisAppealWorkflowProcessHost>().Should().BeNull();
        provider.GetService<IDaisAppealWorkflowConsumer>().Should().BeNull();
    }

    [Fact]
    public void ProductionRefusesLocalExactBeforeArtifactResolution()
    {
        var services = new ServiceCollection();

        var action = () => services.AddDaisAppealWorkflowRuntime(
            LocalExactConfiguration(),
            new TestHostEnvironment("Production", Path.GetTempPath()));

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*restricted to the Development environment*");
    }

    [Fact]
    public void DevelopmentLocalExactOutsideSovereignSourceTree_RegistersDisabledBeforeNodeResolution()
    {
        var services = new ServiceCollection();
        var contentRoot = Path.GetFullPath(Path.Combine(
            Path.GetTempPath(),
            "tf-dais-published-development-host",
            Guid.NewGuid().ToString("N")));
        services.AddDaisAppealWorkflowRuntime(
            LocalExactConfiguration(),
            new TestHostEnvironment("Development", contentRoot));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<DaisAppealWorkflowOptions>>().Value.Mode
            .Should().Be(DaisAppealWorkflowMode.Disabled);
        provider.GetService<IDaisAppealWorkflowProcessHost>().Should().BeNull();
        provider.GetService<IDaisAppealWorkflowConsumer>().Should().BeNull();
    }

    [Theory]
    [InlineData("31")]
    [InlineData("0")]
    public void InvalidTimeoutFailsClosedEvenWhenSelectionIsDisabled(string timeout)
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                [$"{DaisAppealWorkflowOptions.SectionName}:Mode"] = "Disabled",
                [$"{DaisAppealWorkflowOptions.SectionName}:TimeoutSeconds"] = timeout,
            }).Build();

        var action = () => services.AddDaisAppealWorkflowRuntime(
            configuration,
            new TestHostEnvironment("Development", Path.GetTempPath()));

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*timeout must be between 1 and 30 seconds*");
    }

    [Fact]
    public void LocalExactRegistration_UsesVerifiedModuleSchemaAndReverificationWrapper()
    {
        using var scope = new ArtifactScope();
        var services = new ServiceCollection();
        var options = new DaisAppealWorkflowOptions
        {
            Mode = DaisAppealWorkflowMode.LocalExact,
            TimeoutSeconds = 30,
        };
        var node = FindNodeExecutable();

        DaisAppealWorkflowRuntimeRegistration.AddLocalExactRuntime(
            services,
            options,
            scope.Verifier,
            node);
        using var provider = services.BuildServiceProvider();

        var registered = provider.GetRequiredService<IOptions<DaisAppealWorkflowOptions>>().Value;
        registered.ModulePath.Should().Be(scope.ModulePath);
        registered.SchemaPath.Should().Be(scope.SchemaPath);
        registered.NodeExecutablePath.Should().Be(node);
        provider.GetRequiredService<IDaisAppealWorkflowProcessHost>()
            .Should().BeOfType<DaisAppealWorkflowVerifiedProcessHost>();
        using var serviceScope = provider.CreateScope();
        serviceScope.ServiceProvider.GetRequiredService<IDaisAppealWorkflowConsumer>()
            .Should().BeOfType<DaisAppealWorkflowConsumer>();
    }

    public static IEnumerable<object[]> EveryManifestField() =>
        ManifestFields.Select(field => new object[] { field });

    private static IConfigurationRoot LocalExactConfiguration() =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [$"{DaisAppealWorkflowOptions.SectionName}:Mode"] = "LocalExact",
            [$"{DaisAppealWorkflowOptions.SectionName}:TimeoutSeconds"] = "30",
        }).Build();

    private static string FindNodeExecutable()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("-p");
        startInfo.ArgumentList.Add("process.execPath");
        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Unable to start Node path probe.");
        var output = process.StandardOutput.ReadToEnd().Trim();
        process.WaitForExit();
        if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
        {
            throw new InvalidOperationException("Unable to resolve the Node executable.");
        }

        return Path.GetFullPath(output);
    }

    private static void CreateDirectoryLink(string linkPath, string targetPath)
    {
        if (!OperatingSystem.IsWindows())
        {
            Directory.CreateSymbolicLink(linkPath, targetPath);
            return;
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = Environment.GetEnvironmentVariable("COMSPEC") ?? "cmd.exe",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("/d");
        startInfo.ArgumentList.Add("/c");
        startInfo.ArgumentList.Add("mklink");
        startInfo.ArgumentList.Add("/J");
        startInfo.ArgumentList.Add(linkPath);
        startInfo.ArgumentList.Add(targetPath);
        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Unable to start junction creation.");
        var stdout = process.StandardOutput.ReadToEnd();
        var stderr = process.StandardError.ReadToEnd();
        process.WaitForExit();
        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Unable to create test junction: {stdout} {stderr}".Trim());
        }
    }

    private sealed class ArtifactScope : IDisposable
    {
        private const string ModuleSource =
            "export function validateDaisAppealWorkflow(){return [];}";
        private const string SchemaSource =
            "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"type\":\"object\"}";

        public ArtifactScope()
        {
            Root = Path.GetFullPath(Path.Combine(
                Path.GetTempPath(),
                "tf-dais-runtime-tests",
                Guid.NewGuid().ToString("N")));
            ArtifactSlot = Path.Combine(
                Root,
                ".terrafusion",
                "runtime",
                "dais",
                "appeal-workflow");
            Directory.CreateDirectory(ArtifactSlot);
            ModulePath = Path.Combine(ArtifactSlot, "project-dais-appeal-workflow.mjs");
            SchemaPath = Path.Combine(ArtifactSlot, "dais.appeal-workflow.v1.schema.json");
            ManifestPath = Path.Combine(ArtifactSlot, "manifest.json");
            RewriteExactModule();
            RewriteExactSchema();
            var moduleBytes = File.ReadAllBytes(ModulePath);
            var schemaBytes = File.ReadAllBytes(SchemaPath);
            Expectation = new DaisAppealWorkflowArtifactExpectation(
                "dais.appeal-workflow.projection-module@1",
                "dais.appeal-workflow@1.0.0",
                "bsvalues/test-dais",
                "main",
                new string('a', 40),
                "src/appeal-workflow/project-dais-appeal-workflow.mjs",
                "project-dais-appeal-workflow.mjs",
                Convert.ToHexString(SHA256.HashData(moduleBytes)).ToLowerInvariant(),
                moduleBytes.LongLength,
                "contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json",
                "dais.appeal-workflow.v1.schema.json",
                Convert.ToHexString(SHA256.HashData(schemaBytes)).ToLowerInvariant(),
                schemaBytes.LongLength,
                "contract-compat/dais.appeal-workflow.v1/manifest.json",
                new string('b', 64),
                string.Empty,
                0,
                new string('c', 40),
                new string('d', 64),
                "local-os-managed-artifact-slot");
            WriteManifest();
            var manifestBytes = File.ReadAllBytes(ManifestPath);
            Expectation = Expectation with
            {
                PublishedManifestSha256 = Convert.ToHexString(SHA256.HashData(manifestBytes))
                    .ToLowerInvariant(),
                PublishedManifestLength = manifestBytes.LongLength,
            };
            Verifier = new DaisAppealWorkflowArtifactVerifier(Root, Expectation);
        }

        public string Root { get; }
        public string ArtifactSlot { get; }
        public string ModulePath { get; }
        public string SchemaPath { get; }
        public string ManifestPath { get; }
        public DaisAppealWorkflowArtifactExpectation Expectation { get; private set; }
        public DaisAppealWorkflowArtifactVerifier Verifier { get; }

        public void RewriteExactModule() =>
            File.WriteAllText(ModulePath, ModuleSource, new UTF8Encoding(false));

        public void RewriteExactSchema() =>
            File.WriteAllText(SchemaPath, SchemaSource, new UTF8Encoding(false));

        public void MutateManifest(string field)
        {
            var manifest = ExactManifest();
            manifest[field] = field is "schemaVersion" or "moduleLength" or "schemaLength"
                ? $"{manifest[field]}"
                : $"{manifest[field]}-tampered";
            WriteManifest(manifest);
        }

        public void AppendManifestWhitespace() =>
            File.AppendAllText(ManifestPath, " ", new UTF8Encoding(false));

        public Dictionary<string, object> ExactManifest() => new(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 1,
            ["artifactType"] = Expectation.ArtifactType,
            ["contract"] = Expectation.Contract,
            ["repository"] = Expectation.Repository,
            ["sourceBranch"] = Expectation.SourceBranch,
            ["commit"] = Expectation.Commit,
            ["modulePath"] = Expectation.ModuleSourcePath,
            ["moduleFilename"] = Expectation.ModuleFilename,
            ["moduleLength"] = Expectation.ModuleLength,
            ["moduleSha256"] = Expectation.ModuleSha256,
            ["schemaPath"] = Expectation.SchemaSourcePath,
            ["schemaFilename"] = Expectation.SchemaFilename,
            ["schemaLength"] = Expectation.SchemaLength,
            ["schemaSha256"] = Expectation.SchemaSha256,
            ["sourceManifestPath"] = Expectation.SourceManifestPath,
            ["sourceManifestSha256"] = Expectation.SourceManifestSha256,
            ["contractSourceSha"] = Expectation.ContractSourceSha,
            ["sourceDtoSha256"] = Expectation.SourceDtoSha256,
            ["transport"] = Expectation.Transport,
        };

        public void WriteManifest(Dictionary<string, object>? manifest = null) =>
            File.WriteAllText(
                ManifestPath,
                JsonSerializer.Serialize(manifest ?? ExactManifest()),
                new UTF8Encoding(false));

        public void Dispose()
        {
            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }
    }

    private sealed class TestHostEnvironment(
        string environmentName,
        string contentRootPath) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "TerraFusion.API.Tests";
        public string ContentRootPath { get; set; } = contentRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
