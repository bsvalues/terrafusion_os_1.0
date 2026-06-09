using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;

namespace TerraFusion.Levy.Tests;

/// <summary>
/// Factory for creating isolated in-memory LevyDbContext instances for unit tests.
/// Each test gets its own database name to prevent cross-test contamination.
/// </summary>
public static class TestLevyDbContextFactory
{
    public static LevyDbContext Create(string? dbName = null)
    {
        dbName ??= $"LevyTest_{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<LevyDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var context = new LevyDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
