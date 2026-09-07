using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierMutationRuntimeRegistrationTests
{
    // Published bytes, not a manifest generated from the verifier's expectations.
    private static readonly string PublishedMutationManifest = """
        {
          "schemaVersion": 1,
          "artifactType": "dossier.mutation-decision.decision-module@1",
          "contract": "dossier.mutation-decision@1.0.0",
          "repository": "bsvalues/terrafusion-dossier",
          "sourceBranch": "main",
          "commit": "2c709fe2286b5c1e6bde43fcbc2a35111a456092",
          "modulePath": "src/mutation-decision/decide-dossier-mutation.mjs",
          "moduleFilename": "decide-dossier-mutation.mjs",
          "moduleLength": 18366,
          "moduleSha256": "b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277",
          "moduleGitBlob": "c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc",
          "schemaPath": "contract-compat/dossier.mutation-decision.v1/dossier.mutation-decision.v1.schema.json",
          "schemaFilename": "dossier.mutation-decision.v1.schema.json",
          "schemaLength": 18611,
          "schemaSha256": "48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3",
          "schemaGitBlob": "42fb0ce560a407ccee27ffd55f3d074dac182243",
          "sourceManifestPath": "contract-compat/dossier.mutation-decision.v1/manifest.json",
          "sourceManifestLength": 6921,
          "sourceManifestSha256": "dd9dfd1f0d6e31689ebbc90e2e7f1674be55b54eff433ec15d041b565d4f2444",
          "sourceManifestGitBlob": "fa128c254b38366133d5017e50e7c7226f37401f",
          "contractSourceSha": "7cb96bf2ea5efea7caccae6d6e8c9f81f672412e",
          "contractReviewedHeadSha": "285c458e66d47c109b31ee6b67a82b9ce24b8f55",
          "sourceDtoSha256": "58919613fb6da88763cfa12113c3950790c6daa8526ac7151c569320f3258f9a",
          "transport": "local-os-managed-artifact-slot"
        }
        """.ReplaceLineEndings("\r\n") + "\r\n";

    private static readonly string[] MutationOnlyFields =
    [
        "moduleGitBlob", "schemaGitBlob", "sourceManifestLength",
        "sourceManifestGitBlob", "contractReviewedHeadSha",
    ];

    [Fact]
    public void PublishedMutationManifest_PassesPinnedManifestChecksBeforeRejectingNoncanonicalPayload()
    {
        using var scope = new ArtifactScope();
        var bytes = Encoding.UTF8.GetBytes(PublishedMutationManifest);
        bytes.LongLength.Should().Be(DossierMutationOptions.ExpectedPublishedManifestLength);
        Hash(bytes).Should().Be(DossierMutationOptions.ExpectedPublishedManifestSha256);
        File.WriteAllBytes(scope.ManifestPath, bytes);

        var verifier = new DossierEvidenceRegistryReadArtifactVerifier(
            scope.Root, DossierMutationArtifactExpectation.Canonical);
        var action = () => verifier.Verify();

        // The portable payload is deliberately not the external module. Reaching its
        // identity check proves the exact published manifest passed without relaxing pins.
        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("Dossier module length mismatch: expected 18366, found *");
    }

    [Theory]
    [InlineData(false, 19)]
    [InlineData(true, 24)]
    public void Verifier_AcceptsEachExactProfileWithVerifiedPayloads(bool mutation, int fieldCount)
    {
        using var scope = new ArtifactScope(mutation);
        scope.Manifest.Count.Should().Be(fieldCount);

        var verified = scope.Verifier.Verify();

        verified.ModulePath.Should().Be(scope.ModulePath);
        verified.SchemaPath.Should().Be(scope.SchemaPath);
        verified.ManifestSha256.Should().Be(scope.Expectation.PublishedManifestSha256);
        verified.ManifestLength.Should().Be(scope.Expectation.PublishedManifestLength);
        verified.ModuleSha256.Should().Be(scope.Expectation.ModuleSha256);
        verified.ModuleLength.Should().Be(scope.Expectation.ModuleLength);
        verified.SchemaSha256.Should().Be(scope.Expectation.SchemaSha256);
        verified.SchemaLength.Should().Be(scope.Expectation.SchemaLength);
    }

    [Theory]
    [MemberData(nameof(EveryMutationField))]
    public void Verifier_RejectsEveryMutationFieldValueBeyondByteIdentity(string field)
    {
        using var scope = new ArtifactScope();
        scope.Manifest[field] = $"{scope.Manifest[field]}-tampered";
        scope.WriteAndPinFixtureManifest();

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage($"*manifest {field} did not match the canonical*identity*");
    }

    [Theory]
    [MemberData(nameof(EveryMutationField))]
    public void Verifier_RejectsEveryMissingMutationFieldBeyondByteIdentity(string field)
    {
        using var scope = new ArtifactScope();
        scope.Manifest.Remove(field);
        scope.WriteAndPinFixtureManifest();

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("*fields did not match the exact schema*");
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public void Verifier_RejectsUnknownAndDuplicateFieldsBeyondByteIdentity(bool mutation, bool duplicate)
    {
        using var scope = new ArtifactScope(mutation);
        var json = scope.Manifest.ToJsonString();
        var extra = duplicate ? "\"transport\":\"local-os-managed-artifact-slot\"" : "\"unknown\":true";
        scope.WriteAndPinFixtureManifest(json[..^1] + "," + extra + "}");

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("*fields did not match the exact schema*");
    }

    [Fact]
    public void Verifier_DoesNotAcceptMutationFieldsOnReadProfileOrReadShapeOnMutationProfile()
    {
        using var read = new ArtifactScope(mutation: false);
        using var mutation = new ArtifactScope();
        foreach (var field in MutationOnlyFields)
        {
            read.Manifest[field] = mutation.Manifest[field]!.DeepClone();
            mutation.Manifest.Remove(field);
        }
        read.WriteAndPinFixtureManifest();
        mutation.WriteAndPinFixtureManifest();

        var readAction = () => read.Verifier.Verify();
        var mutationAction = () => mutation.Verifier.Verify();

        readAction.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("*fields did not match the exact schema*");
        mutationAction.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("*fields did not match the exact schema*");
    }

    [Theory]
    [InlineData("moduleGitBlob")]
    [InlineData("schemaGitBlob")]
    [InlineData("sourceManifestGitBlob")]
    [InlineData("contractReviewedHeadSha")]
    public void Verifier_RejectsNonStringMutationProvenance(string field)
    {
        using var scope = new ArtifactScope();
        scope.Manifest[field] = 1;
        scope.WriteAndPinFixtureManifest();

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage($"*manifest {field} did not match the canonical identity*");
    }

    [Theory]
    [InlineData("\"6921\"")]
    [InlineData("6921.0")]
    [InlineData("6.921e3")]
    [InlineData("null")]
    [InlineData("true")]
    public void Verifier_RequiresCanonicalSourceManifestLengthInteger(string value)
    {
        using var scope = new ArtifactScope();
        scope.WriteAndPinFixtureManifest(scope.Manifest.ToJsonString()
            .Replace("\"sourceManifestLength\":6921", $"\"sourceManifestLength\":{value}", StringComparison.Ordinal));

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage("*manifest sourceManifestLength did not match the canonical integer identity*");
    }

    [Theory]
    [InlineData("manifest", false)]
    [InlineData("manifest", true)]
    [InlineData("module", false)]
    [InlineData("module", true)]
    [InlineData("schema", false)]
    [InlineData("schema", true)]
    public void Verifier_StillRejectsPayloadAndManifestByteTampering(string target, bool changeLength)
    {
        using var scope = new ArtifactScope();
        var path = target switch
        {
            "module" => scope.ModulePath,
            "schema" => scope.SchemaPath,
            _ => scope.ManifestPath,
        };
        var bytes = File.ReadAllBytes(path);
        if (changeLength)
            bytes = [.. bytes, (byte)' '];
        else
            bytes[0] ^= 1;
        File.WriteAllBytes(path, bytes);

        var action = () => scope.Verifier.Verify();

        action.Should().Throw<DossierEvidenceRegistryReadArtifactException>()
            .WithMessage(changeLength ? "*length mismatch*" : "*hash mismatch*");
    }

    public static IEnumerable<object[]> EveryMutationField() =>
        JsonNode.Parse(PublishedMutationManifest)!.AsObject().Select(property => new object[] { property.Key });

    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

    private sealed class ArtifactScope : IDisposable
    {
        public ArtifactScope(bool mutation = true)
        {
            Root = Path.Combine(Path.GetTempPath(), "tf-dossier-mutation-manifest-tests", Guid.NewGuid().ToString("N"));
            Expectation = mutation ? DossierMutationArtifactExpectation.Canonical : DossierEvidenceRegistryReadArtifactExpectation.Canonical;
            var slot = Path.Combine(Root, Expectation.ArtifactSlotRelativePath.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(slot);
            ModulePath = Path.Combine(slot, Expectation.ModuleFilename);
            SchemaPath = Path.Combine(slot, Expectation.SchemaFilename);
            ManifestPath = Path.Combine(slot, "manifest.json");
            var module = Encoding.UTF8.GetBytes("export {};\n");
            var schema = Encoding.UTF8.GetBytes("{\"type\":\"object\"}\n");
            File.WriteAllBytes(ModulePath, module);
            File.WriteAllBytes(SchemaPath, schema);
            Expectation = Expectation with
            {
                ModuleLength = module.LongLength, ModuleSha256 = Hash(module),
                SchemaLength = schema.LongLength, SchemaSha256 = Hash(schema),
            };
            Manifest = JsonNode.Parse(PublishedMutationManifest)!.AsObject();
            if (!mutation)
                foreach (var field in MutationOnlyFields) Manifest.Remove(field);
            Manifest["artifactType"] = Expectation.ArtifactType;
            Manifest["contract"] = Expectation.Contract;
            Manifest["commit"] = Expectation.Commit;
            Manifest["modulePath"] = Expectation.ModuleSourcePath;
            Manifest["moduleFilename"] = Expectation.ModuleFilename;
            Manifest["moduleLength"] = Expectation.ModuleLength;
            Manifest["moduleSha256"] = Expectation.ModuleSha256;
            Manifest["schemaPath"] = Expectation.SchemaSourcePath;
            Manifest["schemaFilename"] = Expectation.SchemaFilename;
            Manifest["schemaLength"] = Expectation.SchemaLength;
            Manifest["schemaSha256"] = Expectation.SchemaSha256;
            Manifest["sourceManifestPath"] = Expectation.SourceManifestPath;
            Manifest["sourceManifestSha256"] = Expectation.SourceManifestSha256;
            Manifest["contractSourceSha"] = Expectation.ContractSourceSha;
            Manifest["sourceDtoSha256"] = Expectation.SourceDtoSha256;
            WriteAndPinFixtureManifest();
        }

        public string Root { get; }
        public string ModulePath { get; }
        public string SchemaPath { get; }
        public string ManifestPath { get; }
        public JsonObject Manifest { get; }
        public DossierEvidenceRegistryReadArtifactExpectation Expectation { get; private set; }
        public DossierEvidenceRegistryReadArtifactVerifier Verifier => new(Root, Expectation);

        public void WriteAndPinFixtureManifest(string? json = null)
        {
            var bytes = Encoding.UTF8.GetBytes(json ?? Manifest.ToJsonString());
            File.WriteAllBytes(ManifestPath, bytes);
            // Fixture-only byte pins let negative tests reach semantic validation.
            // Canonical production expectations and all other identity fields stay fixed.
            Expectation = Expectation with
            {
                PublishedManifestLength = bytes.LongLength,
                PublishedManifestSha256 = Hash(bytes),
            };
        }

        public void Dispose() => Directory.Delete(Root, recursive: true);
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
    private sealed class Environment(string name):IHostEnvironment
    {
        public string EnvironmentName{get;set;}=name;
        public string ApplicationName{get;set;}="tests";
        public string ContentRootPath{get;set;}=Path.GetTempPath();
        public IFileProvider ContentRootFileProvider{get;set;}=new NullFileProvider();
    }
}
