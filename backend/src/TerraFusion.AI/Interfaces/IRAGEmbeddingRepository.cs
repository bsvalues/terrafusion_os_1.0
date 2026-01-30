// TerraFusionGPT Suite: RAG Embedding Repository Interface
// Elite Government OS Engineering - AI Platform
// Phase 4: Vector storage and similarity search

using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.AI.Entities;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// Repository for RAG embedding operations with vector similarity search
    /// </summary>
    public interface IRAGEmbeddingRepository
    {
        /// <summary>
        /// Store a document chunk with its embedding vector
        /// </summary>
        Task<RAGEmbedding> StoreEmbeddingAsync(
            int documentId,
            int datasetId,
            int chunkIndex,
            string chunkText,
            float[] embedding,
            int tokenCount,
            int startPosition,
            int endPosition,
            string? metadata = null);

        /// <summary>
        /// Store multiple embeddings in batch (more efficient)
        /// </summary>
        Task<int> StoreBatchEmbeddingsAsync(IEnumerable<RAGEmbedding> embeddings);

        /// <summary>
        /// Search for similar embeddings using cosine similarity
        /// </summary>
        /// <param name="datasetId">Dataset to search in</param>
        /// <param name="queryEmbedding">The query vector</param>
        /// <param name="topK">Number of results to return</param>
        /// <param name="minScore">Minimum similarity score (0-1)</param>
        Task<List<RAGEmbeddingSearchResult>> SearchSimilarAsync(
            int datasetId,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f);

        /// <summary>
        /// Search across multiple datasets
        /// </summary>
        Task<List<RAGEmbeddingSearchResult>> SearchMultipleDatasetsAsync(
            IEnumerable<int> datasetIds,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f);

        /// <summary>
        /// Get all embeddings for a document
        /// </summary>
        Task<List<RAGEmbedding>> GetDocumentEmbeddingsAsync(int documentId);

        /// <summary>
        /// Get embedding count for a dataset
        /// </summary>
        Task<int> GetDatasetEmbeddingCountAsync(int datasetId);

        /// <summary>
        /// Delete all embeddings for a document
        /// </summary>
        Task<int> DeleteDocumentEmbeddingsAsync(int documentId);

        /// <summary>
        /// Delete all embeddings for a dataset
        /// </summary>
        Task<int> DeleteDatasetEmbeddingsAsync(int datasetId);
    }

    /// <summary>
    /// Search result with similarity score
    /// </summary>
    public class RAGEmbeddingSearchResult
    {
        public int EmbeddingId { get; set; }
        public int DocumentId { get; set; }
        public int DatasetId { get; set; }
        public int ChunkIndex { get; set; }
        public string ChunkText { get; set; } = string.Empty;
        public float SimilarityScore { get; set; }
        public string? Metadata { get; set; }

        // Navigation data (loaded separately)
        public string? DocumentTitle { get; set; }
        public string? SourceUrl { get; set; }
    }
}
