using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsOwnerTruth;
using TerraFusion.Data;
using TerraFusion.Data.Services.TruthPacs;
using Xunit;

namespace TerraFusion.Unit.Tests.TruthPacs;

/// <summary>
/// Slice B2-A acceptance tests. Proves the five T-* gates and the
/// doctrine invariants:
///  - all three source batches must be COMPLETED or REFUSED
///  - rows whose sup_num doesn't match the active supp pointer are rejected
///  - rows whose owner_id has no matching account are rejected
///  - groups whose pct totals do not equal 100 trip the HARD gate
///  - account snapshot (file_as_name, confidential, web_supp) is preserved
///  - PII (BirthDt) is preserved verbatim at truth layer
///  - re-promoting the same owner batch is idempotent
///  - every promoted row carries lineage to all three source batches
/// </summary>
public sealed class PacsOwnerCurrentTruthPromoterTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsOwnerCurrentTruthPromoterTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b2a-{Guid.NewGuid():N}")
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

    private PacsOwnerCurrentTruthPromoter BuildPromoter()
        => new(_db, NullLogger<PacsOwnerCurrentTruthPromoter>.Instance);

    private PacsOwnerCurrentTruthPromoter BuildPromoterWithChunkSize(int chunkSize)
        => new(_db, NullLogger<PacsOwnerCurrentTruthPromoter>.Instance, chunkSize);

    private async Task<Guid> SeedBatchAsync(string label, string status = "COMPLETED")
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc",
            Operator = "test",
            Status = status,
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
            ErrorSummary = status == "FAILED" ? "simulated" : null,
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task SeedSuppAsync(Guid suppBatch, int propId, short year, short sup)
    {
        _db.LegacyPacsRawPropSuppAssocs.Add(new LegacyPacsRawPropSuppAssoc
        {
            PropValYr = year, PropId = propId, SupNum = sup,
            LoadBatchId = suppBatch, SourceQueryHash = "qh",
            SourceRowHash = $"supp-{propId}-{year}",
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedAccountAsync(
        Guid accountBatch, long acctId,
        string? fileAs = "Smith, John",
        bool confidential = false, bool webSupp = false)
    {
        _db.LegacyPacsRawAccounts.Add(new LegacyPacsRawAccount
        {
            AcctId = acctId,
            FileAsName = fileAs,
            FirstName = null, LastName = null,
            ConfidentialFlag = confidential,
            WebSuppression = webSupp,
            LoadBatchId = accountBatch,
            SourceQueryHash = "qh",
            SourceRowHash = $"acct-{acctId}",
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedOwnerAsync(
        Guid ownerBatch, int propId, long ownerId,
        decimal? pct = 100m, short year = 2026, short sup = 0,
        DateTime? birthDt = null)
    {
        _db.LegacyPacsRawOwners.Add(new LegacyPacsRawOwner
        {
            OwnerTaxYr = year, SupNum = sup,
            PropId = propId, OwnerId = ownerId,
            PctOwnership = pct, TypeOfOwner = "I",
            BirthDt = birthDt,
            LoadBatchId = ownerBatch,
            SourceQueryHash = "qh",
            SourceRowHash = $"owner-{propId}-{ownerId}",
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task HappyPath_PromotesValidOwners_WithFullLineage()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1, fileAs: "Smith, John");
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.OwnersConsidered.Should().Be(1);
        result.OwnersPromoted.Should().Be(1);
        result.PctCompletenessViolations.Should().Be(0);

        var truth = await _db.TruthPacsOwnerCurrents.SingleAsync();
        truth.PropId.Should().Be(100);
        truth.OwnerId.Should().Be(1);
        truth.AcctId.Should().Be(1);
        truth.FileAsName.Should().Be("Smith, John");
        truth.OwnerLoadBatchId.Should().Be(ownerBatch);
        truth.AccountLoadBatchId.Should().Be(accountBatch);
        truth.SuppAssocLoadBatchId.Should().Be(suppBatch);
        truth.SourceOwnerLandedRowId.Should().NotBe(Guid.Empty);
        truth.SourceAccountLandedRowId.Should().NotBe(Guid.Empty);
        truth.SourceSuppAssocLandedRowId.Should().NotBe(Guid.Empty);
        // G1 (v1.10): conversion-era marker is stamped at promotion (year=2026 ⇒ post-conversion).
        truth.ConversionEra.Should().Be(ConversionEras.PostConversion);
    }

    [Fact]
    public async Task StaleSupNum_IsRejected()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        // Active sup = 1; owner points at sup 0 → stale.
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 1);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, sup: 0);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.OwnersPromoted.Should().Be(0);
        result.RejectedStaleSupNum.Should().Be(1);
        (await _db.TruthPacsOwnerCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NoSuppPointer_IsRejected()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        // No supp row for prop_id=200.
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 200, ownerId: 1);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.OwnersPromoted.Should().Be(0);
        result.RejectedNoSuppPointer.Should().Be(1);
    }

    [Fact]
    public async Task OwnerWithoutAccount_IsRejected_AccountLinkGateFails()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        // No account for ownerId=1.
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.OwnersPromoted.Should().Be(0);
        result.RejectedNoAccount.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-owner-account-link"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("FAIL");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task PctSumNot100_TripsHardCompletenessGate_ToFail()
    {
        // Two co-owners summing to 90 (not 100) → hard gate FAILs.
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedAccountAsync(accountBatch, acctId: 2);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 60m);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 2, pct: 30m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.OwnersPromoted.Should().Be(2,
            "rows still land in truth even when their group's pct fails the gate; the gate FAILs the BATCH outcome, not individual rows");
        result.PctCompletenessViolations.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-owner-pct-completeness");
        gate.Status.Should().Be("FAIL");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task NullPctOwnership_TripsHardCompletenessGate()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: null);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.PctCompletenessViolations.Should().Be(1,
            "NULL pct → group fails the hard gate at truth layer");
    }

    [Fact]
    public async Task CoOwnersSumming100_PassesHardGate()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedAccountAsync(accountBatch, acctId: 2);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 60m);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 2, pct: 40m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.OwnersPromoted.Should().Be(2);
        result.PctCompletenessViolations.Should().Be(0);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-owner-pct-completeness");
        gate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task AccountSnapshot_IsPreservedAtPromotionTime()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1,
            fileAs: "Doe, Jane", confidential: true, webSupp: false);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);

        await BuildPromoter().PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        var truth = await _db.TruthPacsOwnerCurrents.SingleAsync();
        truth.FileAsName.Should().Be("Doe, Jane");
        truth.ConfidentialFlag.Should().BeTrue();
        truth.WebSuppression.Should().BeFalse();
    }

    [Fact]
    public async Task BirthDt_PII_IsPreservedAtTruthLayer()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        var birth = new DateTime(1965, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m, birthDt: birth);

        await BuildPromoter().PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        var truth = await _db.TruthPacsOwnerCurrents.SingleAsync();
        truth.BirthDt.Should().Be(birth,
            "PII at truth layer is verbatim; redaction happens at canonical projection (B3)");
    }

    [Theory]
    [InlineData("FAILED", "COMPLETED", "COMPLETED")]
    [InlineData("COMPLETED", "FAILED", "COMPLETED")]
    [InlineData("COMPLETED", "COMPLETED", "FAILED")]
    [InlineData("FAILED", "FAILED", "FAILED")]
    public async Task AnyBatchNotCompleted_RefusesPromotion(
        string ownerStatus, string accountStatus, string suppStatus)
    {
        var ownerBatch = await SeedBatchAsync("owner", ownerStatus);
        var accountBatch = await SeedBatchAsync("account", accountStatus);
        var suppBatch = await SeedBatchAsync("supp", suppStatus);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.Status.Should().Be("REFUSED");
        (await _db.TruthPacsOwnerCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownBatchIds_RefusesPromotion()
    {
        var result = await BuildPromoter()
            .PromoteAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "test-op");

        result.Status.Should().Be("REFUSED");
        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-owner-source-batches-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("FAIL");
        gate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_Replaces_PriorTruthRows_Idempotently()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);

        var first = await BuildPromoter().PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");
        var second = await BuildPromoter().PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        first.OwnersPromoted.Should().Be(1);
        first.PriorRowsRemoved.Should().Be(0);
        second.OwnersPromoted.Should().Be(1);
        second.PriorRowsRemoved.Should().Be(1);

        (await _db.TruthPacsOwnerCurrents.CountAsync()).Should().Be(1,
            "re-promoting the same owner batch produces no duplicates");
    }

    [Fact]
    public async Task AllFiveGates_AreRecorded_OnSuccess()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "truth-pacs-owner-source-batches-completed",
            "truth-pacs-owner-supp-aware-join",
            "truth-pacs-owner-account-link",
            "truth-pacs-owner-pct-completeness",
            "truth-pacs-owner-promotion-coverage",
            // G4 (v1.13): pre-conversion-share gate.
            "truth-pacs-owner-pre-conversion-share",
        });
    }

    [Fact]
    public async Task EmptyOwnerBatch_StillCompletes_WithCleanGates()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.OwnersConsidered.Should().Be(0);
        result.OwnersPromoted.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        // G4 (v1.13): the new pre-conversion-share gate brings the
        // owner lane's gate count to 6.
        gates.Should().HaveCount(6);
        gates.Where(g => g.GateName == "truth-pacs-owner-pct-completeness")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInB2A()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);

        await BuildPromoter().PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        // canonical_tf must remain untouched.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SuppRejectsOnly_GateIsWarn()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedAccountAsync(accountBatch, acctId: 2);
        // owner 1 OK
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);
        // owner 2 has no supp pointer
        await SeedOwnerAsync(ownerBatch, propId: 999, ownerId: 2, pct: 100m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.OwnersPromoted.Should().Be(1);
        result.RejectedNoSuppPointer.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-owner-supp-aware-join"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("WARN");
        gate.Detail.Should().Contain("noSuppPointer=1");
    }

    [Fact]
    public async Task PreConversionShareGate_Trips_WARN_OnPreConversionHeavyBatch()
    {
        // G4 (v1.13): one pre + one post = 50% > 5% ⇒ WARN.
        // Owner era is derived from OwnerTaxYr, not PropValYr.
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2010, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedAccountAsync(accountBatch, acctId: 2);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, year: 2010);
        await SeedOwnerAsync(ownerBatch, propId: 200, ownerId: 2, year: 2026);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.LoadBatchId == result.PromotionLoadBatchId
                           && g.GateName == ConversionEraGate.GateNameFor(
                                  ConversionEraGate.Lanes.Owner));
        gate.Status.Should().Be("WARN");
        gate.GateStage.Should().Be("RAW_TO_TRUTH");
        gate.Detail.Should().Contain("preConversion=1");
        gate.Detail.Should().Contain("total=2");
    }

    [Fact]
    public async Task PreConversionShareGate_Stays_PASS_OnAllPostConversionBatch()
    {
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 100, ownerId: 1, pct: 100m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.LoadBatchId == result.PromotionLoadBatchId
                           && g.GateName == ConversionEraGate.GateNameFor(
                                  ConversionEraGate.Lanes.Owner));
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("preConversion=0");
    }

    // ── WO-OWNER-PERF-001: chunked save ──────────────────────────────────

    [Fact]
    public async Task ChunkSave_MultipleOwners_AllPromotedAndNoTrackedEntitiesRemain()
    {
        // 3 owners — well below the default 10k chunk boundary, so only
        // the post-loop final flush runs. Verifies that multiple owners
        // all persist correctly through the final-flush path.
        // The in-loop chunk-boundary path is exercised by
        // ChunkSave_BoundaryExactlyHit_PersistedMidLoopAndAllPromoted.
        const int ownerCount = 3;
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        for (var i = 1; i <= ownerCount; i++)
        {
            await SeedSuppAsync(suppBatch, propId: i, year: 2026, sup: 0);
            await SeedAccountAsync(accountBatch, acctId: i);
            await SeedOwnerAsync(ownerBatch, propId: i, ownerId: i, pct: 100m);
        }

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.OwnersPromoted.Should().Be(ownerCount);

        // All rows must be persisted (chunk flush + final flush both committed).
        var dbCount = await _db.TruthPacsOwnerCurrents.CountAsync();
        dbCount.Should().Be(ownerCount,
            "every promoted owner must survive after ChangeTracker detach between chunks");
    }

    [Fact]
    public async Task ChunkSave_NoTrackedOwnerCurrentEntities_AfterFullPromote()
    {
        // After promotion completes, TruthPacsOwnerCurrent entities must
        // not linger in the ChangeTracker (they are detached between chunks
        // and the final flush also detaches on success).
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 1, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 1, ownerId: 1, pct: 100m);

        await BuildPromoter().PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        // After the final SaveChangesAsync, the chunk-flush logic has detached
        // all TruthPacsOwnerCurrent entities.  The ChangeTracker should retain
        // LoadBatch and gate-result entities (unchanged) but zero Added/Modified
        // TruthPacsOwnerCurrent rows.
        var tracked = _db.ChangeTracker
            .Entries<TruthPacsOwnerCurrent>()
            .Count();
        tracked.Should().Be(0,
            "chunk-flush detaches TruthPacsOwnerCurrent entities after each save " +
            "to prevent ChangeTracker accumulation at production scale");
    }

    [Fact]
    public async Task ChunkSave_SmallBatch_CompletesWithoutChunkBoundary()
    {
        // A single owner is well below the 10k chunk boundary.
        // Verify the final-flush path works (no chunk boundary is ever hit,
        // so only the post-loop SaveChangesAsync executes).
        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 1, year: 2026, sup: 0);
        await SeedAccountAsync(accountBatch, acctId: 1);
        await SeedOwnerAsync(ownerBatch, propId: 1, ownerId: 1, pct: 100m);

        var result = await BuildPromoter()
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.OwnersPromoted.Should().Be(1);
        (await _db.TruthPacsOwnerCurrents.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task ChunkSave_BoundaryExactlyHit_PersistedMidLoopAndAllPromoted()
    {
        // Uses chunkSize=3 with 4 owners so the in-loop SaveChangesAsync
        // fires exactly once (at promoted=3), then the post-loop final flush
        // handles the 4th row. This directly exercises the
        // `if (promoted % _chunkSize == 0)` branch that was unreachable
        // with the default 10k chunk size in a unit test.
        const int chunkSize = 3;
        const int ownerCount = chunkSize + 1; // crosses exactly one boundary

        var ownerBatch = await SeedBatchAsync("owner");
        var accountBatch = await SeedBatchAsync("account");
        var suppBatch = await SeedBatchAsync("supp");

        for (var i = 1; i <= ownerCount; i++)
        {
            await SeedSuppAsync(suppBatch, propId: i, year: 2026, sup: 0);
            await SeedAccountAsync(accountBatch, acctId: i);
            await SeedOwnerAsync(ownerBatch, propId: i, ownerId: i, pct: 100m);
        }

        var result = await BuildPromoterWithChunkSize(chunkSize)
            .PromoteAsync(ownerBatch, accountBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.OwnersPromoted.Should().Be(ownerCount);

        // All 4 rows must be in the DB: the first 3 committed at the chunk
        // boundary (in-loop SaveChangesAsync), the 4th by the post-loop flush.
        (await _db.TruthPacsOwnerCurrents.CountAsync()).Should().Be(ownerCount,
            "chunk-boundary save (promoted=3) and final-flush (promoted=4) must both commit");

        // All TruthPacsOwnerCurrent entities must be detached after promotion.
        _db.ChangeTracker.Entries<TruthPacsOwnerCurrent>().Count().Should().Be(0,
            "targeted detach after each chunk flush must clear the ChangeTracker");
    }
}
