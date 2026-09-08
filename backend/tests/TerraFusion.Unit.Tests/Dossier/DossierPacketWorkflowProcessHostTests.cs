using System.Text.Json.Nodes;
using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Configuration;
using TerraFusion.API.DTOs;
using TerraFusion.API.Services.Dossier;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierPacketWorkflowProcessHostTests
{
    [Fact]
    public async Task Telemetry_ProtectedProcessRecordsCorrelatedOutcomeEventsWithoutSnapshotPayload()
    {
        using var fixture = new Artifacts(); var host = fixture.Host(); var request = Request();
        using var activity = new Activity("actual-process-parent").Start();
        var accepted = await host.DecideAsync(request, default);
        Assert.Equal("accepted", accepted["decision"]!.GetValue<string>());
        request["narrative"]!["content"] = "";
        var refused = await host.DecideAsync(request, default);
        Assert.Equal("rejected", refused["decision"]!.GetValue<string>());
        var events = activity.Events.Where(x => x.Name == "dossier.packet.canonical").ToArray();
        Assert.Equal(2, events.Length);
        Assert.Equal("accepted", events[0].Tags.Single(x => x.Key == "outcome").Value);
        Assert.Equal("rejected", events[1].Tags.Single(x => x.Key == "outcome").Value);
        foreach (var item in events)
        {
            var tags = item.Tags.ToDictionary(x => x.Key, x => x.Value);
            Assert.Equal("synthetic-seal", tags["correlation.id"]);
            Assert.Equal("finalize", tags["operation"]);
            Assert.True(Convert.ToDouble(tags["duration_ms"]) >= 0);
            Assert.DoesNotContain(tags.Values, x => x?.ToString()?.Contains("Synthetic evidence supports") == true);
            Assert.DoesNotContain(tags.Keys, x => x is "narrative" or "evidence" or "token" or "request" or "response");
        }
    }

    [Fact]
    public async Task DefaultRegistration_IsUnavailableAndNeverSilentlyEnablesCanonicalExecution()
    {
        var services = new ServiceCollection();
        services.AddDossierPacketWorkflowRuntime(new ConfigurationBuilder().Build(), new HostEnvironment("Development"));
        await using var provider = services.BuildServiceProvider();
        var port = provider.GetRequiredService<IDossierPacketWorkflowDecisionPort>();
        var error = await Assert.ThrowsAsync<DossierWorkflowException>(() => port.DecideAsync(Request(), default));
        Assert.Equal(503, error.StatusCode);
        Assert.Equal("CANONICAL_UNAVAILABLE", error.Code);
    }

    [Fact]
    public void ProductionRegistration_RefusesLocalExactBeforeResolvingOrStartingNode()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["DossierPacketWorkflow:Mode"] = "LocalExact" }).Build();
        Assert.Throws<InvalidOperationException>(() => new ServiceCollection().AddDossierPacketWorkflowRuntime(configuration, new HostEnvironment("Production")));
    }

    [Fact]
    public async Task ActualProtectedProcess_SealsFullSnapshot_PreparesExactHandoff_RefusesStaleAndBackwardTime()
    {
        using var fixture = new Artifacts();
        var host = fixture.Host();
        var request = Request();
        var sealedResult = await host.DecideAsync(request, default);
        Assert.Equal("accepted", sealedResult["decision"]!.GetValue<string>());
        var seal = sealedResult["snapshot"]!.DeepClone();
        Assert.Equal("appraisal", seal["currentDocuments"]![0]!["documentType"]!.GetValue<string>());
        Assert.Equal("Synthetic packet", seal["template"]!["name"]!.GetValue<string>());
        request.Remove("finalizationId"); request["packet"]!["status"] = "sealed"; request["finalization"] = seal;
        request["contractId"] = "dossier.appeal-handoff"; request["operation"] = "prepare";
        request["handoffId"] = "00000000-0000-4000-8000-000000000006";
        request["effectiveAt"] = "2026-09-07T12:00:00.0000003Z";
        var prepared = await host.DecideAsync(request, default);
        Assert.Equal("prepared", prepared["status"]!.GetValue<string>());
        Assert.Equal(DossierPacketWorkflowOptions.ExpectedCommit, prepared["handoff"]!["provenance"]!["suiteCommit"]!.GetValue<string>());
        Assert.Null(prepared["handoff"]!["currentDocuments"]);
        Assert.Null(prepared["handoff"]!["template"]);
        Assert.Equal(prepared.ToJsonString(), (await host.DecideAsync(request, default)).ToJsonString());
        request["effectiveAt"] = "2026-09-07T12:00:00.0000001Z";
        var backwards = await host.DecideAsync(request, default);
        Assert.Equal("INVALID_INPUT", backwards["violations"]![0]!["code"]!.GetValue<string>());
        Assert.Null(backwards["handoff"]);
        request["effectiveAt"] = "2026-09-07T12:00:00.0000003Z";
        request["currentDocuments"]![0]!["revision"] = new string('9', 64);
        var stale = await host.DecideAsync(request, default);
        Assert.Equal("STALE_FINALIZATION", stale["violations"]![0]!["code"]!.GetValue<string>());
        Assert.Null(stale["handoff"]);
        Assert.Empty(Directory.EnumerateFileSystemEntries(fixture.InvocationRoot));
    }

    [Fact]
    public async Task ActualProtectedProcess_MissingNarrativeAndIncompleteDocumentsProduceNoSeal()
    {
        using var fixture = new Artifacts(); var host = fixture.Host(); var request = Request();
        request["narrative"]!["content"] = "";
        var missing = await host.DecideAsync(request, default);
        Assert.Equal("MISSING_NARRATIVE", missing["violations"]![0]!["code"]!.GetValue<string>()); Assert.Null(missing["snapshot"]);
        request["currentDocuments"] = new JsonArray();
        var incomplete = await host.DecideAsync(request, default);
        Assert.Equal("INCOMPLETE_PACKET", incomplete["violations"]![0]!["code"]!.GetValue<string>()); Assert.Null(incomplete["snapshot"]);
    }

    [Fact]
    public async Task StageTamperAndSurplusFile_RefuseBeforeCanonicalExecution()
    {
        using var fixture = new Artifacts(); var host = fixture.Host();
        var source = Path.Combine(fixture.ArtifactRoot, "src", "packet-finalization", "decide-dossier-packet-finalization.mjs");
        var original = await File.ReadAllBytesAsync(source);
        await File.AppendAllTextAsync(source, "\n// synthetic tamper");
        var changed = await Assert.ThrowsAsync<DossierWorkflowException>(() => host.DecideAsync(Request(), default));
        Assert.Equal("ARTIFACT_IDENTITY_MISMATCH", changed.Code);
        await File.WriteAllBytesAsync(source, original);
        await File.WriteAllTextAsync(Path.Combine(fixture.ArtifactRoot, "unreserved.mjs"), "export const synthetic = true;");
        var extra = await Assert.ThrowsAsync<DossierWorkflowException>(() => host.DecideAsync(Request(), default));
        Assert.Equal("ARTIFACT_IDENTITY_MISMATCH", extra.Code);
    }

    private static JsonObject Request() => JsonNode.Parse($$"""
    {
      "schemaVersion":"1.0.0","contractId":"dossier.packet-finalization","operation":"finalize",
      "commandId":"synthetic-seal","countyId":"00000000-0000-4000-8000-000000000001","taxYear":2026,"parcelId":"SYNTHETIC-1",
      "actorId":"synthetic","effectiveAt":"2026-09-07T12:00:00.0000002Z","expectedRevision":"{{new string('1',64)}}","traceId":"synthetic-seal",
      "hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},
      "packet":{"packetId":"00000000-0000-4000-8000-000000000002","countyId":"00000000-0000-4000-8000-000000000001","taxYear":2026,"parcelId":"SYNTHETIC-1","packetType":"boe_appeal","name":"Synthetic packet","status":"complete","revision":"{{new string('1',64)}}"},
      "template":{"packetType":"boe_appeal","name":"Synthetic packet","requiredDocumentTypes":["appraisal"]},
      "currentDocuments":[{"documentId":"00000000-0000-4000-8000-000000000003","countyId":"00000000-0000-4000-8000-000000000001","taxYear":2026,"parcelId":"SYNTHETIC-1","documentType":"appraisal","status":"active","uploadedAt":"2026-09-07T10:00:00Z","revision":"{{new string('2',64)}}","contentHash":"{{new string('3',64)}}"}],
      "narrative":{"content":"Synthetic evidence supports the packet.","revision":"{{new string('4',64)}}","contentHash":"{{new string('5',64)}}"},
      "evidence":[{"evidenceId":"00000000-0000-4000-8000-000000000004","documentId":"00000000-0000-4000-8000-000000000003","revision":"{{new string('6',64)}}","contentHash":"{{new string('3',64)}}","countyId":"00000000-0000-4000-8000-000000000001","taxYear":2026,"parcelId":"SYNTHETIC-1"}],
      "provenance":{"suiteCommit":"8f58a6b989641a6fde063afa3dda68bd18062c63","artifactSha256":"d4f29a599c96499f567c065274127b5c6943955b6366bd5959166ac5abf55c01","contractVersion":"1.0.0","traceId":"synthetic-seal"},
      "finalizationId":"00000000-0000-4000-8000-000000000005"
    }
    """)!.AsObject();

    private static string Root()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory != null && !File.Exists(Path.Combine(directory.FullName, "backend", "src", "TerraFusion.API", "TerraFusion.API.csproj"))) directory = directory.Parent;
        return directory?.FullName ?? throw new InvalidOperationException("Owned sovereign test workspace not found.");
    }
    private sealed class Artifacts : IDisposable
    {
        private readonly string root = Path.Combine(Root(), ".tmp", "dossier-packet-host-tests-" + Guid.NewGuid().ToString("N"));
        public string ArtifactRoot => Path.Combine(root, "artifacts");
        public string InvocationRoot => Path.Combine(root, "invocations");
        public Artifacts()
        {
            var staged = Path.Combine(Root(), ".terrafusion", "runtime", "dossier", "packet-workflow");
            if (!File.Exists(Path.Combine(staged, "manifest.json"))) throw new InvalidOperationException("Mandatory protected process proof requires Stage-DossierPacketWorkflowModule.ps1 first; no skip or fixture fallback.");
            foreach (var file in Directory.EnumerateFiles(staged, "*", SearchOption.AllDirectories))
            {
                var target = Path.Combine(ArtifactRoot, Path.GetRelativePath(staged, file));
                Directory.CreateDirectory(Path.GetDirectoryName(target)!); File.Copy(file, target);
            }
            Directory.CreateDirectory(InvocationRoot);
        }
        public DossierPacketWorkflowProcessHost Host() => new(DossierEvidenceRegistryReadRuntimeRegistration.ResolveNodeExecutablePath(), ArtifactRoot, InvocationRoot);
        public void Dispose() { if (Directory.Exists(root)) Directory.Delete(root, true); }
    }
    private sealed class HostEnvironment(string name) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = name;
        public string ApplicationName { get; set; } = "Synthetic Dossier tests";
        public string ContentRootPath { get; set; } = Root();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
