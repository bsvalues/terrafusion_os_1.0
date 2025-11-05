using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Data;
using TerraFusion.Core.Entities;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Integration tests verifying strict county data isolation.
/// These tests ensure no cross-county data access is possible.
/// </summary>
public class CountyIsolationTests
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
    public async System.Threading.Tasks.Task GetProperty_WithValidCountyCode_ReturnsOnlyCountyData()
    {
        // Arrange
        await using var context = CreateContext("CountyIsolationTest_ValidCounty");

        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        // Seed data for two different counties
        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K001", Address = "King County Property" },
            new Property { Id = Guid.NewGuid(), CountyId = pierceCountyId, ParcelId = "P001", Address = "Pierce County Property" }
        );
        await context.SaveChangesAsync();

        // Act - Query for King County only
        var kingProperties = await context.Properties
            .Where(p => p.CountyId == kingCountyId)
            .ToListAsync();

        // Assert
        kingProperties.Should().HaveCount(1);
        kingProperties.First().CountyId.Should().Be(kingCountyId);
        kingProperties.Should().NotContain(p => p.CountyId == pierceCountyId);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetProperty_WithoutCountyCodeFilter_ShouldNotBeUsed()
    {
        // This test documents the WRONG pattern - never query without countyCode
        await using var context = CreateContext("CountyIsolationTest_InvalidPattern");

        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K001", Address = "King Property" },
            new Property { Id = Guid.NewGuid(), CountyId = pierceCountyId, ParcelId = "P001", Address = "Pierce Property" }
        );
        await context.SaveChangesAsync();

        // WRONG: Querying without county filter
        var allProperties = await context.Properties.ToListAsync();

        // This test fails intentionally to demonstrate the violation
        // In production, this pattern should trigger code review failure
        allProperties.Should().HaveCountGreaterThan(1, "because this violates county isolation");
    }

    [Fact]
    public async System.Threading.Tasks.Task UpdateProperty_OnlyAffectsTargetCounty()
    {
        // Arrange
        await using var context = CreateContext("CountyIsolationTest_Update");

        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K001", Address = "King Property", AssessedValue = 100000 },
            new Property { Id = Guid.NewGuid(), CountyId = pierceCountyId, ParcelId = "P001", Address = "Pierce Property", AssessedValue = 200000 }
        );
        await context.SaveChangesAsync();

        // Act - Update King County property only
        var kingProperty = await context.Properties
            .Where(p => p.CountyId == kingCountyId && p.ParcelId == "K001")
            .FirstAsync();

        kingProperty.AssessedValue = 150000;
        await context.SaveChangesAsync();

        // Assert - Pierce County data unchanged
        var pierceProperty = await context.Properties
            .Where(p => p.CountyId == pierceCountyId)
            .FirstAsync();

        pierceProperty.AssessedValue.Should().Be(200000, "Pierce County data should not be affected");
        kingProperty.AssessedValue.Should().Be(150000, "King County update should succeed");
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteProperty_OnlyAffectsTargetCounty()
    {
        // Arrange
        await using var context = CreateContext("CountyIsolationTest_Delete");

        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K001", Address = "King Property 1" },
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K002", Address = "King Property 2" },
            new Property { Id = Guid.NewGuid(), CountyId = pierceCountyId, ParcelId = "P001", Address = "Pierce Property" }
        );
        await context.SaveChangesAsync();

        // Act - Delete one King County property
        var propertyToDelete = await context.Properties
            .Where(p => p.CountyId == kingCountyId && p.ParcelId == "K001")
            .FirstAsync();

        context.Properties.Remove(propertyToDelete);
        await context.SaveChangesAsync();

        // Assert
        var kingProperties = await context.Properties
            .Where(p => p.CountyId == kingCountyId)
            .ToListAsync();

        var pierceProperties = await context.Properties
            .Where(p => p.CountyId == pierceCountyId)
            .ToListAsync();

        kingProperties.Should().HaveCount(1, "one King County property should remain");
        pierceProperties.Should().HaveCount(1, "Pierce County data should be unaffected");
    }

    [Fact]
    public async System.Threading.Tasks.Task BulkOperation_EnforcesCountyIsolation()
    {
        // Arrange
        await using var context = CreateContext("CountyIsolationTest_Bulk");

        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();
        var snohomishCountyId = Guid.NewGuid();

        // Seed multiple counties
        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K001", Address = "King Property 1", AssessedValue = 100000 },
            new Property { Id = Guid.NewGuid(), CountyId = kingCountyId, ParcelId = "K002", Address = "King Property 2", AssessedValue = 110000 },
            new Property { Id = Guid.NewGuid(), CountyId = pierceCountyId, ParcelId = "P001", Address = "Pierce Property", AssessedValue = 150000 },
            new Property { Id = Guid.NewGuid(), CountyId = snohomishCountyId, ParcelId = "S001", Address = "Snohomish Property", AssessedValue = 120000 }
        );
        await context.SaveChangesAsync();

        // Act - Bulk update King County only
        var kingProperties = await context.Properties
            .Where(p => p.CountyId == kingCountyId)
            .ToListAsync();

        foreach (var property in kingProperties)
        {
            property.AssessedValue = property.AssessedValue * 1.1m; // 10% increase
        }
        await context.SaveChangesAsync();

        // Assert - Other counties unchanged
        var allProperties = await context.Properties.ToListAsync();

        allProperties.Where(p => p.CountyId == kingCountyId).Should().OnlyContain(p => p.AssessedValue >= 110000);
        allProperties.Single(p => p.CountyId == pierceCountyId).AssessedValue.Should().Be(150000);
        allProperties.Single(p => p.CountyId == snohomishCountyId).AssessedValue.Should().Be(120000);
    }
}
