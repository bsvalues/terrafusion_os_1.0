/*
 * TestDbContextFactory
 *
 * Factory for creating test database contexts with proper IConfiguration mock.
 * Provides consistent test DB setup across all test suites.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using TerraFusion.Data;

namespace TerraFusion.API.Tests.TestHelpers;

/// <summary>
/// Factory for creating test database contexts with in-memory provider
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Creates a new TerraFusionDbContext configured for in-memory testing
    /// </summary>
    /// <param name="databaseName">Unique database name for test isolation (defaults to GUID)</param>
    /// <returns>Configured test database context</returns>
    public static TerraFusionDbContext CreateInMemoryContext(string? databaseName = null)
    {
        databaseName ??= $"TestDatabase_{Guid.NewGuid()}";

        // Create minimal IConfiguration mock with required settings
        var configurationMock = new Mock<IConfiguration>();
        configurationMock.Setup(c => c["ConnectionStrings:DefaultConnection"])
            .Returns($"Data Source={databaseName}.db");
        configurationMock.Setup(c => c["Logging:EnableSensitiveDataLogging"])
            .Returns("true");

        // Create DbContextOptions with in-memory database
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .EnableSensitiveDataLogging()
            .EnableDetailedErrors()
            .Options;

        return new TerraFusionDbContext(options, configurationMock.Object);
    }
}
