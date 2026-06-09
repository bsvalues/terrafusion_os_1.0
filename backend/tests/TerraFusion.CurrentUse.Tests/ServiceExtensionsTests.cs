using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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
        var provider = services.BuildServiceProvider();

        await provider.InitializeCurrentUseDatabaseAsync();

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();
        var rates = await db.InterestRates.ToListAsync();
        rates.Should().NotBeEmpty();
        rates.Should().Contain(r => r.Year == 2024);
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
