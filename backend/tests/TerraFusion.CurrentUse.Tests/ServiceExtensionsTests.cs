using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Services;
using Xunit;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Tests for DI registration and database initialization.
/// Verifies that AddCurrentUseServices correctly registers all services.
/// </summary>
public class ServiceExtensionsTests
{
    [Fact]
    public void AddCurrentUseServices_RegistersAllServices()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CurrentUse"] = "InMemory"
            })
            .Build();

        // Act
        services.AddCurrentUseServices(config);
        var provider = services.BuildServiceProvider();

        // Assert
        provider.GetService<CurrentUseDbContext>().Should().NotBeNull();
        provider.GetService<IClassificationService>().Should().NotBeNull();
        provider.GetService<IRollbackCalculationService>().Should().NotBeNull();
        provider.GetService<IInterestService>().Should().NotBeNull();
        provider.GetService<IRemovalService>().Should().NotBeNull();
        provider.GetService<IPenaltyExceptionService>().Should().NotBeNull();
    }

    [Fact]
    public async Task InitializeCurrentUseDatabaseAsync_InMemory_CreatesDatabase()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CurrentUse"] = "InMemory"
            })
            .Build();
        services.AddCurrentUseServices(config);
        var provider = services.BuildServiceProvider();

        // Act
        await provider.InitializeCurrentUseDatabaseAsync();

        // Assert — seed data should be present
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();
        var classifications = await db.Classifications.ToListAsync();
        classifications.Should().NotBeEmpty();
    }

    [Fact]
    public async Task InitializeCurrentUseDatabaseAsync_SeedsInterestRates()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CurrentUse"] = "InMemory"
            })
            .Build();
        services.AddCurrentUseServices(config);
        using var provider = services.BuildServiceProvider();

        await provider.InitializeCurrentUseDatabaseAsync();

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();
        var rates = await db.InterestRates.ToListAsync();
        rates.Should().NotBeEmpty();
        rates.Should().Contain(r => r.Year == 2024);
    }

    [Fact]
    public async Task InitializeCurrentUseDatabaseAsync_SqliteProvider_UsesSqliteAndSeedsInterestRates()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"currentuse-{Guid.NewGuid():N}.db");

        try
        {
            var services = new ServiceCollection();
            services.AddLogging();
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DatabaseProvider"] = "Sqlite",
                    ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbPath}"
                })
                .Build();
            services.AddCurrentUseServices(config);
            using var provider = services.BuildServiceProvider();

            await provider.InitializeCurrentUseDatabaseAsync();

            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();
            db.Database.ProviderName.Should().Be("Microsoft.EntityFrameworkCore.Sqlite");
            var rates = await db.InterestRates.ToListAsync();
            rates.Should().NotBeEmpty();
            rates.Should().Contain(r => r.Year == DateTime.UtcNow.Year);
        }
        finally
        {
            if (File.Exists(dbPath))
            {
                try
                {
                    File.Delete(dbPath);
                }
                catch (IOException)
                {
                    // SQLite can keep a short-lived file handle on Windows test
                    // hosts after DbContext disposal; the temp file name is
                    // unique, so cleanup failure must not mask provider regressions.
                }
            }
        }
    }

    [Fact]
    public void AddCurrentUseServices_DedicatedPostgresConnection_IgnoresGlobalSqliteProviderHint()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DatabaseProvider"] = "Sqlite",
                ["ConnectionStrings:DefaultConnection"] = "Data Source=terrafusion.db",
                ["ConnectionStrings:CurrentUse"] = "Host=localhost;Database=currentuse;Username=postgres;Password=postgres"
            })
            .Build();

        services.AddCurrentUseServices(config);
        using var provider = services.BuildServiceProvider();

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();
        db.Database.ProviderName.Should().Be("Npgsql.EntityFrameworkCore.PostgreSQL");
    }

    [Fact]
    public async Task InitializeCurrentUseDatabaseAsync_SqliteSharedDatabase_CreatesCurrentUseTablesWhenOtherTablesExist()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"currentuse-shared-{Guid.NewGuid():N}.db");

        try
        {
            await using (var connection = new SqliteConnection($"Data Source={dbPath}"))
            {
                await connection.OpenAsync();
                await using var command = connection.CreateCommand();
                command.CommandText = "CREATE TABLE existing_runtime_table (id INTEGER PRIMARY KEY);";
                await command.ExecuteNonQueryAsync();
            }

            var services = new ServiceCollection();
            services.AddLogging();
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DatabaseProvider"] = "Sqlite",
                    ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbPath}"
                })
                .Build();

            services.AddCurrentUseServices(config);
            using var provider = services.BuildServiceProvider();

            await provider.InitializeCurrentUseDatabaseAsync();

            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();
            db.Database.ProviderName.Should().Be("Microsoft.EntityFrameworkCore.Sqlite");
            var rates = await db.InterestRates.ToListAsync();
            rates.Should().NotBeEmpty();
        }
        finally
        {
            if (File.Exists(dbPath))
            {
                try
                {
                    File.Delete(dbPath);
                }
                catch (IOException)
                {
                    // SQLite can keep a short-lived file handle on Windows test
                    // hosts after DbContext disposal; the temp file name is
                    // unique, so cleanup failure must not mask provider regressions.
                }
            }
        }
    }

    [Fact]
    public void DbContext_HasCorrectSchema()
    {
        using var db = TestDbContextFactory.CreateSeeded();

        db.Classifications.Should().NotBeNull();
        db.InterestRates.Should().NotBeNull();
        db.Removals.Should().NotBeNull();
        db.AuditEntries.Should().NotBeNull();
    }
}
