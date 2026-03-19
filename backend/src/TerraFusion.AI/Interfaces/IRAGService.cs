// TerraFusionGPT Suite: RAG Service Interface
// Elite Government OS Engineering - AI Platform

using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.AI.Entities;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// Service interface for Retrieval Augmented Generation (RAG)
    /// </summary>
    public interface IRAGService
    {
        /// <summary>
        /// Create a new dataset for document collection
        /// </summary>
        Task<RAGDataset> CreateDatasetAsync(
            string name,
            string? description,
            int? countyId,
            string? category,
            string embeddingProvider = "OpenAI",
            string embeddingModel = "text-embedding-3-small");

        /// <summary>
        /// Add a document to a dataset
        /// </summary>
        Task<RAGDocument> AddDocumentAsync(
            int datasetId,
            string title,
            string content,
            string? sourceUrl = null,
            string? documentType = null,
            string? author = null);

        /// <summary>
        /// Index a document - chunk and generate embeddings
        /// </summary>
        Task IndexDocumentAsync(int documentId);

        /// <summary>
        /// Get relevant context from a dataset based on query
        /// </summary>
        Task<RAGSearchResult> GetRelevantContextAsync(
            int datasetId,
            string query,
            int topK = 5,
            decimal scoreThreshold = 0.7m);

        /// <summary>
        /// Search across multiple datasets
        /// </summary>
        Task<RAGSearchResult> SearchDatasetsAsync(
            List<int> datasetIds,
            string query,
            int topK = 5,
            decimal scoreThreshold = 0.7m);

        /// <summary>
        /// Get all datasets for a county
        /// </summary>
        Task<List<RAGDataset>> GetCountyDatasetsAsync(int countyId);

        /// <summary>
        /// Get dataset by ID
        /// </summary>
        Task<RAGDataset?> GetDatasetAsync(int datasetId);

        /// <summary>
        /// Delete a dataset (soft delete)
        /// </summary>
        Task<bool> DeleteDatasetAsync(int datasetId);

        /// <summary>
        /// Get documents in a dataset
        /// </summary>
        Task<List<RAGDocument>> GetDocumentsAsync(int datasetId, int skip = 0, int take = 50);

        /// <summary>
        /// Delete a document
        /// </summary>
        Task<bool> DeleteDocumentAsync(int documentId);

        /// <summary>
        /// Phase 15: Get health status of a RAG dataset for diagnostics
        /// </summary>
        Task<RAGHealthStatus> GetRagHealthAsync(string datasetName);

        /// <summary>
        /// Wave 2: Get chunks (embeddings) for a document — read-only view for the UI.
        /// Returns an empty list when the document has no indexed chunks.
        /// </summary>
        Task<List<RAGChunkSummary>> GetDocumentChunksAsync(int documentId);
    }

    /// <summary>
    /// Wave 2: Lightweight chunk summary projected from RAGEmbedding for the UI.
    /// Does not expose the raw float[] embedding vector.
    /// </summary>
    public class RAGChunkSummary
    {
        public int Id { get; set; }
        public int DocumentId { get; set; }
        public int ChunkIndex { get; set; }
        public string ChunkText { get; set; } = string.Empty;
        public int TokenCount { get; set; }
        public int StartPosition { get; set; }
        public int EndPosition { get; set; }
    }

    /// <summary>
    /// Phase 15: RAG dataset health status for diagnostics
    /// </summary>
    public class RAGHealthStatus
    {
        public string DatasetName { get; set; } = string.Empty;
        public bool Indexed { get; set; }
        public int DocumentCount { get; set; }
        public int EmbeddingCount { get; set; }
        public DateTime? LastIndexed { get; set; }
    }

    /// <summary>
    /// RAG search result with context and metadata
    /// </summary>
    public class RAGSearchResult
    {
        public string Context { get; set; } = string.Empty;
        public List<string> DocumentIds { get; set; } = new();
        public decimal AverageScore { get; set; }
        public int ChunksRetrieved { get; set; }

        /// <summary>
        /// Phase 11: Detailed chunk information for audit traceability
        /// </summary>
        public List<RAGChunkDetail> ChunkDetails { get; set; } = new();
    }

    /// <summary>
    /// Phase 11: Detailed information about a retrieved RAG chunk for audit trail
    /// </summary>
    public class RAGChunkDetail
    {
        /// <summary>
        /// Chunk identifier (embedding ID)
        /// </summary>
        public int ChunkId { get; set; }

        /// <summary>
        /// Title of the source document
        /// </summary>
        public string DocumentTitle { get; set; } = string.Empty;

        /// <summary>
        /// Source URL if available
        /// </summary>
        public string? SourceUrl { get; set; }

        /// <summary>
        /// Chunk text snippet (truncated to 200 chars for preview)
        /// </summary>
        private string _textSnippet = string.Empty;
        public string TextSnippet
        {
            get => _textSnippet;
            set => _textSnippet = value.Length > 200 ? value.Substring(0, 197) + "..." : value;
        }

        /// <summary>
        /// Full chunk text (available for detailed view)
        /// </summary>
        public string? FullText { get; set; }

        /// <summary>
        /// Similarity score (0-1)
        /// </summary>
        public decimal Score { get; set; }

        /// <summary>
        /// Position within the document
        /// </summary>
        public int ChunkIndex { get; set; }
    }
}
