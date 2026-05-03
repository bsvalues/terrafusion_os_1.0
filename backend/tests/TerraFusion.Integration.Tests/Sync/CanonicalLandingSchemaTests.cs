using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Wiring tests for the Slice A.5 canonical landing schema:
/// Owner, OwnershipEvent, LandSegment, ImprovementDetail.
///
/// Verifies entity → EF configuration → DbContext registration is wired correctly,
/// and that CountyId scoping is preserved. Runs against EF.InMemory; migration
/// safety is proven separately by scaffold inspection + local `database update`.
/// </summary>
public class CanonicalLandingSchemaTests
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

    private static async System.Threading.Tasks.Task<(County county, Property property)> SeedCountyAndPropertyAsync(TerraFusionDbContext context)
    {
        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);

        var property = new Property
        {
            Id = Guid.NewGuid(),
            CountyId = county.Id,
            ParcelId = "PACS-12345",
            Address = "123 Main St"
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        return (county, property);
    }

    [Fact]
    public async System.Threading.Tasks.Task Owner_PersistsRawAndNormalizedNames_WithCountyScope()
    {
        await using var context = CreateContext($"owner-{Guid.NewGuid()}");
        var (county, _) = await SeedCountyAndPropertyAsync(context);

        var owner = new Owner
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            SourceOwnerId = "PACS-OWN-100",
            RawName = "  Smith, John  ",
            NormalizedName = "SMITH JOHN",
            RawMailingAddress = "PO Box 7",
            NormalizedMailingAddress = "PO BOX 7"
        };
        context.Owners.Add(owner);
        await context.SaveChangesAsync();

        var loaded = await context.Owners.SingleAsync(x => x.CountyId == county.Id);
        loaded.RawName.Should().Be("  Smith, John  ");
        loaded.NormalizedName.Should().Be("SMITH JOHN");
        loaded.SourceOwnerId.Should().Be("PACS-OWN-100");
    }

    [Fact]
    public async System.Threading.Tasks.Task OwnershipEvent_BitemporalRange_PersistsCleanly()
    {
        await using var context = CreateContext($"ownership-{Guid.NewGuid()}");
        var (county, property) = await SeedCountyAndPropertyAsync(context);

        var owner = new Owner
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            SourceOwnerId = "PACS-OWN-200",
            RawName = "Doe, Jane",
            NormalizedName = "DOE JANE"
        };
        context.Owners.Add(owner);
        await context.SaveChangesAsync();

        var pastEvent = new OwnershipEvent
        {
            CountyId = county.Id,
            OwnerId = owner.Id,
            PropertyId = property.Id,
            EffectiveFrom = new DateTimeOffset(2018, 1, 1, 0, 0, 0, TimeSpan.Zero),
            EffectiveThrough = new DateTimeOffset(2022, 6, 15, 0, 0, 0, TimeSpan.Zero),
            SourceSystem = "PACS",
            SourceOwnerId = "PACS-OWN-200",
            SourceChangeOfOwnerId = "COO-9001"
        };
        var currentEvent = new OwnershipEvent
        {
            CountyId = county.Id,
            OwnerId = owner.Id,
            PropertyId = property.Id,
            EffectiveFrom = new DateTimeOffset(2022, 6, 16, 0, 0, 0, TimeSpan.Zero),
            EffectiveThrough = null,
            SourceSystem = "PACS",
            SourceOwnerId = "PACS-OWN-200",
            SourceChangeOfOwnerId = "COO-9002"
        };
        context.OwnershipEvents.AddRange(pastEvent, currentEvent);
        await context.SaveChangesAsync();

        var currentOwners = await context.OwnershipEvents
            .Where(x => x.CountyId == county.Id
                && x.PropertyId == property.Id
                && x.EffectiveThrough == null)
            .ToListAsync();

        currentOwners.Should().HaveCount(1);
        currentOwners[0].SourceChangeOfOwnerId.Should().Be("COO-9002");

        var allEvents = await context.OwnershipEvents
            .Where(x => x.CountyId == county.Id && x.PropertyId == property.Id)
            .OrderBy(x => x.EffectiveFrom)
            .ToListAsync();

        allEvents.Should().HaveCount(2);
        allEvents[0].EffectiveThrough.Should().NotBeNull();
        allEvents[1].EffectiveThrough.Should().BeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task LandSegment_PersistsAcreageAndValueWithYearLayer()
    {
        await using var context = CreateContext($"land-{Guid.NewGuid()}");
        var (county, property) = await SeedCountyAndPropertyAsync(context);

        var segment = new LandSegment
        {
            CountyId = county.Id,
            PropertyId = property.Id,
            SourceSystem = "PACS",
            SourceLandSegmentId = "LD-PACS-1",
            AssessmentYear = 2025,
            SupplementNumber = 0,
            LandTypeCode = "AG",
            Acreage = 12.5m,
            SizeSquareFeet = 544500m,
            MarketValue = 125000m,
            AssessedValue = 25000m,
            PayloadHash = "sha256:land-1"
        };
        context.LandSegments.Add(segment);
        await context.SaveChangesAsync();

        var loaded = await context.LandSegments.SingleAsync(x => x.CountyId == county.Id);
        loaded.LandTypeCode.Should().Be("AG");
        loaded.Acreage.Should().Be(12.5m);
        loaded.AssessmentYear.Should().Be(2025);
    }

    [Fact]
    public async System.Threading.Tasks.Task ImprovementDetail_PreservesBentonMethodInputSet()
    {
        await using var context = CreateContext($"imprv-detail-{Guid.NewGuid()}");
        var (county, property) = await SeedCountyAndPropertyAsync(context);

        var detail = new ImprovementDetail
        {
            CountyId = county.Id,
            PropertyId = property.Id,
            SourceSystem = "PACS",
            SourceImprvId = 9001,
            SourceImprvDetId = 9101,
            AssessmentYear = 2025,
            SupplementNumber = 0,
            TypeCode = "ATTGAR",
            ClassCode = "C",
            MethodCode = "M",
            AreaSqFt = 480m,
            Value = 18500m,
            ValueSource = "A",
            ConditionCode = "G",
            YearBuilt = 1998,
            PhysicalPercent = 0.85m,
            FunctionalPercent = 1.0m,
            EconomicPercent = 1.0m,
            PercentComplete = 1.0m,
            DepreciationPercent = 0.15m,
            IsNewValue = false,
            PayloadHash = "sha256:imprv-detail-1"
        };
        context.ImprovementDetails.Add(detail);
        await context.SaveChangesAsync();

        var loaded = await context.ImprovementDetails.SingleAsync(x => x.CountyId == county.Id);

        // Benton Method preservation contract: every input column round-trips.
        loaded.TypeCode.Should().Be("ATTGAR");
        loaded.ClassCode.Should().Be("C");
        loaded.MethodCode.Should().Be("M");
        loaded.AreaSqFt.Should().Be(480m);
        loaded.Value.Should().Be(18500m);
        loaded.ValueSource.Should().Be("A");
        loaded.ConditionCode.Should().Be("G");
        loaded.YearBuilt.Should().Be(1998);
        loaded.PhysicalPercent.Should().Be(0.85m);
        loaded.FunctionalPercent.Should().Be(1.0m);
        loaded.EconomicPercent.Should().Be(1.0m);
        loaded.PercentComplete.Should().Be(1.0m);
        loaded.DepreciationPercent.Should().Be(0.15m);
        loaded.IsNewValue.Should().BeFalse();
    }

    [Fact]
    public async System.Threading.Tasks.Task CanonicalLanding_AllFour_AreCountyScoped()
    {
        await using var context = CreateContext($"county-iso-{Guid.NewGuid()}");

        var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        var wallaWalla = new County { Id = Guid.NewGuid(), Name = "Walla Walla", State = "WA", FipsCode = "53071" };
        context.Counties.AddRange(benton, wallaWalla);

        var bentonProperty = new Property { Id = Guid.NewGuid(), CountyId = benton.Id, ParcelId = "B-1", Address = "1 Benton Way" };
        var wwProperty = new Property { Id = Guid.NewGuid(), CountyId = wallaWalla.Id, ParcelId = "W-1", Address = "1 Walla Way" };
        context.Properties.AddRange(bentonProperty, wwProperty);
        await context.SaveChangesAsync();

        var bentonOwner = new Owner { CountyId = benton.Id, SourceSystem = "PACS", SourceOwnerId = "B-100", RawName = "B Owner", NormalizedName = "B OWNER" };
        var wwOwner = new Owner { CountyId = wallaWalla.Id, SourceSystem = "PACS", SourceOwnerId = "W-100", RawName = "W Owner", NormalizedName = "W OWNER" };
        context.Owners.AddRange(bentonOwner, wwOwner);
        await context.SaveChangesAsync();

        context.OwnershipEvents.AddRange(
            new OwnershipEvent { CountyId = benton.Id, OwnerId = bentonOwner.Id, PropertyId = bentonProperty.Id, EffectiveFrom = DateTimeOffset.UtcNow, SourceSystem = "PACS" },
            new OwnershipEvent { CountyId = wallaWalla.Id, OwnerId = wwOwner.Id, PropertyId = wwProperty.Id, EffectiveFrom = DateTimeOffset.UtcNow, SourceSystem = "PACS" }
        );
        context.LandSegments.AddRange(
            new LandSegment { CountyId = benton.Id, PropertyId = bentonProperty.Id, SourceSystem = "PACS", SourceLandSegmentId = "B-L-1", AssessmentYear = 2025, SupplementNumber = 0, LandTypeCode = "R" },
            new LandSegment { CountyId = wallaWalla.Id, PropertyId = wwProperty.Id, SourceSystem = "PACS", SourceLandSegmentId = "W-L-1", AssessmentYear = 2025, SupplementNumber = 0, LandTypeCode = "R" }
        );
        context.ImprovementDetails.AddRange(
            new ImprovementDetail { CountyId = benton.Id, PropertyId = bentonProperty.Id, SourceSystem = "PACS", SourceImprvId = 1, SourceImprvDetId = 1, AssessmentYear = 2025, SupplementNumber = 0, TypeCode = "MA" },
            new ImprovementDetail { CountyId = wallaWalla.Id, PropertyId = wwProperty.Id, SourceSystem = "PACS", SourceImprvId = 2, SourceImprvDetId = 2, AssessmentYear = 2025, SupplementNumber = 0, TypeCode = "MA" }
        );
        await context.SaveChangesAsync();

        (await context.Owners.CountAsync(x => x.CountyId == benton.Id)).Should().Be(1);
        (await context.OwnershipEvents.CountAsync(x => x.CountyId == benton.Id)).Should().Be(1);
        (await context.LandSegments.CountAsync(x => x.CountyId == benton.Id)).Should().Be(1);
        (await context.ImprovementDetails.CountAsync(x => x.CountyId == benton.Id)).Should().Be(1);

        var bentonOwners = await context.Owners.Where(x => x.CountyId == benton.Id).ToListAsync();
        bentonOwners.Should().NotContain(x => x.SourceOwnerId == "W-100");
    }
}
