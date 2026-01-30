// TerraFusionGPT Suite: OpenAI Embedding Service
// Elite Government OS Engineering - AI Platform
// Phase 5: Production OpenAI API integration

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Interfaces;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// OpenAI embedding service for production use.
    /// Requires OPENAI_API_KEY environment variable or configuration.
    /// </summary>
    public class OpenAIEmbeddingService : IEmbeddingService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OpenAIEmbeddingService> _logger;
        private readonly string? _apiKey;
        private readonly string _baseUrl;
        private const int DefaultDimension = 1536;
        private const int MaxBatchSize = 2048; // OpenAI limit

        public string ProviderName => "OpenAI";

        public OpenAIEmbeddingService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<OpenAIEmbeddingService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            // Get API key from environment or configuration
            _apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")
                ?? configuration["OpenAI:ApiKey"]
                ?? configuration["AI:OpenAI:ApiKey"];

            _baseUrl = Environment.GetEnvironmentVariable("OPENAI_BASE_URL")
                ?? configuration["OpenAI:BaseUrl"]
                ?? "https://api.openai.com/v1";

            if (!string.IsNullOrEmpty(_apiKey))
            {
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", _apiKey);
            }
        }

        public async Task<float[]> GenerateEmbeddingAsync(string text, string model = "text-embedding-3-small")
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("OpenAI API key not configured, returning simulated embedding");
                return GenerateSimulatedEmbedding(text, GetVectorDimension(model));
            }

            try
            {
                var request = new
                {
                    input = text,
                    model = model,
                    encoding_format = "float"
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/embeddings", content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("OpenAI API error: {Status} - {Error}",
                        response.StatusCode, error);
                    throw new HttpRequestException($"OpenAI API error: {response.StatusCode}");
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OpenAIEmbeddingResponse>(responseJson);

                if (result?.Data == null || result.Data.Count == 0)
                {
                    throw new InvalidOperationException("No embedding data returned from OpenAI");
                }

                _logger.LogDebug("Generated embedding with {Dimensions} dimensions, tokens used: {Tokens}",
                    result.Data[0].Embedding.Length, result.Usage?.TotalTokens ?? 0);

                return result.Data[0].Embedding;
            }
            catch (Exception ex) when (ex is not HttpRequestException)
            {
                _logger.LogError(ex, "Error generating embedding from OpenAI");
                throw;
            }
        }

        public async Task<List<float[]>> GenerateBatchEmbeddingsAsync(
            IEnumerable<string> texts,
            string model = "text-embedding-3-small")
        {
            var textList = texts.ToList();

            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("OpenAI API key not configured, returning simulated embeddings");
                var dim = GetVectorDimension(model);
                return textList.Select(t => GenerateSimulatedEmbedding(t, dim)).ToList();
            }

            // Process in batches if needed
            var allEmbeddings = new List<float[]>();

            for (int i = 0; i < textList.Count; i += MaxBatchSize)
            {
                var batch = textList.Skip(i).Take(MaxBatchSize).ToList();
                var batchEmbeddings = await GenerateBatchInternalAsync(batch, model);
                allEmbeddings.AddRange(batchEmbeddings);
            }

            return allEmbeddings;
        }

        private async Task<List<float[]>> GenerateBatchInternalAsync(List<string> texts, string model)
        {
            try
            {
                var request = new
                {
                    input = texts,
                    model = model,
                    encoding_format = "float"
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/embeddings", content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("OpenAI batch API error: {Status} - {Error}",
                        response.StatusCode, error);
                    throw new HttpRequestException($"OpenAI API error: {response.StatusCode}");
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OpenAIEmbeddingResponse>(responseJson);

                if (result?.Data == null)
                {
                    throw new InvalidOperationException("No embedding data returned from OpenAI");
                }

                _logger.LogDebug("Generated {Count} embeddings in batch, tokens used: {Tokens}",
                    result.Data.Count, result.Usage?.TotalTokens ?? 0);

                // Sort by index to maintain order
                return result.Data
                    .OrderBy(d => d.Index)
                    .Select(d => d.Embedding)
                    .ToList();
            }
            catch (Exception ex) when (ex is not HttpRequestException)
            {
                _logger.LogError(ex, "Error generating batch embeddings from OpenAI");
                throw;
            }
        }

        public int GetVectorDimension(string model)
        {
            return model switch
            {
                "text-embedding-3-small" => 1536,
                "text-embedding-3-large" => 3072,
                "text-embedding-ada-002" => 1536,
                _ => DefaultDimension
            };
        }

        public async Task<bool> IsAvailableAsync()
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                return false;
            }

            try
            {
                // Quick test with minimal token usage
                var embedding = await GenerateEmbeddingAsync("test", "text-embedding-3-small");
                return embedding.Length > 0;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Fallback simulated embedding when API key not configured
        /// </summary>
        private static float[] GenerateSimulatedEmbedding(string text, int dimension)
        {
            var embedding = new float[dimension];
            var hash = text.GetHashCode();
            var random = new Random(hash);

            for (int i = 0; i < dimension; i++)
            {
                embedding[i] = (float)(random.NextDouble() * 2 - 1);
            }

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

        #region Response DTOs

        private class OpenAIEmbeddingResponse
        {
            public string? Object { get; set; }
            public List<EmbeddingData>? Data { get; set; }
            public string? Model { get; set; }
            public UsageInfo? Usage { get; set; }
        }

        private class EmbeddingData
        {
            public string? Object { get; set; }
            public int Index { get; set; }
            public float[] Embedding { get; set; } = Array.Empty<float>();
        }

        private class UsageInfo
        {
            public int PromptTokens { get; set; }
            public int TotalTokens { get; set; }
        }

        #endregion
    }
}
