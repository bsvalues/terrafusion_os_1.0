// SYNC-DOCTRINE-4-IMPL-V5 — backfill service contract tests.
//
// Validates that the backfill correctly:
//   - skips rows that already match the latest classification,
//   - reclassifies rows whose UniverseCode is NULL,
//   - reclassifies rows whose UniverseRuleId references an inactive rule,
//   - reports could-not-classify when property row is missing,
//   - dry-run computes the same transitions but doesn't UPDATE,
//   - produces a per-transition audit map.
//
// Uses the production seeder + classifier; mocks only the data
// surface (truth + property + property_val + land_detail rows).

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.API.Tests.Doctrine;

public class PacsImprvUniverseBackfillServiceTests
{
    private const string County = "benton-wa";

    private static (PacsImprvUniverseBackfillService svc, IServiceProvider sp) Build()
    {
        var dbName = $"BackfillTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        // Seed V2 universe rules so the classifier has rules to walk.
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var seeder = new DoctrinePropertyUniverseSeeder(
                db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);
            seeder.SeedAsync().GetAwaiter().GetResult();
        }

        var classifier = new PropertyUniverseClassifier(
            sp.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<PropertyUniverseClassifier>.Instance);

        var dbForSvc = sp.CreateScope().ServiceProvider
            .GetRequiredService<TerraFusionDbContext>();
        var svc = new PacsImprvUniverseBackfillService(
            dbForSvc, classifier,
            NullLogger<PacsImprvUniverseBackfillService>.Instance);
        return (svc, sp);
    }

    private static async Task SeedTruthRowAsync(
        IServiceProvider sp,
        int propId, short propValYr, short supNum, long imprvId,
        string? universeCode = null, Guid? universeRuleId = null,
        string? propTypeCd = "R", string? propertyUseCd = null,
        string? agApply = null, DateTime? propCreateDt = null)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        // truth row
        db.TruthPacsImprvCurrents.Add(new TruthPacsImprvCurrent
        {
            PropValYr = propValYr,
            SupNum = supNum,
            PropId = propId,
            ImprvId = imprvId,
            UniverseCode = universeCode,
            UniverseRuleId = universeRuleId,
            UniverseConfidence = universeCode == null ? null : "MED",
            UniverseReason = universeCode == null ? null : "seeded test",
            ImprvLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
            PromotedAt = DateTime.UtcNow,
            SourceImprvLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
        });

        // property row (the classifier needs this to fire)
        db.LegacyPacsRawProperties.Add(new LegacyPacsRawProperty
        {
            PropId = propId,
            PropTypeCd = propTypeCd,
            PropCreateDt = propCreateDt,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "test",
            SourceRowHash = "test",
        });

        // property_val row (optional)
        if (propertyUseCd != null)
        {
            db.LegacyPacsRawPropertyVals.Add(new LegacyPacsRawPropertyVal
            {
                PropId = propId,
                PropValYr = propValYr,
                SupNum = supNum,
                PropertyUseCd = propertyUseCd,
                LoadBatchId = Guid.NewGuid(),
                SourceQueryHash = "test",
                SourceRowHash = "test",
            });
        }

        // land_detail row (optional, for ag_apply)
        if (agApply != null)
        {
            db.LegacyPacsRawLandDetails.Add(new LegacyPacsRawLandDetail
            {
                PropId = propId,
                PropValYr = propValYr,
                SupNum = supNum,
                LandSegId = 1,
                AgApply = agApply,
                AgUseCd = agApply == "T" ? "AG" : null,
                LoadBatchId = Guid.NewGuid(),
                SourceQueryHash = "test",
                SourceRowHash = "test",
            });
        }

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Null_universe_row_is_classified_REAL_RESIDENTIAL_for_R_typed_property()
    {
        var (svc, sp) = Build();
        await SeedTruthRowAsync(sp, propId: 100, propValYr: 2026, supNum: 0, imprvId: 1,
            universeCode: null, propTypeCd: "R");

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(County, DryRun: false));

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1, result.RowsScanned);
        Assert.Equal(1, result.RowsUpdated);
        Assert.Equal(0, result.RowsUnchanged);

        // Verify the truth row UniverseCode is now set.
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var row = await db.TruthPacsImprvCurrents.SingleAsync();
        Assert.Equal(UniverseCodes.RealResidential, row.UniverseCode);
    }

    [Fact]
    public async Task Row_with_inactive_V1_rule_id_is_reclassified_under_V2_rules()
    {
        var (svc, sp) = Build();
        // Simulate a V1 cohort row: UniverseCode='CONVERSION_LEGACY',
        // UniverseRuleId = a V1 GUID that the V2 seeder marked inactive.
        var v1ConvLegacyRuleId = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005010");

        // Inject the inactive V1 rule into the table so the backfill
        // sees it. (V2 seeder normally does this on first boot.)
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.TfDoctrinePropertyUniverses.Add(new TfDoctrinePropertyUniverse
            {
                RuleId = v1ConvLegacyRuleId,
                County = County,
                EffectiveStartYear = 1990,
                Precedence = 1,
                UniverseCode = UniverseCodes.ConversionLegacy,
                ActiveFlag = false,
                Reason = "V1 inactive",
                EvidenceSource = "V1",
            });
            await db.SaveChangesAsync();
        }

        await SeedTruthRowAsync(sp, propId: 200, propValYr: 2026, supNum: 0, imprvId: 1,
            universeCode: UniverseCodes.ConversionLegacy,
            universeRuleId: v1ConvLegacyRuleId,
            propTypeCd: "R", propCreateDt: new DateTime(1980, 1, 1, 0, 0, 0, DateTimeKind.Utc));

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(County, DryRun: false));

        Assert.Equal(1, result.RowsScanned);
        Assert.Equal(1, result.RowsUpdated);

        using var scope2 = sp.CreateScope();
        var db2 = scope2.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var row = await db2.TruthPacsImprvCurrents.SingleAsync();
        // Under V2 rules, prop_type_cd='R' with no ag_apply='T'
        // routes to REAL_RESIDENTIAL — the legacy marker is observed
        // but precedence-7 CONVERSION_LEGACY only fires when no
        // modern rule matches.
        Assert.Equal(UniverseCodes.RealResidential, row.UniverseCode);
        Assert.NotEqual(v1ConvLegacyRuleId, row.UniverseRuleId);
    }

    [Fact]
    public async Task Row_with_active_universe_is_unchanged()
    {
        var (svc, sp) = Build();

        // Seed a row already classified REAL_RESIDENTIAL with the
        // active V2 GUID.
        var v2ResidRuleId = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005060");
        await SeedTruthRowAsync(sp, propId: 300, propValYr: 2026, supNum: 0, imprvId: 1,
            universeCode: UniverseCodes.RealResidential,
            universeRuleId: v2ResidRuleId,
            propTypeCd: "R");

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(County, DryRun: false));

        // Active rule → no scan candidate at all.
        Assert.Equal(0, result.RowsScanned);
        Assert.Equal(0, result.RowsUpdated);
    }

    [Fact]
    public async Task DryRun_counts_transitions_but_does_not_update()
    {
        var (svc, sp) = Build();
        await SeedTruthRowAsync(sp, propId: 400, propValYr: 2026, supNum: 0, imprvId: 1,
            universeCode: null, propTypeCd: "R");

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(County, DryRun: true));

        Assert.Equal(1, result.RowsScanned);
        Assert.Equal(1, result.RowsUpdated);  // dry-run reports would-be-updates
        Assert.True(result.DryRun);
        Assert.Contains("(null) → REAL_RESIDENTIAL", result.Transitions.Keys);

        // Truth row remains NULL.
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var row = await db.TruthPacsImprvCurrents.SingleAsync();
        Assert.Null(row.UniverseCode);
    }

    [Fact]
    public async Task Row_without_property_record_is_marked_could_not_classify()
    {
        var (svc, sp) = Build();
        // Seed a truth row but NO property row.
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.TruthPacsImprvCurrents.Add(new TruthPacsImprvCurrent
            {
                PropValYr = 2026,
                SupNum = 0,
                PropId = 999,
                ImprvId = 1,
                UniverseCode = null,
                ImprvLoadBatchId = Guid.NewGuid(),
                SuppAssocLoadBatchId = Guid.NewGuid(),
                PromotionLoadBatchId = Guid.NewGuid(),
                PromotedAt = DateTime.UtcNow,
                SourceImprvLandedRowId = Guid.NewGuid(),
                SourceSuppAssocLandedRowId = Guid.NewGuid(),
            });
            await db.SaveChangesAsync();
        }

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(County, DryRun: false));

        Assert.Equal(1, result.RowsScanned);
        Assert.Equal(0, result.RowsUpdated);
        Assert.Equal(1, result.RowsCouldNotClassify);
    }

    [Fact]
    public async Task Row_with_ag_apply_T_reclassifies_to_AG_CURRENT_USE()
    {
        var (svc, sp) = Build();
        await SeedTruthRowAsync(sp, propId: 500, propValYr: 2026, supNum: 0, imprvId: 1,
            universeCode: null, propTypeCd: "R", agApply: "T");

        var result = await svc.BackfillAsync(
            new ImprvUniverseBackfillRequest(County, DryRun: false));

        Assert.Equal(1, result.RowsUpdated);

        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var row = await db.TruthPacsImprvCurrents.SingleAsync();
        Assert.Equal(UniverseCodes.AgCurrentUse, row.UniverseCode);
    }
}
