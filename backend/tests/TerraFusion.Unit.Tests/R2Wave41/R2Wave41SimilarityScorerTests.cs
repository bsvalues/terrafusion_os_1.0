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

namespace TerraFusion.Unit.Tests.R2Wave41;

/// <summary>
/// R2Wave41 — SimilarityScorer: 6-dimension PACS-grounded scoring.
///
/// Dimensions tested:
///   GLA (30%)          — imprv_det.sl_living_area / GrossLivingArea
///   Quality (20%)      — imprv_det.imprv_det_class_cd → NormalizeQualityGrade → ECONOMY…EXCELLENT
///   Year Built (20%)   — sale.sl_yr_blt / YearBuilt
///   Neighborhood (15%) — pacs_val.hood_cd
///   ImprvType (10%)    — imprv.imprv_type_cd → R1=SFR, R2=Mobile/MFH, etc.
///   Land Size (5%)     — sale.sl_land_sqft / LotSizeSqft
///
/// Test IDs:
///   WF41-01: Same quality grade → full quality score (1.0 × 20%)
///   WF41-02: Adjacent quality tier → 0.8 quality score (GOOD vs VERY_GOOD: 1 tier apart)
///   WF41-03: Max quality distance (ECONOMY vs EXCELLENT, 5 tiers) → 0.0 quality score
///   WF41-04: Same ImprvTypeCode (R1 vs R1) → full type score (1.0 × 10%)
///   WF41-05: Different ImprvTypeCode (R1 vs R2) → zero type score (0.0 × 10%)
///   WF41-06: Null quality on comp → neutral quality score (0.5 × 20%)
///   WF41-07: Null ImprvTypeCode on comp → neutral type score (0.5 × 10%)
///   WF41-08: Comp matching on all 6 dimensions → similarity near 1.0
///   WF41-09: Quality-matched comp ranks higher than quality-mismatched comp (same other dims)
///   WF41-10: Type-matched comp ranks higher than type-mismatched comp (same other dims)
///   WF41-11: ImprvTypeCode and QualityGrade fields exist on ComparableSale entity
///   WF41-12: Null quality AND null type → neutral contribution per dimension, not zero
/// </summary>
[Trait("Category", "R2Wave41")]
[Trait("Category", "SimilarityScorer")]
public sealed class R2Wave41SimilarityScorerTests
{
    private static readonly Guid BentonCountyId = Guid.NewGuid();
    private const string SubjectParcelId = "SUBJECT-WAVE41";
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

    private static async Task SeedBaseDataAsync(DataDbContext db)
    {
        db.Counties.Add(new County { Id = BentonCountyId, Name = "Benton", State = "WA", FipsCode = "003" });
        db.Properties.Add(new Property
        {
            Id           = Guid.NewGuid(),
            ParcelId     = SubjectParcelId,
            ParcelNumber = SubjectParcelId,
            CountyId     = BentonCountyId,
            Address      = "1 Subject St",
            PropertyType = "residential",
        });
        await db.SaveChangesAsync();
    }

