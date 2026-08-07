using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.API.Services.Atlas;
using TerraFusion.Core.DTOs.GisTf;
using TerraFusion.Core.GIS.ArcGisRest;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

public sealed class ParcelGeometryControllerTests
{
    private static readonly Guid CountyA = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB = Guid.Parse("20200020-2020-2020-2020-202020202020");
    private static readonly Guid ParcelId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private const string ParcelNumber = "SR009C-SYNTHETIC-P1";

    [Fact]
    public void AtlasProjectionEndpoint_RequiresAuthentication_AndReadParcelPermission()
    {
        var method = typeof(ParcelGeometryController).GetMethod(
            nameof(ParcelGeometryController.GetAtlasProjection),
            BindingFlags.Instance | BindingFlags.Public)!;

        method.GetCustomAttributes<AuthorizeAttribute>()
            .Should().Contain(attribute => attribute.GetType() == typeof(AuthorizeAttribute));
        method.GetCustomAttributes<RequiresPermissionAttribute>()
            .Single()
            .Policy.Should().Be($"{RequiresPermissionAttribute.PolicyPrefix}read:parcel");
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_ReturnsCanonicalPolygon_ForSameCounty()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var host = new StubHost(CreatePolygonResult());
        var controller = BuildController(CountyA, reader, host);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        var content = result.Should().BeOfType<ContentResult>().Subject;
        content.ContentType.Should().Be("application/json");
        content.Content.Should().Contain("\"type\":\"Polygon\"");
        content.Content.Should().Contain(CountyA.ToString("D"));
        content.Content.Should().Contain(ParcelId.ToString("D"));
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_ReturnsTruthfulUnavailable_WhenGeometryIsAbsent()
    {
        var reader = new StubReader(ParcelGeometryLookup.NoGeometry(CountyA));
        var host = new StubHost(CreatePolygonResult());
        var controller = BuildController(CountyA, reader, host);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        var content = result.Should().BeOfType<ContentResult>().Subject;
        content.Content.Should().Be("null");
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_Returns404_WithoutHostCall_ForCrossCountyParcel()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var host = new StubHost(CreatePolygonResult());
        var controller = BuildController(CountyB, reader, host);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        result.Should().BeOfType<NotFoundResult>();
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_ForbidsMissingCountyClaim_WithoutLookup()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var host = new StubHost(CreatePolygonResult());
        var controller = BuildController(null, reader, host);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        result.Should().BeOfType<ForbidResult>();
        reader.CallCount.Should().Be(0);
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_ForbidsEmptyCountyClaim_WithoutLookup()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var host = new StubHost(CreatePolygonResult());
        var controller = BuildController(Guid.Empty, reader, host);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        result.Should().BeOfType<ForbidResult>();
        reader.CallCount.Should().Be(0);
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_IsDefaultUnavailable_WhenConsumerIsNotRegistered()
    {
        var reader = new StubReader(ParcelGeometryLookup.NotFound());
        var controller = new ParcelGeometryController(
            reader,
            NullLogger<ParcelGeometryController>.Instance);
        SetPrincipal(controller, CountyA);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        var unavailable = result.Should().BeOfType<ObjectResult>().Subject;
        unavailable.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        reader.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ControllerActivation_SelectsTwoArgumentConstructor_WhenProjectionIsDisabled()
    {
        var reader = new StubReader(ParcelGeometryLookup.NotFound());
        var serviceCollection = new ServiceCollection()
            .AddSingleton<IParcelGeometryReader>(reader)
            .AddSingleton(NullLogger<ParcelGeometryController>.Instance)
            .AddSingleton<Microsoft.Extensions.Logging.ILogger<ParcelGeometryController>>(
                NullLogger<ParcelGeometryController>.Instance);
        serviceCollection.AddControllers();
        await using var services = serviceCollection.BuildServiceProvider();
        var controller = ActivateThroughMvc(services);
        SetPrincipal(controller, CountyA);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        result.Should().BeOfType<ObjectResult>()
            .Which.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        reader.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ControllerActivation_SelectsThreeArgumentConstructor_WhenProjectionIsEnabled()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var options = Options.Create(new AtlasProjectionOptions
        {
            Mode = AtlasProjectionMode.LocalExact,
            ModulePath = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "project-atlas-feature.mjs")),
        });
        var consumer = new AtlasProjectionConsumer(
            reader,
            new StubIdentityResolver(ParcelId),
            new StubCountyScopeVerifier(true),
            new StubHost(CreatePolygonResult()),
            options);
        var serviceCollection = new ServiceCollection()
            .AddSingleton<IParcelGeometryReader>(reader)
            .AddSingleton<Microsoft.Extensions.Logging.ILogger<ParcelGeometryController>>(
                NullLogger<ParcelGeometryController>.Instance)
            .AddSingleton(consumer);
        serviceCollection.AddControllers();
        await using var services = serviceCollection.BuildServiceProvider();
        var controller = ActivateThroughMvc(services);
        SetPrincipal(controller, CountyA);

        var result = await controller.GetAtlasProjection(ParcelNumber);

        result.Should().BeOfType<ContentResult>()
            .Which.Content.Should().Contain("\"type\":\"Polygon\"");
    }

    [Fact]
    public async Task AtlasProjectionEndpoint_FailsClosed_WhenProjectionEvidenceIsInvalid()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var invalid = CreatePolygonResult() with { SourceModuleSha256 = new string('0', 64) };
        var controller = BuildController(CountyA, reader, new StubHost(invalid));

        var result = await controller.GetAtlasProjection(ParcelNumber);

        var failure = result.Should().BeOfType<ObjectResult>().Subject;
        failure.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public async Task ExistingGeometryEndpoint_RemainsUnchanged()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry()));
        var controller = BuildController(CountyA, reader, new StubHost(CreatePolygonResult()));

        var result = await controller.GetGeometry(ParcelId);

        result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<ParcelGeometryResponse>();
    }

    private static ParcelGeometryController BuildController(
        Guid? countyClaim,
        StubReader reader,
        StubHost host)
    {
        var options = Options.Create(new AtlasProjectionOptions
        {
            Mode = AtlasProjectionMode.LocalExact,
            ModulePath = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "project-atlas-feature.mjs")),
        });
        var consumer = new AtlasProjectionConsumer(
            reader,
            new StubIdentityResolver(ParcelId),
            new StubCountyScopeVerifier(countyClaim == CountyA),
            host,
            options);
        var controller = new ParcelGeometryController(
            reader,
            NullLogger<ParcelGeometryController>.Instance,
            consumer);
        SetPrincipal(controller, countyClaim);
        return controller;
    }

    private static ParcelGeometryController ActivateThroughMvc(IServiceProvider services)
    {
        var activator = services.GetRequiredService<IControllerActivator>();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { RequestServices = services },
            ActionDescriptor = new ControllerActionDescriptor
            {
                ControllerTypeInfo = typeof(ParcelGeometryController).GetTypeInfo(),
            },
        };

        return (ParcelGeometryController)activator.Create(context);
    }

    private static void SetPrincipal(ParcelGeometryController controller, Guid? countyClaim)
    {
        var identity = new ClaimsIdentity(countyClaim is null ? null : "Test");
        if (countyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", countyClaim.Value.ToString("D")));
            identity.AddClaim(new Claim("perm", "read:parcel"));
        }
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };
    }

    private static ParcelGeometryResponse CreateGeometry() => new()
    {
        TfParcelId = ParcelId,
        CountyId = CountyA,
        GeomWkt = "POLYGON((-119.3 46.2, -119.2 46.2, -119.2 46.3, -119.3 46.3, -119.3 46.2))",
        CentroidLat = 46.25,
        CentroidLon = -119.25,
        AreaSqFt = 50_000.5,
        LastSyncedAt = new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc),
        SourceServiceUrl = "https://example.invalid/FeatureServer/0",
        IsActive = true,
    };

    private static AtlasProjectionProcessResult CreatePolygonResult() => new(
        AtlasProjectionOutcome.Polygon,
        AtlasProjectionFailure.None,
        $"{{\"type\":\"Feature\",\"geometry\":{{\"type\":\"Polygon\",\"coordinates\":[]}},\"properties\":{{\"countyId\":\"{CountyA:D}\",\"parcelId\":\"{ParcelId:D}\",\"evidenceState\":\"canonical\"}}}}",
        CountyA.ToString("D"),
        ParcelId.ToString("D"),
        "canonical",
        AtlasProjectionOptions.ExpectedModuleSha256,
        AtlasProjectionOptions.ExpectedModuleSha256,
        null);

    private sealed class StubReader(ParcelGeometryLookup lookup) : IParcelGeometryReader
    {
        public int CallCount { get; private set; }

        public Task<ParcelGeometryLookup> GetGeometryAsync(
            Guid tfParcelId,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(lookup);
        }

        public Task<ParcelNeighborLookup> GetNeighborsAsync(
            Guid tfParcelId,
            double radiusFeet,
            int maxResults,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }

    private sealed class StubHost(AtlasProjectionProcessResult result) : IAtlasProjectionProcessHost
    {
        public int CallCount { get; private set; }

        public Task<AtlasProjectionProcessResult> ProjectAsync(
            string modulePath,
            string expectedModuleSha256,
            string spatialReadExchangeJson,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(result);
        }
    }

    private sealed class StubCountyScopeVerifier(bool exists) : IAtlasParcelCountyScopeVerifier
    {
        public Task<bool> ExistsInCountyAsync(
            Guid countyId,
            Guid tfParcelId,
            CancellationToken cancellationToken = default) => Task.FromResult(exists);
    }

    private sealed class StubIdentityResolver(Guid? tfParcelId) : IAtlasParcelIdentityResolver
    {
        public Task<Guid?> ResolveInCountyAsync(
            Guid countyId,
            string parcelNumber,
            CancellationToken cancellationToken = default) => Task.FromResult(tfParcelId);
    }
}
