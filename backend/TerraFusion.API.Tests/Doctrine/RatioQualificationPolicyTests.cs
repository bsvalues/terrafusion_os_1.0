// SYNC-DOCTRINE-1 (B1) tests
//
// Validates the year-aware, source-aware, evidence-backed ratio
// qualification lookup. The promoter (B2) will consume this service;
// these tests lock the contract before B2 lands.
//
// Test pattern: in-memory EF + transient scope factory (matches the
// production singleton-+-scoped-DbContext shape).

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.API.Tests.Doctrine;

public class RatioQualificationPolicyTests
{
    private static (RatioQualificationPolicy svc, TerraFusionDbContext db) Build(
        params TfDoctrineRatioPolicy[] seedRules)
    {
        // Shared in-memory DB name so each scope-created DbContext
        // sees the same data.
        var dbName = $"DoctrineTest_{Guid.NewGuid():N}";
        var configBuilder = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
                ["Logging:EnableSensitiveDataLogging"] = "false",
            });
        IConfiguration config = configBuilder.Build();

        var services = new ServiceCollection();
        services.AddSingleton(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        // Seed via a transient context.
        using (var scope = sp.CreateScope())
        {
            var db0 = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            if (seedRules.Length > 0)
            {
                db0.TfDoctrineRatioPolicies.AddRange(seedRules);
                db0.SaveChanges();
            }
        }

        var svc = new RatioQualificationPolicy(
            sp.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RatioQualificationPolicy>.Instance);

        // Return a context for the test to inspect if needed.
        var dbScope = sp.CreateScope();
        var db = dbScope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        return (svc, db);
    }

    private static TfDoctrineRatioPolicy DorRule() => new()
    {
        RuleId = Guid.Parse("d0c7d0c7-0001-4d00-be07-be0053005001"),
        County = "benton-wa",
        EffectiveStartYear = 1990,
        EffectiveEndYear = null,
        StudyName = "DOR_RATIO",
        SourceField = "sale.sl_ratio_type_cd",
        QualifiedCodesCsv = "00",
        ExcludedCodesCsv = string.Empty,
        Confidence = "HIGH",
        ApprovedBy = "operator-bsval",
        ApprovedAt = DateTime.UtcNow,
    };

    private static TfDoctrineRatioPolicy LegacyCodebookRule() => new()
    {
        RuleId = Guid.Parse("d0c7d0c7-0002-4d00-be07-be0053005002"),
        County = "benton-wa",
        EffectiveStartYear = 1990,
        EffectiveEndYear = 2017,
        StudyName = "LEGACY_CODEBOOK_VALID",
        SourceField = "sale.sl_county_ratio_cd",
        QualifiedCodesCsv = "0",
        ExcludedCodesCsv = string.Empty,
        Confidence = "MED",
    };

    private static TfDoctrineRatioPolicy CountyInternalRule() => new()
    {
        RuleId = Guid.Parse("d0c7d0c7-0003-4d00-be07-be0053005003"),
        County = "benton-wa",
        EffectiveStartYear = 2018,
        EffectiveEndYear = null,
        StudyName = "COUNTY_INTERNAL_RATIO",
        SourceField = "sale.sl_county_ratio_cd",
        QualifiedCodesCsv = "100",
        ExcludedCodesCsv = "200,300,400,500",
        Confidence = "HIGH",
    };

    [Fact]
    public async Task NoRules_NotReviewed_NotQualified()
    {
        var (svc, _) = Build();

        var result = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2024, "00");

        Assert.False(result.Reviewed);
        Assert.False(result.Qualified);
        Assert.Null(result.RuleId);
    }

    [Fact]
    public async Task DorRule_Code00_AnyYear_Qualified()
    {
        var (svc, _) = Build(DorRule());

        var r2010 = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2010, "00");
        var r2024 = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2024, "00");
        var r2026 = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2026, "00");

        Assert.True(r2010.Qualified, "DOR 2010 code='00' should be qualified");
        Assert.True(r2024.Qualified);
        Assert.True(r2026.Qualified);
        Assert.True(r2010.Reviewed);
    }

    [Fact]
    public async Task DorRule_Code100_NotQualified()
    {
        // '100' is the COUNTY 'Valid Sale' code, NOT the DOR code.
        // The DOR rule only accepts '00'. This is exactly the bug
        // we're correcting in B2.
        var (svc, _) = Build(DorRule());

        var result = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2024, "100");

        Assert.True(result.Reviewed);   // a code WAS provided
        Assert.False(result.Qualified); // but '100' is not a DOR-qualifier
    }

    [Fact]
    public async Task DorRule_NullCode_NotReviewed()
    {
        var (svc, _) = Build(DorRule());

        var result = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2024, null);

        Assert.False(result.Reviewed);
        Assert.False(result.Qualified);
        // RuleId is still echoed back — the rule existed, code didn't
        Assert.NotNull(result.RuleId);
    }

    [Fact]
    public async Task CountyInternal_LegacyEra_Code0Qualified_Code100NotQualified()
    {
        var (svc, _) = Build(LegacyCodebookRule(), CountyInternalRule());

        var r0 = await svc.EvaluateAsync("benton-wa", "LEGACY_CODEBOOK_VALID", 2015, "0");
        var r100 = await svc.EvaluateAsync("benton-wa", "LEGACY_CODEBOOK_VALID", 2015, "100");

        Assert.True(r0.Qualified, "Pre-2018 '0' should be qualified per legacy codebook");
        Assert.False(r100.Qualified, "Pre-2018 '100' is not a legacy-era code");
    }

    [Fact]
    public async Task CountyInternal_ModernEra_Code100Qualified_Code0NotQualified()
    {
        var (svc, _) = Build(LegacyCodebookRule(), CountyInternalRule());

        var r100 = await svc.EvaluateAsync("benton-wa", "COUNTY_INTERNAL_RATIO", 2024, "100");
        var r0 = await svc.EvaluateAsync("benton-wa", "COUNTY_INTERNAL_RATIO", 2024, "0");

        Assert.True(r100.Qualified, "2018+ '100' should be qualified");
        Assert.False(r0.Qualified, "2018+ '0' is legacy-only and rule scope ended in 2017");
    }

    [Fact]
    public async Task CountyInternal_ExcludedCodes_NotQualified()
    {
        // Modern rule explicitly excludes 200/300/400/500.
        var (svc, _) = Build(CountyInternalRule());

        foreach (var excluded in new[] { "200", "300", "400", "500" })
        {
            var result = await svc.EvaluateAsync("benton-wa", "COUNTY_INTERNAL_RATIO", 2024, excluded);
            Assert.True(result.Reviewed, $"code='{excluded}' should be reviewed");
            Assert.False(result.Qualified, $"code='{excluded}' should NOT be qualified");
        }
    }

    [Fact]
    public async Task BoundaryYear_2017_HitsLegacyRule()
    {
        var (svc, _) = Build(LegacyCodebookRule(), CountyInternalRule());

        var r2017 = await svc.EvaluateAsync("benton-wa", "LEGACY_CODEBOOK_VALID", 2017, "0");
        Assert.True(r2017.Qualified);
        Assert.Equal(LegacyCodebookRule().RuleId, r2017.RuleId);
    }

    [Fact]
    public async Task BoundaryYear_2018_HitsModernRule()
    {
        var (svc, _) = Build(LegacyCodebookRule(), CountyInternalRule());

        var r2018 = await svc.EvaluateAsync("benton-wa", "COUNTY_INTERNAL_RATIO", 2018, "100");
        Assert.True(r2018.Qualified);
        Assert.Equal(CountyInternalRule().RuleId, r2018.RuleId);
    }

    [Fact]
    public async Task DorAndCounty_AreIndependent()
    {
        // Sales doctrine: a sale can be DOR-qualified but not
        // COUNTY_INTERNAL_RATIO-qualified, or vice versa. The two studies
        // are independent surfaces.
        var (svc, _) = Build(DorRule(), CountyInternalRule());

        // Sale with sl_ratio_type_cd='00' but sl_county_ratio_cd=NULL
        var dorOnly = await svc.EvaluateAsync("benton-wa", "DOR_RATIO", 2024, "00");
        var cntyOnly = await svc.EvaluateAsync("benton-wa", "COUNTY_INTERNAL_RATIO", 2024, null);

        Assert.True(dorOnly.Qualified);
        Assert.False(cntyOnly.Qualified);
        Assert.False(cntyOnly.Reviewed);
    }

    [Fact]
    public async Task UnknownCounty_NotReviewed()
    {
        var (svc, _) = Build(DorRule());

        var result = await svc.EvaluateAsync("franklin-wa", "DOR_RATIO", 2024, "00");

        Assert.False(result.Reviewed);
        Assert.False(result.Qualified);
        Assert.Null(result.RuleId);
    }
}