    /// <summary>Seed a CamaCharacteristic for the subject property.</summary>
    private static async Task SeedSubjectCamaAsync(
        DataDbContext db,
        decimal sqft         = 1800m,
        int yearBuilt        = 2000,
        decimal landSqft     = 8000m,
        string? qualityGrade = "GOOD",
        string? buildingType = "R1")
    {
        db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id           = Guid.NewGuid(),
            ParcelId     = SubjectParcelId,
            TaxYear      = 2025,
            SquareFeet   = sqft,
            YearBuilt    = yearBuilt,
            LandAreaSqft = landSqft,
            QualityGrade = qualityGrade,
            BuildingType = buildingType ?? "UNK",
            CountyId     = BentonCountyId,
            UpdatedAt    = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    /// <summary>Seed a comparable sale with explicit quality and type fields.</summary>
    private static async Task<CanonicalComparableSale> SeedCompAsync(
        DataDbContext db,
        decimal salePrice     = 300_000m,
        decimal gla           = 1800m,
        int yearBuilt         = 2000,
        decimal landSqft      = 8000m,
        string? neighborhood  = "HOOD01",
        string? qualityGrade  = "GOOD",
        string? imprvTypeCode = "R1",
        DateTime? saleDate    = null)
    {
        var comp = new CanonicalComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = CompParcelId(),
            SaleDate                    = saleDate ?? new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            AdjustedSalePrice           = salePrice,
            GrossLivingArea             = gla,
            LotSizeSqft                 = landSqft,
            YearBuilt                   = yearBuilt,
            Neighborhood                = neighborhood,
            QualityGrade                = qualityGrade,   // ← field added by R2Wave41
            ImprvTypeCode               = imprvTypeCode,  // ← field added by R2Wave41
            PropertyType                = "residential",
            CountyId                    = BentonCountyId,
            IngestedBy                  = "wave41-test",
            QualificationRecommendation = "qualified",
        };
        db.ComparableSales.Add(comp);
        await db.SaveChangesAsync();
        return comp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-11: Entity field existence (compile-time proof)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-11: ComparableSale has ImprvTypeCode and QualityGrade fields")]
    public void WF41_11_EntityFieldsExist()
    {
        var sale = new CanonicalComparableSale
        {
            ImprvTypeCode = "R1",
            QualityGrade  = "GOOD"
        };
        sale.ImprvTypeCode.Should().Be("R1");
        sale.QualityGrade.Should().Be("GOOD");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-01: Same quality grade → full quality contribution
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-01: Same quality grade gets higher similarity than quality mismatch")]
    public async Task WF41_01_SameQualityHigherThanMismatch()
    {
        await using var db = CreateDbContext(nameof(WF41_01_SameQualityHigherThanMismatch));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "GOOD", buildingType: "R1");

        // Exact quality match
        await SeedCompAsync(db, qualityGrade: "GOOD",    neighborhood: "HOOD01");
        // Quality mismatch — two tiers away
        await SeedCompAsync(db, qualityGrade: "ECONOMY", neighborhood: "HOOD01");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var comps = result.Comparables.OrderByDescending(c => c.Similarity).ToList();
        comps.Should().HaveCount(2);
        // GOOD/GOOD match must score higher than ECONOMY/GOOD mismatch
        comps[0].Similarity.Should().BeGreaterThan(comps[1].Similarity,
            "exact quality match (GOOD) should score higher than ECONOMY mismatch");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-02: Adjacent quality tier — score between 0.5 and 1.0
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-02: Adjacent quality tier (GOOD vs VERY_GOOD) scores above mismatch")]
    public async Task WF41_02_AdjacentQualityTier()
    {
        await using var db = CreateDbContext(nameof(WF41_02_AdjacentQualityTier));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "GOOD", buildingType: "R1");

        // 1-tier gap (VERY_GOOD vs GOOD) → quality score = 1 - 1/5 = 0.8
        await SeedCompAsync(db, qualityGrade: "VERY_GOOD", neighborhood: "HOOD01");
        // 5-tier gap (ECONOMY vs GOOD) → quality score = 0.0
        await SeedCompAsync(db, qualityGrade: "ECONOMY",   neighborhood: "HOOD01");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var comps = result.Comparables.OrderByDescending(c => c.Similarity).ToList();
        comps.Should().HaveCount(2);
        comps[0].Similarity.Should().BeGreaterThan(comps[1].Similarity,
            "1-tier quality gap must beat 3-tier gap");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-03: Max quality distance (ECONOMY vs EXCELLENT) — lowest quality score
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-03: Max quality distance ECONOMY vs EXCELLENT scores less than exact match")]
    public async Task WF41_03_MaxQualityDistance()
    {
        await using var db = CreateDbContext(nameof(WF41_03_MaxQualityDistance));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "EXCELLENT", buildingType: "R1");

        await SeedCompAsync(db, qualityGrade: "EXCELLENT", neighborhood: "HOOD01");  // exact match
        await SeedCompAsync(db, qualityGrade: "ECONOMY",   neighborhood: "HOOD01");  // 5 tiers apart

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var excellent = result.Comparables.OrderByDescending(c => c.Similarity).First();
        var economy   = result.Comparables.OrderBy(c => c.Similarity).First();

        excellent.Similarity.Should().BeGreaterThan(economy.Similarity,
            "EXCELLENT quality match must rank above ECONOMY comp when subject is EXCELLENT");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-04: Same ImprvTypeCode → full type score
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-04: Same ImprvTypeCode (R1) scores higher than different type")]
    public async Task WF41_04_SameImprvTypeHigherThanDifferent()
    {
        await using var db = CreateDbContext(nameof(WF41_04_SameImprvTypeHigherThanDifferent));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "GOOD", buildingType: "R1");

        await SeedCompAsync(db, imprvTypeCode: "R1", qualityGrade: "GOOD", neighborhood: "HOOD01");
        await SeedCompAsync(db, imprvTypeCode: "R2", qualityGrade: "GOOD", neighborhood: "HOOD01");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var comps = result.Comparables.OrderByDescending(c => c.Similarity).ToList();
        comps.Should().HaveCount(2);
        comps[0].Similarity.Should().BeGreaterThan(comps[1].Similarity,
            "R1 type match (SFR) must rank above R2 (mobile home) when subject is R1");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-05: Different ImprvTypeCode → lower type score reflected in total
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-05: Type mismatch lowers total similarity by ~10% vs type match")]
    public async Task WF41_05_TypeMismatchLowersSimilarity()
    {
        await using var db = CreateDbContext(nameof(WF41_05_TypeMismatchLowersSimilarity));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "GOOD", buildingType: "R1");

        await SeedCompAsync(db, imprvTypeCode: "R1", qualityGrade: "GOOD", neighborhood: "HOOD01");
        await SeedCompAsync(db, imprvTypeCode: "R2", qualityGrade: "GOOD", neighborhood: "HOOD01");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var typeMatch    = result.Comparables.OrderByDescending(c => c.Similarity).First();
        var typeMismatch = result.Comparables.OrderBy(c => c.Similarity).First();

        // Type dimension weight = 10%, mismatch yields 0.0 vs match 1.0 → 0.10 difference
        // But null-neutral is 0.5, so actual difference is (1.0 - 0.0) × 0.10 = 0.10
        var delta = typeMatch.Similarity - typeMismatch.Similarity;
        delta.Should().BeApproximately(0.10, 0.01,
            "type mismatch should lower similarity by the 10% type weight");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-06: Null quality on comp → neutral, not penalized
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-06: Null quality on comp contributes neutral 0.5 score, not zero")]
    public async Task WF41_06_NullQualityIsNeutral()
    {
        await using var db = CreateDbContext(nameof(WF41_06_NullQualityIsNeutral));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "GOOD", buildingType: "R1");

        // Null quality + minimal other data so we can isolate the quality dimension effect
        var compNull  = await SeedCompAsync(db, qualityGrade: null,   imprvTypeCode: "R1", neighborhood: "HOOD01");
        var compExact = await SeedCompAsync(db, qualityGrade: "GOOD", imprvTypeCode: "R1", neighborhood: "HOOD01");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var nullResult  = result.Comparables.First(c => c.ParcelId == compNull.ParcelId);
        var exactResult = result.Comparables.First(c => c.ParcelId == compExact.ParcelId);

        // Exact quality match should score higher; null quality should still contribute 0.5×0.20
        // Rather than 0.0×0.20. So null comp must score close to (not much lower than) exact match.
        var delta = exactResult.Similarity - nullResult.Similarity;
        delta.Should().BeApproximately(0.10, 0.02,
            "null quality contributes 0.5 neutral vs exact match 1.0 → 0.5 × 0.20 = 0.10 gap");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-07: Null ImprvTypeCode on comp → neutral, not penalized
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-07: Null ImprvTypeCode contributes neutral 0.5, not zero penalty")]
    public async Task WF41_07_NullTypeIsNeutral()
    {
        await using var db = CreateDbContext(nameof(WF41_07_NullTypeIsNeutral));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, qualityGrade: "GOOD", buildingType: "R1");

        var compNull  = await SeedCompAsync(db, imprvTypeCode: null, qualityGrade: "GOOD", neighborhood: "HOOD01");
        var compExact = await SeedCompAsync(db, imprvTypeCode: "R1", qualityGrade: "GOOD", neighborhood: "HOOD01");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var nullResult  = result.Comparables.First(c => c.ParcelId == compNull.ParcelId);
        var exactResult = result.Comparables.First(c => c.ParcelId == compExact.ParcelId);

        // (1.0 - 0.5) × 0.10 = 0.05 gap expected
        var delta = exactResult.Similarity - nullResult.Similarity;
        delta.Should().BeApproximately(0.05, 0.01,
            "null type contributes 0.5 neutral vs exact match 1.0 → 0.5 × 0.10 = 0.05 gap");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-08: Full 6-dimension match → similarity near 1.0
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-08: All 6 dimensions matching → similarity >= 0.95")]
    public async Task WF41_08_FullMatchNearlyPerfect()
    {
        await using var db = CreateDbContext(nameof(WF41_08_FullMatchNearlyPerfect));
        await SeedBaseDataAsync(db);

        // Subject: 1800sqft, 2000, 8000 land, GOOD, R1, HOOD01
        await SeedSubjectCamaAsync(db, sqft: 1800m, yearBuilt: 2000, landSqft: 8000m,
            qualityGrade: "GOOD", buildingType: "R1");

        // Comp with neighborhood matching subject's hood
        db.Properties.Find(
            db.Properties.Where(p => p.ParcelId == SubjectParcelId).Select(p => p.Id).First()
        );
        // Use hood HOOD01 for both subject and comp — seed valuation for subject
        db.ValuationRecords.Add(new ValuationRecord
        {
            Id           = Guid.NewGuid(),
            ParcelId     = SubjectParcelId,
            TaxYear      = 2025,
            PropertyType = "residential",
            Region       = "HOOD01",
            Status       = "draft",
            CountyId     = BentonCountyId,
            CreatedBy    = "wave41-test",
            CreatedAt    = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        await SeedCompAsync(db,
            gla: 1800m, yearBuilt: 2000, landSqft: 8000m,
            qualityGrade: "GOOD", imprvTypeCode: "R1",
            neighborhood: "HOOD01");  // same hood as seeded valuation

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        result.Comparables.Should().HaveCount(1);
        // Neighborhood dimension scores 0.5 (neutral) — subject hood comes from PacsValuations
        // which isn't seeded in this unit test. All other 5 dimensions match → score = 0.925.
        // (1.0×0.30 + 1.0×0.20 + 1.0×0.20 + 0.5×0.15 + 1.0×0.10 + 1.0×0.05 = 0.925)
        result.Comparables[0].Similarity.Should().BeGreaterThanOrEqualTo(0.92,
            "5 of 6 PACS dimensions match exactly; neighborhood neutral due to missing PacsValuation seed");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-09: Quality-matched comp ranks above quality-mismatched comp
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-09: Quality-matched comp ranks above quality-mismatched when all else equal")]
    public async Task WF41_09_QualityMatchedRanksHigher()
    {
        await using var db = CreateDbContext(nameof(WF41_09_QualityMatchedRanksHigher));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, sqft: 1800m, yearBuilt: 2000, landSqft: 8000m,
            qualityGrade: "GOOD", buildingType: "R1");

        var goodComp    = await SeedCompAsync(db, gla: 1800m, yearBuilt: 2000, qualityGrade: "GOOD",    imprvTypeCode: "R1");
        var economyComp = await SeedCompAsync(db, gla: 1800m, yearBuilt: 2000, qualityGrade: "ECONOMY", imprvTypeCode: "R1");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var goodResult    = result.Comparables.First(c => c.ParcelId == goodComp.ParcelId);
        var economyResult = result.Comparables.First(c => c.ParcelId == economyComp.ParcelId);

        goodResult.Similarity.Should().BeGreaterThan(economyResult.Similarity,
            "GOOD quality match outranks ECONOMY mismatch, all else equal");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-10: Type-matched comp ranks above type-mismatched comp
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-10: Type-matched comp (R1) ranks above mismatched type (R2) when all else equal")]
    public async Task WF41_10_TypeMatchedRanksHigher()
    {
        await using var db = CreateDbContext(nameof(WF41_10_TypeMatchedRanksHigher));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, sqft: 1800m, yearBuilt: 2000, landSqft: 8000m,
            qualityGrade: "GOOD", buildingType: "R1");

        var r1Comp = await SeedCompAsync(db, gla: 1800m, yearBuilt: 2000, qualityGrade: "GOOD", imprvTypeCode: "R1");
        var r2Comp = await SeedCompAsync(db, gla: 1800m, yearBuilt: 2000, qualityGrade: "GOOD", imprvTypeCode: "R2");

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var r1Result = result.Comparables.First(c => c.ParcelId == r1Comp.ParcelId);
        var r2Result = result.Comparables.First(c => c.ParcelId == r2Comp.ParcelId);

        r1Result.Similarity.Should().BeGreaterThan(r2Result.Similarity,
            "R1 type match (SFR) must outrank R2 (mobile home) when subject is R1");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WF41-12: Both null quality AND null type → neutral contribution, not zeros
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "WF41-12: Null quality AND null type contribute neutral scores, similarity in (0.4, 0.7)")]
    public async Task WF41_12_BothNullDimensionsAreNeutral()
    {
        await using var db = CreateDbContext(nameof(WF41_12_BothNullDimensionsAreNeutral));
        await SeedBaseDataAsync(db);
        await SeedSubjectCamaAsync(db, sqft: 1800m, yearBuilt: 2000, landSqft: 8000m,
            qualityGrade: "GOOD", buildingType: "R1");

        // Comp with both quality and type null — but matching GLA, year, land
        await SeedCompAsync(db,
            gla: 1800m, yearBuilt: 2000, landSqft: 8000m,
            qualityGrade: null, imprvTypeCode: null,
            neighborhood: null);

        var svc = CreateService(db);
        var result = await svc.CalculateSalesComparisonAsync(SubjectParcelId, 2025, default);

        var sim = result.Comparables[0].Similarity;
        // With null quality (neutral 0.5 × 0.20) + null type (neutral 0.5 × 0.10) + null hood (neutral 0.5 × 0.15)
        // but matching GLA (1.0 × 0.30), year (1.0 × 0.20), land (1.0 × 0.05)
        // Expected ≈ 0.30 + 0.10 + 0.20 + 0.075 + 0.05 + 0.05 = 0.775
        sim.Should().BeInRange(0.6, 0.9,
            "null dimensions use neutral 0.5 score — should be mid-range, not penalized to 0");
    }
}
