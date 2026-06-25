using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Abstractions.DTOs.GisTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Data;
using TerraFusion.Data.Services.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

/// <summary>
/// Slice G1-E-2 controller tests for
/// <c>GET /api/parcels/{tfParcelId}/geometry</c>. Mirrors the C38-B
/// pattern: real EF InMemory context, claims principal injection, no
/// network. Asserts:
///  - 200 with the projection on a happy path
///  - 400 on Guid.Empty
///  - 403 when no countyId claim is present
///  - 404 when the parcel doesn't exist
///  - 404 when the parcel exists but has no active geometry
///  - 404 (NOT 403) on cross-county access — existence must not leak
///  - inactive geometry is not surfaced
///  - the projection round-trips every documented field
/// </summary>
public sealed class ParcelGeometryControllerTests : IDisposable
{
    private static readonly Guid CountyA = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB = Guid.Parse("20200020-2020-2020-2020-202020202020");

    private readonly TerraFusionDbContext _db;

    public ParcelGeometryControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"gis-tf-api-{Guid.NewGuid():N}")
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

    private ParcelGeometryController BuildController(Guid? principalCountyClaim)
    {
        var reader = new ParcelGeometryReader(_db);
        var ctrl = new ParcelGeometryController(
            reader, NullLogger<ParcelGeometryController>.Instance);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };
        return ctrl;
    }

    private async Task<TfParcel> SeedParcelAsync(Guid countyId, string apn)
    {
        var p = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = apn,
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(p);
        await _db.SaveChangesAsync();
        return p;
    }

    private async Task<TfParcelGeom> SeedGeomAsync(
        Guid parcelId, Guid countyId, bool isActive = true)
    {
        var g = new TfParcelGeom
        {
            TfParcelId = parcelId,
            CountyId = countyId,
            ArcGisObjectId = 42,
            ArcGisApn = "ABC",
            GeomWkt = "POLYGON((-119.3 46.2, -119.2 46.2, -119.2 46.3, -119.3 46.3, -119.3 46.2))",
            CentroidLat = 46.25,
            CentroidLon = -119.25,
            AreaSqFt = 50_000.5,
            SourceServiceUrl = "https://example.org/FeatureServer/0",
            LastSyncedAt = new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc),
            IsActive = isActive,
        };
        _db.TfParcelGeoms.Add(g);
        await _db.SaveChangesAsync();
        return g;
    }

    [Fact]
    public async Task Returns_200_WithFullProjection_OnHappyPath()
    {
        var parcel = await SeedParcelAsync(CountyA, "ABC");
        await SeedGeomAsync(parcel.TfParcelId, CountyA);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetGeometry(parcel.TfParcelId);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ParcelGeometryResponse>().Subject;
        dto.TfParcelId.Should().Be(parcel.TfParcelId);
        dto.CountyId.Should().Be(CountyA);
        dto.GeomWkt.Should().StartWith("POLYGON");
        dto.CentroidLat.Should().BeApproximately(46.25, 1e-9);
        dto.CentroidLon.Should().BeApproximately(-119.25, 1e-9);
        dto.AreaSqFt.Should().BeApproximately(50_000.5, 1e-6);
        dto.SourceServiceUrl.Should().Contain("FeatureServer");
        dto.LastSyncedAt.Should().Be(new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc));
        dto.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task Returns_400_OnEmptyGuid()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetGeometry(Guid.Empty);
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns_403_WhenNoCountyClaim()
    {
        var parcel = await SeedParcelAsync(CountyA, "ABC");
        await SeedGeomAsync(parcel.TfParcelId, CountyA);

        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetGeometry(parcel.TfParcelId);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task Returns_404_WhenParcelMissing()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetGeometry(Guid.NewGuid());
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_WhenParcelHasNoGeometry()
    {
        var parcel = await SeedParcelAsync(CountyA, "ABC"); // no geom row
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetGeometry(parcel.TfParcelId);
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_OnCrossCountyAccess_NotForbid()
    {
        // The doctrine: cross-county must look identical to "missing
        // parcel" so existence cannot be probed by an unauthorized
        // principal. 404, NOT 403.
        var parcel = await SeedParcelAsync(CountyA, "ABC");
        await SeedGeomAsync(parcel.TfParcelId, CountyA);

        var ctrl = BuildController(CountyB);
        var result = await ctrl.GetGeometry(parcel.TfParcelId);

        result.Should().BeOfType<NotFoundResult>(
            "cross-county access must NOT be distinguishable from a missing parcel");
    }

    [Fact]
    public async Task InactiveGeometry_IsNotSurfaced_Returns404()
    {
        var parcel = await SeedParcelAsync(CountyA, "ABC");
        await SeedGeomAsync(parcel.TfParcelId, CountyA, isActive: false);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetGeometry(parcel.TfParcelId);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task MultipleGeomRows_OldestSoftDeleted_ReturnsLatestActive()
    {
        var parcel = await SeedParcelAsync(CountyA, "ABC");

        // Seed a soft-deleted older row + an active newer row both
        // linked to the same parcel. The reader must return the
        // active one.
        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            TfParcelId = parcel.TfParcelId,
            CountyId = CountyA,
            ArcGisObjectId = 1,
            GeomWkt = "POLYGON((0 0, 1 0, 1 1, 0 0))",
            SourceServiceUrl = "https://old/FeatureServer/0",
            LastSyncedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = false,
        });
        _db.TfParcelGeoms.Add(new TfParcelGeom
        {
            TfParcelId = parcel.TfParcelId,
            CountyId = CountyA,
            ArcGisObjectId = 2,
            GeomWkt = "POLYGON((10 10, 11 10, 11 11, 10 10))",
            SourceServiceUrl = "https://new/FeatureServer/0",
            LastSyncedAt = new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc),
            IsActive = true,
        });
        await _db.SaveChangesAsync();

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetGeometry(parcel.TfParcelId);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ParcelGeometryResponse>().Subject;
        dto.SourceServiceUrl.Should().Contain("new");
        dto.GeomWkt.Should().Contain("10 10");
    }
}
