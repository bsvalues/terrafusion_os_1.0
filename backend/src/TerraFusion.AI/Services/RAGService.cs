// TerraFusionGPT Suite: RAG Service Implementation
// Elite Government OS Engineering - AI Platform
// Phase 5: Integrated with IEmbeddingService for real/simulated embeddings

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Data; // Extension methods for DbContext
using TerraFusion.Data;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Service for Retrieval Augmented Generation (RAG) - document indexing and semantic search
    /// </summary>
    public class RAGService : IRAGService
    {
        private readonly TerraFusionDbContext _context;
        private readonly IRAGEmbeddingRepository _embeddingRepository;
        private readonly IEmbeddingService _embeddingService;
        private readonly ILogger<RAGService> _logger;

        private const int DefaultChunkSize = 512; // tokens
        private const int DefaultChunkOverlap = 50; // tokens
        private const int DefaultVectorDimension = 1536; // OpenAI text-embedding-3-small

        public RAGService(
            TerraFusionDbContext context,
            IRAGEmbeddingRepository embeddingRepository,
            IEmbeddingService embeddingService,
            ILogger<RAGService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _embeddingRepository = embeddingRepository ?? throw new ArgumentNullException(nameof(embeddingRepository));
            _embeddingService = embeddingService ?? throw new ArgumentNullException(nameof(embeddingService));
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

                _context.RAGDatasets().Add(dataset);
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

                var dataset = await _context.RAGDatasets().FindAsync(datasetId);
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

                _context.RAGDocuments().Add(document);
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

                var document = await _context.RAGDocuments()
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

                // Delete existing embeddings for this document (re-indexing)
                await _embeddingRepository.DeleteDocumentEmbeddingsAsync(documentId);

                // Chunk the document
                var chunks = ChunkDocument(document.Content, DefaultChunkSize, DefaultChunkOverlap);

                _logger.LogInformation("Document chunked into {ChunkCount} chunks using {Provider}",
                    chunks.Count, _embeddingService.ProviderName);

                // Generate embeddings in batch (more efficient)
                var embeddingVectors = await _embeddingService.GenerateBatchEmbeddingsAsync(
                    chunks,
                    document.Dataset.EmbeddingModel);

                // Build RAGEmbedding entities
                var embeddings = new List<RAGEmbedding>();
                int position = 0;

                for (int i = 0; i < chunks.Count; i++)
                {
                    var chunk = chunks[i];
                    var startPos = position;
                    var endPos = position + chunk.Length;
                    position = endPos - DefaultChunkOverlap; // Account for overlap

                    embeddings.Add(new RAGEmbedding
                    {
                        DocumentId = documentId,
                        DatasetId = document.DatasetId,
                        ChunkIndex = i,
                        ChunkText = chunk,
                        Embedding = embeddingVectors[i],
                        TokenCount = EstimateTokenCount(chunk),
                        StartPosition = startPos,
                        EndPosition = endPos
                    });
                }

                // Store all embeddings in batch
                await _embeddingRepository.StoreBatchEmbeddingsAsync(embeddings);

                _logger.LogInformation("Stored {Count} embeddings for document {DocumentId}",
                    embeddings.Count, documentId);

                // Update document processing status
                document.ChunkCount = chunks.Count;
                document.ProcessedAt = DateTime.UtcNow;
                document.IndexedAt = DateTime.UtcNow;
                document.UpdatedAt = DateTime.UtcNow;

                // Update dataset statistics
                var datasetEmbeddingCount = await _embeddingRepository.GetDatasetEmbeddingCountAsync(document.DatasetId);
                document.Dataset.TotalChunks = datasetEmbeddingCount;
                document.Dataset.LastIndexedAt = DateTime.UtcNow;
                document.Dataset.UpdatedAt = DateTime.UtcNow;

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

        /// <summary>
        /// Estimate token count for a text chunk (rough approximation)
        /// </summary>
        private static int EstimateTokenCount(string text)
        {
            // Rough estimate: ~4 characters per token for English
            return (int)Math.Ceiling(text.Length / 4.0);
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

                var dataset = await _context.RAGDatasets().FindAsync(datasetId);
                if (dataset == null)
                {
                    throw new InvalidOperationException($"Dataset {datasetId} not found");
                }

                // Generate query embedding using the embedding service
                var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(
                    query,
                    dataset.EmbeddingModel);

                // Search for similar embeddings using the repository
                var searchResults = await _embeddingRepository.SearchSimilarAsync(
                    datasetId,
                    queryEmbedding,
                    topK,
                    (float)scoreThreshold);

                if (!searchResults.Any())
                {
                    _logger.LogInformation("No relevant chunks found for query in dataset {DatasetId}", datasetId);
                    return new RAGSearchResult
                    {
                        Context = string.Empty,
                        DocumentIds = new List<string>(),
                        AverageScore = 0,
                        ChunksRetrieved = 0
                    };
                }

                // Enrich results with document titles
                var documentIds = searchResults.Select(r => r.DocumentId).Distinct().ToList();
                var documents = await _context.RAGDocuments()
                    .Where(d => documentIds.Contains(d.Id))
                    .ToDictionaryAsync(d => d.Id, d => d);

                foreach (var searchResult in searchResults)
                {
                    if (documents.TryGetValue(searchResult.DocumentId, out var doc))
                    {
                        searchResult.DocumentTitle = doc.Title;
                        searchResult.SourceUrl = doc.SourceUrl;
                    }
                }

                // Build context from retrieved chunks
                var contextParts = searchResults.Select(r =>
                    $"[Source: {r.DocumentTitle ?? "Unknown"} (Score: {r.SimilarityScore:F2})]\n{r.ChunkText}");
                var context = string.Join("\n\n---\n\n", contextParts);

                var avgScore = searchResults.Average(r => (decimal)r.SimilarityScore);

                // Phase 11: Build chunk details for audit traceability
                var chunkDetails = searchResults.Select(r => new RAGChunkDetail
                {
                    ChunkId = r.EmbeddingId,
                    DocumentTitle = r.DocumentTitle ?? "Unknown",
                    SourceUrl = r.SourceUrl,
                    TextSnippet = r.ChunkText ?? string.Empty, // Auto-truncated by setter
                    FullText = r.ChunkText,
                    Score = (decimal)r.SimilarityScore,
                    ChunkIndex = r.ChunkIndex
                }).ToList();

                var ragResult = new RAGSearchResult
                {
                    Context = context,
                    DocumentIds = searchResults.Select(r => r.DocumentId.ToString()).Distinct().ToList(),
                    AverageScore = avgScore,
                    ChunksRetrieved = searchResults.Count,
                    ChunkDetails = chunkDetails // Phase 11: Include chunk details
                };

                _logger.LogInformation("RAG search completed: {ChunkCount} chunks retrieved, avg score: {Score:F2}",
                    ragResult.ChunksRetrieved, ragResult.AverageScore);

                return ragResult;
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
            return await _context.RAGDatasets()
                .Where(d => d.CountyId == countyId && d.Status == "Active")
                .OrderByDescending(d => d.UpdatedAt)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<RAGDataset?> GetDatasetAsync(int datasetId)
        {
            return await _context.RAGDatasets()
                .FirstOrDefaultAsync(d => d.Id == datasetId && d.Status == "Active");
        }

        public async System.Threading.Tasks.Task<bool> DeleteDatasetAsync(int datasetId)
        {
            var dataset = await _context.RAGDatasets().FindAsync(datasetId);
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
            return await _context.RAGDocuments()
                .Where(d => d.DatasetId == datasetId)
                .OrderByDescending(d => d.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async System.Threading.Tasks.Task<bool> DeleteDocumentAsync(int documentId)
        {
            var document = await _context.RAGDocuments().FindAsync(documentId);
            if (document == null)
            {
                return false;
            }

            _context.RAGDocuments().Remove(document);
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
        /// Get vector dimension for embedding model (delegates to embedding service)
        /// </summary>
        private int GetVectorDimension(string model)
        {
            return _embeddingService.GetVectorDimension(model);
        }
    }
}
