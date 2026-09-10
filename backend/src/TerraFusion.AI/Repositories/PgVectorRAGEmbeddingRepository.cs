// TerraFusionGPT Suite: RAG Embedding Repository (Production pgvector Implementation)
// Elite Government OS Engineering - AI Platform
// Phase 6: Native pgvector column with <=> cosine distance operator
// Requires: pgvector extension, vector(1536) column, ivfflat index (EnableNativeVectorColumn migration)

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Globalization;
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
    /// Production PostgreSQL implementation using native pgvector &lt;=&gt; cosine distance operator.
    /// Requires the pgvector extension and vector(1536) column created by the
    /// EnableNativeVectorColumn migration with an ivfflat cosine index.
    /// </summary>
    public sealed class PgVectorRAGEmbeddingRepository : IRAGEmbeddingRepository
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<PgVectorRAGEmbeddingRepository> _logger;

        public PgVectorRAGEmbeddingRepository(
            TerraFusionDbContext context,
            ILogger<PgVectorRAGEmbeddingRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Formats a float array into the pgvector literal string format: [f0,f1,...,fN]
        /// </summary>
        private static string ToVectorLiteral(float[] embedding)
        {
            return $"[{string.Join(",", embedding.Select(f => f.ToString("G9", CultureInfo.InvariantCulture)))}]";
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

        public Task<List<RAGEmbeddingSearchResult>> SearchSimilarAsync(
            int datasetId,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f) =>
            SearchSimilarCoreAsync(datasetId, queryEmbedding, topK, minScore, swallowDbFailure: true);

        public Task<List<RAGEmbeddingSearchResult>> SearchSimilarStrictAsync(
            int datasetId,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f) =>
            SearchSimilarCoreAsync(datasetId, queryEmbedding, topK, minScore, swallowDbFailure: false);

        private async Task<List<RAGEmbeddingSearchResult>> SearchSimilarCoreAsync(
            int datasetId,
            float[] queryEmbedding,
            int topK,
            float minScore,
            bool swallowDbFailure)
        {
            _logger.LogDebug(
                "pgvector search dataset {DatasetId} topK={TopK} minScore={MinScore}",
                datasetId, topK, minScore);

            var vectorLiteral = ToVectorLiteral(queryEmbedding);

            var connection = _context.Database.GetDbConnection();
            bool openedHere = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    openedHere = true;
                }

                using var cmd = connection.CreateCommand();
                cmd.CommandText = @"
                SELECT re.""Id"", re.""DocumentId"", re.""DatasetId"", re.""ChunkIndex"",
                       re.""ChunkText"", re.""Metadata"",
                       1 - (re.""Embedding"" <=> $1::vector) AS similarity_score
                FROM ""RAGEmbeddings"" re
                WHERE re.""DatasetId"" = $2
                  AND 1 - (re.""Embedding"" <=> $1::vector) >= $3
                ORDER BY re.""Embedding"" <=> $1::vector
                LIMIT $4";

                AddParam(cmd, "$1", DbType.String, vectorLiteral);
                AddParam(cmd, "$2", DbType.Int32, datasetId);
                AddParam(cmd, "$3", DbType.Double, (double)minScore);
                AddParam(cmd, "$4", DbType.Int32, topK);

                var results = new List<RAGEmbeddingSearchResult>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    results.Add(MapSearchResult(reader));
                }

                _logger.LogDebug("pgvector search returned {Count} results", results.Count);
                return results;
            }
            catch (DbException ex)
            {
                _logger.LogError(ex, "Vector similarity search failed for dataset {DatasetId}", datasetId);
                if (IsVectorCapabilityFailure(ex))
                {
                    _logger.LogWarning(
                        ex,
                        "pgvector capability unavailable for dataset {DatasetId}; ranking stored float-array embeddings instead",
                        datasetId);
                    return await SearchSimilarArrayFallbackAsync(datasetId, queryEmbedding, topK, minScore);
                }
                if (swallowDbFailure) return new List<RAGEmbeddingSearchResult>();
                throw;
            }
            finally
            {
                if (openedHere)
                    await connection.CloseAsync();
            }
        }

        public async Task<List<RAGEmbeddingSearchResult>> SearchMultipleDatasetsAsync(
            IEnumerable<int> datasetIds,
            float[] queryEmbedding,
            int topK = 5,
            float minScore = 0.7f)
        {
            topK = Math.Max(1, topK);
            var datasetIdList = datasetIds.ToList();

            _logger.LogDebug(
                "pgvector multi-dataset search {Count} datasets topK={TopK} minScore={MinScore}",
                datasetIdList.Count, topK, minScore);

            if (!datasetIdList.Any())
                return new List<RAGEmbeddingSearchResult>();

            var vectorLiteral = ToVectorLiteral(queryEmbedding);

            // Build $3, $4, ... placeholders for the IN clause
            var inPlaceholders = string.Join(", ",
                datasetIdList.Select((_, i) => $"${i + 3}"));

            var connection = _context.Database.GetDbConnection();
            bool openedHere = false;
            try
            {
                if (connection.State != ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    openedHere = true;
                }

                using var cmd = connection.CreateCommand();
                cmd.CommandText = $@"
                SELECT re.""Id"", re.""DocumentId"", re.""DatasetId"", re.""ChunkIndex"",
                       re.""ChunkText"", re.""Metadata"",
                       1 - (re.""Embedding"" <=> $1::vector) AS similarity_score
                FROM ""RAGEmbeddings"" re
                WHERE re.""DatasetId"" IN ({inPlaceholders})
                  AND 1 - (re.""Embedding"" <=> $1::vector) >= $2
                ORDER BY re.""Embedding"" <=> $1::vector
                LIMIT {topK}";

                AddParam(cmd, "$1", DbType.String, vectorLiteral);
                AddParam(cmd, "$2", DbType.Double, (double)minScore);
                for (int i = 0; i < datasetIdList.Count; i++)
                {
                    AddParam(cmd, $"${i + 3}", DbType.Int32, datasetIdList[i]);
                }

                var results = new List<RAGEmbeddingSearchResult>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    results.Add(MapSearchResult(reader));
                }

                _logger.LogDebug("pgvector multi-dataset search returned {Count} results", results.Count);
                return results;
            }
            catch (DbException ex)
            {
                _logger.LogError(ex, "Vector multi-dataset similarity search failed across {Count} datasets", datasetIdList.Count);
                if (IsVectorCapabilityFailure(ex))
                {
                    _logger.LogWarning(
                        ex,
                        "pgvector capability unavailable across {Count} datasets; ranking stored float-array embeddings instead",
                        datasetIdList.Count);
                    return await SearchMultipleDatasetsArrayFallbackAsync(datasetIdList, queryEmbedding, topK, minScore);
                }
                return new List<RAGEmbeddingSearchResult>();
            }
            finally
            {
                if (openedHere)
                    await connection.CloseAsync();
            }
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

        // ---------------------------------------------------------------
        // Helpers
        // ---------------------------------------------------------------

        private async Task<List<RAGEmbeddingSearchResult>> SearchSimilarArrayFallbackAsync(
            int datasetId,
            float[] queryEmbedding,
            int topK,
            float minScore)
        {
            topK = Math.Max(1, topK);

            return RankArrayEmbeddings(await LoadArrayEmbeddingsAsync(new[] { datasetId }), queryEmbedding, topK, minScore);
        }

        private async Task<List<RAGEmbeddingSearchResult>> SearchMultipleDatasetsArrayFallbackAsync(
            IReadOnlyCollection<int> datasetIds,
            float[] queryEmbedding,
            int topK,
            float minScore)
        {
            topK = Math.Max(1, topK);

            if (datasetIds.Count == 0)
            {
                return new List<RAGEmbeddingSearchResult>();
            }

            return RankArrayEmbeddings(await LoadArrayEmbeddingsAsync(datasetIds), queryEmbedding, topK, minScore);
        }

        private async Task<List<ArrayEmbeddingRow>> LoadArrayEmbeddingsAsync(IReadOnlyCollection<int> datasetIds)
        {
            if (datasetIds.Count == 0)
            {
                return new List<ArrayEmbeddingRow>();
            }

            var connection = _context.Database.GetDbConnection();
            var openedHere = false;
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
                openedHere = true;
            }

            try
            {
                using var cmd = connection.CreateCommand();
                var datasetIdLiterals = string.Join(", ", datasetIds.Select(value => value.ToString(CultureInfo.InvariantCulture)));
                cmd.CommandText = $@"
                SELECT re.""Id"", re.""DocumentId"", re.""DatasetId"", re.""ChunkIndex"",
                       re.""ChunkText"", re.""Metadata"", re.""Embedding""
                FROM ""RAGEmbeddings"" re
                WHERE re.""DatasetId"" IN ({datasetIdLiterals})";

                var rows = new List<ArrayEmbeddingRow>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    if (reader.IsDBNull(6))
                    {
                        continue;
                    }

                    rows.Add(new ArrayEmbeddingRow(
                        Id: reader.GetInt32(0),
                        DocumentId: reader.GetInt32(1),
                        DatasetId: reader.GetInt32(2),
                        ChunkIndex: reader.GetInt32(3),
                        ChunkText: reader.GetString(4),
                        Metadata: reader.IsDBNull(5) ? null : reader.GetString(5),
                        Embedding: reader.GetFieldValue<float[]>(6)));
                }

                return rows;
            }
            finally
            {
                if (openedHere)
                {
                    await connection.CloseAsync();
                }
            }
        }

        private static List<RAGEmbeddingSearchResult> RankArrayEmbeddings(
            IEnumerable<ArrayEmbeddingRow> embeddings,
            float[] queryEmbedding,
            int topK,
            float minScore)
        {
            if (queryEmbedding.Length == 0)
            {
                return new List<RAGEmbeddingSearchResult>();
            }

            return embeddings
                .Where(e => e.Embedding.Length == queryEmbedding.Length)
                .Select(e => new
                {
                    Embedding = e,
                    Score = CalculateCosineSimilarity(queryEmbedding, e.Embedding)
                })
                .Where(result => result.Score >= minScore)
                .OrderByDescending(result => result.Score)
                .Take(topK)
                .Select(result => new RAGEmbeddingSearchResult
                {
                    EmbeddingId = result.Embedding.Id,
                    DocumentId = result.Embedding.DocumentId,
                    DatasetId = result.Embedding.DatasetId,
                    ChunkIndex = result.Embedding.ChunkIndex,
                    ChunkText = result.Embedding.ChunkText,
                    Metadata = result.Embedding.Metadata,
                    SimilarityScore = result.Score
                })
                .ToList();
        }

        private static bool IsVectorCapabilityFailure(DbException ex)
        {
            var message = ex.Message;
            return message.Contains("vector", StringComparison.OrdinalIgnoreCase)
                || message.Contains("<=>", StringComparison.OrdinalIgnoreCase)
                || message.Contains("operator does not exist", StringComparison.OrdinalIgnoreCase);
        }

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

            return magnitudeA == 0f || magnitudeB == 0f
                ? 0f
                : dotProduct / (magnitudeA * magnitudeB);
        }

        private static void AddParam(DbCommand cmd, string name, DbType dbType, object value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.DbType = dbType;
            p.Value = value;
            cmd.Parameters.Add(p);
        }


        private sealed record ArrayEmbeddingRow(
            int Id,
            int DocumentId,
            int DatasetId,
            int ChunkIndex,
            string ChunkText,
            string? Metadata,
            float[] Embedding);

        private static RAGEmbeddingSearchResult MapSearchResult(DbDataReader reader)
        {
            return new RAGEmbeddingSearchResult
            {
                EmbeddingId = reader.GetInt32(0),
                DocumentId = reader.GetInt32(1),
                DatasetId = reader.GetInt32(2),
                ChunkIndex = reader.GetInt32(3),
                ChunkText = reader.GetString(4),
                Metadata = reader.IsDBNull(5) ? null : reader.GetString(5),
                SimilarityScore = (float)reader.GetDouble(6)
            };
        }
    }
}
