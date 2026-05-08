using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.DTOs.GisTf;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Data;
using TerraFusion.Data.Services.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

/// <summary>
/// Slice D4-Neighbors controller tests for
/// <c>GET /api/parcels/{tfParcelId}/neighbors</c>. Mirrors the
/// pattern from <see cref="ParcelGeometryControllerTests"/>: real
/// EF InMemory context, claims principal injection, no network.
///
/// <para>Asserts:
/// <list type="bullet">
///   <item>404 when the anchor parcel is missing.</item>
///   <item>404 when the anchor exists but has no active geometry.</item>
///   <item>200 with empty neighbor list when <c>radiusFeet=0</c>.</item>
///   <item>Neighbors are ordered by ascending distance and
///        <c>maxResults</c> caps the result count.</item>
///   <item>Sovereign-county isolation: a parcel in another county
///        is NEVER surfaced — even when its centroid is meters
///        away from the anchor's centroid.</item>
/// </list>
/// </para>
/// </summary>
public sealed class ParcelGeometryNeighborControllerTests : IDisposable
{
    private static readonly Guid CountyA = Guid.Parse("3d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d");
    private static readonly Guid CountyB = Guid.Parse("4e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e");

    private readonly TerraFusionDbContext _db;

    public ParcelGeometryNeighborControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"d4-neighbors-{Guid.NewGuid():N}")
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
        Guid parcelId,
        Guid countyId,
        double centroidLat,
        double centroidLon,
        bool isActive = true,
        long objectId = 1)
    {
        var g = new TfParcelGeom
        {
            TfParcelId = parcelId,
            CountyId = countyId,
            ArcGisObjectId = objectId,
            ArcGisApn = "ABC",
            GeomWkt = $"POLYGON(({centroidLon} {centroidLat}, {centroidLon + 0.0001} {centroidLat}, {centroidLon + 0.0001} {centroidLat + 0.0001}, {centroidLon} {centroidLat + 0.0001}, {centroidLon} {centroidLat}))",
            CentroidLat = centroidLat,
            CentroidLon = centroidLon,
            AreaSqFt = 5000.0,
            SourceServiceUrl = "https://example.org/FeatureServer/0",
            LastSyncedAt = DateTime.UtcNow,
            IsActive = isActive,
        };
        _db.TfParcelGeoms.Add(g);
        await _db.SaveChangesAsync();
        return g;
    }

    [Fact]
    public async Task Returns_404_WhenAnchorParcelMissing()
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetNeighbors(Guid.NewGuid());
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns_404_WhenAnchorHasNoActiveGeometry()
    {
        var anchor = await SeedParcelAsync(CountyA, "ANCHOR");
        // No active geom row seeded for anchor.

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetNeighbors(anchor.TfParcelId);
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task RadiusZero_ReturnsEmptyNeighborList()
    {
        var anchor = await SeedParcelAsync(CountyA, "ANCHOR");
        await SeedGeomAsync(anchor.TfParcelId, CountyA, 46.25, -119.25);

        // A second parcel sitting essentially on the same coordinate
        // — only radius=0 should reject it (haversine of identical
        // points is 0, but DistanceFeet must be <= radiusFeet, and
        // the other parcel's distance is non-zero).
        var other = await SeedParcelAsync(CountyA, "OTHER");
        await SeedGeomAsync(
            other.TfParcelId, CountyA, 46.2501, -119.2501, objectId: 2);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetNeighbors(anchor.TfParcelId, radiusFeet: 0d);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ParcelNeighborResponse>().Subject;
        dto.AnchorTfParcelId.Should().Be(anchor.TfParcelId);
        dto.CountyId.Should().Be(CountyA);
        dto.RadiusFeet.Should().Be(0d);
        dto.Neighbors.Should().BeEmpty();
    }

    [Fact]
    public async Task Neighbors_AreOrderedByAscendingDistance()
    {
        // Anchor near (46.25, -119.25). Seed three neighbors at
        // increasing distances and one outside the radius.
        var anchor = await SeedParcelAsync(CountyA, "ANCHOR");
        await SeedGeomAsync(anchor.TfParcelId, CountyA, 46.25, -119.25);

        // Roughly: 0.0001 deg lat ≈ 36.5 ft; we exaggerate to keep
        // the math obvious for readers.
        var near = await SeedParcelAsync(CountyA, "NEAR");
        await SeedGeomAsync(near.TfParcelId, CountyA, 46.2501, -119.25, objectId: 10);

        var middle = await SeedParcelAsync(CountyA, "MID");
        await SeedGeomAsync(middle.TfParcelId, CountyA, 46.2510, -119.25, objectId: 11);

        var far = await SeedParcelAsync(CountyA, "FAR");
        await SeedGeomAsync(far.TfParcelId, CountyA, 46.2530, -119.25, objectId: 12);

        // Outside the requested radius (~10 km north).
        var beyond = await SeedParcelAsync(CountyA, "BEYOND");
        await SeedGeomAsync(beyond.TfParcelId, CountyA, 46.35, -119.25, objectId: 13);

        var ctrl = BuildController(CountyA);
        // 5000 ft radius — ~1.5 km — covers near/middle/far, excludes beyond.
        var result = await ctrl.GetNeighbors(
            anchor.TfParcelId, radiusFeet: 5000d, maxResults: 50);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ParcelNeighborResponse>().Subject;

        dto.Neighbors.Should().HaveCount(3, "beyond is past the radius");
        dto.Neighbors[0].TfParcelId.Should().Be(near.TfParcelId);
        dto.Neighbors[1].TfParcelId.Should().Be(middle.TfParcelId);
        dto.Neighbors[2].TfParcelId.Should().Be(far.TfParcelId);

        // Distances must be strictly non-decreasing.
        var distances = dto.Neighbors.Select(n => n.DistanceFeet).ToList();
        distances.Should().BeInAscendingOrder();
        distances.Should().AllSatisfy(d => d.Should().BeGreaterThanOrEqualTo(0d));
    }

    [Fact]
    public async Task MaxResults_CapsResultCount()
    {
        var anchor = await SeedParcelAsync(CountyA, "ANCHOR");
        await SeedGeomAsync(anchor.TfParcelId, CountyA, 46.25, -119.25);

        // Seed 5 candidates within a generous radius, all in CountyA.
        for (var i = 0; i < 5; i++)
        {
            var p = await SeedParcelAsync(CountyA, $"P{i}");
            await SeedGeomAsync(
                p.TfParcelId, CountyA,
                46.25 + ((i + 1) * 0.0001),
                -119.25,
                objectId: 100 + i);
        }

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetNeighbors(
            anchor.TfParcelId, radiusFeet: 50_000d, maxResults: 2);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ParcelNeighborResponse>().Subject;
        dto.MaxResults.Should().Be(2);
        dto.Neighbors.Should().HaveCount(2, "maxResults caps the response");
        // The two closest are the first two seeded.
        dto.Neighbors.Select(n => n.DistanceFeet)
            .Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task CrossCountyParcels_AreNeverReturned_EvenWhenSpatiallyClose()
    {
        // Anchor in CountyA at (46.25, -119.25).
        var anchor = await SeedParcelAsync(CountyA, "ANCHOR");
        await SeedGeomAsync(anchor.TfParcelId, CountyA, 46.25, -119.25);

        // CountyA neighbor — should appear.
        var sameCounty = await SeedParcelAsync(CountyA, "SAME");
        await SeedGeomAsync(
            sameCounty.TfParcelId, CountyA, 46.2502, -119.25, objectId: 200);

        // CountyB intruder sitting at the SAME coordinate as the
        // anchor — distance is zero, but sovereign-county isolation
        // must drop it. This is the critical test: the spatial
        // engine must never override the county boundary.
        var crossCounty = await SeedParcelAsync(CountyB, "INTRUDER");
        await SeedGeomAsync(
            crossCounty.TfParcelId, CountyB, 46.25, -119.25, objectId: 201);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetNeighbors(
            anchor.TfParcelId, radiusFeet: 5000d, maxResults: 50);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<ParcelNeighborResponse>().Subject;
        dto.CountyId.Should().Be(CountyA);
        dto.Neighbors.Should().HaveCount(1, "CountyB parcels are sovereign-isolated");
        dto.Neighbors.Single().TfParcelId.Should().Be(sameCounty.TfParcelId);
        dto.Neighbors.Should()
            .NotContain(n => n.TfParcelId == crossCounty.TfParcelId,
                "cross-county parcels are NEVER surfaced regardless of distance");
    }
}
