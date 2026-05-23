using FluentAssertions;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Tests for the ComparableSale entity model.
/// Verifies the data contract between PACS sync and TerraForge consumption.
/// </summary>
public class ComparableSaleModelTests
{
    // ─── 3-Layer Qualification Model ──────────────────────────────────────────

    [Fact]
    public void ComparableSale_HasLayer1_RawPacsCodes()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("RawSaleQualifier");
        propNames.Should().Contain("RawCountyRatioCd");
        propNames.Should().Contain("RawRatioTypeCd");
        propNames.Should().Contain("RawExcludeCalcCd");
        propNames.Should().Contain("RawWacCd");
    }

    [Fact]
    public void ComparableSale_HasLayer2_TFRecommendation()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("QualificationRecommendation");
        propNames.Should().Contain("RecommendationReason");
        propNames.Should().Contain("RecommendationSource");
        propNames.Should().Contain("RecommendationVersion");
    }

    [Fact]
    public void ComparableSale_HasLayer3_AssessorDecision()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("QualificationDecision");
        propNames.Should().Contain("DecisionReason");
        propNames.Should().Contain("DecisionBy");
        propNames.Should().Contain("DecisionAt");
        propNames.Should().Contain("DecisionSource");
    }

    // ─── Core Sale Data ───────────────────────────────────────────────────────

    [Fact]
    public void ComparableSale_HasCoreIdentifiers()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("Id");
        propNames.Should().Contain("ParcelId");
        propNames.Should().Contain("CountyId");
        propNames.Should().Contain("SaleDate");
        propNames.Should().Contain("SalePrice");
    }

    [Fact]
    public void ComparableSale_HasPhysicalCharacteristics()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("GrossLivingArea");
        propNames.Should().Contain("SlLivingArea");
        propNames.Should().Contain("SlYearBuilt");
        propNames.Should().Contain("SlLandAcres");
    }

    [Fact]
    public void ComparableSale_HasRatioStudyFields()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("AdjustedSalePrice");
        propNames.Should().Contain("SaleAdjustmentAmount");
        propNames.Should().Contain("PacsComputedRatio");
        propNames.Should().Contain("SuppressOnRatioRptCd");
        propNames.Should().Contain("IncludeNoCalc");
    }

    [Fact]
    public void ComparableSale_HasNeighborhoodAndPropertyType()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("Neighborhood");
        propNames.Should().Contain("PropertyType");
    }

    // ─── Type Safety ──────────────────────────────────────────────────────────

    [Fact]
    public void ComparableSale_SalePrice_IsDecimal()
    {
        var prop = typeof(ComparableSale).GetProperty("SalePrice");
        prop.Should().NotBeNull();
        prop!.PropertyType.Should().Be(typeof(decimal));
    }

    [Fact]
    public void ComparableSale_AdjustedSalePrice_IsNullableDecimal()
    {
        var prop = typeof(ComparableSale).GetProperty("AdjustedSalePrice");
        prop.Should().NotBeNull();
        prop!.PropertyType.Should().Be(typeof(decimal?));
    }

    [Fact]
    public void ComparableSale_CountyId_IsGuid()
    {
        var prop = typeof(ComparableSale).GetProperty("CountyId");
        prop.Should().NotBeNull();
        prop!.PropertyType.Should().Be(typeof(Guid));
    }

    [Fact]
    public void ComparableSale_Id_IsGuid()
    {
        var prop = typeof(ComparableSale).GetProperty("Id");
        prop.Should().NotBeNull();
        prop!.PropertyType.Should().Be(typeof(Guid));
    }

    // ─── WA State Specific Fields ─────────────────────────────────────────────

    [Fact]
    public void ComparableSale_HasWAStateFields()
    {
        var propNames = typeof(ComparableSale).GetProperties().Select(p => p.Name).ToList();

        propNames.Should().Contain("ContinueCurrentUse");
        propNames.Should().Contain("LandOnlySale");
        propNames.Should().Contain("SalesYear");
    }
}
