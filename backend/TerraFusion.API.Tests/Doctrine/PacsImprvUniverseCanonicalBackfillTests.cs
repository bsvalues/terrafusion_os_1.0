// SYNC-DOCTRINE-4-IMPL-V6 — canonical-side backfill tests.
//
// Validates that BackfillCanonicalAsync correctly:
//   - matches canonical → truth via SourceXref 4-key,
//   - skips canonical rows already matching their source truth,
//   - updates canonical rows whose universe drifts from truth,
//   - reports without-truth count when no matching truth exists,
//   - dry-run no-op,
//   - idempotency: re-running on already-matched rows is a no-op.

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.API.Tests.Doctrine;

public class PacsImprvUniverseCanonicalBackfillTests
{
    private const string County = "benton-wa";

    private static (PacsImprvUniverseBackfillService svc, IServiceProvider sp) Build()
    {
        var dbName = $"CanonicalBackfillTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        // Seed V2 universe rules.
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            new DoctrinePropertyUniverseSeeder(db,
                NullLogger<DoctrinePropertyUniverseSeeder>.Instance)
                .SeedAsync().GetAwaiter().GetResult();
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

    private static async Task SeedCanonicalAndTruthAsync(
        IServiceProvider sp,
        Guid tfImprovementId,
        int propId, short propValYr, short supNum, long imprvId,
        string? canonicalUniverse,
        string? truthUniverse,
        Guid? truthRuleId = null)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        // Canonical row.
        db.TfImprovements.Add(new TfImprovement
        {
            TfImprovementId = tfImprovementId,
            CountyId = Guid.NewGuid(),
            TfParcelId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
            UniverseCode = canonicalUniverse,
        });

        // SourceXref linking canonical to PACS keys.
        var keyJson = JsonSerializer.Serialize(new
        {
            prop_id = propId,
            prop_val_yr = (int)propValYr,
            sup_num = (int)supNum,
            imprv_id = imprvId,
        });
        db.SyncBridgeSourceXrefs.Add(new SourceXref
        {
            TfEntityType = "improvement",
            TfEntityId = tfImprovementId,
            SourceSystem = "PACS_OLTP",
            SourceTable = "imprv",
            SourceKeyJson = keyJson,
            SourceQueryHash = "test",
            LoadBatchId = Guid.NewGuid(),
            FirstSeenAt = DateTime.UtcNow,
            LastSeenAt = DateTime.UtcNow,
            IsActive = true,
        });

        // Truth row matching the 4-key.
        db.TruthPacsImprvCurrents.Add(new TruthPacsImprvCurrent
        {
            PropValYr = propValYr,
            SupNum = supNum,
            PropId = propId,
            ImprvId = imprvId,
            UniverseCode = truthUniverse,
            UniverseRuleId = truthRuleId,
            UniverseConfidence = truthUniverse == null ? null : "MED",
            UniverseReason = truthUniverse == null ? null : "seeded",
            ImprvLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
            PromotedAt = DateTime.UtcNow,
            SourceImprvLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
        });

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Canonical_with_NULL_universe_is_updated_when_truth_has_universe()
    {
        var (svc, sp) = Build();
        var canonicalId = Guid.NewGuid();
        await SeedCanonicalAndTruthAsync(sp, canonicalId, 100, 2026, 0, 1,
            canonicalUniverse: null, truthUniverse: UniverseCodes.RealResidential);

        var result = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: false));

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(1, result.CanonicalRowsScanned);
        Assert.Equal(1, result.CanonicalRowsUpdated);

        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var canonical = await db.TfImprovements.FindAsync(canonicalId);
        Assert.Equal(UniverseCodes.RealResidential, canonical!.UniverseCode);
    }

    [Fact]
    public async Task Canonical_already_matching_truth_is_unchanged()
    {
        var (svc, sp) = Build();
        await SeedCanonicalAndTruthAsync(sp, Guid.NewGuid(), 200, 2026, 0, 1,
            canonicalUniverse: UniverseCodes.RealResidential,
            truthUniverse: UniverseCodes.RealResidential);

        var result = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: false));

        Assert.Equal(1, result.CanonicalRowsScanned);
        Assert.Equal(0, result.CanonicalRowsUpdated);
        Assert.Equal(1, result.CanonicalRowsAlreadyMatched);
    }

    [Fact]
    public async Task Canonical_drift_is_corrected()
    {
        var (svc, sp) = Build();
        var canonicalId = Guid.NewGuid();
        // Canonical says CONVERSION_LEGACY (V1 era), truth says RESIDENTIAL (post-V5 backfill).
        await SeedCanonicalAndTruthAsync(sp, canonicalId, 300, 2026, 0, 1,
            canonicalUniverse: UniverseCodes.ConversionLegacy,
            truthUniverse: UniverseCodes.RealResidential);

        var result = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: false));

        Assert.Equal(1, result.CanonicalRowsUpdated);
        Assert.Contains("CONVERSION_LEGACY → REAL_RESIDENTIAL", result.Transitions.Keys);

        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var canonical = await db.TfImprovements.FindAsync(canonicalId);
        Assert.Equal(UniverseCodes.RealResidential, canonical!.UniverseCode);
    }

    [Fact]
    public async Task DryRun_records_transitions_but_does_not_update()
    {
        var (svc, sp) = Build();
        var canonicalId = Guid.NewGuid();
        await SeedCanonicalAndTruthAsync(sp, canonicalId, 400, 2026, 0, 1,
            canonicalUniverse: null, truthUniverse: UniverseCodes.AgCurrentUse);

        var result = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: true));

        Assert.True(result.DryRun);
        Assert.Equal(1, result.CanonicalRowsUpdated);  // would-be
        Assert.Contains("(null) → AG_CURRENT_USE", result.Transitions.Keys);

        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var canonical = await db.TfImprovements.FindAsync(canonicalId);
        Assert.Null(canonical!.UniverseCode);
    }

    [Fact]
    public async Task Canonical_without_matching_truth_is_counted_as_orphan()
    {
        var (svc, sp) = Build();
        // Seed canonical + xref BUT no truth row with matching 4-key.
        var canonicalId = Guid.NewGuid();
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.TfImprovements.Add(new TfImprovement
            {
                TfImprovementId = canonicalId,
                CountyId = Guid.NewGuid(),
                TfParcelId = Guid.NewGuid(),
                PromotionLoadBatchId = Guid.NewGuid(),
                UniverseCode = UniverseCodes.RealResidential,
            });
            db.SyncBridgeSourceXrefs.Add(new SourceXref
            {
                TfEntityType = "improvement",
                TfEntityId = canonicalId,
                SourceSystem = "PACS_OLTP",
                SourceTable = "imprv",
                SourceKeyJson = JsonSerializer.Serialize(new
                {
                    prop_id = 9999, prop_val_yr = 2026, sup_num = 0, imprv_id = 1,
                }),
                SourceQueryHash = "test",
                LoadBatchId = Guid.NewGuid(),
                FirstSeenAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow,
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        var result = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: false));

        Assert.Equal(1, result.CanonicalRowsScanned);
        Assert.Equal(0, result.CanonicalRowsUpdated);
        Assert.Equal(1, result.CanonicalRowsWithoutTruth);
    }

    [Fact]
    public async Task Idempotent_rerun_after_initial_backfill()
    {
        var (svc, sp) = Build();
        await SeedCanonicalAndTruthAsync(sp, Guid.NewGuid(), 500, 2026, 0, 1,
            canonicalUniverse: null, truthUniverse: UniverseCodes.RealResidential);

        // First run: 1 update.
        var first = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: false));
        Assert.Equal(1, first.CanonicalRowsUpdated);

        // Second run: 0 updates, 1 already-matched.
        var second = await svc.BackfillCanonicalAsync(
            new CanonicalUniverseBackfillRequest(DryRun: false));
        Assert.Equal(0, second.CanonicalRowsUpdated);
        Assert.Equal(1, second.CanonicalRowsAlreadyMatched);
    }
}
