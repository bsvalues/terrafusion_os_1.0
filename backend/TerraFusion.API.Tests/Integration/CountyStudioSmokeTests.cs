// backend/TerraFusion.API.Tests/Integration/CountyStudioSmokeTests.cs
//
// Task I — End-to-End Smoke Test for County Studio.
//
// Exercises the complete workflow in a single in-memory scenario:
//   Study → Segments → Cohort → Scenarios → Preview → Compare
//   → Exception lifecycle (Create/Dispatch/Assign/Note)
//   → Evidence packet data projection (GetExceptions + GetScenarios)
//
// Uses the same real-EF / SQLite-in-memory setup as CountyStudyServiceTests.
// No mocks: every assertion exercises the actual service layer.

using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Full County Studio workflow smoke test.
/// One cohesive scenario proves that all tasks (F, G, H) are wired
/// together through the service layer — not just individually unit-tested.
/// </summary>
public class CountyStudioSmokeTests
{
    // ── Fixture helpers ────────────────────────────────────────────────────────

    private static (TerraFusion.Data.TerraFusionDbContext ctx, CountyStudyService svc) CreateSut()
    {
        var ctx = TestDbContextFactory.CreateInMemoryContext();
        var resolver = new PassThroughCountyResolver();
        var svc = new CountyStudyService(ctx, resolver);
        return (ctx, svc);
    }

