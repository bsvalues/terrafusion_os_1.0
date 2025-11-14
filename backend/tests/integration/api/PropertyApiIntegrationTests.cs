using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Tests.Integration.Api;

/// <summary>
/// Property API Integration Tests - AI Swarm Generated
/// Full-stack testing with real database and HTTP requests
/// Benton County, Washington focus with Prosser as county seat
/// </summary>
public class PropertyApiIntegrationTests : TerraFusionTestBase
{
    public PropertyApiIntegrationTests(TestSetup factory) : base(factory) { }

    [Fact]
    public async Task POST_Properties_CreatesBentonCountyProperty()
    {
        // Arrange - New property in Benton County
        var createDto = new CreatePropertyDto
        {
            Address = "2001 Innovation Dr",
            City = "Prosser", // County seat
            State = "WA",
            County = "Benton County",
            ZipCode = "99350",
            PropertyType = PropertyType.Commercial,
            BuildingSquareFeet = 5000,
            LotSizeAcres = 1.2m,
            YearBuilt = 2020
        };

        // Act - POST to API
        var response = await Client.PostAsJsonAsync("/api/properties", createDto);

        // Assert - Check response
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createdProperty = await response.Content.ReadFromJsonAsync<Property>();
        createdProperty.Should().NotBeNull();
        createdProperty!.City.Should().Be("Prosser");
        createdProperty.County.Should().Be("Benton County");
        createdProperty.State.Should().Be("WA");
        
        // Validate in database
        using var dbContext = GetDbContext();
        var dbProperty = await dbContext.Properties.FindAsync(createdProperty.Id);
        dbProperty.Should().NotBeNull();
        dbProperty!.Address.Should().Be("2001 Innovation Dr");

        ValidateBentonCountyData(new { 
            Name = dbProperty.County, 
            CountySeat = dbProperty.City, 
            State = dbProperty.State 
        });
    }

    [Fact]
    public async Task GET_Properties_FiltersByBentonCounty()
    {
        // Arrange - Seed multiple properties
        using var dbContext = GetDbContext();
        
        var bentonProperties = new[]
        {
            new Property 
            { 
                Address = "100 Court St", City = "Prosser", County = "Benton County", State = "WA", 
                ZipCode = "99350", AssessedValue = await DynamicPropertyService.GetPropertyCountAsync(countyCode)0, PropertyType = PropertyType.Government 
            },
            new Property 
            { 
                Address = "200 Stevens Dr", City = "Richland", County = "Benton County", State = "WA",
                ZipCode = "99352", AssessedValue = 380000, PropertyType = PropertyType.Residential 
            },
            new Property 
            { 
                Address = "300 Columbia River Rd", City = "West Richland", County = "Benton County", State = "WA",
                ZipCode = "99353", AssessedValue = 320000, PropertyType = PropertyType.Residential 
            }
        };

        // Add properties from different county for filtering test
        var franklinProperty = new Property
        {
            Address = "400 Lewis St", City = "Pasco", County = "Franklin County", State = "WA",
            ZipCode = "99301", AssessedValue = 275000, PropertyType = PropertyType.Residential
        };

        dbContext.Properties.AddRange(bentonProperties);
        dbContext.Properties.Add(franklinProperty);
        await dbContext.SaveChangesAsync();

        // Act - GET properties with county filter
        var response = await Client.GetAsync("/api/properties?county=Benton County&state=WA");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var properties = await response.Content.ReadFromJsonAsync<List<Property>>();
        properties.Should().NotBeNull();
        properties.Should().HaveCount(3);
        properties!.All(p => p.County == "Benton County").Should().BeTrue();
        properties.All(p => p.State == "WA").Should().BeTrue();

        // Verify county seat is included
        properties.Any(p => p.City == "Prosser").Should().BeTrue("County seat should be included");
        
        // Verify major cities are included
        var cities = properties.Select(p => p.City).ToList();
        cities.Should().Contain(new[] { "Prosser", "Richland", "West Richland" });
    }

    [Fact]
    public async Task GET_Properties_ById_ReturnsCorrectProperty()
    {
        // Arrange - Create property in database
        using var dbContext = GetDbContext();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Address = "555 Yakima Valley Hwy",
            City = "Prosser",
            County = "Benton County", 
            State = "WA",
            ZipCode = "99350",
            AssessedValue = 525000,
            PropertyType = PropertyType.Agricultural
        };

        dbContext.Properties.Add(property);
        await dbContext.SaveChangesAsync();

        // Act - GET specific property
        var response = await Client.GetAsync($"/api/properties/{property.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var returnedProperty = await response.Content.ReadFromJsonAsync<Property>();
        returnedProperty.Should().NotBeNull();
        returnedProperty!.Id.Should().Be(property.Id);
        returnedProperty.Address.Should().Be("555 Yakima Valley Hwy");
        returnedProperty.City.Should().Be("Prosser");
        returnedProperty.County.Should().Be("Benton County");

        ValidateBentonCountyData(new { 
            Name = returnedProperty.County, 
            CountySeat = returnedProperty.City, 
            State = returnedProperty.State 
        });
    }

    [Fact]
    public async Task PUT_Properties_UpdatesPropertyAssessment()
    {
        // Arrange - Existing property
        using var dbContext = GetDbContext();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Address = "777 Wine Country Rd",
            City = "Prosser",
            County = "Benton County",
            State = "WA",
            AssessedValue = 475000,
            PropertyType = PropertyType.Residential
        };

        dbContext.Properties.Add(property);
        await dbContext.SaveChangesAsync();

