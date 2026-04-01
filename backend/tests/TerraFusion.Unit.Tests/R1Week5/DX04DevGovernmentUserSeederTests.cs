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
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var db = new TerraFusionDbContext(options, config);
        db.Database.OpenConnection();
        return db;
    }
}
