using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// WORKBENCH-OWNER-BINDING contract tests.
/// Properties.OwnerName was never populated by conversion (NULL on all 128,788
/// rows); the proven owner lane lives in canonical_tf.tf_owner via
/// tf_parcel_owner_link. The parcel endpoint must derive the owner from the
/// canonical spine at read time (derive-not-mutate) so the Property Workbench
/// OWNER field shows real Benton owners.
/// File-based source scan, same pattern as TerraForgeControllerTests.
/// </summary>
public class PropertiesControllerOwnerEnrichmentTests
{
    private static readonly string ParcelEndpointBlock;

    static PropertiesControllerOwnerEnrichmentTests()
    {
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var repoRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllerPath = Path.Combine(repoRoot, "src", "TerraFusion.API", "Controllers", "PropertiesController.cs");
        var source = File.ReadAllText(controllerPath);

        var start = source.IndexOf("[HttpGet(\"parcel/{parcelNumber}\")]", StringComparison.Ordinal);
        start.Should().BeGreaterThan(-1, "parcel endpoint must exist");
        var end = source.IndexOf("[HttpGet(", start + 1, StringComparison.Ordinal);
        ParcelEndpointBlock = end > start ? source[start..end] : source[start..];
    }

    [Fact]
    public void ParcelEndpoint_EnrichesOwnerFromCanonicalSpine()
    {
        ParcelEndpointBlock.Should().Contain("if (string.IsNullOrEmpty(property.OwnerName))");
        ParcelEndpointBlock.Should().Contain("_db.TfParcels");
        ParcelEndpointBlock.Should().Contain("_db.TfParcelOwnerLinks");
        ParcelEndpointBlock.Should().Contain("_db.TfOwners");
        ParcelEndpointBlock.Should().Contain("parcel.ParcelNumber == parcelNumber");
    }

    [Fact]
    public void ParcelEndpoint_PicksLatestTaxYearPrimaryOwnerFirst()
    {
        ParcelEndpointBlock.Should().Contain(
            "orderby link.OwnerTaxYr descending, link.IsPrimary descending, link.PctOwnership descending");
        ParcelEndpointBlock.Should().Contain("select owner.DisplayName");
    }

    [Fact]
    public void ParcelEndpoint_DerivesOwnerWithoutMutatingTheRuntimeTable()
    {
        // Derive-not-mutate doctrine: the read path never backfills Properties.
        ParcelEndpointBlock.Should().NotContain("SaveChanges");
        ParcelEndpointBlock.Should().Contain("AsNoTracking()");
    }
}
