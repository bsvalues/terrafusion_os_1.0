using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Tests.Unit.Controllers;

/// <summary>
/// Property Controller Unit Tests - AI Swarm Generated
/// Validates property assessment functionality for Benton County, WA
/// </summary>
public class PropertyControllerTests : TerraFusionTestBase
{
    private readonly Mock<IPropertyService> _propertyServiceMock;
    private readonly Mock<IAISwarmCoordinator> _aiSwarmMock;
    private readonly PropertyController _controller;

    public PropertyControllerTests(TestSetup factory) : base(factory)
    {
        _propertyServiceMock = new Mock<IPropertyService>();
        _aiSwarmMock = new Mock<IAISwarmCoordinator>();
        _controller = new PropertyController(_propertyServiceMock.Object, _aiSwarmMock.Object);
    }

    [Fact]
    public async Task GetProperty_ValidId_ReturnsProperty()
    {
        // Arrange - Benton County property
        var propertyId = Guid.NewGuid();
        var property = new Property
        {
            Id = propertyId,
            Address = "123 Wine Country Rd",
            City = "Prosser", // County seat
            State = "WA",
            ZipCode = "99350",
            County = "Benton County",
            AssessedValue = 450000m,
            PropertyType = PropertyType.Residential
        };

        _propertyServiceMock
            .Setup(s => s.GetByIdAsync(propertyId))
            .ReturnsAsync(property);

        // Act
        var result = await _controller.GetProperty(propertyId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var returnedProperty = okResult!.Value as Property;
        
        returnedProperty.Should().NotBeNull();
        returnedProperty!.City.Should().Be("Prosser");
        returnedProperty.County.Should().Be("Benton County");
        returnedProperty.State.Should().Be("WA");
        
        ValidateBentonCountyData(new { Name = returnedProperty.County, CountySeat = returnedProperty.City, State = returnedProperty.State });
    }

    [Fact]
    public async Task CreateProperty_ValidProperty_ReturnsCreated()
    {
        // Arrange - New Benton County property
        var createDto = new CreatePropertyDto
        {
            Address = "456 Columbia River Dr",
            City = "Richland", // City in Benton County (but NOT county seat)
            State = "WA",
            ZipCode = "99352",
            County = "Benton County",
            PropertyType = PropertyType.Commercial,
            LotSizeAcres = 2.5m,
            BuildingSquareFeet = 8500
        };

        var createdProperty = new Property { Id = Guid.NewGuid(), Address = createDto.Address };
        
        _propertyServiceMock
            .Setup(s => s.CreateAsync(It.IsAny<CreatePropertyDto>()))
            .ReturnsAsync(createdProperty);

        _aiSwarmMock
            .Setup(s => s.ProcessPropertyAssessmentAsync(It.IsAny<Property>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.CreateProperty(createDto);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result as CreatedAtActionResult;
        createdResult!.Value.Should().Be(createdProperty);

        _aiSwarmMock.Verify(s => s.ProcessPropertyAssessmentAsync(It.IsAny<Property>()), Times.Once);
    }

    [Fact]
    public async Task SearchProperties_BentonCountyFilter_ReturnsFilteredResults()
    {
        // Arrange - Search within Benton County
        var searchParams = new PropertySearchDto
        {
            County = "Benton County",
            State = "WA",
            MinValue = 200000m,
            MaxValue = 800000m
        };

        var properties = new List<Property>
        {
            new() { Id = Guid.NewGuid(), Address = "789 Desert Gold Dr", City = "West Richland", County = "Benton County", State = "WA" },
            new() { Id = Guid.NewGuid(), Address = "321 Vineyard Ln", City = "Benton City", County = "Benton County", State = "WA" }
        };

        _propertyServiceMock
            .Setup(s => s.SearchAsync(It.IsAny<PropertySearchDto>()))
            .ReturnsAsync(properties);

        // Act
        var result = await _controller.SearchProperties(searchParams);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var returnedProperties = okResult!.Value as List<Property>;
        
        returnedProperties.Should().NotBeNull();
        returnedProperties.Should().HaveCount(2);
        returnedProperties!.All(p => p.County == "Benton County").Should().BeTrue();
        returnedProperties.All(p => p.State == "WA").Should().BeTrue();
    }

    [Theory]
    [InlineData("99350", "Prosser")] // County seat
    [InlineData("99352", "Richland")]
    [InlineData("99353", "West Richland")]
    [InlineData("99320", "Benton City")]
    public async Task GetPropertiesByZipCode_BentonCountyZips_ReturnsCorrectCity(string zipCode, string expectedCity)
    {
        // Arrange - Benton County zip codes and cities
        var properties = new List<Property>
        {
            new() 
            { 
                Id = Guid.NewGuid(), 
                ZipCode = zipCode, 
                City = expectedCity, 
                County = "Benton County", 
                State = "WA" 
            }
        };

        _propertyServiceMock
            .Setup(s => s.GetByZipCodeAsync(zipCode))
            .ReturnsAsync(properties);

        // Act
        var result = await _controller.GetPropertiesByZipCode(zipCode);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var returnedProperties = okResult!.Value as List<Property>;
        
        returnedProperties.Should().NotBeNull();
        returnedProperties.Should().HaveCount(1);
        returnedProperties![0].City.Should().Be(expectedCity);
        returnedProperties[0].County.Should().Be("Benton County");
        
        // Special validation for county seat
        if (zipCode == "99350")
        {
            returnedProperties[0].City.Should().Be("Prosser", "Prosser is the county seat of Benton County");
        }
    }

    [Fact]
    public async Task UpdatePropertyAssessment_AISwarmIntegration_ProcessesCorrectly()
    {
        // Arrange - AI Swarm property assessment update
        var propertyId = Guid.NewGuid();
        var assessmentUpdate = new PropertyAssessmentDto
        {
            PropertyId = propertyId,
            NewAssessedValue = 525000m,
            AssessmentDate = DateTime.UtcNow,
            AssessmentMethod = "AI-Swarm-1008-Agent-Analysis",
            ConfidenceLevel = 0.97m
        };

        _propertyServiceMock
            .Setup(s => s.UpdateAssessmentAsync(It.IsAny<PropertyAssessmentDto>()))
            .Returns(Task.CompletedTask);

        _aiSwarmMock
            .Setup(s => s.ValidateAssessmentAsync(It.IsAny<PropertyAssessmentDto>()))
            .ReturnsAsync(new AIValidationResult { IsValid = true, ConfidenceScore = 0.98m });

        // Act
        var result = await _controller.UpdatePropertyAssessment(propertyId, assessmentUpdate);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        
        _propertyServiceMock.Verify(s => s.UpdateAssessmentAsync(It.IsAny<PropertyAssessmentDto>()), Times.Once);
        _aiSwarmMock.Verify(s => s.ValidateAssessmentAsync(It.IsAny<PropertyAssessmentDto>()), Times.Once);
    }
}
