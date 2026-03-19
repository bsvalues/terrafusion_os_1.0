// Wave 2 Contract Tests: GPT Conversation Endpoints
// Verifies POST conversations, GET by id, GET history, archive, rate, delete.
// Also documents the TWO MISSING routes: GET /conversations and POST /explain.

using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Controllers;
using CoreEntities = TerraFusion.Core.Entities; // alias avoids ambiguity with TerraFusion.Core.Entities.Task
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class GptConversationEndpointsTests
{
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

    // ── POST /api/gpt/conversations ───────────────────────────────────────────

    [Fact]
    public async Task CreateConversation_Returns_CreatedAtAction()
    {
        var created = new CoreEntities.GPTConversation { Id = 5, GPTConfigurationId = 1, Title = "Test" };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.CreateConversationAsync(
                It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(created);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var request = new GPTController.CreateConversationRequest
        {
            GPTConfigId = 1,
            Title = "Test"
        };

        var result = await controller.CreateConversation(request);

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    // ── GET /api/gpt/conversations/{id} ──────────────────────────────────────

    [Fact]
    public async Task GetConversation_Found_Returns_Ok()
    {
        var conv = new CoreEntities.GPTConversation { Id = 10, GPTConfigurationId = 1 };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetConversationAsync(10))
            .ReturnsAsync(conv);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetConversation(10);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetConversation_Missing_Returns_NotFound()
    {
        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetConversationAsync(999))
            .ReturnsAsync((CoreEntities.GPTConversation?)null);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetConversation(999);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    // ── GET /api/gpt/{gptId}/conversations ───────────────────────────────────

    [Fact]
    public async Task GetUserConversations_Returns_Ok_List()
    {
        var convs = new List<CoreEntities.GPTConversation>
        {
            new CoreEntities.GPTConversation { Id = 1, GPTConfigurationId = 3 },
            new CoreEntities.GPTConversation { Id = 2, GPTConfigurationId = 3 }
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetUserConversationsAsync(It.IsAny<string>(), 3, It.IsAny<int>()))
            .ReturnsAsync(convs);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetUserConversations(3, 20);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<CoreEntities.GPTConversation>>(ok.Value);
        Assert.Equal(2, list.Count);
    }

    // ── GET /api/gpt/conversations/{id}/history ───────────────────────────────

    [Fact]
    public async Task GetConversationHistory_Returns_Ok_With_Messages()
    {
        var messages = new List<GPTMessage>
        {
            new GPTMessage { Id = 1, Role = "user", Content = "Hello" },
            new GPTMessage { Id = 2, Role = "assistant", Content = "Hi there" }
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.GetConversationHistoryAsync(5, It.IsAny<int>()))
            .ReturnsAsync(messages);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetConversationHistory(5, 50);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<GPTMessage>>(ok.Value);
        Assert.Equal(2, list.Count);
    }

    // ── POST /api/gpt/conversations/{id}/archive ──────────────────────────────

    [Fact]
    public async Task ArchiveConversation_Returns_NoContent()
    {
        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.ArchiveConversationAsync(3))
            .Returns(Task.CompletedTask);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.ArchiveConversation(3);

        Assert.IsType<NoContentResult>(result);
    }

    // ── POST /api/gpt/conversations/{id}/rate ─────────────────────────────────

    [Fact]
    public async Task RateConversation_Returns_NoContent()
    {
        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.RateConversationAsync(4, It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var request = new GPTController.RateConversationRequest { Rating = 5, Feedback = "Excellent" };
        var result = await controller.RateConversation(4, request);

        Assert.IsType<NoContentResult>(result);
    }

    // ── DELETE /api/gpt/conversations/{id} ────────────────────────────────────

    [Fact]
    public async Task DeleteConversation_Returns_NoContent()
    {
        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch
            .Setup(s => s.DeleteConversationAsync(6))
            .Returns(Task.CompletedTask);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.DeleteConversation(6);

        Assert.IsType<NoContentResult>(result);
    }

    // ── MISSING: GET /api/gpt/conversations ───────────────────────────────────
    // This route does NOT exist in GPTController. The frontend calls it to list all
    // conversations for the current user. Wave 2 must add it.

    [Fact]
    public void Missing_Route_GetAllConversations_Is_Documented()
    {
        // Static assertion: ensure the method does NOT exist yet so Wave 2 implementer knows to add it.
        // When added, this test should be updated to verify the new endpoint returns 200.
        var controllerType = typeof(GPTController);
        var method = controllerType.GetMethod("GetAllConversations",
            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

        // This must be null until Wave 2 adds the route.
        // If this assertion fails, the route was added — update this test to verify behaviour.
        Assert.Null(method); // EXPECTED: missing — add GET /api/gpt/conversations in Wave 2
    }

    // ── POST /api/gpt/explain ─────────────────────────────────────────────────
    // Route exists: Phase 31 added POST /api/gpt/explain. Ledger updated accordingly.

    [Fact]
    public void Route_PostExplain_Exists_In_Controller()
    {
        var controllerType = typeof(GPTController);
        var method = controllerType.GetMethod("Explain",
            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

        // Confirm the route was added (it was — Phase 31).
        // Ledger note: this is no longer a MISSING route.
        Assert.NotNull(method); // Route exists — POST /api/gpt/explain is live.
    }
}
