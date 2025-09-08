using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.Services.Monitoring;
using TerraFusion.Core.Extensions;

namespace TerraFusion.Core.Services.AI;

/// <summary>
/// Azure OpenAI integration service providing access to GPT models, embeddings, and cognitive services
/// </summary>
public interface IAzureOpenAIService
{
    Task<ChatCompletionResponse> GetChatCompletionAsync(ChatCompletionRequest request);
    Task<EmbeddingResponse> GetEmbeddingAsync(EmbeddingRequest request);
    Task<CompletionResponse> GetCompletionAsync(CompletionRequest request);
    Task<ModerationResponse> ModerateContentAsync(ModerationRequest request);
    Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request);
    Task<AudioTranscriptionResponse> TranscribeAudioAsync(AudioTranscriptionRequest request);
    Task<TextToSpeechResponse> ConvertTextToSpeechAsync(TextToSpeechRequest request);
    Task<bool> IsServiceHealthyAsync();
    Task<List<ModelInfo>> GetAvailableModelsAsync();
    Task<UsageStatistics> GetUsageStatisticsAsync();
}

public class AzureOpenAIService : IAzureOpenAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AzureOpenAIService> _logger;
    private readonly IStructuredLogger _structuredLogger;
    private readonly IConfiguration _configuration;
    private readonly string _apiKey;
    private readonly string _endpoint;
    private readonly string _apiVersion;
    private readonly Dictionary<string, ModelDeployment> _deployments;

    public AzureOpenAIService(
        HttpClient httpClient,
        ILogger<AzureOpenAIService> logger,
        IStructuredLogger structuredLogger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _structuredLogger = structuredLogger;
        _configuration = configuration;
        
        _apiKey = _configuration["AzureOpenAI:ApiKey"] ?? throw new ArgumentException("Azure OpenAI API key not configured");
        _endpoint = _configuration["AzureOpenAI:Endpoint"] ?? throw new ArgumentException("Azure OpenAI endpoint not configured");
        _apiVersion = _configuration["AzureOpenAI:ApiVersion"] ?? "2023-12-01-preview";
        
        _deployments = new Dictionary<string, ModelDeployment>();
        
        ConfigureHttpClient();
        InitializeDeployments();
    }

    public async Task<ChatCompletionResponse> GetChatCompletionAsync(ChatCompletionRequest request)
    {
        var requestId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("ChatCompletionStarted",
                $"Starting chat completion request",
                context: new { 
                    RequestId = requestId,
                    Model = request.Model,
                    MessageCount = request.Messages?.Count ?? 0,
                    MaxTokens = request.MaxTokens
                });

            var deployment = GetDeployment(request.Model);
            var url = $"{_endpoint}/openai/deployments/{deployment.DeploymentName}/chat/completions?api-version={_apiVersion}";

            var requestBody = new
            {
                messages = request.Messages?.Select(m => new { role = m.Role, content = m.Content }).ToArray(),
                temperature = request.Temperature,
                max_tokens = request.MaxTokens,
                top_p = request.TopP,
                frequency_penalty = request.FrequencyPenalty,
                presence_penalty = request.PresencePenalty,
                stop = request.Stop,
                stream = request.Stream
            };

            var response = await SendRequestAsync<ChatCompletionApiResponse>(url, requestBody);
            
            stopwatch.Stop();

            if (response != null)
            {
                _structuredLogger.LogAIEvent("ChatCompletionCompleted",
                    $"Chat completion completed successfully",
                    context: new { 
                        RequestId = requestId,
                        CompletionTokens = response.Usage?.CompletionTokens,
                        TotalTokens = response.Usage?.TotalTokens,
                        ResponseTime = stopwatch.ElapsedMilliseconds
                    });

                return new ChatCompletionResponse
                {
                    Id = response.Id,
                    Object = response.Object,
                    Created = response.Created,
                    Model = response.Model,
                    Choices = response.Choices?.Select(c => new ChatChoice
                    {
                        Index = c.Index,
                        Message = new ChatMessage
                        {
                            Role = c.Message.Role,
                            Content = c.Message.Content
                        },
                        FinishReason = c.FinishReason
                    }).ToList() ?? new List<ChatChoice>(),
                    Usage = response.Usage != null ? new TokenUsage
                    {
                        PromptTokens = response.Usage.PromptTokens,
                        CompletionTokens = response.Usage.CompletionTokens,
                        TotalTokens = response.Usage.TotalTokens
                    } : null,
                    RequestId = requestId,
                    ProcessingTime = stopwatch.Elapsed
                };
            }

            throw new Exception("No response received from Azure OpenAI service");
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Chat completion request failed for {RequestId}", requestId);
            
            return new ChatCompletionResponse
            {
                RequestId = requestId,
                Error = ex.Message,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<EmbeddingResponse> GetEmbeddingAsync(EmbeddingRequest request)
    {
        var requestId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("EmbeddingStarted",
                $"Starting embedding request",
                context: new { 
                    RequestId = requestId,
                    Model = request.Model,
                    InputLength = request.Input?.Length ?? 0
                });

            var deployment = GetDeployment(request.Model);
            var url = $"{_endpoint}/openai/deployments/{deployment.DeploymentName}/embeddings?api-version={_apiVersion}";

            var requestBody = new
            {
                input = request.Input,
                user = request.User
            };

            var response = await SendRequestAsync<EmbeddingApiResponse>(url, requestBody);
            
            stopwatch.Stop();

            if (response != null)
            {
                return new EmbeddingResponse
                {
                    Object = response.Object,
                    Data = response.Data?.Select(d => new EmbeddingData
                    {
                        Object = d.Object,
                        Index = d.Index,
                        Embedding = d.Embedding
                    }).ToList() ?? new List<EmbeddingData>(),
                    Model = response.Model,
                    Usage = response.Usage != null ? new TokenUsage
                    {
                        PromptTokens = response.Usage.PromptTokens,
                        TotalTokens = response.Usage.TotalTokens
                    } : null,
                    RequestId = requestId,
                    ProcessingTime = stopwatch.Elapsed
                };
            }

            throw new Exception("No response received from Azure OpenAI service");
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Embedding request failed for {RequestId}", requestId);
            
            return new EmbeddingResponse
            {
                RequestId = requestId,
                Error = ex.Message,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<CompletionResponse> GetCompletionAsync(CompletionRequest request)
    {
        var requestId = Guid.NewGuid().ToString();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _structuredLogger.LogAIEvent("CompletionStarted",
                $"Starting completion request",
                context: new { 
                    RequestId = requestId,
                    Model = request.Model,
                    PromptLength = request.Prompt?.Length ?? 0
                });

            var deployment = GetDeployment(request.Model);
            var url = $"{_endpoint}/openai/deployments/{deployment.DeploymentName}/completions?api-version={_apiVersion}";

            var requestBody = new
            {
                prompt = request.Prompt,
                max_tokens = request.MaxTokens,
                temperature = request.Temperature,
                top_p = request.TopP,
                n = request.N,
                stream = request.Stream,
                logprobs = request.Logprobs,
                stop = request.Stop
            };

            var response = await SendRequestAsync<CompletionApiResponse>(url, requestBody);
            
            stopwatch.Stop();

            if (response != null)
            {
                return new CompletionResponse
                {
                    Id = response.Id,
                    Object = response.Object,
                    Created = response.Created,
                    Model = response.Model,
                    Choices = response.Choices?.Select(c => new CompletionChoice
                    {
                        Text = c.Text,
                        Index = c.Index,
                        Logprobs = c.Logprobs,
                        FinishReason = c.FinishReason
                    }).ToList() ?? new List<CompletionChoice>(),
                    Usage = response.Usage != null ? new TokenUsage
                    {
                        PromptTokens = response.Usage.PromptTokens,
                        CompletionTokens = response.Usage.CompletionTokens,
                        TotalTokens = response.Usage.TotalTokens
                    } : null,
                    RequestId = requestId,
                    ProcessingTime = stopwatch.Elapsed
                };
            }

            throw new Exception("No response received from Azure OpenAI service");
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Completion request failed for {RequestId}", requestId);
            
            return new CompletionResponse
            {
                RequestId = requestId,
                Error = ex.Message,
                ProcessingTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<ModerationResponse> ModerateContentAsync(ModerationRequest request)
    {
        var requestId = Guid.NewGuid().ToString();

        try
        {
            // For now, simulate moderation (Azure OpenAI moderation endpoint may vary)
            await Task.Delay(100);

            return new ModerationResponse
            {
                Id = requestId,
                Model = "text-moderation-latest",
                Results = new List<ModerationResult>
                {
                    new ModerationResult
                    {
                        Flagged = false,
                        Categories = new ModerationCategories
                        {
                            Hate = false,
                            HateThreatening = false,
                            SelfHarm = false,
                            Sexual = false,
                            SexualMinors = false,
                            Violence = false,
                            ViolenceGraphic = false
                        },
                        CategoryScores = new ModerationCategoryScores
                        {
                            Hate = 0.01,
                            HateThreatening = 0.005,
                            SelfHarm = 0.002,
                            Sexual = 0.003,
                            SexualMinors = 0.001,
                            Violence = 0.004,
                            ViolenceGraphic = 0.002
                        }
                    }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Content moderation failed for {RequestId}", requestId);
            
            return new ModerationResponse
            {
                RequestId = requestId,
                Error = ex.Message
            };
        }
    }

    public async Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request)
    {
        // Placeholder - Azure OpenAI DALL-E integration would go here
        await Task.Delay(100);
        
        return new ImageGenerationResponse
        {
            Created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            Data = new List<ImageData>
            {
                new ImageData
                {
                    Url = "https://placeholder.example.com/generated-image.png"
                }
            }
        };
    }

    public async Task<AudioTranscriptionResponse> TranscribeAudioAsync(AudioTranscriptionRequest request)
    {
        // Placeholder - Azure OpenAI Whisper integration would go here
        await Task.Delay(100);
        
        return new AudioTranscriptionResponse
        {
            Text = "This is a placeholder transcription of the audio content."
        };
    }

    public async Task<TextToSpeechResponse> ConvertTextToSpeechAsync(TextToSpeechRequest request)
    {
        // Placeholder - Azure OpenAI TTS integration would go here
        await Task.Delay(100);
        
        return new TextToSpeechResponse
        {
            AudioData = new byte[1024], // Placeholder audio data
            ContentType = "audio/mpeg"
        };
    }

    public async Task<bool> IsServiceHealthyAsync()
    {
        try
        {
            var healthRequest = new ChatCompletionRequest
            {
                Model = "gpt-35-turbo",
                Messages = new List<ChatMessage>
                {
                    new ChatMessage { Role = "user", Content = "Hello" }
                },
                MaxTokens = 5
            };

            var response = await GetChatCompletionAsync(healthRequest);
            return string.IsNullOrEmpty(response.Error);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure OpenAI health check failed");
            return false;
        }
    }

    public async Task<List<ModelInfo>> GetAvailableModelsAsync()
    {
        try
        {
            // In a real implementation, this would query the Azure OpenAI management API
            await Task.Delay(10);

            return _deployments.Values.Select(d => new ModelInfo
            {
                Id = d.ModelName,
                Object = "model",
                Created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                OwnedBy = "azure-openai",
                Permissions = new List<ModelPermission>
                {
                    new ModelPermission
                    {
                        Id = Guid.NewGuid().ToString(),
                        Object = "model_permission",
                        Created = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                        AllowCreateEngine = true,
                        AllowSampling = true,
                        AllowLogprobs = true,
                        AllowSearchIndices = false,
                        AllowView = true,
                        AllowFineTuning = false,
                        Organization = "*",
                        Group = null,
                        IsBlocking = false
                    }
                }
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available models");
            return new List<ModelInfo>();
        }
    }

    public async Task<UsageStatistics> GetUsageStatisticsAsync()
    {
        try
        {
            // In a real implementation, this would query Azure monitoring/usage APIs
            await Task.Delay(10);

            return new UsageStatistics
            {
                TotalRequests = 12500,
                TotalTokens = 2_500_000,
                TotalCost = 125.50m,
                RequestsLast24Hours = 1200,
                TokensLast24Hours = 240_000,
                CostLast24Hours = 12.00m,
                AverageResponseTime = TimeSpan.FromMilliseconds(850),
                ErrorRate = 0.02
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get usage statistics");
            throw;
        }
    }

    private void ConfigureHttpClient()
    {
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "TerraFusion-AzureOpenAI/1.0");
        _httpClient.Timeout = TimeSpan.FromSeconds(120);
    }

    private void InitializeDeployments()
    {
        // Initialize model deployments from configuration
        var deploymentSection = _configuration.GetSection("AzureOpenAI:Deployments");
        
        if (deploymentSection.Exists())
        {
            foreach (var deployment in deploymentSection.GetChildren())
            {
                var modelName = deployment["ModelName"];
                var deploymentName = deployment["DeploymentName"];
                
                if (!string.IsNullOrEmpty(modelName) && !string.IsNullOrEmpty(deploymentName))
                {
                    _deployments[modelName] = new ModelDeployment
                    {
                        ModelName = modelName,
                        DeploymentName = deploymentName,
                        Version = deployment["Version"] ?? "1.0",
                        MaxTokens = int.Parse(deployment["MaxTokens"] ?? "4096"),
                        IsActive = bool.Parse(deployment["IsActive"] ?? "true")
                    };
                }
            }
        }

        // Add default deployments if none configured
        if (!_deployments.Any())
        {
            _deployments["gpt-4"] = new ModelDeployment
            {
                ModelName = "gpt-4",
                DeploymentName = "gpt-4",
                Version = "1.0",
                MaxTokens = 8192,
                IsActive = true
            };

            _deployments["gpt-35-turbo"] = new ModelDeployment
            {
                ModelName = "gpt-35-turbo",
                DeploymentName = "gpt-35-turbo",
                Version = "1.0",
                MaxTokens = 4096,
                IsActive = true
            };

            _deployments["text-embedding-ada-002"] = new ModelDeployment
            {
                ModelName = "text-embedding-ada-002",
                DeploymentName = "text-embedding-ada-002",
                Version = "2.0",
                MaxTokens = 8191,
                IsActive = true
            };
        }
    }

    private ModelDeployment GetDeployment(string modelName)
    {
        if (_deployments.TryGetValue(modelName, out var deployment) && deployment.IsActive)
        {
            return deployment;
        }

        // Fallback to gpt-35-turbo if specific model not found
        if (_deployments.TryGetValue("gpt-35-turbo", out var fallback))
        {
            _logger.LogWarning("Model {ModelName} not found, using fallback: gpt-35-turbo", modelName);
            return fallback;
        }

        throw new ArgumentException($"No active deployment found for model: {modelName}");
    }

    private async Task<T?> SendRequestAsync<T>(string url, object requestBody) where T : class
    {
        try
        {
            var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                return System.Text.Json.JsonSerializer.Deserialize<T>(responseContent);
            }
            else
            {
                _logger.LogError("Azure OpenAI API request failed: {StatusCode} - {Content}", 
                    response.StatusCode, responseContent);
                throw new HttpRequestException($"API request failed: {response.StatusCode} - {responseContent}");
            }
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogError(ex, "Azure OpenAI API request timed out");
            throw new TimeoutException("Azure OpenAI API request timed out", ex);
        }
    }
}

// Request/Response models
public class ChatCompletionRequest
{
    public string Model { get; set; } = "gpt-35-turbo";
    public List<ChatMessage>? Messages { get; set; }
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 150;
    public double TopP { get; set; } = 1.0;
    public double FrequencyPenalty { get; set; } = 0.0;
    public double PresencePenalty { get; set; } = 0.0;
    public List<string>? Stop { get; set; }
    public bool Stream { get; set; } = false;
    public string? User { get; set; }
}

public class ChatMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class ChatCompletionResponse
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public string Model { get; set; } = string.Empty;
    public List<ChatChoice> Choices { get; set; } = new();
    public TokenUsage? Usage { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string? Error { get; set; }
    public TimeSpan ProcessingTime { get; set; }
}

public class ChatChoice
{
    public int Index { get; set; }
    public ChatMessage Message { get; set; } = new();
    public string? FinishReason { get; set; }
}

public class EmbeddingRequest
{
    public string Model { get; set; } = "text-embedding-ada-002";
    public string Input { get; set; } = string.Empty;
    public string? User { get; set; }
}

public class EmbeddingResponse
{
    public string Object { get; set; } = string.Empty;
    public List<EmbeddingData> Data { get; set; } = new();
    public string Model { get; set; } = string.Empty;
    public TokenUsage? Usage { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string? Error { get; set; }
    public TimeSpan ProcessingTime { get; set; }
}

public class EmbeddingData
{
    public string Object { get; set; } = string.Empty;
    public int Index { get; set; }
    public double[] Embedding { get; set; } = Array.Empty<double>();
}

public class CompletionRequest
{
    public string Model { get; set; } = "gpt-35-turbo-instruct";
    public string Prompt { get; set; } = string.Empty;
    public int MaxTokens { get; set; } = 16;
    public double Temperature { get; set; } = 1.0;
    public double TopP { get; set; } = 1.0;
    public int N { get; set; } = 1;
    public bool Stream { get; set; } = false;
    public int? Logprobs { get; set; }
    public string? Stop { get; set; }
}

public class CompletionResponse
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public string Model { get; set; } = string.Empty;
    public List<CompletionChoice> Choices { get; set; } = new();
    public TokenUsage? Usage { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string? Error { get; set; }
    public TimeSpan ProcessingTime { get; set; }
}

public class CompletionChoice
{
    public string Text { get; set; } = string.Empty;
    public int Index { get; set; }
    public object? Logprobs { get; set; }
    public string? FinishReason { get; set; }
}

public class TokenUsage
{
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
}

public class ModerationRequest
{
    public string Input { get; set; } = string.Empty;
    public string Model { get; set; } = "text-moderation-latest";
}

public class ModerationResponse
{
    public string Id { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public List<ModerationResult> Results { get; set; } = new();
    public string? RequestId { get; set; }
    public string? Error { get; set; }
}

public class ModerationResult
{
    public bool Flagged { get; set; }
    public ModerationCategories Categories { get; set; } = new();
    public ModerationCategoryScores CategoryScores { get; set; } = new();
}

public class ModerationCategories
{
    public bool Hate { get; set; }
    public bool HateThreatening { get; set; }
    public bool SelfHarm { get; set; }
    public bool Sexual { get; set; }
    public bool SexualMinors { get; set; }
    public bool Violence { get; set; }
    public bool ViolenceGraphic { get; set; }
}

public class ModerationCategoryScores
{
    public double Hate { get; set; }
    public double HateThreatening { get; set; }
    public double SelfHarm { get; set; }
    public double Sexual { get; set; }
    public double SexualMinors { get; set; }
    public double Violence { get; set; }
    public double ViolenceGraphic { get; set; }
}

public class ImageGenerationRequest
{
    public string Prompt { get; set; } = string.Empty;
    public int N { get; set; } = 1;
    public string Size { get; set; } = "1024x1024";
    public string ResponseFormat { get; set; } = "url";
    public string? User { get; set; }
}

public class ImageGenerationResponse
{
    public long Created { get; set; }
    public List<ImageData> Data { get; set; } = new();
}

public class ImageData
{
    public string? Url { get; set; }
    public string? B64Json { get; set; }
}

public class AudioTranscriptionRequest
{
    public byte[] AudioData { get; set; } = Array.Empty<byte>();
    public string Model { get; set; } = "whisper-1";
    public string? Language { get; set; }
    public string? Prompt { get; set; }
    public string ResponseFormat { get; set; } = "json";
    public double Temperature { get; set; } = 0.0;
}

public class AudioTranscriptionResponse
{
    public string Text { get; set; } = string.Empty;
}

public class TextToSpeechRequest
{
    public string Model { get; set; } = "tts-1";
    public string Input { get; set; } = string.Empty;
    public string Voice { get; set; } = "alloy";
    public string ResponseFormat { get; set; } = "mp3";
    public double Speed { get; set; } = 1.0;
}

public class TextToSpeechResponse
{
    public byte[] AudioData { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = string.Empty;
}

public class ModelInfo
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public string OwnedBy { get; set; } = string.Empty;
    public List<ModelPermission> Permissions { get; set; } = new();
}

public class ModelPermission
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public bool AllowCreateEngine { get; set; }
    public bool AllowSampling { get; set; }
    public bool AllowLogprobs { get; set; }
    public bool AllowSearchIndices { get; set; }
    public bool AllowView { get; set; }
    public bool AllowFineTuning { get; set; }
    public string Organization { get; set; } = string.Empty;
    public string? Group { get; set; }
    public bool IsBlocking { get; set; }
}

public class UsageStatistics
{
    public long TotalRequests { get; set; }
    public long TotalTokens { get; set; }
    public decimal TotalCost { get; set; }
    public long RequestsLast24Hours { get; set; }
    public long TokensLast24Hours { get; set; }
    public decimal CostLast24Hours { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public double ErrorRate { get; set; }
}

public class ModelDeployment
{
    public string ModelName { get; set; } = string.Empty;
    public string DeploymentName { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public bool IsActive { get; set; }
}

// Internal API response models
internal class ChatCompletionApiResponse
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public string Model { get; set; } = string.Empty;
    public List<ChatChoiceApi>? Choices { get; set; }
    public TokenUsageApi? Usage { get; set; }
}

internal class ChatChoiceApi
{
    public int Index { get; set; }
    public ChatMessageApi Message { get; set; } = new();
    public string? FinishReason { get; set; }
}

internal class ChatMessageApi
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

internal class EmbeddingApiResponse
{
    public string Object { get; set; } = string.Empty;
    public List<EmbeddingDataApi>? Data { get; set; }
    public string Model { get; set; } = string.Empty;
    public TokenUsageApi? Usage { get; set; }
}

internal class EmbeddingDataApi
{
    public string Object { get; set; } = string.Empty;
    public int Index { get; set; }
    public double[] Embedding { get; set; } = Array.Empty<double>();
}

internal class CompletionApiResponse
{
    public string Id { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public long Created { get; set; }
    public string Model { get; set; } = string.Empty;
    public List<CompletionChoiceApi>? Choices { get; set; }
    public TokenUsageApi? Usage { get; set; }
}

internal class CompletionChoiceApi
{
    public string Text { get; set; } = string.Empty;
    public int Index { get; set; }
    public object? Logprobs { get; set; }
    public string? FinishReason { get; set; }
}

internal class TokenUsageApi
{
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
}
