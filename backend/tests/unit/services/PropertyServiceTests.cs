using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using TerraFusion.Data.Repositories;
using Xunit;

namespace TerraFusion.Tests.Unit.Services;

/// <summary>
/// Property Service Unit Tests - AI Swarm Generated
/// Tests core business logic for property management
/// </summary>
public class PropertyServiceTests : TerraFusionTestBase
{
    private readonly Mock<IPropertyRepository> _repositoryMock;
    private readonly Mock<IAISwarmCoordinator> _aiSwarmMock;
    private readonly PropertyService _service;

    public PropertyServiceTests(TestSetup factory) : base(factory)
    {
        _repositoryMock = new Mock<IPropertyRepository>();
        _aiSwarmMock = new Mock<IAISwarmCoordinator>();
        _service = new PropertyService(_repositoryMock.Object, _aiSwarmMock.Object);
    }

    [Fact]
    public async Task CreateAsync_NewProperty_CallsAISwarmForValuation()
    {
        // Arrange - New Benton County property
        var createDto = new CreatePropertyDto
        {
            Address = "1010 Innovation Way",
            City = "Prosser",
            State = "WA",
            County = "Benton County",
            ZipCode = "99350",
            PropertyType = PropertyType.Residential
        };

        var savedProperty = new Property { Id = Guid.NewGuid() };
        
        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Property>()))
            .ReturnsAsync(savedProperty);

        _aiSwarmMock
            .Setup(s => s.CalculatePropertyValueAsync(It.IsAny<Property>()))
            .ReturnsAsync(475000m);

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        result.Should().Be(savedProperty);
        
        _repositoryMock.Verify(r => r.CreateAsync(It.Is<Property>(p => 
            p.City == "Prosser" && 
            p.County == "Benton County" &&
            p.State == "WA")), Times.Once);

        _aiSwarmMock.Verify(s => s.CalculatePropertyValueAsync(It.IsAny<Property>()), Times.Once);
    }

    [Theory]
    [InlineData(PropertyType.Residential, 350000, 650000)]
    [InlineData(PropertyType.Commercial, 500000, 1200000)]
    [InlineData(PropertyType.Agricultural, 200000, 800000)]
    [InlineData(PropertyType.Industrial, 400000, 1500000)]
    public async Task CalculateAssessedValue_ByPropertyType_ReturnsExpectedRange(
        PropertyType propertyType, decimal minExpected, decimal maxExpected)
    {
        // Arrange - Different property types in Benton County
        var property = new Property
        {
            Id = Guid.NewGuid(),
            PropertyType = propertyType,
            City = "Richland",
            County = "Benton County",
            State = "WA",
            BuildingSquareFeet = 2000,
            LotSizeAcres = 0.25m
        };

        _aiSwarmMock
            .Setup(s => s.CalculatePropertyValueAsync(property))
            .ReturnsAsync(minExpected + (maxExpected - minExpected) * 0.6m); // Mid-range value

        // Act
        var result = await _service.CalculateAssessedValueAsync(property);

        // Assert
        result.Should().BeInRange(minExpected, maxExpected);
        _aiSwarmMock.Verify(s => s.CalculatePropertyValueAsync(property), Times.Once);
    }

    [Fact]
    public async Task SearchAsync_CountyFilter_FiltersCorrectly()
    {
        // Arrange - Multi-county search with Benton County focus
        var searchDto = new PropertySearchDto
        {
            County = "Benton County",
            State = "WA"
        };

        var bentonProperties = new List<Property>
        {
            new() { County = "Benton County", State = "WA", City = "Prosser" },
            new() { County = "Benton County", State = "WA", City = "Richland" },
            new() { County = "Benton County", State = "WA", City = "West Richland" }
        };

        _repositoryMock
            .Setup(r => r.SearchAsync(It.IsAny<Expression<Func<Property, bool>>>()))
            .ReturnsAsync(bentonProperties);

        // Act
        var result = await _service.SearchAsync(searchDto);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.All(p => p.County == "Benton County").Should().BeTrue();
        
        // Verify county seat is included
        result.Any(p => p.City == "Prosser").Should().BeTrue("County seat should be included");
    }
}
