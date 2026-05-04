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

// CI-HYGIENE-D (#752): tests rewritten to assert the county-only qualification
// contract established by commit 97f95f0f1 (April 17, 2026):
// "DOR ratio type (sl_ratio_type_cd) completely removed from county qualification
//  logic. County ratio code and DOR ratio type are independent systems for
//  independent purposes." RecommendationVersion bumped to 2.0 in the same commit.
//  Tests previously asserted DOR-aware Layer 2b behavior + version "1.1" — both
//  deprecated. Same stale-contract pattern as PR #745 / #758. SyncController.cs:64
//  stale doc comment also fixed (was the source of test author confusion).

/// <summary>
/// R2Wave38 — county-only qualification via <see cref="SaleQualificationService.ComputeRecommendationsAsync"/>.
///
/// Purpose:
///   Verify the county-only cascade established by commit 97f95f0f1:
///     Layer 1 — RawSaleQualifier (sl_qualifier)
///     Layer 2 — RawCountyRatioCd (sl_county_ratio_cd) — keyword match against county_ratio_code.ratio_desc
///     Layer 3 — RawExcludeCalcCd (sales_exclude_calc_cd)
///     Layer 4 — RawWacCd (WAC 458-61A excise exemption)
///     Layer 5 — Default qualified
///
///   DOR ratio type (RawRatioTypeCd / sl_ratio_type_cd) is intentionally NOT
///   consulted: it is state-reporting metadata only.
///
/// Invariants under test:
///   WF38-01: DOR-only input (invalid_sale=true) → falls to Layer 5 default "qualified"
///   WF38-02: DOR-only input (invalid_sale=false) → Layer 5 default "qualified"
///   WF38-03..07: county_ratio_code keyword cascade (VALID / LAND ONLY / OMIT / DARK / COMMERCIAL)
///   WF38-08: County code present → Layer 2 wins; DOR is never consulted
///   WF38-09: Empty lookup tables → Layer 3/4/5 cascade still operates
///   WF38-10: RecommendationVersion = "2.0" (post-97f95f0f1)
///   WF38-11: RecommendationReason format "L2: CountyRatioCd=…" (no "Layer 2b" anywhere)
///   WF38-12: Unknown county code with non-keyword description → conservative non-arms-length
/// </summary>
[Trait("Category", "R2Wave38")]
[Trait("Category", "CountyOnlyQualification")]
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
    // WF38-01 / WF38-02 — DOR sl_ratio_type is NOT consulted by county engine.
    // Per commit 97f95f0f1, DOR ratio type is state-reporting metadata only.
    // A sale with only RawRatioTypeCd set falls through to Layer 5 default.
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_01_DorRatioTypeOnly_FallsThroughToLayer5Default()
    {
        using var db = CreateDbContext(nameof(WF38_01_DorRatioTypeOnly_FallsThroughToLayer5Default));
        await SeedCountyAsync(db);

        // Seed a PACS DOR ratio type with invalid_sale = true. This MUST be ignored
        // by the county engine — DOR ratio type is state-reporting metadata only.
        db.SaleRatioTypes.Add(new SaleRatioType
        {
            SlRatioTypeCd = "99",
            SlRatioDesc   = "Related Party",
            InvalidSale   = true,
            RequiresReason = false,
        });

        // Sale with this DOR code only — no county code, no qualifier, no flags.
        var sale = await SeedSaleAsync(db, ratioTypeCd: "99");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be("qualified",
            because: "DOR ratio type (sl_ratio_type_cd) is NOT consulted by the county engine; "
                   + "with no other codes, the sale falls to Layer 5 default.");
    }

    [Fact]
    public async Task WF38_02_DorRatioTypeOnly_InvalidSaleFalse_StillLayer5Default()
    {
        using var db = CreateDbContext(nameof(WF38_02_DorRatioTypeOnly_InvalidSaleFalse_StillLayer5Default));
        await SeedCountyAsync(db);

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
        refreshed!.QualificationRecommendation.Should().Be("qualified",
            because: "DOR ratio type is not consulted regardless of invalid_sale; "
                   + "Layer 5 default applies when no county code/flag is set.");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-03..07 — Layer 2 keyword cascade against county_ratio_code.ratio_desc.
    // Production cascade (SaleQualificationService.QualifyForCounty):
    //   description contains "VALID" (and not "INVALID")  → "qualified"
    //   description contains "LAND ONLY"/"LAND-ONLY"      → "land-only"
    //   description contains "OMIT"                       → "omitted"
    //   description contains "DARK" or "COMMERCIAL"       → "dark-sale"
    //   any other description with a county code          → "non-arms-length"
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("BC-V", "Valid Sale",                  "qualified")]
    [InlineData("BC-I", "Invalid Sale",                "non-arms-length")]
    [InlineData("BC-N", "NON-QUALIFIED TRANSFER",      "non-arms-length")]
    [InlineData("BC-L", "LAND ONLY SALE",              "land-only")]
    [InlineData("BC-O", "OMITTED — REVIEW",            "omitted")]
    [InlineData("BC-D", "DARK COMMERCIAL",             "dark-sale")]
    [InlineData("BC-X", "EXCLUDED FROM STUDY",         "non-arms-length")]
    public async Task WF38_03_07_CountyRatioCodeDesc_ClassifiesByLayer2Keywords(
        string code, string desc, string expected)
    {
        var testName = $"WF38_{code.Replace("-", "_")}_{expected.Replace("-", "_")}";
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
            because: $"County code '{code}' description '{desc}' should match Layer 2 keyword cascade");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-08 — Layer 2 (county code) is the authority. DOR is not consulted.
    // Even when a DOR ratio type is seeded with invalid_sale=true, the engine
    // never reads it: Layer 2 alone determines the outcome.
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_08_Layer2_CountyCode_Wins_DorNeverConsulted()
    {
        using var db = CreateDbContext(nameof(WF38_08_Layer2_CountyCode_Wins_DorNeverConsulted));
        await SeedCountyAsync(db);

        // DOR table has an "invalid" entry — must be ignored by county engine.
        db.SaleRatioTypes.Add(new SaleRatioType
        {
            SlRatioTypeCd = "99",
            SlRatioDesc   = "Related Party",
            InvalidSale   = true,
            RequiresReason = false,
        });
        // County says "Valid Sale" — Layer 2 keyword cascade returns "qualified".
        db.CountyRatioCodes.Add(new CountyRatioCode
        {
            RatioCd   = "QC",
            RatioDesc = "County Valid Sale (verified)",
        });

        var sale = await SeedSaleAsync(db, countyRatioCd: "QC", ratioTypeCd: "99");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.QualificationRecommendation.Should().Be("qualified",
            because: "Layer 2 (county_ratio_code) is the authority; DOR ratio type is never consulted.");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-09 — Empty lookup tables → cascade still works through Layer 3/4/5.
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
    // WF38-10 — RecommendationVersion = "2.0" (bumped by commit 97f95f0f1)
    // Previously "1.1" under the deprecated DOR-aware contract.
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_10_RecommendationVersion_Is_2_0_PostCountyOnlyContract()
    {
        using var db = CreateDbContext(nameof(WF38_10_RecommendationVersion_Is_2_0_PostCountyOnlyContract));
        await SeedCountyAsync(db);
        var sale = await SeedSaleAsync(db);
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.RecommendationVersion.Should().Be("2.0",
            because: "commit 97f95f0f1 (April 17, 2026) bumped RecommendationVersion to 2.0 "
                   + "when DOR ratio type was removed from county qualification logic.");
        refreshed.RecommendationSource.Should().Be("TerraFusionRuleEngine");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WF38-11 — RecommendationReason format. Production emits "L2: CountyRatioCd=XX"
    // (per BuildRecommendationReason). No "Layer 2b" path exists.
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_11_RecommendationReason_Cites_L2_CountyRatioCd_ForLayer2()
    {
        using var db = CreateDbContext(nameof(WF38_11_RecommendationReason_Cites_L2_CountyRatioCd_ForLayer2));
        await SeedCountyAsync(db);

        db.CountyRatioCodes.Add(new CountyRatioCode { RatioCd = "AQ", RatioDesc = "Valid Sale (Arm's Length)" });
        var sale = await SeedSaleAsync(db, countyRatioCd: "AQ");
        await db.SaveChangesAsync();

        var svc = new SaleQualificationService(db);
        await svc.ComputeRecommendationsAsync(BentonCountyId);

        var refreshed = await db.ComparableSales.FindAsync(sale.Id);
        refreshed!.RecommendationReason.Should().Contain("L2: CountyRatioCd=",
            because: "BuildRecommendationReason emits the L2 prefix when only a county code is present.");
        refreshed.RecommendationReason.Should().Contain("AQ",
            because: "reason should include the code");
        refreshed.RecommendationReason.Should().NotContain("Layer 2b",
            because: "Layer 2b path was removed by commit 97f95f0f1.");
    }

    [Fact]
    public async Task WF38_11b_DorRatioTypeOnly_ReasonFallsToLayer5Default_NeverCitesLayer2b()
    {
        using var db = CreateDbContext(nameof(WF38_11b_DorRatioTypeOnly_ReasonFallsToLayer5Default_NeverCitesLayer2b));
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
        refreshed!.RecommendationReason.Should().StartWith("L5",
            because: "DOR ratio type is not in the county cascade; with only RawRatioTypeCd set, "
                   + "BuildRecommendationReason falls through to the L5 default reason.");
        refreshed.RecommendationReason.Should().NotContain("Layer 2b",
            because: "Layer 2b doctrine was removed by commit 97f95f0f1; reason must never cite it.");
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
    // WF38-13 — Sync-time fast path: live-confirmed Benton pacs_oltp codes.
    //
    // Live pacs_oltp query 2026-04-04 (GROUP BY sl_county_ratio_cd on 425,251 rows):
    //   '100' → 21,715 occurrences — county_ratio_code.ratio_desc = "Valid Sale"
    //   '0'   →    219 occurrences — county_ratio_code.ratio_desc = "VALID SALE"
    //   '200' → 10,445 occurrences — "Invalid Sale"
    //   '300' →  3,363 occurrences — "Land Only Sale"  → "land-only"
    //   '99'  → unknown            → "non-arms-length" (conservative fallback)
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("100", "qualified")]           // Benton: Valid Sale (primary — 21,715 sales)
    [InlineData("0",   "qualified")]           // Benton: VALID SALE (legacy — 219 sales)
    [InlineData("200", "non-arms-length")]     // Invalid Sale
    [InlineData("300", "land-only")]           // Land Only Sale
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

    // ═══════════════════════════════════════════════════════════════════════════
    // Batch correctness — DOR-only inputs all fall to Layer 5 default. The DOR
    // ratio type is not consulted, so per-input differentiation by DOR is gone.
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task WF38_Batch_MultipleDorRatioTypes_AllFallToLayer5Default()
    {
        using var db = CreateDbContext(nameof(WF38_Batch_MultipleDorRatioTypes_AllFallToLayer5Default));
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

        // All three sales have only RawRatioTypeCd set → no county code, no flags →
        // Layer 5 default applies uniformly. DOR is not consulted (per commit 97f95f0f1).
        armsLength!.QualificationRecommendation.Should().Be("qualified");
        related!.QualificationRecommendation.Should().Be("qualified",
            because: "DOR invalid_sale=true is NOT consulted by the county engine; falls to Layer 5.");
        bank!.QualificationRecommendation.Should().Be("qualified",
            because: "DOR invalid_sale=true is NOT consulted by the county engine; falls to Layer 5.");
    }
}
