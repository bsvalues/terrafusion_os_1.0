using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using Xunit;
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave43;

/// <summary>Opt-in fresh persisted input fixture; never emits or injects regression observations.</summary>
public sealed class AtlasSpatialAnomalyBrowserBootstrapTests
{
    private static readonly Guid CountyA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid CountyB = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly (decimal Gla, decimal Lot, int Year)[] Predictors =
    [
        (1000m, 5000m, 1980), (1600m, 5000m, 1980), (1000m, 9000m, 1980),
        (1000m, 5000m, 2020), (1800m, 10000m, 2010), (1400m, 7500m, 1990)
    ];

    [Fact]
    public void SyntheticSourceDesign_UsesRealForgeFitWithFullRankPredictors()
    {
        var source = Sales(CountyA).Where(s => s.SlLivingArea > 0).Select(s =>
            new OlsObservation((double)s.SalePrice, (double)s.SlLivingArea!.Value,
                (double)s.SlLandSqft!.Value, s.SlYearBuilt!.Value)).ToList();
        var fitted = new OlsRegressionService().Fit(source);
        Assert.NotNull(fitted);
        Assert.Equal(12, fitted.N);
        for (var i = 0; i < 12; i++)
            Assert.InRange(fitted.Residuals[i], (i < 6 ? 300000d : -300000d) - 1d,
                (i < 6 ? 300000d : -300000d) + 1d);
    }

