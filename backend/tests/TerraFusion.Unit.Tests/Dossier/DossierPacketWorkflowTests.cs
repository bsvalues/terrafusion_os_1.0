using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.API.DTOs;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierPacketWorkflowTests
{
    [Fact]
    public async Task ApiRequiresExplicitAuthenticatedScopeAndPermissionsBeforeServiceAccess()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var controller = new DossierPacketWorkflowController(Service(db, new RecordingPort())) {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        var county = f.Scope.CountyId.ToString("D");
        Assert.IsType<UnauthorizedResult>(await controller.ListPackets(county, 2026, f.Scope.ParcelId));
        controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim("sub", "synthetic"), new Claim("countyId", county) }, "Synthetic"));
        Assert.IsType<ForbidResult>(await controller.ListPackets(county, 2026, f.Scope.ParcelId));
        ((ClaimsIdentity)controller.User.Identity!).AddClaims(new[] { new Claim("perm", "read:dossier"), new Claim("perm", "read:dais") });
        Assert.IsType<BadRequestObjectResult>(await controller.ListPackets(county, null, f.Scope.ParcelId));
        Assert.IsType<ForbidResult>(await controller.ListPackets(Guid.NewGuid().ToString("D"), 2026, f.Scope.ParcelId));
        Assert.IsType<OkObjectResult>(await controller.ListPackets(county, 2026, f.Scope.ParcelId));
        Assert.IsType<ForbidResult>(await controller.Finalize(f.Scope.PacketId, new(county, 2026, f.Scope.ParcelId, "denied", new string('0', 64))));
        ((ClaimsIdentity)controller.User.Identity!).AddClaim(new Claim("countyId", county));
        Assert.IsType<ForbidResult>(await controller.ListPackets(county, 2026, f.Scope.ParcelId));
        Assert.Empty(await db.DossierWorkflowRecords.ToListAsync());
    }

    [Fact]
    public void BrowserTransportCannotSupplyAuthoritativeFinalizationOrProvenanceFields()
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<DossierPacketFinalizeRequest>("""
          { "county":"00000000-0000-4000-8000-000000000001","taxYear":2026,"parcelId":"SYNTHETIC","requestId":"synthetic","expectedRevision":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","finalizationId":"00000000-0000-4000-8000-000000000002" }
          """, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<DossierPacketNarrativeRequest>("""
          { "county":"00000000-0000-4000-8000-000000000001","taxYear":2026,"parcelId":"SYNTHETIC","requestId":"synthetic","expectedRevision":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","content":"Synthetic","provenance":{} }
          """, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }

    [Fact]
    public async Task PacketList_UsesExactCountyYearParcel_AndExcludesUnscopedLegacyRecords()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        foreach (var (year, parcel) in new (int?, string)[] { (2025, f.Scope.ParcelId), (2026, "OTHER"), (null, f.Scope.ParcelId) })
            db.DossierPackets.Add(new DossierPacket { CountyId = f.Scope.CountyId, TaxYear = year, ParcelId = parcel,
                PacketType = "boe_appeal", Name = "Not in selected scope", Status = "draft" });
        await db.SaveChangesAsync();
        var result = await Service(db, new RecordingPort()).ListPacketsAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, default);
        var packets = result["packets"]!.AsArray();
        Assert.Single(packets); Assert.Equal(f.Scope.PacketId.ToString("D"), packets[0]!["packetId"]!.GetValue<string>());
        Assert.Equal(f.Scope.CountyId.ToString("D"), result["countyId"]!.GetValue<string>());
    }

    [Fact]
    public async Task Revise_RequiresReason_PreservesOldSeal_AndReopensNarrativeWrite()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var service = Service(db, new RecordingPort());
        var revision = (await service.GetPacketAsync(f.Scope, "synthetic", default))["revision"]!.GetValue<string>();
        var seal = await service.FinalizeAsync(f.Scope, "synthetic", new("seal", revision), default);
        await Assert.ThrowsAsync<DossierWorkflowException>(() => service.SaveNarrativeAsync(f.Scope, "synthetic", new("blocked", revision, "Correction"), default));
        await Assert.ThrowsAsync<DossierWorkflowException>(() => service.ReviseAsync(f.Scope, "synthetic", new("empty-reason", revision, " "), default));
        var command = new DossierPacketReviseCommand("reopen", revision, "Correct the narrative");
        var reopened = await service.ReviseAsync(f.Scope, "synthetic", command, default);
        Assert.Equal(reopened.ToJsonString(), (await service.ReviseAsync(f.Scope, "synthetic", command, default)).ToJsonString());
        Assert.Equal("draft", (await db.DossierPackets.SingleAsync()).Status);
        Assert.Equal(seal.ToJsonString(), JsonNode.Parse((await db.DossierWorkflowRecords.SingleAsync(x => x.Kind == "packet-finalization")).PayloadJson)!.ToJsonString());
        await service.SaveNarrativeAsync(f.Scope, "synthetic", new("correction", revision, "Correction"), default);
        Assert.Single(await db.DossierWorkflowRecords.Where(x => x.Kind == "packet-revision").ToListAsync());
        Assert.Single(await db.AuditLogs.Where(x => x.Type == "DOSSIER_PACKET:packet-revision").ToListAsync());
    }

    [Fact]
    public async Task ReopenedPacketView_RetainsPreparedIdentity_AndTamperedReceiptIsRefused()
    {
        await using var f = await Fixture.Create(); Guid handoffId; string revision;
        await using (var db = f.Db())
        {
            var service = Service(db, new RecordingPort());
            revision = (await service.GetPacketAsync(f.Scope, "synthetic", default))["revision"]!.GetValue<string>();
            await service.FinalizeAsync(f.Scope, "synthetic", new("seal", revision), default);
            var prepared = await service.PrepareAsync(f.Scope, "synthetic", new("prepare", revision), default);
            handoffId = Guid.Parse(prepared["handoffId"]!.GetValue<string>());
        }
        await using var reopened = f.Db(); var reader = Service(reopened, new RecordingPort());
        var view = await reader.GetPacketAsync(f.Scope, "synthetic", default);
        Assert.Equal(handoffId.ToString("D"), view["handoff"]?["handoffId"]?.GetValue<string>());
        var row = await reopened.DossierWorkflowRecords.SingleAsync(x => x.Id == handoffId);
        var tampered = row.PayloadJson.Replace("synthetic", "tampered");
        await reopened.Database.ExecuteSqlInterpolatedAsync($"UPDATE DossierWorkflowRecords SET PayloadJson = {tampered} WHERE Id = {handoffId}");
        var error = await Assert.ThrowsAsync<DossierWorkflowException>(() => reader.GetPreparedHandoffAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, handoffId, revision, default));
        Assert.Equal("CONTENT_HASH_MISMATCH", error.Code);
    }

    [Fact]
    public async Task ForeignTransactionMustBeSerializable_BeforeAnyPacketWrite()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db(sharedCache: true);
        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadUncommitted);
        var error = await Assert.ThrowsAsync<DossierWorkflowException>(() => Service(db, new RecordingPort()).SaveNarrativeAsync(
            f.Scope, "synthetic", new("weaker-transaction", new string('0', 64), "Not written"), default));
        Assert.Equal("TRANSACTION_ISOLATION_REQUIRED", error.Code);
        Assert.Empty(await db.DossierWorkflowRecords.ToListAsync());
    }

    [Fact]
    public async Task NewPacketRecords_DoNotLeakIntoLegacyExportContextOrExportReads()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var packets = Service(db, new RecordingPort());
        var revision = (await packets.GetPacketAsync(f.Scope, "synthetic", default))["revision"]!.GetValue<string>();
        var narrative = await packets.SaveNarrativeAsync(f.Scope, "synthetic", new("narrative", revision, "Synthetic"), default);
        var legacy = new DossierWorkflowService(db);
        var result = JsonSerializer.SerializeToNode(await legacy.Context(f.Scope.CountyId, 2026, f.Scope.ParcelId, false, default))!;
        Assert.Empty(result["exports"]!.AsArray());
        var error = await Assert.ThrowsAsync<DossierWorkflowException>(() => legacy.GetExport(f.Scope.CountyId,
            Guid.Parse(narrative["recordId"]!.GetValue<string>()), false, default));
        Assert.Equal(404, error.StatusCode);
    }

    [Fact]
    public async Task Narrative_PersistsAcrossContexts_ExactRetryHasOneReceipt()
    {
        await using var f = await Fixture.Create();
        string revision;
        await using (var db = f.Db())
        {
            var service = Service(db, new RecordingPort());
            var before = await service.GetPacketAsync(f.Scope, "synthetic", default);
            revision = before["revision"]!.GetValue<string>();
            var command = new DossierPacketNarrativeCommand("narrative-1", revision, "Stored synthetic narrative.");
            var saved = await service.SaveNarrativeAsync(f.Scope, "synthetic", command, default);
            var replay = await service.SaveNarrativeAsync(f.Scope, "synthetic", command, default);
            Assert.Equal(saved.ToJsonString(), replay.ToJsonString());
            Assert.Single(await db.DossierWorkflowRecords.Where(x => x.Kind == "packet-narrative").ToListAsync());
        }
        await using var reopened = f.Db();
        var current = await Service(reopened, new RecordingPort()).GetPacketAsync(f.Scope, "synthetic", default);
        Assert.Equal("Stored synthetic narrative.", current["narrative"]!["content"]!.GetValue<string>());
        Assert.NotEqual(revision, current["revision"]!.GetValue<string>());
    }

    [Fact]
    public async Task StaleNarrativeAndWrongScope_DoNotWrite()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var service = Service(db, new RecordingPort());
        var ex = await Assert.ThrowsAsync<DossierWorkflowException>(() => service.SaveNarrativeAsync(f.Scope, "synthetic",
            new("stale", new string('0', 64), "Rejected narrative"), default));
        Assert.Equal(409, ex.StatusCode);
        await Assert.ThrowsAsync<DossierWorkflowException>(() => service.GetPacketAsync(f.Scope with { TaxYear = 2025 }, "synthetic", default));
        await Assert.ThrowsAsync<DossierWorkflowException>(() => service.GetPacketAsync(f.Scope with { CountyId = Guid.NewGuid() }, "synthetic", default));
        Assert.Empty(await db.DossierWorkflowRecords.ToListAsync());
    }

    [Fact]
    public async Task ChangedRequestIdPayloadConflicts_AndSourceChangeAltersRevision()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var service = Service(db, new RecordingPort());
        var state = await service.GetPacketAsync(f.Scope, "synthetic", default);
        var command = new DossierPacketNarrativeCommand("same-key", state["revision"]!.GetValue<string>(), "First narrative");
        await service.SaveNarrativeAsync(f.Scope, "synthetic", command, default);
        var conflict = await Assert.ThrowsAsync<DossierWorkflowException>(() => service.SaveNarrativeAsync(f.Scope, "synthetic", command with { Content = "Other" }, default));
        Assert.Equal(409, conflict.StatusCode);
        var before = await service.GetPacketAsync(f.Scope, "synthetic", default);
        var document = await db.DossierDocuments.SingleAsync(); document.ContentHash = new string('9', 64); document.Version++;
        await db.SaveChangesAsync();
        var after = await service.GetPacketAsync(f.Scope, "synthetic", default);
        Assert.NotEqual(before["revision"]!.ToJsonString(), after["revision"]!.ToJsonString());
    }

    [Fact]
    public async Task SealAndHandoff_RetryAndReopenRetainExactPersistedEnvelope_StaleReadRefused()
    {
        await using var f = await Fixture.Create();
        Guid handoffId; string revision; string envelope;
        await using (var db = f.Db())
        {
            var service = Service(db, new RecordingPort());
            revision = (await service.GetPacketAsync(f.Scope, "synthetic", default))["revision"]!.GetValue<string>();
            var command = new DossierPacketCommand("seal-1", revision);
            var seal = await service.FinalizeAsync(f.Scope, "synthetic", command, default);
            Assert.Equal("sealed", (await db.DossierPackets.SingleAsync()).Status);
            Assert.Equal(seal.ToJsonString(), (await service.FinalizeAsync(f.Scope, "synthetic", command, default)).ToJsonString());
            var prepared = await service.PrepareAsync(f.Scope, "synthetic", new("prepare-1", revision), default);
            handoffId = Guid.Parse(prepared["handoffId"]!.GetValue<string>());
            envelope = prepared.ToJsonString();
        }
        await using var reopened = f.Db();
        var reader = Service(reopened, new RecordingPort());
        var stored = await reader.GetPreparedHandoffAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, handoffId, revision, default);
        Assert.Equal(envelope, JsonNode.Parse(stored.EnvelopeJson)!.ToJsonString());
        Assert.Equal("sealed", stored.CurrentPacket.Status);
        Assert.Equal(revision, stored.CurrentPacket.PacketRevision);
        Assert.Equal(64, stored.ContentHash.Length);
        var doc = await reopened.DossierDocuments.SingleAsync(); doc.Version++; await reopened.SaveChangesAsync();
        await Assert.ThrowsAsync<DossierWorkflowException>(() => reader.GetPreparedHandoffAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, handoffId, revision, default));
    }

    [Fact]
    public async Task CanonicalRefusalRollsBack_AndCannotBeOverriddenByCachedPacketStatus()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var port = new RecordingPort(); var service = Service(db, port);
        var revision = (await service.GetPacketAsync(f.Scope, "synthetic", default))["revision"]!.GetValue<string>();
        port.Refuse = true;
        var error = await Assert.ThrowsAsync<DossierWorkflowException>(() => service.FinalizeAsync(f.Scope, "synthetic", new("denied", revision), default));
        Assert.Equal("INCOMPLETE_PACKET", error.Code);
        Assert.Equal("complete", (await db.DossierPackets.SingleAsync()).Status);
        Assert.Empty(await db.DossierWorkflowRecords.ToListAsync());
    }

    [Fact]
    public async Task DaisTransactionOwnsCommit_LinkTouchesOnlyDossier_ExactRetryDoesNotResetAppeal()
    {
        await using var f = await Fixture.Create(); await using var db = f.Db();
        var service = Service(db, new RecordingPort());
        var revision = (await service.GetPacketAsync(f.Scope, "synthetic", default))["revision"]!.GetValue<string>();
        await service.FinalizeAsync(f.Scope, "synthetic", new("seal-1", revision), default);
        var handoff = await service.PrepareAsync(f.Scope, "synthetic", new("prepare-1", revision), default);
        var handoffId = Guid.Parse(handoff["handoffId"]!.GetValue<string>());
        var appeal = new Appeal { CountyId = f.Scope.CountyId, TaxYear = 2026, ParcelId = f.Scope.ParcelId, AppealGround = "MARKET_VALUE", Status = "heard" };
        db.Appeals.Add(appeal); await db.SaveChangesAsync();
        await using (var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable))
        {
            await service.LinkAppealAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, handoffId, revision, appeal.Id, "link-1", "synthetic", default);
            await transaction.RollbackAsync();
        }
        db.ChangeTracker.Clear();
        Assert.Null((await db.DossierPackets.SingleAsync()).AppealId);
        var linked = await service.LinkAppealAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, handoffId, revision, appeal.Id, "link-1", "synthetic", default);
        var retry = await service.LinkAppealAsync(f.Scope.CountyId, 2026, f.Scope.ParcelId, handoffId, revision, appeal.Id, "link-1", "synthetic", default);
        Assert.Equal(linked, retry);
        Assert.Equal("heard", (await db.Appeals.SingleAsync()).Status);
        Assert.Equal(appeal.Id, (await db.DossierPackets.SingleAsync()).AppealId);
    }

    // This port deliberately makes no completeness/sealing judgments. These tests exercise host
    // reads, hashing, transaction and idempotency; canonical decisions have separate real-module tests.
    private sealed class RecordingPort : IDossierPacketWorkflowDecisionPort
    {
        public bool Refuse { get; set; }
        public JsonObject Provenance(string traceId) => new() { ["suiteCommit"] = new string('a', 40), ["artifactSha256"] = new string('b', 64), ["contractVersion"] = "1.0.0", ["traceId"] = traceId };
        public Task<JsonObject> DecideAsync(JsonObject request, CancellationToken ct)
        {
            var result = new JsonObject {
            ["schemaVersion"] = "1.0.0", ["contractId"] = request["contractId"]!.DeepClone(), ["commandId"] = request["commandId"]!.DeepClone(),
            ["countyId"] = request["countyId"]!.DeepClone(), ["taxYear"] = request["taxYear"]!.DeepClone(), ["parcelId"] = request["parcelId"]!.DeepClone(),
            ["packetId"] = request["packet"]!["packetId"]!.DeepClone(), ["traceId"] = request["traceId"]!.DeepClone(),
            ["decision"] = "accepted", ["status"] = "complete", ["violations"] = new JsonArray(),
            };
            if (Refuse) { result["decision"] = "rejected"; result["status"] = "draft"; result["violations"] = new JsonArray(new JsonObject { ["code"] = "INCOMPLETE_PACKET", ["message"] = "Synthetic port refusal" }); }
            else if (request["operation"]!.GetValue<string>() == "revise") result["status"] = "draft";
            else if (request["operation"]!.GetValue<string>() == "finalize")
            {
                var snapshot = request["packet"]!.DeepClone().AsObject();
                snapshot["schemaVersion"] = "1.0.0"; snapshot["contractId"] = "dossier.packet-finalization";
                snapshot["packetRevision"] = snapshot["revision"]!.DeepClone(); snapshot.Remove("revision");
                snapshot["finalizationId"] = request["finalizationId"]!.DeepClone(); snapshot["status"] = "sealed";
                snapshot["finalizedAt"] = request["effectiveAt"]!.DeepClone(); snapshot["finalizedBy"] = request["actorId"]!.DeepClone();
                foreach (var key in new[] { "narrative", "evidence", "provenance", "template", "currentDocuments" }) snapshot[key] = request[key]!.DeepClone();
                snapshot["items"] = new JsonArray(); result["snapshot"] = snapshot; result["status"] = "sealed";
            }
            else if (request["operation"]!.GetValue<string>() == "prepare")
            {
                var handoff = request["finalization"]!.DeepClone().AsObject(); handoff.Remove("items"); handoff.Remove("name"); handoff.Remove("status");
                handoff.Remove("template"); handoff.Remove("currentDocuments");
                handoff["contractId"] = "dossier.appeal-handoff"; handoff["handoffId"] = request["handoffId"]!.DeepClone();
                handoff["preparedAt"] = request["effectiveAt"]!.DeepClone(); handoff["preparedBy"] = request["actorId"]!.DeepClone();
                handoff["provenance"] = request["provenance"]!.DeepClone(); result["handoff"] = handoff; result["status"] = "prepared";
            }
            return Task.FromResult(result);
        }
    }

    private static DossierPacketWorkflowService Service(TerraFusionDbContext db, RecordingPort port) => new(db, port,
        new TerraFusion.Core.Services.AppealService(db, Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.Core.Services.AppealService>.Instance,
            Moq.Mock.Of<TerraFusion.Core.Services.IDaisAppealMutationDecisionPort>()));

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly string directory = Path.Combine(Workspace(), ".tmp", "eo-dossier-tests-" + Guid.NewGuid().ToString("N"));
        private static string Workspace()
        {
            var current = new DirectoryInfo(AppContext.BaseDirectory);
            while (current != null && !File.Exists(Path.Combine(current.FullName, "backend", "src", "TerraFusion.API", "TerraFusion.API.csproj"))) current = current.Parent;
            return current?.FullName ?? throw new InvalidOperationException("Owned Dossier workspace not found.");
        }
        public DossierPacketScope Scope { get; } = new(Guid.NewGuid(), 2026, "SYNTHETIC-PACKET", Guid.NewGuid());
        public TerraFusionDbContext Db(bool sharedCache = false) => new(new DbContextOptionsBuilder<TerraFusionDbContext>().UseSqlite($"Data Source={Path.Combine(directory, "packet.db")};Pooling=False;Cache={(sharedCache ? "Shared" : "Default")}").Options, new ConfigurationBuilder().Build());
        public static async Task<Fixture> Create()
        {
            var f = new Fixture(); Directory.CreateDirectory(f.directory); await using var db = f.Db();
            var tables = new HashSet<string> { "Counties", "Properties", "Appeals", "CountyStudySessions", "CertificationSteps", "DossierPackets", "DossierPacketItems", "DossierDocuments", "DossierEvidenceItems", "DossierCustodyEvents", "DossierWorkflowRecords", "AuditLogs" };
            var script = db.Database.GenerateCreateScript();
            foreach (Match statement in Regex.Matches(script, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;"))
                if (tables.Contains(statement.Groups[1].Value)) await db.Database.ExecuteSqlRawAsync(statement.Value);
            foreach (Match statement in Regex.Matches(script, "CREATE (?:UNIQUE )?INDEX [^;]+;"))
                if (tables.Any(t => statement.Value.Contains($"ON \"{t}\""))) await db.Database.ExecuteSqlRawAsync(statement.Value);
            db.Counties.Add(new County { Id = f.Scope.CountyId, Name = "Synthetic", State = "WA", FipsCode = "99001" });
            db.Properties.Add(new Property { CountyId = f.Scope.CountyId, ParcelId = f.Scope.ParcelId, ParcelNumber = f.Scope.ParcelId, PropertyId = f.Scope.ParcelId, TaxYear = 2026, Address = "Synthetic", PropertyType = "Residential" });
            var document = new DossierDocument { CountyId = f.Scope.CountyId, ParcelId = f.Scope.ParcelId, Name = "Synthetic appraisal", DocumentType = "appraisal", ContentHash = new string('3', 64) };
            db.DossierDocuments.Add(document);
            db.DossierEvidenceItems.Add(new DossierEvidence { CountyId = f.Scope.CountyId, ParcelId = f.Scope.ParcelId, DocumentId = document.Id, Title = "Synthetic evidence", EvidenceType = "valuation-record" });
            db.DossierPackets.Add(new DossierPacket { Id = f.Scope.PacketId, CountyId = f.Scope.CountyId, TaxYear = f.Scope.TaxYear, ParcelId = f.Scope.ParcelId, PacketType = "boe_appeal", Name = "Synthetic packet", Status = "complete",
                Items = [new DossierPacketItem { DocumentId = document.Id, DocumentType = "appraisal", Required = true, Satisfied = true }] });
            await db.SaveChangesAsync(); return f;
        }
        public ValueTask DisposeAsync() { Directory.Delete(directory, true); return ValueTask.CompletedTask; }
    }
}
