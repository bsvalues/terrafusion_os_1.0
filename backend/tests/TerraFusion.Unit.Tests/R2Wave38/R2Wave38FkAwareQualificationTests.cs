using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using CanonicalComparableSale = TerraFusion.Core.Entities.ComparableSale;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave38;

/// <summary>
/// R2Wave38 — FK-aware sale qualification via <see cref="SaleQualificationService.ComputeRecommendationsAsync"/>.
///
/// Purpose:
///   Verify that the service reads dbo.sale_ratio_type (invalid_sale flag) and
///   dbo.county_ratio_code (ratio_desc) from the DB and uses them to qualify
///   sales — instead of relying on hardcoded string guesses against raw codes.
///
/// Invariants under test:
///   WF38-01: sale_ratio_type.invalid_sale=true → non-arms-length regardless of descriptor
///   WF38-02: sale_ratio_type.invalid_sale=false → qualified by DOR
///   WF38-03: county_ratio_code.ratio_desc containing "QUAL" → qualified
///   WF38-04: county_ratio_code.ratio_desc containing "UNQUAL" → non-arms-length
///   WF38-05: county_ratio_code.ratio_desc containing "FORECLOS" → foreclosure
///   WF38-06: county_ratio_code.ratio_desc containing "ESTATE" → estate
///   WF38-07: county_ratio_code.ratio_desc containing "EXCLUDE" → excluded
///   WF38-08: Layer priority — county code (Layer 2) wins over ratio type (Layer 2b)
///   WF38-09: Empty lookup tables → falls through to Layer 3/4/5
///   WF38-10: RecommendationVersion = "1.1" after FK-aware recompute
///   WF38-11: RecommendationReason cites FK layers correctly
///   WF38-12: unknown county ratio desc → conservative non-arms-length
/// </summary>
[Trait("Category", "R2Wave38")]
[Trait("Category", "FkAwareQualification")]
public sealed class R2Wave38FkAwareQualificationTests
{
    private static readonly Guid BentonCountyId = Guid.NewGuid();

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

