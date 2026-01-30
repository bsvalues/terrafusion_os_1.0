// TerraFusionGPT Suite: Embedding Service Interface
// Elite Government OS Engineering - AI Platform
// Phase 5: Abstraction for embedding generation

using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.AI.Interfaces
{
    /// <summary>
    /// Service interface for generating text embeddings
    /// Supports multiple providers: OpenAI, Azure, local models
    /// </summary>
    public interface IEmbeddingService
    {
        /// <summary>
        /// Generate embedding for a single text
        /// </summary>
        /// <param name="text">Text to embed</param>
        /// <param name="model">Embedding model name (e.g., text-embedding-3-small)</param>
        /// <returns>Float array representing the embedding vector</returns>
        Task<float[]> GenerateEmbeddingAsync(string text, string model = "text-embedding-3-small");

        /// <summary>
        /// Generate embeddings for multiple texts in batch (more efficient)
        /// </summary>
        /// <param name="texts">List of texts to embed</param>
        /// <param name="model">Embedding model name</param>
        /// <returns>List of embedding vectors in same order as input</returns>
        Task<List<float[]>> GenerateBatchEmbeddingsAsync(
            IEnumerable<string> texts,
            string model = "text-embedding-3-small");

        /// <summary>
        /// Get the vector dimension for a given model
        /// </summary>
        int GetVectorDimension(string model);

        /// <summary>
        /// Check if the embedding service is available
        /// </summary>
        Task<bool> IsAvailableAsync();

        /// <summary>
        /// Get the provider name (OpenAI, Azure, Local, Simulated)
        /// </summary>
        string ProviderName { get; }
    }
}
