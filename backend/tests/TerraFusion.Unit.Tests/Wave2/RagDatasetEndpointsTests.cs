// Wave 2 Contract Tests: RAG Dataset and Document Endpoints
// Covers /api/rag/datasets CRUD and /api/rag/datasets/{id}/documents CRUD.

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
using Xunit;

namespace TerraFusion.Unit.Tests.Wave2;

public sealed class RagDatasetEndpointsTests
{
    private static ControllerContext BuildControllerContext(int? countyId = 1)
    {
        var claims = new System.Collections.Generic.List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-42")
        };
        if (countyId.HasValue)
            claims.Add(new Claim("countyId", countyId.Value.ToString())); // RAGController uses lowercase "countyId"

        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        return new ControllerContext { HttpContext = httpContext };
    }

    private static RAGController BuildController(IRAGService? ragService = null, int? countyId = 1)
    {
        ragService ??= new Mock<IRAGService>().Object;
        var logger = new Mock<ILogger<RAGController>>().Object;
        var controller = new RAGController(ragService, logger);
        controller.ControllerContext = BuildControllerContext(countyId);
        return controller;
    }

    // ── GET /api/rag/datasets ─────────────────────────────────────────────────
    // When no countyId claim is present, returns empty list (data isolation guard).

    [Fact]
    public async Task GetDatasets_No_County_Claim_Returns_Empty_List()
    {
        var controller = BuildController(countyId: null); // no countyId claim

        var result = await controller.GetDatasets();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<RAGDataset>>(ok.Value);
        Assert.Empty(list);
    }

    // ── POST /api/rag/datasets ────────────────────────────────────────────────

    [Fact]
    public async Task CreateDataset_Returns_CreatedAtAction()
    {
        var created = new RAGDataset { Id = 1, Name = "Benton CAMA Basics" };

        var mockRag = new Mock<IRAGService>();
        mockRag
            .Setup(s => s.CreateDatasetAsync(
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
            .ReturnsAsync(created);

        var controller = BuildController(ragService: mockRag.Object);

        var request = new RAGController.CreateDatasetRequest
        {
            Name = "Benton CAMA Basics",
            Description = "Property assessment knowledge base",
            Category = "Assessment"
        };

        var result = await controller.CreateDataset(request);

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    // ── GET /api/rag/datasets/{id} ────────────────────────────────────────────

    [Fact]
    public async Task GetDataset_Found_Returns_Ok()
    {
        var dataset = new RAGDataset { Id = 5, Name = "Test Dataset" };

        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.GetDatasetAsync(5)).ReturnsAsync(dataset);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.GetDataset(5);

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetDataset_Missing_Returns_NotFound()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.GetDatasetAsync(999)).ReturnsAsync((RAGDataset?)null);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.GetDataset(999);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── DELETE /api/rag/datasets/{id} ─────────────────────────────────────────

    [Fact]
    public async Task DeleteDataset_Existing_Returns_NoContent()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.DeleteDatasetAsync(3)).ReturnsAsync(true);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.DeleteDataset(3);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteDataset_Missing_Returns_NotFound()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.DeleteDatasetAsync(404)).ReturnsAsync(false);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.DeleteDataset(404);

        Assert.IsType<NotFoundResult>(result);
    }

    // ── POST /api/rag/datasets/{id}/reindex ───────────────────────────────────

    [Fact]
    public async Task ReindexDataset_Existing_Returns_Ok_With_Count()
    {
        var dataset = new RAGDataset { Id = 2, Name = "CAMA" };
        var docs = new List<RAGDocument>
        {
            new RAGDocument { Id = 10, DatasetId = 2, Title = "Doc 1" },
            new RAGDocument { Id = 11, DatasetId = 2, Title = "Doc 2" }
        };

        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.GetDatasetAsync(2)).ReturnsAsync(dataset);
        mockRag.Setup(s => s.GetDocumentsAsync(2, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(docs);
        mockRag.Setup(s => s.IndexDocumentAsync(It.IsAny<int>())).Returns(Task.CompletedTask);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.ReindexDataset(2);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ReindexDataset_Missing_Returns_NotFound()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.GetDatasetAsync(99)).ReturnsAsync((RAGDataset?)null);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.ReindexDataset(99);

        Assert.IsType<NotFoundResult>(result);
    }

    // ── GET /api/rag/datasets/{datasetId}/documents ───────────────────────────

    [Fact]
    public async Task GetDocuments_Returns_Ok_List()
    {
        var docs = new List<RAGDocument>
        {
            new RAGDocument { Id = 1, DatasetId = 5, Title = "Assessment Guide" }
        };

        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.GetDocumentsAsync(5, It.IsAny<int>(), It.IsAny<int>())).ReturnsAsync(docs);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.GetDocuments(5);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<RAGDocument>>(ok.Value);
        Assert.Single(list);
    }

    // ── POST /api/rag/datasets/{datasetId}/documents ──────────────────────────

    [Fact]
    public async Task AddDocument_Returns_Created()
    {
        var doc = new RAGDocument { Id = 20, DatasetId = 5, Title = "New Doc" };

        var mockRag = new Mock<IRAGService>();
        mockRag
            .Setup(s => s.AddDocumentAsync(
                5,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .ReturnsAsync(doc);
        mockRag.Setup(s => s.IndexDocumentAsync(20)).Returns(Task.CompletedTask);

        var controller = BuildController(ragService: mockRag.Object);

        var request = new RAGController.AddDocumentRequest
        {
            Title = "New Doc",
            Content = "Full document content here."
        };

        var result = await controller.AddDocument(5, request);

        Assert.IsType<CreatedResult>(result.Result);
    }

    // ── DELETE /api/rag/documents/{id} ────────────────────────────────────────

    [Fact]
    public async Task DeleteDocument_Existing_Returns_NoContent()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.DeleteDocumentAsync(10)).ReturnsAsync(true);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.DeleteDocument(10);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task DeleteDocument_Missing_Returns_NotFound()
    {
        var mockRag = new Mock<IRAGService>();
        mockRag.Setup(s => s.DeleteDocumentAsync(999)).ReturnsAsync(false);

        var controller = BuildController(ragService: mockRag.Object);

        var result = await controller.DeleteDocument(999);

        Assert.IsType<NotFoundResult>(result);
    }
}
