using FluentAssertions;
using System.Text.Json;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Adapters;
using TerraFusion.Core.DTOs.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.Atlas;

public sealed class AtlasSpatialReadAdapterTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid ParcelId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public void Adapt_MapsCanonicalPolygonToFrozenContract()
    {
        var result = AtlasSpatialReadAdapter.Adapt(CreateRequest(), CreateSource());

        result.SchemaVersion.Should().Be("1.0.0");
        result.CountyId.Should().Be(CountyId.ToString("D"));
        result.ParcelId.Should().Be(ParcelId.ToString("D"));
        result.EvidenceState.Should().Be(AtlasSpatialEvidenceState.canonical);
        result.Boundary.GeometryState.Should().Be(AtlasGeometryState.polygon);
        result.Boundary.Centroid.Should().BeEquivalentTo(new AtlasCoordinate
        {
            Longitude = -119.15m,
            Latitude = 46.22m,
        });
        result.Boundary.AreaSquareFeet.Should().Be(87_120m);
        result.Boundary.AreaAcres.Should().Be(2m);
        result.Boundary.Dimensions.Should().BeNull();
        result.Boundary.OuterRing.Should().Equal(
            new AtlasCoordinate { Longitude = -119.2m, Latitude = 46.2m },
            new AtlasCoordinate { Longitude = -119.1m, Latitude = 46.2m },
            new AtlasCoordinate { Longitude = -119.1m, Latitude = 46.3m },
            new AtlasCoordinate { Longitude = -119.2m, Latitude = 46.2m });
        result.Layers.Zoning.Should().BeNull();
        result.Layers.Flood.Should().BeNull();
    }

    [Fact]
    public void Adapt_ThrowsForNullRequest()
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(null!, CreateSource());

        action.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Adapt_ThrowsForNullSource()
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(CreateRequest(), null!);

        action.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Serialize_OmitsAbsentOptionalEvidenceUnderContractPolicy()
    {
        using var json = JsonDocument.Parse(
            AtlasSpatialReadAdapter.Serialize(CreateRequest(), CreateSource()));
        var root = json.RootElement;
        var boundary = root.GetProperty("boundary");
        var layers = root.GetProperty("layers");

        root.GetProperty("schemaVersion").GetString().Should().Be("1.0.0");
        boundary.TryGetProperty("dimensions", out _).Should().BeFalse();
        layers.TryGetProperty("zoning", out _).Should().BeFalse();
        layers.TryGetProperty("flood", out _).Should().BeFalse();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Adapt_RejectsIdentityMismatch(bool countyMismatch)
    {
        var request = CreateRequest() with
        {
            CountyId = countyMismatch ? Guid.NewGuid().ToString("D") : CountyId.ToString("D"),
            ParcelId = countyMismatch ? ParcelId.ToString("D") : Guid.NewGuid().ToString("D"),
        };

        var action = () => AtlasSpatialReadAdapter.Adapt(request, CreateSource());

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("{11111111-2222-3333-4444-555555555555}")]
    [InlineData("11111111222233334444555555555555")]
    [InlineData("11111111-2222-3333-4444-55555555555Z")]
    public void Adapt_RejectsNonCanonicalRequestIdentity(string countyId)
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(
            CreateRequest() with { CountyId = countyId },
            CreateSource());

        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Adapt_RejectsInactiveSource()
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(
            CreateRequest(),
            CreateSource() with { IsActive = false });

        action.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData("POINT (-119.15 46.22)")]
    [InlineData("MULTIPOLYGON (((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.2 46.2)))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.2 46.2), (-119.18 46.22, -119.17 46.22, -119.18 46.22))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.3 46.4))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.2 46.2))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.2 46.2, -119.2 46.2, -119.2 46.2))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.2 46.2,))")]
    [InlineData("POLYGON ((-181 46.2, -119.1 46.2, -119.1 46.3, -181 46.2))")]
    [InlineData("POLYGON ((-119.2 91, -119.1 46.2, -119.1 46.3, -119.2 91))")]
    [InlineData("POLYGON ((NaN 46.2, -119.1 46.2, -119.1 46.3, NaN 46.2))")]
    [InlineData("")]
    public void Adapt_RejectsInvalidOrUnsupportedGeometry(string wkt)
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(
            CreateRequest(),
            CreateSource() with { GeomWkt = wkt });

        action.Should().Throw<InvalidOperationException>();
    }

    [Theory]
    [InlineData(double.NaN, 46.22, 87_120)]
    [InlineData(double.PositiveInfinity, 46.22, 87_120)]
    [InlineData(-181, 46.22, 87_120)]
    [InlineData(-119.15, 91, 87_120)]
    [InlineData(-119.15, 46.22, double.NaN)]
    [InlineData(-119.15, 46.22, double.PositiveInfinity)]
    [InlineData(-119.15, 46.22, -1)]
    public void Adapt_RejectsInvalidNumericValues(double longitude, double latitude, double areaSquareFeet)
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(
            CreateRequest(),
            CreateSource() with
            {
                CentroidLon = longitude,
                CentroidLat = latitude,
                AreaSqFt = areaSquareFeet,
            });

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ResultContract_DoesNotExposeCrossLaneOrProviderFields()
    {
        Type[] contractTypes =
        [
            typeof(AtlasParcelSpatialReadResult),
            typeof(AtlasBoundary),
            typeof(AtlasCoordinate),
            typeof(AtlasDimensions),
            typeof(AtlasLayers),
            typeof(AtlasZoning),
            typeof(AtlasFlood),
        ];
        var propertyNames = contractTypes
            .SelectMany(type => type.GetProperties())
            .Select(property => property.Name)
            .ToArray();

        propertyNames.Should().NotContain(name =>
            name.Contains("Owner", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Valuation", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Document", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Workflow", StringComparison.OrdinalIgnoreCase)
            || name.Contains("TaxArea", StringComparison.OrdinalIgnoreCase)
            || name.Contains("LandClass", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Url", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Token", StringComparison.OrdinalIgnoreCase)
            || name.Contains("Provider", StringComparison.OrdinalIgnoreCase));
    }

    private static AtlasParcelSpatialReadRequest CreateRequest() => new()
    {
        CountyId = CountyId.ToString("D"),
        ParcelId = ParcelId.ToString("D"),
    };

    private static ParcelGeometryResponse CreateSource() => new()
    {
        TfParcelId = ParcelId,
        CountyId = CountyId,
        GeomWkt = "POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.2 46.2))",
        CentroidLat = 46.22,
        CentroidLon = -119.15,
        AreaSqFt = 87_120,
        LastSyncedAt = DateTime.UnixEpoch,
        SourceServiceUrl = "sovereign://synthetic-atlas-test",
        IsActive = true,
    };
}