    private static async Task SeedCountyAsync(DataDbContext db)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
        {
            db.Counties.Add(new County { Id = BentonCountyId, Name = "Benton", State = "WA", FipsCode = "003" });
            await db.SaveChangesAsync();
        }
    }

    private static async Task<CanonicalComparableSale> SeedSaleAsync(
        DataDbContext db,
        string? rawQualifier    = null,
        string? countyRatioCd   = null,
        string? ratioTypeCd     = null,
        string? excludeCalcCd   = null,
        string? wacCd           = null)
    {
        var sale = new CanonicalComparableSale
        {
            Id               = Guid.NewGuid(),
            ParcelId         = $"P-{Guid.NewGuid().ToString("N")[..6]}",
            SaleDate         = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice        = 400_000m,
            PropertyType     = "residential",
            CountyId         = BentonCountyId,
            IngestedBy       = "wave38-test",
            RawSaleQualifier = rawQualifier,
            RawCountyRatioCd = countyRatioCd,
            RawRatioTypeCd   = ratioTypeCd,
            RawExcludeCalcCd = excludeCalcCd,
            RawWacCd         = wacCd,
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-01 / WF38-02 — sale_ratio_type.invalid_sale flag
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_01_InvalidSaleFlag_True_YieldsNonArmsLength()
    {
        using var db = CreateDbContext(nameof(WF38_01_InvalidSaleFlag_True_YieldsNonArmsLength));
        await SeedCountyAsync(db);

        // Seed a PACS ratio type with invalid_sale = true
        db.SaleRatioTypes.Add(new SaleRatioType
        {
            SlRatioTypeCd = "99",
            SlRatioDesc   = "Related Party",
            InvalidSale   = true,
            RequiresReason = false,
        });

        // Sale with this DOR code, no county code, no raw qualifier
        var sale = await SeedSaleAsync(db, ratioTypeCd: "99");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be("non-arms-length");
    }

    [Fact]
    public async Task WF38_02_InvalidSaleFlag_False_YieldsQualified()
    {
        using var db = CreateDbContext(nameof(WF38_02_InvalidSaleFlag_False_YieldsQualified));
        await SeedCountyAsync(db);

        // Seed a PACS ratio type with invalid_sale = false (DOR-approved qualified sale)
        db.SaleRatioTypes.Add(new SaleRatioType
        {
            SlRatioTypeCd = "00",
            SlRatioDesc   = "Arms Length",
            InvalidSale   = false,
            RequiresReason = false,
        });

        var sale = await SeedSaleAsync(db, ratioTypeCd: "00");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be("qualified");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-03..07 — county_ratio_code.ratio_desc classification
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("BC-Q",  "Qualified Sale",               "qualified")]
    [InlineData("BC-U",  "Unqualified - Related Party",  "non-arms-length")]
    [InlineData("BC-N",  "NON-QUALIFIED TRANSFER",       "non-arms-length")]
    [InlineData("BC-F",  "FORECLOSURE / BANK OWNED",     "foreclosure")]
    [InlineData("BC-E",  "ESTATE SALE",                  "estate")]
    [InlineData("BC-X",  "EXCLUDED FROM STUDY",          "excluded")]
    public async Task WF38_03_07_CountyRatioCodeDesc_ClassifiesCorrectly(
        string code, string desc, string expected)
    {
        var testName = $"WF38_{code.Replace("-", "_")}_{expected}";
        using var db = CreateDbContext(testName);
        await SeedCountyAsync(db);

        db.CountyRatioCodes.Add(new CountyRatioCode { RatioCd = code, RatioDesc = desc });

        // Sale uses only the county ratio code (no DOR code, no raw qualifier)
        var sale = await SeedSaleAsync(db, countyRatioCd: code);
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be(expected,
            because: $"County code '{code}' has description '{desc}'");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-08 — Layer priority: county code (L2) wins over ratio type (L2b)
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_08_Layer2_WinsOver_Layer2b()
    {
        using var db = CreateDbContext(nameof(WF38_08_Layer2_WinsOver_Layer2b));
        await SeedCountyAsync(db);

        // DOR says invalid, but county has its OWN "Qualified" code — L2 wins
        db.SaleRatioTypes.Add(new SaleRatioType
        {
            SlRatioTypeCd = "99",
            SlRatioDesc   = "Related Party",
            InvalidSale   = true,
            RequiresReason = false,
        });
        db.CountyRatioCodes.Add(new CountyRatioCode
        {
            RatioCd   = "QC",
            RatioDesc = "County Verified Qualified",
        });

        // Sale has both: county code QC AND DOR code 99 (invalid by DOR)
        var sale = await SeedSaleAsync(db, countyRatioCd: "QC", ratioTypeCd: "99");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        // Layer 2 (county code) wins → "qualified", despite DOR saying invalid
        refreshed!.QualificationRecommendation.Should().Be("qualified",
            because: "county_ratio_code (Layer 2) takes priority over sale_ratio_type (Layer 2b)");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-09 — Empty lookup tables → falls through to Layer 3/4/5
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_09_EmptyLookupTables_FallThroughToLayer3()
    {
        using var db = CreateDbContext(nameof(WF38_09_EmptyLookupTables_FallThroughToLayer3));
        await SeedCountyAsync(db);
        // No SaleRatioTypes or CountyRatioCodes seeded

        // Sale has an ExcludeCalcCd only
        var sale = await SeedSaleAsync(db, excludeCalcCd: "X");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().StartWith("excluded",
            because: "no lookup data → Layer 3 exclusion flag applies");
    }

    [Fact]
    public async Task WF38_09b_EmptyLookupTables_NoFlags_YieldsQualifiedDefault()
    {
        using var db = CreateDbContext(nameof(WF38_09b_EmptyLookupTables_NoFlags_YieldsQualifiedDefault));
        await SeedCountyAsync(db);
        // No lookup tables, no codes on the sale → Layer 5 default

        var sale = await SeedSaleAsync(db); // all nulls
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be("qualified",
            because: "Layer 5 default — no disqualifying codes");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-10 — RecommendationVersion = "1.1" after FK-aware recompute
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_10_RecommendationVersion_Is_1_1_After_FkRecompute()
    {
        using var db = CreateDbContext(nameof(WF38_10_RecommendationVersion_Is_1_1_After_FkRecompute));
        await SeedCountyAsync(db);
        var sale = await SeedSaleAsync(db);
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.RecommendationVersion.Should().Be("1.1",
            because: "FK-aware recompute bumps version to 1.1");
        refreshed.RecommendationSource.Should().Be("TerraFusionRuleEngine");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-11 — RecommendationReason cites the correct FK layer
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_11_RecommendationReason_Cites_CountyRatioFk_ForLayer2()
    {
        using var db = CreateDbContext(nameof(WF38_11_RecommendationReason_Cites_CountyRatioFk_ForLayer2));
        await SeedCountyAsync(db);

        db.CountyRatioCodes.Add(new CountyRatioCode { RatioCd = "AQ", RatioDesc = "Qualified Arm's Length" });
        var sale = await SeedSaleAsync(db, countyRatioCd: "AQ");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.RecommendationReason.Should().Contain("Layer 2",
            because: "Layer 2 (county_ratio_code FK) was the deciding factor");
        refreshed.RecommendationReason.Should().Contain("AQ",
            because: "reason should include the code");
    }

    [Fact]
    public async Task WF38_11b_RecommendationReason_Cites_DorRatioFk_ForLayer2b()
    {
        using var db = CreateDbContext(nameof(WF38_11b_RecommendationReason_Cites_DorRatioFk_ForLayer2b));
        await SeedCountyAsync(db);

        db.SaleRatioTypes.Add(new SaleRatioType
        {
            SlRatioTypeCd = "01",
            SlRatioDesc   = "Arm's Length",
            InvalidSale   = false,
            RequiresReason = false,
        });
        var sale = await SeedSaleAsync(db, ratioTypeCd: "01");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.RecommendationReason.Should().Contain("Layer 2b",
            because: "Layer 2b (sale_ratio_type.invalid_sale FK) was the deciding factor");
        refreshed.RecommendationReason.Should().Contain("01");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-12 — Unknown county ratio desc → conservative non-arms-length
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_12_UnknownCountyRatioDesc_IsConservativelyNonArmsLength()
    {
        using var db = CreateDbContext(nameof(WF38_12_UnknownCountyRatioDesc_IsConservativelyNonArmsLength));
        await SeedCountyAsync(db);

        // A code exists in the DB but has an ambiguous description
        db.CountyRatioCodes.Add(new CountyRatioCode
        {
            RatioCd   = "ZZ",
            RatioDesc = "Legacy Code - See Auditor Notes",
        });
        var sale = await SeedSaleAsync(db, countyRatioCd: "ZZ");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be("non-arms-length",
            because: "unknown description with no recognized keyword → conservative default");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Batch correctness — multiple sales, each gets the right classification
    // ═══════════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-13 — Sync-time fast path: live-confirmed Benton pacs_oltp codes
    //
    // Regression for the bug where the sync-time Qualify() fallback returned
    // "non-arms-length" for ANY non-empty county ratio code when the lookup table
    // was not loaded.
    //
    // Live pacs_oltp query 2026-04-04 (GROUP BY sl_county_ratio_cd on 425,251 rows):
    //   '100' → 21,715 occurrences — county_ratio_code.ratio_desc = "Valid Sale"
    //   '0'   →    219 occurrences — county_ratio_code.ratio_desc = "VALID SALE"
    //   '200' → 10,445 occurrences — "Invalid Sale"
    //   '01'+'02' DO NOT EXIST in live data (prior doc reference was wrong)
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("100", "qualified")]           // Benton: Valid Sale (primary — 21,715 sales)
    [InlineData("0",   "qualified")]           // Benton: VALID SALE (legacy — 219 sales)
    [InlineData("200", "non-arms-length")]     // Invalid Sale
    [InlineData("300", "non-arms-length")]     // Land Only Sale
    [InlineData("99",  "non-arms-length")]     // Unknown code → conservative fallback
    public void WF38_13_SyncTimeFastPath_BentonCountyCodes_QualifyCorrectly(
        string countyRatioCd, string expectedResult)
    {
        // NOTE: Uses the sync Qualify() overload (no DB) to test the fallback path.
        // This is the path hit during initial canonicalization before the async
        // ComputeRecommendationsAsync pass runs.
        using var db = CreateDbContext($"{nameof(WF38_13_SyncTimeFastPath_BentonCountyCodes_QualifyCorrectly)}_{countyRatioCd}");
        var svc = new SaleQualificationService(db);

        var result = svc.Qualify(
            rawSaleQualifier: null,
            rawCountyRatioCd: countyRatioCd,
            rawExcludeCalcCd: null,
            rawWacCd: null);

        result.Should().Be(expectedResult,
            because: $"sl_county_ratio_cd='{countyRatioCd}' sync-time fast path should use known Benton codes");
    }

    [Fact]
    public async Task WF38_Batch_MultipleRatioTypes_EachClassifiedCorrectly()
    {
        using var db = CreateDbContext(nameof(WF38_Batch_MultipleRatioTypes_EachClassifiedCorrectly));
        await SeedCountyAsync(db);

        db.SaleRatioTypes.AddRange(
            new SaleRatioType { SlRatioTypeCd = "00", SlRatioDesc = "Arms Length",    InvalidSale = false, RequiresReason = false },
            new SaleRatioType { SlRatioTypeCd = "99", SlRatioDesc = "Related Party",  InvalidSale = true,  RequiresReason = true  },
            new SaleRatioType { SlRatioTypeCd = "50", SlRatioDesc = "Bank Owned",     InvalidSale = true,  RequiresReason = false }
        );

        var saleArmsLength = await SeedSaleAsync(db, ratioTypeCd: "00");
        var saleRelated    = await SeedSaleAsync(db, ratioTypeCd: "99");
        var saleBank       = await SeedSaleAsync(db, ratioTypeCd: "50");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        var updated = await svc.ComputeRecommendationsAsync(BentonCountyId);

        updated.Should().Be(3);

        var armsLength = await db.ComparableSales.FindAsync(saleArmsLength.Id);
        var related    = await db.ComparableSales.FindAsync(saleRelated.Id);
        var bank       = await db.ComparableSales.FindAsync(saleBank.Id);

        armsLength!.QualificationRecommendation.Should().Be("qualified");
        related!.QualificationRecommendation.Should().Be("non-arms-length");
        bank!.QualificationRecommendation.Should().Be("non-arms-length");
    }
}
