// WORKBENCH-V0.2 SLICE-I STEP-2 — QuarantineReviewService contract tests.
//
// Validates:
//   1. BrowseAsync: empty quarantine returns empty item list, Ok outcome.
//   2. BrowseAsync: invalid (empty) lane → InvalidInput.
//   3. BrowseAsync: unsupported lane → UnsupportedLane.
//   4. BrowseAsync: rows with no decision appear as UNREVIEWED.
//   5. BrowseAsync: rows with a decision show current (latest) disposition.
//   6. BrowseAsync: latest decision wins when multiple decisions exist.
//   7. BrowseAsync: disposition filter narrows result set.
//   8. SaveDecisionAsync: invalid lane → UnsupportedLane.
//   9. SaveDecisionAsync: invalid disposition → InvalidInput.
//  10. SaveDecisionAsync: missing quarantineRowRef → InvalidInput.
//  11. SaveDecisionAsync: unknown quarantineRowRef → NotFound.
//  12. SaveDecisionAsync: saves decision row; source quarantine count is UNCHANGED.
//  13. SaveDecisionAsync: second save appends row; latest decision reflects new disposition.
//  14. SaveDecisionAsync: ACCEPT_AS_IS does NOT modify source quarantine row.
//  15. SaveDecisionAsync: note > 500 chars → InvalidInput.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Sync.Workbench;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench;
using Xunit;

namespace TerraFusion.API.Tests.Workbench;

