using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierMutationRuntimeRegistrationTests
{
    [Fact]
    public void MutationArtifactVerifier_AcceptsTheExactExtendedProvenanceManifest()
    {
        var root = Path.GetFullPath(Path.Combine(
            Path.GetTempPath(),
            "tf-dossier-mutation-artifact",
            Guid.NewGuid().ToString("N")));
        const string slotRelativePath = ".terrafusion/runtime/dossier/mutation-decision";
        var slot = Path.Combine(root, slotRelativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(slot);

        try
        {
            const string moduleFilename = "decide-dossier-mutation.mjs";
            const string schemaFilename = "dossier.mutation-decision.v1.schema.json";
            var moduleBytes = Encoding.UTF8.GetBytes("export default {};\n");
            var schemaBytes = Encoding.UTF8.GetBytes("{}\n");
            File.WriteAllBytes(Path.Combine(slot, moduleFilename), moduleBytes);
            File.WriteAllBytes(Path.Combine(slot, schemaFilename), schemaBytes);

            var manifestBytes = JsonSerializer.SerializeToUtf8Bytes(new Dictionary<string, object?>
            {
                ["schemaVersion"] = 1,
                ["artifactType"] = "dossier.mutation-decision.decision-module@1",
                ["contract"] = "dossier.mutation-decision@1.0.0",
                ["repository"] = "bsvalues/terrafusion-dossier",
                ["sourceBranch"] = "main",
                ["commit"] = "commit",
                ["modulePath"] = "src/mutation-decision/decide-dossier-mutation.mjs",
                ["moduleFilename"] = moduleFilename,
                ["moduleLength"] = moduleBytes.LongLength,
                ["moduleSha256"] = Hash(moduleBytes),
                ["moduleGitBlob"] = "module-blob",
                ["schemaPath"] = "contract-compat/dossier.mutation-decision.v1/dossier.mutation-decision.v1.schema.json",
                ["schemaFilename"] = schemaFilename,
                ["schemaLength"] = schemaBytes.LongLength,
                ["schemaSha256"] = Hash(schemaBytes),
                ["schemaGitBlob"] = "schema-blob",
                ["sourceManifestPath"] = "contract-compat/dossier.mutation-decision.v1/manifest.json",
                ["sourceManifestLength"] = 42,
                ["sourceManifestSha256"] = "source-manifest-sha",
                ["sourceManifestGitBlob"] = "source-manifest-blob",
                ["contractSourceSha"] = "contract-source-sha",
                ["contractReviewedHeadSha"] = "contract-reviewed-head-sha",
                ["sourceDtoSha256"] = "source-dto-sha",
                ["transport"] = "local-os-managed-artifact-slot",
            });
            File.WriteAllBytes(Path.Combine(slot, "manifest.json"), manifestBytes);

            var expectation = (DossierEvidenceRegistryReadArtifactExpectation)Activator.CreateInstance(
                typeof(DossierEvidenceRegistryReadArtifactExpectation),
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
                binder: null,
                args:
                [
                    "dossier.mutation-decision.decision-module@1",
                    "dossier.mutation-decision@1.0.0",
                    "bsvalues/terrafusion-dossier",
                    "main",
                    "commit",
                    "src/mutation-decision/decide-dossier-mutation.mjs",
                    moduleFilename,
                    Hash(moduleBytes),
                    moduleBytes.LongLength,
                    "contract-compat/dossier.mutation-decision.v1/dossier.mutation-decision.v1.schema.json",
                    schemaFilename,
                    Hash(schemaBytes),
                    schemaBytes.LongLength,
                    "contract-compat/dossier.mutation-decision.v1/manifest.json",
                    "source-manifest-sha",
                    Hash(manifestBytes),
                    manifestBytes.LongLength,
                    "contract-source-sha",
                    "source-dto-sha",
                    "local-os-managed-artifact-slot",
                    slotRelativePath,
                    "module-blob",
                    "schema-blob",
                    42L,
                    "source-manifest-blob",
                    "contract-reviewed-head-sha",
                ],
                culture: null)!;

            var artifact = new DossierEvidenceRegistryReadArtifactVerifier(root, expectation).Verify();

            artifact.ModulePath.Should().Be(Path.Combine(slot, moduleFilename));
            artifact.SchemaPath.Should().Be(Path.Combine(slot, schemaFilename));
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task Disabled_IsPersistentFailClosedSelection()
    {
        var services=new ServiceCollection();
        services.AddDossierMutationRuntime(Config("Disabled"),new Environment("Development"));
        using var provider=services.BuildServiceProvider();
        var port=provider.GetRequiredService<IDossierMutationDecisionPort>();
        var action=()=>port.DecideCreateNoteAsync(null!);
        await action.Should().ThrowAsync<DossierMutationUnavailableException>();
    }

    [Fact]
    public void Production_RefusesLocalExactBeforeArtifactResolution()
    {
        var action=()=>new ServiceCollection().AddDossierMutationRuntime(Config("LocalExact"),new Environment("Production"));
        action.Should().Throw<InvalidOperationException>().WithMessage("*restricted to Development*");
    }

    [Theory]
    [InlineData("Unknown")]
    [InlineData("99")]
    public void UnknownMode_FailsStartup(string mode)
    {
        var action=()=>new ServiceCollection().AddDossierMutationRuntime(Config(mode),new Environment("Development"));
        action.Should().Throw<InvalidOperationException>();
    }

    private static IConfiguration Config(string mode)=>new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { ["DossierMutation:Mode"]=mode,["DossierMutation:TimeoutSeconds"]="30" }).Build();
    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    private sealed class Environment(string name):IHostEnvironment
    {
        public string EnvironmentName{get;set;}=name;
        public string ApplicationName{get;set;}="tests";
        public string ContentRootPath{get;set;}=Path.GetTempPath();
        public IFileProvider ContentRootFileProvider{get;set;}=new NullFileProvider();
    }
}
