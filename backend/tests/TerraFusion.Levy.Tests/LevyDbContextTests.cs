using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using Xunit;

namespace TerraFusion.Levy.Tests;

public class LevyDbContextTests
{
    [Fact]
    public void DbContext_CanBeCreated_WithInMemoryProvider()
    {
        var db = TestLevyDbContextFactory.Create();

        db.Should().NotBeNull();
        db.Database.ProviderName.Should().Contain("InMemory");
    }

    [Fact]
    public async Task Districts_CanBeAddedAndQueried()
    {
        var db = TestLevyDbContextFactory.Create();
        var district = new District
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            DistrictCode = "FD-001",
            Name = "Benton County Fire District 1",
            DistrictType = "Fire",
            TotalAssessedValue = 2_000_000_000m,
            ParcelCount = 12000,
            IsActive = true,
            CreatedBy = "test"
        };

        db.Districts.Add(district);
        await db.SaveChangesAsync();

        var retrieved = await db.Districts.FirstOrDefaultAsync(d => d.DistrictCode == "FD-001");
        retrieved.Should().NotBeNull();
        retrieved!.Name.Should().Be("Benton County Fire District 1");
        retrieved.TotalAssessedValue.Should().Be(2_000_000_000m);
    }

    [Fact]
    public async Task LevyMeasures_CanBeAddedWithRelationships()
    {
        var db = TestLevyDbContextFactory.Create();
        var measure = new LevyMeasure
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            Name = "General Fund 2026",
            LevyType = "General",
            LevyYear = 2026,
            Status = "Active",
            TargetAmount = 5_000_000m,
            TotalAssessedValue = 500_000_000m,
            SubjectToLimit = true,
            CreatedBy = "test"
        };

        db.LevyMeasures.Add(measure);
        await db.SaveChangesAsync();

        var retrieved = await db.LevyMeasures.FirstOrDefaultAsync(m => m.LevyYear == 2026);
        retrieved.Should().NotBeNull();
        retrieved!.TargetAmount.Should().Be(5_000_000m);
        retrieved.SubjectToLimit.Should().BeTrue();
    }

    [Fact]
    public async Task LevyScenarios_CanBeLinkedToMeasures()
    {
        var db = TestLevyDbContextFactory.Create();
        var measureId = Guid.NewGuid();
        var measure = new LevyMeasure
        {
            Id = measureId,
            CountyId = "benton",
            Name = "School Levy",
            LevyType = "General",
            LevyYear = 2026,
            Status = "Draft",
            TargetAmount = 10_000_000m,
            TotalAssessedValue = 1_000_000_000m,
            CreatedBy = "test"
        };
        db.LevyMeasures.Add(measure);

        var scenario = new LevyScenario
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            LevyMeasureId = measureId,
            Name = "Baseline 2026",
            ScenarioType = "Baseline",
            AssessedValue = 1_000_000_000m,
            LevyRate = 0.01m,
            CalculatedAmount = 10_000_000m,
            ProjectedRevenue = 9_800_000m,
            CollectionRate = 0.98m,
            IsActive = true,
            CreatedBy = "test"
        };
        db.LevyScenarios.Add(scenario);
        await db.SaveChangesAsync();

        var retrieved = await db.LevyScenarios
            .Include(s => s.LevyMeasure)
            .FirstOrDefaultAsync(s => s.Name == "Baseline 2026");
        retrieved.Should().NotBeNull();
        retrieved!.LevyMeasure.Name.Should().Be("School Levy");
    }

    [Fact]
    public async Task ReferenceSources_CanStoreIpdData()
    {
        var db = TestLevyDbContextFactory.Create();
        db.ReferenceSources.Add(new ReferenceSource
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            SourceType = ReferenceSourceType.Ipd,
            TaxYear = 2026,
            IsActive = true,
            Value = 4.24m,
            Citation = "WA OFM September 2025 Memo",
            IssuedBy = "WA OFM",
            IssuedDate = new DateTime(2025, 9, 1),
            IngestedAt = DateTime.UtcNow,
            IngestedBy = "seed"
        });
        await db.SaveChangesAsync();

        var ipd = await db.ReferenceSources
            .FirstOrDefaultAsync(r => r.SourceType == ReferenceSourceType.Ipd && r.TaxYear == 2026);
        ipd.Should().NotBeNull();
        ipd!.Value.Should().Be(4.24m);
    }

    [Fact]
    public async Task BankedCapacity_CanBeTracked()
    {
        var db = TestLevyDbContextFactory.Create();
        db.BankedCapacities.Add(new BankedCapacity
        {
            Id = Guid.NewGuid(),
            CountyId = "benton",
            DistrictCode = "SD-001",
            TaxYear = 2026,
            OpeningBalance = 300_000m,
            AccruedThisYear = 150_000m,
            UsedThisYear = 0m,
            ClosingBalance = 450_000m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test"
        });
        await db.SaveChangesAsync();

        var banked = await db.BankedCapacities
            .FirstOrDefaultAsync(b => b.DistrictCode == "SD-001" && b.TaxYear == 2026);
        banked.Should().NotBeNull();
        banked!.AccruedThisYear.Should().Be(150_000m);
        banked.ClosingBalance.Should().Be(450_000m);
    }
}
