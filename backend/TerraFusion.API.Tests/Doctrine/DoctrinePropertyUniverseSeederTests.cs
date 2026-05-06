// SYNC-DOCTRINE-4 — seeder contract tests.
//
// Validates that the universe seeder is idempotent and produces the
// six locked seed rules with the locked precedence values.

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.API.Tests.Doctrine;

public class DoctrinePropertyUniverseSeederTests
{
    private static IServiceProvider BuildSp()
    {
        var dbName = $"PuSeederTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task First_run_inserts_six_V2_rules_with_escape_hatch_precedence()
    {
        var sp = BuildSp();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var seeder = new DoctrinePropertyUniverseSeeder(
            db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);

        var added = await seeder.SeedAsync();

        Assert.Equal(6, added);
        var rules = await db.TfDoctrinePropertyUniverses
            .Where(r => r.ActiveFlag)
            .OrderBy(r => r.Precedence)
            .ToListAsync();
        Assert.Equal(6, rules.Count);

        // SYNC-DOCTRINE-4-IMPL-V2 precedence: CONVERSION_LEGACY moved
        // to escape hatch (last). Modern rules go first.
        Assert.Equal((1, UniverseCodes.AgCurrentUse), (rules[0].Precedence, rules[0].UniverseCode));
        Assert.Equal((2, UniverseCodes.PersonalProperty), (rules[1].Precedence, rules[1].UniverseCode));
        Assert.Equal((3, UniverseCodes.MobileHome), (rules[2].Precedence, rules[2].UniverseCode));
        Assert.Equal((4, UniverseCodes.RealCommercial), (rules[3].Precedence, rules[3].UniverseCode));
        Assert.Equal((5, UniverseCodes.RealResidential), (rules[4].Precedence, rules[4].UniverseCode));
        Assert.Equal((7, UniverseCodes.ConversionLegacy), (rules[5].Precedence, rules[5].UniverseCode));
    }

    [Fact]
    public async Task Seeder_deactivates_V1_rules_when_present()
    {
        var sp = BuildSp();
        using (var scope = sp.CreateScope())
        {
            // Seed a V1 rule (with V1 GUID) as if it had been inserted
            // by the V1 seeder.
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.TfDoctrinePropertyUniverses.Add(new TerraFusion.Core.Entities.DoctrineTf.TfDoctrinePropertyUniverse
            {
                RuleId = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005010"),
                County = "benton-wa",
                EffectiveStartYear = 1990,
                Precedence = 1,
                UniverseCode = UniverseCodes.ConversionLegacy,
                RequiresLegacyMarker = true,
                LegacyMarkerType = "CREATED_DT_PRE_2017",
                ActiveFlag = true,
                Reason = "V1",
                EvidenceSource = "V1",
            });
            await db.SaveChangesAsync();
        }

        // Run V2 seeder.
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var seeder = new DoctrinePropertyUniverseSeeder(
                db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);
            await seeder.SeedAsync();
        }

        // V1 row should be deactivated; V2 rows should be active.
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var v1 = await db.TfDoctrinePropertyUniverses.FindAsync(
                Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005010"));
            Assert.NotNull(v1);
            Assert.False(v1!.ActiveFlag);
            Assert.Contains("DEACTIVATED 2026-05-06", v1.Notes ?? string.Empty);

            var v2Active = await db.TfDoctrinePropertyUniverses
                .Where(r => r.ActiveFlag)
                .CountAsync();
            Assert.Equal(6, v2Active);
        }
    }

    [Fact]
    public async Task Second_run_is_idempotent()
    {
        var sp = BuildSp();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var seeder = new DoctrinePropertyUniverseSeeder(
            db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);

        await seeder.SeedAsync();
        var added2 = await seeder.SeedAsync();

        Assert.Equal(0, added2);
        Assert.Equal(6, await db.TfDoctrinePropertyUniverses.CountAsync());
    }

    [Fact]
    public async Task Every_seeded_rule_carries_evidence_source_and_approval()
    {
        var sp = BuildSp();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var seeder = new DoctrinePropertyUniverseSeeder(
            db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);
        await seeder.SeedAsync();

        var rules = await db.TfDoctrinePropertyUniverses.ToListAsync();
        Assert.All(rules, r =>
        {
            Assert.False(string.IsNullOrWhiteSpace(r.EvidenceSource));
            Assert.False(string.IsNullOrWhiteSpace(r.Reason));
            Assert.False(string.IsNullOrWhiteSpace(r.ApprovedBy));
            Assert.NotNull(r.ApprovedAt);
        });
    }

    [Fact]
    public async Task UNKNOWN_is_never_seeded_as_a_rule()
    {
        var sp = BuildSp();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var seeder = new DoctrinePropertyUniverseSeeder(
            db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);
        await seeder.SeedAsync();

        var rules = await db.TfDoctrinePropertyUniverses.ToListAsync();
        Assert.DoesNotContain(rules, r => r.UniverseCode == UniverseCodes.Unknown);
    }
}
