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
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dossier;
using DossierEvidenceEntity = TerraFusion.Core.Entities.DossierEvidence;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierEvidenceRegistryReadRuntimeRegistrationTests
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
        var expected = DossierEvidenceRegistryReadArtifactExpectation.Canonical;

        expected.ArtifactType.Should().Be("dossier.evidence-registry-read.projection-module@1");
        expected.Contract.Should().Be("dossier.evidence-registry-read@1.0.0");
        expected.Repository.Should().Be("bsvalues/terrafusion-dossier");
        expected.SourceBranch.Should().Be("main");
        expected.Commit.Should().Be("7558cfebfeea0c7b536251769b1d779c4558a763");
        expected.ModuleSourcePath.Should().Be(
            "src/evidence-registry/project-dossier-evidence-registry-read.mjs");
        expected.ModuleFilename.Should().Be("project-dossier-evidence-registry-read.mjs");
        expected.ModuleSha256.Should().Be(
            "bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b");
        expected.ModuleLength.Should().Be(8901);
        expected.SchemaSourcePath.Should().Be(
            "contract-compat/dossier.evidence-registry-read.v1/dossier.evidence-registry-read.v1.schema.json");
        expected.SchemaFilename.Should().Be("dossier.evidence-registry-read.v1.schema.json");
        expected.SchemaSha256.Should().Be(
            "f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270");
        expected.SchemaLength.Should().Be(2851);
        expected.SourceManifestPath.Should().Be(
            "contract-compat/dossier.evidence-registry-read.v1/manifest.json");
        expected.SourceManifestSha256.Should().Be(
            "0c8310e45a02face985fd9d628f16ff26bfac6b078107fa8f96e6f22f1ebcb07");
        expected.PublishedManifestSha256.Should().Be(
            "a093ebf132709bdf0cb434a5acffb7c60a749008e24abab96e828f0dd2c7bea4");
        expected.PublishedManifestLength.Should().Be(1246);
        expected.ContractSourceSha.Should().Be("cfcd460d6387c7dc5aefbc83a389e74333cf0201");
        expected.SourceDtoSha256.Should().Be(
            "414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f");
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

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>();
    }

    [Fact]
    public void Verifier_RejectsMissingOrAdditionalManifestFields()
    {
        using var scope = new ArtifactScope();
        var missing = scope.ExactManifest();
        missing.Remove("sourceDtoSha256");
        scope.WriteManifest(missing);

        var missingAction = () => scope.Verifier.Verify();

        missingAction.Should().Throw<DossierEvidenceRegistryReadArtifactException>();

        var additional = scope.ExactManifest();
        additional["mutableAlias"] = "forbidden";
        scope.WriteManifest(additional);

        var additionalAction = () => scope.Verifier.Verify();

        additionalAction.Should().Throw<DossierEvidenceRegistryReadArtifactException>();
    }

    [Fact]
    public void Verifier_RejectsWhitespaceOrPropertyOrderOnlyManifestMutation()
    {
        using var scope = new ArtifactScope();
        scope.AppendManifestWhitespace();

        var whitespaceAction = () => scope.Verifier.Verify();

        whitespaceAction.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("*published manifest length mismatch*");

        scope.WriteManifest();
        var reordered = new Dictionary<string, object>(StringComparer.Ordinal);
        foreach (var property in scope.ExactManifest().Reverse())
        {
            reordered[property.Key] = property.Value;
        }
        scope.WriteManifest(reordered);

        var orderAction = () => scope.Verifier.Verify();

        orderAction.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
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

            action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
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

        mutatedModule.Should().Throw<DossierEvidenceRegistryReadArtifactException>();

        scope.RewriteExactModule();
        File.AppendAllText(scope.SchemaPath, "\n", new UTF8Encoding(false));

        var mutatedSchema = () => scope.Verifier.Verify();

        mutatedSchema.Should().Throw<DossierEvidenceRegistryReadArtifactException>();

        scope.RewriteExactSchema();
        File.WriteAllText(Path.Combine(scope.ArtifactSlot, "mutable-sidecar.txt"), "unexpected");

        var unexpectedSidecar = () => scope.Verifier.Verify();

        unexpectedSidecar.Should().Throw<DossierEvidenceRegistryReadArtifactException>();
    }

    [Fact]
    public async Task InvocationWrapper_ReverifiesExactManifestBytesAndRefusesBeforeProcessStart()
    {
        using var scope = new ArtifactScope();
        var inner = new DossierEvidenceRegistryReadProcessHost(
            FindNodeExecutable(),
            temporaryRoot: scope.Root);
        var host = new DossierEvidenceRegistryReadVerifiedProcessHost(inner, scope.Verifier);
        scope.AppendManifestWhitespace();

        var result = await host.ValidateAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            scope.SchemaPath,
            scope.Expectation.SchemaSha256,
            "{}",
            CancellationToken.None);

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.RuntimeIdentityMismatch);
        Directory.Exists(Path.Combine(scope.Root, "terrafusion-dossier-evidence-registry-read-host"))
            .Should().BeFalse("identity refusal must precede the disposable process path");
    }

    [Fact]
    public async Task InvocationWrapper_ReverifiesBothModuleAndSchemaBytes()
    {
        using var scope = new ArtifactScope();
        var inner = new DossierEvidenceRegistryReadProcessHost(
            FindNodeExecutable(),
            temporaryRoot: scope.Root);
        var host = new DossierEvidenceRegistryReadVerifiedProcessHost(inner, scope.Verifier);
        File.AppendAllText(scope.SchemaPath, "\n", new UTF8Encoding(false));

        var schemaResult = await host.ValidateAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            scope.SchemaPath,
            scope.Expectation.SchemaSha256,
            "{}",
            CancellationToken.None);

        schemaResult.Failure.Should().Be(DossierEvidenceRegistryReadFailure.RuntimeIdentityMismatch);
        scope.RewriteExactSchema();
        File.AppendAllText(scope.ModulePath, "\n", new UTF8Encoding(false));

        var moduleResult = await host.ValidateAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            scope.SchemaPath,
            scope.Expectation.SchemaSha256,
            "{}",
            CancellationToken.None);

        moduleResult.Failure.Should().Be(DossierEvidenceRegistryReadFailure.RuntimeIdentityMismatch);
    }

    [Theory]
    [InlineData("modulePath")]
    [InlineData("moduleHash")]
    [InlineData("schemaPath")]
    [InlineData("schemaHash")]
    public async Task InvocationWrapper_RejectsCallerIdentityRedirection(string mutation)
    {
        using var scope = new ArtifactScope();
        var inner = new DossierEvidenceRegistryReadProcessHost(
            FindNodeExecutable(),
            temporaryRoot: scope.Root);
        var host = new DossierEvidenceRegistryReadVerifiedProcessHost(inner, scope.Verifier);
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

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.RuntimeIdentityMismatch);
    }

    [Fact]
    public void DisabledSelection_RegistersNoRuntimeHost()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                [$"{DossierEvidenceRegistryReadOptions.SectionName}:Mode"] = "Disabled",
            }).Build();

        services.AddDossierEvidenceRegistryReadRuntime(
            configuration,
            new TestHostEnvironment("Development", Path.GetTempPath()));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<DossierEvidenceRegistryReadOptions>>().Value.Mode
            .Should().Be(DossierEvidenceRegistryReadMode.Disabled);
        provider.GetService<IDossierEvidenceRegistryReadProcessHost>().Should().BeNull();
        provider.GetService<DossierEvidenceRegistryReadProcessHost>().Should().BeNull();
        provider.GetService<IDossierEvidenceRegistryReadConsumer>().Should().BeNull();
    }

    [ExactDossierEvidenceRegistryReadHostFact]
    public async Task ConfiguredDevelopmentHost_StartsAndExecutesExactRuntime()
    {
        var sovereignRoot = ResolveConfiguredSovereignRoot();
        var builder = CreateConfiguredDevelopmentHostBuilder(sovereignRoot);
        builder.Services.AddDossierEvidenceRegistryReadRuntime(builder.Configuration, builder.Environment);
        using var host = builder.Build();

        await host.StartAsync();
        try
        {
            using var scope = host.Services.CreateScope();
            var options = scope.ServiceProvider
                .GetRequiredService<IOptions<DossierEvidenceRegistryReadOptions>>()
                .Value;
            options.Mode.Should().Be(DossierEvidenceRegistryReadMode.LocalExact);
            options.ModulePath.Should().Be(Path.GetFullPath(
                Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_MODULE_PATH")!));
            options.SchemaPath.Should().Be(Path.GetFullPath(
                Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_SCHEMA_PATH")!));

            var consumer = scope.ServiceProvider.GetRequiredService<IDossierEvidenceRegistryReadConsumer>();
            var countyId = new Guid("010b010b-010b-010b-010b-010b010b010b");
            var request = new DossierEvidenceRegistryReadRequest
            {
                SchemaVersion = "1.0.0",
                CountyId = countyId.ToString("D"),
                ParcelId = "PARCEL-EMPTY",
                Limit = 25,
                Offset = 0,
                TraceId = "configured-development-host",
            };

            var result = await consumer.ConsumeAsync(
                request,
                0,
                Array.Empty<DossierEvidenceEntity>(),
                CancellationToken.None);

            result.Success.Should().BeTrue();
            result.Failure.Should().Be(DossierEvidenceRegistryReadConsumerFailure.None);
            result.SourceModuleSha256.Should().Be(DossierEvidenceRegistryReadOptions.ExpectedModuleSha256);
            result.CopiedModuleSha256.Should().Be(DossierEvidenceRegistryReadOptions.ExpectedModuleSha256);
            result.SourceSchemaSha256.Should().Be(DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256);
            result.CopiedSchemaSha256.Should().Be(DossierEvidenceRegistryReadOptions.ExpectedSchemaSha256);
            result.NormalizedResultJson.Should().NotBeNullOrWhiteSpace();
            using var normalized = JsonDocument.Parse(result.NormalizedResultJson!);
            normalized.RootElement.GetProperty("countyId").GetString()
                .Should().Be(countyId.ToString("D"));
            normalized.RootElement.GetProperty("results").GetArrayLength().Should().Be(0);
        }
        finally
        {
            await host.StopAsync();
        }
    }

    [ExactDossierEvidenceRegistryReadHostFact]
    public async Task ConfiguredDevelopmentHost_DisabledSelectionStartsWithoutRuntime()
    {
        var sovereignRoot = ResolveConfiguredSovereignRoot();
        var builder = CreateConfiguredDevelopmentHostBuilder(sovereignRoot);
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            [$"{DossierEvidenceRegistryReadOptions.SectionName}:Mode"] = "Disabled",
        });
        builder.Services.AddDossierEvidenceRegistryReadRuntime(builder.Configuration, builder.Environment);
        using var host = builder.Build();

        await host.StartAsync();
        try
        {
            host.Services.GetRequiredService<IOptions<DossierEvidenceRegistryReadOptions>>()
                .Value.Mode.Should().Be(DossierEvidenceRegistryReadMode.Disabled);
            host.Services.GetService<IDossierEvidenceRegistryReadConsumer>().Should().BeNull();
            host.Services.GetService<IDossierEvidenceRegistryReadProcessHost>().Should().BeNull();
            host.Services.GetService<DossierEvidenceRegistryReadProcessHost>().Should().BeNull();
        }
        finally
        {
            await host.StopAsync();
        }
    }

    [Fact]
    public void ProductionRefusesLocalExactBeforeArtifactResolution()
    {
        var services = new ServiceCollection();

        var action = () => services.AddDossierEvidenceRegistryReadRuntime(
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
            "tf-dossier-published-development-host",
            Guid.NewGuid().ToString("N")));
        services.AddDossierEvidenceRegistryReadRuntime(
            LocalExactConfiguration(),
            new TestHostEnvironment("Development", contentRoot));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<DossierEvidenceRegistryReadOptions>>().Value.Mode
            .Should().Be(DossierEvidenceRegistryReadMode.Disabled);
        provider.GetService<IDossierEvidenceRegistryReadProcessHost>().Should().BeNull();
        provider.GetService<IDossierEvidenceRegistryReadConsumer>().Should().BeNull();
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
                [$"{DossierEvidenceRegistryReadOptions.SectionName}:Mode"] = "Disabled",
                [$"{DossierEvidenceRegistryReadOptions.SectionName}:TimeoutSeconds"] = timeout,
            }).Build();

        var action = () => services.AddDossierEvidenceRegistryReadRuntime(
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
        var options = new DossierEvidenceRegistryReadOptions
        {
            Mode = DossierEvidenceRegistryReadMode.LocalExact,
            TimeoutSeconds = 30,
        };
        var node = FindNodeExecutable();

        DossierEvidenceRegistryReadRuntimeRegistration.AddLocalExactRuntime(
            services,
            options,
            scope.Verifier,
            node);
        using var provider = services.BuildServiceProvider();

        var registered = provider.GetRequiredService<IOptions<DossierEvidenceRegistryReadOptions>>().Value;
        registered.ModulePath.Should().Be(scope.ModulePath);
        registered.SchemaPath.Should().Be(scope.SchemaPath);
        registered.NodeExecutablePath.Should().Be(node);
        provider.GetRequiredService<IDossierEvidenceRegistryReadProcessHost>()
            .Should().BeOfType<DossierEvidenceRegistryReadVerifiedProcessHost>();
        using var serviceScope = provider.CreateScope();
        serviceScope.ServiceProvider.GetRequiredService<IDossierEvidenceRegistryReadConsumer>()
            .Should().BeOfType<DossierEvidenceRegistryReadConsumer>();
    }

    public static IEnumerable<object[]> EveryManifestField() =>
        ManifestFields.Select(field => new object[] { field });

    private static IConfigurationRoot LocalExactConfiguration() =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [$"{DossierEvidenceRegistryReadOptions.SectionName}:Mode"] = "LocalExact",
            [$"{DossierEvidenceRegistryReadOptions.SectionName}:TimeoutSeconds"] = "30",
        }).Build();

    private static string ResolveConfiguredSovereignRoot()
    {
        var modulePath = Path.GetFullPath(
            Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_MODULE_PATH")!);
        return DossierEvidenceRegistryReadArtifactVerifier.ResolveSovereignRoot(
            Directory.GetParent(modulePath)!.FullName);
    }

    private static HostApplicationBuilder CreateConfiguredDevelopmentHostBuilder(
        string sovereignRoot)
    {
        var builder = new HostApplicationBuilder(new HostApplicationBuilderSettings
        {
            ApplicationName = typeof(DossierEvidenceRegistryReadRuntimeRegistrationTests).Assembly.FullName,
            EnvironmentName = Environments.Development,
            ContentRootPath = sovereignRoot,
            DisableDefaults = true,
        });
        builder.Configuration.SetBasePath(sovereignRoot);
        builder.Configuration.AddJsonFile(
            Path.Combine(
                "backend",
                "src",
                "TerraFusion.API",
                "appsettings.Development.json"),
            optional: false,
            reloadOnChange: false);
        return builder;
    }

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
            "export function validateDossierEvidenceRegistryRead(){return [];}";
        private const string SchemaSource =
            "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"type\":\"object\"}";

        public ArtifactScope()
        {
            Root = Path.GetFullPath(Path.Combine(
                Path.GetTempPath(),
                "tf-dossier-runtime-tests",
                Guid.NewGuid().ToString("N")));
            ArtifactSlot = Path.Combine(
                Root,
                ".terrafusion",
                "runtime",
                "dossier",
                "evidence-registry-read");
            Directory.CreateDirectory(ArtifactSlot);
            ModulePath = Path.Combine(ArtifactSlot, "project-dossier-evidence-registry-read.mjs");
            SchemaPath = Path.Combine(ArtifactSlot, "dossier.evidence-registry-read.v1.schema.json");
            ManifestPath = Path.Combine(ArtifactSlot, "manifest.json");
            RewriteExactModule();
            RewriteExactSchema();
            var moduleBytes = File.ReadAllBytes(ModulePath);
            var schemaBytes = File.ReadAllBytes(SchemaPath);
            Expectation = new DossierEvidenceRegistryReadArtifactExpectation(
                "dossier.evidence-registry-read.projection-module@1",
                "dossier.evidence-registry-read@1.0.0",
                "bsvalues/test-dossier",
                "main",
                new string('a', 40),
                "src/evidence-registry/project-dossier-evidence-registry-read.mjs",
                "project-dossier-evidence-registry-read.mjs",
                Convert.ToHexString(SHA256.HashData(moduleBytes)).ToLowerInvariant(),
                moduleBytes.LongLength,
                "contract-compat/dossier.evidence-registry-read.v1/dossier.evidence-registry-read.v1.schema.json",
                "dossier.evidence-registry-read.v1.schema.json",
                Convert.ToHexString(SHA256.HashData(schemaBytes)).ToLowerInvariant(),
                schemaBytes.LongLength,
                "contract-compat/dossier.evidence-registry-read.v1/manifest.json",
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
            Verifier = new DossierEvidenceRegistryReadArtifactVerifier(Root, Expectation);
        }

        public string Root { get; }
        public string ArtifactSlot { get; }
        public string ModulePath { get; }
        public string SchemaPath { get; }
        public string ManifestPath { get; }
        public DossierEvidenceRegistryReadArtifactExpectation Expectation { get; private set; }
        public DossierEvidenceRegistryReadArtifactVerifier Verifier { get; }

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
