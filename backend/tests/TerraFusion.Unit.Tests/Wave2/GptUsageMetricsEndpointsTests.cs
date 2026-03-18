// Wave 2 Contract Tests: GPT Usage Metrics / Statistics Endpoints
// Verifies GET /api/gpt/{id}/statistics and GET /api/gpt/statistics/county.

using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Interfaces; // GPTUsageStatistics, CountyUsageStatistics defined here
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class GptUsageMetricsEndpointsTests
{
    private static ControllerContext BuildControllerContext()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-42"),
            new Claim("CountyId", "1"),
            new Claim(ClaimTypes.Role, "CountyAdmin")
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        return new ControllerContext { HttpContext = httpContext };
    }

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

    // ── GET /api/gpt/{id}/statistics ─────────────────────────────────────────

    [Fact]
    public async Task GetGPTStatistics_Returns_Ok_With_Stats()
    {
        var stats = new GPTUsageStatistics
        {
            GPTConfigId = 1,
            GPTName = "PropertyGPT",
            TotalConversations = 42,
            TotalMessages = 210,
            TotalTokens = 84000,
            TotalCost = 1.68m,
            PeriodStart = DateTime.UtcNow.AddDays(-30),
            PeriodEnd = DateTime.UtcNow
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetGPTUsageStatisticsAsync(1, It.IsAny<DateTime?>(), It.IsAny<DateTime?>()))
            .ReturnsAsync(stats);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetGPTStatistics(1, null, null);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<GPTUsageStatistics>(ok.Value);
        Assert.Equal(42, returned.TotalConversations);
    }

    // ── GET /api/gpt/statistics/county ────────────────────────────────────────

    [Fact]
    public async Task GetCountyStatistics_Returns_Ok_With_County_Stats()
    {
        var stats = new CountyUsageStatistics
        {
            CountyId = 1,
            CountyName = "Benton County",
            TotalConversations = 150,
            TotalMessages = 750,
            ActiveUsers = 12,
            PeriodStart = DateTime.UtcNow.AddDays(-30),
            PeriodEnd = DateTime.UtcNow
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetCountyUsageStatisticsAsync(It.IsAny<int>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>()))
            .ReturnsAsync(stats);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetCountyStatistics(null, null);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<CountyUsageStatistics>(ok.Value);
        Assert.Equal(150, returned.TotalConversations);
    }

    // ── Statistics invariant ──────────────────────────────────────────────────

    [Fact]
    public async Task GetGPTStatistics_Returns_Empty_Stats_Not_404()
    {
        // The statistics endpoint always returns 200 with empty/zero stats,
        // not 404 — even for GPTs with no usage. This contract matters for UI rendering.
        var emptyStats = new GPTUsageStatistics
        {
            GPTConfigId = 99,
            GPTName = "Unused",
            TotalConversations = 0,
            TotalMessages = 0,
            PeriodStart = DateTime.UtcNow.AddDays(-30),
            PeriodEnd = DateTime.UtcNow
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetGPTUsageStatisticsAsync(99, It.IsAny<DateTime?>(), It.IsAny<DateTime?>()))
            .ReturnsAsync(emptyStats);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetGPTStatistics(99, null, null);

        Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsNotType<NotFoundObjectResult>(result.Result);
    }
}
