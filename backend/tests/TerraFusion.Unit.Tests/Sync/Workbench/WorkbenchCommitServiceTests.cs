using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.Workbench;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G unit tests for <see cref="WorkbenchCommitService"/>.
///
/// <para>Mirrors the F2 / WORKBENCH-F in-memory DbContext fixture
/// pattern. The in-memory provider does not support relational
/// transactions, so the service guards <c>BeginTransactionAsync</c>
/// with an <c>IsRelational()</c> check; happy-path semantics still
/// surface in tests.</para>
/// </summary>
public sealed class WorkbenchCommitServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public WorkbenchCommitServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"workbench-g-{Guid.NewGuid():N}")
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

    private WorkbenchCommitService Build() => new(_db);

    // ── Seeders ──────────────────────────────────────────────────────

    private async Task<Guid> SeedRoutedTriageAsync(
        string targetUniverse = UniverseCodes.RealResidential,
        string? targetCode = "ABC")
    {
        var unprovenId = Guid.NewGuid();
        var triageId = Guid.NewGuid();
        var nowUtc = DateTime.UtcNow;

        _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
        {
            UnprovenRowId = unprovenId,
            PropValYr = 2025,
            SupNum = 0,
            PropId = 12345,
            ImprvId = 100,
            ImprvDetId = 200,
            IAttrValId = 300,
            IAttrValCd = "ZZZ",
            QuarantineReason = "UNKNOWN_I_ATTR_VAL_CD",
            UniverseCode = UniverseCodes.RealResidential,
            LandingLoadBatchId = Guid.NewGuid(),
            CreatedAt = nowUtc,
        });

        _db.UnprovenImprvAttrTriages.Add(new UnprovenImprvAttrTriage
        {
            TriageId = triageId,
            UnprovenRowId = unprovenId,
            Status = TriageStatuses.Routed,
            RoutedToUniverse = targetUniverse,
            RoutedToIAttrValCd = targetCode,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        });

        await _db.SaveChangesAsync();
        return triageId;
    }

    private async Task<Guid> SeedDismissedTriageAsync(
        string reason = TriageDismissalReasons.IntentionalNoise)
    {
        var unprovenId = Guid.NewGuid();
        var triageId = Guid.NewGuid();
        var nowUtc = DateTime.UtcNow;

        _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
        {
            UnprovenRowId = unprovenId,
            PropValYr = 2025,
            SupNum = 0,
            PropId = 67890,
            ImprvId = 101,
            ImprvDetId = 201,
            IAttrValId = 301,
            IAttrValCd = "WWW",
            QuarantineReason = "UNKNOWN_I_ATTR_VAL_CD",
            UniverseCode = UniverseCodes.RealResidential,
            LandingLoadBatchId = Guid.NewGuid(),
            CreatedAt = nowUtc,
        });

        _db.UnprovenImprvAttrTriages.Add(new UnprovenImprvAttrTriage
        {
            TriageId = triageId,
            UnprovenRowId = unprovenId,
            Status = TriageStatuses.Dismissed,
            DismissalReason = reason,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        });

        await _db.SaveChangesAsync();
        return triageId;
    }

    private async Task SeedOpenTriageAsync()
    {
        var unprovenId = Guid.NewGuid();
        var triageId = Guid.NewGuid();
        var nowUtc = DateTime.UtcNow;

        _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
        {
            UnprovenRowId = unprovenId,
            PropValYr = 2025,
            SupNum = 0,
            PropId = 9999,
            ImprvId = 102,
            ImprvDetId = 202,
            IAttrValId = 302,
            IAttrValCd = "OPN",
            QuarantineReason = "UNKNOWN_I_ATTR_VAL_CD",
            UniverseCode = UniverseCodes.RealResidential,
            LandingLoadBatchId = Guid.NewGuid(),
            CreatedAt = nowUtc,
        });

        _db.UnprovenImprvAttrTriages.Add(new UnprovenImprvAttrTriage
        {
            TriageId = triageId,
            UnprovenRowId = unprovenId,
            Status = TriageStatuses.Open,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        });

        await _db.SaveChangesAsync();
    }

    private async Task SeedTruthPacsImprvAsync(string universeCode)
    {
        var nowUtc = DateTime.UtcNow;
        _db.TruthPacsImprvCurrents.Add(new TruthPacsImprvCurrent
        {
            TruthImprvId = Guid.NewGuid(),
            PropValYr = 2025,
            SupNum = 0,
            PropId = (int)Random.Shared.NextInt64(1, int.MaxValue),
            ImprvId = Random.Shared.NextInt64(1, long.MaxValue),
            UniverseCode = universeCode,
            SourceImprvLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            ImprvLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
            PromotedAt = nowUtc,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedTfSaleAsync(bool dorQ, bool countyQ)
    {
        var nowUtc = DateTime.UtcNow;
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            CountyId = Guid.NewGuid(),
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = Random.Shared.NextInt64(1, long.MaxValue),
            DorRatioQualified = dorQ,
            CountyRatioQualified = countyQ,
            PromotionLoadBatchId = Guid.NewGuid(),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        });
        await _db.SaveChangesAsync();
    }

    private static CommitRequest MakeRequest(string? key = null) =>
        new(
            IdempotencyKey: key ?? $"key-{Guid.NewGuid():N}",
            OperatorId: "tester@benton",
            CommitNote: "test commit");

    // ─────────────────────────────────────────────────────────────────
    // Commit
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Commit_HappyPath_3Routed_2Dismissed_LinksAllFive()
    {
        for (var i = 0; i < 3; i++) await SeedRoutedTriageAsync();
        for (var i = 0; i < 2; i++) await SeedDismissedTriageAsync();

        var result = await Build().CommitAsync(MakeRequest());

        result.Outcome.Should().Be(CommitOutcome.Ok);
        result.Payload!.Status.Should().Be(CommitStatuses.Created);
        result.Payload.RoutedDecisionsApplied.Should().Be(3);
        result.Payload.DismissedDecisionsApplied.Should().Be(2);

        var links = await _db.WorkbenchCommitDecisionLinks
            .AsNoTracking()
            .Where(l => l.CommitId == result.Payload.CommitId)
            .ToListAsync();
        links.Should().HaveCount(5);
        links.Count(l => l.DecisionType == DecisionTypes.Route).Should().Be(3);
        links.Count(l => l.DecisionType == DecisionTypes.Dismiss).Should().Be(2);
    }

    [Fact]
    public async Task Commit_SameIdempotencyKey_ReturnsExistingCommitWithIdempotentStatus()
    {
        await SeedRoutedTriageAsync();
        var key = $"idem-{Guid.NewGuid():N}";

        var first = await Build().CommitAsync(MakeRequest(key));
        first.Outcome.Should().Be(CommitOutcome.Ok);
        first.Payload!.Status.Should().Be(CommitStatuses.Created);
        var firstCommitId = first.Payload.CommitId;

        var second = await Build().CommitAsync(MakeRequest(key));
        second.Outcome.Should().Be(CommitOutcome.Ok);
        second.Payload!.Status.Should().Be(CommitStatuses.Idempotent);
        second.Payload.CommitId.Should().Be(firstCommitId);

        // Only one commit row + one link row.
        (await _db.WorkbenchCommits.CountAsync()).Should().Be(1);
        (await _db.WorkbenchCommitDecisionLinks.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Commit_NoPendingDecisions_Returns409Conflict()
    {
        var result = await Build().CommitAsync(MakeRequest());

        result.Outcome.Should().Be(CommitOutcome.Conflict);
        result.Payload.Should().BeNull();
    }

    [Fact]
    public async Task Commit_OnlyOpenTriageRowsPresent_Returns409Conflict()
    {
        await SeedOpenTriageAsync();
        await SeedOpenTriageAsync();

        var result = await Build().CommitAsync(MakeRequest());

        result.Outcome.Should().Be(CommitOutcome.Conflict);
    }

    [Fact]
    public async Task Commit_MixedOpenRoutedDismissed_OnlyRoutedAndDismissedAreCommitted_OpenUntouched()
    {
        await SeedOpenTriageAsync();
        await SeedRoutedTriageAsync();
        await SeedDismissedTriageAsync();

        var result = await Build().CommitAsync(MakeRequest());

        result.Outcome.Should().Be(CommitOutcome.Ok);
        result.Payload!.RoutedDecisionsApplied.Should().Be(1);
        result.Payload.DismissedDecisionsApplied.Should().Be(1);

        // Open row remains in Open status, untouched.
        var stillOpen = await _db.UnprovenImprvAttrTriages
            .AsNoTracking()
            .CountAsync(t => t.Status == TriageStatuses.Open);
        stillOpen.Should().Be(1);
    }

    [Fact]
    public async Task Commit_AlreadyLinkedTriageRow_NotReprocessedOnSecondCommit()
    {
        await SeedRoutedTriageAsync();
        var first = await Build().CommitAsync(MakeRequest());
        first.Outcome.Should().Be(CommitOutcome.Ok);

        // Second commit attempt with no NEW pending rows → 409.
        var second = await Build().CommitAsync(MakeRequest());
        second.Outcome.Should().Be(CommitOutcome.Conflict);

        (await _db.WorkbenchCommits.CountAsync()).Should().Be(1);
        (await _db.WorkbenchCommitDecisionLinks.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Commit_UniverseSnapshot_HasAllSevenUniversesWithZeroFill()
    {
        await SeedRoutedTriageAsync();
        // Only seed two universes — the other five should appear as 0.
        await SeedTruthPacsImprvAsync(UniverseCodes.RealResidential);
        await SeedTruthPacsImprvAsync(UniverseCodes.RealResidential);
        await SeedTruthPacsImprvAsync(UniverseCodes.AgCurrentUse);

        var result = await Build().CommitAsync(MakeRequest());
        result.Outcome.Should().Be(CommitOutcome.Ok);

        var json = result.Payload!.UniverseDistributionJson;

        json.Should().Contain($"\"{UniverseCodes.RealResidential}\":2");
        json.Should().Contain($"\"{UniverseCodes.AgCurrentUse}\":1");
        json.Should().Contain($"\"{UniverseCodes.RealCommercial}\":0");
        json.Should().Contain($"\"{UniverseCodes.MobileHome}\":0");
        json.Should().Contain($"\"{UniverseCodes.PersonalProperty}\":0");
        json.Should().Contain($"\"{UniverseCodes.ConversionLegacy}\":0");
        json.Should().Contain($"\"{UniverseCodes.Unknown}\":0");
    }

    [Fact]
    public async Task Commit_RatioSnapshot_HasFourCellsWithZeroFill()
    {
        await SeedRoutedTriageAsync();
        // Seed only DorQ_CountyQ — the other three cells should be 0.
        await SeedTfSaleAsync(dorQ: true, countyQ: true);
        await SeedTfSaleAsync(dorQ: true, countyQ: true);

        var result = await Build().CommitAsync(MakeRequest());
        result.Outcome.Should().Be(CommitOutcome.Ok);

        var json = result.Payload!.RatioDistributionJson;
        json.Should().Contain($"\"{RatioDistributionCells.DorQ_CountyQ}\":2");
        json.Should().Contain($"\"{RatioDistributionCells.DorQ_CountyN}\":0");
        json.Should().Contain($"\"{RatioDistributionCells.DorN_CountyQ}\":0");
        json.Should().Contain($"\"{RatioDistributionCells.DorN_CountyN}\":0");
    }

    [Fact]
    public async Task Commit_EmptyTruthPacsImprvCurrent_ProducesAllZeroUniverseSnapshot()
    {
        await SeedRoutedTriageAsync();

        var result = await Build().CommitAsync(MakeRequest());
        result.Outcome.Should().Be(CommitOutcome.Ok);

        var json = result.Payload!.UniverseDistributionJson;
        json.Should().Contain($"\"{UniverseCodes.Unknown}\":0");
        json.Should().Contain($"\"{UniverseCodes.RealResidential}\":0");
        json.Should().Contain($"\"{UniverseCodes.AgCurrentUse}\":0");
    }

    [Fact]
    public async Task Commit_EmptyTfSale_ProducesAllZeroRatioSnapshot()
    {
        await SeedRoutedTriageAsync();

        var result = await Build().CommitAsync(MakeRequest());
        result.Outcome.Should().Be(CommitOutcome.Ok);

        var json = result.Payload!.RatioDistributionJson;
        json.Should().Contain($"\"{RatioDistributionCells.DorQ_CountyQ}\":0");
        json.Should().Contain($"\"{RatioDistributionCells.DorQ_CountyN}\":0");
        json.Should().Contain($"\"{RatioDistributionCells.DorN_CountyQ}\":0");
        json.Should().Contain($"\"{RatioDistributionCells.DorN_CountyN}\":0");
    }

    [Fact]
    public async Task Commit_MissingIdempotencyKey_ReturnsBadRequest()
    {
        var result = await Build().CommitAsync(
            new CommitRequest(IdempotencyKey: "  ", OperatorId: "op", CommitNote: null));
        result.Outcome.Should().Be(CommitOutcome.InvalidInput);
    }

    [Fact]
    public async Task Commit_MissingOperatorId_ReturnsBadRequest()
    {
        var result = await Build().CommitAsync(
            new CommitRequest(IdempotencyKey: "k", OperatorId: "", CommitNote: null));
        result.Outcome.Should().Be(CommitOutcome.InvalidInput);
    }

    // ─────────────────────────────────────────────────────────────────
    // List
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task List_DefaultPaging_ReturnsNewestFirst()
    {
        await SeedRoutedTriageAsync();
        var first = await Build().CommitAsync(MakeRequest());
        await Task.Delay(15);
        await SeedRoutedTriageAsync();
        var second = await Build().CommitAsync(MakeRequest());

        var listResult = await Build().ListCommitsAsync(50, 0);
        listResult.Outcome.Should().Be(CommitOutcome.Ok);
        listResult.Items.Should().HaveCount(2);
        listResult.Items[0].CommitId.Should().Be(second.Payload!.CommitId);
        listResult.Items[1].CommitId.Should().Be(first.Payload!.CommitId);
    }

    [Fact]
    public async Task List_LimitOver200_IsClampedTo200()
    {
        var listResult = await Build().ListCommitsAsync(500, 0);
        listResult.Limit.Should().Be(200);
    }

    [Fact]
    public async Task List_OffsetPaging_SkipsLeadingEntries()
    {
        await SeedRoutedTriageAsync();
        await Build().CommitAsync(MakeRequest());
        await Task.Delay(15);
        await SeedRoutedTriageAsync();
        var second = await Build().CommitAsync(MakeRequest());

        var listResult = await Build().ListCommitsAsync(50, 1);
        // After skipping the newest, the older one shows up.
        listResult.Items.Should().HaveCount(1);
        listResult.Items[0].CommitId.Should().NotBe(second.Payload!.CommitId);
    }

    [Fact]
    public async Task List_EmptyDb_ReturnsEmptyArray()
    {
        var listResult = await Build().ListCommitsAsync(50, 0);
        listResult.Outcome.Should().Be(CommitOutcome.Ok);
        listResult.Items.Should().BeEmpty();
    }

    // ─────────────────────────────────────────────────────────────────
    // Detail
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Detail_HappyPath_ReturnsCommitWithLinkedDecisions()
    {
        await SeedRoutedTriageAsync();
        await SeedDismissedTriageAsync();
        var commit = await Build().CommitAsync(MakeRequest());

        var detail = await Build().GetCommitAsync(commit.Payload!.CommitId);
        detail.Outcome.Should().Be(CommitOutcome.Ok);
        detail.Payload!.CommitId.Should().Be(commit.Payload.CommitId);
        detail.Payload.Decisions.Should().HaveCount(2);
    }

    [Fact]
    public async Task Detail_UnknownId_Returns404()
    {
        var detail = await Build().GetCommitAsync(Guid.NewGuid());
        detail.Outcome.Should().Be(CommitOutcome.NotFound);
        detail.Payload.Should().BeNull();
    }

    [Fact]
    public async Task Detail_DecisionsOrderedByTriageId()
    {
        await SeedRoutedTriageAsync();
        await SeedRoutedTriageAsync();
        await SeedDismissedTriageAsync();
        var commit = await Build().CommitAsync(MakeRequest());

        var detail = await Build().GetCommitAsync(commit.Payload!.CommitId);
        var ids = detail.Payload!.Decisions.Select(d => d.TriageId).ToList();
        ids.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task Detail_RouteAndDismissDecisions_BothSurfaceWithCorrectBranchFields()
    {
        await SeedRoutedTriageAsync(targetUniverse: UniverseCodes.AgCurrentUse, targetCode: "CODE1");
        await SeedDismissedTriageAsync(reason: TriageDismissalReasons.ConversionArtifact);
        var commit = await Build().CommitAsync(MakeRequest());

        var detail = await Build().GetCommitAsync(commit.Payload!.CommitId);
        detail.Outcome.Should().Be(CommitOutcome.Ok);

        var routeRow = detail.Payload!.Decisions
            .Single(d => d.DecisionType == DecisionTypes.Route);
        routeRow.RoutedToUniverse.Should().Be(UniverseCodes.AgCurrentUse);
        routeRow.RoutedToIAttrValCd.Should().Be("CODE1");
        routeRow.DismissalReason.Should().BeNull();

        var dismissRow = detail.Payload.Decisions
            .Single(d => d.DecisionType == DecisionTypes.Dismiss);
        dismissRow.DismissalReason.Should().Be(TriageDismissalReasons.ConversionArtifact);
        dismissRow.RoutedToUniverse.Should().BeNull();
        dismissRow.RoutedToIAttrValCd.Should().BeNull();
    }
}
