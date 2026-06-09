// SYNC-DOCTRINE-4-IMPL-V7 — quarantine profiler tests.
//
// Validates that the profiler:
//   - aggregates by (UniverseCode, ImprvAttrId, IAttrValCd),
//   - filters to UNKNOWN_ATTRIBUTE quarantine reason,
//   - applies optional universe filter,
//   - respects MaxCells cap,
//   - returns per-universe rollup ordered by count.

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyTfUnproven;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Data;
using TerraFusion.Data.Services.Doctrine;
using Xunit;

namespace TerraFusion.API.Tests.Doctrine;

public class ImprvAttrQuarantineProfilerTests
{
    private static (ImprvAttrQuarantineProfiler svc, IServiceProvider sp) Build()
    {
        var dbName = $"QuarProfiler_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();

        var dbForSvc = sp.CreateScope().ServiceProvider
            .GetRequiredService<TerraFusionDbContext>();
        var svc = new ImprvAttrQuarantineProfiler(
            dbForSvc, NullLogger<ImprvAttrQuarantineProfiler>.Instance);
        return (svc, sp);
    }

    private static async Task SeedQuarantineRowAsync(
        IServiceProvider sp,
        string? universeCode, long iAttrValId, string iAttrValCd,
        string quarantineReason = "UNKNOWN_ATTRIBUTE")
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        db.LegacyTfUnprovenImprvAttrs.Add(new LegacyTfUnprovenImprvAttr
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, ImprvId = 1,
            ImprvDetId = 10, IAttrValId = iAttrValId,
            IAttrValCd = iAttrValCd,
            UniverseCode = universeCode,
            QuarantineReason = quarantineReason,
            LandingLoadBatchId = Guid.NewGuid(),
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Profile_aggregates_by_universe_attr_id_and_val_cd()
    {
        var (svc, sp) = Build();
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "GR1");
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "GR1");
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "GR2");
        await SeedQuarantineRowAsync(sp, "AG_CURRENT_USE", 200, "AG1");

        var result = await svc.ProfileAsync(new ImprvAttrQuarantineProfileRequest());

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(4, result.TotalQuarantineRows);
        Assert.Equal(4, result.RowsScopedByFilter);
        Assert.Equal(2, result.DistinctUniverses);
        Assert.Equal(3, result.DistinctCodes);
        Assert.Equal(3, result.Cells.Count);

        // Ordered by descending count → (RES, 100, GR1) with count=2 first.
        Assert.Equal("REAL_RESIDENTIAL", result.Cells[0].UniverseCode);
        Assert.Equal("100", result.Cells[0].ImprvAttrId);
        Assert.Equal("GR1", result.Cells[0].IAttrValCd);
        Assert.Equal(2, result.Cells[0].Count);
    }

    [Fact]
    public async Task Reason_summary_lists_both_layers_independent_of_filter()
    {
        var (svc, sp) = Build();
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "GR1",
            quarantineReason: "UNKNOWN_ATTRIBUTE");
        await SeedQuarantineRowAsync(sp, null, 200, "X",
            quarantineReason: "UNKNOWN_I_ATTR_VAL_CD");

        // No filter → both layers present in cohort + reason summary.
        var noFilter = await svc.ProfileAsync(new ImprvAttrQuarantineProfileRequest());
        Assert.Equal(2, noFilter.TotalQuarantineRows);
        Assert.Equal(2, noFilter.RowsScopedByFilter);
        Assert.Equal(2, noFilter.ReasonSummary.Count);

        // ReasonFilter scopes histogram but ReasonSummary still shows full cohort.
        var canonicalOnly = await svc.ProfileAsync(
            new ImprvAttrQuarantineProfileRequest(ReasonFilter: "UNKNOWN_ATTRIBUTE"));
        Assert.Equal(2, canonicalOnly.TotalQuarantineRows);  // full cohort unchanged
        Assert.Equal(1, canonicalOnly.RowsScopedByFilter);
        Assert.Equal(2, canonicalOnly.ReasonSummary.Count);  // both layers in summary
    }

    [Fact]
    public async Task Universe_filter_scopes_results()
    {
        var (svc, sp) = Build();
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "GR1");
        await SeedQuarantineRowAsync(sp, "AG_CURRENT_USE", 200, "AG1");

        var result = await svc.ProfileAsync(
            new ImprvAttrQuarantineProfileRequest(UniverseFilter: "REAL_RESIDENTIAL", ReasonFilter: "UNKNOWN_ATTRIBUTE"));

        Assert.Equal(2, result.TotalQuarantineRows);  // total cohort unchanged
        Assert.Equal(1, result.RowsScopedByFilter);
        Assert.Single(result.Cells);
        Assert.Equal("REAL_RESIDENTIAL", result.Cells[0].UniverseCode);
    }

    [Fact]
    public async Task MaxCells_caps_histogram_size()
    {
        var (svc, sp) = Build();
        for (var i = 0; i < 5; i++)
            await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100 + i, $"GR{i}");

        var result = await svc.ProfileAsync(
            new ImprvAttrQuarantineProfileRequest(MaxCells: 3));

        Assert.Equal(5, result.RowsScopedByFilter);
        Assert.Equal(3, result.Cells.Count);
    }

    [Fact]
    public async Task NULL_universe_rows_are_grouped_distinctly()
    {
        var (svc, sp) = Build();
        await SeedQuarantineRowAsync(sp, null, 100, "GR1");
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "GR1");

        var result = await svc.ProfileAsync(new ImprvAttrQuarantineProfileRequest());

        Assert.Equal(2, result.Cells.Count);
        Assert.Equal(2, result.DistinctUniverses);  // null counts as a distinct value
        Assert.Contains(result.Cells, c => c.UniverseCode == null);
    }

    [Fact]
    public async Task Universe_summary_orders_by_descending_count()
    {
        var (svc, sp) = Build();
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 100, "A");
        await SeedQuarantineRowAsync(sp, "REAL_RESIDENTIAL", 200, "B");
        await SeedQuarantineRowAsync(sp, "AG_CURRENT_USE", 300, "C");

        var result = await svc.ProfileAsync(new ImprvAttrQuarantineProfileRequest());

        Assert.Equal(2, result.UniverseSummary.Count);
        Assert.Equal("REAL_RESIDENTIAL", result.UniverseSummary[0].UniverseCode);
        Assert.Equal(2, result.UniverseSummary[0].Count);
        Assert.Equal("AG_CURRENT_USE", result.UniverseSummary[1].UniverseCode);
        Assert.Equal(1, result.UniverseSummary[1].Count);
    }

    [Fact]
    public async Task Empty_quarantine_yields_zeroes()
    {
        var (svc, sp) = Build();
        var result = await svc.ProfileAsync(new ImprvAttrQuarantineProfileRequest());

        Assert.Equal("COMPLETED", result.Status);
        Assert.Equal(0, result.TotalQuarantineRows);
        Assert.Empty(result.Cells);
        Assert.Empty(result.UniverseSummary);
    }
}
