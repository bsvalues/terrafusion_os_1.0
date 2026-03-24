using System.Threading.Tasks;
using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.Auth;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using Xunit;

using CountyEntity = TerraFusion.Core.Entities.County;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.API.Tests.Phase14;

public sealed class ControllerSecurityBoundaryTests
{
    [Fact]
    public async Task PropertiesController_GetProperties_ReturnsBadRequest_WhenCountyClaimMissing()
    {
        var propertyService = new Mock<IPropertyService>(MockBehavior.Strict);
        var controller = new PropertiesController(propertyService.Object, Mock.Of<ILogger<PropertiesController>>())
        {
            ControllerContext = BuildControllerContext()
        };

        var result = await controller.GetProperties(countyId: null);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        propertyService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PropertiesController_GetProperties_ReturnsForbid_WhenRequestedCountyMismatchesClaim()
    {
        var claimCountyId = Guid.NewGuid();
        var requestedCountyId = Guid.NewGuid();
        var propertyService = new Mock<IPropertyService>(MockBehavior.Strict);
        var controller = new PropertiesController(propertyService.Object, Mock.Of<ILogger<PropertiesController>>())
        {
            ControllerContext = BuildControllerContext(new Claim("countyId", claimCountyId.ToString()))
        };

        var result = await controller.GetProperties(countyId: requestedCountyId);

        result.Result.Should().BeOfType<ForbidResult>();
        propertyService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PropertiesController_GetPropertyByParcel_UsesClaimCountyId()
    {
        var countyId = Guid.NewGuid();
        var propertyService = new Mock<IPropertyService>(MockBehavior.Strict);
        propertyService
            .Setup(service => service.GetPropertyByParcelAsync("123-456", countyId))
            .ReturnsAsync(new PropertyDto { Id = Guid.NewGuid(), ParcelNumber = "123-456", Address = "1 Main", CountyId = countyId, CountyName = "Benton" });

        var controller = new PropertiesController(propertyService.Object, Mock.Of<ILogger<PropertiesController>>())
        {
            ControllerContext = BuildControllerContext(new Claim("countyId", countyId.ToString()))
        };

        var result = await controller.GetPropertyByParcel("123-456");

        result.Result.Should().BeOfType<OkObjectResult>();
        propertyService.Verify(service => service.GetPropertyByParcelAsync("123-456", countyId), Times.Once);
        propertyService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DaisController_GetPermitAssessmentImpact_ReturnsUnauthorized_WhenCountyClaimMissing()
    {
        await using var dbContext = BuildDbContext();
        var controller = BuildDaisController(dbContext, RequestUserContext.Anonymous);
        controller.ControllerContext = BuildControllerContext();

        var result = await controller.GetPermitAssessmentImpact("parcel-1");

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task DaisController_GetCertificationStatus_ReturnsForbid_WhenCountyRouteMismatchesClaim()
    {
        var bentonCountyId = Guid.NewGuid();

        await using var dbContext = BuildDbContext();
        dbContext.Counties.Add(new CountyEntity { Id = bentonCountyId, Name = "Benton", State = "WA", FipsCode = "005" });
        await dbContext.SaveChangesAsync();

        var controller = BuildDaisController(
            dbContext,
            new RequestUserContext(true, "user-1", bentonCountyId.ToString(), Array.Empty<string>()));
        controller.ControllerContext = BuildControllerContext(new Claim("countyId", bentonCountyId.ToString()));

        var result = await controller.GetCertificationStatus("Yakima", 2026);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public void DaisController_HttpActions_DoNotAllowAnonymous()
    {
        var publicActionMethods = typeof(DaisController)
            .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
            .Where(method => method.GetCustomAttributes().Any(attribute => attribute is HttpMethodAttribute));

        publicActionMethods.Should().OnlyContain(method =>
            method.GetCustomAttribute<AllowAnonymousAttribute>() == null,
            "Phase 14 requires controller-level authentication without anonymous carve-outs");
    }

    [Fact]
    public void MarketplaceController_IsAdminOnly_AndHasNoStubMetricHelpers()
    {
        var authorize = typeof(MarketplaceController).GetCustomAttribute<AuthorizeAttribute>();

        authorize.Should().NotBeNull();
        authorize!.Roles.Should().Be("Admin,SystemAdmin");

        var controllerMethods = typeof(MarketplaceController)
            .GetMethods(BindingFlags.Instance | BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.DeclaredOnly)
            .Select(method => method.Name)
            .ToArray();

        controllerMethods.Should().NotContain(new[] { "GetDownloadCount", "GetRating", "GetRatingCount" });
    }

    private static ControllerContext BuildControllerContext(params Claim[] claims)
    {
        var identity = claims.Length == 0
            ? new ClaimsIdentity()
            : new ClaimsIdentity(claims, "TestAuth");

        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            }
        };
    }

    private static TerraFusionDbContext BuildDbContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private static DaisController BuildDaisController(TerraFusionDbContext dbContext, RequestUserContext userContext)
    {
        var userContextAccessor = new Mock<IRequestUserContextAccessor>();
        userContextAccessor.SetupGet(accessor => accessor.Current).Returns(userContext);

        return new DaisController(
            dbContext,
            Mock.Of<ILogger<DaisController>>(),
            Mock.Of<IExemptionService>(),
            Mock.Of<IAppealService>(),
            Mock.Of<ICertificationService>(),
            Mock.Of<INoticeService>(),
            Mock.Of<IQueueService>(),
            userContextAccessor.Object,
            Mock.Of<IGovernedToolAuditService>());
    }
}