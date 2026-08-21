using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.API.Services;
using County = TerraFusion.Core.Entities.County;
using GisParcelGeometry = TerraFusion.Core.Entities.GisParcelGeometry;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.Atlas;

public sealed class AtlasGisSecurityBoundaryTests
{
    private static readonly Guid BentonCounty =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCounty =
        Guid.Parse("20200020-2020-2020-2020-202020202020");
    private const string ParcelId = "ATLAS-BENTON-001";

    [Fact]
    public void ParcelCompatibilityEndpoints_RequireAuthenticationAndReadParcelPermission()
    {
        typeof(AtlasGisController).GetCustomAttributes<AuthorizeAttribute>()
            .Should().ContainSingle();

        foreach (var methodName in new[]
                 {
                     nameof(AtlasGisController.GetParcelBoundary),
                     nameof(AtlasGisController.GetParcelLayers),
                     nameof(AtlasGisController.GetParcel),
                 })
        {
            var method = typeof(AtlasGisController).GetMethod(methodName)!;
            method.GetCustomAttributes<AllowAnonymousAttribute>().Should().BeEmpty();
            method.GetCustomAttributes<RequiresPermissionAttribute>()
                .Single().Policy.Should().Be(
                    $"{RequiresPermissionAttribute.PolicyPrefix}read:parcel");
        }
    }

    [Fact]
    public async Task MissingCounty_Returns404WithoutServiceQuery()
    {
        var service = new StubGisDataService(CreateBoundary(), CreateLayers());
        var result = await BuildController(service).GetParcelBoundary(ParcelId, default);
        result.Should().BeOfType<NotFoundResult>();
        service.TotalCalls.Should().Be(0);
    }

    [Fact]
    public async Task AmbiguousCounty_ReturnsSame404WithoutServiceQuery()
    {
        var service = new StubGisDataService(CreateBoundary(), CreateLayers());
        var controller = BuildController(
            service,
            BentonCounty.ToString("D"),
            OtherCounty.ToString("D"));
        var result = await controller.GetParcelBoundary(ParcelId, default);
        result.Should().BeOfType<NotFoundResult>();
        service.TotalCalls.Should().Be(0);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("../other-county")]
    [InlineData("parcel with spaces")]
    public async Task InvalidSelector_ReturnsSame404WithoutServiceQuery(string selector)
    {
        var service = new StubGisDataService(CreateBoundary(), CreateLayers());
        var controller = BuildController(service, BentonCounty.ToString("D"));
        var result = await controller.GetParcelBoundary(selector, default);
        result.Should().BeOfType<NotFoundResult>();
        service.TotalCalls.Should().Be(0);
    }

    [Fact]
    public async Task SameCounty_ForwardsAuthenticatedCountyAndNormalizedSelector()
    {
        var service = new StubGisDataService(CreateBoundary(), CreateLayers());
        var controller = BuildController(service, BentonCounty.ToString("D"));
        var result = await controller.GetParcelBoundary($" {ParcelId} ", default);
        result.Should().BeOfType<OkObjectResult>();
        service.BoundaryCalls.Should().Be(1);
        service.LastCountyId.Should().Be(BentonCounty);
        service.LastParcelId.Should().Be(ParcelId);
    }

    [Fact]
    public async Task MissingOrWrongCountyResult_Returns404WithoutProtectedPayload()
    {
        var service = new StubGisDataService(null, null);
        var controller = BuildController(service, OtherCounty.ToString("D"));
        var boundary = await controller.GetParcelBoundary(ParcelId, default);
        var layers = await controller.GetParcelLayers(ParcelId, default);
        var combined = await controller.GetParcel(ParcelId, default);
        boundary.Should().BeOfType<NotFoundResult>();
        layers.Should().BeOfType<NotFoundResult>();
        combined.Should().BeOfType<NotFoundResult>();
        service.LayerCalls.Should().Be(1);
        service.BoundaryCalls.Should().Be(2);
    }

