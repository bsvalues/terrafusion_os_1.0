// SYNC-DOCTRINE-4 — Test Plans B + C: dictionary evaluation +
// false-global-quarantine regression.
//
// Validates that per-universe dictionary lookups are scoped strictly
// to the row's universe — a code present in REAL_RESIDENTIAL must not
// be visible to a REAL_COMMERCIAL lookup, and vice versa. Regression
// against the pre-SYNC-DOCTRINE-4 single-global-bucket contamination.
// See docs/sync/sync-doctrine-4-improvement-universe-design.md
// §"Test plan B" + §"Test plan C".

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

public class PerUniverseAttributeDictionaryTests
{
    private const string County = "benton-wa";

    private static (PerUniverseAttributeDictionary svc, IServiceProvider sp)
        Build(params TfDoctrineAttributeDictionary[] entries)
    {
        var dbName = $"PuDictTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        if (entries.Length > 0)
        {
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.TfDoctrineAttributeDictionaries.AddRange(entries);
            db.SaveChanges();
        }

        var svc = new PerUniverseAttributeDictionary(
            sp.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<PerUniverseAttributeDictionary>.Instance);
        return (svc, sp);
    }

    private static TfDoctrineAttributeDictionary Entry(
        string universe, string attrId, string val,
        string ctyName = "benton-wa", int startYear = 1990) =>
        new()
        {
            County = ctyName,
            UniverseCode = universe,
            EffectiveStartYear = startYear,
            ImprvAttrId = attrId,
            IAttrValCd = val,
            ActiveFlag = true,
            Reason = "test",
            EvidenceSource = "test",
        };

    // ── Test Plan B: dictionary evaluation ─────────────────────────

    [Fact]
    public async Task Code_known_in_REAL_RESIDENTIAL_is_not_unknown_in_that_universe()
    {
        var (svc, _) = Build(Entry(UniverseCodes.RealResidential, "100", "GR1"));
        var result = await svc.LookupAsync(County, UniverseCodes.RealResidential, 2026, "100", "GR1");
        Assert.Equal(DictionaryLookupOutcome.Known, result.Outcome);
        Assert.NotNull(result.MatchedRowId);
        Assert.Null(result.QuarantineReason);
    }

    [Fact]
    public async Task Same_code_missing_in_REAL_COMMERCIAL_is_quarantined_only_for_that_universe()
    {
        var (svc, _) = Build(
            Entry(UniverseCodes.RealResidential, "100", "GR1"),
            // Distinct entry on commercial so its dictionary is non-empty.
            Entry(UniverseCodes.RealCommercial, "200", "C1"));

        // Code "100/GR1" exists for residential. Lookup against commercial
        // must NOT find it.
        var commercial = await svc.LookupAsync(
            County, UniverseCodes.RealCommercial, 2026, "100", "GR1");
        Assert.Equal(DictionaryLookupOutcome.UnknownForUniverse, commercial.Outcome);
        Assert.Equal(UniverseQuarantineReasons.UnknownForUniverseDictionary,
            commercial.QuarantineReason);

        // Same code IS known under residential — confirms isolation.
        var residential = await svc.LookupAsync(
            County, UniverseCodes.RealResidential, 2026, "100", "GR1");
        Assert.Equal(DictionaryLookupOutcome.Known, residential.Outcome);
    }

    [Fact]
    public async Task Code_known_in_MOBILE_HOME_does_not_require_presence_in_REAL_RESIDENTIAL()
    {
        var (svc, _) = Build(
            Entry(UniverseCodes.MobileHome, "300", "MH1"),
            Entry(UniverseCodes.RealResidential, "999", "X"));
        var mh = await svc.LookupAsync(County, UniverseCodes.MobileHome, 2026, "300", "MH1");
        Assert.Equal(DictionaryLookupOutcome.Known, mh.Outcome);
    }

    [Fact]
    public async Task Code_known_in_AG_CURRENT_USE_does_not_require_presence_in_PERSONAL_PROPERTY()
    {
        var (svc, _) = Build(
            Entry(UniverseCodes.AgCurrentUse, "400", "AG1"),
            // PP dictionary is non-empty but with a different code.
            Entry(UniverseCodes.PersonalProperty, "500", "PP1"));
        var ag = await svc.LookupAsync(County, UniverseCodes.AgCurrentUse, 2026, "400", "AG1");
        Assert.Equal(DictionaryLookupOutcome.Known, ag.Outcome);
    }

    [Fact]
    public async Task Dictionary_not_loaded_for_universe_yields_DictionaryNotLoadedForUniverse_not_unknown_code()
    {
        // Seed only RESIDENTIAL — COMMERCIAL stays empty.
        var (svc, _) = Build(Entry(UniverseCodes.RealResidential, "100", "GR1"));
        var result = await svc.LookupAsync(
            County, UniverseCodes.RealCommercial, 2026, "anything", "anything");
        Assert.Equal(DictionaryLookupOutcome.DictionaryNotLoaded, result.Outcome);
        Assert.Equal(UniverseQuarantineReasons.DictionaryNotLoadedForUniverse,
            result.QuarantineReason);
    }

