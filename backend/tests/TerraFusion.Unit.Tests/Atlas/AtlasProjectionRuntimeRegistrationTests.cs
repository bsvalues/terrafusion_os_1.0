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
using TerraFusion.API.Services.Atlas;
using Xunit;

namespace TerraFusion.Unit.Tests.Atlas;

public sealed class ExactAtlasRuntimeFactAttribute : FactAttribute
{
    public ExactAtlasRuntimeFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_ATLAS_RUNTIME_ROOT")))
        {
            Skip = "Exact Atlas runtime proof requires TERRAFUSION_ATLAS_RUNTIME_ROOT.";
        }
    }
}

public sealed class AtlasProjectionRuntimeRegistrationTests
{
    private const string CountyId = "11111111-2222-3333-4444-555555555555";
    private const string ParcelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    [Fact]
    public void CanonicalExpectation_PinsEveryPublishedManifestField()
    {
        var expected = AtlasProjectionArtifactExpectation.Canonical;

        expected.ArtifactType.Should().Be("atlas.spatial-read.projection-module@1");
        expected.Repository.Should().Be("bsvalues/terrafusion-atlas");
        expected.Commit.Should().Be("6736a53980c73d2b503ec71a440ad8e02aa43782");
        expected.ModuleSourcePath.Should().Be("src/spatial-read/project-atlas-feature.mjs");
        expected.ModuleFilename.Should().Be("project-atlas-feature.mjs");
        expected.ModuleSha256.Should().Be(
            "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46");
        expected.ModuleLength.Should().Be(917);
        expected.Transport.Should().Be("local-os-managed-artifact-slot");
    }

    [Fact]
    public void Verifier_AcceptsOnlyTheExactFixtureInventoryAndIdentity()
    {
        using var scope = new ArtifactScope();

        var verified = scope.Verifier.Verify();

        verified.ModulePath.Should().Be(scope.ModulePath);
        verified.ManifestPath.Should().Be(scope.ManifestPath);
        verified.Repository.Should().Be(scope.Expectation.Repository);
        verified.Commit.Should().Be(scope.Expectation.Commit);
        verified.ModuleSha256.Should().Be(scope.Expectation.ModuleSha256);
        verified.ModuleLength.Should().Be(scope.Expectation.ModuleLength);
    }

    [Theory]
    [InlineData("schemaVersion")]
    [InlineData("artifactType")]
    [InlineData("repository")]
    [InlineData("commit")]
    [InlineData("modulePath")]
    [InlineData("moduleFilename")]
    [InlineData("moduleSha256")]
    [InlineData("transport")]
    public void Verifier_RejectsEveryManifestIdentityMutation(string field)
    {
        using var scope = new ArtifactScope();
        scope.MutateManifest(field);

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<AtlasProjectionArtifactException>();
    }

    [Fact]
    public void Verifier_RejectsModuleMutationAndUnexpectedSidecars()
    {
        using var scope = new ArtifactScope();
        File.AppendAllText(scope.ModulePath, "\n", new UTF8Encoding(false));

        var mutatedModule = () => scope.Verifier.Verify();

        mutatedModule.Should().Throw<AtlasProjectionArtifactException>();

        scope.RewriteExactModule();
        File.WriteAllText(Path.Combine(scope.ArtifactSlot, "mutable-sidecar.txt"), "unexpected");

        var unexpectedSidecar = () => scope.Verifier.Verify();

        unexpectedSidecar.Should().Throw<AtlasProjectionArtifactException>();
    }

    [Fact]
    public async Task InvocationWrapper_ReverifiesAndRefusesTamperBeforeProcessStart()
    {
        using var scope = new ArtifactScope();
        var inner = new AtlasProjectionProcessHost(FindNodeExecutable(), temporaryRoot: scope.Root);
        var host = new AtlasProjectionVerifiedProcessHost(inner, scope.Verifier);
        scope.MutateManifest("repository");

        var result = await host.ProjectAsync(
            scope.ModulePath,
            scope.Expectation.ModuleSha256,
            "{}",
            CancellationToken.None);

        result.Failure.Should().Be(AtlasProjectionFailure.RuntimeIdentityMismatch);
        Directory.Exists(Path.Combine(scope.Root, "terrafusion-atlas-projection-host"))
            .Should().BeFalse("identity refusal must happen before the disposable process path starts");
    }

