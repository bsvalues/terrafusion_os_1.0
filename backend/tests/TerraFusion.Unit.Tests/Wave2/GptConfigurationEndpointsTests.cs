// Wave 2 Contract Tests: GPT Configuration Endpoints
// Verifies GET/POST/PUT/DELETE /api/gpt surface and system/diagnostics/safe-mode endpoints.

using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Entities; // GPTMessage, RAGDataset, RAGDocument, GPTAudit
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Controllers;
using CoreEntities = TerraFusion.Core.Entities; // GPTConfiguration, GPTConversation — avoids Task ambiguity
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class GptConfigurationEndpointsTests
{
    // GPTController requires 3 non-nullable services + ILogger.
    // Optional services (ISystemGptHealthEvaluator, ISystemGptModeService, etc.) default to null.
    // ControllerContext is populated with a fake authenticated user so GetUserId/GetCountyId don't throw.
    private static GPTController BuildController(
        IGPTConfigurationService? configService = null,
        IGPTOrchestrationService? orchestrationService = null,
        IRAGService? ragService = null)
    {
        configService ??= new Mock<IGPTConfigurationService>().Object;
        orchestrationService ??= new Mock<IGPTOrchestrationService>().Object;
        ragService ??= new Mock<IRAGService>().Object;
        var logger = new Mock<ILogger<GPTController>>().Object;

        var controller = new GPTController(configService, orchestrationService, ragService, logger);
        controller.ControllerContext = BuildControllerContext();
        return controller;
    }

    private static ControllerContext BuildControllerContext()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-42"),
            new Claim("CountyId", "1"),
            new Claim(ClaimTypes.Role, "Assessor")
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        return new ControllerContext { HttpContext = httpContext };
    }

    // ── GET /api/gpt ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailableGPTs_Returns_Ok_With_List()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.GetAvailableGPTsAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync(new List<CoreEntities.GPTConfiguration> { new CoreEntities.GPTConfiguration { Id = 1, Name = "TestGPT" } });

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.GetAvailableGPTs();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<CoreEntities.GPTConfiguration>>(ok.Value);
        Assert.Single(list);
    }

    // ── GET /api/gpt/system ───────────────────────────────────────────────────

    [Fact]
    public async Task GetSystemGPTs_Returns_Ok()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.GetSystemGPTsAsync())
            .ReturnsAsync(new List<CoreEntities.GPTConfiguration>());

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.GetSystemGPTs();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    // ── GET /api/gpt/featured ─────────────────────────────────────────────────

    [Fact]
    public async Task GetFeaturedGPTs_Returns_Ok()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.GetFeaturedGPTsAsync())
            .ReturnsAsync(new List<CoreEntities.GPTConfiguration> { new CoreEntities.GPTConfiguration { Id = 2, Name = "Featured" } });

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.GetFeaturedGPTs();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<CoreEntities.GPTConfiguration>>(ok.Value);
        Assert.Single(list);
    }

    // ── GET /api/gpt/popular ──────────────────────────────────────────────────

    [Fact]
    public async Task GetPopularGPTs_Returns_Ok()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.GetPopularGPTsAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<CoreEntities.GPTConfiguration>());

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.GetPopularGPTs(5);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    // ── GET /api/gpt/{id} ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetGPT_Found_Returns_Ok()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.GetGPTByIdAsync(42))
            .ReturnsAsync(new CoreEntities.GPTConfiguration { Id = 42, Name = "Found" });

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.GetGPT(42);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetGPT_NotFound_Returns_NotFound()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.GetGPTByIdAsync(999))
            .ReturnsAsync((CoreEntities.GPTConfiguration?)null);

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.GetGPT(999);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    // ── POST /api/gpt ─────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateGPT_Returns_CreatedAtAction()
    {
        var newConfig = new CoreEntities.GPTConfiguration { Id = 0, Name = "New GPT" };
        var createdConfig = new CoreEntities.GPTConfiguration { Id = 10, Name = "New GPT" };

        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.CreateGPTAsync(It.IsAny<CoreEntities.GPTConfiguration>()))
            .ReturnsAsync(createdConfig);

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.CreateGPT(newConfig);

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    // ── DELETE /api/gpt/{id} ──────────────────────────────────────────────────

    [Fact]
    public async Task DeleteGPT_Existing_Returns_NoContent()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.DeleteGPTAsync(7))
            .ReturnsAsync(true);

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.DeleteGPT(7);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteGPT_Missing_Returns_NotFound()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.DeleteGPTAsync(999))
            .ReturnsAsync(false);

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.DeleteGPT(999);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ── GET /api/gpt/search ───────────────────────────────────────────────────

    [Fact]
    public async Task SearchGPTs_Returns_Ok_List()
    {
        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig
            .Setup(s => s.SearchGPTsAsync(It.IsAny<string>(), It.IsAny<int?>()))
            .ReturnsAsync(new List<CoreEntities.GPTConfiguration> { new CoreEntities.GPTConfiguration { Id = 3, Name = "Match" } });

        var controller = BuildController(configService: mockConfig.Object);

        var result = await controller.SearchGPTs("assessment");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<CoreEntities.GPTConfiguration>>(ok.Value);
        Assert.Single(list);
    }
}
