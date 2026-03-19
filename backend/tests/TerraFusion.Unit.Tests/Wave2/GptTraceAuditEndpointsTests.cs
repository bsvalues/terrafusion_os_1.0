// Wave 2 Contract Tests: Conversation Trace / Audit Endpoints
// Covers GET /api/gpt/conversations/{conversationId}/trace
// Phase 11: Government compliance — full traceability for RAG-augmented responses.

using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Entities; // GPTMessage, GPTAudit
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Controllers;
using CoreEntities = TerraFusion.Core.Entities; // GPTConfiguration, GPTConversation — avoids Task ambiguity
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class GptTraceAuditEndpointsTests
{
    private static ControllerContext BuildControllerContext()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "assessor-42"),
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

    // ── GET /api/gpt/conversations/{conversationId}/trace ─────────────────────

    [Fact]
    public async Task GetConversationTrace_Existing_Returns_Ok()
    {
        var conversation = new CoreEntities.GPTConversation
        {
            Id = 10,
            GPTConfigurationId = 1,
            Title = "Property Assessment Query",
            UserId = "user-42",
            CountyId = 1
        };

        var messages = new List<GPTMessage>
        {
            new GPTMessage
            {
                Id = 100,
                ConversationId = 10,
                Role = "user",
                Content = "What is the assessed value for parcel 1234?",
                TotalTokens = 20
            },
            new GPTMessage
            {
                Id = 101,
                ConversationId = 10,
                Role = "assistant",
                Content = "Based on the CAMA data, parcel 1234 is assessed at $285,000.",
                TotalTokens = 45
            }
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch.Setup(s => s.GetConversationAsync(10)).ReturnsAsync(conversation);
        mockOrch.Setup(s => s.GetConversationHistoryAsync(10, It.IsAny<int>())).ReturnsAsync(messages);
        mockOrch.Setup(s => s.GetAuditByMessageIdAsync(It.IsAny<int>())).ReturnsAsync((GPTAudit?)null);

        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig.Setup(s => s.GetGPTByIdAsync(1)).ReturnsAsync(new CoreEntities.GPTConfiguration { Id = 1, Name = "PropertyGPT" });

        var controller = BuildController(
            configService: mockConfig.Object,
            orchestrationService: mockOrch.Object);

        var result = await controller.GetConversationTrace(10);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetConversationTrace_Missing_Conversation_Returns_NotFound()
    {
        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch.Setup(s => s.GetConversationAsync(999)).ReturnsAsync((CoreEntities.GPTConversation?)null);

        var controller = BuildController(orchestrationService: mockOrch.Object);

        var result = await controller.GetConversationTrace(999);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetConversationTrace_Returns_ConversationTraceResponse()
    {
        var conversation = new CoreEntities.GPTConversation
        {
            Id = 20,
            GPTConfigurationId = 2,
            Title = "Levy Calculation Trace",
            UserId = "assessor-1",
            CountyId = 1
        };

        var messages = new List<GPTMessage>
        {
            new GPTMessage { Id = 200, ConversationId = 20, Role = "user", Content = "Calculate levy", TotalTokens = 10 }
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch.Setup(s => s.GetConversationAsync(20)).ReturnsAsync(conversation);
        mockOrch.Setup(s => s.GetConversationHistoryAsync(20, It.IsAny<int>())).ReturnsAsync(messages);
        mockOrch.Setup(s => s.GetAuditByMessageIdAsync(It.IsAny<int>())).ReturnsAsync((GPTAudit?)null);

        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig.Setup(s => s.GetGPTByIdAsync(2)).ReturnsAsync((CoreEntities.GPTConfiguration?)null);

        var controller = BuildController(
            configService: mockConfig.Object,
            orchestrationService: mockOrch.Object);

        var result = await controller.GetConversationTrace(20);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        // Result should be a ConversationTraceResponse (or equivalent)
        Assert.NotNull(ok.Value);
    }

    // ── Audit traceability invariant ──────────────────────────────────────────
    // The trace endpoint must call GetAuditByMessageIdAsync for assistant messages.
    // This is the government-compliance requirement: every AI response must be auditable.

    [Fact]
    public async Task GetConversationTrace_Calls_Audit_For_Assistant_Messages()
    {
        var conversation = new CoreEntities.GPTConversation
        {
            Id = 30,
            GPTConfigurationId = 3,
            UserId = "u1",
            CountyId = 1
        };

        var messages = new List<GPTMessage>
        {
            new GPTMessage { Id = 300, ConversationId = 30, Role = "user", Content = "User query" },
            new GPTMessage
            {
                Id = 301,
                ConversationId = 30,
                Role = "assistant",
                Content = "AI response",
                RAGDocumentsUsed = "[\"doc-1\",\"doc-2\"]", // RAG was used
                RAGScore = 0.92m
            }
        };

        var mockOrch = new Mock<IGPTOrchestrationService>();
        mockOrch.Setup(s => s.GetConversationAsync(30)).ReturnsAsync(conversation);
        mockOrch.Setup(s => s.GetConversationHistoryAsync(30, It.IsAny<int>())).ReturnsAsync(messages);
        mockOrch.Setup(s => s.GetAuditByMessageIdAsync(It.IsAny<int>())).ReturnsAsync((GPTAudit?)null);

        var mockConfig = new Mock<IGPTConfigurationService>();
        mockConfig.Setup(s => s.GetGPTByIdAsync(It.IsAny<int>())).ReturnsAsync((CoreEntities.GPTConfiguration?)null);

        var controller = BuildController(
            configService: mockConfig.Object,
            orchestrationService: mockOrch.Object);

        await controller.GetConversationTrace(30);

        // Verify audit was queried for the assistant message that used RAG
        mockOrch.Verify(s => s.GetAuditByMessageIdAsync(301), Times.Once);
    }
}
