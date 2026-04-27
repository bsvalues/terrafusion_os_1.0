using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Wiring tests for the Slice B1.2 SyncSourceConnection schema.
///
/// Verifies entity → EF configuration → DbContext registration. Locked design
/// invariants:
///   - No password column (Windows Integrated default; SqlAuth password external)
///   - Per-county uniqueness on Name
///   - CountyId-scoped queries return only the operator's county data
/// </summary>
public class SyncSourceConnectionSchemaTests
{
    private static TerraFusionDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncSourceConnection_PersistsWindowsIntegratedDefault()
    {
        await using var context = CreateContext($"src-conn-defaults-{Guid.NewGuid()}");

        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        var conn = new SyncSourceConnection
        {
            CountyId = county.Id,
            Name = "Benton PACS Training",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "jcharrispacs",
            Database = "pacs_training",
            AdditionalOptions = "TrustServerCertificate=True"
        };
        context.SyncSourceConnections.Add(conn);
        await context.SaveChangesAsync();

        var loaded = await context.SyncSourceConnections.SingleAsync(x => x.CountyId == county.Id);
        loaded.AuthMode.Should().Be("WindowsIntegrated");  // default
        loaded.Username.Should().BeNull();
        loaded.IsActive.Should().BeTrue();
        loaded.Server.Should().Be("jcharrispacs");
        loaded.Database.Should().Be("pacs_training");
    }

    [Fact]
    public void SyncSourceConnection_HasNoPasswordColumn()
    {
        // Structural assertion: the entity type intentionally has NO Password property.
        // If a future change adds a password column, this test calls it out.
        var properties = typeof(SyncSourceConnection)
            .GetProperties(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public)
            .Select(p => p.Name)
            .ToList();

        properties.Should().NotContain("Password");
        properties.Should().NotContain("PasswordHash");
        properties.Should().NotContain("PasswordEncrypted");
        properties.Should().NotContain("Secret");
        properties.Should().NotContain("ApiKey");
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncSourceConnection_RecordsConnectionDiagnostics()
    {
        await using var context = CreateContext($"src-conn-diag-{Guid.NewGuid()}");

        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        var lastSuccess = DateTimeOffset.UtcNow.AddHours(-1);
        var lastError = DateTimeOffset.UtcNow.AddMinutes(-30);

        context.SyncSourceConnections.Add(new SyncSourceConnection
        {
            CountyId = county.Id,
            Name = "Benton PACS — diagnostics test",
            SourceSystem = "PACS",
            ConnectionType = "SqlServer",
            Server = "jcharrispacs",
            Database = "pacs_training",
            LastSuccessfulConnectionAtUtc = lastSuccess,
            LastConnectionErrorAtUtc = lastError,
            LastConnectionErrorMessage = "Connection timeout after 30 seconds"
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncSourceConnections.SingleAsync(x => x.CountyId == county.Id);
        loaded.LastSuccessfulConnectionAtUtc.Should().BeCloseTo(lastSuccess, TimeSpan.FromSeconds(1));
        loaded.LastConnectionErrorMessage.Should().Contain("timeout");
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncSourceConnection_SoftDisableViaIsActive()
    {
        await using var context = CreateContext($"src-conn-active-{Guid.NewGuid()}");

        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        context.SyncSourceConnections.AddRange(
            new SyncSourceConnection { CountyId = county.Id, Name = "Active conn", SourceSystem = "PACS", ConnectionType = "SqlServer", IsActive = true },
            new SyncSourceConnection { CountyId = county.Id, Name = "Disabled conn", SourceSystem = "PACS", ConnectionType = "SqlServer", IsActive = false }
        );
        await context.SaveChangesAsync();

        var activeOnly = await context.SyncSourceConnections
            .Where(x => x.CountyId == county.Id && x.IsActive)
            .ToListAsync();

        activeOnly.Should().HaveCount(1);
        activeOnly[0].Name.Should().Be("Active conn");
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncSourceConnection_IsCountyScoped()
    {
        await using var context = CreateContext($"src-conn-iso-{Guid.NewGuid()}");

        var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        var wallaWalla = new County { Id = Guid.NewGuid(), Name = "Walla Walla", State = "WA", FipsCode = "53071" };
        context.Counties.AddRange(benton, wallaWalla);
        await context.SaveChangesAsync();

        // Both counties can have a connection literally named the same thing — they're isolated.
        context.SyncSourceConnections.AddRange(
            new SyncSourceConnection { CountyId = benton.Id, Name = "PACS", SourceSystem = "PACS", ConnectionType = "SqlServer", Server = "jcharrispacs" },
            new SyncSourceConnection { CountyId = wallaWalla.Id, Name = "PACS", SourceSystem = "PACS", ConnectionType = "SqlServer", Server = "wwpacs" }
        );
        await context.SaveChangesAsync();

        var bentonConns = await context.SyncSourceConnections.Where(x => x.CountyId == benton.Id).ToListAsync();
        bentonConns.Should().HaveCount(1);
        bentonConns[0].Server.Should().Be("jcharrispacs");

        var bentonNamed = await context.SyncSourceConnections
            .SingleAsync(x => x.CountyId == benton.Id && x.Name == "PACS");
        bentonNamed.Server.Should().Be("jcharrispacs");
        bentonNamed.Server.Should().NotBe("wwpacs");
    }

    [Fact]
    public async System.Threading.Tasks.Task SyncSourceConnection_AllowsMultipleSourceSystemsPerCounty()
    {
        await using var context = CreateContext($"src-conn-multi-{Guid.NewGuid()}");

        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        context.SyncSourceConnections.AddRange(
            new SyncSourceConnection { CountyId = county.Id, Name = "Benton PACS Training", SourceSystem = "PACS", ConnectionType = "SqlServer", Server = "jcharrispacs", Database = "pacs_training" },
            new SyncSourceConnection { CountyId = county.Id, Name = "Benton Ascend 2017 Snapshot", SourceSystem = "Ascend", ConnectionType = "SqlServer", Server = "localhost", Database = "ascprod_2017" }
        );
        await context.SaveChangesAsync();

        var bySource = await context.SyncSourceConnections
            .Where(x => x.CountyId == county.Id)
            .GroupBy(x => x.SourceSystem)
            .Select(g => new { Source = g.Key, Count = g.Count() })
            .ToListAsync();

        bySource.Should().HaveCount(2);
        bySource.Should().Contain(g => g.Source == "PACS");
        bySource.Should().Contain(g => g.Source == "Ascend");
    }
}
