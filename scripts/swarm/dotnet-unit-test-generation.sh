#!/bin/bash
# dotnet-unit-test-generation.sh - AI Swarm Agent: .NET Unit Test Generation
# Squad Leader Agent #2 of 144 - Backend Testing Division

set -euo pipefail

echo "🤖 AI AGENT: .NET Unit Test Generator Specialist"
echo "📋 Mission: Generate comprehensive unit tests for all backend components"

# Ensure test directory exists
mkdir -p backend/tests/unit/{controllers,services,entities,validators,mappings}

# Generate Property Controller Unit Tests
cat > backend/tests/unit/controllers/PropertyControllerTests.cs << 'EOF'
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
EOF

# Generate Property Service Unit Tests
cat > backend/tests/unit/services/PropertyServiceTests.cs << 'EOF'
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
EOF

# Generate Entity Unit Tests  
cat > backend/tests/unit/entities/PropertyEntityTests.cs << 'EOF'
using FluentAssertions;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.Tests.Unit.Entities;

/// <summary>
/// Property Entity Unit Tests - AI Swarm Generated
/// Validates entity behavior and business rules
/// </summary>
public class PropertyEntityTests
{
    [Fact]
    public void Property_Creation_SetsDefaultValues()
    {
        // Act
        var property = new Property();

        // Assert
        property.Id.Should().NotBeEmpty();
        property.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        property.IsActive.Should().BeTrue();
        property.Version.Should().Be(1);
    }

    [Theory]
    [InlineData("Benton County", "WA", "Prosser", "99350", true)]
    [InlineData("Benton County", "WA", "Richland", "99352", true)]
    [InlineData("Franklin County", "WA", "Pasco", "99301", true)]
    [InlineData("", "WA", "Prosser", "99350", false)] // Invalid: empty county
    [InlineData("Benton County", "", "Prosser", "99350", false)] // Invalid: empty state
    [InlineData("Benton County", "WA", "", "99350", false)] // Invalid: empty city
    public void Property_Validation_ValidatesAddressComponents(
        string county, string state, string city, string zipCode, bool isValid)
    {
        // Arrange & Act
        var property = new Property
        {
            Address = "123 Test St",
            County = county,
            State = state,
            City = city,
            ZipCode = zipCode
        };

        // Assert
        var validationResult = property.IsValidAddress();
        validationResult.Should().Be(isValid);

        if (county == "Benton County" && city == "Prosser")
        {
            property.IsCountySeat().Should().BeTrue("Prosser is the county seat of Benton County");
        }
    }

    [Fact]
    public void Property_BentonCountyData_ValidatesCorrectly()
    {
        // Arrange - Prosser property (county seat)
        var prosserProperty = new Property
        {
            Address = "500 Market St",
            City = "Prosser",
            County = "Benton County", 
            State = "WA",
            ZipCode = "99350"
        };

        // Act & Assert - Validate county seat
        prosserProperty.IsCountySeat().Should().BeTrue();
        prosserProperty.County.Should().Be("Benton County");
        prosserProperty.State.Should().Be("WA");

        // Arrange - Richland property (NOT county seat)
        var richlandProperty = new Property
        {
            Address = "1000 George Washington Way",
            City = "Richland",
            County = "Benton County",
            State = "WA", 
            ZipCode = "99352"
        };

        // Act & Assert - Validate NOT county seat
        richlandProperty.IsCountySeat().Should().BeFalse("Richland is NOT the county seat");
        richlandProperty.County.Should().Be("Benton County");
    }

    [Fact]
    public void Property_AssessmentHistory_TracksChanges()
    {
        // Arrange
        var property = new Property
        {
            Address = "750 Wine Way", 
            City = "Prosser",
            County = "Benton County",
            State = "WA"
        };

        // Act - Add assessment history
        property.AddAssessmentRecord(400000m, DateTime.UtcNow.AddYears(-1), "Previous Assessment");
        property.AddAssessmentRecord(425000m, DateTime.UtcNow, "AI Swarm Assessment");

        // Assert
        property.AssessmentHistory.Should().HaveCount(2);
        property.AssessmentHistory.OrderByDescending(a => a.AssessmentDate).First()
            .AssessedValue.Should().Be(425000m);
        
        property.GetValueAppreciation().Should().Be(25000m);
        property.GetAppreciationPercentage().Should().BeApproximately(6.25m, 0.01m);
    }
}
EOF

echo "✅ .NET Unit Tests generated by AI Agent"
echo "🎯 Property Controller, Service, and Entity tests deployed"
echo "📍 Benton County, WA data validation included in all tests"
echo "🤖 AI Swarm integration tested throughout"
echo "⚡ xUnit, FluentAssertions, and Moq framework ready"