using System.Reflection;
using FluentAssertions;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Contracts;

/// <summary>
/// Prevents silent DTO drift on ComparablePropertyInfo.
/// If this test fails, a consumer (CompAnalysisService, IAAOValidationRules)
/// likely needs updating too.
/// </summary>
public class ComparablePropertyInfoContractTests
{
    private static readonly Type ComparableType = typeof(ComparablePropertyInfo);

    [Fact]
    public void ComparablePropertyInfo_Has_Required_Properties()
    {
        var propertyNames = ComparableType
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => p.Name)
            .ToHashSet();

        // Properties that CompAnalysisService.SelectComparablesAsync depends on
        propertyNames.Should().Contain("ParcelId", "CompAnalysisService reads ParcelId");
        propertyNames.Should().Contain("SalePrice", "CompAnalysisService reads SalePrice");
        propertyNames.Should().Contain("SaleDate", "CompAnalysisService reads SaleDate");
        propertyNames.Should().Contain("SqFtLiving", "Similarity scoring reads SqFtLiving");
        propertyNames.Should().Contain("LotSizeAcres", "Similarity scoring reads LotSizeAcres");
        propertyNames.Should().Contain("Bedrooms", "Similarity scoring reads Bedrooms");
        propertyNames.Should().Contain("Bathrooms", "Similarity scoring reads Bathrooms");
        propertyNames.Should().Contain("GarageSpaces", "Similarity scoring reads GarageSpaces");
        propertyNames.Should().Contain("YearBuilt", "Similarity scoring reads YearBuilt");
        propertyNames.Should().Contain("QualityClass", "Similarity scoring reads QualityClass");
        propertyNames.Should().Contain("Condition", "Similarity scoring reads Condition");
        propertyNames.Should().Contain("DistanceMiles", "Similarity scoring reads DistanceMiles");
        propertyNames.Should().Contain("Neighborhood", "GenerateCandidateComps sets Neighborhood");
    }

    [Fact]
    public void ComparablePropertyInfo_Property_Types_Match_Consumer_Expectations()
    {
        // Type contracts that CompAnalysisService arithmetic depends on
        AssertPropertyType("ParcelId", typeof(string));
        AssertPropertyType("SalePrice", typeof(decimal));
        AssertPropertyType("SaleDate", typeof(DateTime));
        AssertPropertyType("SqFtLiving", typeof(int));
        AssertPropertyType("LotSizeAcres", typeof(decimal));
        AssertPropertyType("Bedrooms", typeof(int));
        AssertPropertyType("Bathrooms", typeof(int));
        AssertPropertyType("GarageSpaces", typeof(int));
        AssertPropertyType("YearBuilt", typeof(int));
        AssertPropertyType("QualityClass", typeof(string));
        AssertPropertyType("Condition", typeof(string));
        AssertPropertyType("DistanceMiles", typeof(decimal));
        AssertPropertyType("Neighborhood", typeof(string));
    }

    [Fact]
    public void ComparableResult_Embeds_ComparablePropertyInfo()
    {
        var resultType = typeof(ComparableResult);
        var propInfo = resultType.GetProperty("PropertyInfo");

        propInfo.Should().NotBeNull("ComparableResult must have a PropertyInfo property");
        propInfo!.PropertyType.Should().Be(ComparableType,
            "ComparableResult.PropertyInfo must be of type ComparablePropertyInfo");
    }

    private static void AssertPropertyType(string propertyName, Type expectedType)
    {
        var prop = ComparableType.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull($"ComparablePropertyInfo must have property '{propertyName}'");
        prop!.PropertyType.Should().Be(expectedType,
            $"ComparablePropertyInfo.{propertyName} must be {expectedType.Name}");
    }
}
