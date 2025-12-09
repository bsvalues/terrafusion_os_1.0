// TerraFusionGPT Suite: Simulated Embedding Service
// Elite Government OS Engineering - AI Platform
// Phase 5: Development/testing implementation

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Interfaces;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Simulated embedding service for development and testing.
    /// Generates deterministic pseudo-random embeddings based on text hash.
    /// For production, use OpenAIEmbeddingService or AzureEmbeddingService.
    /// </summary>
    public class SimulatedEmbeddingService : IEmbeddingService
    {
        private readonly ILogger<SimulatedEmbeddingService> _logger;
        private const int DefaultDimension = 1536;

        public string ProviderName => "Simulated";

        public SimulatedEmbeddingService(ILogger<SimulatedEmbeddingService> logger)
        {
            _logger = logger;
        }

        public async Task<float[]> GenerateEmbeddingAsync(string text, string model = "text-embedding-3-small")
        {
            _logger.LogDebug("Generating simulated embedding for text of length {Length} using model {Model}",
                text.Length, model);

            // Simulate API latency
            await Task.Delay(5);

            var dimension = GetVectorDimension(model);
            return GenerateDeterministicEmbedding(text, dimension);
        }

        public async Task<List<float[]>> GenerateBatchEmbeddingsAsync(
            IEnumerable<string> texts,
            string model = "text-embedding-3-small")
        {
            var textList = texts.ToList();
            _logger.LogDebug("Generating {Count} simulated embeddings using model {Model}",
                textList.Count, model);

            // Simulate batch API latency
            await Task.Delay(10 + textList.Count);

            var dimension = GetVectorDimension(model);
            return textList.Select(t => GenerateDeterministicEmbedding(t, dimension)).ToList();
        }

        public int GetVectorDimension(string model)
        {
            return model switch
            {
                "text-embedding-3-small" => 1536,
                "text-embedding-3-large" => 3072,
                "text-embedding-ada-002" => 1536,
                "all-MiniLM-L6-v2" => 384,
                "all-mpnet-base-v2" => 768,
                _ => DefaultDimension
            };
        }

        public Task<bool> IsAvailableAsync()
        {
            // Simulated service is always available
            return Task.FromResult(true);
        }

        /// <summary>
        /// Generate a deterministic embedding based on text hash.
        /// Same text always produces same embedding (important for testing).
        /// </summary>
        private static float[] GenerateDeterministicEmbedding(string text, int dimension)
        {
            var embedding = new float[dimension];

            // Use text hash as seed for reproducible results
            var hash = GetStableHash(text);
            var random = new Random(hash);

            for (int i = 0; i < dimension; i++)
            {
                embedding[i] = (float)(random.NextDouble() * 2 - 1);
            }

            // Normalize to unit vector
            var magnitude = (float)Math.Sqrt(embedding.Sum(x => x * x));
            if (magnitude > 0)
            {
                for (int i = 0; i < dimension; i++)
                {
                    embedding[i] /= magnitude;
                }
            }

            return embedding;
        }

        /// <summary>
        /// Get a stable hash that doesn't change between runs
        /// (string.GetHashCode() can vary between processes)
        /// </summary>
        private static int GetStableHash(string text)
        {
            unchecked
            {
                int hash = 17;
                foreach (char c in text)
                {
                    hash = hash * 31 + c;
                }
                return hash;
            }
        }
    }
}
