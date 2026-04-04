using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using CanonicalComparableSale = TerraFusion.Core.Entities.ComparableSale;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave39;

/// <summary>
/// R2Wave39 — IAAO ratio study statistics in CalculateSalesComparisonAsync.
///
/// Fixes verified:
///   WF39-01: Ratio computation uses PacsComputedRatio (sl_ratio), not SalePrice/SalePrice=1.0
///   WF39-02: Disqualified sales are excluded from ratio statistics
///   WF39-03: COD computed correctly (Mean(|r - median|/median) × 100)
///   WF39-04: PRD computed correctly (ArithMean / WeightedMean)
///   WF39-05: PRD = 0.0 when fewer than 2 qualified sales with ratios
///   WF39-06: QualifiedSaleCount reflects only "qualified" EffectiveQualification
///   WF39-07: Sales without PacsComputedRatio are excluded from ratio stats (not counted)
///   WF39-08: Single qualified sale → ratioMedian = that ratio, COD = 0, PRD = 0
/// </summary>
[Trait("Category", "R2Wave39")]
[Trait("Category", "IAAORatioStats")]
public sealed class R2Wave39RatioStudyStatsTests
{
    private static readonly Guid BentonCountyId = Guid.NewGuid();
    private const string SubjectParcelId = "SUBJECT-001";   // subject property — excluded from comps query
    // Comparable sale parcels: different IDs so they are NOT excluded by cs.ParcelId != parcelId
    private static string CompParcelId() => $"COMP-{Guid.NewGuid().ToString("N")[..8]}";

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

    private static ValuationService CreateService(DataDbContext db)
        => new(db, NullLogger<ValuationService>.Instance, new Mock<IOlsRegressionService>().Object);

    private static async Task SeedBaseDataAsync(DataDbContext db, int taxYear = 2025)
    {
        db.Counties.Add(new County { Id = BentonCountyId, Name = "Benton", State = "WA", FipsCode = "003" });
        db.Properties.Add(new Property
        {
            Id           = Guid.NewGuid(),
            ParcelId     = SubjectParcelId,
            ParcelNumber = SubjectParcelId,
            CountyId     = BentonCountyId,
            Address      = "123 Test St",
            PropertyType = "residential",
        });
        await db.SaveChangesAsync();
    }

