using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

public sealed class AtlasLiveGeometryControllerTests : IDisposable
{
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId = Guid.Parse("20200020-2020-2020-2020-202020202020");

    private readonly TerraFusionDbContext _db;

    public AtlasLiveGeometryControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"atlas-live-geometry-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetParcelGeometry_ReadsActiveTfParcelGeomRows_AsGeoJson()
    {
        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            CountyId = BentonCountyId,
            ArcGisObjectId = 42,
            ArcGisApn = "123456789",
            GeomWkt = "POLYGON((-119.3 46.2, -119.2 46.2, -119.2 46.3, -119.3 46.3, -119.3 46.2))",
            CentroidLat = 46.25,
            CentroidLon = -119.25,
            AreaSqFt = 43560,
            SourceServiceUrl = "https://benton.example/FeatureServer/0",
            LastSyncedAt = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true,
        });
        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            CountyId = BentonCountyId,
            ArcGisObjectId = 43,
            ArcGisApn = "INACTIVE",
            GeomWkt = "POLYGON((-119.4 46.2, -119.3 46.2, -119.3 46.3, -119.4 46.3, -119.4 46.2))",
            SourceServiceUrl = "https://benton.example/FeatureServer/0",
            IsActive = false,
        });
        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            CountyId = OtherCountyId,
            ArcGisObjectId = 44,
            ArcGisApn = "OTHER",
            GeomWkt = "POLYGON((-120.4 46.2, -120.3 46.2, -120.3 46.3, -120.4 46.3, -120.4 46.2))",
            SourceServiceUrl = "https://other.example/FeatureServer/0",
            IsActive = true,
        });
        await _db.SaveChangesAsync();

        var controller = new AtlasLiveGeometryController(
            _db,
            NullLogger<AtlasLiveGeometryController>.Instance);

        var result = await controller.GetParcelGeometry(
            countyId: BentonCountyId,
            taxYear: 2026,
            studyId: "study-1",
            segmentId: "seg-1",
            neighborhoodCode: "13011",
            limit: 50,
            ct: CancellationToken.None);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var json = JsonSerializer.Serialize(ok.Value, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        json.Should().Contain("\"type\":\"FeatureCollection\"");
        json.Should().Contain("123456789");
        json.Should().Contain("syncDerivedGeometry");
        json.Should().Contain("gis_tf.tf_parcel_geom");
        json.Should().Contain("-119.3");
        json.Should().NotContain("INACTIVE");
        json.Should().NotContain("OTHER");
    }
}
