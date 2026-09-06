// Slice 1.5 — ratio study endpoint
//
// Verifies:
//   GET /api/terraforge/ratio-study
//     1.  Empty DB → total 0, countWithRatio 0, all stats null
//     2.  Population filter: only QualificationDecision="qualified" OR
//         (QualificationDecision null AND QualificationRecommendation="qualified")
//     3.  SuppressOnRatioRptCd="T" excluded from population
//     4.  IncludeNoCalc=true excluded from population
//     5.  County isolation — different CountyId excluded
//     6.  SalesYear filter — wrong year excluded; date-window fallback included
//     7.  countWithRatio counts only rows where PacsComputedRatio > 0
//     8.  medianRatio = AVG(lower two rows) for even set (normalized 0–1)
//     9.  COD formula: mean|ratio - median| / median × 100, on trimmed population
//    10.  Outlier trimming: row outside IQR fence excluded from stats but NOT items
//    11.  Pagination: page 2 with pageSize 1 returns second row only
//    12.  Items sorted by SaleDate descending

using System.Text.Json;
using System.Threading;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Sync.Doctrine;
using Xunit;
using Task = System.Threading.Tasks.Task;
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;

namespace TerraFusion.API.Tests.TerraForge;

/// <summary>
/// Unit tests for TerraForgeController.GetRatioStudy (Slice 1.5).
///
/// Population rule:
///   QualificationDecision = "qualified"
///   OR (QualificationDecision null AND QualificationRecommendation = "qualified")
///   AND SuppressOnRatioRptCd != "T"
///   AND IncludeNoCalc != true
///
/// Ratio: PacsComputedRatio / 100  (PACS stores 0–100; API normalises to 0–1).
/// IAAO stats computed on IQR-trimmed population (Tukey fence: Q1−1.5×IQR … Q3+1.5×IQR).
/// All rows (including outliers) appear in paginated detail items.
/// </summary>
public sealed class RatioStudyTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.NewGuid();

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;
    private readonly Mock<IRatioQualificationPolicy> _ratioPolicy;

    public RatioStudyTests()
    {
        _db  = TestDbContextFactory.CreateInMemoryContext();
        var resolver = ControllerTestSetup.CountyResolverFor(BentonId);
        _ratioPolicy = new Mock<IRatioQualificationPolicy>();
        _ratioPolicy
            .Setup(policy => policy.EvaluateAsync(
                It.IsAny<string>(),
                "DOR_RATIO",
                It.IsAny<int>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string county, string study, int year, string? code, CancellationToken _) =>
                new RatioPolicyEvaluation(
                    Reviewed: !string.IsNullOrWhiteSpace(code),
                    Qualified: code == "00",
                    Code: code,
                    StudyName: study,
                    RuleId: Guid.NewGuid(),
                    EvidenceSource: "test-doctrine"));
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(),
            Mock.Of<ISaleQualificationService>(),
            resolver,
            ControllerTestSetup.CountyContextProviderFor(BentonId),
            ratioQualificationPolicy: _ratioPolicy.Object)
        {
            ControllerContext = ControllerTestSetup.WithCountyClaim(BentonId),
        };
    }

    public void Dispose() => _db.Dispose();

    // ── Helper ─────────────────────────────────────────────────────────────

    private ComparableSale MakeSale(
        Guid?     countyId              = null,
        int?      salesYear             = 2026,
        DateTime? saleDate              = null,
        decimal   salePrice             = 300_000m,
        string?   recommendation        = "qualified",
        string?   decision              = null,
        decimal?  pacsComputedRatio     = 95m,          // 0–100 scale (PACS raw)
        string?   suppressOnRatioRptCd  = null,
        bool?     includeNoCalc         = null)
    {
        return new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = countyId ?? BentonId,
            ParcelId                    = $"10000{Random.Shared.Next(10000, 99999)}",
            SaleDate                    = saleDate ?? new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = salesYear,
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            PacsComputedRatio           = pacsComputedRatio,
            SuppressOnRatioRptCd        = suppressOnRatioRptCd,
            IncludeNoCalc               = includeNoCalc,
        };
    }

    private void Seed(params ComparableSale[] sales)
    {
        _db.ComparableSales.AddRange(sales);
        _db.SaveChanges();
    }

    /// <summary>
    /// Seeds a canonical Property so TerraForgeController.GetAssessedValueMapAsync
    /// can compute AssessedValue / SalePrice ratios for the given parcel.
    /// </summary>
    private void SeedProperty(string parcelNumber, int taxYear, decimal assessedValue)
    {
        _db.Properties.Add(new Property
        {
            Id            = Guid.NewGuid(),
            ParcelNumber  = parcelNumber,
            CountyId      = BentonId,
            TaxYear       = taxYear,
            AssessedValue = assessedValue,
            MarketValue   = assessedValue,
        });
        _db.SaveChanges();
    }

    private static JsonElement Body(IActionResult result)
    {
        var ok   = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        return JsonDocument.Parse(json).RootElement;
    }

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetRatioStudy_EmptyDb_ReturnsTotalZero()
    {
        var result = await _sut.GetRatioStudy(taxYear: 2026);
        var body   = Body(result);

        Assert.Equal(0, body.GetProperty("total").GetInt32());
        Assert.Equal(0, body.GetProperty("countWithRatio").GetInt32());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("stats").GetProperty("medianRatio").ValueKind);
    }

    [Fact]
    public async Task GetRatioStudy_PopulationFilter_RecommendationFallback_Included()
    {
        // No decision set — recommendation alone qualifies.
        Seed(MakeSale(recommendation: "qualified", decision: null));

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_PopulationFilter_DecisionWins_NonQualifiedRecommendation_Excluded()
    {
        // Decision="qualified" wins over a non-qualified recommendation.
        Seed(
            MakeSale(recommendation: "non-arms-length", decision: "qualified"),
            MakeSale(recommendation: "qualified", decision: "non-arms-length")  // excluded
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        // Only the first (decision="qualified") should be in population.
        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_SuppressOnRatioRptCd_T_Excluded()
    {
        Seed(
            MakeSale(),                               // included
            MakeSale(suppressOnRatioRptCd: "T")      // excluded
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_IncludeNoCalc_True_Excluded()
    {
        Seed(
            MakeSale(),                         // included
            MakeSale(includeNoCalc: true)       // excluded
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_CountyIsolation_OtherCountyExcluded()
    {
        Seed(
            MakeSale(countyId: BentonId),
            MakeSale(countyId: OtherCountyId)
        );

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_DateWindowFallback_NullSalesYearInWindow_Included()
    {
        // taxYear=2026 → lookback 2024-01-01 to 2026-01-01
        Seed(MakeSale(
            salesYear: null,
            saleDate: new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc)));

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_DateWindowFallback_NullSalesYearOutsideWindow_Excluded()
    {
        Seed(MakeSale(
            salesYear: null,
            saleDate: new DateTime(2023, 6, 1, 0, 0, 0, DateTimeKind.Utc)));

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(0, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_CountWithRatio_OnlyPositiveRatios()
    {
        // TerraFusion computes ratios from canonical Properties (AssessedValue / SalePrice).
        // Only the first sale has a matching Property → only it contributes to countWithRatio.
        var saleWithProp = MakeSale();
        var saleNoProp1  = MakeSale();
        var saleNoProp2  = MakeSale();
        Seed(saleWithProp, saleNoProp1, saleNoProp2);
        SeedProperty(saleWithProp.ParcelId!, taxYear: 2026, assessedValue: 285_000m);

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        Assert.Equal(3, body.GetProperty("total").GetInt32());
        Assert.Equal(1, body.GetProperty("countWithRatio").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_MedianRatio_NormalisedFrom0To1()
    {
        // TF computes ratio = AssessedValue / SalePrice.
        // 270k / 300k = 0.90 and 330k / 300k = 1.10 → median = (0.90 + 1.10) / 2 = 1.00
        var sale1 = MakeSale(salePrice: 300_000m);
        var sale2 = MakeSale(salePrice: 300_000m);
        Seed(sale1, sale2);
        SeedProperty(sale1.ParcelId!, taxYear: 2026, assessedValue: 270_000m);
        SeedProperty(sale2.ParcelId!, taxYear: 2026, assessedValue: 330_000m);

        var body   = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var median = body.GetProperty("stats").GetProperty("medianRatio").GetDouble();

        Assert.Equal(1.00, median, precision: 3);
    }

    // ── Chunk 2 / April-15 Phase A1: tierSlope + tierMedians ──────────────────

    [Fact]
    public async Task GetRatioStudy_TierStats_Null_WhenSampleTooSmall()
    {
        // Fewer than 5 rows → backend returns null for tierSlope and tierMedians.
        // Frontend uses this to render "insufficient data" tooltips instead of pretending
        // zero is real.
        var sales = new ComparableSale[4];
        for (var i = 0; i < 4; i++)
        {
            sales[i] = MakeSale(salePrice: 300_000m + i * 10_000m);
            Seed(sales[i]);
            SeedProperty(sales[i].ParcelId!, 2026, assessedValue: 285_000m);
        }

        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var stats = body.GetProperty("stats");

        Assert.Equal(JsonValueKind.Null, stats.GetProperty("tierSlope").ValueKind);
        Assert.Equal(JsonValueKind.Null, stats.GetProperty("tierMedians").ValueKind);
    }

    [Fact]
    public async Task GetRatioStudy_TierSlope_Computed_WhenSample_AtLeast5()
    {
        // 8 rows spanning a price range. Uniform ratios ≈ 0.95 so tierSlope ≈ 0
        // (no regressivity). Assert slope is present (not null) and has a small
        // absolute value — exact value depends on floating-point noise so we allow
        // a reasonable band around zero.
        for (var i = 0; i < 8; i++)
        {
            var price   = 200_000m + i * 50_000m;
            var sale    = MakeSale(salePrice: price);
            Seed(sale);
            SeedProperty(sale.ParcelId!, 2026, assessedValue: price * 0.95m);
        }

        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var stats = body.GetProperty("stats");

        Assert.Equal(JsonValueKind.Number, stats.GetProperty("tierSlope").ValueKind);
        var tierSlope = stats.GetProperty("tierSlope").GetDouble();
        Assert.InRange(Math.Abs(tierSlope), 0.0, 0.05); // uniform ratios → near-zero slope
    }

    [Fact]
    public async Task GetRatioStudy_TierMedians_AllQuartilesPopulated_WhenSample_AtLeast8()
    {
        // 12 rows in ascending price order. Ratios vary across quartiles:
        // q1 (lowest 3): 0.85, 0.87, 0.90  → median 0.87
        // q2 (next 3):   0.92, 0.94, 0.95  → median 0.94
        // q3 (next 3):   0.96, 0.97, 0.98  → median 0.97
        // q4 (highest 3):0.99, 1.00, 1.02  → median 1.00
        double[] ratios = { 0.85, 0.87, 0.90, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.02 };
        for (var i = 0; i < ratios.Length; i++)
        {
            var price = 100_000m + i * 50_000m;
            var sale  = MakeSale(salePrice: price);
            Seed(sale);
            SeedProperty(sale.ParcelId!, 2026, assessedValue: price * (decimal)ratios[i]);
        }

        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var stats = body.GetProperty("stats");
        var tm    = stats.GetProperty("tierMedians");

        Assert.Equal(JsonValueKind.Object, tm.ValueKind);
        // Quartile medians computed on price-sorted ratios — these are the exact
        // middle-element medians for 3-element strata.
        Assert.Equal(0.87, tm.GetProperty("q1").GetDouble(), precision: 4);
        Assert.Equal(0.94, tm.GetProperty("q2").GetDouble(), precision: 4);
        Assert.Equal(0.97, tm.GetProperty("q3").GetDouble(), precision: 4);
        Assert.Equal(1.00, tm.GetProperty("q4").GetDouble(), precision: 4);

        // Ratios rise with price → tierSlope should be positive (progressivity).
        var tierSlope = stats.GetProperty("tierSlope").GetDouble();
        Assert.True(tierSlope > 0, $"expected positive tierSlope for rising-ratio sample, got {tierSlope}");
    }

    [Fact]
    public async Task GetRatioStudy_TierSlope_EqualsPrb_WhenBothComputed()
    {
        // By design, tierSlope and prb are the same OLS β₁ (ratio on ln(salePrice)).
        // Frontend renders them under different labels; backend computes once.
        for (var i = 0; i < 8; i++)
        {
            var price = 200_000m + i * 40_000m;
            var sale  = MakeSale(salePrice: price);
            Seed(sale);
            SeedProperty(sale.ParcelId!, 2026, assessedValue: price * 0.9m);
        }

        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var stats = body.GetProperty("stats");

        var prb       = stats.GetProperty("prb").GetDouble();
        var tierSlope = stats.GetProperty("tierSlope").GetDouble();
        Assert.Equal(prb, tierSlope, precision: 4);
    }

    // ── V1a: sample-size adequacy advisory ─────────────────────────────────
    //
    // Thresholds under test are the TerraFusion internal operating policy
    // (adequate >= 30, marginal 10–29, insufficient 1–9, noRatioData / unavailable
    // for empty samples). They are NOT asserted as IAAO §5.2 compliance; the
    // response labels them "terraFusionPolicy" with explicit thresholds.

    [Fact]
    public async Task GetRatioStudy_SampleSizeAdvisory_EmptyDb_Unavailable_NeverThrows()
    {
        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));

        var adv = body.GetProperty("sampleSizeAdequacy");
        Assert.Equal("unavailable", adv.GetProperty("state").GetString());
        Assert.False(adv.GetProperty("ratioDataAvailable").GetBoolean());
        Assert.True(adv.GetProperty("advisoryOnly").GetBoolean());
        Assert.Equal("terraFusionPolicy", adv.GetProperty("policy").GetString());
        Assert.Equal(30, adv.GetProperty("thresholds").GetProperty("adequateFloor").GetInt32());
        Assert.Equal(10, adv.GetProperty("thresholds").GetProperty("marginalFloor").GetInt32());
        // Stats still truthful-null on empty sample.
        Assert.Equal(JsonValueKind.Null, body.GetProperty("stats").GetProperty("medianRatio").ValueKind);
    }

    [Fact]
    public async Task GetRatioStudy_SampleSizeAdvisory_SalesWithoutRatios_NoRatioData()
    {
        // Qualified sales exist but no Property rows → countWithRatio 0.
        Seed(MakeSale(), MakeSale());

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var adv  = body.GetProperty("sampleSizeAdequacy");

        Assert.Equal(2, adv.GetProperty("qualifiedSales").GetInt32());
        Assert.Equal(0, adv.GetProperty("countWithRatio").GetInt32());
        Assert.Equal("noRatioData", adv.GetProperty("state").GetString());
        Assert.False(adv.GetProperty("ratioDataAvailable").GetBoolean());
    }

    [Fact]
    public async Task GetRatioStudy_SampleSizeAdvisory_ClassifiesThresholds()
    {
        async Task<string> StateForCount(int n)
        {
            // Reset the in-memory store between classifications.
            _db.ComparableSales.RemoveRange(_db.ComparableSales);
            _db.Properties.RemoveRange(_db.Properties);
            _db.SaveChanges();

            for (var i = 0; i < n; i++)
            {
                var price = 200_000m + i * 1_000m;
                var sale  = MakeSale(salePrice: price);
                Seed(sale);
                SeedProperty(sale.ParcelId!, 2026, assessedValue: price * 0.95m);
            }
            var body = Body(await _sut.GetRatioStudy(taxYear: 2026));
            return body.GetProperty("sampleSizeAdequacy").GetProperty("state").GetString()!;
        }

        Assert.Equal("insufficient", await StateForCount(1));
        Assert.Equal("insufficient", await StateForCount(9));
        Assert.Equal("marginal",     await StateForCount(10));
        Assert.Equal("marginal",     await StateForCount(29));
        Assert.Equal("adequate",     await StateForCount(30));
    }

    [Fact]
    public async Task GetRatioStudy_SampleSizeAdvisory_NeverAltersExistingStatistics()
    {
        // 12-row sample with known stats; advisory must be additive only.
        double[] ratios = { 0.85, 0.87, 0.90, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.02 };
        for (var i = 0; i < ratios.Length; i++)
        {
            var price = 100_000m + i * 50_000m;
            var sale  = MakeSale(salePrice: price);
            Seed(sale);
            SeedProperty(sale.ParcelId!, 2026, assessedValue: price * (decimal)ratios[i]);
        }

        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var stats = body.GetProperty("stats");

        // Existing statistic values unchanged (same assertions as the pre-V1a tests).
        Assert.Equal(0.87, stats.GetProperty("tierMedians").GetProperty("q1").GetDouble(), precision: 4);
        Assert.Equal(1.00, stats.GetProperty("tierMedians").GetProperty("q4").GetDouble(), precision: 4);
        Assert.Equal(12, body.GetProperty("countWithRatio").GetInt32());

        // Advisory block agrees with counts and is marked marginal (10–29).
        var adv = body.GetProperty("sampleSizeAdequacy");
        Assert.Equal("marginal", adv.GetProperty("state").GetString());
        Assert.Equal(12, adv.GetProperty("countWithRatio").GetInt32());
    }

    [Fact]
    public async Task GetRatioStudy_SampleSizeAdvisory_CountyIsolation_OtherCountyExcluded()
    {
        var foreign = MakeSale(countyId: OtherCountyId);
        Seed(foreign);
        SeedProperty(foreign.ParcelId!, 2026, assessedValue: 285_000m);

        var body = Body(await _sut.GetRatioStudy(taxYear: 2026));
        var adv  = body.GetProperty("sampleSizeAdequacy");

        Assert.Equal(0, adv.GetProperty("qualifiedSales").GetInt32());
        Assert.Equal("unavailable", adv.GetProperty("state").GetString());
    }

    [Fact]
    public async Task GetRatioStudyReadiness_UsesDorPolicy_ReadOnlyAndCountyScoped()
    {
        _db.Counties.Add(new County
        {
            Id = BentonId,
            Name = "Benton",
            State = "WA",
            FipsCode = "53005",
        });

        var qualified = MakeSale();
        qualified.RawRatioTypeCd = "00";
        var unqualified = MakeSale();
        unqualified.RawRatioTypeCd = "10";
        var foreign = MakeSale(countyId: OtherCountyId);
        foreign.RawRatioTypeCd = "00";
        Seed(qualified, unqualified, foreign);

        var body = Body(await _sut.GetRatioStudyReadiness(taxYear: 2026));

        Assert.Equal("Benton", body.GetProperty("county").GetString());
        Assert.Equal("benton-wa", body.GetProperty("countySlug").GetString());
        Assert.Equal("DOR_RATIO", body.GetProperty("studyName").GetString());
        Assert.Equal("qualifiedSalesObserved", body.GetProperty("state").GetString());
        Assert.Equal("present", body.GetProperty("policyCoverage").GetString());
        Assert.Equal(2, body.GetProperty("candidateSales").GetInt32());
        Assert.Equal(2, body.GetProperty("reviewedSales").GetInt32());
        Assert.Equal(1, body.GetProperty("qualifiedSales").GetInt32());
        Assert.Equal(0, body.GetProperty("unreviewedSales").GetInt32());
        Assert.True(body.GetProperty("advisoryOnly").GetBoolean());
        Assert.False(body.GetProperty("certificationClaim").GetBoolean());

        _ratioPolicy.Verify(policy => policy.EvaluateAsync(
            "benton-wa",
            "DOR_RATIO",
            2026,
            It.IsAny<string?>(),
            It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task GetRatioStudy_Pagination_Page2ReturnsSecondItem()
    {
        // Two sales on different dates so sort order is deterministic
        var early = MakeSale(saleDate: new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var later = MakeSale(saleDate: new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        Seed(early, later);

        // page=2, pageSize=1 → second item (by SaleDate desc = early sale)
        var body  = Body(await _sut.GetRatioStudy(taxYear: 2026, page: 2, pageSize: 1));
        var items = body.GetProperty("items");

        Assert.Equal(1, items.GetArrayLength());
        // Sorted desc → page 1 = later, page 2 = early
        Assert.Equal(early.Id.ToString(), items[0].GetProperty("saleId").GetString());
    }
}
