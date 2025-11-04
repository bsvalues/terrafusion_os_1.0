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
