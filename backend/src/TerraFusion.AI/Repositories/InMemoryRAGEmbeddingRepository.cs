// TerraFusionGPT Suite: RAG Embedding Repository (In-Memory Implementation)
// Elite Government OS Engineering - AI Platform
// Phase 4: Vector storage with in-memory similarity search
// NOTE: For production with PostgreSQL, use PgVectorRAGEmbeddingRepository

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.AI.Repositories
{
    /// <summary>
    /// In-memory RAG embedding repository using Entity Framework Core.
    /// Uses C# cosine similarity for vector search (development/testing).
    /// For production PostgreSQL, use PgVectorRAGEmbeddingRepository with pgvector.
    /// </summary>
    public class InMemoryRAGEmbeddingRepository : IRAGEmbeddingRepository
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<InMemoryRAGEmbeddingRepository> _logger;

        public InMemoryRAGEmbeddingRepository(
            TerraFusionDbContext context,
            ILogger<InMemoryRAGEmbeddingRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<RAGEmbedding> StoreEmbeddingAsync(
            int documentId,
            int datasetId,
            int chunkIndex,
            string chunkText,
            float[] embedding,
            int tokenCount,
            int startPosition,
            int endPosition,
            string? metadata = null)
        {
            var ragEmbedding = new RAGEmbedding
            {
                DocumentId = documentId,
                DatasetId = datasetId,
                ChunkIndex = chunkIndex,
                ChunkText = chunkText,
                Embedding = embedding,
                TokenCount = tokenCount,
                StartPosition = startPosition,
                EndPosition = endPosition,
                Metadata = metadata,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<RAGEmbedding>().Add(ragEmbedding);
            await _context.SaveChangesAsync();

            _logger.LogDebug("Stored embedding for document {DocumentId} chunk {ChunkIndex}",
                documentId, chunkIndex);

            return ragEmbedding;
        }

        public async Task<int> StoreBatchEmbeddingsAsync(IEnumerable<RAGEmbedding> embeddings)
        {
            var embeddingsList = embeddings.ToList();

            foreach (var embedding in embeddingsList)
            {
                embedding.CreatedAt = DateTime.UtcNow;
            }

            _context.Set<RAGEmbedding>().AddRange(embeddingsList);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Stored {Count} embeddings in batch", embeddingsList.Count);

            return embeddingsList.Count;
        }

        public async Task<List<RAGEmbeddingSearchResult>> SearchSimilarAsync(
            int datasetId,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f)
        {
            _logger.LogDebug("Searching dataset {DatasetId} with topK={TopK}, minScore={MinScore}",
                datasetId, topK, minScore);

            // Load all embeddings for the dataset (in-memory approach)
            // For production with large datasets, use pgvector's <=> operator
            var embeddings = await _context.Set<RAGEmbedding>()
                .Where(e => e.DatasetId == datasetId)
                .ToListAsync();

            if (!embeddings.Any())
            {
                _logger.LogDebug("No embeddings found for dataset {DatasetId}", datasetId);
                return new List<RAGEmbeddingSearchResult>();
            }

            // Calculate cosine similarity for each embedding
            var results = embeddings
                .Select(e => new
                {
                    Embedding = e,
                    Score = CalculateCosineSimilarity(queryEmbedding, e.Embedding)
                })
                .Where(r => r.Score >= minScore)
                .OrderByDescending(r => r.Score)
                .Take(topK)
                .Select(r => new RAGEmbeddingSearchResult
                {
                    EmbeddingId = r.Embedding.Id,
                    DocumentId = r.Embedding.DocumentId,
                    DatasetId = r.Embedding.DatasetId,
                    ChunkIndex = r.Embedding.ChunkIndex,
                    ChunkText = r.Embedding.ChunkText,
                    SimilarityScore = r.Score,
                    Metadata = r.Embedding.Metadata
                })
                .ToList();

            _logger.LogDebug("Found {Count} similar embeddings", results.Count);

            return results;
        }

        public async Task<List<RAGEmbeddingSearchResult>> SearchMultipleDatasetsAsync(
            IEnumerable<int> datasetIds,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f)
        {
            var datasetIdList = datasetIds.ToList();

            _logger.LogDebug("Searching {Count} datasets with topK={TopK}, minScore={MinScore}",
                datasetIdList.Count, topK, minScore);

            // Load embeddings from all specified datasets
            var embeddings = await _context.Set<RAGEmbedding>()
                .Where(e => datasetIdList.Contains(e.DatasetId))
                .ToListAsync();

            if (!embeddings.Any())
            {
                return new List<RAGEmbeddingSearchResult>();
            }

            // Calculate cosine similarity and get top results across all datasets
            var results = embeddings
                .Select(e => new
                {
                    Embedding = e,
                    Score = CalculateCosineSimilarity(queryEmbedding, e.Embedding)
                })
                .Where(r => r.Score >= minScore)
                .OrderByDescending(r => r.Score)
                .Take(topK)
                .Select(r => new RAGEmbeddingSearchResult
                {
                    EmbeddingId = r.Embedding.Id,
                    DocumentId = r.Embedding.DocumentId,
                    DatasetId = r.Embedding.DatasetId,
                    ChunkIndex = r.Embedding.ChunkIndex,
                    ChunkText = r.Embedding.ChunkText,
                    SimilarityScore = r.Score,
                    Metadata = r.Embedding.Metadata
                })
                .ToList();

            return results;
        }

        public async Task<List<RAGEmbedding>> GetDocumentEmbeddingsAsync(int documentId)
        {
            return await _context.Set<RAGEmbedding>()
                .Where(e => e.DocumentId == documentId)
                .OrderBy(e => e.ChunkIndex)
                .ToListAsync();
        }

        public async Task<int> GetDatasetEmbeddingCountAsync(int datasetId)
        {
            return await _context.Set<RAGEmbedding>()
                .CountAsync(e => e.DatasetId == datasetId);
        }

        public async Task<int> DeleteDocumentEmbeddingsAsync(int documentId)
        {
            var embeddings = await _context.Set<RAGEmbedding>()
                .Where(e => e.DocumentId == documentId)
                .ToListAsync();

            _context.Set<RAGEmbedding>().RemoveRange(embeddings);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted {Count} embeddings for document {DocumentId}",
                embeddings.Count, documentId);

            return embeddings.Count;
        }

        public async Task<int> DeleteDatasetEmbeddingsAsync(int datasetId)
        {
            var embeddings = await _context.Set<RAGEmbedding>()
                .Where(e => e.DatasetId == datasetId)
                .ToListAsync();

            _context.Set<RAGEmbedding>().RemoveRange(embeddings);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted {Count} embeddings for dataset {DatasetId}",
                embeddings.Count, datasetId);

            return embeddings.Count;
        }

        /// <summary>
        /// Calculate cosine similarity between two vectors
        /// </summary>
        private static float CalculateCosineSimilarity(float[] vectorA, float[] vectorB)
        {
            if (vectorA.Length != vectorB.Length || vectorA.Length == 0)
            {
                return 0f;
            }

            float dotProduct = 0f;
            float magnitudeA = 0f;
            float magnitudeB = 0f;

            for (int i = 0; i < vectorA.Length; i++)
            {
                dotProduct += vectorA[i] * vectorB[i];
                magnitudeA += vectorA[i] * vectorA[i];
                magnitudeB += vectorB[i] * vectorB[i];
            }

            magnitudeA = (float)Math.Sqrt(magnitudeA);
            magnitudeB = (float)Math.Sqrt(magnitudeB);

            if (magnitudeA == 0f || magnitudeB == 0f)
            {
                return 0f;
            }

            return dotProduct / (magnitudeA * magnitudeB);
        }
    }
}