    private static async Task<CanonicalComparableSale> SeedSaleAsync(
        DataDbContext db,
        decimal salePrice,
        decimal? pacsRatio,
        string qualification = "qualified",   // EffectiveQualification
        bool hasDecision = false,
        DateTime? saleDate = null)
    {
        // Sales must use a parcel DIFFERENT from the subject; the service filters cs.ParcelId != parcelId.
        // Sale date must be within taxYear-2 … taxYear window (2023-2025 for taxYear=2025).
        var sale = new CanonicalComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = CompParcelId(),               // ← different parcel
            SaleDate                    = saleDate ?? new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            AdjustedSalePrice           = salePrice,
            PacsComputedRatio           = pacsRatio,
            PropertyType                = "residential",
            CountyId                    = BentonCountyId,
            IngestedBy                  = "wave39-test",
            QualificationRecommendation = hasDecision ? null : qualification,
            QualificationDecision       = hasDecision ? qualification : null,
            DecisionSource              = hasDecision ? "AssessorOverride" : null,
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-01: PacsComputedRatio is used (not 1.0 stub)
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_01_SalesRatioMedian_Uses_PacsComputedRatio()
    {
        using var db = CreateDbContext(nameof(WF39_01_SalesRatioMedian_Uses_PacsComputedRatio));
        await SeedBaseDataAsync(db);

        // 3 qualified sales with distinct known ratios: 0.90, 0.95, 1.00
        await SeedSaleAsync(db, 300_000, pacsRatio: 0.90m);
        await SeedSaleAsync(db, 320_000, pacsRatio: 0.95m);
        await SeedSaleAsync(db, 350_000, pacsRatio: 1.00m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        // Median of [0.90, 0.95, 1.00] = 0.95
        result.SalesRatioMedian.Should().BeApproximately(0.95, 0.001,
            because: "median of [0.90, 0.95, 1.00] is 0.95");
        result.SalesRatioMedian.Should().NotBe(1.0,
            because: "1.0 would indicate the stub ratio (price/price) is still used");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-02: Disqualified sales excluded from ratio stats
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_02_DisqualifiedSales_Excluded_From_RatioStats()
    {
        using var db = CreateDbContext(nameof(WF39_02_DisqualifiedSales_Excluded_From_RatioStats));
        await SeedBaseDataAsync(db);

        // 2 qualified: ratios 0.90, 0.95
        await SeedSaleAsync(db, 300_000, pacsRatio: 0.90m, qualification: "qualified");
        await SeedSaleAsync(db, 320_000, pacsRatio: 0.95m, qualification: "qualified");
        // 1 non-arms-length with extreme ratio — MUST NOT pollute stats
        await SeedSaleAsync(db, 100_000, pacsRatio: 2.50m, qualification: "non-arms-length");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        // Only 2 qualified; median of [0.90, 0.95] = 0.90 (lower half index)
        result.QualifiedSaleCount.Should().Be(2);
        result.SalesRatioMedian.Should().BeLessThan(1.5,
            because: "disqualified 2.50 ratio must not pollute the median");
    }

    [Fact]
    public async Task WF39_02b_AssessorOverride_Qualified_IsIncluded()
    {
        using var db = CreateDbContext(nameof(WF39_02b_AssessorOverride_Qualified_IsIncluded));
        await SeedBaseDataAsync(db);

        // Sale with assessor DECISION = "qualified" (Layer 3 override)
        await SeedSaleAsync(db, 300_000, pacsRatio: 0.88m, qualification: "qualified", hasDecision: true);
        await SeedSaleAsync(db, 280_000, pacsRatio: 0.92m, qualification: "qualified");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.QualifiedSaleCount.Should().Be(2,
            because: "qualificationDecision='qualified' (Layer 3) counts as qualified");
    }

    [Fact]
    public async Task WF39_02c_AssessorOverride_Disqualified_IsExcluded()
    {
        using var db = CreateDbContext(nameof(WF39_02c_AssessorOverride_Disqualified_IsExcluded));
        await SeedBaseDataAsync(db);

        // Engine says qualified but assessor overrode to non-arms-length
        await SeedSaleAsync(db, 300_000, pacsRatio: 2.20m, qualification: "non-arms-length", hasDecision: true);
        await SeedSaleAsync(db, 280_000, pacsRatio: 0.95m, qualification: "qualified");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.QualifiedSaleCount.Should().Be(1,
            because: "assessor decision 'non-arms-length' overrides recommendation and excludes from ratio stats");
        result.SalesRatioMedian.Should().BeApproximately(0.95, 0.001);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-03: COD computed correctly
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_03_COD_ComputedCorrectly()
    {
        using var db = CreateDbContext(nameof(WF39_03_COD_ComputedCorrectly));
        await SeedBaseDataAsync(db);

        // Known ratios: 0.80, 0.90, 1.00, 1.10, 1.20
        // Median = 1.00
        // Deviations: |0.80-1.00|/1.00=0.20, |0.90-1.00|/1.00=0.10, 0, 0.10, 0.20
        // Mean deviation = 0.12 → COD = 12.0%
        await SeedSaleAsync(db, 100_000, pacsRatio: 0.80m);
        await SeedSaleAsync(db, 200_000, pacsRatio: 0.90m);
        await SeedSaleAsync(db, 300_000, pacsRatio: 1.00m);
        await SeedSaleAsync(db, 400_000, pacsRatio: 1.10m);
        await SeedSaleAsync(db, 500_000, pacsRatio: 1.20m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.SalesRatioMedian.Should().BeApproximately(1.00, 0.001);
        result.CoefficientOfDispersion.Should().BeApproximately(12.0, 0.5,
            because: "COD = Mean(|r - 1.00| / 1.00) × 100 = 12%");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-04: PRD computed correctly
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_04_PRD_ComputedCorrectly()
    {
        using var db = CreateDbContext(nameof(WF39_04_PRD_ComputedCorrectly));
        await SeedBaseDataAsync(db);

        // Ratios: 0.90 on $200k, 1.10 on $400k
        // ArithMean = (0.90 + 1.10) / 2 = 1.00
        // AssessedValues: 0.90 × 200000 = 180000; 1.10 × 400000 = 440000
        // SumAssessed = 620000; SumPrices = 600000
        // WeightedMean = 620000 / 600000 ≈ 1.0333
        // PRD = 1.00 / 1.0333 ≈ 0.9677
        await SeedSaleAsync(db, 200_000, pacsRatio: 0.90m);
        await SeedSaleAsync(db, 400_000, pacsRatio: 1.10m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.PriceRelatedDifferential.Should().BeApproximately(0.9677, 0.005,
            because: "PRD = arithmetic mean / weighted mean = 1.00 / 1.0333 ≈ 0.9677");
    }

    [Fact]
    public async Task WF39_04b_PRD_Near1_0_For_Uniform_Assessment()
    {
        using var db = CreateDbContext(nameof(WF39_04b_PRD_Near1_0_For_Uniform_Assessment));
        await SeedBaseDataAsync(db);

        // All ratios = 1.00 on different prices → PRD must be 1.00 (perfectly uniform)
        await SeedSaleAsync(db, 100_000, pacsRatio: 1.00m);
        await SeedSaleAsync(db, 300_000, pacsRatio: 1.00m);
        await SeedSaleAsync(db, 500_000, pacsRatio: 1.00m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.PriceRelatedDifferential.Should().BeApproximately(1.00, 0.001,
            because: "uniform ratios → no price-related bias → PRD = 1.00");
        result.CoefficientOfDispersion.Should().BeApproximately(0.0, 0.001,
            because: "uniform ratios → COD = 0");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-05: PRD = 0 when insufficient data
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_05_PRD_Zero_When_InsufficientData()
    {
        using var db = CreateDbContext(nameof(WF39_05_PRD_Zero_When_InsufficientData));
        await SeedBaseDataAsync(db);
        // Only 1 qualified sale — PRD requires ≥2
        await SeedSaleAsync(db, 300_000, pacsRatio: 0.95m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.PriceRelatedDifferential.Should().Be(0.0,
            because: "PRD requires at least 2 qualified sales");
        result.CoefficientOfDispersion.Should().Be(0.0,
            because: "COD requires at least 2 qualified sales");
    }

    [Fact]
    public async Task WF39_05b_NoSales_AllStatsZero()
    {
        using var db = CreateDbContext(nameof(WF39_05b_NoSales_AllStatsZero));
        await SeedBaseDataAsync(db);
        // No sales at all

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.SalesRatioMedian.Should().Be(0.0);
        result.CoefficientOfDispersion.Should().Be(0.0);
        result.PriceRelatedDifferential.Should().Be(0.0);
        result.QualifiedSaleCount.Should().Be(0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-06: QualifiedSaleCount counts correctly
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_06_QualifiedSaleCount_Correct()
    {
        using var db = CreateDbContext(nameof(WF39_06_QualifiedSaleCount_Correct));
        await SeedBaseDataAsync(db);

        await SeedSaleAsync(db, 300_000, pacsRatio: 0.95m, qualification: "qualified");
        await SeedSaleAsync(db, 310_000, pacsRatio: 0.97m, qualification: "qualified");
        await SeedSaleAsync(db, 200_000, pacsRatio: 1.50m, qualification: "non-arms-length");
        await SeedSaleAsync(db, 150_000, pacsRatio: 0.40m, qualification: "foreclosure");
        await SeedSaleAsync(db, 250_000, null,             qualification: "qualified"); // no ratio

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        // 3 qualified effective, but only 2 have PacsComputedRatio > 0
        result.QualifiedSaleCount.Should().Be(3,
            because: "3 sales have EffectiveQualification='qualified', regardless of PacsComputedRatio availability");
        // Ratio stats use only 2 (the ones with actual ratios)
        result.SalesRatioMedian.Should().BeGreaterThan(0.0,
            because: "2 qualified sales have PacsComputedRatio");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-07: Sales without PacsComputedRatio excluded from ratio stats
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_07_NullPacsRatio_ExcludedFromStats_NotCounting()
    {
        using var db = CreateDbContext(nameof(WF39_07_NullPacsRatio_ExcludedFromStats_NotCounting));
        await SeedBaseDataAsync(db);

        await SeedSaleAsync(db, 300_000, pacsRatio: 0.90m, qualification: "qualified");
        await SeedSaleAsync(db, 300_000, pacsRatio: 0.95m, qualification: "qualified");
        // Qualified but no PACS ratio — counted in QualifiedSaleCount but not stats
        await SeedSaleAsync(db, 300_000, pacsRatio: null,  qualification: "qualified");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.QualifiedSaleCount.Should().Be(3);
        // Median only from 2 sales [0.90, 0.95]; sorted[count/2] = sorted[1] = 0.95
        result.SalesRatioMedian.Should().BeApproximately(0.95, 0.001,
            because: "only 2 ratios available; median of [0.90, 0.95] at index 1 = 0.95; null PacsComputedRatio excluded");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF39-08: Single qualified sale
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_08_SingleQualifiedSale_HasMedianNoCodNoPrd()
    {
        using var db = CreateDbContext(nameof(WF39_08_SingleQualifiedSale_HasMedianNoCodNoPrd));
        await SeedBaseDataAsync(db);

        await SeedSaleAsync(db, 300_000, pacsRatio: 0.93m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.SalesRatioMedian.Should().BeApproximately(0.93, 0.001);
        result.CoefficientOfDispersion.Should().Be(0.0,
            because: "COD undefined for n=1");
        result.PriceRelatedDifferential.Should().Be(0.0,
            because: "PRD undefined for n=1");
        result.QualifiedSaleCount.Should().Be(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IAAO standard compliance check (documentation test)
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF39_IAAO_Standards_Documented_In_Result()
    {
        using var db = CreateDbContext(nameof(WF39_IAAO_Standards_Documented_In_Result));
        await SeedBaseDataAsync(db);

        // Build a "good" assessment scenario meeting IAAO standards
        // COD target: < 15% residential; PRD target: 0.98–1.03; Median: 0.90–1.10
        await SeedSaleAsync(db, 200_000, pacsRatio: 0.96m);
        await SeedSaleAsync(db, 250_000, pacsRatio: 0.98m);
        await SeedSaleAsync(db, 300_000, pacsRatio: 1.00m);
        await SeedSaleAsync(db, 350_000, pacsRatio: 1.02m);
        await SeedSaleAsync(db, 400_000, pacsRatio: 1.04m);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, CancellationToken.None);

        result.SalesRatioMedian.Should().BeInRange(0.90, 1.10,
            because: "IAAO standard: median ratio 0.90–1.10");
        result.CoefficientOfDispersion.Should().BeLessThan(15.0,
            because: "IAAO standard: COD < 15% for residential");
        result.PriceRelatedDifferential.Should().BeInRange(0.98, 1.03,
            because: "IAAO standard: PRD 0.98–1.03 (no vertical inequity)");
        result.QualifiedSaleCount.Should().Be(5);
    }
}
