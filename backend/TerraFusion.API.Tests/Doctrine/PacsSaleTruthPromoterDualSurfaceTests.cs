// SYNC-DOCTRINE-2 (B2) tests
//
// Validates that PacsSaleTruthPromoter:
//   - removes the hardcoded sl_county_ratio_cd='100' filter
//   - evaluates BOTH ratio studies (DOR_RATIO + COUNTY_INTERNAL_RATIO)
//     per sale via IRatioQualificationPolicy
//   - writes the five new dual-surface fields onto every promoted row
//   - promotes a sale iff at least one study qualifies it
//   - preserves the stale-axis ('01'/'02') and FK gates unchanged

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using TerraFusion.Data.Services.TruthPacs;
using Xunit;

namespace TerraFusion.API.Tests.Doctrine;

public class PacsSaleTruthPromoterDualSurfaceTests
{
    private const string CountySlug = "benton-wa";

    private static (PacsSaleTruthPromoter promoter,
                    Func<TerraFusionDbContext> dbFactory)
        Build(params TfDoctrineRatioPolicy[] seedRules)
    {
        var dbName = $"PromoterTest_{Guid.NewGuid():N}";
        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton(config);
        services.AddDbContext<TerraFusionDbContext>(o => o.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        // Seed the policy rules.
        using (var scope = sp.CreateScope())
        {
            var seedDb = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            if (seedRules.Length > 0)
            {
                seedDb.TfDoctrineRatioPolicies.AddRange(seedRules);
                seedDb.SaveChanges();
            }
        }

        var policy = new RatioQualificationPolicy(
            sp.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RatioQualificationPolicy>.Instance);

        // The promoter is Scoped + reads/writes EF — give it a fresh
        // context per test invocation. Return a factory so the test
        // can also inspect / seed sales.
        Func<TerraFusionDbContext> dbFactory = () =>
            sp.CreateScope().ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var promoter = new PacsSaleTruthPromoter(
            dbFactory(),
            policy,
            NullLogger<PacsSaleTruthPromoter>.Instance);

        return (promoter, dbFactory);
    }

    private static TfDoctrineRatioPolicy DorRule() => new()
    {
        RuleId = Guid.NewGuid(),
        County = CountySlug,
        EffectiveStartYear = 1990,
        EffectiveEndYear = null,
        StudyName = "DOR_RATIO",
        SourceField = "sale.sl_ratio_type_cd",
        QualifiedCodesCsv = "00",
        ExcludedCodesCsv = string.Empty,
        Confidence = "HIGH",
    };

    private static TfDoctrineRatioPolicy CountyModernRule() => new()
    {
        RuleId = Guid.NewGuid(),
        County = CountySlug,
        EffectiveStartYear = 2018,
        EffectiveEndYear = null,
        StudyName = "COUNTY_INTERNAL_RATIO",
        SourceField = "sale.sl_county_ratio_cd",
        QualifiedCodesCsv = "100",
        ExcludedCodesCsv = "200,300,400,500",
        Confidence = "HIGH",
    };

    /// <summary>
    /// Seed two source batches: a sale batch with N rows + a matching
    /// supp_assoc batch with one entry per (PropId, PropValYr).
    /// </summary>
    private static (Guid saleBatch, Guid suppBatch) SeedSourceBatches(
        TerraFusionDbContext db,
        IEnumerable<(int PropId, short PropValYr, short SupNum, string? RatioTypeCd, string? CountyRatioCd, DateTime? SlDt)> sales)
    {
        var saleBatchId = Guid.NewGuid();
        var suppBatchId = Guid.NewGuid();

        db.SyncBridgeLoadBatches.AddRange(
            new LoadBatch
            {
                LoadBatchId = saleBatchId,
                SourceFamily = SourceFamilies.PacsOltp,
                SourceSystem = "JCHARRISPACS",
                SourceFileOrDatabase = "pacs_oltp",
                SourceQueryHash = "test",
                Operator = "test",
                Status = "COMPLETED",
                StartedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
            },
            new LoadBatch
            {
                LoadBatchId = suppBatchId,
                SourceFamily = SourceFamilies.PacsOltp,
                SourceSystem = "JCHARRISPACS",
                SourceFileOrDatabase = "pacs_oltp",
                SourceQueryHash = "test-supp",
                Operator = "test",
                Status = "COMPLETED",
                StartedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
            });

        var coId = 1L;
        foreach (var s in sales)
        {
            db.LegacyPacsRawSales.Add(new LegacyPacsRawSale
            {
                LandedRowId = Guid.NewGuid(),
                ChgOfOwnerId = coId++,
                PropId = s.PropId,
                PropValYr = s.PropValYr,
                SupNum = s.SupNum,
                SlRatioTypeCd = s.RatioTypeCd,
                SlCountyRatioCd = s.CountyRatioCd,
                SlDt = s.SlDt,
                SlPrice = 100_000m,
                AdjSlPrice = 100_000m,
                LoadBatchId = saleBatchId,
                SourceQueryHash = "test",
                SourceRowHash = Guid.NewGuid().ToString(),
                LandedAt = DateTime.UtcNow,
            });

            // unique supp pointer per (PropId, PropValYr).
            db.LegacyPacsRawPropSuppAssocs.Add(new LegacyPacsRawPropSuppAssoc
            {
                LandedRowId = Guid.NewGuid(),
                PropId = s.PropId,
                PropValYr = s.PropValYr,
                SupNum = s.SupNum,
                LoadBatchId = suppBatchId,
                SourceQueryHash = "test-supp",
                SourceRowHash = Guid.NewGuid().ToString(),
                LandedAt = DateTime.UtcNow,
            });
        }
        db.SaveChanges();
        return (saleBatchId, suppBatchId);
    }

    [Fact]
    public async Task DorOnlySale_Promoted_DorTrue_CountyFalse()
    {
        // sl_ratio_type_cd='00' → DOR qualified
        // sl_county_ratio_cd=NULL → county not reviewed
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2024, (short)0, (string?)"00", (string?)null, (DateTime?)new DateTime(2024, 6, 1)),
        });

        var result = await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1, result.SalesPromoted);

        using var verifyDb = dbFactory();
        var truth = await verifyDb.TruthPacsSales.SingleAsync(t => t.SaleLoadBatchId == saleBatch);
        Assert.True(truth.DorRatioQualified);
        Assert.False(truth.CountyRatioReviewed);
        Assert.False(truth.CountyRatioQualified);
        Assert.Null(truth.CountyRatioCode);
        Assert.Null(truth.CountyRatioDescription);
    }

    [Fact]
    public async Task CountyOnlySale_Promoted_DorFalse_CountyTrue()
    {
        // sl_ratio_type_cd=NULL → DOR not qualified
        // sl_county_ratio_cd='100' (year 2024) → county qualified
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2024, (short)0, (string?)null, (string?)"100", (DateTime?)new DateTime(2024, 6, 1)),
        });

        var result = await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1, result.SalesPromoted);

        using var verifyDb = dbFactory();
        var truth = await verifyDb.TruthPacsSales.SingleAsync(t => t.SaleLoadBatchId == saleBatch);
        Assert.False(truth.DorRatioQualified);
        Assert.True(truth.CountyRatioReviewed);
        Assert.True(truth.CountyRatioQualified);
        Assert.Equal("100", truth.CountyRatioCode);
        Assert.Equal("Valid Sale", truth.CountyRatioDescription);
    }

    [Fact]
    public async Task BothStudiesQualified_PromotedWithBothFlags()
    {
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2024, (short)0, (string?)"00", (string?)"100", (DateTime?)new DateTime(2024, 6, 1)),
        });

        var result = await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        Assert.Equal(1, result.SalesPromoted);

        using var verifyDb = dbFactory();
        var truth = await verifyDb.TruthPacsSales.SingleAsync(t => t.SaleLoadBatchId == saleBatch);
        Assert.True(truth.DorRatioQualified);
        Assert.True(truth.CountyRatioReviewed);
        Assert.True(truth.CountyRatioQualified);
    }

    [Fact]
    public async Task NeitherStudyQualified_NotPromoted()
    {
        // sl_ratio_type_cd=NULL → not DOR
        // sl_county_ratio_cd='200' → reviewed but not qualified
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2024, (short)0, (string?)null, (string?)"200", (DateTime?)new DateTime(2024, 6, 1)),
        });

        var result = await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(0, result.SalesPromoted);
        Assert.Equal(1, result.RejectedNotQualified);

        using var verifyDb = dbFactory();
        Assert.Empty(verifyDb.TruthPacsSales.Where(t => t.SaleLoadBatchId == saleBatch));
    }

    [Fact]
    public async Task PreConversion_DorOnly_Promoted_CountyAlwaysFalse()
    {
        // 2015 sale: county study didn't exist as a formal program;
        // the COUNTY_INTERNAL_RATIO rule only covers 2018+.
        // So even with sl_county_ratio_cd='100' (rare pre-2018) the
        // promoter writes county_ratio_qualified=false because no rule
        // covers the year.
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2015, (short)0, (string?)"00", (string?)"100", (DateTime?)new DateTime(2015, 3, 1)),
        });

        var result = await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        Assert.Equal(1, result.SalesPromoted);

        using var verifyDb = dbFactory();
        var truth = await verifyDb.TruthPacsSales.SingleAsync(t => t.SaleLoadBatchId == saleBatch);
        Assert.True(truth.DorRatioQualified, "DOR rule covers 1990+ → qualified");
        Assert.False(truth.CountyRatioReviewed,
            "No COUNTY_INTERNAL_RATIO rule covers 2015 → not reviewed by the active program");
        Assert.False(truth.CountyRatioQualified);
        Assert.Equal("100", truth.CountyRatioCode);
        Assert.Equal("Valid Sale", truth.CountyRatioDescription);
    }

    [Fact]
    public async Task StaleAxisCode_RejectedUnchanged_NotPromoted()
    {
        // '01' is stale-axis pre-conversion; rejected unconditionally
        // regardless of dual-surface evaluation.
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2024, (short)0, (string?)"00", (string?)"01", (DateTime?)new DateTime(2024, 6, 1)),
        });

        var result = await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        Assert.Equal(0, result.SalesPromoted);
        Assert.Equal(1, result.RejectedStaleAxis);
    }

    [Fact]
    public async Task CountyCode_DescriptionResolvesFromCodebook()
    {
        // Verify several codes hit the codebook correctly.
        var (promoter, dbFactory) = Build(DorRule(), CountyModernRule());
        using var db = dbFactory();
        var (saleBatch, suppBatch) = SeedSourceBatches(db, new[]
        {
            ((int)1, (short)2024, (short)0, (string?)"00", (string?)"100", (DateTime?)new DateTime(2024, 6, 1)),
            ((int)2, (short)2024, (short)0, (string?)"00", (string?)"200", (DateTime?)new DateTime(2024, 6, 1)),
            ((int)3, (short)2024, (short)0, (string?)"00", (string?)"300", (DateTime?)new DateTime(2024, 6, 1)),
        });

        await promoter.PromoteAsync(saleBatch, suppBatch, "test");

        using var verifyDb = dbFactory();
        var rows = await verifyDb.TruthPacsSales
            .Where(t => t.SaleLoadBatchId == saleBatch)
            .OrderBy(t => t.PropId)
            .ToListAsync();

        Assert.Equal(3, rows.Count);
        Assert.Equal("Valid Sale", rows[0].CountyRatioDescription);
        Assert.Equal("Invalid Sale", rows[1].CountyRatioDescription);
        Assert.Equal("Land Only Sale", rows[2].CountyRatioDescription);
    }
}
