using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.Seeds;
using TerraFusion.Core.Entities;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;
using SystemTask = System.Threading.Tasks.Task;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

public class DX04DevGovernmentUserSeederTests
{
    [Fact]
    public async SystemTask SeedAsync_CreatesKnownDevAdminUser()
    {
        await using var db = CreateTestDbContext();
        await db.Database.EnsureCreatedAsync();
        // Pre-seed the Benton County row so the GovernmentUser → County FK is satisfied
        // (CI-HYGIENE-D #739: InMemory ignores FK enforcement, but seeding keeps the
        // test honest if the provider ever shifts back to a relational fixture).
        await DatabaseSeeder.SeedDossierRuntimeDataAsync(db);

        var seeder = CreateSeeder(db);

        await seeder.SeedAsync();

        var user = await db.GovernmentUsers.SingleAsync();
        user.Email.Should().Be(DevGovernmentUserSeeder.DevAdminEmail);
        user.Role.Should().Be(DevGovernmentUserSeeder.DevAdminRole);
        user.CountyId.Should().Be(DatabaseSeeder.BentonCountyId);
        user.IsActive.Should().BeTrue();
        user.FirstName.Should().Be("Dev");
        user.LastName.Should().Be("Administrator");
    }

    [Fact]
    public async SystemTask SeedAsync_IsIdempotent()
    {
        await using var db = CreateTestDbContext();
        await db.Database.EnsureCreatedAsync();
        // Pre-seed the Benton County row so the GovernmentUser → County FK is satisfied
        // (CI-HYGIENE-D #739: InMemory ignores FK enforcement, but seeding keeps the
        // test honest if the provider ever shifts back to a relational fixture).
        await DatabaseSeeder.SeedDossierRuntimeDataAsync(db);

        var seeder = CreateSeeder(db);

        await seeder.SeedAsync();
        await seeder.SeedAsync();

        var users = await db.GovernmentUsers
            .Where(u => u.Email == DevGovernmentUserSeeder.DevAdminEmail)
            .ToListAsync();

        users.Should().HaveCount(1);
    }

    private static DevGovernmentUserSeeder CreateSeeder(TerraFusionDbContext db)
    {
        var logger = Mock.Of<ILogger<DevGovernmentUserSeeder>>();
        return new DevGovernmentUserSeeder(db, logger);
    }

    private static TerraFusionDbContext CreateTestDbContext()
    {
        // CI-HYGIENE-D (#739): pivoted to EF Core InMemory provider per #741/#742 pattern.
        // The SQLite path collides on imprv_current (TruthPacs + LegacyTfUnproven schemas
        // both flatten to a single bare table). InMemory ignores schemas → no collision.
        // When #743 (TerraFusionDbContext schema model cleanup) lands, this can be revisited.
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase($"dx04-dev-gov-user-seeder-{Guid.NewGuid():N}")
            .Options;

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new TerraFusionDbContext(options, config);
    }
}