    [AtlasBrowserBootstrapFact]
    public async Task BootstrapAtlasSpatialAnomaly_CreatesOnlyFreshOwnedPersistedSource()
    {
        var file = Environment.GetEnvironmentVariable("ATLAS_BROWSER_DATABASE_PATH")!;
        var root = RepositoryRoot();
        var ownedRoot = Path.Combine(root, "artifacts", "atlas-browser");
        if (!Path.IsPathFullyQualified(file)) throw new InvalidOperationException("An absolute owned database path is required.");
        var full = Path.GetFullPath(file);
        var directory = Path.GetDirectoryName(full)!;
        var relative = Path.GetRelativePath(ownedRoot, full).Replace('\\', '/');
        if (!Regex.IsMatch(relative, "^run-[A-Za-z0-9-]+/atlas\\.db$"))
            throw new InvalidOperationException("Atlas fixture must be artifacts/atlas-browser/run-<unique>/atlas.db in this test assembly's worktree.");
        for (var parent = new DirectoryInfo(directory); parent != null; parent = parent.Parent)
            if (parent.Exists && parent.Attributes.HasFlag(FileAttributes.ReparsePoint))
                throw new InvalidOperationException("Atlas fixture cannot traverse directory links.");
        if (Directory.Exists(directory) || File.Exists(full))
            throw new InvalidOperationException("Atlas fixture refuses existing run directories or databases.");
        Directory.CreateDirectory(directory);
        using (new FileStream(full, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }

        await using var db = new DataDbContext(new DbContextOptionsBuilder<DataDbContext>()
            .UseSqlite($"Data Source={full};Pooling=False").Options, new ConfigurationBuilder().Build());
        // Same fresh-database pattern as the admitted county-context harness. Schema comes from the
        // actual EF model, not a copied SQL schema or production database. Deduplicate shared tables.
        var schema = db.Database.GenerateCreateScript();
        var tableStatements = Regex.Matches(schema, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;").Cast<Match>().ToArray();
        // SQLite drops PostgreSQL schema names. Unused PACS tables then collide (for example
        // truth_pacs.sale versus legacy_pacs_raw.sale); their indexes cannot target the first
        // definition. Retain all indexes on unambiguous tables, including the actual Atlas inputs.
        var schemaCollisions = tableStatements.GroupBy(statement => statement.Groups[1].Value, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1).Select(group => group.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var inputTable in new[] { "Counties", "Properties", "ComparableSales" })
            Assert.DoesNotContain(inputTable, schemaCollisions);
        var tables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var statement in tableStatements)
            if (tables.Add(statement.Groups[1].Value))
                await db.Database.ExecuteSqlRawAsync(statement.Value);
        var indexes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var indexStatements = Regex.Matches(schema, "CREATE (?:UNIQUE )?INDEX \"([^\"]+)\" ON \"([^\"]+)\"[^;]+;").Cast<Match>().ToArray();
        foreach (var statement in indexStatements)
            if (!schemaCollisions.Contains(statement.Groups[2].Value) && indexes.Add(statement.Groups[1].Value))
                await db.Database.ExecuteSqlRawAsync(statement.Value);

        // Compare actual persisted DDL with every complete EF-generated input-table/index DDL.
        // This includes columns, primary/foreign keys, uniqueness and filtered-index predicates.
        await db.Database.OpenConnectionAsync();
        async Task<string> PersistedDdl(string type, string name)
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT sql FROM sqlite_master WHERE type = $type AND name = $name";
            var typeParameter = command.CreateParameter(); typeParameter.ParameterName = "$type"; typeParameter.Value = type;
            var nameParameter = command.CreateParameter(); nameParameter.ParameterName = "$name"; nameParameter.Value = name;
            command.Parameters.Add(typeParameter); command.Parameters.Add(nameParameter);
            return Assert.IsType<string>(await command.ExecuteScalarAsync());
        }
        var usedSchemaReceipt = new List<object>();
        foreach (var inputTable in new[] { "Counties", "Properties", "ComparableSales" })
        {
            var expectedTable = tableStatements.Single(statement => statement.Groups[1].Value == inputTable);
            Assert.Equal(expectedTable.Value.TrimEnd(';'), await PersistedDdl("table", inputTable));
            var expectedIndexes = indexStatements.Where(statement => statement.Groups[2].Value == inputTable).ToArray();
            foreach (var index in expectedIndexes)
                Assert.Equal(index.Value.TrimEnd(';'), await PersistedDdl("index", index.Groups[1].Value));
            usedSchemaReceipt.Add(new { table = inputTable, exactEfTableDdl = true,
                exactEfIndexDdl = expectedIndexes.Select(index => index.Groups[1].Value).ToArray() });
        }

        db.Counties.AddRange(
            // Canonical metadata admits these isolated synthetic IDs through the unchanged resolver.
            new County { Id = CountyA, Name = "Benton", State = "WA", FipsCode = "53005" },
            new County { Id = CountyB, Name = "Yakima", State = "WA", FipsCode = "53077" });
        foreach (var county in new[] { CountyA, CountyB })
        {
            foreach (var sale in Sales(county))
            {
                db.ComparableSales.Add(sale);
                db.Properties.Add(new Property { CountyId = county, ParcelId = sale.ParcelId,
                    PropertyId = sale.ParcelId, ParcelNumber = sale.ParcelId, Neighborhood = sale.Neighborhood,
                    Address = "Synthetic Atlas browser fixture only", PropertyType = "Residential", TaxYear = 2026,
                    YearBuilt = sale.SlYearBuilt, OwnerName = "Synthetic owner" });
            }
        }
        await db.SaveChangesAsync();
        // The real runtime rejects unknown county rows even when their GUID exists.
        // Keep this fixture admission check ahead of any browser/token launch.
        using var countyCache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 1 });
        var countyResolver = new CountyResolver(db, countyCache, NullLogger<CountyResolver>.Instance);
        Assert.Equal(CountyA, await countyResolver.TryResolveAsync(CountyA.ToString()));
        Assert.Equal(CountyA, await countyResolver.TryResolveAsync("Benton"));
        Assert.Equal(CountyA, await countyResolver.TryResolveAsync("wa-benton"));
        Assert.Equal(CountyA, await countyResolver.TryResolveAsync("53005"));
        Assert.Equal(CountyB, await countyResolver.TryResolveAsync(CountyB.ToString()));
        Assert.Equal(CountyB, await countyResolver.TryResolveAsync("Yakima"));
        Assert.Equal(CountyB, await countyResolver.TryResolveAsync("wa-yakima"));
        Assert.Equal(CountyB, await countyResolver.TryResolveAsync("53077"));
        Assert.Equal(26, await db.ComparableSales.CountAsync());
        Assert.Equal(13, await db.ComparableSales.CountAsync(s => s.CountyId == CountyA));
        Assert.Equal(0, await db.ComparableSales.CountAsync(s => s.SalesYear == 2027));
        await using var receipt = new FileStream(Path.Combine(directory, "seed-receipt.json"), FileMode.CreateNew, FileAccess.Write);
        await JsonSerializer.SerializeAsync(receipt, new { purpose = "Synthetic persisted Atlas source, not observations or browser proof",
            countyA = CountyA, countyB = CountyB, qualifiedRowsPerCounty = 13, usableRowsPerCounty = 12,
            validYear = 2026, emptyYear = 2027, neighborhoods = new[] { "north", "south" }, database = full,
            unusedSqliteSchemaCollisions = schemaCollisions.OrderBy(name => name).ToArray(), usedSchemaReceipt });
    }

    private static IEnumerable<ComparableSale> Sales(Guid county)
    {
        foreach (var neighborhood in new[] { "north", "south" })
            for (var i = 0; i < Predictors.Length; i++)
            {
                var vector = Predictors[i];
                yield return new ComparableSale { CountyId = county,
                    ParcelId = $"SYN-ATLAS-{(county == CountyA ? "A" : "B")}-{neighborhood}-{i}",
                    SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc), SalesYear = 2026,
                    SalePrice = county == CountyA ? (neighborhood == "north" ? 800000m : 200000m) : 500000m,
                    SlLivingArea = vector.Gla, SlLandSqft = vector.Lot, SlYearBuilt = vector.Year,
                    Neighborhood = neighborhood, PropertyType = "residential", QualificationDecision = "qualified",
                    IncludeNoCalc = false, IngestedBy = "Atlas synthetic browser bootstrap" };
            }
        yield return new ComparableSale { CountyId = county, ParcelId = $"SYN-ATLAS-{(county == CountyA ? "A" : "B")}-EXCLUDED",
            SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc), SalesYear = 2026,
            SalePrice = 500000m, Neighborhood = "north", PropertyType = "residential",
            QualificationDecision = "qualified", IngestedBy = "Atlas synthetic browser bootstrap" };
    }

    private static string RepositoryRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
            if (File.Exists(Path.Combine(directory.FullName, "CANON_INDEX.md")) &&
                File.Exists(Path.Combine(directory.FullName, "backend", "tests", "TerraFusion.Unit.Tests", "TerraFusion.Unit.Tests.csproj")))
                return directory.FullName;
        throw new InvalidOperationException("Cannot locate the test assembly's own repository.");
    }

    public sealed class AtlasBrowserBootstrapFactAttribute : FactAttribute
    {
        public AtlasBrowserBootstrapFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ATLAS_BROWSER_DATABASE_PATH")))
                Skip = "Explicit isolated Atlas browser database path is required; this is not browser acceptance.";
        }
    }
}