    [Fact]
    public void DisabledSelection_RegistersNoRuntimeConsumerOrHost()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [$"{AtlasProjectionOptions.SectionName}:Mode"] = "Disabled",
        }).Build();

        services.AddAtlasProjectionRuntime(
            configuration,
            new TestHostEnvironment("Development", Path.GetTempPath()));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<AtlasProjectionOptions>>().Value.Mode
            .Should().Be(AtlasProjectionMode.Disabled);
        provider.GetService<IAtlasProjectionProcessHost>().Should().BeNull();
        provider.GetService<AtlasProjectionConsumer>().Should().BeNull();
    }

    [Fact]
    public void ProductionRefusesLocalExactBeforeArtifactResolution()
    {
        var services = new ServiceCollection();
        var configuration = LocalExactConfiguration();

        var action = () => services.AddAtlasProjectionRuntime(
            configuration,
            new TestHostEnvironment("Production", Path.GetTempPath()));

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*restricted to the Development environment*");
    }

    [Fact]
    public void LocalExactRegistration_UsesVerifiedPathsAndReverificationWrapper()
    {
        using var scope = new ArtifactScope();
        var services = new ServiceCollection();
        var options = new AtlasProjectionOptions
        {
            Mode = AtlasProjectionMode.LocalExact,
            TimeoutSeconds = 30,
        };

        AtlasProjectionRuntimeRegistration.AddLocalExactRuntime(
            services,
            options,
            scope.Verifier,
            FindNodeExecutable());
        using var provider = services.BuildServiceProvider();

        var registered = provider.GetRequiredService<IOptions<AtlasProjectionOptions>>().Value;
        registered.ModulePath.Should().Be(scope.ModulePath);
        registered.NodeExecutablePath.Should().Be(FindNodeExecutable());
        provider.GetRequiredService<IAtlasProjectionProcessHost>()
            .Should().BeOfType<AtlasProjectionVerifiedProcessHost>();
    }

    [ExactAtlasRuntimeFact]
    public async Task PersistentDevelopmentSelection_RunsAcrossRestarts_AndRollbackIsObserved()
    {
        using var runtime = new IsolatedExactRuntimeScope(
            Environment.GetEnvironmentVariable("TERRAFUSION_ATLAS_RUNTIME_ROOT")!);
        var contentRoot = runtime.ContentRoot;
        var modulePath = runtime.ModulePath;
        var manifestPath = runtime.ManifestPath;
        var manifestBytes = File.ReadAllBytes(manifestPath);
        var moduleBytes = File.ReadAllBytes(modulePath);

        try
        {
            await InvokeThroughFreshRuntimeAsync(contentRoot);
            await InvokeThroughFreshRuntimeAsync(contentRoot);

            using (var disabled = BuildRuntimeProvider(contentRoot, "Disabled"))
            {
                disabled.GetService<IAtlasProjectionProcessHost>().Should().BeNull();
            }

            using (var manifestTamperProvider = BuildRuntimeProvider(contentRoot))
            {
                File.WriteAllText(
                    manifestPath,
                    Encoding.UTF8.GetString(manifestBytes).Replace(
                        AtlasProjectionOptions.ExpectedRepository,
                        "bsvalues/tampered-atlas",
                        StringComparison.Ordinal),
                    new UTF8Encoding(false));
                var result = await manifestTamperProvider
                    .GetRequiredService<IAtlasProjectionProcessHost>()
                    .ProjectAsync(
                        modulePath,
                        AtlasProjectionOptions.ExpectedModuleSha256,
                        PolygonExchange());
                result.Failure.Should().Be(AtlasProjectionFailure.RuntimeIdentityMismatch);
                File.WriteAllBytes(manifestPath, manifestBytes);
            }

            using (var moduleTamperProvider = BuildRuntimeProvider(contentRoot))
            {
                File.AppendAllText(modulePath, "\n", new UTF8Encoding(false));
                var result = await moduleTamperProvider
                    .GetRequiredService<IAtlasProjectionProcessHost>()
                    .ProjectAsync(
                        modulePath,
                        AtlasProjectionOptions.ExpectedModuleSha256,
                        PolygonExchange());
                result.Failure.Should().Be(AtlasProjectionFailure.RuntimeIdentityMismatch);
                File.WriteAllBytes(modulePath, moduleBytes);
            }

            await InvokeThroughFreshRuntimeAsync(contentRoot);
        }
        finally
        {
            File.WriteAllBytes(manifestPath, manifestBytes);
            File.WriteAllBytes(modulePath, moduleBytes);
        }
    }

    private static IConfigurationRoot LocalExactConfiguration() =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [$"{AtlasProjectionOptions.SectionName}:Mode"] = "LocalExact",
            [$"{AtlasProjectionOptions.SectionName}:TimeoutSeconds"] = "30",
        }).Build();

    private static ServiceProvider BuildRuntimeProvider(string contentRoot, string? modeOverride = null)
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(contentRoot)
            .AddJsonFile("appsettings.Development.json", optional: false, reloadOnChange: false);
        if (modeOverride is not null)
        {
            builder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{AtlasProjectionOptions.SectionName}:Mode"] = modeOverride,
            });
        }

        var services = new ServiceCollection();
        services.AddAtlasProjectionRuntime(
            builder.Build(),
            new TestHostEnvironment("Development", contentRoot));
        return services.BuildServiceProvider();
    }

    private static async Task InvokeThroughFreshRuntimeAsync(string contentRoot)
    {
        using var provider = BuildRuntimeProvider(contentRoot);
        var options = provider.GetRequiredService<IOptions<AtlasProjectionOptions>>().Value;
        options.Mode.Should().Be(AtlasProjectionMode.LocalExact);
        var result = await provider.GetRequiredService<IAtlasProjectionProcessHost>()
            .ProjectAsync(
                options.ModulePath,
                AtlasProjectionOptions.ExpectedModuleSha256,
                PolygonExchange());
        result.Success.Should().BeTrue(result.ErrorMessage);
        result.Outcome.Should().Be(AtlasProjectionOutcome.Polygon);
        result.SourceModuleSha256.Should().Be(AtlasProjectionOptions.ExpectedModuleSha256);
        result.CopiedModuleSha256.Should().Be(AtlasProjectionOptions.ExpectedModuleSha256);
    }

    private static string PolygonExchange() => JsonSerializer.Serialize(new
    {
        result = new
        {
            countyId = CountyId,
            parcelId = ParcelId,
            evidenceState = "canonical",
            boundary = new
            {
                geometryState = "polygon",
                outerRing = new[]
                {
                    new { longitude = -119.2, latitude = 46.2 },
                    new { longitude = -119.1, latitude = 46.2 },
                    new { longitude = -119.1, latitude = 46.3 },
                    new { longitude = -119.2, latitude = 46.2 },
                },
            },
        },
    });

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

    private sealed class ArtifactScope : IDisposable
    {
        private const string ModuleSource =
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Polygon',coordinates:[[[1,2],[3,4],[5,6],[1,2]]]},properties:{countyId:'" +
            CountyId + "',parcelId:'" + ParcelId + "',evidenceState:'canonical'}};}";

        public ArtifactScope()
        {
            Root = Path.GetFullPath(Path.Combine(
                Path.GetTempPath(),
                "tf-atlas-runtime-tests",
                Guid.NewGuid().ToString("N")));
            ArtifactSlot = Path.Combine(
                Root,
                ".terrafusion",
                "runtime",
                "atlas",
                "spatial-read");
            Directory.CreateDirectory(ArtifactSlot);
            ModulePath = Path.Combine(ArtifactSlot, "project-atlas-feature.mjs");
            ManifestPath = Path.Combine(ArtifactSlot, "manifest.json");
            RewriteExactModule();
            var moduleBytes = File.ReadAllBytes(ModulePath);
            Expectation = new AtlasProjectionArtifactExpectation(
                "atlas.spatial-read.projection-module@1",
                "bsvalues/test-atlas",
                new string('a', 40),
                "src/spatial-read/project-atlas-feature.mjs",
                "project-atlas-feature.mjs",
                Convert.ToHexString(SHA256.HashData(moduleBytes)).ToLowerInvariant(),
                moduleBytes.LongLength,
                "local-os-managed-artifact-slot");
            WriteManifest();
            Verifier = new AtlasProjectionArtifactVerifier(Root, Expectation);
        }

        public string Root { get; }
        public string ArtifactSlot { get; }
        public string ModulePath { get; }
        public string ManifestPath { get; }
        public AtlasProjectionArtifactExpectation Expectation { get; }
        public AtlasProjectionArtifactVerifier Verifier { get; }

        public void RewriteExactModule() =>
            File.WriteAllText(ModulePath, ModuleSource, new UTF8Encoding(false));

        public void MutateManifest(string field)
        {
            var manifest = ExactManifest();
            manifest[field] = field == "schemaVersion" ? 2 : $"{manifest[field]}-tampered";
            WriteManifest(manifest);
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }

        private Dictionary<string, object> ExactManifest() => new(StringComparer.Ordinal)
        {
            ["schemaVersion"] = 1,
            ["artifactType"] = Expectation.ArtifactType,
            ["repository"] = Expectation.Repository,
            ["commit"] = Expectation.Commit,
            ["modulePath"] = Expectation.ModuleSourcePath,
            ["moduleFilename"] = Expectation.ModuleFilename,
            ["moduleSha256"] = Expectation.ModuleSha256,
            ["transport"] = Expectation.Transport,
        };

        private void WriteManifest(Dictionary<string, object>? manifest = null) =>
            File.WriteAllText(
                ManifestPath,
                JsonSerializer.Serialize(manifest ?? ExactManifest()),
                new UTF8Encoding(false));
    }

    private sealed class IsolatedExactRuntimeScope : IDisposable
    {
        public IsolatedExactRuntimeScope(string sourceSovereignRoot)
        {
            var sourceRoot = Path.GetFullPath(sourceSovereignRoot);
            Root = Path.GetFullPath(Path.Combine(
                Path.GetTempPath(),
                "tf-atlas-exact-runtime-tests",
                Guid.NewGuid().ToString("N")));
            ContentRoot = Path.Combine(Root, "backend", "src", "TerraFusion.API");
            var artifactSlot = Path.Combine(
                Root,
                ".terrafusion",
                "runtime",
                "atlas",
                "spatial-read");
            Directory.CreateDirectory(ContentRoot);
            Directory.CreateDirectory(artifactSlot);

            File.WriteAllText(Path.Combine(Root, "PATH_CANON_REGISTER.md"), "isolated exact-runtime proof");
            File.WriteAllText(
                Path.Combine(ContentRoot, "TerraFusion.API.csproj"),
                "<Project Sdk=\"Microsoft.NET.Sdk\" />");
            File.Copy(
                Path.Combine(
                    sourceRoot,
                    "backend",
                    "src",
                    "TerraFusion.API",
                    "appsettings.Development.json"),
                Path.Combine(ContentRoot, "appsettings.Development.json"));

            ModulePath = Path.Combine(artifactSlot, AtlasProjectionOptions.ExpectedModuleFilename);
            ManifestPath = Path.Combine(artifactSlot, "manifest.json");
            var sourceSlot = Path.Combine(
                sourceRoot,
                ".terrafusion",
                "runtime",
                "atlas",
                "spatial-read");
            File.Copy(
                Path.Combine(sourceSlot, AtlasProjectionOptions.ExpectedModuleFilename),
                ModulePath);
            File.Copy(Path.Combine(sourceSlot, "manifest.json"), ManifestPath);
        }

        public string Root { get; }
        public string ContentRoot { get; }
        public string ModulePath { get; }
        public string ManifestPath { get; }

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
