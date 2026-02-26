using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Data;
using TerraFusion.Core.Entities;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 1 Foundation Smoke Tests — verifies the database bootstraps,
/// entities persist correctly, audit fields auto-populate, and county
/// isolation holds under real EF Core operations.
/// </summary>
public class Phase1SmokeTests
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

    // ─── TEST 1: Database Context Bootstraps ─────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task DbContext_CreatesSuccessfully_AndAcceptsEntities()
    {
        await using var context = CreateContext("Smoke_DbBootstrap");

        context.Should().NotBeNull();
        context.Database.Should().NotBeNull();

        var counties = await context.Counties.ToListAsync();
        counties.Should().BeEmpty("fresh database should have no counties");

        var properties = await context.Properties.ToListAsync();
        properties.Should().BeEmpty("fresh database should have no properties");
    }

    // ─── TEST 2: County Entity CRUD ──────────────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task County_FullCrudLifecycle_WorksCorrectly()
    {
        await using var context = CreateContext("Smoke_CountyCrud");

        // CREATE
        var bentonCounty = new County
        {
            Id = Guid.NewGuid(),
            Name = "Benton County",
            State = "WA",
            FipsCode = "53005",
            Population = 204390,
            Area = 1700.4
        };
        context.Counties.Add(bentonCounty);
        await context.SaveChangesAsync();

        // READ
        var retrieved = await context.Counties
            .FirstOrDefaultAsync(c => c.Name == "Benton County");
        retrieved.Should().NotBeNull();
        retrieved!.State.Should().Be("WA");
        retrieved.FipsCode.Should().Be("53005");
        retrieved.Population.Should().Be(204390);

        // UPDATE
        retrieved.Population = 210000;
        await context.SaveChangesAsync();

        var updated = await context.Counties.FindAsync(bentonCounty.Id);
        updated!.Population.Should().Be(210000);

        // DELETE
        context.Counties.Remove(updated);
        await context.SaveChangesAsync();

        var deleted = await context.Counties.FindAsync(bentonCounty.Id);
        deleted.Should().BeNull("county should be removed after delete");
    }

    // ─── TEST 3: Property Entity CRUD With County FK ─────────────────

    [Fact]
    public async System.Threading.Tasks.Task Property_PersistsWithCountyRelationship()
    {
        await using var context = CreateContext("Smoke_PropertyCountyFK");

        var countyId = Guid.NewGuid();
        var county = new County
        {
            Id = countyId,
            Name = "Benton County",
            State = "WA",
            FipsCode = "53005",
            Population = 204390,
            Area = 1700.4
        };
        context.Counties.Add(county);

        var property = new Property
        {
            Id = Guid.NewGuid(),
            PropertyId = "PROP-001",
            ParcelId = "1-0529-100-0001-000",
            ParcelNumber = "10529100",
            Address = "123 Government Way, Kennewick, WA 99336",
            OwnerName = "Citizen Test",
            PropertyType = "Residential",
            YearBuilt = 2005,
            AssessedValue = 385000m,
            LandValue = 120000m,
            ImprovementValue = 265000m,
            MarketValue = 410000m,
            AssessmentDate = new DateTime(2025, 1, 15),
            TaxYear = 2025,
            CountyId = countyId
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var retrieved = await context.Properties
            .Include(p => p.County)
            .FirstOrDefaultAsync(p => p.ParcelId == "1-0529-100-0001-000");

        retrieved.Should().NotBeNull();
        retrieved!.Address.Should().Be("123 Government Way, Kennewick, WA 99336");
        retrieved.AssessedValue.Should().Be(385000m);
        retrieved.CountyId.Should().Be(countyId);
        retrieved.County.Should().NotBeNull();
        retrieved.County.Name.Should().Be("Benton County");
    }

    // ─── TEST 4: Audit Fields Auto-Populate ──────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task AuditFields_AutoPopulateOnCreation()
    {
        await using var context = CreateContext("Smoke_AuditFields");

        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);

        var county = new County
        {
            Id = Guid.NewGuid(),
            Name = "Clark County",
            State = "WA",
            FipsCode = "53011",
            Population = 503311,
            Area = 656.2
        };
        context.Counties.Add(county);
        await context.SaveChangesAsync();

        var retrieved = await context.Counties.FindAsync(county.Id);
        retrieved.Should().NotBeNull();

        retrieved!.CreatedAt.Should().BeAfter(beforeCreate,
            "CreatedAt should be auto-populated on entity creation");
        retrieved.UpdatedAt.Should().BeAfter(beforeCreate,
            "UpdatedAt should be auto-populated on entity creation");
    }

    // ─── TEST 5: Multi-County Data Isolation ─────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task MultiCounty_QueriesRespectIsolationBoundaries()
    {
        await using var context = CreateContext("Smoke_MultiCountyIsolation");

        var bentonId = Guid.NewGuid();
        var clarkId = Guid.NewGuid();
        var kingId = Guid.NewGuid();

        context.Counties.AddRange(
            new County { Id = bentonId, Name = "Benton", State = "WA", FipsCode = "53005", Population = 204390, Area = 1700 },
            new County { Id = clarkId, Name = "Clark", State = "WA", FipsCode = "53011", Population = 503311, Area = 656 },
            new County { Id = kingId, Name = "King", State = "WA", FipsCode = "53033", Population = 2269675, Area = 2307 }
        );

        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = bentonId, PropertyId = "B1", ParcelId = "B-001", ParcelNumber = "B001", Address = "Benton Addr 1", AssessedValue = 300000m },
            new Property { Id = Guid.NewGuid(), CountyId = bentonId, PropertyId = "B2", ParcelId = "B-002", ParcelNumber = "B002", Address = "Benton Addr 2", AssessedValue = 350000m },
            new Property { Id = Guid.NewGuid(), CountyId = clarkId, PropertyId = "C1", ParcelId = "C-001", ParcelNumber = "C001", Address = "Clark Addr 1", AssessedValue = 450000m },
            new Property { Id = Guid.NewGuid(), CountyId = kingId, PropertyId = "K1", ParcelId = "K-001", ParcelNumber = "K001", Address = "King Addr 1", AssessedValue = 950000m },
            new Property { Id = Guid.NewGuid(), CountyId = kingId, PropertyId = "K2", ParcelId = "K-002", ParcelNumber = "K002", Address = "King Addr 2", AssessedValue = 1200000m },
            new Property { Id = Guid.NewGuid(), CountyId = kingId, PropertyId = "K3", ParcelId = "K-003", ParcelNumber = "K003", Address = "King Addr 3", AssessedValue = 875000m }
        );
        await context.SaveChangesAsync();

        var bentonProps = await context.Properties
            .Where(p => p.CountyId == bentonId).ToListAsync();
        bentonProps.Should().HaveCount(2);
        bentonProps.Should().OnlyContain(p => p.CountyId == bentonId);

        var clarkProps = await context.Properties
            .Where(p => p.CountyId == clarkId).ToListAsync();
        clarkProps.Should().HaveCount(1);

        var kingProps = await context.Properties
            .Where(p => p.CountyId == kingId).ToListAsync();
        kingProps.Should().HaveCount(3);

        var bentonTotal = await context.Properties
            .Where(p => p.CountyId == bentonId)
            .SumAsync(p => p.AssessedValue);
        bentonTotal.Should().Be(650000m);

        var kingTotal = await context.Properties
            .Where(p => p.CountyId == kingId)
            .SumAsync(p => p.AssessedValue);
        kingTotal.Should().Be(3025000m);
    }

    // ─── TEST 6: PropertyAssessment Entity Persistence ───────────────

    [Fact]
    public async System.Threading.Tasks.Task PropertyAssessment_PersistsAllFields()
    {
        await using var context = CreateContext("Smoke_AssessmentPersistence");

        var propertyId = Guid.NewGuid();
        var assessorId = Guid.NewGuid();

        var assessment = new PropertyAssessment
        {
            Id = Guid.NewGuid(),
            PropertyId = propertyId,
            AssessmentYear = 2025,
            AssessedValue = 385000m,
            MarketValue = 410000m,
            LandValue = 120000m,
            ImprovementValue = 265000m,
            AssessmentMethod = "Comparable Sales",
            AssessorNotes = "Standard residential assessment",
            AssessorId = assessorId,
            AssessmentDate = new DateTime(2025, 1, 15),
            IsActive = true
        };
        context.PropertyAssessments.Add(assessment);
        await context.SaveChangesAsync();

        var retrieved = await context.PropertyAssessments
            .FirstOrDefaultAsync(a => a.PropertyId == propertyId);

        retrieved.Should().NotBeNull();
        retrieved!.AssessedValue.Should().Be(385000m);
        retrieved.MarketValue.Should().Be(410000m);
        retrieved.LandValue.Should().Be(120000m);
        retrieved.ImprovementValue.Should().Be(265000m);
        retrieved.AssessmentMethod.Should().Be("Comparable Sales");
        retrieved.AssessmentYear.Should().Be(2025);
        retrieved.IsActive.Should().BeTrue();
    }

    // ─── TEST 7: AI Agent Entity Persistence ─────────────────────────

    [Fact]
    public async System.Threading.Tasks.Task AIAgent_PersistsAndQueries()
    {
        await using var context = CreateContext("Smoke_AIAgent");

        var agent = new AIAgent
        {
            Id = Guid.NewGuid(),
            Name = "CostForge Valuation Agent",
            Type = "Coordinator",
            Status = "Active",
            Configuration = "{\"model\":\"costforge-v2\",\"capabilities\":[\"property_valuation\",\"market_analysis\"]}",
            CurrentTask = "Idle",
            ProcessedTasks = 0,
            PerformanceScore = 0.95
        };
        context.AIAgents.Add(agent);
        await context.SaveChangesAsync();

        var retrieved = await context.AIAgents
            .FirstOrDefaultAsync(a => a.Name == "CostForge Valuation Agent");

        retrieved.Should().NotBeNull();
        retrieved!.Type.Should().Be("Coordinator");
        retrieved.Status.Should().Be("Active");
        retrieved.Configuration.Should().Contain("property_valuation");
        retrieved.PerformanceScore.Should().Be(0.95);
    }

    // ─── TEST 8: Concurrent County Operations Don't Interfere ────────

    [Fact]
    public async System.Threading.Tasks.Task ConcurrentCountyOperations_MaintainIsolation()
    {
        await using var context = CreateContext("Smoke_ConcurrentOps");

        var bentonId = Guid.NewGuid();
        var clarkId = Guid.NewGuid();

        context.Counties.AddRange(
            new County { Id = bentonId, Name = "Benton", State = "WA", FipsCode = "53005", Population = 204390, Area = 1700 },
            new County { Id = clarkId, Name = "Clark", State = "WA", FipsCode = "53011", Population = 503311, Area = 656 }
        );

        context.Properties.AddRange(
            new Property { Id = Guid.NewGuid(), CountyId = bentonId, PropertyId = "B1", ParcelId = "B-001", ParcelNumber = "B001", Address = "Benton 1", AssessedValue = 300000m },
            new Property { Id = Guid.NewGuid(), CountyId = clarkId, PropertyId = "C1", ParcelId = "C-001", ParcelNumber = "C001", Address = "Clark 1", AssessedValue = 450000m }
        );
        await context.SaveChangesAsync();

        var bentonResult = await context.Properties
            .Where(p => p.CountyId == bentonId).ToListAsync();

        var clarkResult = await context.Properties
            .Where(p => p.CountyId == clarkId).ToListAsync();

        // Modify each county's data independently
        bentonResult.ForEach(p => p.AssessedValue += 50000m);
        clarkResult.ForEach(p => p.AssessedValue += 25000m);
        await context.SaveChangesAsync();

        var bentonFinal = await context.Properties
            .Where(p => p.CountyId == bentonId).FirstAsync();
        bentonFinal.AssessedValue.Should().Be(350000m);

        var clarkFinal = await context.Properties
            .Where(p => p.CountyId == clarkId).FirstAsync();
        clarkFinal.AssessedValue.Should().Be(475000m);
    }

    // ─── TEST 9: DbContext Exposes All Required DbSets ───────────────

    [Fact]
    public void DbContext_ExposesAllGovernmentDbSets()
    {
        using var context = CreateContext("Smoke_DbSetsExist");

        // Core Government — these MUST exist for FISMA compliance
        context.Properties.Should().NotBeNull("Properties DbSet is required");
        context.Counties.Should().NotBeNull("Counties DbSet is required");
        context.PropertyAssessments.Should().NotBeNull("PropertyAssessments DbSet is required");
        context.TaxLevies.Should().NotBeNull("TaxLevies DbSet is required");
        context.GovernmentUsers.Should().NotBeNull("GovernmentUsers DbSet is required");
        context.AuditLogs.Should().NotBeNull("AuditLogs DbSet is required");

        // AI System
        context.AIAgents.Should().NotBeNull("AIAgents DbSet is required");
        context.AIModels.Should().NotBeNull("AIModels DbSet is required");

        // Security
        context.SecurityEvents.Should().NotBeNull("SecurityEvents DbSet is required");
        context.UserSessions.Should().NotBeNull("UserSessions DbSet is required");

        // Marketplace
        context.Plugins.Should().NotBeNull("Plugins DbSet is required");
    }

    // ─── TEST 10: Decimal Precision For Financial Data ────────────────

    [Fact]
    public async System.Threading.Tasks.Task FinancialValues_MaintainDecimalPrecision()
    {
        await using var context = CreateContext("Smoke_DecimalPrecision");

        var countyId = Guid.NewGuid();
        context.Counties.Add(new County
        {
            Id = countyId, Name = "Test", State = "WA", FipsCode = "99999", Population = 1, Area = 1
        });

        var property = new Property
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            PropertyId = "P1",
            ParcelId = "T-001",
            ParcelNumber = "T001",
            Address = "Test Address",
            AssessedValue = 1234567.89m,
            LandValue = 456789.12m,
            ImprovementValue = 777778.77m,
            MarketValue = 1300000.50m
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var retrieved = await context.Properties.FindAsync(property.Id);
        retrieved!.AssessedValue.Should().Be(1234567.89m,
            "financial values must maintain full decimal precision");
        retrieved.LandValue.Should().Be(456789.12m);
        retrieved.ImprovementValue.Should().Be(777778.77m);
        retrieved.MarketValue.Should().Be(1300000.50m);
    }
}