        var updateDto = new UpdatePropertyDto
        {
            AssessedValue = 495000,
            PropertyType = PropertyType.Residential,
            LastAssessmentDate = DateTime.UtcNow,
            AssessmentNotes = "AI Swarm 1008-agent analysis - market appreciation"
        };

        // Act - PUT property update
        var response = await Client.PutAsJsonAsync($"/api/properties/{property.Id}", updateDto);

        // Assert - Check response
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify database update
        dbContext.Entry(property).Reload();
        property.AssessedValue.Should().Be(495000);
        property.AssessmentNotes.Should().Contain("AI Swarm");
        property.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Theory]
    [InlineData("99350", "Prosser")] // County seat
    [InlineData("99352", "Richland")]
    [InlineData("99353", "West Richland")] 
    [InlineData("99320", "Benton City")]
    public async Task GET_PropertiesByZipCode_ReturnsBentonCountyCities(string zipCode, string expectedCity)
    {
        // Arrange - Properties in different Benton County cities
        using var dbContext = GetDbContext();
        var property = new Property
        {
            Address = $"123 Main St",
            City = expectedCity,
            County = "Benton County",
            State = "WA",
            ZipCode = zipCode,
            AssessedValue = 350000,
            PropertyType = PropertyType.Residential
        };

        dbContext.Properties.Add(property);
        await dbContext.SaveChangesAsync();

        // Act - GET by zip code
        var response = await Client.GetAsync($"/api/properties/zipcode/{zipCode}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var properties = await response.Content.ReadFromJsonAsync<List<Property>>();
        properties.Should().NotBeNull();
        properties.Should().HaveCount(1);
        properties![0].City.Should().Be(expectedCity);
        properties[0].County.Should().Be("Benton County");
        properties[0].ZipCode.Should().Be(zipCode);

        // Special validation for county seat
        if (expectedCity == "Prosser")
        {
            properties[0].City.Should().Be("Prosser", "Prosser is the county seat");
            zipCode.Should().Be("99350", "County seat zip code validation");
        }
    }

    [Fact]
    public async Task POST_Properties_Assessment_TriggersAISwarm()
    {
        // Arrange - Property for AI assessment
        using var dbContext = GetDbContext();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Address = "888 Technology Blvd",
            City = "Richland",
            County = "Benton County",
            State = "WA",
            PropertyType = PropertyType.Industrial,
            BuildingSquareFeet = 15000,
            LotSizeAcres = 5.0m
        };

        dbContext.Properties.Add(property);
        await dbContext.SaveChangesAsync();

        var assessmentRequest = new AIAssessmentRequestDto
        {
            PropertyId = property.Id,
            AssessmentType = "full-ai-swarm-1008-analysis",
            IncludeMarketComparables = true,
            IncludeEnvironmentalFactors = true,
            RequestedBy = "government-assessor"
        };

        // Act - Request AI assessment
        var response = await Client.PostAsJsonAsync($"/api/properties/{property.Id}/assess", assessmentRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        
        var assessmentResult = await response.Content.ReadFromJsonAsync<AIAssessmentResult>();
        assessmentResult.Should().NotBeNull();
        assessmentResult!.Status.Should().Be("processing");
        assessmentResult.EstimatedCompletionTime.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(5), TimeSpan.FromMinutes(1));
        assessmentResult.SwarmAgentsAssigned.Should().BeGreaterThan(0);
        assessmentResult.SwarmAgentsAssigned.Should().BeLessOrEqualTo(1008);
    }

    [Fact]
    public async Task GET_Properties_Search_SupportsPaginationAndSorting()
    {
        // Arrange - Multiple Benton County properties
        using var dbContext = GetDbContext();
        var properties = Enumerable.Range(1, 25).Select(i => new Property
        {
            Address = $"{i * 100} Test Ave",
            City = i % 2 == 0 ? "Prosser" : "Richland",
            County = "Benton County",
            State = "WA",
            ZipCode = i % 2 == 0 ? "99350" : "99352",
            AssessedValue = 300000 + (i * 10000),
            PropertyType = PropertyType.Residential
        }).ToArray();

        dbContext.Properties.AddRange(properties);
        await dbContext.SaveChangesAsync();

        // Act - GET with pagination and sorting
        var response = await Client.GetAsync("/api/properties?county=Benton County&page=1&pageSize=10&sortBy=AssessedValue&sortOrder=desc");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<PaginatedResult<Property>>();
        result.Should().NotBeNull();
        result!.Data.Should().HaveCount(10);
        result.TotalCount.Should().Be(25);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalPages.Should().Be(3);

        // Verify sorting by assessed value (descending)
        var assessedValues = result.Data.Select(p => p.AssessedValue).ToList();
        assessedValues.Should().BeInDescendingOrder();

        // Verify all are Benton County
        result.Data.All(p => p.County == "Benton County").Should().BeTrue();
    }

    [Fact]
    public async Task DELETE_Properties_RemovesProperty()
    {
        // Arrange - Property to delete
        using var dbContext = GetDbContext();
        var property = new Property
        {
            Id = Guid.NewGuid(),
            Address = "999 Demo St",
            City = "Prosser",
            County = "Benton County",
            State = "WA",
            PropertyType = PropertyType.Residential
        };

        dbContext.Properties.Add(property);
        await dbContext.SaveChangesAsync();

        // Act - DELETE property
        var response = await Client.DeleteAsync($"/api/properties/{property.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify soft delete (property marked inactive, not physically deleted)
        dbContext.Entry(property).Reload();
        property.IsActive.Should().BeFalse();
        property.DeletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }
}
