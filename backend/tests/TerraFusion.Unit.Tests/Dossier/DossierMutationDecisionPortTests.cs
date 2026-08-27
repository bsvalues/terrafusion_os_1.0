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

    private static DossierCreateNoteDecisionRequest Request()=>new()
    {
        SchemaVersion="1.0.0",Operation=DossierMutationOperation.createNote,CommandId=CommandId,
        CountyId=CountyId,ParcelId="P-1",ActorId="actor",EffectiveAt=new DateTimeOffset(2026,8,27,8,0,0,TimeSpan.Zero),TraceId="trace",
        HostAssertions=new(){ActorAuthorized=true,CountyExists=true,ParcelExists=true,PiiApproved=true},
        Command=new(){NoteId="33333333-3333-3333-3333-333333333333",ExpectedVersion=0,Content="synthetic"},
    };

    private static DossierMutationDecisionPort CreatePort(IDossierMutationProcessHost host)=>new(host,Options.Create(new DossierMutationOptions { Mode=DossierMutationMode.LocalExact,ModulePath=Path.GetFullPath("module.mjs"),SchemaPath=Path.GetFullPath("schema.json") }));
    private static DossierMutationProcessResult Success(string json)=>new(DossierMutationProcessFailure.None,json,DossierMutationOptions.ExpectedModuleSha256,DossierMutationOptions.ExpectedModuleSha256,DossierMutationOptions.ExpectedSchemaSha256,DossierMutationOptions.ExpectedSchemaSha256,null);

    private sealed class FakeHost(DossierMutationProcessResult result):IDossierMutationProcessHost
    {
        public int Calls{get;private set;}
        public Task<DossierMutationProcessResult> DecideAsync(string modulePath,string expectedModuleSha256,string schemaPath,string expectedSchemaSha256,string requestJson,CancellationToken cancellationToken=default){Calls++;return Task.FromResult(result);}
    }
}
