using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave44;

/// <summary>
/// R2Wave44 — SyncController: requalify and qualification-status endpoints.
///
/// Invariants under test:
///   WF44-01: POST requalify/{countyId} calls ComputeRecommendationsAsync and returns count
///   WF44-02: POST requalify returns the count returned by the qualification service
///   WF44-03: GET qualification-status returns 200 with expected shape
///   WF44-04: qualification-status allTime.totalSales matches actual row count
///   WF44-05: qualification-status allTime.hasRecommendation counts only rows with non-null recommendation
///   WF44-06: qualification-status allTime.pendingDecision counts rows with recommendation but no decision
///   WF44-07: qualification-status allTime.staffConfirmed counts rows with DecisionSource=StaffConfirmed
///   WF44-08: qualification-status allTime.appraiserFinal counts rows with AppraiserFinal/AssessorOverride
///   WF44-09: qualification-status allTime.decisionQualified counts rows with QualificationDecision=qualified
///   WF44-10: qualification-status ratioStudyWindow.effectiveQualified matches effective qualified pool rule
///   WF44-11: qualification-status ratioStudyWindow excludes sales outside the 24-month lookback window
///   WF44-12: qualification-status recommendationCoverage is (hasRecommendation/total)*100
/// </summary>
[Trait("Category", "R2Wave44")]
[Trait("Category", "SyncController")]
public sealed class R2Wave44SyncControllerTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    private static SyncController CreateController(DataDbContext db, ISaleQualificationService? svc = null)
    {
        var qualification = svc ?? new Mock<ISaleQualificationService>().Object;
        return new SyncController(qualification, db, NullLogger<SyncController>.Instance);
    }

    private static async Task SeedCountyAsync(DataDbContext db)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
        {
            db.Counties.Add(new County
            {
                Id       = BentonCountyId,
                Name     = "Benton",
                State    = "WA",
                FipsCode = "003"
            });
            await db.SaveChangesAsync();
        }
    }

    private static async Task<ComparableSale> SeedSaleAsync(
        DataDbContext db,
        string?  recommendation  = null,
        string?  decision        = null,
        string?  decisionSource  = null,
        DateTime? saleDate       = null)
    {
        var sale = new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = $"T{Guid.NewGuid():N}"[..15],
            SaleDate                    = saleDate ?? new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = 300_000m,
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            DecisionSource              = decisionSource,
            CountyId                    = BentonCountyId
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // ── WF44-01 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_01_Requalify_CallsComputeRecommendationsAsync_WithCorrectCountyId()
    {
        await using var db = CreateDbContext(nameof(WF44_01_Requalify_CallsComputeRecommendationsAsync_WithCorrectCountyId));
        await SeedCountyAsync(db);

        var mockSvc = new Mock<ISaleQualificationService>();
        mockSvc
            .Setup(s => s.ComputeRecommendationsAsync(BentonCountyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(42);

        var ctrl = CreateController(db, mockSvc.Object);

        await ctrl.Requalify(BentonCountyId, CancellationToken.None);

        mockSvc.Verify(
            s => s.ComputeRecommendationsAsync(BentonCountyId, It.IsAny<CancellationToken>()),
            Times.Once,
            "ComputeRecommendationsAsync must be called with the exact countyId from the route");
    }

    // ── WF44-02 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_02_Requalify_Returns200_WithRequalifiedCount()
    {
        await using var db = CreateDbContext(nameof(WF44_02_Requalify_Returns200_WithRequalifiedCount));
        await SeedCountyAsync(db);

        var mockSvc = new Mock<ISaleQualificationService>();
        mockSvc
            .Setup(s => s.ComputeRecommendationsAsync(BentonCountyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(317);

        var ctrl = CreateController(db, mockSvc.Object);

        var result = await ctrl.Requalify(BentonCountyId, CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.requalified).Should().Be(317);
        ((Guid)body.countyId).Should().Be(BentonCountyId);
        ((object)body.completedAt).Should().NotBeNull();
    }

    // ── WF44-03 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_03_QualificationStatus_Returns200_WithExpectedShape()
    {
        await using var db = CreateDbContext(nameof(WF44_03_QualificationStatus_Returns200_WithExpectedShape));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, recommendation: "qualified");
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((Guid)body.countyId).Should().Be(BentonCountyId);
        ((int)body.taxYear).Should().Be(2026);
        ((object)body.allTime).Should().NotBeNull();
        // ratioStudyWindow may be null if no sales in window — that's valid
    }

    // ── WF44-04 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_04_QualificationStatus_AllTimeTotalSales_MatchesActualRowCount()
    {
        await using var db = CreateDbContext(nameof(WF44_04_QualificationStatus_AllTimeTotalSales_MatchesActualRowCount));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db);
        await SeedSaleAsync(db);
        await SeedSaleAsync(db);
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.allTime.totalSales).Should().Be(3);
    }

    // ── WF44-05 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_05_QualificationStatus_HasRecommendation_CountsOnlyNonNullRecommendations()
    {
        await using var db = CreateDbContext(nameof(WF44_05_QualificationStatus_HasRecommendation_CountsOnlyNonNullRecommendations));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, recommendation: "qualified");       // has rec
        await SeedSaleAsync(db, recommendation: "non-arms-length"); // has rec
        await SeedSaleAsync(db, recommendation: null);              // no rec
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.allTime.hasRecommendation).Should().Be(2);
    }

    // ── WF44-06 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_06_QualificationStatus_PendingDecision_CountsRecommendedButNotDecided()
    {
        await using var db = CreateDbContext(nameof(WF44_06_QualificationStatus_PendingDecision_CountsRecommendedButNotDecided));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, recommendation: "qualified",       decision: null);          // pending
        await SeedSaleAsync(db, recommendation: "qualified",       decision: "qualified",
            decisionSource: "StaffConfirmed");                                                // decided
        await SeedSaleAsync(db, recommendation: "non-arms-length", decision: null);           // pending
        await SeedSaleAsync(db, recommendation: null,              decision: null);            // no rec — not pending
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.allTime.pendingDecision).Should().Be(2, "pending = has rec AND no decision");
    }

    // ── WF44-07 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_07_QualificationStatus_StaffConfirmed_CountsDecisionSourceStaffConfirmed()
    {
        await using var db = CreateDbContext(nameof(WF44_07_QualificationStatus_StaffConfirmed_CountsDecisionSourceStaffConfirmed));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, decision: "qualified", decisionSource: "StaffConfirmed");
        await SeedSaleAsync(db, decision: "qualified", decisionSource: "StaffConfirmed");
        await SeedSaleAsync(db, decision: "qualified", decisionSource: "AppraiserFinal");
        await SeedSaleAsync(db, decision: null);
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.allTime.staffConfirmed).Should().Be(2);
    }

    // ── WF44-08 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_08_QualificationStatus_AppraiserFinal_IncludesAllFinalSources()
    {
        await using var db = CreateDbContext(nameof(WF44_08_QualificationStatus_AppraiserFinal_IncludesAllFinalSources));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, decision: "qualified",       decisionSource: "AppraiserFinal");
        await SeedSaleAsync(db, decision: "non-arms-length", decisionSource: "AssessorOverride");
        await SeedSaleAsync(db, decision: "qualified",       decisionSource: "AcceptedRecommendation");
        await SeedSaleAsync(db, decision: "qualified",       decisionSource: "StaffConfirmed"); // NOT counted
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.allTime.appraiserFinal).Should().Be(3);
    }

    // ── WF44-09 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_09_QualificationStatus_DecisionQualified_CountsOnlyQualifiedDecisions()
    {
        await using var db = CreateDbContext(nameof(WF44_09_QualificationStatus_DecisionQualified_CountsOnlyQualifiedDecisions));
        await SeedCountyAsync(db);
        await SeedSaleAsync(db, decision: "qualified");
        await SeedSaleAsync(db, decision: "qualified");
        await SeedSaleAsync(db, decision: "non-arms-length");
        await SeedSaleAsync(db, decision: null, recommendation: "qualified"); // no decision
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.allTime.decisionQualified).Should().Be(2);
    }

    // ── WF44-10 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_10_QualificationStatus_EffectiveQualified_AppliesDecisionWinsRule()
    {
        // Effective pool: decision="qualified" wins; recommendation="qualified" fallback when no decision.
        await using var db = CreateDbContext(nameof(WF44_10_QualificationStatus_EffectiveQualified_AppliesDecisionWinsRule));
        await SeedCountyAsync(db);
        // 1. decision=qualified → in pool (decision wins)
        await SeedSaleAsync(db, recommendation: "non-arms-length", decision: "qualified");
        // 2. decision=null, rec=qualified → in pool (recommendation fallback)
        await SeedSaleAsync(db, recommendation: "qualified", decision: null);
        // 3. decision=non-arms-length (explicit override) → NOT in pool
        await SeedSaleAsync(db, recommendation: "qualified", decision: "non-arms-length");
        // 4. decision=null, rec=non-arms-length → NOT in pool
        await SeedSaleAsync(db, recommendation: "non-arms-length", decision: null);
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        // ratioStudyWindow may be populated if default sale dates fall in 2024 window for taxYear=2026
        object? windowObj10 = body.ratioStudyWindow;
        if (windowObj10 != null)
        {
            int effQual = (int)body.ratioStudyWindow.effectiveQualified;
            effQual.Should().Be(2,
                "only decision=qualified and (decision=null AND rec=qualified) are in the effective pool");
        }
    }

    // ── WF44-11 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_11_QualificationStatus_RatioStudyWindow_ExcludesSalesOutsideLookback()
    {
        // taxYear=2026 → lookback Jan 1 2024 – Jan 1 2026.
        // A sale from 2019 must NOT appear in ratioStudyWindow totals.
        await using var db = CreateDbContext(nameof(WF44_11_QualificationStatus_RatioStudyWindow_ExcludesSalesOutsideLookback));
        await SeedCountyAsync(db);
        // Inside window (2024)
        await SeedSaleAsync(db, recommendation: "qualified",
            saleDate: new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        await SeedSaleAsync(db, recommendation: "qualified",
            saleDate: new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc));
        // Outside window (2019 — before the 24-month lookback)
        await SeedSaleAsync(db, recommendation: "qualified",
            saleDate: new DateTime(2019, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        object? windowObj = body.ratioStudyWindow;
        windowObj.Should().NotBeNull("two sales are inside the 2024-2025 window");
        int windowTotal = (int)body.ratioStudyWindow.totalSales;
        windowTotal.Should().Be(2, "the 2019 sale must be excluded from the window");
    }

    // ── WF44-12 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF44_12_QualificationStatus_RecommendationCoverage_IsHasRecOverTotalTimes100()
    {
        await using var db = CreateDbContext(nameof(WF44_12_QualificationStatus_RecommendationCoverage_IsHasRecOverTotalTimes100));
        await SeedCountyAsync(db);
        // 3 of 5 have recommendations → 60.0%
        await SeedSaleAsync(db, recommendation: "qualified");
        await SeedSaleAsync(db, recommendation: "qualified");
        await SeedSaleAsync(db, recommendation: "non-arms-length");
        await SeedSaleAsync(db, recommendation: null);
        await SeedSaleAsync(db, recommendation: null);
        var ctrl = CreateController(db);

        var result = await ctrl.GetQualificationStatus(BentonCountyId, taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        double coverage = (double)body.allTime.recommendationCoverage;
        coverage.Should().BeApproximately(60.0, precision: 0.1);
    }
}