    [Fact]
    public async Task CombinedEndpoint_ShortCircuitsLayersWhenBoundaryIsRejected()
    {
        var service = new StubGisDataService(null, CreateLayers());
        var controller = BuildController(service, BentonCounty.ToString("D"));
        var result = await controller.GetParcel(ParcelId, default);
        result.Should().BeOfType<NotFoundResult>();
        service.BoundaryCalls.Should().Be(1);
        service.LayerCalls.Should().Be(0);
    }

    [Fact]
    public async Task ServiceEmbedsCountyOwnershipPredicateBeforeMaterializingLegacyRow()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase($"atlas-gis-security-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder().Build();
        await using var db = new TerraFusionDbContext(options, configuration);
        await db.Database.EnsureCreatedAsync();

        db.Counties.AddRange(
            new County { Id = BentonCounty, Name = "Benton", State = "WA", FipsCode = "005" },
            new County { Id = OtherCounty, Name = "Other", State = "WA", FipsCode = "033" });
        db.GisParcelGeometries.Add(new GisParcelGeometry
        {
            ParcelId = ParcelId,
            OwnerName = "Protected Owner",
            SitusAddress = "100 Protected Street",
            RingJson = "[[-119.3,46.2],[-119.2,46.2],[-119.3,46.2]]",
            TaxCodeArea = "005",
            PrimaryUse = "R",
        });
        await db.SaveChangesAsync();

        var gis = new GisDataService(db, NullLogger<GisDataService>.Instance);
        var wrongBoundary = await gis.GetParcelBoundaryAsync(OtherCounty, ParcelId);
        var wrongLayers = await gis.GetParcelLayersAsync(OtherCounty, ParcelId);
        var sameBoundary = await gis.GetParcelBoundaryAsync(BentonCounty, ParcelId);

        wrongBoundary.Should().BeNull();
        wrongLayers.Should().BeNull();
        sameBoundary.Should().NotBeNull();
        sameBoundary!.OwnerName.Should().Be("Protected Owner");
    }

    private static AtlasGisController BuildController(
        IGisDataService service,
        params string[] countyClaims)
    {
        var identity = new ClaimsIdentity("Test");
        identity.AddClaim(new Claim("perm", "read:parcel"));
        foreach (var countyClaim in countyClaims)
        {
            identity.AddClaim(new Claim("countyId", countyClaim));
        }

        return new AtlasGisController(service, NullLogger<AtlasGisController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity),
                },
            },
        };
    }

    private static ParcelBoundaryResult CreateBoundary() => new(
        ParcelId, "live", new ParcelCentroid(46.2, -119.2, "test"), null,
        1m, 43_560m, "100 Same County Street",
        "[[-119.3,46.2],[-119.2,46.2],[-119.3,46.2]]", "Same County Owner");

    private static ParcelLayersResult CreateLayers() => new(
        ParcelId, "live", null, null,
        new ParcelTaxAreaLayer("005", "Benton", 2026m, "live"),
        new ParcelLandClassLayer(null, null, "R", null, "live"));

    private sealed class StubGisDataService(
        ParcelBoundaryResult? boundary,
        ParcelLayersResult? layers) : IGisDataService
    {
        public int BoundaryCalls { get; private set; }
        public int LayerCalls { get; private set; }
        public int TotalCalls => BoundaryCalls + LayerCalls;
        public Guid? LastCountyId { get; private set; }
        public string? LastParcelId { get; private set; }

        public Task<ParcelBoundaryResult?> GetParcelBoundaryAsync(
            Guid countyId, string parcelId, CancellationToken ct = default)
        {
            BoundaryCalls++;
            LastCountyId = countyId;
            LastParcelId = parcelId;
            return Task.FromResult(boundary);
        }

        public Task<ParcelLayersResult?> GetParcelLayersAsync(
            Guid countyId, string parcelId, CancellationToken ct = default)
        {
            LayerCalls++;
            LastCountyId = countyId;
            LastParcelId = parcelId;
            return Task.FromResult(layers);
        }
    }
}
