// Wave 2 Contract Tests: RAG Embedding / Health / Index / Export Endpoints
// Covers:
//   GET  /api/rag/documents/{documentId}/chunks  (STUB — currently returns empty list)
//   GET  /api/gpt/rag/health
//   POST /api/gpt/rag/index/{datasetId}
//   GET  /api/gpt/rag/benton_cama_basics/export

using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.Interfaces; // IRAGService, RAGHealthStatus
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class RagEmbeddingEndpointsTests
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

    private static RAGController BuildRagController(IRAGService? ragService = null)
    {
        ragService ??= new Mock<IRAGService>().Object;
        var logger = new Mock<ILogger<RAGController>>().Object;
        var controller = new RAGController(ragService, logger);
        controller.ControllerContext = BuildControllerContext();
        return controller;
    }

    private static GPTController BuildGptController(
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

    // ── GET /api/rag/documents/{documentId}/chunks ────────────────────────────
    // This endpoint is a STUB: returns an empty list.
    // Contract: must return 200 with an empty array, not 404 or 501.

    [Fact]
    public async Task GetChunks_Returns_Ok_With_Empty_List_Stub()
    {
        var controller = BuildRagController();

        var result = await controller.GetChunks(42);

        var ok = Assert.IsType<OkObjectResult>(result);
        // The stub returns List<object> — verify it is a list type
        Assert.NotNull(ok.Value);
        var list = ok.Value as System.Collections.IList;
        Assert.NotNull(list);
        Assert.Empty(list);
    }

    [Fact]
    public void GetChunks_Is_Stub_Documented()
    {
        // This test exists to make the stub visible in CI.
        // When IRAGService.GetChunksAsync is added, replace the stub and update this test.
        var ragInterface = typeof(IRAGService);
        var getChunksMethod = ragInterface.GetMethod("GetChunksAsync");

        // IRAGService does NOT have GetChunksAsync yet — the stub bypasses the service entirely.
        Assert.Null(getChunksMethod); // Wave 2 must add this method and un-stub the controller.
    }

    // ── GET /api/gpt/rag/health ───────────────────────────────────────────────

    [Fact]
    public async Task GetRAGHealth_Returns_Ok()
    {
        var ragHealth = new RAGHealthStatus
        {
            DatasetName = "benton_cama_basics",
            Indexed = true,
            DocumentCount = 12,
            EmbeddingCount = 240
        };

        var mockRag = new Mock<IRAGService>();
        mockRag
            .Setup(s => s.GetRagHealthAsync("benton_cama_basics"))
            .ReturnsAsync(ragHealth);

        var controller = BuildGptController(ragService: mockRag.Object);

        var result = await controller.GetRAGHealth();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    // ── POST /api/gpt/rag/index/{datasetId} ──────────────────────────────────

    [Fact]
    public async Task IndexDataset_Returns_Ok()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag
            .Setup(s => s.GetDatasetAsync(It.IsAny<int>()))
            .ReturnsAsync(new TerraFusion.AI.Entities.RAGDataset { Id = 1, Name = "Benton CAMA Basics" });
        mockRag
            .Setup(s => s.GetDocumentsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(new List<TerraFusion.AI.Entities.RAGDocument>());

        var controller = BuildGptController(ragService: mockRag.Object);

        var result = await controller.IndexDataset("benton_cama_basics");

        // IndexDataset returns ActionResult<RAGIngestionResponse> — check the inner result
        var okResult = result.Result as OkObjectResult;
        Assert.NotNull(okResult); // Returns Ok with indexing status
    }

    // ── GET /api/gpt/rag/benton_cama_basics/export ────────────────────────────
    // Method: DownloadBentonRagSnapshot — requires IBentonRagReadinessService (optional injection).
    // When not registered, returns 503. Both 200 and 503 are valid contract responses.

    [Fact]
    public async Task DownloadBentonRagSnapshot_Without_Service_Returns_503()
    {
        // IBentonRagReadinessService is optional (null by default) — controller returns 503 gracefully.
        var mockRag = new Mock<IRAGService>();
        var controller = BuildGptController(ragService: mockRag.Object);
        // bentonRagService is null (not injected)

        var result = await controller.DownloadBentonRagSnapshot();

        // Without the optional service, expect 503 Service Unavailable
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(503, statusResult.StatusCode);
    }
}
