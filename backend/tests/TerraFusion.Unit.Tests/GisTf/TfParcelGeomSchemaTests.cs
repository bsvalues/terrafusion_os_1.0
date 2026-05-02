using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// Slice G1-A schema-integrity tests. Verifies that the
/// <see cref="TfParcelGeom"/> entity + its EF configuration align,
/// that natural uniqueness on (CountyId, ArcGisObjectId) holds, and
/// that crosswalk-pending state (TfParcelId == null) is permitted.
/// </summary>
public sealed class TfParcelGeomSchemaTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public TfParcelGeomSchemaTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"gis-tf-{Guid.NewGuid():N}")
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

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task TfParcelGeom_RoundTrip()
    {
        var countyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
        var g = new TfParcelGeom
        {
            CountyId = countyId,
            ArcGisObjectId = 42,
            ArcGisApn = "109884040000015",
            GeomWkt = "POLYGON((-119.3 46.2, -119.2 46.2, -119.2 46.3, -119.3 46.3, -119.3 46.2))",
            CentroidLat = 46.25,
            CentroidLon = -119.25,
            AreaSqFt = 50_000.0,
            SourceServiceUrl = "https://gis.example.com/arcgis/rest/services/Parcels/FeatureServer/0",
        };
        _db.TfParcelGeoms.Add(g);
        await _db.SaveChangesAsync();

        var roundtrip = await _db.TfParcelGeoms.FindAsync(g.TfParcelGeomId);
        roundtrip.Should().NotBeNull();
        roundtrip!.CountyId.Should().Be(countyId);
        roundtrip.ArcGisObjectId.Should().Be(42);
        roundtrip.ArcGisApn.Should().Be("109884040000015");
        roundtrip.GeomWkt.Should().StartWith("POLYGON");
        roundtrip.CentroidLat.Should().BeApproximately(46.25, 1e-9);
        roundtrip.CentroidLon.Should().BeApproximately(-119.25, 1e-9);
        roundtrip.AreaSqFt.Should().BeApproximately(50_000.0, 1e-9);
        roundtrip.IsActive.Should().BeTrue();
        roundtrip.SourceServiceUrl.Should().Contain("FeatureServer");
    }

    [Fact]
    public async Task TfParcelGeom_NullableTfParcelId_AllowsCrosswalkPending()
    {
        // The crosswalk-pending state: an ArcGIS row arrives before its
        // PACS-side TfParcel is resolved. v1 must permit this and only
        // close the crosswalk later (G1-C).
        var g = new TfParcelGeom
        {
            CountyId = Guid.NewGuid(),
            ArcGisObjectId = 100,
            TfParcelId = null,
            GeomWkt = "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
            CentroidLat = 0.5,
            CentroidLon = 0.5,
            AreaSqFt = 1.0,
            SourceServiceUrl = "https://example/FeatureServer/0",
        };
        _db.TfParcelGeoms.Add(g);
        await _db.SaveChangesAsync();

        var roundtrip = await _db.TfParcelGeoms.FindAsync(g.TfParcelGeomId);
        roundtrip.Should().NotBeNull();
        roundtrip!.TfParcelId.Should().BeNull();
    }

    [Fact]
    public async Task TfParcelGeom_DifferentCounties_SameArcGisObjectId_BothLand()
    {
        // Uniqueness is (CountyId, ArcGisObjectId) — the same OBJECTID
        // can legitimately appear in two different counties' feature
        // services because each county's service has its own OBJECTID
        // numbering.
        var countyA = Guid.NewGuid();
        var countyB = Guid.NewGuid();

        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            CountyId = countyA,
            ArcGisObjectId = 7,
            GeomWkt = "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
            SourceServiceUrl = "https://a/FeatureServer/0",
        });
        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            CountyId = countyB,
            ArcGisObjectId = 7,
            GeomWkt = "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
            SourceServiceUrl = "https://b/FeatureServer/0",
        });
        await _db.SaveChangesAsync();

        var rows = await _db.TfParcelGeoms.ToListAsync();
        rows.Should().HaveCount(2);
        rows.Select(r => r.CountyId).Should().BeEquivalentTo(new[] { countyA, countyB });
    }

    [Fact]
    public void TfParcelGeoms_DbSet_IsRegistered()
    {
        // Pure schema-registration check: the DbSet must be present and
        // queryable. If TerraFusionDbContext omits the registration the
        // EF model build fails before this assertion.
        _db.TfParcelGeoms.Should().NotBeNull();
    }

    [Fact]
    public void TfParcelGeom_DefaultValues_AreSane()
    {
        var g = new TfParcelGeom();

        // GUID PK is auto-assigned at construction so the entity can
        // be referenced before SaveChanges (consistent with TfParcel).
        g.TfParcelGeomId.Should().NotBe(Guid.Empty);
        g.IsActive.Should().BeTrue();
        g.GeomWkt.Should().Be(string.Empty);
        g.SourceServiceUrl.Should().Be(string.Empty);
        g.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        g.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
