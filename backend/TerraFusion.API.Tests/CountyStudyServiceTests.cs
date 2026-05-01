// backend/TerraFusion.API.Tests/CountyStudyServiceTests.cs
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;
using System.Text.Json;

namespace TerraFusion.API.Tests;

public class CountyStudyServiceTests
{
    private (TerraFusion.Data.TerraFusionDbContext ctx, CountyStudyService svc) CreateSut()
    {
        var ctx = TestDbContextFactory.CreateInMemoryContext();
        var resolver = new PassThroughCountyResolver();
        var svc = new CountyStudyService(ctx, resolver);
        return (ctx, svc);
    }

    /// <summary>
    /// Test-only resolver: treats every input as a Guid string. Tests that pass
    /// Guids to CreateStudyRequest.CountyId will round-trip cleanly.
    /// </summary>
    private sealed class PassThroughCountyResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string input, CancellationToken ct = default)
            => Guid.TryParse(input, out var g)
                ? Task.FromResult(g)
                : throw new CountyNotFoundException(input);

        public Task<Guid?> TryResolveAsync(string input, CancellationToken ct = default)
            => Task.FromResult<Guid?>(Guid.TryParse(input, out var g) ? g : null);
    }

    [Fact]
    public async Task CreateStudy_ReturnsStudyWithNewId()
    {
        var (_, svc) = CreateSut();
        var req = new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, "March");
        var result = await svc.CreateStudyAsync(req, "testuser");
        Assert.NotEqual(Guid.Empty, result.StudyId);
        Assert.Equal(2026, result.TaxYear);
    }

    [Fact]
    public async Task CreateStudy_SetsCountyName_FromCountyEntityOrFallback()
    {
        var (ctx, svc) = CreateSut();
        var countyId = Guid.NewGuid();

        // Seed a County entity so the service can look up the name.
        ctx.Counties.Add(new TerraFusion.Core.Entities.County
        {
            Id       = countyId,
            Name     = "Franklin County",
            State    = "WA",
            FipsCode = "53005",
        });
        await ctx.SaveChangesAsync();

        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null),
            "u1");

        Assert.Equal("Franklin County", study.CountyName);
    }

    [Fact]
    public async Task CreateStudy_CountyName_FallsBackToUnknownCounty_WhenCountyNotFound()
    {
        var (_, svc) = CreateSut();
        var countyId = Guid.NewGuid();

        // No County row seeded — resolver returns the Guid.
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null),
            "u1");

        // Fallback: CountyName is "Unknown County".
        Assert.Equal("Unknown County", study.CountyName);
    }

    [Fact]
    public async Task GetStudies_ReturnsOnlyCountyStudies()
    {
        var (_, svc) = CreateSut();
        var countyId = Guid.NewGuid();
        var otherCountyId = Guid.NewGuid();
        await svc.CreateStudyAsync(new CreateStudyRequest(countyId.ToString(), 2026, StudyType.RatioStudy, null), "u1");
        await svc.CreateStudyAsync(new CreateStudyRequest(otherCountyId.ToString(), 2026, StudyType.RatioStudy, null), "u2");

        var results = await svc.GetStudiesAsync(countyId);
        Assert.Single(results);
    }

    [Fact]
    public async Task CreateCohort_PersistsCohortWithStudyId()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var req = new CreateCohortRequest(
            study.StudyId, "West Richland R1", CohortSelectionType.Segment,
            "{\"segmentIds\":[\"abc\"]}", 842, false);
        var cohort = await svc.CreateCohortAsync(req, "u1");
        Assert.Equal(study.StudyId, cohort.StudyId);
        Assert.Equal(842, cohort.ParcelCount);
    }

    [Fact]
    public async Task CreateScenario_PersistsWithDraftStatus()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "TestCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var req = new CreateScenarioRequest(
            study.StudyId, cohort.CohortId,
            ScenarioAdjustmentType.LandValuePercent, "{\"magnitude\":4.0}", "market lag");
        var scenario = await svc.CreateScenarioAsync(req, "u1");
        Assert.Equal("Draft", scenario.Status);
        Assert.Equal(study.StudyId, scenario.StudyId);
    }

    // ── PreviewScenarioImpact ─────────────────────────────────────────────

    [Fact]
    public async Task PreviewScenarioImpact_ReturnsDto_WithScenarioId()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "PreviewCohort", CohortSelectionType.Segment,
                "{}", 50, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{\"magnitude\":5.0}", "preview test"), "u1");

        // No segments seeded — preview returns zero-value metric deltas, which is valid
        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        Assert.Equal(scenario.ScenarioId, preview.ScenarioId);
        Assert.Equal(50, preview.ParcelsAffected); // sourced from cohort.ParcelCount
    }

    // ── Chunk 4: honest scenario preview math ────────────────────────────

    private async Task<(CountyStudyService svc, TerraFusion.Data.TerraFusionDbContext ctx, Guid studyId, Guid cohortId)>
        SeedStudyWithSegments(string cohortDefinitionJson, params (decimal median, decimal cod, decimal prd, int parcels, int excCount)[] segs)
    {
        var (ctx, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var segSet = new TerraFusion.Core.Entities.CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(),
            StudyId      = study.StudyId,
            CountyId     = Guid.NewGuid(),
            Name         = "Test",
            SourceType   = TerraFusion.Core.Entities.SegmentSetSourceType.Hybrid,
            Version      = 1,
            IsBaseline   = true,
            CreatedBy    = "u1",
            UpdatedBy    = "u1",
        };
        ctx.CountySegmentSets.Add(segSet);
        foreach (var (median, cod, prd, parcels, exc) in segs)
        {
            ctx.CountySegments.Add(new TerraFusion.Core.Entities.CountySegment
            {
                SegmentId                = Guid.NewGuid(),
                SegmentSetId             = segSet.SegmentSetId,
                CountyId                 = segSet.CountyId,
                Name                     = "seg",
                SegmentType              = TerraFusion.Core.Entities.SegmentType.Residential,
                ParcelCount              = parcels,
                MedianRatio              = median,
                CoefficientOfDispersion  = cod,
                PriceRelatedDifferential = prd,
                ExceptionCount           = exc,
                StabilityScore           = 60,
                RiskScore                = 40,
            });
        }
        // Point the study at the segment set so preview finds it.
        var studyEntity = ctx.CountyStudySessions.First(s => s.StudyId == study.StudyId);
        studyEntity.ActiveSegmentSetId = segSet.SegmentSetId;
        await ctx.SaveChangesAsync();

        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "TestCohort", CohortSelectionType.Segment,
                cohortDefinitionJson, 100, false), "u1");
        return (svc, ctx, study.StudyId, cohort.CohortId);
    }

    [Fact]
    public async Task PreviewScenarioImpact_PercentAdjustment_CodIsScaleInvariant()
    {
        // Retires the 0.87m lie. Uniform percentage adjustment → COD is scale-
        // invariant under multiplication (see IAAO Standard on Ratio Studies §7).
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 0.95m, cod: 12.0m, prd: 1.01m, parcels: 100, excCount: 5),
            (median: 0.92m, cod: 14.0m, prd: 1.02m, parcels:  50, excCount: 3));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":4.0}", "test"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Median shifted by factor 1.04 (average of 0.95 and 0.92 = 0.935 → 0.9724).
        Assert.Equal(0.935m, preview.MedianRatioBefore, precision: 3);
        Assert.Equal(0.9724m, preview.MedianRatioAfter, precision: 4);
        // COD invariant — both before and after equal (13.0 avg of 12/14).
        Assert.Equal(13.0m, preview.CodBefore, precision: 2);
        Assert.Equal(13.0m, preview.CodAfter,  precision: 2);
        // PRD also invariant (avg 1.015).
        Assert.Equal(1.015m, preview.PrdBefore, precision: 4);
        Assert.Equal(1.015m, preview.PrdAfter,  precision: 4);
    }

    [Fact]
    public async Task PreviewScenarioImpact_PercentAdjustment_MedianShiftsByFactor()
    {
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 1.00m, cod: 10.0m, prd: 1.00m, parcels: 200, excCount: 0));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":-5.0}", "decrease"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        Assert.Equal(1.00m, preview.MedianRatioBefore, precision: 3);
        Assert.Equal(0.95m, preview.MedianRatioAfter,  precision: 3);
    }

    [Fact]
    public async Task PreviewScenarioImpact_PercentAdjustment_ExceptionsIncrease_WhenShiftCrossesIaaoFence()
    {
        // Segment with median 1.20 gets +15% → projected 1.38 > 1.30 IAAO high
        // fence. All 80 parcels count as exceptions after.
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 1.20m, cod: 15.0m, prd: 1.02m, parcels: 80, excCount: 5),
            (median: 0.95m, cod: 10.0m, prd: 1.00m, parcels: 40, excCount: 2));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":15.0}", "large increase"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Before: 5 + 2 = 7 exceptions
        Assert.Equal(7, preview.ExceptionsBefore);
        // After: first segment (1.20 × 1.15 = 1.38 > 1.30) contributes all 80 parcels;
        // second segment (0.95 × 1.15 = 1.0925, inside fence) keeps its 2 exceptions.
        Assert.Equal(82, preview.ExceptionsAfter);
    }

    [Fact]
    public async Task PreviewScenarioImpact_FlatDollarAdjustment_WithoutParcels_PreservesBeforeMetrics()
    {
        // When no parcel data backs the segments (no RuleDefinition tuples resolve
        // to actual Properties/Sales), the per-parcel recompute cannot run. The
        // preview must preserve the before-state rather than fabricate a shift.
        var (svc, _, studyId, cohortId) = await SeedStudyWithSegments(
            "{}",
            (median: 0.95m, cod: 12.0m, prd: 1.01m, parcels: 100, excCount: 5));

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyId, cohortId,
                ScenarioAdjustmentType.LandValueFlat, "{\"magnitude\":5000.0}", "flat"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // No parcels → no recompute → all after-metrics mirror before.
        Assert.Equal(preview.MedianRatioBefore, preview.MedianRatioAfter);
        Assert.Equal(preview.CodBefore,         preview.CodAfter);
        Assert.Equal(preview.PrdBefore,         preview.PrdAfter);
        Assert.Equal(preview.ExceptionsBefore,  preview.ExceptionsAfter);
    }

    [Fact]
    public async Task PreviewScenarioImpact_FlatDollarAdjustment_WithParcels_RecomputesFromShiftedRatios()
    {
        // Seed real Properties + Sales + CAMA so the derivation-style grouping
        // can resolve segments → parcels. 6 parcels, uniform AssessedValue=300k,
        // varying sale prices → varying pre-shift ratios. +$30,000 flat shift
        // moves every ratio up by (30_000 / price).
        var (ctx, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");

        var countyId = study.CountyId;
        decimal[] prices = { 280_000m, 290_000m, 300_000m, 310_000m, 320_000m, 330_000m };
        for (var i = 0; i < prices.Length; i++)
        {
            var pid = $"P{i}";
            ctx.Properties.Add(new Property
            {
                Id = Guid.NewGuid(), ParcelId = pid, ParcelNumber = pid,
                CountyId = countyId, TaxYear = 2026,
                AssessedValue = 300_000m, MarketValue = 300_000m,
                Neighborhood = "NBHD-A",
            });
            ctx.CamaCharacteristics.Add(new CamaCharacteristic
            {
                Id = Guid.NewGuid(), ParcelId = pid, TaxYear = 2026,
                BuildingType = "R1", QualityGrade = "STANDARD",
                SquareFeet = 1800m, CountyId = countyId,
                UpdatedAt = DateTime.UtcNow, UpdatedBy = "test",
            });
            ctx.ComparableSales.Add(new ComparableSale
            {
                Id = Guid.NewGuid(), CountyId = countyId, ParcelId = pid,
                SaleDate = new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
                SalePrice = prices[i], SalesYear = 2025,
                QualificationRecommendation = "qualified",
            });
        }

        // Segment with a RuleDefinition matching the seeded parcels.
        var segSet = new CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(), StudyId = study.StudyId, CountyId = countyId,
            Name = "Derived", SourceType = SegmentSetSourceType.Hybrid,
            Version = 1, IsBaseline = true, CreatedBy = "u1", UpdatedBy = "u1",
        };
        ctx.CountySegmentSets.Add(segSet);
        ctx.CountySegments.Add(new CountySegment
        {
            SegmentId = Guid.NewGuid(), SegmentSetId = segSet.SegmentSetId, CountyId = countyId,
            Name = "NBHD-A · R1 · STANDARD",
            SegmentType = SegmentType.Residential,
            RuleDefinition = JsonSerializer.Serialize(new
            {
                neighborhood = "NBHD-A", buildingType = "R1", qualityGrade = "STANDARD",
            }),
            ParcelCount = 6,
            MedianRatio = 1.00m, CoefficientOfDispersion = 5m,
            PriceRelatedDifferential = 1.00m, ExceptionCount = 0,
            StabilityScore = 95m, RiskScore = 20m,
        });

        var studyEntity = ctx.CountyStudySessions.First(s => s.StudyId == study.StudyId);
        studyEntity.ActiveSegmentSetId = segSet.SegmentSetId;
        await ctx.SaveChangesAsync();

        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "FlatDollar-Test",
                CohortSelectionType.Segment, "{}", 6, false), "u1");

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValueFlat, "{\"magnitude\":30000.0}", "real flat"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Every parcel shifts from 300k → 330k. Ratios move up proportional to
        // 30k / price — smaller sales price = bigger ratio bump.
        // Pre-shift median ratio ≈ 300k/305k ≈ 0.984; post-shift ≈ 330k/305k ≈ 1.082.
        Assert.True(preview.MedianRatioAfter > preview.MedianRatioBefore,
            $"median should rise after +$30k shift; got before={preview.MedianRatioBefore} after={preview.MedianRatioAfter}");
        Assert.InRange(preview.MedianRatioAfter, 1.05m, 1.15m);

        // Flat-dollar is NOT scale-invariant — COD changes. With identical
        // assessed values and spread prices, shifting by a constant compresses
        // dispersion (larger denominator on each ratio → tighter spread).
        // Exact direction depends on the sample; just verify it differs.
        Assert.NotEqual(preview.CodBefore, preview.CodAfter);
    }

    [Fact]
    public async Task PreviewScenarioImpact_CohortWithSegmentIds_UsesOnlyThoseSegments()
    {
        // Seed two segments. Cohort's Definition references only the first one.
        // Preview must aggregate over segment 1 only — NOT both.
        var (ctx, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var segSet = new TerraFusion.Core.Entities.CountySegmentSet
        {
            SegmentSetId = Guid.NewGuid(),
            StudyId = study.StudyId, CountyId = Guid.NewGuid(),
            Name = "Test", SourceType = TerraFusion.Core.Entities.SegmentSetSourceType.Hybrid,
            Version = 1, IsBaseline = true, CreatedBy = "u1", UpdatedBy = "u1",
        };
        ctx.CountySegmentSets.Add(segSet);

        var seg1Id = Guid.NewGuid();
        var seg2Id = Guid.NewGuid();
        ctx.CountySegments.AddRange(
            new TerraFusion.Core.Entities.CountySegment
            {
                SegmentId = seg1Id, SegmentSetId = segSet.SegmentSetId, CountyId = segSet.CountyId,
                Name = "seg1", SegmentType = TerraFusion.Core.Entities.SegmentType.Residential,
                ParcelCount = 50, MedianRatio = 1.00m,
                CoefficientOfDispersion = 10m, PriceRelatedDifferential = 1.00m, ExceptionCount = 1,
            },
            new TerraFusion.Core.Entities.CountySegment
            {
                SegmentId = seg2Id, SegmentSetId = segSet.SegmentSetId, CountyId = segSet.CountyId,
                Name = "seg2", SegmentType = TerraFusion.Core.Entities.SegmentType.Residential,
                ParcelCount = 50, MedianRatio = 0.50m,  // way off — would skew if included
                CoefficientOfDispersion = 30m, PriceRelatedDifferential = 0.80m, ExceptionCount = 40,
            });

        var studyEntity = ctx.CountyStudySessions.First(s => s.StudyId == study.StudyId);
        studyEntity.ActiveSegmentSetId = segSet.SegmentSetId;
        await ctx.SaveChangesAsync();

        // Cohort points at seg1Id only.
        var cohortDef = System.Text.Json.JsonSerializer.Serialize(new { segmentIds = new[] { seg1Id.ToString() } });
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "Seg1Only", CohortSelectionType.Segment,
                cohortDef, 50, false), "u1");

        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":5.0}", "test"), "u1");

        var preview = await svc.PreviewScenarioImpactAsync(scenario.ScenarioId);

        // Should see seg1's metrics only — not averaged with seg2.
        Assert.Equal(1.00m, preview.MedianRatioBefore, precision: 3);
        Assert.Equal(10m,   preview.CodBefore,         precision: 1);
        Assert.Equal(1,     preview.ExceptionsBefore);
    }

    // ── PromoteScenarioAsync ──────────────────────────────────────────────

    [Fact]
    public async Task PromoteScenario_Draft_ThrowsInvalidOperation()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "PromoteCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        // Draft scenario must not be promotable — workflow requires Save first
        var req = new PromoteScenarioRequest(scenario.ScenarioId, "{}");
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.PromoteScenarioAsync(req, "u1"));
        Assert.Contains("cannot be promoted", ex.Message);
    }

    [Fact]
    public async Task PromoteScenario_SavedStatus_CreatesAdjustmentSet()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "PromoteCohort", CohortSelectionType.Segment,
                "{}", 100, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        await svc.SaveScenarioAsync(scenario.ScenarioId, "u1"); // Draft → Saved

        var adjSet = await svc.PromoteScenarioAsync(
            new PromoteScenarioRequest(scenario.ScenarioId, "{\"scope\":\"county\"}"), "u1");

        Assert.Equal(scenario.ScenarioId, adjSet.ScenarioId);
        Assert.Equal("Proposed", adjSet.ApprovalState);
        Assert.NotEqual(Guid.Empty, adjSet.AdjustmentSetId);
    }

    // ── CreateExceptionSetAsync ───────────────────────────────────────────

    [Fact]
    public async Task CreateExceptionSet_PersistsWithCorrectStudy()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "ExcCohort", CohortSelectionType.Segment,
                "{}", 10, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        var req = new CreateCountyExceptionSetRequest(
            study.StudyId, scenario.ScenarioId,
            ExceptionReasonCode.Outlier,
            new List<string> { "parcel-1", "parcel-2" },
            ExceptionDestination.Dais);

        var result = await svc.CreateExceptionSetAsync(req, "u1");

        Assert.Equal(study.StudyId, result.StudyId);
        Assert.Equal(2, result.ParcelCount);
        Assert.Equal("Created", result.Status);
    }

    [Fact]
    public async Task CreateExceptionSet_WrongStudy_ThrowsInvalidOperation()
    {
        var (_, svc) = CreateSut();

        // Study A: the scenario lives here
        var studyA = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(studyA.StudyId, "CrossStudyCohort", CohortSelectionType.Segment,
                "{}", 5, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyA.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test rationale"), "u1");

        // Study B: the exception set claims to belong here (cross-study injection)
        var studyB = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u2");

        var req = new CreateCountyExceptionSetRequest(
            studyB.StudyId, scenario.ScenarioId, // mismatch!
            ExceptionReasonCode.Outlier,
            new List<string> { "parcel-x" },
            ExceptionDestination.Dossier);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.CreateExceptionSetAsync(req, "u1"));
    }

    // ── Task G: CompareScenarioImpact ─────────────────────────────────────

    [Fact]
    public async Task CompareScenarioImpact_ReturnsFourRows()
    {
        // Arrange: two saved scenarios in same study
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2025, StudyType.RatioStudy, "v1"), "test");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "All Residential", CohortSelectionType.Rule,
                "[]", 100, false), "test");

        var scenA = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":3.0}", "A"), "test");
        var scenB = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":5.0}", "B"), "test");

        // Act
        var result = await svc.CompareScenarioImpactAsync(scenA.ScenarioId, scenB.ScenarioId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Rows.Count); // Median Ratio, COD, PRD, Exceptions
        Assert.Equal("Median Ratio", result.Rows[0].MetricLabel);
        Assert.True(result.Rows.All(r => r.Winner is "A" or "B" or "Tie"));
    }

    [Fact]
    public async Task CompareScenarioImpact_ThrowsWhenDifferentStudies()
    {
        var (_, svc) = CreateSut();

        var studyA = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2025, StudyType.RatioStudy, null), "test");
        var studyB = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2025, StudyType.RatioStudy, null), "test");

        var cohortA = await svc.CreateCohortAsync(
            new CreateCohortRequest(studyA.StudyId, "CA", CohortSelectionType.Segment, "{}", 10, false), "test");
        var cohortB = await svc.CreateCohortAsync(
            new CreateCohortRequest(studyB.StudyId, "CB", CohortSelectionType.Segment, "{}", 10, false), "test");

        var scenA = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyA.StudyId, cohortA.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{}", "A"), "test");
        var scenB = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(studyB.StudyId, cohortB.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{}", "B"), "test");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => svc.CompareScenarioImpactAsync(scenA.ScenarioId, scenB.ScenarioId));
    }

    // ── Task F: Exception lifecycle ───────────────────────────────────────

    private async Task<(CountyStudyService svc, TerraFusion.Data.TerraFusionDbContext ctx, CountyExceptionSet exc)>
        SeedExceptionAsync(ExceptionReasonCode reason = ExceptionReasonCode.LowSample,
                           ExceptionDestination dest = ExceptionDestination.Dais)
    {
        var (ctx, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "ExcCohort", CohortSelectionType.Segment,
                "{}", 5, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.LandValuePercent, "{}", "test"), "u1");

        var exc = new CountyExceptionSet
        {
            StudyId = study.StudyId,
            SourceScenarioId = scenario.ScenarioId,
            CountyId = Guid.NewGuid(),
            ReasonCode = reason,
            ParcelCount = 5,
            Destination = dest,
            Status = ExceptionSetStatus.Created,
            CreatedBy = "test",
            UpdatedBy = "test"
        };
        ctx.CountyExceptionSets.Add(exc);
        await ctx.SaveChangesAsync();
        return (svc, ctx, exc);
    }

    [Fact]
    public async Task UpdateExceptionStatus_Dispatched_UpdatesStatusAndReturnsDto()
    {
        var (svc, _, exc) = await SeedExceptionAsync();

        var dto = await svc.UpdateExceptionStatusAsync(exc.ExceptionSetId, ExceptionSetStatus.Dispatched, "test-user");

        Assert.Equal("Dispatched", dto.Status);
        Assert.Equal("test", dto.CreatedBy); // CreatedBy unchanged
    }

    [Fact]
    public async Task AssignExceptionSet_SetsAssigneeName()
    {
        var (svc, _, exc) = await SeedExceptionAsync(ExceptionReasonCode.Outlier);

        var dto = await svc.AssignExceptionSetAsync(exc.ExceptionSetId, "Jane Assessor", "admin");

        Assert.Equal("Jane Assessor", dto.AssignedTo);
    }

    [Fact]
    public async Task AddExceptionNote_AppendsTimestampedEntry()
    {
        var (svc, _, exc) = await SeedExceptionAsync(ExceptionReasonCode.Heterogeneity);

        var dto = await svc.AddExceptionNoteAsync(exc.ExceptionSetId, "Needs field review", "admin");

        Assert.NotNull(dto.Notes);
        Assert.Contains("Needs field review", dto.Notes);
        Assert.Contains("admin", dto.Notes);
    }

    [Fact]
    public async Task UpsertDownstreamClosureReceipt_PersistsDraftReceipt()
    {
        var (svc, _, exc) = await SeedExceptionAsync(ExceptionReasonCode.LowSample, ExceptionDestination.Dais);

        var receipt = await svc.UpsertDownstreamClosureReceiptAsync(
            exc.ExceptionSetId,
            new UpsertDownstreamClosureReceiptRequest(
                Destination: "Dais",
                Template: "SegmentReview",
                SegmentId: exc.SourceScenarioId.ToString(),
                SegmentLabel: "Exception: Low Sample",
                Status: "Drafted"),
            "router");

        Assert.Equal(exc.ExceptionSetId, receipt.ExceptionSetId);
        Assert.Equal("Dais", receipt.Destination);
        Assert.Equal("Drafted", receipt.Status);
        Assert.Equal("router", receipt.UpdatedBy);

        var receipts = await svc.GetDownstreamClosureReceiptsAsync(exc.StudyId);
        Assert.Single(receipts);
    }

    [Fact]
    public async Task UpdateDownstreamClosureReceiptStatus_Returned_DoesNotResolveException()
    {
        var (svc, ctx, exc) = await SeedExceptionAsync(ExceptionReasonCode.Outlier, ExceptionDestination.Dossier);
        await svc.UpsertDownstreamClosureReceiptAsync(
            exc.ExceptionSetId,
            new UpsertDownstreamClosureReceiptRequest(
                Destination: "Dossier",
                Template: "SegmentEvidence",
                SegmentId: exc.SourceScenarioId.ToString(),
                SegmentLabel: "Exception: Outlier"),
            "router");

        var receipt = await svc.UpdateDownstreamClosureReceiptStatusAsync(
            exc.ExceptionSetId,
            DownstreamClosureReceiptStatus.Returned,
            "dossier");

        Assert.Equal("Returned", receipt.Status);
        var exception = await ctx.CountyExceptionSets.FindAsync(exc.ExceptionSetId);
        Assert.Equal(ExceptionSetStatus.Created, exception!.Status);
    }

    [Fact]
    public async Task UpsertDownstreamClosureReceipt_DraftedReopen_DoesNotDowngradeReturnedReceipt()
    {
        var (svc, _, exc) = await SeedExceptionAsync(ExceptionReasonCode.Outlier, ExceptionDestination.Dais);
        await svc.UpsertDownstreamClosureReceiptAsync(
            exc.ExceptionSetId,
            new UpsertDownstreamClosureReceiptRequest("Dais", "SegmentReview", exc.SourceScenarioId.ToString(), "Exception: Outlier", "Returned"),
            "dais");

        var reopened = await svc.UpsertDownstreamClosureReceiptAsync(
            exc.ExceptionSetId,
            new UpsertDownstreamClosureReceiptRequest("Dais", "SegmentReview", exc.SourceScenarioId.ToString(), "Exception: Outlier", "Drafted"),
            "router");

        Assert.Equal("Returned", reopened.Status);
    }

    // ── UpdateApprovalStateAsync — state machine unit tests ──────────────────

    /// <summary>
    /// Seeds a study → cohort → scenario → (save) → promote into Proposed state.
    /// Returns (svc, adjSetId) so state-machine tests can exercise transitions.
    /// </summary>
    private async Task<(CountyStudyService svc, Guid adjSetId)> SeedProposedAdjSetAsync()
    {
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2026, StudyType.RatioStudy, null), "u1");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "StateMachineCohort",
                CohortSelectionType.Segment, "{}", 100, false), "u1");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":2.5}", "StateMachineTest"), "u1");
        await svc.SaveScenarioAsync(scenario.ScenarioId, "u1");
        var adj = await svc.PromoteScenarioAsync(
            new PromoteScenarioRequest(scenario.ScenarioId, "{\"scope\":\"county\"}"), "u1");
        return (svc, adj.AdjustmentSetId);
    }

    [Fact]
    public async Task UpdateApprovalState_Proposed_To_ReadyForApproval_Succeeds()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();

        var dto = await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");

        Assert.Equal("ReadyForApproval", dto.ApprovalState);
        Assert.Null(dto.ApprovedBy);
    }

    [Fact]
    public async Task UpdateApprovalState_ReadyForApproval_To_Approved_SetsApprovedBy()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");

        var dto = await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "reviewer");

        Assert.Equal("Approved", dto.ApprovalState);
        Assert.Equal("reviewer", dto.ApprovedBy);
    }

    [Fact]
    public async Task UpdateApprovalState_Approved_To_Published_Throws()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "u1");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Published, "u1"));
    }

    [Fact]
    public async Task UpdateApprovalState_ReadyForApproval_SendBack_To_Proposed_Succeeds()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");

        // Send-back: ReadyForApproval → Proposed is a legal transition.
        var dto = await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Proposed, "u1");

        Assert.Equal("Proposed", dto.ApprovalState);
    }

    [Fact]
    public async Task UpdateApprovalState_Approved_To_RolledBack_Throws()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "u1");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.RolledBack, "u1"));
    }

    [Fact]
    public async Task UpdateApprovalState_IllegalSkip_Proposed_To_Published_Throws()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();

        // Direct jump from Proposed → Published is illegal (must go through RFA → Approved first).
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Published, "u1"));
    }

    [Fact]
    public async Task UpdateApprovalState_Approved_To_Proposed_IllegalReversal_Throws()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "u1");

        // Approved is terminal in County Studio. Send-back is allowed only before approval.
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Proposed, "u1"));
    }

    [Fact]
    public async Task UpdateApprovalState_NotFound_ThrowsInvalidOperation()
    {
        var (_, svc) = CreateSut();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpdateApprovalStateAsync(Guid.NewGuid(), AdjustmentSetApprovalState.ReadyForApproval, "u1"));
    }

    [Fact]
    public async Task UpsertApplyHandoffReceipt_PersistsPreparedReceipt()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "reviewer");

        var receipt = await svc.UpsertApplyHandoffReceiptAsync(
            adjId,
            new UpsertAdjustmentApplyReceiptRequest("Prepared", "AdjustmentApplyPacket"),
            "router");

        Assert.Equal(adjId, receipt.AdjustmentSetId);
        Assert.Equal("Prepared", receipt.Status);
        Assert.Equal("AdjustmentApplyPacket", receipt.Template);
    }

    [Fact]
    public async Task UpsertApplyHandoffReceipt_AppliedExternally_RequiresEvidenceRef()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "reviewer");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.UpsertApplyHandoffReceiptAsync(
                adjId,
                new UpsertAdjustmentApplyReceiptRequest("AppliedExternally", "AdjustmentApplyPacket"),
                "dossier"));
    }

    [Fact]
    public async Task UpsertApplyHandoffReceipt_PreparedReopen_DoesNotDowngradeAppliedExternally()
    {
        var (svc, adjId) = await SeedProposedAdjSetAsync();
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.ReadyForApproval, "u1");
        await svc.UpdateApprovalStateAsync(adjId, AdjustmentSetApprovalState.Approved, "reviewer");

        await svc.UpsertApplyHandoffReceiptAsync(
            adjId,
            new UpsertAdjustmentApplyReceiptRequest(
                "AppliedExternally",
                "AdjustmentApplyPacket",
                "apply-evidence-001",
                "Governed apply lane reported completion."),
            "dossier");

        var reopened = await svc.UpsertApplyHandoffReceiptAsync(
            adjId,
            new UpsertAdjustmentApplyReceiptRequest("Prepared", "AdjustmentApplyPacket"),
            "router");

        Assert.Equal("AppliedExternally", reopened.Status);
        Assert.Equal("apply-evidence-001", reopened.EvidenceRef);
    }

    // ── Evidence Packet (Task H) ──────────────────────────────────────────────

    [Fact]
    public async Task EvidencePacket_FreshStudy_HasNoExceptions()
    {
        // Arrange: study with no exception sets
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2025, StudyType.RatioStudy, null), "test");

        // Act: GetExceptionSetsAsync is what the evidence-packet endpoint calls
        var exceptions = await svc.GetExceptionSetsAsync(study.StudyId);

        // Assert: no exceptions for a fresh study
        Assert.Empty(exceptions);
    }

    [Fact]
    public async Task EvidencePacket_StudyWithScenario_ReturnsScenarioDetails()
    {
        // Arrange: study + cohort + scenario
        var (_, svc) = CreateSut();
        var study = await svc.CreateStudyAsync(
            new CreateStudyRequest(Guid.NewGuid().ToString(), 2025, StudyType.RatioStudy, null), "test");
        var cohort = await svc.CreateCohortAsync(
            new CreateCohortRequest(study.StudyId, "EvidenceCohort",
                CohortSelectionType.Segment, "{}", 100, false), "test");
        var scenario = await svc.CreateScenarioAsync(
            new CreateScenarioRequest(study.StudyId, cohort.CohortId,
                ScenarioAdjustmentType.TotalValuePercent, "{\"magnitude\":3.5}",
                "Calibrated to market trend"), "test");

        // Act: GetScenariosAsync returns the scenario the packet will include
        var scenarios = await svc.GetScenariosAsync(study.StudyId);

        // Assert
        Assert.Single(scenarios);
        var s = scenarios[0];
        Assert.Equal(scenario.ScenarioId, s.ScenarioId);
        Assert.Equal("Calibrated to market trend", s.Rationale);
    }
}
