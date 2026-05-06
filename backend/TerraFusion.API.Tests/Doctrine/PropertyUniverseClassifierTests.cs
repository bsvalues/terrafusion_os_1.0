// SYNC-DOCTRINE-4 — Test Plan A: universe-precedence tests.
//
// Validates the locked precedence of the six-universe classifier:
//   1=CONVERSION_LEGACY, 2=AG_CURRENT_USE, 3=PERSONAL_PROPERTY,
//   4=MOBILE_HOME, 5=REAL_COMMERCIAL, 6=REAL_RESIDENTIAL,
//   7=UNKNOWN (sentinel; never seeded).
// See docs/sync/sync-doctrine-4-improvement-universe-design.md
// §"Test plan A".

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

public class PropertyUniverseClassifierTests
{
    private const string County = "benton-wa";

    private static PropertyUniverseClassifier BuildClassifier()
    {
        var dbName = $"PuTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        // Seed using the production seeder so the test exercises the
        // exact rule set that ships in production.
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var seeder = new DoctrinePropertyUniverseSeeder(db,
                NullLogger<DoctrinePropertyUniverseSeeder>.Instance);
            seeder.SeedAsync().GetAwaiter().GetResult();
        }

        return new PropertyUniverseClassifier(
            sp.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<PropertyUniverseClassifier>.Instance);
    }

    private static UniverseClassifierInput Input(
        string? propTypeCd = null,
        string? propertyUseCd = null,
        string? agApply = null,
        string? agUseCd = null,
        bool hasLegacyMarker = false,
        int year = 2026) =>
        new(County, year, propTypeCd, propertyUseCd, agApply, agUseCd, hasLegacyMarker);

    [Fact]
    public async Task AG_CURRENT_USE_beats_REAL_RESIDENTIAL_when_ag_apply_is_T()
    {
        var classifier = BuildClassifier();
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "R", agApply: "T"));
        Assert.Equal(UniverseCodes.AgCurrentUse, result.UniverseCode);
        Assert.NotNull(result.RuleId);
    }

    [Fact]
    public async Task MOBILE_HOME_beats_real_property_buckets_when_prop_type_is_MH()
    {
        var classifier = BuildClassifier();
        // ag_apply='F' means AG rule (precedence 2) skips. MH then wins.
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "MH", agApply: "F"));
        Assert.Equal(UniverseCodes.MobileHome, result.UniverseCode);
    }

    [Theory]
    [InlineData("P")]
    [InlineData("B")]
    public async Task PERSONAL_PROPERTY_beats_real_property_buckets_for_P_and_B(string code)
    {
        var classifier = BuildClassifier();
        var result = await classifier.ClassifyAsync(Input(propTypeCd: code));
        Assert.Equal(UniverseCodes.PersonalProperty, result.UniverseCode);
    }

    [Fact]
    public async Task CONVERSION_LEGACY_does_not_fire_without_explicit_legacy_marker()
    {
        var classifier = BuildClassifier();
        // R / F / no legacy marker → REAL_RESIDENTIAL (precedence 6).
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "R", agApply: "F", hasLegacyMarker: false));
        Assert.Equal(UniverseCodes.RealResidential, result.UniverseCode);
    }

    [Fact]
    public async Task CONVERSION_LEGACY_beats_other_buckets_when_marker_is_present()
    {
        var classifier = BuildClassifier();
        // Same R / F shape as above, but legacy marker is present.
        // CONVERSION_LEGACY (precedence 1) wins.
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "R", agApply: "F", hasLegacyMarker: true));
        Assert.Equal(UniverseCodes.ConversionLegacy, result.UniverseCode);
    }

    [Fact]
    public async Task REAL_COMMERCIAL_beats_REAL_RESIDENTIAL_when_property_use_is_excluded()
    {
        var classifier = BuildClassifier();
        // R / F / property_use_cd outside residential set → COMMERCIAL.
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "R", agApply: "F", propertyUseCd: "60"));
        Assert.Equal(UniverseCodes.RealCommercial, result.UniverseCode);
    }

    [Fact]
    public async Task REAL_RESIDENTIAL_is_default_real_bucket_after_higher_precedence_rules_fail()
    {
        var classifier = BuildClassifier();
        // R / F / residential property_use code → COMMERCIAL excluded,
        // RESIDENTIAL fires.
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "R", agApply: "F", propertyUseCd: "11"));
        Assert.Equal(UniverseCodes.RealResidential, result.UniverseCode);
    }

    [Fact]
    public async Task UNKNOWN_is_returned_when_no_rule_matches()
    {
        var classifier = BuildClassifier();
        // ag_apply NULL means all rules with explicit ag_apply='F'
        // (commercial, residential) skip. prop_type 'X' isn't in any
        // CSV. No rule fires → UNKNOWN.
        var result = await classifier.ClassifyAsync(
            Input(propTypeCd: "X", agApply: null));
        Assert.Equal(UniverseCodes.Unknown, result.UniverseCode);
        Assert.Equal(UniverseQuarantineReasons.UnknownUniverse, result.QuarantineReasonHint);
        Assert.Null(result.RuleId);
    }

    [Fact]
    public async Task Cache_can_be_invalidated_per_county()
    {
        var classifier = BuildClassifier();
        // Warm cache.
        await classifier.ClassifyAsync(Input(propTypeCd: "MH", agApply: "F"));

        classifier.InvalidateCache(County);

        // Re-classify after invalidation; behaviour unchanged because
        // seeded rules still in DB. The contract asserts no exception
        // and consistent result.
        var result = await classifier.ClassifyAsync(Input(propTypeCd: "MH", agApply: "F"));
        Assert.Equal(UniverseCodes.MobileHome, result.UniverseCode);
    }

    [Fact]
    public async Task Inactive_rules_are_skipped()
    {
        var dbName = $"PuInactiveTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            // Seed an inactive rule that would otherwise match MH.
            db.TfDoctrinePropertyUniverses.Add(new TfDoctrinePropertyUniverse
            {
                County = County,
                EffectiveStartYear = 1990,
                Precedence = 4,
                UniverseCode = UniverseCodes.MobileHome,
                PropTypeCdCsv = "MH",
                ActiveFlag = false,
                Reason = "test inactive rule",
                EvidenceSource = "test",
            });
            await db.SaveChangesAsync();
        }

        var classifier = new PropertyUniverseClassifier(
            sp.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<PropertyUniverseClassifier>.Instance);

        // No active rules → UNKNOWN.
        var result = await classifier.ClassifyAsync(Input(propTypeCd: "MH"));
        Assert.Equal(UniverseCodes.Unknown, result.UniverseCode);
    }
}
