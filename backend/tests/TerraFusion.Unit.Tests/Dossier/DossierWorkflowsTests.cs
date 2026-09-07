using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Services;
using TerraFusion.Abstractions.DTOs;
using Mock = Moq.Mock;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierWorkflowsTests
{
    private const string County = "11111111-1111-1111-1111-111111111111";
    private const string OtherCounty = "22222222-2222-2222-2222-222222222222";
    private const string Study = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private const string Parcel = "SYNTHETIC-WORKFLOW";
    private const string Root = "/api/dossier/workflows";

    [Fact]
    public async Task Context_UsesStoredYearsAndStudies_WithoutCalendarDefault()
    {
        await using var fixture = await Fixture.Create();
        var response = await fixture.Client.GetAsync($"{Root}/context?county={County}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await Json(response);
        Assert.Equal(new[] { 2024 }, body.GetProperty("taxYears").EnumerateArray().Select(x => x.GetInt32()));
        Assert.Equal(Study, body.GetProperty("studies")[0].GetProperty("studyId").GetString());
        Assert.Empty(body.GetProperty("drafts").EnumerateArray());
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();

    [Theory]
    [InlineData("Test-Anonymous", "yes", 401)]
    [InlineData("Test-County", "benton", 403)]
    [InlineData("Test-County", "00000000-0000-0000-0000-000000000000", 403)]
    [InlineData("Test-No-User", "yes", 403)]
    [InlineData("Test-Permissions", "read:dais", 403)]
    [InlineData("Test-Permissions", "read:dossier,write:dossier", 403)]
    public async Task Auth_FailsClosed(string header, string value, int expected)
    {
        await using var f = await Fixture.Create();
        f.Client.DefaultRequestHeaders.Add(header, value);
        f.Client.DefaultRequestHeaders.Add("X-County-Id", County);
        Assert.Equal(expected, (int)(await f.Client.GetAsync($"{Root}/context?county={County}")).StatusCode);
    }

    [Fact]
    public async Task CallerCounty_MustMatchClaim()
    {
        await using var f = await Fixture.Create();
        Assert.Equal(HttpStatusCode.Forbidden, (await f.Client.GetAsync($"{Root}/context?county={OtherCounty}")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await f.Client.GetAsync($"{Root}/context")).StatusCode);
    }

    private static async Task<JsonElement> Draft(Fixture f, string request = "draft-1")
    {
        var response = await f.Client.PostAsJsonAsync($"{Root}/drafts", new { county = County, studyId = Study, requestId = request });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await Json(response);
    }

    private static object ExportRequest(JsonElement draft, string request = "export-1", int year = 2024,
        string? revision = null, bool confirmed = true, string reason = "annual_certification") => new
        { county = County, draftId = draft.GetProperty("draftId").GetString(), revision = revision ?? draft.GetProperty("revision").GetString(),
          taxYear = year, requestId = request, confirmed, reasonCode = reason };

    [Fact]
    public async Task Snapshot_ExportsExactStoredContentsAndHashes_AfterMutationAndRestart()
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        Assert.Equal(2, draft.GetProperty("artifactCount").GetInt32());
        await using (var db = f.Db())
        {
            var value = await db.ValuationRecords.SingleAsync();
            value.FinalReconciledValue = 999m;
            await db.SaveChangesAsync();
        }
        var response = await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await Json(response);
        Assert.Equal("complete", summary.GetProperty("status").GetString());
        Assert.False(summary.GetProperty("certification").GetBoolean());
        Assert.Equal(2, summary.GetProperty("artifactCount").GetInt32());
        var contentUrl = summary.GetProperty("payloadRef").GetString()!;
        var content = await f.Client.GetStringAsync(contentUrl);
        Assert.Contains("123456", content);
        Assert.DoesNotContain(":999", content);
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content))).ToLowerInvariant(), summary.GetProperty("contentHash").GetString());
        var artifacts = JsonDocument.Parse(content).RootElement.GetProperty("artifacts");
        foreach (var artifact in artifacts.EnumerateArray())
            Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(artifact.GetProperty("content").GetRawText()))).ToLowerInvariant(),
                artifact.GetProperty("sha256").GetString());
        await f.Restart();
        Assert.Equal(content, await f.Client.GetStringAsync(contentUrl));
        Assert.Equal(draft.GetProperty("revision").GetString(),
            (await Json(await f.Client.GetAsync($"{Root}/drafts/{draft.GetProperty("draftId").GetString()}?county={County}"))).GetProperty("revision").GetString());
        var retry = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft)));
        Assert.Equal(summary.GetProperty("packageRef").GetString(), retry.GetProperty("packageRef").GetString());
    }

    [Fact]
    public async Task MissingOrForeignDraft_WrongYearRevisionAndConfirmation_ProduceNoExport()
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        foreach (var request in new[] { ExportRequest(draft, year: 2025), ExportRequest(draft, revision: new string('a', 64)) })
            Assert.Equal(HttpStatusCode.Conflict, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", request)).StatusCode);
        foreach (var request in new[] { ExportRequest(draft, confirmed: false), ExportRequest(draft, reason: " ") })
            Assert.Equal(HttpStatusCode.BadRequest, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", request)).StatusCode);
        var missing = await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", new { county = County, draftId = Guid.NewGuid(),
            revision = new string('a', 64), taxYear = 2024, requestId = "missing", confirmed = true, reasonCode = "annual_certification" });
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        f.Client.DefaultRequestHeaders.Add("Test-County", OtherCounty);
        var foreign = await f.Client.GetAsync($"{Root}/drafts/{draft.GetProperty("draftId").GetString()}?county={OtherCounty}");
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        f.Client.DefaultRequestHeaders.Remove("Test-County");
        var context = await Json(await f.Client.GetAsync($"{Root}/context?county={County}"));
        Assert.Empty(context.GetProperty("exports").EnumerateArray());
    }

    [Fact]
    public async Task Idempotency_RejectsChangedInputsAndCrossOperationRequestReuse()
    {
        await using var f = await Fixture.Create();
        var first = await Draft(f);
        var retry = await Draft(f);
        Assert.Equal(first.GetProperty("draftId").GetString(), retry.GetProperty("draftId").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await f.Client.PostAsJsonAsync($"{Root}/drafts", new
            { county = County, studyId = Guid.NewGuid(), requestId = "draft-1" })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(first, "draft-1"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(first))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(first, reason: "board_directive"))).StatusCode);
    }

    [Fact]
    public async Task MissingSources_RejectsDraftAndAudit_AndBriefHasNoSeededFindings()
    {
        await using var f = await Fixture.Create();
        await using (var db = f.Db()) { await db.ValuationRecords.ExecuteDeleteAsync(); }
        Assert.Equal((HttpStatusCode)422, (await f.Client.PostAsJsonAsync($"{Root}/drafts", new { county = County, studyId = Study, requestId = "empty" })).StatusCode);
        var audit = await f.Client.PostAsJsonAsync($"{Root}/exports/audit", new { county = County, taxYear = 2030,
            bundleScope = "county", requestId = "audit-empty", confirmed = true, reasonCode = "annual_certification" });
        Assert.Equal((HttpStatusCode)422, audit.StatusCode);
        var brief = await f.Client.GetAsync($"{Root}/morning-brief?county={County}&taxYear=2030&role=appeals_specialist");
        Assert.Equal(HttpStatusCode.OK, brief.StatusCode);
        Assert.Empty((await Json(brief)).GetProperty("findings").EnumerateArray());
    }

    [Fact]
    public async Task InterruptedWrite_RollsBackPayload_AndRetryAfterRestartCommitsOnce()
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        await using (var db = f.Db())
            await db.Database.ExecuteSqlRawAsync("CREATE TRIGGER synthetic_interruption BEFORE INSERT ON AuditLogs BEGIN SELECT RAISE(ABORT, 'synthetic interruption'); END;");
        var failed = await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft));
        Assert.Equal(HttpStatusCode.ServiceUnavailable, failed.StatusCode);
        await f.Restart();
        var context = await Json(await f.Client.GetAsync($"{Root}/context?county={County}"));
        Assert.Empty(context.GetProperty("exports").EnumerateArray());
        await using (var db = f.Db()) await db.Database.ExecuteSqlRawAsync("DROP TRIGGER synthetic_interruption;");
        Assert.Equal(HttpStatusCode.OK, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft))).StatusCode);
        var retry = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft)));
        Assert.Equal(2, retry.GetProperty("artifactCount").GetInt32());
        await using var verification = f.Db();
        Assert.Equal(1, await verification.DossierWorkflowRecords.CountAsync(x => x.Kind == "equalization"));
    }

    [Fact]
    public async Task ConcurrentRequests_CommitOnePackage_AndCountyRequestConstraintIsDurable()
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        var responses = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft))));
        Assert.All(responses, x => Assert.Equal(HttpStatusCode.OK, x.StatusCode));
        var first = await Json(responses[0]); var second = await Json(responses[1]);
        Assert.Equal(first.GetProperty("packageRef").GetString(), second.GetProperty("packageRef").GetString());
        await using var db = f.Db();
        Assert.Equal(1, await db.DossierWorkflowRecords.CountAsync(x => x.Kind == "equalization"));
    }

    [Fact]
    public async Task PersistedSnapshot_CannotBeUpdatedOrDeletedThroughApplicationContext()
    {
        await using var f = await Fixture.Create();
        await Draft(f);
        await using var db = f.Db();
        var row = await db.DossierWorkflowRecords.SingleAsync();
        db.Entry(row).Property(x => x.PayloadJson).CurrentValue = "{}";
        await Assert.ThrowsAsync<InvalidOperationException>(() => db.SaveChangesAsync());
        db.ChangeTracker.Clear();
        db.DossierWorkflowRecords.Remove(await db.DossierWorkflowRecords.SingleAsync());
        Assert.Throws<InvalidOperationException>(() => db.SaveChanges());
    }

    [Fact]
    public async Task AppealPacket_RequiresExplicitRelationship_AndReturnsStoredEvidenceCustody()
    {
        await using var f = await Fixture.Create();
        var appeal = await SeedPacket(f, linked: false);
        var url = $"{Root}/appeals/{appeal}/packet?county={County}&taxYear=2024&parcelId={Parcel}";
        Assert.Equal(HttpStatusCode.NotFound, (await f.Client.GetAsync(url)).StatusCode);
        await using (var db = f.Db())
        {
            var packet = await db.DossierPackets.SingleAsync(); packet.AppealId = appeal; await db.SaveChangesAsync();
        }
        var response = await f.Client.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var packetBody = await Json(response);
        Assert.Equal(County, packetBody.GetProperty("countyId").GetString());
        Assert.Equal(2024, packetBody.GetProperty("taxYear").GetInt32());
        Assert.Single(packetBody.GetProperty("documents").EnumerateArray());
        Assert.Single(packetBody.GetProperty("evidence").EnumerateArray());
        Assert.Single(packetBody.GetProperty("custody").EnumerateArray());
        Assert.Contains("synthetic original custody", packetBody.GetRawText());
        Assert.Equal(HttpStatusCode.NotFound, (await f.Client.GetAsync(url.Replace("2024", "2025"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await f.Client.GetAsync(url.Replace(Parcel, "WRONG-PARCEL"))).StatusCode);
        var brief = await Json(await f.Client.GetAsync($"{Root}/morning-brief?county={County}&taxYear=2024&role=appeals_specialist"));
        Assert.Single(brief.GetProperty("findings").EnumerateArray());
        Assert.Contains(appeal.ToString(), brief.GetRawText());
    }

    [Fact]
    public async Task SourceArtifacts_CountActualRows_AndAuditExcludesValuationAndTraceStores()
    {
        await using var f = await Fixture.Create();
        await SeedPacket(f);
        var draft = await Draft(f);
        Assert.Equal(7, draft.GetProperty("artifactCount").GetInt32());
        var response = await f.Client.PostAsJsonAsync($"{Root}/exports/audit", new { county = County, taxYear = 2024,
            bundleScope = "county", requestId = "audit", confirmed = true, reasonCode = "annual_certification" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await Json(response);
        Assert.Equal(7, summary.GetProperty("artifactCount").GetInt32());
        var content = await f.Client.GetStringAsync(summary.GetProperty("payloadRef").GetString());
        Assert.Contains("synthetic original custody", content);
        Assert.DoesNotContain("ValuationRecords", content);
        Assert.DoesNotContain("AuditLogs", content);
        await using (var db = f.Db())
        {
            var item = await db.DossierPacketItems.SingleAsync(); item.Satisfied = false; await db.SaveChangesAsync();
        }
        Assert.Equal((HttpStatusCode)422, (await f.Client.PostAsJsonAsync($"{Root}/drafts", new { county = County, studyId = Study, requestId = "incomplete" })).StatusCode);
    }

    [Fact]
    public async Task AppealRetrieval_SelectsLatestExplicitPacket_AndIncludesItsStoredItems()
    {
        await using var f = await Fixture.Create();
        var appeal = await SeedPacket(f);
        await using (var db = f.Db())
        {
            db.DossierPackets.Add(new DossierPacket { CountyId = Guid.Parse(County), ParcelId = Parcel, AppealId = appeal,
                TaxYear = 2024, PacketType = "synthetic-evidence-packet", Name = "Older incomplete packet", CreatedAt = new DateTime(2020, 1, 1) });
            await db.SaveChangesAsync();
        }
        var response = await f.Client.GetAsync($"{Root}/appeals/{appeal}/packet?county={County}&taxYear=2024");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await Json(response);
        Assert.Equal("dddddddd-dddd-dddd-dddd-dddddddddddd", body.GetProperty("packetRef").GetString());
        Assert.Single(body.GetProperty("packet").GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task ExportMetadataAndContent_AreCountyIsolated_AndReadOnlyPermissionCannotExport()
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        var summary = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft)));
        f.Client.DefaultRequestHeaders.Add("Test-County", OtherCounty);
        foreach (var path in new[] { $"{Root}/exports/{summary.GetProperty("packageRef").GetString()}?county={OtherCounty}",
            summary.GetProperty("payloadRef").GetString()!.Replace(County, OtherCounty) })
            Assert.Equal(HttpStatusCode.NotFound, (await f.Client.GetAsync(path)).StatusCode);
        f.Client.DefaultRequestHeaders.Remove("Test-County");
        f.Client.DefaultRequestHeaders.Add("Test-Permissions", "read:dossier,read:dais,access:costforge");
        Assert.Equal(HttpStatusCode.Forbidden, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft, "denied"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await f.Client.GetAsync(summary.GetProperty("payloadRef").GetString())).StatusCode);
    }

    [Fact]
    public async Task Snapshot_CapturesExistingScenarioParameters_WithoutRecomputingThem()
    {
        await using var f = await Fixture.Create();
        await using (var db = f.Db())
        {
            var cohort = new CountyCohort { CountyId = Guid.Parse(County), StudyId = Guid.Parse(Study), Name = "Synthetic cohort", Definition = "{\"parcelIds\":[\"SYNTHETIC-WORKFLOW\"]}" };
            db.CountyCohorts.Add(cohort);
            db.CountyScenarios.Add(new CountyScenario { CountyId = Guid.Parse(County), StudyId = Guid.Parse(Study), CohortId = cohort.CohortId,
                Parameters = "{\"magnitude\":4.25}", Rationale = "Persisted synthetic rationale", ImpactPreviewJson = "{\"stored\":true}" });
            await db.SaveChangesAsync();
        }
        var draft = await Draft(f);
        Assert.Equal(4, draft.GetProperty("artifactCount").GetInt32());
        var body = await Json(await f.Client.GetAsync($"{Root}/drafts/{draft.GetProperty("draftId").GetString()}?county={County}"));
        var scenario = body.GetProperty("artifacts").EnumerateArray().Single(x => x.GetProperty("name").GetString()!.StartsWith("CountyScenarios/", StringComparison.Ordinal));
        Assert.Equal("{\"magnitude\":4.25}", scenario.GetProperty("content").GetProperty("record").GetProperty("parameters").GetString());
        Assert.Equal("{\"stored\":true}", scenario.GetProperty("content").GetProperty("record").GetProperty("impactPreviewJson").GetString());
    }

    [Theory]
    [InlineData("draft-create")]
    [InlineData("draft-read")]
    [InlineData("equalization-create")]
    [InlineData("equalization-retry")]
    [InlineData("export-metadata")]
    [InlineData("export-content")]
    public async Task FullValuationSnapshots_RequireExistingCostForgePermissionEvenAfterRestart(string operation)
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        JsonElement? export = null;
        if (operation is "equalization-retry" or "export-metadata" or "export-content")
            export = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft)));
        await f.Restart();
        f.Client.DefaultRequestHeaders.Add("Test-Permissions", "read:dossier,write:dossier,read:dais");
        HttpResponseMessage response = operation switch
        {
            "draft-create" => await f.Client.PostAsJsonAsync($"{Root}/drafts", new { county = County, studyId = Study, requestId = "denied-draft" }),
            "draft-read" => await f.Client.GetAsync($"{Root}/drafts/{draft.GetProperty("draftId").GetString()}?county={County}"),
            "equalization-create" or "equalization-retry" => await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft)),
            "export-metadata" => await f.Client.GetAsync($"{Root}/exports/{export!.Value.GetProperty("packageRef").GetString()}?county={County}"),
            _ => await f.Client.GetAsync(export!.Value.GetProperty("payloadRef").GetString())
        };
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.DoesNotContain("123456", await response.Content.ReadAsStringAsync());
        await using var db = f.Db();
        Assert.Equal(export.HasValue ? 2 : 1, await db.DossierWorkflowRecords.CountAsync());
    }

    [Fact]
    public async Task CostForgePermission_PreservesExistingCaseInsensitiveClaimSemantics()
    {
        await using var f = await Fixture.Create();
        f.Client.DefaultRequestHeaders.Add("Test-Permissions", "read:dossier,write:dossier,read:dais,ACCESS:COSTFORGE");
        var draft = await Draft(f);
        var export = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft)));
        Assert.Equal(HttpStatusCode.OK, (await f.Client.GetAsync(export.GetProperty("payloadRef").GetString())).StatusCode);
    }

    [Fact]
    public async Task Context_DoesNotBypassStoredValuationArtifactPermissionThroughExportSummaries()
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        Assert.Equal(HttpStatusCode.OK, (await f.Client.PostAsJsonAsync($"{Root}/exports/equalization", ExportRequest(draft))).StatusCode);
        var audit = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/audit", new { county = County, taxYear = 2024,
            bundleScope = "county", requestId = "visible-audit", confirmed = true, reasonCode = "legal_compliance" }));
        f.Client.DefaultRequestHeaders.Add("Test-Permissions", "read:dossier,read:dais");
        var context = await Json(await f.Client.GetAsync($"{Root}/context?county={County}"));
        Assert.Empty(context.GetProperty("drafts").EnumerateArray());
        var visible = Assert.Single(context.GetProperty("exports").EnumerateArray());
        Assert.Equal(audit.GetProperty("packageRef").GetString(), visible.GetProperty("packageRef").GetString());
        Assert.DoesNotContain("ValuationRecords", context.GetRawText());
        Assert.Single(context.GetProperty("studies").EnumerateArray());
    }

    [Fact]
    public async Task AuditWithoutValuations_DoesNotRequireForgePermission()
    {
        await using var f = await Fixture.Create();
        f.Client.DefaultRequestHeaders.Add("Test-Permissions", "read:dossier,write:dossier,read:dais");
        var response = await f.Client.PostAsJsonAsync($"{Root}/exports/audit", new { county = County, taxYear = 2024,
            bundleScope = "county", requestId = "audit-no-forge", confirmed = true, reasonCode = "legal_compliance" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await Json(response);
        await f.Restart();
        f.Client.DefaultRequestHeaders.Add("Test-Permissions", "read:dossier,read:dais");
        Assert.Equal(HttpStatusCode.OK, (await f.Client.GetAsync($"{Root}/exports/{summary.GetProperty("packageRef").GetString()}?county={County}")).StatusCode);
        var content = await f.Client.GetStringAsync(summary.GetProperty("payloadRef").GetString());
        Assert.DoesNotContain("ValuationRecords", content);
    }

    [Theory]
    [InlineData("equalization", "OWNER_REVIEW")]
    [InlineData("equalization", "legal_compliance")]
    [InlineData("equalization", "ANNUAL_CERTIFICATION")]
    [InlineData("equalization", "annual_certification ")]
    [InlineData("audit", "OWNER_REVIEW")]
    [InlineData("audit", "LEGAL_COMPLIANCE")]
    [InlineData("audit", " legal_compliance")]
    [InlineData("audit", "")]
    public async Task ExportReason_RejectsUnsupportedOperationReasonBeforeAnyExportWrite(string operation, string reason)
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        object request = operation == "equalization" ? ExportRequest(draft, reason: reason) : new
            { county = County, taxYear = 2024, bundleScope = "county", requestId = "invalid-audit", confirmed = true, reasonCode = reason };
        Assert.Equal(HttpStatusCode.BadRequest, (await f.Client.PostAsJsonAsync($"{Root}/exports/{operation}", request)).StatusCode);
        await using var db = f.Db();
        Assert.Empty(await db.DossierWorkflowRecords.Where(x => x.Kind != "assessment-draft").ToListAsync());
    }

    [Theory]
    [InlineData("equalization", "annual_certification")]
    [InlineData("equalization", "board_directive")]
    [InlineData("audit", "annual_certification")]
    [InlineData("audit", "board_directive")]
    [InlineData("audit", "legal_compliance")]
    public async Task ExportReason_AcceptsExistingManifestReasons(string operation, string reason)
    {
        await using var f = await Fixture.Create();
        var draft = await Draft(f);
        object request = operation == "equalization" ? ExportRequest(draft, reason: reason) : new
            { county = County, taxYear = 2024, bundleScope = "county", requestId = "valid-audit", confirmed = true, reasonCode = reason };
        var response = await f.Client.PostAsJsonAsync($"{Root}/exports/{operation}", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await Json(response);
        var content = await Json(await f.Client.GetAsync(summary.GetProperty("payloadRef").GetString()));
        Assert.Equal(reason, content.GetProperty("reasonCode").GetString());
    }

    [Fact]
    public async Task CohortSnapshot_DraftAndCountyAuditPreserveDefinitionAndProvenanceAfterChangeAndRestart()
    {
        await using var f = await Fixture.Create();
        var cohortId = Guid.NewGuid();
        const string original = "{\"parcelIds\":[\"SYNTHETIC-WORKFLOW\"],\"ruleExpression\":\"stored cohort rule\"}";
        await using (var db = f.Db())
        {
            db.CountyCohorts.Add(new CountyCohort { CohortId = cohortId, CountyId = Guid.Parse(County), StudyId = Guid.Parse(Study), Name = "Stored cohort", Definition = original, ParcelCount = 1 });
            for (var i = 0; i < 2; i++)
                db.CountyScenarios.Add(new CountyScenario { CountyId = Guid.Parse(County), StudyId = Guid.Parse(Study), CohortId = cohortId, Parameters = "{\"magnitude\":4.25}", Rationale = "Stored rationale" });
            await db.SaveChangesAsync();
        }
        var draft = await Draft(f);
        var draftUrl = $"{Root}/drafts/{draft.GetProperty("draftId").GetString()}?county={County}";
        Assert.Equal(5, draft.GetProperty("artifactCount").GetInt32()); // study, valuation, two scenarios, one shared cohort
        var savedDraft = await f.Client.GetStringAsync(draftUrl);
        var audit = await Json(await f.Client.PostAsJsonAsync($"{Root}/exports/audit", new { county = County, taxYear = 2024,
            bundleScope = "county", requestId = "cohort-audit", confirmed = true, reasonCode = "legal_compliance" }));
        Assert.Equal(4, audit.GetProperty("artifactCount").GetInt32());
        var auditUrl = audit.GetProperty("payloadRef").GetString()!;
        var savedAudit = await f.Client.GetStringAsync(auditUrl);
        await using (var db = f.Db())
        {
            var cohort = await db.CountyCohorts.SingleAsync();
            cohort.Definition = "{\"changed\":true}"; cohort.ParcelCount = 99;
            await db.SaveChangesAsync();
        }
        await f.Restart();
        Assert.Equal(savedDraft, await f.Client.GetStringAsync(draftUrl));
        Assert.Equal(savedAudit, await f.Client.GetStringAsync(auditUrl));
        foreach (var json in new[] { savedDraft, savedAudit })
        {
            var artifacts = JsonDocument.Parse(json).RootElement.GetProperty("artifacts");
            var captured = Assert.Single(artifacts.EnumerateArray().Where(x => x.GetProperty("name").GetString()!.StartsWith("CountyCohorts/", StringComparison.Ordinal)));
            Assert.Equal(cohortId.ToString("D"), captured.GetProperty("sourceId").GetString());
            var content = captured.GetProperty("content");
            Assert.Equal(County, content.GetProperty("countyId").GetString());
            Assert.Equal(Study, content.GetProperty("record").GetProperty("studyId").GetString());
            Assert.Equal(original, content.GetProperty("record").GetProperty("definition").GetString());
            Assert.Equal(1, content.GetProperty("record").GetProperty("parcelCount").GetInt32());
            var computed = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content.GetRawText()))).ToLowerInvariant();
            Assert.True(computed == captured.GetProperty("sha256").GetString(), $"Returned artifact bytes do not match SHA: {content.GetRawText()}");
        }
    }

    [Theory]
    [InlineData("foreign-cohort")]
    [InlineData("wrong-study")]
    [InlineData("missing-cohort")]
    [InlineData("foreign-scenario")]
    public async Task CohortSnapshot_RejectsBrokenCountyStudyCohortReferencesWithoutWriting(string broken)
    {
        await using var f = await Fixture.Create();
        var cohortId = Guid.NewGuid();
        await using (var db = f.Db())
        {
            var otherStudy = Guid.NewGuid();
            db.CountyStudySessions.Add(new CountyStudySession { StudyId = otherStudy, CountyId = Guid.Parse(County), CountyName = "Synthetic County", TaxYear = 2023 });
            db.CountyCohorts.Add(new CountyCohort { CohortId = cohortId, CountyId = Guid.Parse(broken == "foreign-cohort" ? OtherCounty : County),
                StudyId = broken == "wrong-study" ? otherStudy : Guid.Parse(Study), Name = "Invalid reference fixture", Definition = "{}" });
            db.CountyScenarios.Add(new CountyScenario { CountyId = Guid.Parse(broken == "foreign-scenario" ? OtherCounty : County),
                StudyId = Guid.Parse(Study), CohortId = cohortId, Rationale = "Invalid reference fixture" });
            await db.SaveChangesAsync();
            if (broken == "missing-cohort")
            {
                // Simulate legacy/import corruption, not a production path for bypassing constraints.
                await db.Database.OpenConnectionAsync();
                await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys=OFF;");
                await db.Database.ExecuteSqlRawAsync("DELETE FROM CountyCohorts;");
                await db.Database.CloseConnectionAsync();
            }
        }
        Assert.Equal((HttpStatusCode)422, (await f.Client.PostAsJsonAsync($"{Root}/drafts", new { county = County, studyId = Study, requestId = "bad-cohort-draft" })).StatusCode);
        Assert.Equal((HttpStatusCode)422, (await f.Client.PostAsJsonAsync($"{Root}/exports/audit", new { county = County, taxYear = 2024,
            bundleScope = "county", requestId = "bad-cohort-audit", confirmed = true, reasonCode = "legal_compliance" })).StatusCode);
        await using var verify = f.Db();
        Assert.Empty(await verify.DossierWorkflowRecords.ToListAsync());
    }

    private static async Task<Guid> SeedPacket(Fixture f, bool linked = true, bool fullTemplate = false)
    {
        await using var db = f.Db();
        var appeal = new Appeal { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), CountyId = Guid.Parse(County), ParcelId = Parcel, TaxYear = 2024, Status = "filed", AppealGround = "MARKET_VALUE" };
        db.Appeals.Add(appeal);
        var document = new DossierDocument { Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), CountyId = Guid.Parse(County), ParcelId = Parcel, Name = "Synthetic recorded document", DocumentType = "appraisal", ContentHash = new string('b', 64), UploadedBy = "synthetic-user" };
        db.DossierDocuments.Add(document);
        var documents = new List<DossierDocument> { document };
        if (fullTemplate)
            foreach (var type in new[] { "comparable_analysis", "photo", "inspection_report", "correspondence", "report" })
            {
                var additional = new DossierDocument { CountyId = Guid.Parse(County), ParcelId = Parcel, Name = $"Synthetic {type} record",
                    DocumentType = type, ContentHash = new string('b', 64), UploadedBy = "synthetic-user" };
                db.DossierDocuments.Add(additional); documents.Add(additional);
            }
        var packet = new DossierPacket { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), CountyId = Guid.Parse(County), ParcelId = Parcel, TaxYear = 2024,
            AppealId = linked ? appeal.Id : null, PacketType = fullTemplate ? "boe-appeal-defense" : "synthetic-evidence-packet", Name = "Synthetic recorded packet", Status = "complete", TotalRequired = documents.Count, SatisfiedCount = documents.Count, CompletenessPercent = 100 };
        foreach (var doc in documents)
            packet.Items.Add(new DossierPacketItem { DocumentId = doc.Id, DocumentType = doc.DocumentType, Required = true, Satisfied = true });
        db.DossierPackets.Add(packet);
        var evidence = new DossierEvidence { Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"), CountyId = Guid.Parse(County), ParcelId = Parcel, DocumentId = document.Id, Title = "Synthetic recorded evidence", EvidenceType = "legal-document" };
        db.DossierEvidenceItems.Add(evidence);
        db.DossierCustodyEvents.Add(new DossierCustodyEvent { CountyId = Guid.Parse(County), EvidenceId = evidence.Id, Action = "created", Actor = "synthetic-user", Notes = "synthetic original custody" });
        await db.SaveChangesAsync();
        return appeal.Id;
    }

    [CountyWorkflowBootstrapFact]
    public async Task BootstrapDisposableCountyWorkflowJourney_CreatesControlledRecordsOnlyInFreshDatabase()
    {
        // Optional agent-owned browser proof output. Reuses the existing R1Week5 bootstrap's
        // GenerateCreateScript approach, with a pre-open guard instead of EnsureDeleted.
        var path = Environment.GetEnvironmentVariable("OS_COUNTY_CONTEXT_DATABASE_PATH");
        await using var f = await Fixture.Create(path);
        var appealId = await SeedPacket(f, fullTemplate: true);
        await using (var db = f.Db())
        {
            // A second real study year, deliberately without packets. UI creates all snapshots/exports.
            db.CountyStudySessions.Add(new CountyStudySession
            {
                StudyId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa25"), CountyId = Guid.Parse(County),
                CountyName = "Synthetic County", TaxYear = 2025, BaselineVersion = "stored-baseline-2025", CreatedBy = "synthetic-user"
            });
            db.ValuationRecords.Add(new ValuationRecord
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb25"), CountyId = Guid.Parse(County), ParcelId = Parcel,
                TaxYear = 2025, FinalReconciledValue = 125000m, Notes = "Distinct synthetic persisted 2025 valuation", CreatedBy = "synthetic-user"
            });
            await db.SaveChangesAsync();
        }
        var response = await f.Client.GetAsync($"{Root}/appeals/{appealId}/packet?county={County}&taxYear=2024&parcelId={Parcel}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var context = await Json(await f.Client.GetAsync($"{Root}/context?county={County}"));
        Assert.Equal(new[] { 2024, 2025 }, context.GetProperty("taxYears").EnumerateArray().Select(x => x.GetInt32()).Order().ToArray());
        Assert.Equal(2, context.GetProperty("studies").GetArrayLength());
        Assert.Empty(context.GetProperty("drafts").EnumerateArray());
        Assert.Empty(context.GetProperty("exports").EnumerateArray());
        await using var persisted = f.Db();
        Assert.Empty(await persisted.DossierWorkflowRecords.ToListAsync());
        Assert.Equal(2, await persisted.ValuationRecords.CountAsync());
        // A second bootstrap must refuse the existing file before opening or changing it.
        var bytes = await File.ReadAllBytesAsync(path!);
        await Assert.ThrowsAsync<InvalidOperationException>(() => Fixture.Create(path));
        Assert.Equal(bytes, await File.ReadAllBytesAsync(path!));
    }

    [Theory]
    [InlineData(" 11111111-1111-1111-1111-111111111111 ")]
    [InlineData("{11111111-1111-1111-1111-111111111111}")]
    public async Task ExplicitPacketHandoff_RejectsNonCanonicalCountyClaim(string countyClaim)
    {
        await using var f = await Fixture.Create();
        f.Client.DefaultRequestHeaders.Add("Test-County", countyClaim);
        var response = await f.Client.PostAsJsonAsync("/api/dossier/packets", new
        {
            county = County, parcelId = Parcel, taxYear = 2024, packetType = "boe-appeal-defense"
        });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ExistingPacketCreation_PersistsExplicitAppealAndYear_ThroughDecisionPort()
    {
        await using var f = await Fixture.Create();
        var appeal = await SeedPacket(f, linked: false);
        f.PacketDecision = new ExplicitDossierMutationDecisionPort
        {
            CreatePacket = request =>
            {
                Assert.Equal("synthetic-user", request.ActorId);
                Assert.Equal(County, request.CountyId);
                Assert.Equal(Parcel, request.ParcelId);
                Assert.Equal("boe-appeal-defense", request.Command.Template.PacketType);
                Assert.Equal(6, request.Command.Template.RequiredDocumentTypes.Count);
                Assert.Single(request.Command.CurrentDocuments);
                return ExplicitDossierMutationDecisionPort.Accepted(new DossierCreatePacketMutation
                {
                    PacketId = request.Command.PacketId, Version = 1, PacketType = "boe-appeal-defense", Name = "Suite-governed synthetic packet",
                    Status = DossierPacketStatus.draft, TotalRequired = 6, SatisfiedCount = 0, CompletenessPercent = 0,
                    CreatedAt = request.EffectiveAt, CreatedBy = request.ActorId,
                    Items = [new DossierPacketItemMutation { DocumentType = "report", Required = true, Satisfied = false }]
                });
            }
        };
        await f.Restart();
        var response = await f.Client.PostAsJsonAsync("/api/dossier/packets", new { county = County, parcelId = Parcel,
            packetType = "boe-appeal-defense", taxYear = 2024, appealId = appeal });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        await using var verify = f.Db();
        var stored = await verify.DossierPackets.SingleAsync(x => x.Name == "Suite-governed synthetic packet");
        Assert.Equal(appeal, stored.AppealId);
        Assert.Equal(2024, stored.TaxYear);
        var rejected = await f.Client.PostAsJsonAsync("/api/dossier/packets", new { county = County, parcelId = Parcel,
            packetType = "boe-appeal-defense", taxYear = 2025, appealId = appeal });
        Assert.Equal(HttpStatusCode.NotFound, rejected.StatusCode);
    }

    [Fact]
    public async Task AdditiveMigration_PreservesExistingPacket_AndCreatesRequestUniquenessInSqlite()
    {
        var path = Path.Combine(Path.GetTempPath(), $"tf-workflow-migration-synthetic-{Guid.NewGuid():N}.db");
        Assert.False(File.Exists(path));
        try
        {
            await using var db = new TerraFusionDbContext(new DbContextOptionsBuilder<TerraFusionDbContext>()
                .UseSqlite($"Data Source={path};Pooling=False").Options, new ConfigurationBuilder().Build());
            await db.Database.ExecuteSqlRawAsync("""
                CREATE TABLE Counties (Id TEXT PRIMARY KEY);
                CREATE TABLE CountyStudySessions (StudyId TEXT PRIMARY KEY);
                CREATE TABLE Appeals (Id TEXT PRIMARY KEY);
                CREATE TABLE DossierPackets (Id TEXT PRIMARY KEY, CountyId TEXT NOT NULL, Name TEXT NOT NULL);
                INSERT INTO DossierPackets VALUES ('legacy', 'synthetic', 'Preserve this stored packet');
                """);
            var migration = new TerraFusion.Data.Migrations.CountyContextWorkflowSnapshots { ActiveProvider = db.Database.ProviderName! };
            var generator = db.GetService<IMigrationsSqlGenerator>();
            foreach (var command in generator.Generate(migration.UpOperations, db.Model))
                await db.Database.ExecuteSqlRawAsync(command.CommandText);
            await db.Database.OpenConnectionAsync();
            await using var query = db.Database.GetDbConnection().CreateCommand();
            query.CommandText = "SELECT Name FROM DossierPackets WHERE Id='legacy' AND TaxYear IS NULL AND AppealId IS NULL";
            Assert.Equal("Preserve this stored packet", await query.ExecuteScalarAsync());
            query.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='IX_DossierWorkflowRecords_CountyId_RequestId' AND sql LIKE 'CREATE UNIQUE%'";
            Assert.Equal(1L, await query.ExecuteScalarAsync());
        }
        finally { if (File.Exists(path)) File.Delete(path); }
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly string _path;
        private readonly bool _preserve;
        private WebApplication? _app;
        private Fixture(string? path)
        {
            _preserve = !string.IsNullOrWhiteSpace(path);
            _path = _preserve ? Path.GetFullPath(path!) : Path.Combine(Path.GetTempPath(), $"tf-workflow-synthetic-{Guid.NewGuid():N}.db");
            if (_preserve)
            {
                var repositoryRoot = RepositoryRoot();
                var selectedRoot = Environment.GetEnvironmentVariable("OS_COUNTY_CONTEXT_WORKSPACE_ROOT") ?? repositoryRoot;
                if (!Path.IsPathFullyQualified(selectedRoot) || !SamePath(GitCommonDirectory(selectedRoot), GitCommonDirectory(repositoryRoot)))
                    throw new InvalidOperationException("Explicit browser workspace must be a verified worktree of this repository.");
                var allowed = Path.Combine(Path.GetFullPath(selectedRoot), ".tmp", "county-context");
                if (!Path.IsPathFullyQualified(path!) || !SamePath(Path.GetDirectoryName(_path)!, allowed) ||
                    !Regex.IsMatch(Path.GetFileName(_path), "^workflow-[A-Za-z0-9_-]+\\.db$"))
                    throw new InvalidOperationException("Browser proof output must be a fresh .tmp/county-context/workflow-*.db in a reserved workspace.");
                for (var directory = new DirectoryInfo(Path.GetDirectoryName(_path)!); directory != null; directory = directory.Parent)
                    if (directory.Exists && directory.Attributes.HasFlag(FileAttributes.ReparsePoint))
                        throw new InvalidOperationException("Browser proof output cannot traverse directory links.");
            }
            if (File.Exists(_path)) throw new InvalidOperationException("Synthetic database must be fresh; existing files are never replaced.");
            if (_preserve)
            {
                Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
                using var reservation = new FileStream(_path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            }
        }

        private static bool SamePath(string left, string right) => string.Equals(Path.GetFullPath(left), Path.GetFullPath(right),
            OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal);

        public static string RepositoryRoot()
        {
            for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
                if (File.Exists(Path.Combine(directory.FullName, "CANON_INDEX.md")) &&
                    (File.Exists(Path.Combine(directory.FullName, ".git")) || Directory.Exists(Path.Combine(directory.FullName, ".git"))))
                    return directory.FullName;
            throw new InvalidOperationException("Cannot verify the test assembly's repository root.");
        }

        private static string GitCommonDirectory(string root)
        {
            if (!File.Exists(Path.Combine(root, "CANON_INDEX.md")) ||
                !File.Exists(Path.Combine(root, "backend", "tests", "TerraFusion.Unit.Tests", "TerraFusion.Unit.Tests.csproj")))
                throw new InvalidOperationException("Browser workspace is not this repository.");
            var marker = Path.Combine(root, ".git");
            if (Directory.Exists(marker)) return Path.GetFullPath(marker);
            if (!File.Exists(marker)) throw new InvalidOperationException("Missing Git worktree marker.");
            var pointer = File.ReadAllText(marker).Trim();
            if (!pointer.StartsWith("gitdir: ", StringComparison.Ordinal)) throw new InvalidOperationException("Invalid Git worktree marker.");
            var gitDirectory = Path.GetFullPath(pointer[8..], Path.GetFullPath(root));
            var backLink = Path.Combine(gitDirectory, "gitdir");
            var common = Path.Combine(gitDirectory, "commondir");
            if (!File.Exists(backLink) || !SamePath(Path.GetFullPath(File.ReadAllText(backLink).Trim(), gitDirectory), marker) || !File.Exists(common))
                throw new InvalidOperationException("Git worktree registration does not match the selected workspace.");
            return Path.GetFullPath(File.ReadAllText(common).Trim(), gitDirectory);
        }
        public HttpClient Client { get; private set; } = null!;
        public IDossierMutationDecisionPort? PacketDecision { get; set; }
        public TerraFusionDbContext Db() => new(new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite($"Data Source={_path};Pooling=False").Options, new ConfigurationBuilder().Build());

        public static async Task<Fixture> Create(string? path = null)
        {
            var fixture = new Fixture(path);
            await using (var db = fixture.Db())
            {
                var tables = new HashSet<string> { "Counties", "Properties", "CountyStudySessions", "CountyScenarios", "CountyCohorts",
                    "ValuationRecords", "DossierPackets", "DossierPacketItems", "DossierDocuments", "DossierEvidenceItems",
                    "DossierCustodyEvents", "Appeals", "CertificationSteps", "AuditLogs", "DossierWorkflowRecords" };
                var script = db.Database.GenerateCreateScript();
                var createdTables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (Match statement in Regex.Matches(script, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;"))
                    if ((fixture._preserve || tables.Contains(statement.Groups[1].Value)) && createdTables.Add(statement.Groups[1].Value))
                        await db.Database.ExecuteSqlRawAsync(statement.Value);
                foreach (Match statement in Regex.Matches(script, "CREATE (?:UNIQUE )?INDEX [^;]+;"))
                    if (tables.Any(t => statement.Value.Contains($"ON \"{t}\""))) await db.Database.ExecuteSqlRawAsync(statement.Value);
                db.Counties.AddRange(new County { Id = Guid.Parse(County), Name = "Synthetic County", State = "WA", FipsCode = "99001" },
                    new County { Id = Guid.Parse(OtherCounty), Name = "Synthetic Other", State = "WA", FipsCode = "99002" });
                db.CountyStudySessions.Add(new CountyStudySession { StudyId = Guid.Parse(Study), CountyId = Guid.Parse(County),
                    CountyName = "Synthetic County", TaxYear = 2024, BaselineVersion = "stored-baseline", CreatedBy = "synthetic-user" });
                db.Properties.Add(new Property { CountyId = Guid.Parse(County), ParcelId = Parcel, ParcelNumber = Parcel,
                    PropertyId = Parcel, Address = "Synthetic fixture", PropertyType = "Residential", TaxYear = 2024 });
                db.ValuationRecords.Add(new ValuationRecord { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), CountyId = Guid.Parse(County), ParcelId = Parcel, TaxYear = 2024,
                    FinalReconciledValue = 123456m, Notes = "Actual synthetic persisted valuation", CreatedBy = "synthetic-user" });
                await db.SaveChangesAsync();
            }
            await fixture.Start();
            return fixture;
        }

        public async Task Start()
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions { ContentRootPath = Path.GetTempPath(), EnvironmentName = "Testing" });
            builder.Configuration.Sources.Clear();
            builder.WebHost.UseTestServer();
            builder.Services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
            builder.Services.AddScoped(_ => Db());
            builder.Services.AddDossierMutationRuntime(builder.Configuration, builder.Environment);
            builder.Services.AddSingleton(Mock.Of<ICostForgeService>());
            if (PacketDecision != null) builder.Services.AddSingleton(PacketDecision);
            builder.Services.AddControllers().AddApplicationPart(typeof(DossierController).Assembly);
            builder.Services.AddAuthentication("synthetic").AddScheme<AuthenticationSchemeOptions, SyntheticAuthentication>("synthetic", _ => { });
            builder.Services.AddAuthorization(options =>
            {
                foreach (var permission in new[] { "read:dossier", "write:dossier", "read:dais", "access:costforge" })
                    options.AddPolicy("RequiresPermission_" + permission, p => p.RequireAuthenticatedUser().RequireAssertion(context =>
                        context.User.Claims.Any(c => c.Type == "perm" && string.Equals(c.Value, permission, StringComparison.OrdinalIgnoreCase))));
            });
            _app = builder.Build();
            _app.UseAuthentication();
            _app.UseAuthorization();
            _app.MapControllers();
            await _app.StartAsync();
            Client = _app.GetTestClient();
        }

        public async Task Restart()
        {
            Client.Dispose();
            await _app!.DisposeAsync();
            await Start();
        }

        public async ValueTask DisposeAsync()
        {
            Client?.Dispose();
            if (_app != null) await _app.DisposeAsync();
            if (!_preserve && File.Exists(_path)) File.Delete(_path);
        }
    }

    private sealed class SyntheticAuthentication : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public SyntheticAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
            : base(options, logger, encoder) { }
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (Request.Headers.ContainsKey("Test-Anonymous")) return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new List<Claim> { new("countyId", Request.Headers["Test-County"].FirstOrDefault() ?? County) };
            if (!Request.Headers.ContainsKey("Test-No-User")) claims.Add(new(ClaimTypes.NameIdentifier, "synthetic-user"));
            foreach (var permission in (Request.Headers["Test-Permissions"].FirstOrDefault() ?? "read:dossier,write:dossier,read:dais,access:costforge").Split(','))
                claims.Add(new("perm", permission));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, "synthetic")), "synthetic")));
        }
    }

    public sealed class CountyWorkflowBootstrapFactAttribute : FactAttribute
    {
        public CountyWorkflowBootstrapFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("OS_COUNTY_CONTEXT_DATABASE_PATH")))
                Skip = "Requires explicit OS_COUNTY_CONTEXT_DATABASE_PATH for the isolated browser fixture.";
        }
    }
}