    private sealed class PassThroughCountyResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string input, CancellationToken ct = default)
            => Guid.TryParse(input, out var g)
                ? Task.FromResult(g)
                : throw new CountyNotFoundException(input);

        public Task<Guid?> TryResolveAsync(string input, CancellationToken ct = default)
            => Task.FromResult<Guid?>(Guid.TryParse(input, out var g) ? g : null);
    }

    /// <summary>
    /// Seed a CountySegmentSet + 3 segments with real IAAO metrics.
    /// Returns (segmentSetId, segmentIds[]).
    /// </summary>
    private static async Task<(Guid setId, List<Guid> segIds)> SeedSegmentsAsync(
        TerraFusion.Data.TerraFusionDbContext ctx,
        Guid studyId,
        Guid countyId)
    {
        var set = new CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(),
            StudyId      = studyId,
            CountyId     = countyId,
            Name         = "Smoke Test Baseline",
            IsBaseline   = true,
            SourceType   = SegmentSetSourceType.Neighborhood,
        };
        ctx.CountySegmentSets.Add(set);

        var segs = new[]
        {
            new CountySegment
            {
                SegmentSetId              = set.SegmentSetId,
                CountyId                  = countyId,
                Name                      = "West Richland R1",
                SegmentType               = SegmentType.Residential,
                ParcelCount               = 312,
                MedianRatio               = 0.97m,
                CoefficientOfDispersion   = 12.4m,
                PriceRelatedDifferential  = 1.01m,
                StabilityScore            = 82m,
                RiskScore                 = 18m,
                ExceptionCount            = 4,
            },
            new CountySegment
            {
                SegmentSetId              = set.SegmentSetId,
                CountyId                  = countyId,
                Name                      = "Kennewick Comm A",
                SegmentType               = SegmentType.Commercial,
                ParcelCount               = 87,
                MedianRatio               = 1.08m,
                CoefficientOfDispersion   = 18.9m,
                PriceRelatedDifferential  = 1.04m,
                StabilityScore            = 55m,
                RiskScore                 = 62m,
                ExceptionCount            = 11,
            },
            new CountySegment
            {
                SegmentSetId              = set.SegmentSetId,
                CountyId                  = countyId,
                Name                      = "Richland R3 Mid",
                SegmentType               = SegmentType.Residential,
                ParcelCount               = 543,
                MedianRatio               = 0.93m,
                CoefficientOfDispersion   = 9.1m,
                PriceRelatedDifferential  = 0.99m,
                StabilityScore            = 91m,
                RiskScore                 = 9m,
                ExceptionCount            = 2,
            },
        };

        ctx.CountySegments.AddRange(segs);
        await ctx.SaveChangesAsync();

        return (set.SegmentSetId, segs.Select(s => s.SegmentId).ToList());
    }

    // ── Smoke test ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task CountyStudio_FullWorkflow_Smoke()
    {
        var (ctx, svc) = CreateSut();

        // ── 1. Create study ────────────────────────────────────────────────────
        var countyId = Guid.NewGuid();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(countyId.ToString(), 2025, StudyType.RatioStudy, "March"),
            "bsvalues");

        Assert.NotEqual(Guid.Empty, study.StudyId);
        Assert.Equal(2025, study.TaxYear);
        Assert.Equal("Draft", study.Status);

        // ── 2. Seed segments + wire to study ──────────────────────────────────
        var (setId, segIds) = await SeedSegmentsAsync(ctx, study.StudyId, countyId);

        // Wire the study to the segment set (mirrors what DeriveSegmentsAsync does)
        var session = await ctx.CountyStudySessions.FindAsync(study.StudyId);
        Assert.NotNull(session);
        session!.ActiveSegmentSetId = setId;
        await ctx.SaveChangesAsync();

        // ── 3. Create cohort over all 3 segments ──────────────────────────────
        var defJson  = System.Text.Json.JsonSerializer.Serialize(new { segmentIds = segIds });
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "All Segments", CohortSelectionType.Segment,
                defJson, 942, false),
            "bsvalues");

        Assert.Equal(study.StudyId, cohort.StudyId);
        Assert.Equal(942, cohort.ParcelCount);

        // ── 4. Create two scenarios ────────────────────────────────────────────
        var scenA = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(
                study.StudyId, cohort.CohortId, ScenarioAdjustmentType.TotalValuePercent,
                "{\"magnitude\":5.0}", "Market trend correction +5%"),
            "bsvalues");

        var scenB = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(
                study.StudyId, cohort.CohortId, ScenarioAdjustmentType.TotalValuePercent,
                "{\"magnitude\":-3.0}", "Downward market pressure -3%"),
            "bsvalues");

        Assert.NotEqual(scenA.ScenarioId, scenB.ScenarioId);
        Assert.Equal("Market trend correction +5%", scenA.Rationale);
        Assert.Equal("Downward market pressure -3%", scenB.Rationale);

        // ── 5. Preview scenario A ──────────────────────────────────────────────
        var previewA = await svc.PreviewScenarioImpactAsync(scenA.ScenarioId);

        Assert.Equal(scenA.ScenarioId, previewA.ScenarioId);
        // Median ratio before: avg(0.97, 1.08, 0.93) ≈ 0.9933; after +5%: ≈ 1.043
        Assert.True(previewA.MedianRatioAfter > previewA.MedianRatioBefore,
            "5% increase must push median ratio up");
        Assert.True(previewA.ParcelsAffected >= 0);

        // ── 6. Compare A vs B ─────────────────────────────────────────────────
        var compare = await svc.CompareScenarioImpactAsync(scenA.ScenarioId, scenB.ScenarioId);

        Assert.Equal(4, compare.Rows.Count);
        var metricLabels = compare.Rows.Select(r => r.MetricLabel).ToList();
        Assert.Contains("Median Ratio", metricLabels);
        Assert.Contains("COD",          metricLabels);
        Assert.Contains("PRD",          metricLabels);
        Assert.Contains("Exceptions",   metricLabels);

        // Every row has a non-empty winner
        foreach (var row in compare.Rows)
            Assert.False(string.IsNullOrEmpty(row.Winner), $"Row {row.MetricLabel} has no winner");

        // ── 7. Create exception set ────────────────────────────────────────────
        var exc = new CountyExceptionSet
        {
            StudyId           = study.StudyId,
            SourceScenarioId  = scenA.ScenarioId,
            CountyId          = countyId,
            ReasonCode        = ExceptionReasonCode.Outlier,
            ParcelIdsJson     = "[\"P10001\",\"P10002\",\"P10003\"]",
            ParcelCount       = 3,
            Destination       = ExceptionDestination.Dais,
            Status            = ExceptionSetStatus.Created,
            CreatedBy         = "bsvalues",
            UpdatedBy         = "bsvalues",
        };
        ctx.CountyExceptionSets.Add(exc);
        await ctx.SaveChangesAsync();

        // Verify it's retrievable
        var exceptions = await svc.GetExceptionSetsAsync(study.StudyId);
        Assert.Single(exceptions);
        Assert.Equal("Outlier",  exceptions[0].ReasonCode);
        Assert.Equal("Dais",     exceptions[0].Destination);
        Assert.Equal("Created",  exceptions[0].Status);

        // ── 8. Exception lifecycle — Dispatch ─────────────────────────────────
        var dispatched = await svc.UpdateExceptionStatusAsync(
            exc.ExceptionSetId, ExceptionSetStatus.Dispatched, "bsvalues");

        Assert.Equal("Dispatched", dispatched.Status);

        // ── 9. Assign ─────────────────────────────────────────────────────────
        var assigned = await svc.AssignExceptionSetAsync(
            exc.ExceptionSetId, "Jane Assessor", "bsvalues");

        Assert.Equal("Jane Assessor", assigned.AssignedTo);

        // ── 10. Add note ──────────────────────────────────────────────────────
        var noted = await svc.AddExceptionNoteAsync(
            exc.ExceptionSetId, "Outlier parcels confirmed — DOR waiver submitted", "bsvalues");

        Assert.NotNull(noted.Notes);
        Assert.Contains("DOR waiver submitted", noted.Notes);
        Assert.Contains("bsvalues",             noted.Notes);

        // ── 11. Evidence packet data projection ───────────────────────────────
        // The evidence packet endpoint pulls GetExceptionSetsAsync + GetScenariosAsync.
        // Assert both return the data we seeded so the controller can assemble the packet.
        var excList  = await svc.GetExceptionSetsAsync(study.StudyId);
        var scenList = await svc.GetScenariosAsync(study.StudyId);

        Assert.Single(excList);
        Assert.Equal("Dispatched",   excList[0].Status);
        Assert.Equal("Jane Assessor",excList[0].AssignedTo);

        Assert.Equal(2, scenList.Count);
        Assert.Contains(scenList, s => s.ScenarioId == scenA.ScenarioId);
        Assert.Contains(scenList, s => s.ScenarioId == scenB.ScenarioId);

        // Confirm scenario rationale is preserved (evidence packet includes it verbatim)
        var packetScen = scenList.First(s => s.ScenarioId == scenA.ScenarioId);
        Assert.Equal("Market trend correction +5%", packetScen.Rationale);

        // ── 12. Save scenario A + promote to AdjustmentSet ───────────────────
        var savedA = await svc.SaveScenarioAsync(scenA.ScenarioId, "bsvalues");
        Assert.NotNull(savedA);
        Assert.Equal("Saved", savedA!.Status);

        var effectiveScope = System.Text.Json.JsonSerializer.Serialize(new
        {
            cohortId    = cohort.CohortId,
            segmentIds  = segIds,
            parcelCount = 942,
        });

        var adjSet = await svc.PromoteScenarioAsync(
            new PromoteScenarioRequest(scenA.ScenarioId, effectiveScope), "bsvalues");

        Assert.Equal("Proposed", adjSet.ApprovalState);
        Assert.Equal(scenA.ScenarioId, adjSet.ScenarioId);
        Assert.Equal(study.StudyId, adjSet.StudyId);

        // GetAdjustmentSetsAsync returns it
        var adjList = await svc.GetAdjustmentSetsAsync(study.StudyId);
        Assert.Single(adjList);
        Assert.Equal(adjSet.AdjustmentSetId, adjList[0].AdjustmentSetId);

        // ── 13. Approval state machine: Proposed → ReadyForApproval → Approved → Published ──
        var rfa = await svc.UpdateApprovalStateAsync(
            adjSet.AdjustmentSetId, AdjustmentSetApprovalState.ReadyForApproval, "bsvalues");
        Assert.Equal("ReadyForApproval", rfa.ApprovalState);

        var approved = await svc.UpdateApprovalStateAsync(
            adjSet.AdjustmentSetId, AdjustmentSetApprovalState.Approved, "bsvalues");
        Assert.Equal("Approved", approved.ApprovalState);
        Assert.Equal("bsvalues", approved.ApprovedBy);

        // Identity contract: ApprovedBy must be the real user, not the "system" fallback.
        Assert.NotEqual("system", approved.ApprovedBy);

        var published = await svc.UpdateApprovalStateAsync(
            adjSet.AdjustmentSetId, AdjustmentSetApprovalState.Published, "bsvalues");
        Assert.Equal("Published", published.ApprovalState);
        Assert.NotNull(published.PublishedAt);

        // Illegal transition (Published → Approved) must throw
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateApprovalStateAsync(
                adjSet.AdjustmentSetId, AdjustmentSetApprovalState.Approved, "bsvalues"));
    }
}
