// TerraFusionGPT Suite: RAG Service Implementation
// Elite Government OS Engineering - AI Platform

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Data;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces; // Extension methods for DbContext
using TerraFusion.Data;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Service for Retrieval Augmented Generation (RAG) - document indexing and semantic search
    /// </summary>
    public class RAGService : IRAGService
    {
        private readonly AIDbContext _context;
        private readonly ILogger<RAGService> _logger;

        private const int DefaultChunkSize = 512; // tokens
        private const int DefaultChunkOverlap = 50; // tokens
        private const int DefaultVectorDimension = 1536; // OpenAI text-embedding-3-small

        public RAGService(
            AIDbContext context,
            ILogger<RAGService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async System.Threading.Tasks.Task<RAGDataset> CreateDatasetAsync(
            string name,
            string? description,
            int? countyId,
            string? category,
            string embeddingProvider = "OpenAI",
            string embeddingModel = "text-embedding-3-small")
        {
            try
            {
                _logger.LogInformation("Creating RAG dataset: {Name}", name);

                var dataset = new RAGDataset
                {
                    Name = name,
                    Description = description,
                    CountyId = countyId,
                    Category = category,
                    EmbeddingProvider = embeddingProvider,
                    EmbeddingModel = embeddingModel,
                    VectorDimension = GetVectorDimension(embeddingModel),
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.RAGDatasets.Add(dataset);
                await _context.SaveChangesAsync();

                _logger.LogInformation("RAG dataset created: {Name} (ID: {Id})", name, dataset.Id);

                return dataset;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating RAG dataset: {Name}", name);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<RAGDocument> AddDocumentAsync(
            int datasetId,
            string title,
            string content,
            string? sourceUrl = null,
            string? documentType = null,
            string? author = null)
        {
            try
            {
                _logger.LogInformation("Adding document to dataset {DatasetId}: {Title}",
                    datasetId, title);

                var dataset = await _context.RAGDatasets.FindAsync(datasetId);
                if (dataset == null)
                {
                    throw new InvalidOperationException($"Dataset {datasetId} not found");
                }

                var document = new RAGDocument
                {
                    DatasetId = datasetId,
                    Title = title,
                    Content = content,
                    SourceUrl = sourceUrl,
                    DocumentType = documentType,
                    Author = author,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.RAGDocuments.Add(document);
                await _context.SaveChangesAsync();

                // Update dataset statistics
                dataset.DocumentCount++;
                dataset.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Document added: {Title} (ID: {Id})", title, document.Id);

                // Auto-index the document
                await IndexDocumentAsync(document.Id);

                return document;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding document: {Title}", title);
                throw;
            }
        }

        public async System.Threading.Tasks.Task IndexDocumentAsync(int documentId)
        {
            try
            {
                _logger.LogInformation("Indexing document ID: {DocumentId}", documentId);

                var document = await _context.RAGDocuments
                    .Include(d => d.Dataset)
                    .FirstOrDefaultAsync(d => d.Id == documentId);

                if (document == null)
                {
                    throw new InvalidOperationException($"Document {documentId} not found");
                }

                if (document.Dataset == null)
                {
                    throw new InvalidOperationException($"Dataset not found for document {documentId}");
                }

                // Chunk the document
                var chunks = ChunkDocument(document.Content, DefaultChunkSize, DefaultChunkOverlap);

                _logger.LogInformation("Document chunked into {ChunkCount} chunks", chunks.Count);

                // Generate embeddings for each chunk (simulated - in production, call embedding API)
                foreach (var chunk in chunks)
                {
                    var embedding = await GenerateEmbeddingAsync(
                        chunk,
                        document.Dataset.EmbeddingProvider,
                        document.Dataset.EmbeddingModel);

                    // Store in RAGEmbeddings table (not implemented in this phase)
                    // In production, insert into RAGEmbeddings with vector data
                }

                // Update document processing status
                document.ChunkCount = chunks.Count;
                document.ProcessedAt = DateTime.UtcNow;
                document.IndexedAt = DateTime.UtcNow;
                document.UpdatedAt = DateTime.UtcNow;

                // Update dataset statistics
                if (document.Dataset != null)
                {
                    document.Dataset.TotalChunks += chunks.Count;
                    document.Dataset.LastIndexedAt = DateTime.UtcNow;
                    document.Dataset.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Document indexed successfully: {DocumentId} with {ChunkCount} chunks",
                    documentId, chunks.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error indexing document ID: {DocumentId}", documentId);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<RAGSearchResult> GetRelevantContextAsync(
            int datasetId,
            string query,
            int topK = 5,
            decimal scoreThreshold = 0.7m)
        {
            try
            {
                _logger.LogInformation("Searching dataset {DatasetId} for: {Query}", datasetId, query);

                var dataset = await _context.RAGDatasets.FindAsync(datasetId);
                if (dataset == null)
                {
                    throw new InvalidOperationException($"Dataset {datasetId} not found");
                }

                // Generate query embedding
                var queryEmbedding = await GenerateEmbeddingAsync(
                    query,
                    dataset.EmbeddingProvider,
                    dataset.EmbeddingModel);

                // PRODUCTION NOTE: This is simulated
                // In production, use pgvector for vector similarity search:
                // SELECT *, (embedding <=> query_embedding) AS distance
                // FROM rag_embeddings
                // WHERE dataset_id = @datasetId
                // ORDER BY distance
                // LIMIT @topK

                // Simulated results
                var documents = await _context.RAGDocuments
                    .Where(d => d.DatasetId == datasetId)
                    .Take(topK)
                    .ToListAsync();

                var context = string.Join("\n\n", documents.Select(d =>
                    $"[Document: {d.Title}]\n{d.Content.Substring(0, Math.Min(500, d.Content.Length))}..."));

                var result = new RAGSearchResult
                {
                    Context = context,
                    DocumentIds = documents.Select(d => d.Id.ToString()).ToList(),
                    AverageScore = 0.85m, // Simulated score
                    ChunksRetrieved = documents.Count
                };

                _logger.LogInformation("RAG search completed: {ChunkCount} chunks retrieved, avg score: {Score}",
                    result.ChunksRetrieved, result.AverageScore);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching dataset {DatasetId}", datasetId);
                throw;
            }
        }

        public async System.Threading.Tasks.Task<RAGSearchResult> SearchDatasetsAsync(
            List<int> datasetIds,
            string query,
            int topK = 5,
            decimal scoreThreshold = 0.7m)
        {
            // Aggregate results from multiple datasets
            var allResults = new List<RAGSearchResult>();

            foreach (var datasetId in datasetIds)
            {
                var result = await GetRelevantContextAsync(datasetId, query, topK, scoreThreshold);
                allResults.Add(result);
            }

            // Combine results
            var combinedContext = string.Join("\n\n---\n\n", allResults.Select(r => r.Context));
            var combinedDocIds = allResults.SelectMany(r => r.DocumentIds).Distinct().ToList();
            var avgScore = allResults.Average(r => r.AverageScore);
            var totalChunks = allResults.Sum(r => r.ChunksRetrieved);

            return new RAGSearchResult
            {
                Context = combinedContext,
                DocumentIds = combinedDocIds,
                AverageScore = avgScore,
                ChunksRetrieved = totalChunks
            };
        }

        public async System.Threading.Tasks.Task<List<RAGDataset>> GetCountyDatasetsAsync(int countyId)
        {
            return await _context.RAGDatasets
                .Where(d => d.CountyId == countyId && d.Status == "Active")
                .OrderByDescending(d => d.UpdatedAt)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<RAGDataset?> GetDatasetAsync(int datasetId)
        {
            return await _context.RAGDatasets
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.Status == "Active");
        }

        public async System.Threading.Tasks.Task<bool> DeleteDatasetAsync(int datasetId)
        {
            var dataset = await _context.RAGDatasets.FindAsync(datasetId);
            if (dataset == null)
            {
                return false;
            }

            // Soft delete
            dataset.Status = "Deleted";
            dataset.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async System.Threading.Tasks.Task<List<RAGDocument>> GetDocumentsAsync(
            int datasetId, int skip = 0, int take = 50)
        {
            return await _context.RAGDocuments
                .Where(d => d.DatasetId == datasetId)
                .OrderByDescending(d => d.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<bool> DeleteDocumentAsync(int documentId)
        {
            var document = await _context.RAGDocuments.FindAsync(documentId);
            if (document == null)
            {
                return false;
            }

            _context.RAGDocuments.Remove(document);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Chunk document into smaller pieces for embedding
        /// </summary>
        private List<string> ChunkDocument(string content, int chunkSize, int overlap)
        {
            // PRODUCTION NOTE: This is a simple character-based chunking
            // In production, use proper tokenizer (tiktoken for OpenAI)

            var chunks = new List<string>();
            var words = content.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);

            var currentChunk = new List<string>();
            var currentLength = 0;

            foreach (var word in words)
            {
                currentChunk.Add(word);
                currentLength += word.Length / 4; // Rough token estimate

                if (currentLength >= chunkSize)
                {
                    chunks.Add(string.Join(" ", currentChunk));

                    // Keep overlap words for next chunk
                    var overlapWords = currentChunk.Skip(Math.Max(0, currentChunk.Count - overlap)).ToList();
                    currentChunk = overlapWords;
                    currentLength = overlapWords.Sum(w => w.Length / 4);
                }
            }

            // Add remaining chunk
            if (currentChunk.Any())
            {
                chunks.Add(string.Join(" ", currentChunk));
            }

            return chunks;
        }

        /// <summary>
        /// Generate embedding for text (simulated - in production, call embedding API)
        /// </summary>
        private async System.Threading.Tasks.Task<float[]> GenerateEmbeddingAsync(
            string text,
            string provider,
            string model)
        {
            // PRODUCTION NOTE: This is simulated
            // In production, implement actual embedding generation:
            // - OpenAI: using OpenAI .NET SDK (CreateEmbeddingAsync)
            // - Sentence-Transformers: using ONNX Runtime or Python interop
            // - Azure: using Azure OpenAI SDK

            await Task.Delay(10); // Simulate API call

            var dimension = GetVectorDimension(model);
            var embedding = new float[dimension];

            // Generate random embedding (simulated)
            var random = new Random(text.GetHashCode());
            for (int i = 0; i < dimension; i++)
            {
                embedding[i] = (float)(random.NextDouble() * 2 - 1); // Random values between -1 and 1
            }

            // Normalize (unit vector)
            var magnitude = Math.Sqrt(embedding.Sum(x => x * x));
            for (int i = 0; i < dimension; i++)
            {
                embedding[i] /= (float)magnitude;
            }

            return embedding;
        }

        /// <summary>
        /// Get vector dimension for embedding model
        /// </summary>
        private int GetVectorDimension(string model)
        {
            return model switch
            {
                "text-embedding-3-small" => 1536,
                "text-embedding-3-large" => 3072,
                "text-embedding-ada-002" => 1536,
                "all-MiniLM-L6-v2" => 384,
                "all-mpnet-base-v2" => 768,
                _ => DefaultVectorDimension
            };
        }
    }
}