/// <summary>
/// SLICE-I STEP-2 unit tests for <see cref="QuarantineReviewService"/>.
///
/// <para>Uses in-memory EF per test (unique database name). Mirrors
/// the DryRunPreviewServiceTests fixture pattern.</para>
/// </summary>
public sealed class QuarantineReviewServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public QuarantineReviewServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase($"qr-review-{Guid.NewGuid():N}")
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, config);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private QuarantineReviewService Build() =>
        new(_db, NullLogger<QuarantineReviewService>.Instance);

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<Guid> SeedQuarantineRowAsync(
        string reason = "UNKNOWN_I_ATTR_VAL_CD",
        int propId = 10001)
    {
        var id = Guid.NewGuid();
        _db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
        {
            UnprovenRowId      = id,
            PropValYr          = 2025,
            SupNum             = 0,
            PropId             = propId,
            ImprvId            = 1,
            ImprvDetId         = 2,
            IAttrValId         = 3,
            IAttrValCd         = "UNKNOWN_CODE",
            QuarantineReason   = reason,
            LandingLoadBatchId = Guid.NewGuid(),
            CreatedAt          = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
        return id;
    }

    private async Task SeedDecisionAsync(
        string quarantineRowRef,
        string disposition,
        DateTime? createdAt = null)
    {
        _db.SyncBridgeQuarantineReviewDecisions.Add(
            new TerraFusion.Core.Entities.SyncBridge.QuarantineReviewDecision
            {
                QuarantineId     = 0,
                QuarantineRowRef = quarantineRowRef,
                Lane             = "imprv_attr",
                Disposition      = disposition,
                OperatorIdentity = "test-operator",
                CreatedAt        = createdAt ?? DateTime.UtcNow,
            });
        await _db.SaveChangesAsync();
    }

    // ── Browse ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Browse_EmptyQuarantine_ReturnsEmptyItems_Outcome_Ok()
    {
        var svc = Build();
        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "imprv_attr",
            Limit = 50,
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.Ok);
        result.Items.Should().BeEmpty();
        result.TotalSourceCount.Should().Be(0);
        result.ReturnedCount.Should().Be(0);
    }

    [Fact]
    public async Task Browse_EmptyLane_ReturnsInvalidInput()
    {
        var svc = Build();
        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "",
            Limit = 50,
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.InvalidInput);
        result.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Browse_UnsupportedLane_ReturnsUnsupportedLane()
    {
        var svc = Build();
        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "sales",
            Limit = 50,
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.UnsupportedLane);
        result.Items.Should().BeEmpty();
        result.ErrorMessage.Should().Contain("sales");
    }

    [Fact]
    public async Task Browse_RowWithNoDecision_AppearsAsUnreviewed()
    {
        await SeedQuarantineRowAsync();
        var svc = Build();

        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "imprv_attr",
            Limit = 50,
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.Ok);
        result.Items.Should().HaveCount(1);
        result.Items[0].CurrentDisposition.Should().Be("UNREVIEWED");
        result.Items[0].ReviewedBy.Should().BeNull();
        result.Items[0].ReviewedAt.Should().BeNull();
        result.Items[0].CurrentDecisionId.Should().BeNull();
    }

    [Fact]
    public async Task Browse_RowWithDecision_ShowsCurrentDisposition()
    {
        var id = await SeedQuarantineRowAsync();
        await SeedDecisionAsync(id.ToString(), "ACCEPT_AS_IS");
        var svc = Build();

        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "imprv_attr",
            Limit = 50,
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.Ok);
        var item = result.Items.Should()
            .ContainSingle(r => r.QuarantineRowRef == id.ToString()).Subject;
        item.CurrentDisposition.Should().Be("ACCEPT_AS_IS");
        item.ReviewedBy.Should().Be("test-operator");
        item.CurrentDecisionId.Should().NotBeNull();
    }

    [Fact]
    public async Task Browse_MultipleDecisions_LatestWins()
    {
        var id = await SeedQuarantineRowAsync();
        var baseTime = DateTime.UtcNow.AddMinutes(-5);
        await SeedDecisionAsync(id.ToString(), "NEEDS_RESEARCH", baseTime);
        await SeedDecisionAsync(id.ToString(), "REJECT_PERMANENTLY", baseTime.AddMinutes(3));
        var svc = Build();

        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "imprv_attr",
            Limit = 50,
        });

        var item = result.Items.Should()
            .ContainSingle(r => r.QuarantineRowRef == id.ToString()).Subject;
        item.CurrentDisposition.Should().Be("REJECT_PERMANENTLY");
    }

    [Fact]
    public async Task Browse_DispositionFilter_NarrowsResults()
    {
        var id1 = await SeedQuarantineRowAsync(propId: 11111);
        var id2 = await SeedQuarantineRowAsync(propId: 22222);
        await SeedDecisionAsync(id1.ToString(), "ACCEPT_AS_IS");
        // id2 has no decision → UNREVIEWED
        var svc = Build();

        var result = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane              = "imprv_attr",
            Limit             = 50,
            DispositionFilter = "ACCEPT_AS_IS",
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.Ok);
        result.Items.Should().OnlyContain(r => r.CurrentDisposition == "ACCEPT_AS_IS");
        result.Items.Should().NotContain(r => r.QuarantineRowRef == id2.ToString());
    }

    // ── SaveDecision ──────────────────────────────────────────────────────────

    [Fact]
    public async Task SaveDecision_UnsupportedLane_ReturnsUnsupportedLane()
    {
        var id = await SeedQuarantineRowAsync();
        var svc = Build();

        var result = await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane        = "geometry",
            Disposition = "ACCEPT_AS_IS",
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.UnsupportedLane);
        result.ErrorMessage.Should().Contain("geometry");
    }

    [Fact]
    public async Task SaveDecision_InvalidDisposition_ReturnsInvalidInput()
    {
        var id = await SeedQuarantineRowAsync();
        var svc = Build();

        var result = await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "APPROVE_AND_RELEASE",
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.InvalidInput);
        result.ErrorMessage.Should().Contain("APPROVE_AND_RELEASE");
    }

    [Fact]
    public async Task SaveDecision_MissingRowRef_ReturnsInvalidInput()
    {
        var svc = Build();

        var result = await svc.SaveDecisionAsync("", new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "ACCEPT_AS_IS",
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.InvalidInput);
    }

    [Fact]
    public async Task SaveDecision_UnknownRowRef_ReturnsNotFound()
    {
        var svc = Build();
        var unknownId = Guid.NewGuid().ToString();

        var result = await svc.SaveDecisionAsync(unknownId, new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "ACCEPT_AS_IS",
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.NotFound);
    }

    [Fact]
    public async Task SaveDecision_AppendsRow_SourceCountUnchanged()
    {
        var id = await SeedQuarantineRowAsync();
        var countBefore = await _db.LegacyTfUnprovenImprvAttrs.CountAsync();
        var svc = Build();

        var result = await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane             = "imprv_attr",
            Disposition      = "NEEDS_RESEARCH",
            Note             = "Review pending further PACS data.",
            OperatorIdentity = "bsvalues",
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.Ok);
        result.DecisionId.Should().BeGreaterThan(0);
        result.Disposition.Should().Be("NEEDS_RESEARCH");
        result.SavedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        // Source count must be unchanged
        var countAfter = await _db.LegacyTfUnprovenImprvAttrs.CountAsync();
        countAfter.Should().Be(countBefore);
        result.SourceRowCountAfterSave.Should().Be(countBefore);

        // One decision row was inserted
        var decisions = await _db.SyncBridgeQuarantineReviewDecisions.ToListAsync();
        decisions.Should().HaveCount(1);
        decisions[0].QuarantineRowRef.Should().Be(id.ToString());
        decisions[0].Lane.Should().Be("imprv_attr");
        decisions[0].Disposition.Should().Be("NEEDS_RESEARCH");
        decisions[0].OperatorIdentity.Should().Be("bsvalues");
    }

    [Fact]
    public async Task SaveDecision_SecondSave_AppendsRow_LatestDecisionWins()
    {
        var id = await SeedQuarantineRowAsync();
        var svc = Build();

        var r1 = await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "NEEDS_RESEARCH",
        });
        r1.Outcome.Should().Be(QuarantineReviewOutcome.Ok);

        var r2 = await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "REJECT_PERMANENTLY",
        });
        r2.Outcome.Should().Be(QuarantineReviewOutcome.Ok);

        // Two rows appended, source unchanged
        var decisionCount = await _db.SyncBridgeQuarantineReviewDecisions.CountAsync();
        decisionCount.Should().Be(2);

        // Browse reflects latest
        var browse = await svc.BrowseAsync(new QuarantineReviewBrowseRequest
        {
            Lane  = "imprv_attr",
            Limit = 50,
        });
        var item = browse.Items.Single(r => r.QuarantineRowRef == id.ToString());
        item.CurrentDisposition.Should().Be("REJECT_PERMANENTLY");
    }

    [Fact]
    public async Task SaveDecision_AcceptAsIs_DoesNotMutateSourceRow()
    {
        var id = await SeedQuarantineRowAsync();
        var sourceBefore = await _db.LegacyTfUnprovenImprvAttrs
            .SingleAsync(u => u.UnprovenRowId == id);
        var originalCode   = sourceBefore.IAttrValCd;
        var originalReason = sourceBefore.QuarantineReason;

        var svc = Build();
        await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "ACCEPT_AS_IS",
        });

        // Re-read source row — must be identical
        var sourceAfter = await _db.LegacyTfUnprovenImprvAttrs
            .AsNoTracking()
            .SingleAsync(u => u.UnprovenRowId == id);

        sourceAfter.IAttrValCd.Should().Be(originalCode);
        sourceAfter.QuarantineReason.Should().Be(originalReason);
        sourceAfter.UniverseCode.Should().Be(sourceBefore.UniverseCode);
    }

    [Fact]
    public async Task SaveDecision_NoteTooLong_ReturnsInvalidInput()
    {
        var id = await SeedQuarantineRowAsync();
        var svc = Build();

        var result = await svc.SaveDecisionAsync(id.ToString(), new QuarantineReviewSaveRequest
        {
            Lane        = "imprv_attr",
            Disposition = "ACCEPT_AS_IS",
            Note        = new string('A', 501),
        });

        result.Outcome.Should().Be(QuarantineReviewOutcome.InvalidInput);
        result.ErrorMessage.Should().Contain("500");
    }
}
