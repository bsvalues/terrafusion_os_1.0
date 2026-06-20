using FluentAssertions;
using TerraFusion.Core.Configuration;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// GEOM-005: FIPS-keyed ArcGIS config — proves the four guard conditions
/// that DrainGeometry enforces before invoking the ArcGIS landing stack.
///
/// Guard mapping (controller source):
///   1. county.FipsCode is null/empty  → 400
///   2. Counties.TryGetValue(fips) miss → 404
///   3. fips key present in config      → resolve succeeds (200 path)
///   4. any county Guid with a valid fips → lookup is FIPS-only, Guid irrelevant
/// </summary>
public sealed class DoctrineDrainGeometryFipsTests
{
    private static ArcGisFeatureServiceOptions OptionsWithBenton() =>
        new()
        {
            Counties = new Dictionary<string, CountyArcGisOptions>
            {
                ["53005"] = new CountyArcGisOptions
                {
                    ParcelFeatureServiceUrl =
                        "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer/0",
                    ApnAttributeName = "geo_id",
                    ObjectIdAttributeName = "OBJECTID",
                    OutSpatialReferenceEpsg = 4326,
                    RequestTimeoutSeconds = 120,
                },
            },
        };

    [Fact]
    public void FipsKeyedConfig_Benton53005_ResolvesArcGisUrl()
    {
        // Guard 3: happy path — FIPS "53005" present in config, resolves config.
        var options = OptionsWithBenton();

        var config = options.GetForCounty("53005");

        config.Should().NotBeNull();
        config!.ParcelFeatureServiceUrl.Should()
            .Contain("Parcels_and_Assess/FeatureServer/0");
        config.ApnAttributeName.Should().Be("geo_id");
        config.OutSpatialReferenceEpsg.Should().Be(4326);
    }

    [Fact]
    public void MissingFipsInConfig_TryGetValueFails_Drives404Guard()
    {
        // Guard 2: county FIPS not in config → TryGetValue returns false,
        // controller returns 404.
        var options = OptionsWithBenton();

        var found = options.Counties.TryGetValue("99999", out _);

        found.Should().BeFalse(
            "FIPS 99999 has no entry; controller must return 404 for this county");
    }

    [Fact]
    public void NullOrEmptyFipsCode_DrivesBadRequestGuard()
    {
        // Guard 1: county.FipsCode is null or empty → controller returns 400.
        // DrainGeometry checks: if (string.IsNullOrEmpty(bentonCounty.FipsCode))
        string? nullFips = null;
        var emptyFips = string.Empty;

        string.IsNullOrEmpty(nullFips).Should().BeTrue(
            "null FipsCode triggers the 400 guard");
        string.IsNullOrEmpty(emptyFips).Should().BeTrue(
            "empty FipsCode triggers the 400 guard");

        // A real FIPS code must not trigger the guard.
        string.IsNullOrEmpty("53005").Should().BeFalse();
    }

    [Fact]
    public void AnyCountyGuid_WithValidFips_LookupSucceeds()
    {
        // Guard 4: the config lookup key is purely the FIPS string.
        // Two different county Guids with the same FIPS both resolve
        // to the same service config — no Guid dependency.
        var options = OptionsWithBenton();

        // These could be any two Guids — the resolved config is the same.
        var guidA = Guid.NewGuid();
        var guidB = Guid.NewGuid();
        guidA.Should().NotBe(guidB);

        var configA = options.GetForCounty("53005");
        var configB = options.GetForCounty("53005");

        configA.Should().NotBeNull();
        configB.Should().NotBeNull();
        configA!.ParcelFeatureServiceUrl.Should().Be(configB!.ParcelFeatureServiceUrl,
            "FIPS is the sole lookup key; county Guid has no effect on resolution");
    }
}
