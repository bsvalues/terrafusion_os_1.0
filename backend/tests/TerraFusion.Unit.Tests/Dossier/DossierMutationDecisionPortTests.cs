using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierMutationDecisionPortTests
{
    private const string CommandId="11111111-1111-1111-1111-111111111111";
    private const string CountyId="22222222-2222-2222-2222-222222222222";

    [Fact]
    public async Task CreateNote_RequiresExactProvenanceAndReturnsSuiteDefault()
    {
        var host=new FakeHost(Success($$"""{"schemaVersion":"1.0.0","operation":"createNote","commandId":"{{CommandId}}","countyId":"{{CountyId}}","parcelId":"P-1","traceId":"trace","decision":"accepted","mutation":{"version":1,"noteId":"33333333-3333-3333-3333-333333333333","content":"synthetic","noteType":"case_note","createdBy":"actor","createdAt":"2026-08-27T08:00:00Z"},"violations":[]}"""));
        var result=await CreatePort(host).DecideCreateNoteAsync(Request());
        result.Decision.Should().Be(DossierMutationDecision.accepted);
        result.Mutation!.NoteType.Should().Be("case_note");
        host.Calls.Should().Be(1);
    }

    [Fact]
    public async Task CreateNote_FailsClosedOnIdentityMismatch()
    {
        var host=new FakeHost(Success($$"""{"schemaVersion":"1.0.0","operation":"createNote","commandId":"44444444-4444-4444-4444-444444444444","countyId":"{{CountyId}}","parcelId":"P-1","traceId":"trace","decision":"rejected","violations":[{"code":"INVALID_INPUT","message":"x"}]}"""));
        var action=()=>CreatePort(host).DecideCreateNoteAsync(Request());
        await action.Should().ThrowAsync<DossierMutationUnavailableException>();
    }

    [Fact]
    public async Task CreateNote_FailsClosedOnTamperedCopiedSchema()
    {
        var host=new FakeHost(Success("{}") with { CopiedSchemaSha256=new string('0',64) });
        var action=()=>CreatePort(host).DecideCreateNoteAsync(Request());
        await action.Should().ThrowAsync<DossierMutationUnavailableException>();
    }

    [Fact]
    public async Task AcceptedResult_FailsClosedWhenSuiteTimestampIsNotUtcZ()
    {
        var host=new FakeHost(Success($$"""{"schemaVersion":"1.0.0","operation":"createNote","commandId":"{{CommandId}}","countyId":"{{CountyId}}","parcelId":"P-1","traceId":"trace","decision":"accepted","mutation":{"version":1,"noteId":"33333333-3333-3333-3333-333333333333","content":"synthetic","noteType":"case_note","createdBy":"actor","createdAt":"2026-08-27T08:00:00+00:00"},"violations":[]}"""));
        var action=()=>CreatePort(host).DecideCreateNoteAsync(Request());
        await action.Should().ThrowAsync<DossierMutationUnavailableException>();
    }

    [Fact]
    public async Task AllSixOperations_SerializeUtcTimestampsWithZ_ThroughRealProcessHost()
    {
        using var host = new RealProcessHostAdapter();
        var port = CreatePort(host);

        var decisions = new[]
        {
            (await port.DecideCreateNoteAsync(Parse<DossierCreateNoteDecisionRequest>(CreateNoteJson))).Decision,
            (await port.DecideRegisterDocumentAsync(Parse<DossierRegisterDocumentDecisionRequest>(RegisterDocumentJson))).Decision,
            (await port.DecideTransitionDocumentStatusAsync(Parse<DossierTransitionDocumentStatusDecisionRequest>(TransitionDocumentJson))).Decision,
            (await port.DecideRegisterEvidenceAsync(Parse<DossierRegisterEvidenceDecisionRequest>(RegisterEvidenceJson))).Decision,
            (await port.DecideAppendCustodyEventAsync(Parse<DossierAppendCustodyEventDecisionRequest>(AppendCustodyJson))).Decision,
            (await port.DecideCreatePacketAsync(Parse<DossierCreatePacketDecisionRequest>(CreatePacketJson))).Decision,
        };

        decisions.Should().OnlyContain(decision => decision == DossierMutationDecision.rejected);
        host.Requests.Should().HaveCount(6);
        foreach (var requestJson in host.Requests)
        {
            using var document = JsonDocument.Parse(requestJson);
            AssertUtcZTimestamp(document.RootElement.GetProperty("effectiveAt"));
            AssertNestedTimestamps(document.RootElement);
        }
    }

    private static DossierCreateNoteDecisionRequest Request()=>new()
    {
        SchemaVersion="1.0.0",Operation=DossierMutationOperation.createNote,CommandId=CommandId,
        CountyId=CountyId,ParcelId="P-1",ActorId="actor",EffectiveAt=new DateTimeOffset(2026,8,27,8,0,0,TimeSpan.Zero),TraceId="trace",
        HostAssertions=new(){ActorAuthorized=true,CountyExists=true,ParcelExists=true,PiiApproved=true},
        Command=new(){NoteId="33333333-3333-3333-3333-333333333333",ExpectedVersion=0,Content="synthetic"},
    };

    private static DossierMutationDecisionPort CreatePort(IDossierMutationProcessHost host)=>new(host,Options.Create(new DossierMutationOptions { Mode=DossierMutationMode.LocalExact,ModulePath=Path.GetFullPath("module.mjs"),SchemaPath=Path.GetFullPath("schema.json") }));
    private static DossierMutationProcessResult Success(string json)=>new(DossierMutationProcessFailure.None,json,DossierMutationOptions.ExpectedModuleSha256,DossierMutationOptions.ExpectedModuleSha256,DossierMutationOptions.ExpectedSchemaSha256,DossierMutationOptions.ExpectedSchemaSha256,null);
    private static T Parse<T>(string json) => JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;

    private static void AssertNestedTimestamps(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (property.Name.EndsWith("At", StringComparison.Ordinal))
                    AssertUtcZTimestamp(property.Value);
                AssertNestedTimestamps(property.Value);
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
                AssertNestedTimestamps(item);
        }
    }

    private static void AssertUtcZTimestamp(JsonElement timestamp) =>
        timestamp.GetString().Should().MatchRegex(
            "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z$");

    private sealed class FakeHost(DossierMutationProcessResult result):IDossierMutationProcessHost
    {
        public int Calls{get;private set;}
        public Task<DossierMutationProcessResult> DecideAsync(string modulePath,string expectedModuleSha256,string schemaPath,string expectedSchemaSha256,string requestJson,CancellationToken cancellationToken=default){Calls++;return Task.FromResult(result);}
    }

    private sealed class RealProcessHostAdapter : IDossierMutationProcessHost, IDisposable
    {
        private readonly string _root;
        private readonly string _modulePath;
        private readonly string _schemaPath;
        private readonly string _moduleSha256;
        private readonly string _schemaSha256;
        private readonly DossierMutationProcessHost _inner;

        public RealProcessHostAdapter()
        {
            _root = Path.Combine(Path.GetTempPath(), "tf-dossier-mutation-utc-z", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_root);
            _modulePath = Path.Combine(_root, "utc-z-proof.mjs");
            _schemaPath = Path.Combine(_root, "utc-z-proof.json");
            File.WriteAllText(_modulePath, SyntheticModule, new UTF8Encoding(false));
            File.WriteAllText(_schemaPath, "{}", new UTF8Encoding(false));
            _moduleSha256 = Hash(_modulePath);
            _schemaSha256 = Hash(_schemaPath);
            _inner = new DossierMutationProcessHost(
                DossierEvidenceRegistryReadRuntimeRegistration.ResolveNodeExecutablePath(),
                TimeSpan.FromSeconds(30),
                _root);
        }

        public List<string> Requests { get; } = [];

        public async Task<DossierMutationProcessResult> DecideAsync(
            string modulePath,
            string expectedModuleSha256,
            string schemaPath,
            string expectedSchemaSha256,
            string requestJson,
            CancellationToken cancellationToken = default)
        {
            Requests.Add(requestJson);
            var result = await _inner.DecideAsync(
                _modulePath,
                _moduleSha256,
                _schemaPath,
                _schemaSha256,
                requestJson,
                cancellationToken);
            return result.Success
                ? result with
                {
                    SourceModuleSha256 = DossierMutationOptions.ExpectedModuleSha256,
                    CopiedModuleSha256 = DossierMutationOptions.ExpectedModuleSha256,
                    SourceSchemaSha256 = DossierMutationOptions.ExpectedSchemaSha256,
                    CopiedSchemaSha256 = DossierMutationOptions.ExpectedSchemaSha256,
                }
                : result;
        }

        public void Dispose()
        {
            if (Directory.Exists(_root))
                Directory.Delete(_root, recursive: true);
        }

        private static string Hash(string path)
        {
            using var stream = File.OpenRead(path);
            return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        }

        private const string SyntheticModule = """
            function visit(value, key, errors) {
              if (key.endsWith('At') && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value))) {
                errors.push({ message: `${key} must be UTC Z` });
              }
              if (Array.isArray(value)) value.forEach(item => visit(item, '', errors));
              else if (value !== null && typeof value === 'object') {
                for (const [name, child] of Object.entries(value)) visit(child, name, errors);
              }
            }
            export function validateDossierMutationSchema(_root, _schema, exchange) {
              const errors = [];
              visit(exchange.request, '', errors);
              return errors;
            }
            export function decideDossierMutation(request) {
              return {
                schemaVersion: request.schemaVersion,
                operation: request.operation,
                commandId: request.commandId,
                countyId: request.countyId,
                parcelId: request.parcelId,
                ...(request.traceId === undefined ? {} : { traceId: request.traceId }),
                decision: 'rejected',
                violations: [{ code: 'INVALID_INPUT', message: 'synthetic real-host serialization proof' }],
              };
            }
            """;
    }

    private const string CreateNoteJson = """{"schemaVersion":"1.0.0","operation":"createNote","commandId":"22222222-2222-4222-8222-222222222201","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","actorId":"actor-7","effectiveAt":"2026-08-26T10:00:00Z","traceId":"trace-note","hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},"command":{"noteId":"33333333-3333-4333-8333-333333333301","expectedVersion":0,"content":"Observed exterior condition.","noteType":" inspection_note "}}""";
    private const string RegisterDocumentJson = """{"schemaVersion":"1.0.0","operation":"registerDocument","commandId":"22222222-2222-4222-8222-222222222202","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","actorId":"actor-7","effectiveAt":"2026-08-26T10:01:00Z","hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},"command":{"documentId":"33333333-3333-4333-8333-333333333302","expectedVersion":0,"name":" Recorded Deed ","documentType":" deed ","mimeType":" application/pdf ","sizeBytes":1200,"contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","description":" Ownership instrument ","retentionClass":" permanent ","storagePath":" dossier/P-100/deed.pdf "}}""";
    private const string TransitionDocumentJson = """{"schemaVersion":"1.0.0","operation":"transitionDocumentStatus","commandId":"22222222-2222-4222-8222-222222222203","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","actorId":"actor-7","effectiveAt":"2026-08-26T10:02:00Z","hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},"command":{"documentId":"33333333-3333-4333-8333-333333333302","expectedVersion":4,"current":{"documentId":"33333333-3333-4333-8333-333333333302","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","status":"active","version":4,"updatedAt":"2026-08-26T09:00:00Z"},"requestedStatus":"SEALED","reason":"Review complete"}}""";
    private const string RegisterEvidenceJson = """{"schemaVersion":"1.0.0","operation":"registerEvidence","commandId":"22222222-2222-4222-8222-222222222204","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","actorId":"actor-7","effectiveAt":"2026-08-26T10:03:00Z","hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},"command":{"evidenceId":"33333333-3333-4333-8333-333333333304","genesisEventId":"44444444-4444-4444-8444-444444444404","expectedVersion":0,"title":" Exterior inspection ","evidenceType":" photo ","documentId":"33333333-3333-4333-8333-333333333302","document":{"documentId":"33333333-3333-4333-8333-333333333302","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","status":"active","version":1},"genesisHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}}""";
    private const string AppendCustodyJson = """{"schemaVersion":"1.0.0","operation":"appendCustodyEvent","commandId":"22222222-2222-4222-8222-222222222205","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","actorId":"actor-7","effectiveAt":"2026-08-26T10:04:00Z","hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},"command":{"evidenceId":"33333333-3333-4333-8333-333333333304","eventId":"44444444-4444-4444-8444-444444444405","expectedVersion":3,"current":{"evidenceId":"33333333-3333-4333-8333-333333333304","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","integrity":"pending","version":3,"chainLength":3,"lastEventHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","lastEventAt":"2026-08-26T10:03:00Z"},"action":" HASH-VERIFIED ","notes":" Recomputed by sovereign host ","previousEventHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","eventHash":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"}}""";
    private const string CreatePacketJson = """{"schemaVersion":"1.0.0","operation":"createPacket","commandId":"22222222-2222-4222-8222-222222222206","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","actorId":"actor-7","effectiveAt":"2026-08-26T10:05:00Z","hostAssertions":{"actorAuthorized":true,"countyExists":true,"parcelExists":true,"piiApproved":true},"command":{"packetId":"33333333-3333-4333-8333-333333333306","expectedVersion":0,"template":{"packetType":" appeal ","name":" Appeal Packet ","requiredDocumentTypes":["photo","appraisal"]},"currentDocuments":[{"documentId":"55555555-5555-4555-8555-555555555501","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","documentType":"photo","status":"active","version":1,"uploadedAt":"2026-08-25T10:00:00Z"},{"documentId":"55555555-5555-4555-8555-555555555502","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","documentType":"photo","status":"sealed","version":2,"uploadedAt":"2026-08-26T09:00:00Z"},{"documentId":"55555555-5555-4555-8555-555555555503","countyId":"11111111-1111-4111-8111-111111111111","parcelId":"P-100","documentType":"appraisal","status":"archived","version":3,"uploadedAt":"2026-08-26T09:30:00Z"}]}}""";
}
