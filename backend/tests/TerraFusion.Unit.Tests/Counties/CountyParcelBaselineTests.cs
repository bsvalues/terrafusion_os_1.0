using System.Reflection;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Auth;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Services;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;
using Xunit;

namespace TerraFusion.Unit.Tests.Counties;

public sealed class CountyParcelBaselineTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime Updated = new(2026, 9, 1, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Metadata_route_requires_assessor_and_disables_response_caching()
    {
        var action = typeof(CountyRowsController).GetMethod("GetParcelBaseline");
        Assert.NotNull(action);
        Assert.Equal("parcel-baseline", action.GetCustomAttribute<HttpGetAttribute>()!.Template);
        Assert.Equal("RequireAssessor", action.GetCustomAttribute<AuthorizeAttribute>()!.Policy);
        Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.True(action.GetCustomAttribute<ResponseCacheAttribute>()!.NoStore);
    }

    [Fact]
    public async Task All_39_canonical_counties_return_the_authorized_identity_without_defaulting()
    {
        Assert.Equal(39, WashingtonCountyRegistry.Counties.Count);
        foreach (var county in WashingtonCountyRegistry.Counties)
        {
            await using var db = Database();
            var result = await Controller(db).GetParcelBaseline(county.CountyCode, Provider(county.Key));
            var value = Assert.IsType<CountyParcelBaselineReceipt>(Assert.IsType<OkObjectResult>(result).Value);
            Assert.Equal(county.Key, value.CountyKey);
            Assert.Equal(county.Name, value.CountyName);
            Assert.Equal(county.FipsCode, value.FipsCode);
            Assert.Equal(CountyId, value.CountyId);
            Assert.Equal(0, value.ObservedParcelCount);
            Assert.Equal(0, value.LinkedParcelCount);
            Assert.Null(value.LatestParcelUpdatedAtUtc);
            Assert.Equal("no-parcels", value.Status);
            Assert.Equal(new[] { "no-runtime-parcels", "public-provenance-unverified", "source-use-unverified" }, value.GapReasons);
            Assert.False(value.PublicReady);
        }
    }

    [Theory]
    [InlineData("005", true, "wa-spokane")]
    [InlineData("999", true, "wa-spokane")]
    [InlineData("", true, "wa-spokane")]
    [InlineData("063", false, "wa-spokane")]
    [InlineData("063", true, "unknown")]
    public async Task Unauthorized_or_unknown_county_returns_data_free_denial_before_query(
        string target, bool authenticated, string authority)
    {
        // A disposed context makes any accidental data read fail instead of returning a denial.
        var db = Database();
        var controller = Controller(db);
        await db.DisposeAsync();
        Assert.IsType<ForbidResult>(await controller.GetParcelBaseline(target, Provider(authority, authenticated)));
    }

    [Fact]
    public async Task Runtime_count_is_distinct_active_county_parcels_and_never_a_public_count()
    {
        await using var db = Database();
        var first = Parcel("ONE");
        var duplicate = Parcel("ONE");
        duplicate.UpdatedAt = Updated.AddDays(-1);
        var second = Parcel("TWO");
        second.ConversionEra = "WA_INITIAL_SEED";
        db.TfParcels.AddRange(first, duplicate, second, Parcel("FOREIGN", Guid.NewGuid()),
            Parcel("INACTIVE", status: "INACTIVE"), Parcel(null), Parcel(""), Parcel("   "));
        db.SyncBridgeSourceXrefs.AddRange(
            Xref(first.TfParcelId, 1), Xref(first.TfParcelId, 2),
            Xref(second.TfParcelId, 3, active: false), Xref(second.TfParcelId, 4, type: "sale"),
            Xref(Guid.NewGuid(), 5));
        await db.SaveChangesAsync();
        var result = await Controller(db).GetParcelBaseline("063", Provider("wa-spokane"));
        var value = Assert.IsType<CountyParcelBaselineReceipt>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(2, value.ObservedParcelCount);
        Assert.Equal(1, value.LinkedParcelCount);
        Assert.Equal(Updated, value.LatestParcelUpdatedAtUtc);
        Assert.Equal("unverified", value.Status);
        Assert.Equal("unverified", value.PublicProvenance);
        Assert.Equal("unverified", value.SourceUse);
        Assert.False(value.PublicReady);
        Assert.Equal(new[] { "public-provenance-unverified", "source-use-unverified" }, value.GapReasons);
        Assert.Empty(db.ChangeTracker.Entries().Where(entry => entry.State != EntityState.Unchanged));
    }

    [Fact]
    public async Task Sales_and_unbound_source_references_do_not_become_landed_parcels()
    {
        await using var db = Database();
        db.TfSales.Add(new TfSale { CountyId = CountyId, TfParcelId = Guid.NewGuid() });
        db.SyncBridgeSourceXrefs.Add(Xref(Guid.NewGuid(), 1));
        await db.SaveChangesAsync();
        var result = await Controller(db).GetParcelBaseline("063", Provider("wa-spokane"));
        var value = Assert.IsType<CountyParcelBaselineReceipt>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(0, value.ObservedParcelCount);
        Assert.Equal(0, value.LinkedParcelCount);
        Assert.Equal("no-parcels", value.Status);
        Assert.False(value.PublicReady);
    }

    [Fact]
    public async Task Cancellation_is_not_reported_as_an_empty_baseline()
    {
        await using var db = Database();
        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            Controller(db).GetParcelBaseline("063", Provider("wa-spokane"), cancelled.Token));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Sqlite_translates_empty_and_populated_projection_without_changing_data_or_audits(bool populated)
    {
        await using var connection = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = new TerraFusionDbContext(new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite(connection).Options, new ConfigurationBuilder().Build());
        await CreateRequiredSchema(db);
        if (populated)
        {
            var first = Parcel("ONE");
            db.TfParcels.AddRange(first, Parcel("ONE"), Parcel("TWO"),
                Parcel("FOREIGN", Guid.NewGuid()), Parcel("INACTIVE", status: "INACTIVE"),
                Parcel(null), Parcel(""), Parcel("   "));
            db.SyncBridgeSourceXrefs.AddRange(Xref(first.TfParcelId, 1), Xref(first.TfParcelId, 2),
                Xref(Guid.NewGuid(), 3), Xref(first.TfParcelId, 4, active: false));
            await db.SaveChangesAsync();
            Assert.Equal(12, await db.AuditLogs.CountAsync());
            Assert.All(await db.AuditLogs.ToListAsync(), audit =>
            {
                Assert.Equal("EntityFramework", audit.Source);
                Assert.EndsWith("_Added", audit.Type);
            });
        }
        var auditsBefore = await db.AuditLogs.AsNoTracking().OrderBy(a => a.Id).Select(a => a.Id).ToArrayAsync();
        var parcelRowsBefore = await db.TfParcels.CountAsync();
        db.ChangeTracker.Clear();
        var result = await Controller(db).GetParcelBaseline("063", Provider("wa-spokane"));
        var value = Assert.IsType<CountyParcelBaselineReceipt>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(populated ? 2 : 0, value.ObservedParcelCount);
        Assert.Equal(populated ? 1 : 0, value.LinkedParcelCount);
        Assert.Equal(populated ? "unverified" : "no-parcels", value.Status);
        Assert.False(value.PublicReady);
        if (populated) Assert.Equal(Updated, value.LatestParcelUpdatedAtUtc);
        else Assert.Null(value.LatestParcelUpdatedAtUtc);
        Assert.Empty(db.ChangeTracker.Entries());
        Assert.Equal(parcelRowsBefore, await db.TfParcels.CountAsync());
        Assert.Equal(auditsBefore, await db.AuditLogs.AsNoTracking().OrderBy(a => a.Id).Select(a => a.Id).ToArrayAsync());
    }

    [ParcelBrowserBootstrapFact]
    public async Task Bootstrap_creates_only_fresh_owned_parcel_context_and_required_audit_schema()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "CANON_INDEX.md")))
            root = root.Parent;
        Assert.NotNull(root);
        var file = Environment.GetEnvironmentVariable("WAL001F_BROWSER_DATABASE_PATH")!;
        Assert.True(Path.IsPathFullyQualified(file));
        var full = Path.GetFullPath(file);
        var ownedRoot = Path.Combine(root.FullName, "artifacts", "wal001f-browser");
        Assert.Matches("^run-[A-Za-z0-9-]+/parcels\\.db$", Path.GetRelativePath(ownedRoot, full).Replace('\\', '/'));
        var directory = Path.GetDirectoryName(full)!;
        for (var parent = new DirectoryInfo(directory); parent is not null; parent = parent.Parent)
            Assert.False(parent.Exists && parent.Attributes.HasFlag(FileAttributes.ReparsePoint));
        Assert.False(Directory.Exists(directory));
        Assert.False(File.Exists(full));
        Directory.CreateDirectory(directory);
        using (new FileStream(full, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
        await using var db = new TerraFusionDbContext(new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite($"Data Source={full};Pooling=False").Options, new ConfigurationBuilder().Build());
        await CreateRequiredSchema(db);
        db.Counties.AddRange(
            new TerraFusion.Core.Entities.County { Id = CountyId, Name = "Spokane", State = "WA", FipsCode = "53063" },
            new TerraFusion.Core.Entities.County { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Benton", State = "WA", FipsCode = "53005" });
        var parcel = Parcel("SYNTHETIC-WAL001F-ONE");
        db.TfParcels.AddRange(parcel, Parcel("SYNTHETIC-WAL001F-TWO"));
        db.SyncBridgeSourceXrefs.Add(Xref(parcel.TfParcelId, 1));
        await db.SaveChangesAsync();
        var audits = await db.AuditLogs.AsNoTracking().ToArrayAsync();
        Assert.Equal(5, audits.Length);
        Assert.All(audits, audit => Assert.Equal("EntityFramework", audit.Source));
        Assert.Equal(2, audits.Count(audit => audit.Type == "County_Added"));
        Assert.Equal(2, audits.Count(audit => audit.Type == "TfParcel_Added"));
        Assert.Single(audits.Where(audit => audit.Type == "SourceXref_Added"));
        var result = await Controller(db).GetParcelBaseline("063", Provider("wa-spokane"));
        var value = Assert.IsType<CountyParcelBaselineReceipt>(Assert.IsType<OkObjectResult>(result).Value);
        Assert.Equal(2, value.ObservedParcelCount);
        Assert.Equal(1, value.LinkedParcelCount);
        Assert.Equal(DateTimeKind.Utc, value.LatestParcelUpdatedAtUtc!.Value.Kind);
        Assert.False(value.PublicReady);
        Assert.Equal(5, await db.AuditLogs.CountAsync());
    }

    private static async Task CreateRequiredSchema(TerraFusionDbContext db)
    {
        var ddl = db.Database.GenerateCreateScript();
        var tables = Regex.Matches(ddl, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;").Cast<Match>().ToArray();
        var indexes = Regex.Matches(ddl, "CREATE (?:UNIQUE )?INDEX \"([^\"]+)\" ON \"([^\"]+)\"[^;]+;").Cast<Match>().ToArray();
        // SaveChangesAsync and the HTTP AuditLoggingMiddleware require AuditLogs.
        // Keep the actual model's constraints and indexes; never bypass auditing.
        // HUB companion reads require real, empty sales/connection tables; both reference Counties.
        var needed = new[] { "Counties", "tf_parcel", "source_xref", "AuditLogs", "ComparableSales", "SyncSourceConnections" };
        foreach (var name in needed)
        {
            var table = Assert.Single(tables.Where(match => match.Groups[1].Value == name));
            foreach (Match foreignKey in Regex.Matches(table.Value, "REFERENCES \"([^\"]+)\""))
                Assert.Contains(foreignKey.Groups[1].Value, needed);
            await db.Database.ExecuteSqlRawAsync(table.Value);
        }
        foreach (var index in indexes.Where(match => needed.Contains(match.Groups[2].Value)))
            await db.Database.ExecuteSqlRawAsync(index.Value);
        await db.Database.OpenConnectionAsync();
        foreach (var statement in tables.Where(match => needed.Contains(match.Groups[1].Value))
            .Concat(indexes.Where(match => needed.Contains(match.Groups[2].Value))))
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT sql FROM sqlite_master WHERE name = $name";
            var parameter = command.CreateParameter();
            parameter.ParameterName = "$name";
            parameter.Value = statement.Groups[1].Value;
            command.Parameters.Add(parameter);
            Assert.Equal(statement.Value.TrimEnd(';'), Assert.IsType<string>(await command.ExecuteScalarAsync()));
        }
        Assert.False(await db.ComparableSales.AnyAsync());
        Assert.False(await db.SyncSourceConnections.AnyAsync());
    }

    public sealed class ParcelBrowserBootstrapFactAttribute : FactAttribute
    {
        public ParcelBrowserBootstrapFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("WAL001F_BROWSER_DATABASE_PATH")))
                Skip = "Requires an assigned runtime slot and a fresh owned WAL001F database path; not browser acceptance.";
        }
    }

    private static TerraFusionDbContext Database() => new(
        new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new ConfigurationBuilder().Build());

    private static CountyRowsController Controller(TerraFusionDbContext db) =>
        new(db, NullLogger<CountyRowsController>.Instance);

    private static TfParcel Parcel(string? number, Guid? county = null, string status = "ACTIVE") =>
        new() { CountyId = county ?? CountyId, ParcelNumber = number, ParcelStatus = status,
            CreatedAt = Updated, UpdatedAt = Updated };

    private static SourceXref Xref(Guid parcelId, long id, bool active = true, string type = "parcel") =>
        new() { XrefId = id, TfEntityId = parcelId, TfEntityType = type, IsActive = active,
            SourceSystem = $"WaTech public {id}", SourceKeyJson = "{\"sourceCount\":999999}",
            SourceQueryHash = $"fixture-{id}", LoadBatchId = Guid.NewGuid(),
            FirstSeenAt = Updated, LastSeenAt = Updated };

    private static AuthenticatedCanonicalCountyContextProvider Provider(string county, bool authenticated = true)
    {
        var resolver = new FixtureResolver(county);
        var accessor = new FixtureAccessor(new RequestUserContext(authenticated, "test-assessor", county, new[] { "Assessor" }));
        return new(new AuthenticatedCountyAuthorityBinding(accessor, resolver), new AuthenticatedCanonicalCountyContext(resolver));
    }

    private sealed class FixtureAccessor(RequestUserContext current) : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; } = current;
    }

    private sealed class FixtureResolver(string boundKey) : ICountyResolver
    {
        // Each request fixture establishes only its named county, exactly as the real binding chain requires.
        public Task<Guid?> TryResolveAsync(string value, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();
            if (!WashingtonCountyRegistry.TryResolve(value, out var county)) return Task.FromResult<Guid?>(null);
            return Task.FromResult<Guid?>(county.Key == boundKey ? CountyId : null);
        }
        public async Task<Guid> ResolveAsync(string value, CancellationToken ct = default) =>
            await TryResolveAsync(value, ct) ?? throw new CountyNotFoundException(value);
    }
}
