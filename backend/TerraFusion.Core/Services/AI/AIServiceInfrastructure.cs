using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// Core AI service infrastructure providing foundation for all AI/ML capabilities
/// </summary>
public interface IAIServiceInfrastructure
{
    Task<AIResponse<T>> ProcessRequestAsync<T>(AIRequest request);
    Task<bool> ValidateModelAsync(string modelId, string version);
    Task<ModelMetrics> GetModelMetricsAsync(string modelId);
    Task<List<AIModel>> GetAvailableModelsAsync();
    Task<AIResponse<string>> GenerateTextAsync(string prompt, AITextGenerationOptions options);
    Task<AIResponse<double[]>> GenerateEmbeddingsAsync(string text, string modelId = "text-embedding-ada-002");
    Task<AIResponse<object>> AnalyzeDataAsync(object data, string analysisType);
    Task<bool> IsServiceHealthyAsync();
}

public class AIServiceInfrastructure : IAIServiceInfrastructure
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIServiceInfrastructure> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, AIModel> _availableModels;
    private readonly Dictionary<string, DateTime> _modelLastUsed;

    public AIServiceInfrastructure(
        IConfiguration configuration,
        ILogger<AIServiceInfrastructure> logger,
        IStructuredLogger structuredLogger,
        HttpClient httpClient)
    {
        _configuration = configuration;
        _logger = logger;
        _structuredLogger = structuredLogger;
        _httpClient = httpClient;
        _availableModels = new Dictionary<string, AIModel>();
        _modelLastUsed = new Dictionary<string, DateTime>();

        InitializeAvailableModels();
        ConfigureHttpClient();
    }

    public async Task<AIResponse<T>> ProcessRequestAsync<T>(AIRequest request)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString();

        try
        {
            _structuredLogger.LogAIEvent("AIRequestStarted",
                $"Processing AI request of type {typeof(T).Name}",
                context: new { 
                    RequestId = requestId,
                    RequestType = request.Type,
                    ModelId = request.ModelId,
                    InputSize = request.Input?.ToString()?.Length ?? 0
                });

            // Validate model availability
            if (!await ValidateModelAsync(request.ModelId, request.ModelVersion))
            {
                return new AIResponse<T>
                {
                    Success = false,
                    Error = $"Model {request.ModelId} version {request.ModelVersion} is not available",
                    RequestId = requestId,
                    ProcessingTime = stopwatch.Elapsed
                };
            }

            // Process the request based on type
            var result = await ProcessByType<T>(request, requestId);
            
            // Update model usage tracking
            _modelLastUsed[request.ModelId] = DateTime.UtcNow;

            stopwatch.Stop();

            _structuredLogger.LogAIEvent("AIRequestCompleted",
                $"AI request completed successfully",
                context: new { 
                    RequestId = requestId,
                    Success = result.Success,
                    ProcessingTime = stopwatch.ElapsedMilliseconds,
                    ModelId = request.ModelId
                });

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "AI request processing failed for request {RequestId}", requestId);
            
            return new AIResponse<T>
            {
                Success = false,
                Error = ex.Message,
                RequestId = requestId,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<bool> ValidateModelAsync(string modelId, string version)
    {
        try
        {
            if (!_availableModels.TryGetValue(modelId, out var model))
            {
                _logger.LogWarning("Model {ModelId} not found in available models", modelId);
                return false;
            }

            if (!string.IsNullOrEmpty(version) && model.Version != version)
            {
                _logger.LogWarning("Model {ModelId} version mismatch. Expected: {ExpectedVersion}, Available: {AvailableVersion}", 
                    modelId, version, model.Version);
                return false;
            }

            // Check if model is healthy
            if (!model.IsHealthy)
            {
                _logger.LogWarning("Model {ModelId} is not healthy", modelId);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Model validation failed for {ModelId}", modelId);
            return false;
        }
    }

    public async Task<ModelMetrics> GetModelMetricsAsync(string modelId)
    {
        try
        {
            if (!_availableModels.TryGetValue(modelId, out var model))
            {
                throw new ArgumentException($"Model {modelId} not found");
            }

            // In a real implementation, this would query monitoring systems
            var metrics = new ModelMetrics
            {
                ModelId = modelId,
                Version = model.Version,
                RequestCount = await GetModelRequestCountAsync(modelId),
                AverageResponseTime = await GetAverageResponseTimeAsync(modelId),
                ErrorRate = await GetModelErrorRateAsync(modelId),
                LastUsed = _modelLastUsed.GetValueOrDefault(modelId),
                Accuracy = model.Accuracy,
                Throughput = await GetModelThroughputAsync(modelId),
                ResourceUtilization = await GetResourceUtilizationAsync(modelId)
            };

            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get metrics for model {ModelId}", modelId);
            throw;
        }
    }

    public async Task<List<AIModel>> GetAvailableModelsAsync()
    {
        try
        {
            // Update model health status
            foreach (var model in _availableModels.Values)
            {
                model.IsHealthy = await CheckModelHealthAsync(model.Id);
            }

            return _availableModels.Values.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available models");
            return new List<AIModel>();
        }
    }

    public async Task<AIResponse<string>> GenerateTextAsync(string prompt, AITextGenerationOptions options)
    {
        var request = new AIRequest
        {
            Type = AIRequestType.TextGeneration,
            ModelId = options.ModelId ?? "gpt-4",
            Input = prompt,
            Parameters = new Dictionary<string, object>
            {
                ["temperature"] = options.Temperature,
                ["max_tokens"] = options.MaxTokens,
                ["top_p"] = options.TopP,
                ["frequency_penalty"] = options.FrequencyPenalty,
                ["presence_penalty"] = options.PresencePenalty
            }
        };

        return await ProcessRequestAsync<string>(request);
    }

    public async Task<AIResponse<double[]>> GenerateEmbeddingsAsync(string text, string modelId = "text-embedding-ada-002")
    {
        var request = new AIRequest
        {
            Type = AIRequestType.Embedding,
            ModelId = modelId,
            Input = text
        };

        return await ProcessRequestAsync<double[]>(request);
    }

    public async Task<AIResponse<object>> AnalyzeDataAsync(object data, string analysisType)
    {
        var request = new AIRequest
        {
            Type = AIRequestType.DataAnalysis,
            ModelId = GetAnalysisModelId(analysisType),
            Input = data,
            Parameters = new Dictionary<string, object>
            {
                ["analysis_type"] = analysisType
            }
        };

        return await ProcessRequestAsync<object>(request);
    }

    public async Task<bool> IsServiceHealthyAsync()
    {
        try
        {
            var healthyModels = 0;
            var totalModels = _availableModels.Count;

            foreach (var model in _availableModels.Values)
            {
                if (await CheckModelHealthAsync(model.Id))
                {
                    healthyModels++;
                }
            }

            var healthPercentage = totalModels > 0 ? (double)healthyModels / totalModels : 0;
            return healthPercentage >= 0.8; // 80% of models must be healthy
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI service health check failed");
            return false;
        }
    }

    private async Task<AIResponse<T>> ProcessByType<T>(AIRequest request, string requestId)
    {
        return request.Type switch
        {
            AIRequestType.TextGeneration => await ProcessTextGeneration<T>(request, requestId),
            AIRequestType.Embedding => await ProcessEmbedding<T>(request, requestId),
            AIRequestType.Classification => await ProcessClassification<T>(request, requestId),
            AIRequestType.Regression => await ProcessRegression<T>(request, requestId),
            AIRequestType.Clustering => await ProcessClustering<T>(request, requestId),
            AIRequestType.AnomalyDetection => await ProcessAnomalyDetection<T>(request, requestId),
            AIRequestType.DataAnalysis => await ProcessDataAnalysis<T>(request, requestId),
            _ => throw new NotSupportedException($"AI request type {request.Type} is not supported")
        };
    }

    private async Task<AIResponse<T>> ProcessTextGeneration<T>(AIRequest request, string requestId)
    {
        try
        {
            // Call Azure OpenAI API
            var apiKey = _configuration["AzureOpenAI:ApiKey"];
            var endpoint = _configuration["AzureOpenAI:Endpoint"];
            
            var requestBody = new
            {
                messages = new[]
                {
                    new { role = "user", content = request.Input.ToString() }
                },
                temperature = request.Parameters.GetValueOrDefault("temperature", 0.7),
                max_tokens = request.Parameters.GetValueOrDefault("max_tokens", 150),
                top_p = request.Parameters.GetValueOrDefault("top_p", 1.0),
                frequency_penalty = request.Parameters.GetValueOrDefault("frequency_penalty", 0.0),
                presence_penalty = request.Parameters.GetValueOrDefault("presence_penalty", 0.0)
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

            var response = await _httpClient.PostAsync($"{endpoint}/openai/deployments/{request.ModelId}/chat/completions?api-version=2023-12-01-preview", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                var generatedText = result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

                return new AIResponse<T>
                {
                    Success = true,
                    Data = (T)(object)generatedText,
                    RequestId = requestId,
                    ModelId = request.ModelId,
                    TokensUsed = result.GetProperty("usage").GetProperty("total_tokens").GetInt32()
                };
            }

            return new AIResponse<T>
            {
                Success = false,
                Error = $"API call failed: {response.StatusCode} - {responseContent}",
                RequestId = requestId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Text generation failed for request {RequestId}", requestId);
            throw;
        }
    }

    private async Task<AIResponse<T>> ProcessEmbedding<T>(AIRequest request, string requestId)
    {
        try
        {
            // Simulate embedding generation (in real implementation, call Azure OpenAI embeddings API)
            await Task.Delay(100); // Simulate API call

            var embedding = GenerateSimulatedEmbedding(request.Input.ToString());
            
            return new AIResponse<T>
            {
                Success = true,
                Data = (T)(object)embedding,
                RequestId = requestId,
                ModelId = request.ModelId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Embedding generation failed for request {RequestId}", requestId);
            throw;
        }
    }

    private async Task<AIResponse<T>> ProcessClassification<T>(AIRequest request, string requestId)
    {
        // Placeholder for classification logic
        await Task.Delay(50);
        
        return new AIResponse<T>
        {
            Success = true,
            Data = default(T),
            RequestId = requestId,
            ModelId = request.ModelId
        };
    }

    private async Task<AIResponse<T>> ProcessRegression<T>(AIRequest request, string requestId)
    {
        // Placeholder for regression logic
        await Task.Delay(50);
        
        return new AIResponse<T>
        {
            Success = true,
            Data = default(T),
            RequestId = requestId,
            ModelId = request.ModelId
        };
    }

    private async Task<AIResponse<T>> ProcessClustering<T>(AIRequest request, string requestId)
    {
        // Placeholder for clustering logic
        await Task.Delay(50);
        
        return new AIResponse<T>
        {
            Success = true,
            Data = default(T),
            RequestId = requestId,
            ModelId = request.ModelId
        };
    }

    private async Task<AIResponse<T>> ProcessAnomalyDetection<T>(AIRequest request, string requestId)
    {
        // Placeholder for anomaly detection logic
        await Task.Delay(50);
        
        return new AIResponse<T>
        {
            Success = true,
            Data = default(T),
            RequestId = requestId,
            ModelId = request.ModelId
        };
    }

    private async Task<AIResponse<T>> ProcessDataAnalysis<T>(AIRequest request, string requestId)
    {
        // Placeholder for data analysis logic
        await Task.Delay(50);
        
        return new AIResponse<T>
        {
            Success = true,
            Data = default(T),
            RequestId = requestId,
            ModelId = request.ModelId
        };
    }

    private void InitializeAvailableModels()
    {
        _availableModels["gpt-4"] = new AIModel
        {
            Id = "gpt-4",
            Name = "GPT-4",
            Type = AIModelType.TextGeneration,
            Version = "1.0",
            Provider = "Azure OpenAI",
            Description = "Advanced language model for text generation and analysis",
            Accuracy = 0.95,
            IsHealthy = true,
            SupportedTasks = new List<string> { "text_generation", "analysis", "summarization", "question_answering" }
        };

        _availableModels["text-embedding-ada-002"] = new AIModel
        {
            Id = "text-embedding-ada-002",
            Name = "Text Embedding Ada 002",
            Type = AIModelType.Embedding,
            Version = "2.0",
            Provider = "Azure OpenAI",
            Description = "High-quality text embeddings for semantic search and similarity",
            Accuracy = 0.92,
            IsHealthy = true,
            SupportedTasks = new List<string> { "embedding", "similarity", "semantic_search" }
        };

        _availableModels["property-valuation-model"] = new AIModel
        {
            Id = "property-valuation-model",
            Name = "Property Valuation Model",
            Type = AIModelType.Regression,
            Version = "1.0",
            Provider = "TerraFusion ML",
            Description = "Custom ML model for property value prediction",
            Accuracy = 0.89,
            IsHealthy = true,
            SupportedTasks = new List<string> { "property_valuation", "market_analysis", "price_prediction" }
        };

        _availableModels["fraud-detection-model"] = new AIModel
        {
            Id = "fraud-detection-model",
            Name = "Fraud Detection Model",
            Type = AIModelType.Classification,
            Version = "1.0",
            Provider = "TerraFusion ML",
            Description = "AI model for detecting fraudulent property transactions",
            Accuracy = 0.94,
            IsHealthy = true,
            SupportedTasks = new List<string> { "fraud_detection", "anomaly_detection", "risk_assessment" }
        };
    }

    private void ConfigureHttpClient()
    {
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-AI-Service/1.0");
    }

    private string GetAnalysisModelId(string analysisType)
    {
        return analysisType.ToLower() switch
        {
            "property_valuation" => "property-valuation-model",
            "fraud_detection" => "fraud-detection-model",
            "market_analysis" => "gpt-4",
            _ => "gpt-4"
        };
    }

    private async Task<bool> CheckModelHealthAsync(string modelId)
    {
        try
        {
            // Simulate health check (in real implementation, ping the model endpoint)
            await Task.Delay(10);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<long> GetModelRequestCountAsync(string modelId)
    {
        // Simulate request count retrieval
        await Task.Delay(10);
        return new Random().Next(100, 10000);
    }

    private async Task<TimeSpan> GetAverageResponseTimeAsync(string modelId)
    {
        // Simulate response time retrieval
        await Task.Delay(10);
        return TimeSpan.FromMilliseconds(new Random().Next(50, 500));
    }

    private async Task<double> GetModelErrorRateAsync(string modelId)
    {
        // Simulate error rate retrieval
        await Task.Delay(10);
        return new Random().NextDouble() * 0.05; // 0-5% error rate
    }

    private async Task<double> GetModelThroughputAsync(string modelId)
    {
        // Simulate throughput retrieval
        await Task.Delay(10);
        return new Random().Next(10, 100);
    }

    private async Task<double> GetResourceUtilizationAsync(string modelId)
    {
        // Simulate resource utilization retrieval
        await Task.Delay(10);
        return new Random().NextDouble() * 0.8; // 0-80% utilization
    }

    private double[] GenerateSimulatedEmbedding(string text)
    {
        // Generate a simulated embedding vector (in real implementation, call embedding API)
        var random = new Random(text.GetHashCode());
        var embedding = new double[1536]; // Ada-002 embedding size
        
        for (int i = 0; i < embedding.Length; i++)
        {
            embedding[i] = random.NextGaussian(0, 1);
        }
        
        return embedding;
    }
}

// Extension method for Gaussian random numbers
public static class RandomExtensions
{
    public static double NextGaussian(this Random random, double mean = 0, double stddev = 1)
    {
        var u1 = 1.0 - random.NextDouble();
        var u2 = 1.0 - random.NextDouble();
        var randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
        return mean + stddev * randStdNormal;
    }
}

// Data models for AI services
public class AIRequest
{
    public AIRequestType Type { get; set; }
    public string ModelId { get; set; } = string.Empty;
    public string ModelVersion { get; set; } = string.Empty;
    public object? Input { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class AIResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string ModelId { get; set; } = string.Empty;
    public TimeSpan ProcessingTime { get; set; }
    public int TokensUsed { get; set; }
    public double Confidence { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class AIModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AIModelType Type { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Accuracy { get; set; }
    public bool IsHealthy { get; set; }
    public List<string> SupportedTasks { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUpdated { get; set; }
}

public class ModelMetrics
{
    public string ModelId { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public long RequestCount { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public double ErrorRate { get; set; }
    public DateTime? LastUsed { get; set; }
    public double Accuracy { get; set; }
    public double Throughput { get; set; }
    public double ResourceUtilization { get; set; }
}

public class AITextGenerationOptions
{
    public string? ModelId { get; set; }
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 150;
    public double TopP { get; set; } = 1.0;
    public double FrequencyPenalty { get; set; } = 0.0;
    public double PresencePenalty { get; set; } = 0.0;
}

public enum AIRequestType
{
    TextGeneration,
    Embedding,
    Classification,
    Regression,
    Clustering,
    AnomalyDetection,
    DataAnalysis
}

public enum AIModelType
{
    TextGeneration,
    Embedding,
    Classification,
    Regression,
    Clustering,
    AnomalyDetection,
    ComputerVision,
    NaturalLanguageProcessing
}
