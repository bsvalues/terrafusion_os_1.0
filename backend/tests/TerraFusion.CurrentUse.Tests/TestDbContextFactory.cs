using Microsoft.EntityFrameworkCore;
using TerraFusion.CurrentUse.Data;

namespace TerraFusion.CurrentUse.Tests;

/// <summary>
/// Factory for creating in-memory CurrentUseDbContext instances for testing.
/// Each test gets a unique database name to ensure isolation.
/// </summary>
public static class TestDbContextFactory
{
    public static CurrentUseDbContext Create(string? dbName = null)
    {
        dbName ??= Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<CurrentUseDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new CurrentUseDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    /// <summary>
    /// Creates a context with seed data already applied (from OnModelCreating HasData).
    /// </summary>
    public static CurrentUseDbContext CreateSeeded()
    {
        var dbName = $"seeded_{Guid.NewGuid()}";
        var context = Create(dbName);
        // EnsureCreated already applies HasData seeds for InMemory provider
        return context;
    }
}
