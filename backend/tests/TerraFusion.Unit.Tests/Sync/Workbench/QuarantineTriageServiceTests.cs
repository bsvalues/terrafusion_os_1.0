using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.Workbench;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Workbench;

/// <summary>
/// SYNC-WORKBENCH-F unit tests for <see cref="QuarantineTriageService"/>.
///
/// <para>Uses an in-memory <see cref="TerraFusionDbContext"/> per
/// test (mirrors the F2 <c>SalesReviewReaderTests</c> fixture
/// pattern). The triage table's unique index on
/// <c>UnprovenRowId</c> is honored by the in-memory provider so
/// idempotency / conflict semantics surface in tests as they would
/// in production.</para>
/// </summary>
public sealed class QuarantineTriageServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public QuarantineTriageServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"workbench-f-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private QuarantineTriageService Build() => new(_db);

    private async Task<Guid> SeedQuarantineAsync(
        string reason = "UNKNOWN_I_ATTR_VAL_CD",
        string? universe = UniverseCodes.RealResidential,
        int propId = 12345,
        string code = "ZZZ",
        DateTime? createdAt = null)
    {
        var id = Guid.NewGuid();
        _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
        {
            UnprovenRowId = id,
            PropValYr = 2025,
            SupNum = 0,
            PropId = propId,
            ImprvId = 100,
            ImprvDetId = 200,
            IAttrValId = 300,
            IAttrValCd = code,
            QuarantineReason = reason,
            UniverseCode = universe,
            LandingLoadBatchId = Guid.NewGuid(),
            CreatedAt = createdAt ?? DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
        return id;
    }

    // ─────────────────────────────────────────────────────────────────
    // List
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task List_ReturnsUntriagedRowsAsOpen()
    {
        var id = await SeedQuarantineAsync();
        var result = await Build().ListAsync(
            new QuarantineListRequest(null, null, null, 100, 0));

        result.Outcome.Should().Be(TriageOutcome.Ok);
        result.Items.Should().ContainSingle();
        var row = result.Items.Single();
        row.UnprovenRowId.Should().Be(id);
        row.TriageStatus.Should().Be(TriageStatuses.Open);
    }

    [Fact]
    public async Task List_FiltersByReason()
    {
        await SeedQuarantineAsync(reason: "UNKNOWN_I_ATTR_VAL_CD");
        await SeedQuarantineAsync(reason: "OTHER_REASON");

        var result = await Build().ListAsync(
            new QuarantineListRequest("UNKNOWN_I_ATTR_VAL_CD", null, null, 100, 0));

        result.Items.Should().ContainSingle()
            .Which.QuarantineReason.Should().Be("UNKNOWN_I_ATTR_VAL_CD");
    }

    [Fact]
    public async Task List_FiltersByUniverse()
    {
        await SeedQuarantineAsync(universe: UniverseCodes.RealResidential);
        await SeedQuarantineAsync(universe: UniverseCodes.AgCurrentUse);

        var result = await Build().ListAsync(
            new QuarantineListRequest(null, UniverseCodes.AgCurrentUse, null, 100, 0));

        result.Items.Should().ContainSingle()
            .Which.UniverseCode.Should().Be(UniverseCodes.AgCurrentUse);
    }

    [Fact]
    public async Task List_FiltersByPropId()
    {
        await SeedQuarantineAsync(propId: 1001);
        await SeedQuarantineAsync(propId: 2002);

        var result = await Build().ListAsync(
            new QuarantineListRequest(null, null, 2002, 100, 0));

        result.Items.Should().ContainSingle()
            .Which.PropId.Should().Be(2002);
    }

    [Fact]
    public async Task List_RespectsPaging()
    {
        for (int i = 0; i < 5; i++)
            await SeedQuarantineAsync(propId: 9000 + i,
                createdAt: DateTime.UtcNow.AddSeconds(-i));

        var page1 = await Build().ListAsync(
            new QuarantineListRequest(null, null, null, 2, 0));
        var page2 = await Build().ListAsync(
            new QuarantineListRequest(null, null, null, 2, 2));

        page1.Items.Count.Should().Be(2);
        page2.Items.Count.Should().Be(2);
        page1.Items[0].PropId.Should().NotBe(page2.Items[0].PropId);
    }

    [Fact]
    public async Task List_ReportsRoutedStatusForRoutedRows()
    {
        var id = await SeedQuarantineAsync();
        await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealResidential, "ROOF_TYPE", "noted"));

        var result = await Build().ListAsync(
            new QuarantineListRequest(null, null, null, 100, 0));

        result.Items.Single().TriageStatus.Should().Be(TriageStatuses.Routed);
    }

    [Fact]
    public async Task List_ReportsDismissedStatusForDismissedRows()
    {
        var id = await SeedQuarantineAsync();
        await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.IntentionalNoise, null));

        var result = await Build().ListAsync(
            new QuarantineListRequest(null, null, null, 100, 0));

        result.Items.Single().TriageStatus.Should().Be(TriageStatuses.Dismissed);
    }

    [Fact]
    public async Task List_SuggestedReroute_EchoesUniverseCode()
    {
        await SeedQuarantineAsync(universe: UniverseCodes.MobileHome);

        var result = await Build().ListAsync(
            new QuarantineListRequest(null, null, null, 100, 0));

        result.Items.Single().SuggestedReroute.Should().Be(UniverseCodes.MobileHome);
    }

    // ─────────────────────────────────────────────────────────────────
    // Route
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Route_HappyPath_CreatesRoutedRow()
    {
        var id = await SeedQuarantineAsync();
        var result = await Build().RouteAsync(id,
            new RouteRequest(UniverseCodes.RealCommercial, "WALL_TYPE", "ok"));

        result.Outcome.Should().Be(TriageOutcome.Ok);
        result.Payload.Should().NotBeNull();
        result.Payload!.Status.Should().Be(TriageStatuses.Routed);
        result.Payload.RoutedToUniverse.Should().Be(UniverseCodes.RealCommercial);
        result.Payload.RoutedToIAttrValCd.Should().Be("WALL_TYPE");
    }

    [Fact]
    public async Task Route_UnknownUniverse_ReturnsInvalidInput()
    {
        var id = await SeedQuarantineAsync();
        var result = await Build().RouteAsync(id,
            new RouteRequest("NOT_A_UNIVERSE", null, null));

        result.Outcome.Should().Be(TriageOutcome.InvalidInput);
        result.Payload.Should().BeNull();
    }

    [Fact]
    public async Task Route_UnknownId_ReturnsNotFound()
    {
        var result = await Build().RouteAsync(Guid.NewGuid(),
            new RouteRequest(UniverseCodes.RealResidential, null, null));

        result.Outcome.Should().Be(TriageOutcome.NotFound);
    }

    [Fact]
    public async Task Route_SameTargetIdempotent_ReturnsOk()
    {
        var id = await SeedQuarantineAsync();
        await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealResidential, "X", "first"));

        var result = await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealResidential, "X", "second"));

        result.Outcome.Should().Be(TriageOutcome.Ok);
        result.Payload!.RoutedToUniverse.Should().Be(UniverseCodes.RealResidential);
    }

    [Fact]
    public async Task Route_DifferentTarget_ReturnsConflict()
    {
        var id = await SeedQuarantineAsync();
        await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealResidential, "X", null));

        var result = await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealCommercial, "Y", null));

        result.Outcome.Should().Be(TriageOutcome.Conflict);
    }

    [Fact]
    public async Task Route_AfterDismissal_ReturnsConflict()
    {
        var id = await SeedQuarantineAsync();
        await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.IntentionalNoise, null));

        var result = await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealResidential, null, null));

        result.Outcome.Should().Be(TriageOutcome.Conflict);
    }

    // ─────────────────────────────────────────────────────────────────
    // Dismiss
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Dismiss_HappyPath_CreatesDismissedRow()
    {
        var id = await SeedQuarantineAsync();
        var result = await Build().DismissAsync(id,
            new DismissRequest(TriageDismissalReasons.LegitimateMissing, "expected"));

        result.Outcome.Should().Be(TriageOutcome.Ok);
        result.Payload!.Status.Should().Be(TriageStatuses.Dismissed);
        result.Payload.DismissalReason.Should().Be(TriageDismissalReasons.LegitimateMissing);
    }

    [Fact]
    public async Task Dismiss_InvalidReason_ReturnsInvalidInput()
    {
        var id = await SeedQuarantineAsync();
        var result = await Build().DismissAsync(id,
            new DismissRequest("NotAReason", null));

        result.Outcome.Should().Be(TriageOutcome.InvalidInput);
    }

    [Fact]
    public async Task Dismiss_UnknownId_ReturnsNotFound()
    {
        var result = await Build().DismissAsync(Guid.NewGuid(),
            new DismissRequest(TriageDismissalReasons.IntentionalNoise, null));

        result.Outcome.Should().Be(TriageOutcome.NotFound);
    }

    [Fact]
    public async Task Dismiss_SameReasonIdempotent_ReturnsOk()
    {
        var id = await SeedQuarantineAsync();
        await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.ConversionArtifact, "first"));

        var result = await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.ConversionArtifact, "second"));

        result.Outcome.Should().Be(TriageOutcome.Ok);
        result.Payload!.DismissalReason.Should().Be(TriageDismissalReasons.ConversionArtifact);
    }

    [Fact]
    public async Task Dismiss_DifferentReason_ReturnsConflict()
    {
        var id = await SeedQuarantineAsync();
        await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.IntentionalNoise, null));

        var result = await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.LegitimateMissing, null));

        result.Outcome.Should().Be(TriageOutcome.Conflict);
    }

    [Fact]
    public async Task Dismiss_AfterRouting_ReturnsConflict()
    {
        var id = await SeedQuarantineAsync();
        await Build().RouteAsync(id, new RouteRequest(
            UniverseCodes.RealResidential, null, null));

        var result = await Build().DismissAsync(id, new DismissRequest(
            TriageDismissalReasons.IntentionalNoise, null));

        result.Outcome.Should().Be(TriageOutcome.Conflict);
    }
}
