using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;
using TerraFusion.Core.GIS.ArcGisRest;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

/// <summary>
/// Slice G1-C: end-to-end tests for
/// <see cref="ArcGisFeatureServiceClient"/>. The HttpClient is wired
/// to a <see cref="StubHttpMessageHandler"/> so we exercise the JSON
/// parsing, geometry projection, and exception surface without
/// touching the network.
/// </summary>
public sealed class ArcGisFeatureServiceClientTests
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private static ArcGisFeatureServiceOptions OptionsForBenton(
        string url = "https://services.arcgis.com/abc/arcgis/rest/services/Parcels/FeatureServer/0",
        string apnAttr = "APN",
        string objectIdAttr = "OBJECTID")
    {
        return new ArcGisFeatureServiceOptions
        {
            Counties = new Dictionary<string, CountyArcGisOptions>
            {
                [BentonId.ToString()] = new CountyArcGisOptions
                {
                    ParcelFeatureServiceUrl = url,
                    ApnAttributeName = apnAttr,
                    ObjectIdAttributeName = objectIdAttr,
                },
            },
        };
    }

    private static ArcGisFeatureServiceClient BuildClient(
        ArcGisFeatureServiceOptions options,
        StubHttpMessageHandler handler)
    {
        var factory = new StubHttpClientFactory(handler);
        return new ArcGisFeatureServiceClient(
            factory,
            Options.Create(options),
            NullLogger<ArcGisFeatureServiceClient>.Instance);
    }

    [Fact]
    public async Task FetchParcelsAsync_HappyPath_ProjectsFeatures()
    {
        const string body = """
        {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {
                "OBJECTID": 42,
                "APN": "109884040000015",
                "Shape__Area": 50000.5
              },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[-119.3, 46.2], [-119.2, 46.2], [-119.2, 46.3], [-119.3, 46.3], [-119.3, 46.2]]]
              }
            }
          ]
        }
        """;
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, body);
        var client = BuildClient(OptionsForBenton(), handler);

        var result = await client.FetchParcelsAsync(BentonId);

        result.Should().HaveCount(1);
        var f = result[0];
        f.CountyId.Should().Be(BentonId);
        f.ArcGisObjectId.Should().Be(42);
        f.ArcGisApn.Should().Be("109884040000015");
        f.AreaSqFt.Should().BeApproximately(50000.5, 1e-6);
        f.GeomWkt.Should().StartWith("POLYGON((");
        f.GeomWkt.Should().Contain("-119.3");
        f.CentroidLat.Should().BeApproximately(46.24, 0.05); // mean of 5 verts ≈ 46.24
        f.CentroidLon.Should().BeApproximately(-119.25, 0.02);
        f.SourceServiceUrl.Should().Contain("FeatureServer/0");

        handler.LastRequestUri!.Query.Should().Contain("f=geojson");
        handler.LastRequestUri.Query.Should().Contain("returnGeometry=true");
        handler.LastRequestUri.Query.Should().Contain("outSR=4326");
    }

    [Fact]
    public async Task FetchParcelsAsync_EmptyFeatureList_ReturnsEmpty()
    {
        const string body = """
        { "type": "FeatureCollection", "features": [] }
        """;
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, body);
        var client = BuildClient(OptionsForBenton(), handler);

        var result = await client.FetchParcelsAsync(BentonId);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task FetchParcelsAsync_UnsupportedGeometry_IsSkipped()
    {
        // MultiPolygon is dropped silently in v1; only Polygon is
        // promoted into ArcGisParcelFeature.
        const string body = """
        {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": { "OBJECTID": 1, "APN": "POINT-1" },
              "geometry": { "type": "MultiPolygon", "coordinates": [] }
            },
            {
              "type": "Feature",
              "properties": { "OBJECTID": 2, "APN": "POLY-2" },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
              }
            }
          ]
        }
        """;
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, body);
        var client = BuildClient(OptionsForBenton(), handler);

        var result = await client.FetchParcelsAsync(BentonId);

        result.Should().HaveCount(1);
        result[0].ArcGisObjectId.Should().Be(2);
    }

    [Fact]
    public async Task FetchParcelsAsync_CustomAttributeNames_AreRespected()
    {
        // Some county feature services name attributes differently
        // (e.g. ParcelNum instead of APN). The adapter must honor the
        // per-county overrides bound in CountyArcGisOptions.
        const string body = """
        {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": { "FEATUREID": 7, "ParcelNum": "Z-7" },
              "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]
              }
            }
          ]
        }
        """;
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, body);
        var options = OptionsForBenton(
            apnAttr: "ParcelNum",
            objectIdAttr: "FEATUREID");
        var client = BuildClient(options, handler);

        var result = await client.FetchParcelsAsync(BentonId);

        result.Should().HaveCount(1);
        result[0].ArcGisObjectId.Should().Be(7);
        result[0].ArcGisApn.Should().Be("Z-7");
    }

    [Fact]
    public async Task FetchParcelsAsync_UnknownCounty_ThrowsConfigurationException()
    {
        var options = new ArcGisFeatureServiceOptions(); // empty
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, "{}");
        var client = BuildClient(options, handler);

        var act = async () =>
            await client.FetchParcelsAsync(Guid.NewGuid());

        await act.Should()
            .ThrowAsync<ArcGisFeatureServiceConfigurationException>()
            .WithMessage("*No ArcGIS feature-service configuration*");
    }

    [Fact]
    public async Task FetchParcelsAsync_EmptyUrl_ThrowsConfigurationException()
    {
        var options = OptionsForBenton(url: "");
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, "{}");
        var client = BuildClient(options, handler);

        var act = async () => await client.FetchParcelsAsync(BentonId);

        await act.Should()
            .ThrowAsync<ArcGisFeatureServiceConfigurationException>()
            .WithMessage("*empty ParcelFeatureServiceUrl*");
    }

    [Fact]
    public async Task FetchParcelsAsync_Non200_ThrowsTransportException()
    {
        var handler = new StubHttpMessageHandler(HttpStatusCode.InternalServerError, "boom");
        var client = BuildClient(OptionsForBenton(), handler);

        var act = async () => await client.FetchParcelsAsync(BentonId);

        await act.Should().ThrowAsync<ArcGisFeatureServiceTransportException>();
    }

    [Fact]
    public async Task FetchParcelsAsync_MalformedJson_ThrowsTransportException()
    {
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, "{ this is not json");
        var client = BuildClient(OptionsForBenton(), handler);

        var act = async () => await client.FetchParcelsAsync(BentonId);

        await act.Should().ThrowAsync<ArcGisFeatureServiceTransportException>();
    }

    [Fact]
    public async Task FetchParcelsAsync_TrailingSlashInUrl_StillBuildsValidQuery()
    {
        const string body = """
        { "type": "FeatureCollection", "features": [] }
        """;
        var handler = new StubHttpMessageHandler(HttpStatusCode.OK, body);
        var options = OptionsForBenton(
            url: "https://services.arcgis.com/abc/arcgis/rest/services/Parcels/FeatureServer/0/");
        var client = BuildClient(options, handler);

        await client.FetchParcelsAsync(BentonId);

        handler.LastRequestUri!.AbsolutePath.Should().EndWith("/query");
        handler.LastRequestUri.AbsolutePath.Should().NotContain("//query");
    }
}
