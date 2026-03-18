// TerraFusion OS: RAG Dataset CRUD Controller
// Wave 2 — Exposes IRAGService methods as HTTP endpoints for RAGDatasetManager UI

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// CRUD controller for RAG datasets, documents, and chunks.
    /// Route prefix: /api/rag
    /// </summary>
    [ApiController]
    [Route("api/rag")]
    [Authorize]
    public class RAGController : ControllerBase
    {
        private readonly IRAGService _ragService;
        private readonly ILogger<RAGController> _logger;

        public RAGController(IRAGService ragService, ILogger<RAGController> logger)
        {
            _ragService = ragService ?? throw new ArgumentNullException(nameof(ragService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        // ==================== Datasets ====================

        /// <summary>
        /// List datasets — scoped to the caller's county when countyId claim is present.
        /// </summary>
        [HttpGet("datasets")]
        public async Task<ActionResult<List<RAGDataset>>> GetDatasets()
        {
            try
            {
                // Prefer county claim for data isolation; fall back to all (admin view)
                var countyClaim = User.FindFirst("countyId")?.Value;
                if (int.TryParse(countyClaim, out var countyId))
                {
                    var datasets = await _ragService.GetCountyDatasetsAsync(countyId);
                    return Ok(datasets);
                }

                // No county claim — return empty to avoid data leakage
                _logger.LogWarning("GetDatasets called without countyId claim");
                return Ok(new List<RAGDataset>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing RAG datasets");
                return StatusCode(500, new { error = "Failed to list datasets" });
            }
        }

        /// <summary>
        /// Get a single dataset by ID.
        /// </summary>
        [HttpGet("datasets/{id:int}")]
        public async Task<ActionResult<RAGDataset>> GetDataset(int id)
        {
            try
            {
                var dataset = await _ragService.GetDatasetAsync(id);
                if (dataset == null) return NotFound();
                return Ok(dataset);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting RAG dataset {Id}", id);
                return StatusCode(500, new { error = "Failed to get dataset" });
            }
        }

        /// <summary>
        /// Create a new dataset.
        /// </summary>
        [HttpPost("datasets")]
        public async Task<ActionResult<RAGDataset>> CreateDataset([FromBody] CreateDatasetRequest request)
        {
            try
            {
                int? countyId = null;
                var countyClaim = User.FindFirst("countyId")?.Value;
                if (int.TryParse(countyClaim, out var cid)) countyId = cid;

                var dataset = await _ragService.CreateDatasetAsync(
                    request.Name,
                    request.Description,
                    countyId,
                    request.Category,
                    request.EmbeddingProvider ?? "OpenAI",
                    request.EmbeddingModel ?? "text-embedding-3-small");

                return CreatedAtAction(nameof(GetDataset), new { id = dataset.Id }, dataset);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating RAG dataset");
                return StatusCode(500, new { error = "Failed to create dataset" });
            }
        }

        /// <summary>
        /// Delete a dataset (soft delete).
        /// </summary>
        [HttpDelete("datasets/{id:int}")]
        public async Task<ActionResult> DeleteDataset(int id)
        {
            try
            {
                var ok = await _ragService.DeleteDatasetAsync(id);
                if (!ok) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting RAG dataset {Id}", id);
                return StatusCode(500, new { error = "Failed to delete dataset" });
            }
        }

        /// <summary>
        /// Trigger reindexing for all documents in a dataset.
        /// </summary>
        [HttpPost("datasets/{id:int}/reindex")]
        public async Task<ActionResult> ReindexDataset(int id)
        {
            try
            {
                var dataset = await _ragService.GetDatasetAsync(id);
                if (dataset == null) return NotFound();

                var docs = await _ragService.GetDocumentsAsync(id);
                foreach (var doc in docs)
                {
                    await _ragService.IndexDocumentAsync(doc.Id);
                }

                return Ok(new { message = "Reindexing started", documentCount = docs.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reindexing RAG dataset {Id}", id);
                return StatusCode(500, new { error = "Failed to reindex dataset" });
            }
        }

        // ==================== Documents ====================

        /// <summary>
        /// List documents in a dataset.
        /// </summary>
        [HttpGet("datasets/{datasetId:int}/documents")]
        public async Task<ActionResult<List<RAGDocument>>> GetDocuments(int datasetId)
        {
            try
            {
                var docs = await _ragService.GetDocumentsAsync(datasetId);
                return Ok(docs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing documents for dataset {DatasetId}", datasetId);
                return StatusCode(500, new { error = "Failed to list documents" });
            }
        }

        /// <summary>
        /// Add a document to a dataset.
        /// </summary>
        [HttpPost("datasets/{datasetId:int}/documents")]
        public async Task<ActionResult<RAGDocument>> AddDocument(int datasetId, [FromBody] AddDocumentRequest request)
        {
            try
            {
                var doc = await _ragService.AddDocumentAsync(
                    datasetId,
                    request.Title,
                    request.Content,
                    request.SourceUrl,
                    request.DocumentType,
                    request.Author);

                // Auto-index after add
                await _ragService.IndexDocumentAsync(doc.Id);

                return Created($"/api/rag/datasets/{datasetId}/documents/{doc.Id}", doc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding document to dataset {DatasetId}", datasetId);
                return StatusCode(500, new { error = "Failed to add document" });
            }
        }

        /// <summary>
        /// Delete a document.
        /// </summary>
        [HttpDelete("documents/{id:int}")]
        public async Task<ActionResult> DeleteDocument(int id)
        {
            try
            {
                var ok = await _ragService.DeleteDocumentAsync(id);
                if (!ok) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting RAG document {Id}", id);
                return StatusCode(500, new { error = "Failed to delete document" });
            }
        }

        // ==================== Chunks (read-only view) ====================

        /// <summary>
        /// List chunks for a document — read-only view for the UI.
        /// Chunks are projected from RAGEmbedding rows indexed for that document.
        /// Returns an empty list when the document has not been indexed yet (Wave 2 — DbSets not yet activated).
        /// </summary>
        [HttpGet("documents/{documentId:int}/chunks")]
        public async Task<ActionResult> GetChunks(int documentId, CancellationToken cancellationToken = default)
        {
            if (documentId <= 0)
                return BadRequest(new { error = "documentId must be a positive integer" });

            try
            {
                var chunks = await _ragService.GetDocumentChunksAsync(documentId);
                return Ok(chunks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing chunks for document {DocumentId}", documentId);
                return StatusCode(500, new { error = "Failed to list chunks" });
            }
        }

        // ==================== Request DTOs ====================

        public class CreateDatasetRequest
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? Category { get; set; }
            public string? EmbeddingProvider { get; set; }
            public string? EmbeddingModel { get; set; }
        }

        public class AddDocumentRequest
        {
            public string Title { get; set; } = string.Empty;
            public string Content { get; set; } = string.Empty;
            public string? SourceUrl { get; set; }
            public string? DocumentType { get; set; }
            public string? Author { get; set; }
        }
    }
}