    // ── Test Plan C: false-global-quarantine regression ────────────

    [Fact]
    public async Task One_universe_missing_code_does_not_poison_other_universes()
    {
        // Code "200/C1" is known in COMMERCIAL only. A residential
        // row whose attribute is "100/GR1" must still resolve known
        // — proving the universes don't share a global namespace.
        var (svc, _) = Build(
            Entry(UniverseCodes.RealResidential, "100", "GR1"),
            Entry(UniverseCodes.RealCommercial, "200", "C1"));

        var residential = await svc.LookupAsync(
            County, UniverseCodes.RealResidential, 2026, "100", "GR1");
        Assert.Equal(DictionaryLookupOutcome.Known, residential.Outcome);

        // The commercial code IS unknown against residential dictionary;
        // that's per-universe quarantine, not "global".
        var residentialAgainstCommercialCode = await svc.LookupAsync(
            County, UniverseCodes.RealResidential, 2026, "200", "C1");
        Assert.Equal(DictionaryLookupOutcome.UnknownForUniverse,
            residentialAgainstCommercialCode.Outcome);
    }

    [Fact]
    public async Task Previously_reported_unknown_code_resolves_when_universe_dictionary_contains_it()
    {
        // Pre-SYNC-DOCTRINE-4 behavior: a code missing from a single
        // global dictionary always quarantined. Post-SYNC-DOCTRINE-4:
        // if the code is in THE row's universe dictionary, it
        // resolves regardless of any other universe's contents.
        var (svc, _) = Build(Entry(UniverseCodes.MobileHome, "MH-grade", "Q3"));

        var result = await svc.LookupAsync(
            County, UniverseCodes.MobileHome, 2026, "MH-grade", "Q3");
        Assert.Equal(DictionaryLookupOutcome.Known, result.Outcome);
    }

    // ── Sentinel + edge cases ──────────────────────────────────────

    [Fact]
    public async Task UNKNOWN_universe_yields_UniverseNotEvaluated()
    {
        var (svc, _) = Build();
        var result = await svc.LookupAsync(County, UniverseCodes.Unknown, 2026, "x", "y");
        Assert.Equal(DictionaryLookupOutcome.UniverseNotEvaluated, result.Outcome);
        Assert.Equal(UniverseQuarantineReasons.UniverseNotEvaluated, result.QuarantineReason);
    }

    [Fact]
    public async Task Empty_universe_is_treated_as_NotEvaluated()
    {
        var (svc, _) = Build();
        var result = await svc.LookupAsync(County, "", 2026, "x", "y");
        Assert.Equal(DictionaryLookupOutcome.UniverseNotEvaluated, result.Outcome);
    }

    [Fact]
    public async Task Year_window_filtering_excludes_out_of_window_entries()
    {
        var (svc, _) = Build(new TfDoctrineAttributeDictionary
        {
            County = County,
            UniverseCode = UniverseCodes.RealResidential,
            EffectiveStartYear = 2010,
            EffectiveEndYear = 2015,
            ImprvAttrId = "100",
            IAttrValCd = "X",
            ActiveFlag = true,
            Reason = "test", EvidenceSource = "test",
        });

        var inWindow = await svc.LookupAsync(
            County, UniverseCodes.RealResidential, 2012, "100", "X");
        Assert.Equal(DictionaryLookupOutcome.Known, inWindow.Outcome);

        var outOfWindow = await svc.LookupAsync(
            County, UniverseCodes.RealResidential, 2026, "100", "X");
        Assert.Equal(DictionaryLookupOutcome.UnknownForUniverse, outOfWindow.Outcome);
    }

    [Fact]
    public async Task Inactive_entries_are_ignored()
    {
        var entry = Entry(UniverseCodes.RealResidential, "100", "X");
        entry.ActiveFlag = false;
        var (svc, _) = Build(entry);

        var result = await svc.LookupAsync(
            County, UniverseCodes.RealResidential, 2026, "100", "X");
        // Active=false entries are excluded entirely → empty dictionary.
        Assert.Equal(DictionaryLookupOutcome.DictionaryNotLoaded, result.Outcome);
    }

    [Fact]
    public async Task Count_for_universe_reports_active_entries()
    {
        var (svc, _) = Build(
            Entry(UniverseCodes.RealResidential, "100", "X"),
            Entry(UniverseCodes.RealResidential, "200", "Y"));
        var count = await svc.CountForUniverseAsync(County, UniverseCodes.RealResidential);
        Assert.Equal(2, count);
    }
}
