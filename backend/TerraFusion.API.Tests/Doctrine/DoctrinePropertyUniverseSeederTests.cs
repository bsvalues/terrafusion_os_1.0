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
    public async Task First_run_inserts_six_rules_with_locked_precedence()
    {
        var sp = BuildSp();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var seeder = new DoctrinePropertyUniverseSeeder(
            db, NullLogger<DoctrinePropertyUniverseSeeder>.Instance);

        var added = await seeder.SeedAsync();

        Assert.Equal(6, added);
        var rules = await db.TfDoctrinePropertyUniverses.OrderBy(r => r.Precedence).ToListAsync();
        Assert.Equal(6, rules.Count);

        // Locked precedence per design doc §"Locked precedence".
        Assert.Equal((1, UniverseCodes.ConversionLegacy), (rules[0].Precedence, rules[0].UniverseCode));
        Assert.Equal((2, UniverseCodes.AgCurrentUse), (rules[1].Precedence, rules[1].UniverseCode));
        Assert.Equal((3, UniverseCodes.PersonalProperty), (rules[2].Precedence, rules[2].UniverseCode));
        Assert.Equal((4, UniverseCodes.MobileHome), (rules[3].Precedence, rules[3].UniverseCode));
        Assert.Equal((5, UniverseCodes.RealCommercial), (rules[4].Precedence, rules[4].UniverseCode));
        Assert.Equal((6, UniverseCodes.RealResidential), (rules[5].Precedence, rules[5].UniverseCode));
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
