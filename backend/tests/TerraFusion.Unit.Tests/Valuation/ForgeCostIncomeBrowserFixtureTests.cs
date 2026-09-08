using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.Unit.Tests.Valuation;

// Only prerequisite records in a NEW owned database. No canonical output, audit,
// request ID, trace, or successful workflow is seeded by this fixture.
public sealed class ForgeCostIncomeBrowserFixtureTests
{
    [Fact]
    public async System.Threading.Tasks.Task BootstrapFreshForgeCostIncomeBrowserPrerequisites()
    {
        var requested = Environment.GetEnvironmentVariable("TF_FORGE_BROWSER_DATABASE");
        if (string.IsNullOrWhiteSpace(requested)) return;
        var repository = new DirectoryInfo(AppContext.BaseDirectory);
        while (repository != null && !File.Exists(Path.Combine(repository.FullName, ".git"))
            && !Directory.Exists(Path.Combine(repository.FullName, ".git")))
            repository = repository.Parent;
        Assert.NotNull(repository);
        var allowedRoot = Path.GetFullPath(Path.Combine(repository.FullName, ".tmp/forge-cost-income-browser"));
        var database = Path.GetFullPath(requested);
        var run = new DirectoryInfo(Path.GetDirectoryName(database)!);
        Assert.Equal(allowedRoot, run.Parent!.FullName);
        Assert.Matches("^run-[a-f0-9]{32}$", run.Name);
        Assert.Equal("forge.db", Path.GetFileName(database));
        Assert.False(File.Exists(database), "Never replace an existing database.");
        for (DirectoryInfo? current = run; current != null; current = current.Parent)
            if (current.Exists) Assert.Equal(0, (int)(current.Attributes & FileAttributes.ReparsePoint));
        Directory.CreateDirectory(run.FullName);
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            { ["DatabaseProvider"] = "SQLite" }).Build();
        await using var db = new TerraFusion.Data.TerraFusionDbContext(
            new DbContextOptionsBuilder<TerraFusion.Data.TerraFusionDbContext>().UseSqlite($"Data Source={database}").Options,
            configuration);
        // Existing root Workbench SQLite fixture pattern: actual EF-generated tables,
        // de-duplicated names only; no production migration or schema edits.
        var created = new HashSet<string>(StringComparer.Ordinal);
        foreach (var statement in db.Database.GenerateCreateScript().Replace("\r\n", "\n")
            .Split(";\n", StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim())
            .Where(s => s.StartsWith("CREATE TABLE \"", StringComparison.Ordinal)))
        {
            var name = statement[14..statement.IndexOf('"', 14)];
            if (created.Add(name)) await db.Database.ExecuteSqlRawAsync(statement);
        }
        var benton = Guid.Parse("19190019-1919-1919-1919-191919191919");
        var foreign = Guid.Parse("22222222-2222-2222-2222-222222222222");
        db.Counties.AddRange(new County { Id = benton, Name = "Benton", State = "WA", FipsCode = "53005" },
            new County { Id = foreign, Name = "Franklin", State = "WA", FipsCode = "53021" });
        foreach (var (parcel, county) in new[] { ("SYNTHETIC-FORGE-P1", benton), ("SYNTHETIC-FORGE-P2", benton),
            ("SYNTHETIC-FORGE-FOREIGN", foreign) })
            db.Properties.Add(new Property { PropertyId = parcel, ParcelId = parcel, ParcelNumber = parcel + "-NUMBER",
                CountyId = county, Address = "100 Synthetic Test Way", PropertyType = "Residential", YearBuilt = 2000,
                LandValue = 25000, ImprovementValue = 0, AssessedValue = 25000, MarketValue = 25000, TaxYear = 2026,
                AssessmentDate = DateTime.SpecifyKind(new DateTime(2026, 1, 1), DateTimeKind.Utc), LastUpdated = DateTime.UtcNow });
        await db.SaveChangesAsync();
        // Real resolver, not a mock: even GUID lookup requires consistent WA registry identity.
        using var cache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 10 });
        var resolver = new CountyResolver(db, cache, NullLogger<CountyResolver>.Instance);
        Assert.Equal(benton, await resolver.ResolveAsync(benton.ToString()));
        Assert.Equal(benton, await resolver.ResolveAsync("Benton"));
        Assert.Equal(benton, await resolver.ResolveAsync("53005"));
        Assert.Equal(foreign, await resolver.ResolveAsync(foreign.ToString()));
        Assert.Equal(foreign, await resolver.ResolveAsync("Franklin"));
        Assert.Equal(foreign, await resolver.ResolveAsync("53021"));
        Assert.Equal(3, await db.Properties.CountAsync());
        // SaveChanges legitimately audits the five prerequisite inserts. Preserve
        // those real EF records; no calculation/metric/CID may be precreated.
        var prerequisiteAudit = await db.AuditLogs.ToListAsync();
        Assert.Equal(5, prerequisiteAudit.Count);
        Assert.DoesNotContain(prerequisiteAudit, entry => entry.Type.StartsWith("CostForge:Canonical:"));
        Assert.All(prerequisiteAudit, entry => Assert.Null(entry.CorrelationId));
    }

    [Fact]
    public async System.Threading.Tasks.Task VerifyForgeBrowserCalculationsDidNotSaveValues()
    {
        var requested = Environment.GetEnvironmentVariable("TF_FORGE_BROWSER_DATABASE");
        if (string.IsNullOrWhiteSpace(requested)) return;
        var repository = new DirectoryInfo(AppContext.BaseDirectory);
        while (repository != null && !File.Exists(Path.Combine(repository.FullName, ".git"))
            && !Directory.Exists(Path.Combine(repository.FullName, ".git")))
            repository = repository.Parent;
        Assert.NotNull(repository);
        var database = Path.GetFullPath(requested);
        var run = new DirectoryInfo(Path.GetDirectoryName(database)!);
        Assert.Equal(Path.GetFullPath(Path.Combine(repository.FullName, ".tmp/forge-cost-income-browser")), run.Parent!.FullName);
        Assert.Matches("^run-[a-f0-9]{32}$", run.Name);
        Assert.Equal("forge.db", Path.GetFileName(database));
        Assert.True(File.Exists(database));
        for (DirectoryInfo? current = run; current != null; current = current.Parent)
            if (current.Exists) Assert.Equal(0, (int)(current.Attributes & FileAttributes.ReparsePoint));
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            { ["DatabaseProvider"] = "SQLite" }).Build();
        await using var db = new TerraFusion.Data.TerraFusionDbContext(
            new DbContextOptionsBuilder<TerraFusion.Data.TerraFusionDbContext>()
                .UseSqlite($"Data Source={database};Mode=ReadOnly").Options, configuration);
        var properties = await db.Properties.AsNoTracking().ToListAsync();
        Assert.Equal(3, properties.Count);
        Assert.All(properties, property =>
        {
            Assert.StartsWith("SYNTHETIC-FORGE-", property.ParcelId);
            Assert.Equal(25000m, property.LandValue);
            Assert.Equal(0m, property.ImprovementValue);
            Assert.Equal(25000m, property.AssessedValue);
            Assert.Equal(25000m, property.MarketValue);
        });
        // Actual controller-generated audit rows must exist; none were seeded.
        var audit = await db.AuditLogs.AsNoTracking()
            .Where(entry => entry.Type.StartsWith("CostForge:Canonical:")).ToListAsync();
        Assert.Contains(audit, entry => entry.Type == "CostForge:Canonical:cost:Metric");
        Assert.Contains(audit, entry => entry.Type == "CostForge:Canonical:income:Metric");
        Assert.All(audit, entry => Assert.False(string.IsNullOrWhiteSpace(entry.CorrelationId)));
    }
}
