using FluentAssertions;
using TerraFusion.Core.Entities.SyncBridge;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// Slice G1-B: closed-vocabulary tests for
/// <see cref="SourceFamilies"/>. Verifies that:
///  - The ARCGIS_REST family was added (the point of G1-B).
///  - The pre-existing v1 vocabulary is preserved.
///  - <see cref="SourceFamilies.IsKnown(string)"/> rejects unknown
///    values and is null/empty-safe.
/// </summary>
public sealed class SourceFamiliesTests
{
    [Fact]
    public void ArcGisRest_IsRecognized()
    {
        SourceFamilies.ArcGisRest.Should().Be("ARCGIS_REST");
        SourceFamilies.All.Should().Contain("ARCGIS_REST");
        SourceFamilies.IsKnown("ARCGIS_REST").Should().BeTrue();
    }

    [Theory]
    [InlineData("PACS_OLTP")]
    [InlineData("PACS_BACKUP")]
    [InlineData("CAMACLOUD")]
    [InlineData("PACS_SPATIAL")]
    [InlineData("PACS_LISTS")]
    [InlineData("PACS_DBPROJECT")]
    [InlineData("PACS_SYNCSERVICE_DB")]
    [InlineData("WEB_INTERNET_BENTON")]
    [InlineData("TAAPPSVR")]
    [InlineData("PROVAL")]
    [InlineData("ASCEND")]
    [InlineData("CIAPS")]
    [InlineData("BENTON_DYNLOADER")]
    [InlineData("ARCGIS_REST")]
    [InlineData("LEGACY_UNKNOWN")]
    public void All_KnownVocabulary_IsAccepted(string family)
    {
        SourceFamilies.IsKnown(family).Should().BeTrue(
            $"'{family}' is in the documented v1 closed vocabulary");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("pacs_oltp")]               // case sensitive
    [InlineData("ARCGIS")]                  // missing suffix
    [InlineData("ARCGIS_REST_FUTURE")]      // not in vocabulary
    [InlineData("MADE_UP_FAMILY")]
    public void Unknown_OrCaseMismatch_IsRejected(string? family)
    {
        SourceFamilies.IsKnown(family!).Should().BeFalse(
            $"'{family ?? "<null>"}' is outside the closed vocabulary");
    }

    [Fact]
    public void All_Set_IsImmutableEnumeration()
    {
        // The set is an IReadOnlySet — consumers can iterate but not
        // mutate. Defending the doctrine's "code change required"
        // promise.
        SourceFamilies.All.Should().BeAssignableTo<IReadOnlySet<string>>();
        SourceFamilies.All.Count.Should().BeGreaterThanOrEqualTo(15);
    }
}
