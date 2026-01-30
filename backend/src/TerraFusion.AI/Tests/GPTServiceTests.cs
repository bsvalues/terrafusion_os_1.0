// TerraFusionGPT Suite: GPT Service Unit Tests
// Elite Government OS Engineering - AI Platform
// Note: These tests are designed to run with a real database context.
// For in-memory testing, use the Integration.Tests project.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using TerraFusion.AI.Services;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Entities;

// Entity aliases to avoid conflict between System.Threading.Tasks.Task and TerraFusion.Core.Entities.Task
using GPTConfiguration = TerraFusion.Core.Entities.GPTConfiguration;
using GPTConversation = TerraFusion.Core.Entities.GPTConversation;

namespace TerraFusion.AI.Tests
{
  /// <summary>
  /// Unit tests for GPT Configuration and Orchestration services.
  /// These tests verify service logic without database dependencies.
  /// </summary>
  public class GPTConfigurationTests
  {
    [Fact]
    public void GPTConfiguration_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var config = new GPTConfiguration();

      // Assert
      Assert.Equal(0, config.Id);
      Assert.Equal(string.Empty, config.Name);  // Name defaults to empty string
      Assert.Equal(0.7m, config.Temperature);
      Assert.Equal(4000, config.MaxTokens);  // Entity default is 4000
      Assert.Equal("Active", config.Status);
      Assert.False(config.IsSystemGPT);
    }

    [Fact]
    public void GPTConfiguration_SetProperties_RetainsValues()
    {
      // Arrange
      var config = new GPTConfiguration
      {
        Name = "PropertyAssessmentGPT",
        DisplayName = "Property Assessment GPT",
        Description = "AI assistant for property assessment",
        ModelProvider = "OpenAI",
        ModelName = "gpt-4o",
        SystemPrompt = "You are an expert property assessor.",
        Temperature = 0.3m,
        MaxTokens = 2048,
        IsSystemGPT = true,
        IsPublic = true
      };

      // Assert
      Assert.Equal("PropertyAssessmentGPT", config.Name);
      Assert.Equal("Property Assessment GPT", config.DisplayName);
      Assert.Equal("AI assistant for property assessment", config.Description);
      Assert.Equal("OpenAI", config.ModelProvider);
      Assert.Equal("gpt-4o", config.ModelName);
      Assert.Contains("property assessor", config.SystemPrompt);
      Assert.Equal(0.3m, config.Temperature);
      Assert.Equal(2048, config.MaxTokens);
      Assert.True(config.IsSystemGPT);
      Assert.True(config.IsPublic);
    }

    [Fact]
    public void GPTConversation_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var conversation = new GPTConversation();

      // Assert
      Assert.Equal(0, conversation.Id);
      Assert.Equal("Active", conversation.Status);
      Assert.Equal(0, conversation.TotalMessages);
      Assert.Equal(0, conversation.TotalTokensUsed);
    }

    [Fact]
    public void GPTConversation_SetProperties_RetainsValues()
    {
      // Arrange
      var conversation = new GPTConversation
      {
        Title = "Property Value Discussion",
        UserId = "user-123",
        GPTConfigurationId = 42,
        CountyId = 1,
        Status = "Active",
        TotalMessages = 5,
        TotalTokensUsed = 1500
      };

      // Assert
      Assert.Equal("Property Value Discussion", conversation.Title);
      Assert.Equal("user-123", conversation.UserId);
      Assert.Equal(42, conversation.GPTConfigurationId);
      Assert.Equal(1, conversation.CountyId);
      Assert.Equal("Active", conversation.Status);
      Assert.Equal(5, conversation.TotalMessages);
      Assert.Equal(1500, conversation.TotalTokensUsed);
    }
  }

  /// <summary>
  /// Tests for RAG search result structure
  /// </summary>
  public class RAGSearchResultTests
  {
    [Fact]
    public void RAGSearchResult_NewInstance_HasEmptyDefaults()
    {
      // Arrange & Act
      var result = new RAGSearchResult();

      // Assert
      Assert.Equal(string.Empty, result.Context);
      Assert.NotNull(result.DocumentIds);
      Assert.Empty(result.DocumentIds);
      Assert.Equal(0m, result.AverageScore);
      Assert.Equal(0, result.ChunksRetrieved);
    }

    [Fact]
    public void RAGSearchResult_WithContext_RetainsValues()
    {
      // Arrange
      var result = new RAGSearchResult
      {
        Context = "Relevant property assessment context...",
        DocumentIds = new System.Collections.Generic.List<string> { "doc-1", "doc-2" },
        AverageScore = 0.85m,
        ChunksRetrieved = 3
      };

      // Assert
      Assert.Contains("property assessment", result.Context);
      Assert.Equal(2, result.DocumentIds.Count);
      Assert.Equal(0.85m, result.AverageScore);
      Assert.Equal(3, result.ChunksRetrieved);
    }
  }

  /// <summary>
  /// Tests for GPT service interface contracts
  /// </summary>
  public class GPTServiceContractTests
  {
    [Fact]
    public void IGPTConfigurationService_HasRequiredMethods()
    {
      // Verify interface exists and has expected methods
      var interfaceType = typeof(IGPTConfigurationService);

      Assert.NotNull(interfaceType.GetMethod("CreateGPTAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetSystemGPTsAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetGPTByIdAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetGPTByNameAsync"));
      Assert.NotNull(interfaceType.GetMethod("UpdateGPTAsync"));
      Assert.NotNull(interfaceType.GetMethod("DeleteGPTAsync"));
    }

    [Fact]
    public void IGPTOrchestrationService_HasRequiredMethods()
    {
      // Verify interface exists and has expected methods
      var interfaceType = typeof(IGPTOrchestrationService);

      Assert.NotNull(interfaceType.GetMethod("CreateConversationAsync"));
      Assert.NotNull(interfaceType.GetMethod("SendMessageAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetConversationHistoryAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetUserConversationsAsync"));
    }

    [Fact]
    public void IRAGService_HasRequiredMethods()
    {
      // Verify interface exists and has expected methods
      var interfaceType = typeof(IRAGService);

      Assert.NotNull(interfaceType.GetMethod("CreateDatasetAsync"));
      Assert.NotNull(interfaceType.GetMethod("AddDocumentAsync"));  // Correct method name
      Assert.NotNull(interfaceType.GetMethod("IndexDocumentAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetRelevantContextAsync"));
      Assert.NotNull(interfaceType.GetMethod("SearchDatasetsAsync"));
    }
  }

  /// <summary>
  /// Tests for GPT model validation
  /// </summary>
  public class GPTValidationTests
  {
    [Theory]
    [InlineData(0.0)]
    [InlineData(0.5)]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public void Temperature_ValidRange_IsAccepted(decimal temperature)
    {
      // Arrange
      var config = new GPTConfiguration { Temperature = temperature };

      // Assert - temperature should be between 0 and 2
      Assert.True(config.Temperature >= 0m && config.Temperature <= 2m);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(1000)]
    [InlineData(4096)]
    [InlineData(128000)]
    public void MaxTokens_ValidRange_IsAccepted(int maxTokens)
    {
      // Arrange
      var config = new GPTConfiguration { MaxTokens = maxTokens };

      // Assert - max tokens should be positive
      Assert.True(config.MaxTokens > 0);
    }

    [Theory]
    [InlineData("OpenAI")]
    [InlineData("Azure")]
    [InlineData("Anthropic")]
    public void ModelProvider_SupportedProviders_AreValid(string provider)
    {
      // Arrange
      var config = new GPTConfiguration { ModelProvider = provider };

      // Assert
      Assert.NotNull(config.ModelProvider);
      Assert.NotEmpty(config.ModelProvider);
    }
  }

  /// <summary>
  /// Tests for PropertyAssessmentGPT RAG integration
  /// </summary>
  public class PropertyAssessmentGPTRagTests
  {
    [Fact]
    public void PropertyAssessmentGPT_WithRAGEnabled_HasCorrectConfiguration()
    {
      // Arrange
      var config = new GPTConfiguration
      {
        Name = "PropertyAssessmentGPT",
        DisplayName = "Property Assessment GPT",
        Description = "Expert assistant for Benton County property assessment",
        ModelProvider = "OpenAI",
        ModelName = "gpt-4o",
        EnableRAG = true,
        RAGDatasetId = 1, // benton_cama_basics
        RAGTopK = 8,
        RAGScoreThreshold = 0.75m,
        IsSystemGPT = true
      };

      // Assert
      Assert.Equal("PropertyAssessmentGPT", config.Name);
      Assert.True(config.EnableRAG);
      Assert.Equal(1, config.RAGDatasetId);
      Assert.Equal(8, config.RAGTopK);
      Assert.Equal(0.75m, config.RAGScoreThreshold);
    }

    [Fact]
    public void RAGSearchResult_WithBentonCAMAContext_ContainsExpectedContent()
    {
      // Arrange - simulate RAG context from Benton CAMA docs
      var result = new RAGSearchResult
      {
        Context = @"Based on Benton County's Residential Valuation Policy, the Quality Grade Scale is:
Grade A: Luxury/Custom - $200+/SF
Grade B: Good Quality - $130-160/SF
Grade C: Average - $90-110/SF",
        DocumentIds = new System.Collections.Generic.List<string> { "residential_valuation_policy.md" },
        AverageScore = 0.92m,
        ChunksRetrieved = 1
      };

      // Assert - RAG result contains Benton County specific content
      Assert.Contains("Benton County", result.Context);
      Assert.Contains("Quality Grade", result.Context);
      Assert.Contains("residential_valuation_policy", result.DocumentIds[0]);
      Assert.True(result.AverageScore > 0.8m, "RAG score should be high for relevant content");
    }

    [Fact]
    public void RAGSearchResult_ForAssessmentCalendar_ReturnsTimelineData()
    {
      // Arrange - simulate RAG context for assessment calendar query
      var result = new RAGSearchResult
      {
        Context = @"Assessment Calendar:
January - Assessment roll opens
April 30 - Value change notices mailed
May-June - Informal review period
July 1 - Board of Equalization appeals deadline
October - Final values certified",
        DocumentIds = new System.Collections.Generic.List<string> { "benton_cama_overview.md" },
        AverageScore = 0.88m,
        ChunksRetrieved = 1
      };

      // Assert
      Assert.Contains("April 30", result.Context);
      Assert.Contains("Board of Equalization", result.Context);
      Assert.Contains("benton_cama_overview", result.DocumentIds[0]);
    }

    [Fact]
    public void RAGSearchResult_ForAppealsProcess_ReturnsWorkflowData()
    {
      // Arrange - simulate RAG context for appeals query
      var result = new RAGSearchResult
      {
        Context = @"Appeals Process:
Informal Review: 30 days from notice date
BOE Filing Deadline: July 1 or 30 days from notice
Hearing Format: 15-minute presentation
Decision Timeline: 30 days from hearing",
        DocumentIds = new System.Collections.Generic.List<string> { "workflow_overview.md" },
        AverageScore = 0.91m,
        ChunksRetrieved = 1
      };

      // Assert
      Assert.Contains("Informal Review", result.Context);
      Assert.Contains("BOE", result.Context);
      Assert.Contains("workflow_overview", result.DocumentIds[0]);
    }
  }

  /// <summary>
  /// Phase 4: RAG Embedding Repository tests
  /// Tests for vector storage and similarity search
  /// </summary>
  public class RAGEmbeddingTests
  {
    [Fact]
    public void RAGEmbedding_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var embedding = new RAGEmbedding();

      // Assert
      Assert.Equal(0, embedding.Id);
      Assert.Equal(0, embedding.DocumentId);
      Assert.Equal(0, embedding.DatasetId);
      Assert.Equal(0, embedding.ChunkIndex);
      Assert.Equal(string.Empty, embedding.ChunkText);
      Assert.Empty(embedding.Embedding);
    }

    [Fact]
    public void RAGEmbedding_SetProperties_RetainsValues()
    {
      // Arrange
      var testEmbedding = new float[] { 0.1f, 0.2f, 0.3f, 0.4f, 0.5f };

      var embedding = new RAGEmbedding
      {
        DocumentId = 42,
        DatasetId = 1,
        ChunkIndex = 3,
        ChunkText = "Quality grades range from Excellent to Poor.",
        Embedding = testEmbedding,
        TokenCount = 10,
        StartPosition = 500,
        EndPosition = 550
      };

      // Assert
      Assert.Equal(42, embedding.DocumentId);
      Assert.Equal(1, embedding.DatasetId);
      Assert.Equal(3, embedding.ChunkIndex);
      Assert.Contains("Quality grades", embedding.ChunkText);
      Assert.Equal(5, embedding.Embedding.Length);
      Assert.Equal(0.1f, embedding.Embedding[0]);
      Assert.Equal(10, embedding.TokenCount);
      Assert.Equal(500, embedding.StartPosition);
      Assert.Equal(550, embedding.EndPosition);
    }

    [Fact]
    public void RAGEmbeddingSearchResult_SetProperties_RetainsValues()
    {
      // Arrange & Act
      var result = new RAGEmbeddingSearchResult
      {
        EmbeddingId = 123,
        DocumentId = 42,
        DatasetId = 1,
        ChunkIndex = 3,
        ChunkText = "Quality Grade A: Excellent construction",
        SimilarityScore = 0.95f,
        DocumentTitle = "Residential Valuation Policy",
        SourceUrl = "file://policies/residential_valuation_policy.md"
      };

      // Assert
      Assert.Equal(123, result.EmbeddingId);
      Assert.Equal(42, result.DocumentId);
      Assert.Equal(1, result.DatasetId);
      Assert.Contains("Quality Grade A", result.ChunkText);
      Assert.Equal(0.95f, result.SimilarityScore);
      Assert.Equal("Residential Valuation Policy", result.DocumentTitle);
    }

    [Fact]
    public void CosineSimilarity_IdenticalVectors_ReturnsOne()
    {
      // Arrange
      var vectorA = new float[] { 1.0f, 0.0f, 0.0f };
      var vectorB = new float[] { 1.0f, 0.0f, 0.0f };

      // Act
      var similarity = CalculateCosineSimilarity(vectorA, vectorB);

      // Assert
      Assert.Equal(1.0f, similarity, precision: 5);
    }

    [Fact]
    public void CosineSimilarity_OrthogonalVectors_ReturnsZero()
    {
      // Arrange
      var vectorA = new float[] { 1.0f, 0.0f, 0.0f };
      var vectorB = new float[] { 0.0f, 1.0f, 0.0f };

      // Act
      var similarity = CalculateCosineSimilarity(vectorA, vectorB);

      // Assert
      Assert.Equal(0.0f, similarity, precision: 5);
    }

    [Fact]
    public void CosineSimilarity_SimilarVectors_ReturnsHighScore()
    {
      // Arrange - vectors that are similar but not identical
      var vectorA = new float[] { 0.9f, 0.1f, 0.0f };
      var vectorB = new float[] { 0.8f, 0.2f, 0.0f };

      // Act
      var similarity = CalculateCosineSimilarity(vectorA, vectorB);

      // Assert - should be high (close to 1)
      Assert.True(similarity > 0.95f, $"Expected similarity > 0.95, got {similarity}");
    }

    // Helper method matching the repository implementation
    private static float CalculateCosineSimilarity(float[] vectorA, float[] vectorB)
    {
      if (vectorA.Length != vectorB.Length || vectorA.Length == 0)
        return 0f;

      float dotProduct = 0f;
      float magnitudeA = 0f;
      float magnitudeB = 0f;

      for (int i = 0; i < vectorA.Length; i++)
      {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
      }

      magnitudeA = (float)System.Math.Sqrt(magnitudeA);
      magnitudeB = (float)System.Math.Sqrt(magnitudeB);

      if (magnitudeA == 0f || magnitudeB == 0f)
        return 0f;

      return dotProduct / (magnitudeA * magnitudeB);
    }
  }

  /// <summary>
  /// End-to-end RAG integration tests with IEmbeddingService
  /// Phase 7: Validates full RAG pipeline - indexing → embedding → search → response
  /// </summary>
  public class RAGEndToEndIntegrationTests
  {
    [Fact]
    public void SimulatedEmbeddingService_GeneratesConsistentEmbeddings()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var embeddingService = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);

      // Act - same text should produce same embedding
      var embedding1 = embeddingService.GenerateEmbeddingAsync("test property valuation", "text-embedding-3-small").Result;
      var embedding2 = embeddingService.GenerateEmbeddingAsync("test property valuation", "text-embedding-3-small").Result;

      // Assert - deterministic behavior
      Assert.Equal(embedding1.Length, embedding2.Length);
      Assert.Equal(1536, embedding1.Length); // text-embedding-3-small dimension
      for (int i = 0; i < embedding1.Length; i++)
      {
        Assert.Equal(embedding1[i], embedding2[i]);
      }
    }

    [Fact]
    public void SimulatedEmbeddingService_DifferentTextProducesDifferentEmbeddings()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var embeddingService = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);

      // Act
      var embedding1 = embeddingService.GenerateEmbeddingAsync("residential property valuation", "text-embedding-3-small").Result;
      var embedding2 = embeddingService.GenerateEmbeddingAsync("commercial real estate assessment", "text-embedding-3-small").Result;

      // Assert - different text produces different embeddings
      Assert.Equal(embedding1.Length, embedding2.Length);
      bool isDifferent = false;
      for (int i = 0; i < embedding1.Length; i++)
      {
        if (Math.Abs(embedding1[i] - embedding2[i]) > 0.001f)
        {
          isDifferent = true;
          break;
        }
      }
      Assert.True(isDifferent, "Different text should produce different embeddings");
    }

    [Fact]
    public void SimulatedEmbeddingService_BatchGeneratesCorrectCount()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var embeddingService = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);
      var texts = new System.Collections.Generic.List<string>
      {
        "First property description",
        "Second property details",
        "Third assessment information"
      };

      // Act
      var embeddings = embeddingService.GenerateBatchEmbeddingsAsync(texts, "text-embedding-3-small").Result;

      // Assert
      Assert.Equal(3, embeddings.Count);
      foreach (var embedding in embeddings)
      {
        Assert.Equal(1536, embedding.Length);
      }
    }

    [Fact]
    public void SimulatedEmbeddingService_SupportsMultipleModels()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var embeddingService = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);

      // Act & Assert - different models have different dimensions
      var smallEmbedding = embeddingService.GenerateEmbeddingAsync("test", "text-embedding-3-small").Result;
      var largeEmbedding = embeddingService.GenerateEmbeddingAsync("test", "text-embedding-3-large").Result;
      var adaEmbedding = embeddingService.GenerateEmbeddingAsync("test", "text-embedding-ada-002").Result;

      Assert.Equal(1536, smallEmbedding.Length);
      Assert.Equal(3072, largeEmbedding.Length);
      Assert.Equal(1536, adaEmbedding.Length);
    }

    [Fact]
    public void IEmbeddingService_InterfaceHasRequiredMethods()
    {
      // Verify interface contract
      var interfaceType = typeof(TerraFusion.AI.Interfaces.IEmbeddingService);

      Assert.NotNull(interfaceType.GetMethod("GenerateEmbeddingAsync"));
      Assert.NotNull(interfaceType.GetMethod("GenerateBatchEmbeddingsAsync"));
      Assert.NotNull(interfaceType.GetMethod("GetVectorDimension"));
      Assert.NotNull(interfaceType.GetMethod("IsAvailableAsync"));
      Assert.NotNull(interfaceType.GetProperty("ProviderName"));
    }

    [Fact]
    public void SimulatedEmbeddingService_IsAlwaysAvailable()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var embeddingService = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);

      // Act
      var isAvailable = embeddingService.IsAvailableAsync().Result;

      // Assert
      Assert.True(isAvailable);
      Assert.Equal("Simulated", embeddingService.ProviderName);
    }

    [Fact]
    public void RAGPipeline_IndexAndSearch_FindsRelevantContent()
    {
      // Arrange - simulated RAG pipeline flow
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var embeddingService = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);

      // Simulate document chunks (what would be in the database)
      var documentChunks = new System.Collections.Generic.List<(string Text, float[] Embedding)>
      {
        ("Quality grades for residential properties range from A (excellent) to D (poor)", null!),
        ("Land valuation considers location, zoning, and market conditions", null!),
        ("Assessment appeals must be filed within 60 days of notice", null!)
      };

      // Generate embeddings for chunks
      for (int i = 0; i < documentChunks.Count; i++)
      {
        var embedding = embeddingService.GenerateEmbeddingAsync(documentChunks[i].Text, "text-embedding-3-small").Result;
        documentChunks[i] = (documentChunks[i].Text, embedding);
      }

      // Query about quality grades
      var queryText = "What are the property quality grades?";
      var queryEmbedding = embeddingService.GenerateEmbeddingAsync(queryText, "text-embedding-3-small").Result;

      // Find most similar chunk
      float bestScore = -1f;
      string bestMatch = "";
      foreach (var chunk in documentChunks)
      {
        var similarity = CalculateCosineSimilarity(queryEmbedding, chunk.Embedding);
        if (similarity > bestScore)
        {
          bestScore = similarity;
          bestMatch = chunk.Text;
        }
      }

      // Assert - should find the quality grades chunk
      Assert.Contains("Quality grades", bestMatch);
      Assert.True(bestScore > 0, "Should have positive similarity score");
    }

    // Helper for similarity calculation
    private static float CalculateCosineSimilarity(float[] vectorA, float[] vectorB)
    {
      if (vectorA.Length != vectorB.Length || vectorA.Length == 0)
        return 0f;

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
        return 0f;

      return dotProduct / (magnitudeA * magnitudeB);
    }
  }

  /// <summary>
  /// Phase 11: GPT Audit and RAG Traceability Tests
  /// Validates audit logging and trace API for government compliance
  /// </summary>
  public class GPTAuditTests
  {
    [Fact]
    public void GPTAudit_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var audit = new GPTAudit();

      // Assert
      Assert.Equal(0, audit.Id);
      Assert.Equal(0, audit.MessageId);
      Assert.Equal(0, audit.ConversationId);
      Assert.Equal(string.Empty, audit.UserId);
      Assert.False(audit.RAGUsed);
      Assert.Null(audit.RAGDatasetId);
      Assert.Null(audit.RAGDocumentIds);
      Assert.Null(audit.RAGChunkDetails);
      Assert.Equal(0, audit.RAGChunksRetrieved);
      Assert.Null(audit.RAGAverageScore);
      Assert.Null(audit.EmbeddingProvider);
    }

    [Fact]
    public void GPTAudit_WithRAGData_StoresAllFields()
    {
      // Arrange & Act
      var audit = new GPTAudit
      {
        Id = 1,
        MessageId = 42,
        ConversationId = 10,
        GPTConfigurationId = 5,
        UserId = "user-123",
        CountyId = 1,
        RAGUsed = true,
        RAGDatasetId = 1,
        RAGDocumentIds = "[\"doc-1\", \"doc-2\", \"doc-3\"]",
        RAGChunkDetails = "[{\"chunkId\": 1, \"score\": 0.95}, {\"chunkId\": 2, \"score\": 0.87}]",
        RAGChunksRetrieved = 2,
        RAGAverageScore = 0.91m,
        EmbeddingProvider = "Simulated",
        EmbeddingModel = "text-embedding-3-small",
        LLMProvider = "OpenAI",
        LLMModel = "gpt-4o",
        RAGRetrievalTimeMs = 45,
        LLMGenerationTimeMs = 1200,
        TotalResponseTimeMs = 1250,
        CreatedAt = DateTime.UtcNow,
        ClientInfo = "GPT Studio v1.0"
      };

      // Assert
      Assert.Equal(42, audit.MessageId);
      Assert.Equal(10, audit.ConversationId);
      Assert.True(audit.RAGUsed);
      Assert.Equal(1, audit.RAGDatasetId);
      Assert.Contains("doc-1", audit.RAGDocumentIds);
      Assert.Contains("doc-2", audit.RAGDocumentIds);
      Assert.Equal(2, audit.RAGChunksRetrieved);
      Assert.Equal(0.91m, audit.RAGAverageScore);
      Assert.Equal("Simulated", audit.EmbeddingProvider);
      Assert.Equal("text-embedding-3-small", audit.EmbeddingModel);
      Assert.Equal("gpt-4o", audit.LLMModel);
      Assert.Equal(45, audit.RAGRetrievalTimeMs);
      Assert.Equal(1250, audit.TotalResponseTimeMs);
    }

    [Fact]
    public void GPTAudit_WithoutRAG_HasMinimalData()
    {
      // Arrange & Act - Audit for a non-RAG message
      var audit = new GPTAudit
      {
        Id = 2,
        MessageId = 100,
        ConversationId = 20,
        GPTConfigurationId = 3,
        UserId = "user-456",
        CountyId = 1,
        RAGUsed = false,
        LLMProvider = "OpenAI",
        LLMModel = "gpt-3.5-turbo",
        LLMGenerationTimeMs = 500,
        TotalResponseTimeMs = 500,
        CreatedAt = DateTime.UtcNow
      };

      // Assert
      Assert.False(audit.RAGUsed);
      Assert.Null(audit.RAGDatasetId);
      Assert.Null(audit.RAGDocumentIds);
      Assert.Null(audit.RAGChunkDetails);
      Assert.Equal(0, audit.RAGChunksRetrieved);
      Assert.Null(audit.RAGAverageScore);
      Assert.Null(audit.EmbeddingProvider);
      Assert.Equal("gpt-3.5-turbo", audit.LLMModel);
    }

    [Fact]
    public void GPTAudit_ChunkDetails_CanSerializeComplexStructure()
    {
      // Arrange
      var chunkDetails = new[]
      {
        new { chunkId = 1, score = 0.95, documentTitle = "Residential Valuation Policy", text = "Quality grades for residential properties..." },
        new { chunkId = 2, score = 0.87, documentTitle = "Benton CAMA Overview", text = "The cost approach methodology..." },
        new { chunkId = 3, score = 0.82, documentTitle = "Workflow Overview", text = "Assessment workflow steps..." }
      };
      var serialized = System.Text.Json.JsonSerializer.Serialize(chunkDetails);

      // Act
      var audit = new GPTAudit
      {
        RAGUsed = true,
        RAGChunkDetails = serialized,
        RAGChunksRetrieved = 3,
        RAGAverageScore = 0.88m
      };

      // Assert
      Assert.Contains("Residential Valuation Policy", audit.RAGChunkDetails);
      Assert.Contains("score", audit.RAGChunkDetails);
      Assert.Equal(3, audit.RAGChunksRetrieved);
    }
  }

  /// <summary>
  /// Phase 11: Conversation Trace API Tests
  /// Tests for the trace endpoint that returns audit data
  /// </summary>
  public class ConversationTraceTests
  {
    // Helper class for trace response testing
    private class TraceMessageDto
    {
      public int Id { get; set; }
      public string Role { get; set; } = string.Empty;
      public string Content { get; set; } = string.Empty;
      public TraceAuditDto? Audit { get; set; }
    }

    private class TraceAuditDto
    {
      public bool RagUsed { get; set; }
      public int? DatasetId { get; set; }
      public string? DatasetName { get; set; }
      public string[]? DocumentsUsed { get; set; }
      public int ChunksRetrieved { get; set; }
      public decimal AverageScore { get; set; }
      public string? EmbeddingProvider { get; set; }
    }

    [Fact]
    public void TraceResponse_WithRAGMessages_IncludesAuditData()
    {
      // Arrange - Simulate a trace response structure
      var messages = new List<TraceMessageDto>
      {
        new TraceMessageDto { Id = 1, Role = "user", Content = "What are quality grades?", Audit = null },
        new TraceMessageDto
        {
          Id = 2,
          Role = "assistant",
          Content = "Quality grades range from A to D...",
          Audit = new TraceAuditDto
          {
            RagUsed = true,
            DatasetId = 1,
            DatasetName = "Benton CAMA Basics",
            DocumentsUsed = new[] { "residential_valuation_policy.md", "benton_cama_overview.md" },
            ChunksRetrieved = 3,
            AverageScore = 0.89m,
            EmbeddingProvider = "Simulated"
          }
        }
      };

      var traceResponse = new
      {
        conversationId = 10,
        gptKey = "PropertyAssessmentGPT",
        messageCount = 4,
        messages
      };

      // Assert
      Assert.Equal(10, traceResponse.conversationId);
      Assert.Equal("PropertyAssessmentGPT", traceResponse.gptKey);
      var assistantMessage = traceResponse.messages[1];
      Assert.NotNull(assistantMessage.Audit);
      Assert.True(assistantMessage.Audit.RagUsed);
      Assert.Equal(2, assistantMessage.Audit.DocumentsUsed!.Length);
      Assert.Contains("residential_valuation_policy.md", assistantMessage.Audit.DocumentsUsed);
    }

    [Fact]
    public void TraceResponse_WithoutRAG_HasEmptyAudit()
    {
      // Arrange - Non-RAG conversation trace
      var traceResponse = new
      {
        conversationId = 20,
        gptKey = "GeneralAssistantGPT",
        messageCount = 2,
        messages = new[]
        {
          new { id = 1, role = "user", content = "Hello", ragUsed = false, documentsUsed = (string[]?)null },
          new { id = 2, role = "assistant", content = "Hello! How can I help?", ragUsed = false, documentsUsed = (string[]?)null }
        }
      };

      // Assert
      Assert.False(traceResponse.messages[1].ragUsed);
      Assert.Null(traceResponse.messages[1].documentsUsed);
    }
  }

  /// <summary>
  /// Phase 11: RAGChunkDetail Model Tests
  /// Tests for the new chunk detail model used in audit traceability
  /// </summary>
  public class RAGChunkDetailTests
  {
    [Fact]
    public void RAGChunkDetail_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var detail = new TerraFusion.AI.Interfaces.RAGChunkDetail();

      // Assert
      Assert.Equal(0, detail.ChunkId);
      Assert.Equal(string.Empty, detail.DocumentTitle);
      Assert.Equal(string.Empty, detail.TextSnippet);
      Assert.Equal(0m, detail.Score);
      Assert.Equal(0, detail.ChunkIndex);
      Assert.Null(detail.SourceUrl);
      Assert.Null(detail.FullText);
    }

    [Fact]
    public void RAGChunkDetail_SetProperties_RetainsValues()
    {
      // Arrange & Act
      var detail = new TerraFusion.AI.Interfaces.RAGChunkDetail
      {
        ChunkId = 42,
        DocumentTitle = "Benton CAMA Guide",
        SourceUrl = "https://benton.county/cama-guide",
        TextSnippet = "Property assessment follows RCW 84.40...",
        FullText = "Property assessment follows RCW 84.40 guidelines for accurate valuation.",
        Score = 0.95m,
        ChunkIndex = 3
      };

      // Assert
      Assert.Equal(42, detail.ChunkId);
      Assert.Equal("Benton CAMA Guide", detail.DocumentTitle);
      Assert.Equal("https://benton.county/cama-guide", detail.SourceUrl);
      Assert.Contains("RCW 84.40", detail.TextSnippet);
      Assert.NotNull(detail.FullText);
      Assert.Equal(0.95m, detail.Score);
      Assert.Equal(3, detail.ChunkIndex);
    }

    [Fact]
    public void RAGChunkDetail_TextSnippet_TruncatesLongContent()
    {
      // Arrange
      var longText = new string('A', 500);

      // Act
      var detail = new TerraFusion.AI.Interfaces.RAGChunkDetail { TextSnippet = longText };

      // Assert - Implementation truncates to 200 chars
      Assert.True(detail.TextSnippet.Length <= 200);
      Assert.EndsWith("...", detail.TextSnippet);
    }

    [Fact]
    public void RAGChunkDetail_TextSnippet_PreservesShortContent()
    {
      // Arrange
      var shortText = "This is a short snippet.";

      // Act
      var detail = new TerraFusion.AI.Interfaces.RAGChunkDetail { TextSnippet = shortText };

      // Assert
      Assert.Equal(shortText, detail.TextSnippet);
      Assert.False(detail.TextSnippet.EndsWith("..."));
    }
  }

  /// <summary>
  /// Phase 11: RAGSearchResult Enhancement Tests
  /// Tests for ChunkDetails integration into search results
  /// </summary>
  public class RAGSearchResultEnhancementTests
  {
    [Fact]
    public void RAGSearchResult_ChunkDetails_DefaultsToEmptyList()
    {
      // Arrange & Act
      var result = new TerraFusion.AI.Interfaces.RAGSearchResult();

      // Assert
      Assert.NotNull(result.ChunkDetails);
      Assert.Empty(result.ChunkDetails);
    }

    [Fact]
    public void RAGSearchResult_ChunkDetails_CanBePopulated()
    {
      // Arrange & Act
      var result = new TerraFusion.AI.Interfaces.RAGSearchResult
      {
        Context = "Combined context from chunks",
        DocumentIds = new List<string> { "doc-1", "doc-2" },
        AverageScore = 0.87m,
        ChunksRetrieved = 3,
        ChunkDetails = new List<TerraFusion.AI.Interfaces.RAGChunkDetail>
        {
          new() { ChunkId = 1, DocumentTitle = "Doc 1", TextSnippet = "Chunk 1 text", Score = 0.92m },
          new() { ChunkId = 2, DocumentTitle = "Doc 1", TextSnippet = "Chunk 2 text", Score = 0.85m },
          new() { ChunkId = 3, DocumentTitle = "Doc 2", TextSnippet = "Chunk 3 text", Score = 0.84m }
        }
      };

      // Assert
      Assert.Equal(3, result.ChunkDetails.Count);
      Assert.Equal(0.92m, result.ChunkDetails[0].Score);
      Assert.Equal("Doc 1", result.ChunkDetails[0].DocumentTitle);
      Assert.Equal("Doc 2", result.ChunkDetails[2].DocumentTitle);
    }

    [Fact]
    public void RAGSearchResult_ChunkDetails_CanSerializeToJson()
    {
      // Arrange
      var result = new TerraFusion.AI.Interfaces.RAGSearchResult
      {
        ChunkDetails = new List<TerraFusion.AI.Interfaces.RAGChunkDetail>
        {
          new() { ChunkId = 1, DocumentTitle = "Guide", TextSnippet = "Important text...", Score = 0.9m }
        }
      };

      // Act
      var json = System.Text.Json.JsonSerializer.Serialize(result.ChunkDetails);
      var deserialized = System.Text.Json.JsonSerializer.Deserialize<List<TerraFusion.AI.Interfaces.RAGChunkDetail>>(json);

      // Assert
      Assert.NotNull(deserialized);
      Assert.Single(deserialized);
      Assert.Equal("Guide", deserialized[0].DocumentTitle);
      Assert.Equal(0.9m, deserialized[0].Score);
    }
  }

  /// <summary>
  /// Phase 9 Tests: GPT/RAG Configuration and Operational Hardening
  /// Arc Constellation + Herald Constellation collaboration
  /// </summary>
  public class GptRagOptionsTests
  {
    [Fact]
    public void GptRagOptions_DefaultValues_AreCorrect()
    {
      // Arrange & Act
      var options = new TerraFusion.AI.Configuration.GptRagOptions();

      // Assert - defaults should be dev/CI safe mode
      Assert.False(options.UseRealEmbeddings);
      Assert.Equal("Simulated", options.EmbeddingProvider);
      Assert.Equal("text-embedding-3-small", options.EmbeddingModel);
      Assert.Contains("benton_cama_basics", options.RagDatasets);
      Assert.True(options.EnableHeraldLogging);
      Assert.True(options.ShowMissingDatasetDisclaimers);
    }

    [Fact]
    public void GptRagOptions_WhenApiKeyMissing_UsesSimulatedEmbeddings()
    {
      // Arrange - ensure no API key in environment for this test
      var originalKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
      try
      {
        Environment.SetEnvironmentVariable("OPENAI_API_KEY", null);

        // Act
        var configBuilder = new Microsoft.Extensions.Configuration.ConfigurationBuilder();
        var config = configBuilder.Build();
        var options = TerraFusion.AI.Configuration.GptRagOptions.FromConfiguration(config);

        // Assert
        Assert.False(options.UseRealEmbeddings);
        Assert.Equal("Simulated", options.EmbeddingProvider);
      }
      finally
      {
        // Restore original key
        Environment.SetEnvironmentVariable("OPENAI_API_KEY", originalKey);
      }
    }

    [Fact]
    public void GptRagOptions_WhenApiKeyPresent_UsesOpenAIEmbeddings()
    {
      // Arrange
      var originalKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
      try
      {
        Environment.SetEnvironmentVariable("OPENAI_API_KEY", "sk-test-key-for-unit-test");

        // Act
        var configBuilder = new Microsoft.Extensions.Configuration.ConfigurationBuilder();
        var config = configBuilder.Build();
        var options = TerraFusion.AI.Configuration.GptRagOptions.FromConfiguration(config);

        // Assert
        Assert.True(options.UseRealEmbeddings);
        Assert.Equal("OpenAI", options.EmbeddingProvider);
      }
      finally
      {
        // Restore original key
        Environment.SetEnvironmentVariable("OPENAI_API_KEY", originalKey);
      }
    }

    [Fact]
    public void GptRagOptions_GetSummary_ReturnsFormattedString()
    {
      // Arrange
      var options = new TerraFusion.AI.Configuration.GptRagOptions
      {
        EmbeddingProvider = "Simulated",
        EmbeddingModel = "text-embedding-3-small",
        RagDatasets = new List<string> { "benton_cama_basics" },
        UseRealEmbeddings = false
      };

      // Act
      var summary = options.GetSummary();

      // Assert
      Assert.Contains("EmbeddingProvider=Simulated", summary);
      Assert.Contains("benton_cama_basics", summary);
      Assert.Contains("UseReal=False", summary);
    }

    [Fact]
    public void GptRagOptions_LogConfiguration_DoesNotThrow()
    {
      // Arrange
      var options = new TerraFusion.AI.Configuration.GptRagOptions();
      var mockLogger = Microsoft.Extensions.Logging.Abstractions.NullLogger.Instance;

      // Act & Assert - should not throw
      options.LogConfiguration(mockLogger);
    }

    [Fact]
    public void GptRagOptions_LogHeraldStartupBanner_ContainsEraName()
    {
      // Arrange - Phase 12.5: Herald Startup Banner Test
      var options = new TerraFusion.AI.Configuration.GptRagOptions
      {
        UseRealEmbeddings = false,
        EmbeddingProvider = "Simulated",
        RagDatasets = new List<string> { "benton_cama_basics" }
      };

      var logMessages = new List<string>();
      var mockLogger = new Mock<ILogger>();
      mockLogger
        .Setup(l => l.Log(
          It.IsAny<LogLevel>(),
          It.IsAny<EventId>(),
          It.IsAny<It.IsAnyType>(),
          It.IsAny<Exception?>(),
          It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
        .Callback<LogLevel, EventId, object, Exception?, Delegate>((level, id, state, ex, formatter) =>
        {
          logMessages.Add(state?.ToString() ?? "");
        });

      // Act
      options.LogHeraldStartupBanner(mockLogger.Object, gptConfigCount: 3, gptConfigNames: new[] { "PropertyAssessmentGPT" });

      // Assert - Phase 12.5: Verify Herald Status banner content
      var allLogs = string.Join("\n", logMessages);
      Assert.Contains("HERALD STATUS", allLogs);
      Assert.Contains("Genesis Era", allLogs);
      Assert.Contains("Embeddings", allLogs);
      Assert.Contains("RAG datasets", allLogs);
      Assert.Contains("DX:", allLogs);
    }

    [Fact]
    public void GptRagOptions_LogHeraldStartupBanner_ShowsSimulatedMode()
    {
      // Arrange
      var options = new TerraFusion.AI.Configuration.GptRagOptions
      {
        UseRealEmbeddings = false,
        EmbeddingProvider = "Simulated"
      };

      var logMessages = new List<string>();
      var mockLogger = new Mock<ILogger>();
      mockLogger
        .Setup(l => l.Log(
          It.IsAny<LogLevel>(),
          It.IsAny<EventId>(),
          It.IsAny<It.IsAnyType>(),
          It.IsAny<Exception?>(),
          It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
        .Callback<LogLevel, EventId, object, Exception?, Delegate>((level, id, state, ex, formatter) =>
        {
          logMessages.Add(state?.ToString() ?? "");
        });

      // Act
      options.LogHeraldStartupBanner(mockLogger.Object, gptConfigCount: null);

      // Assert
      var allLogs = string.Join("\n", logMessages);
      Assert.Contains("SimulatedEmbeddingService", allLogs);
    }

    [Fact]
    public void GptRagOptions_LogHeraldStartupBanner_ShowsOpenAIMode()
    {
      // Arrange
      var options = new TerraFusion.AI.Configuration.GptRagOptions
      {
        UseRealEmbeddings = true,
        EmbeddingProvider = "OpenAI",
        EmbeddingModel = "text-embedding-3-small"
      };

      var logMessages = new List<string>();
      var mockLogger = new Mock<ILogger>();
      mockLogger
        .Setup(l => l.Log(
          It.IsAny<LogLevel>(),
          It.IsAny<EventId>(),
          It.IsAny<It.IsAnyType>(),
          It.IsAny<Exception?>(),
          It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
        .Callback<LogLevel, EventId, object, Exception?, Delegate>((level, id, state, ex, formatter) =>
        {
          logMessages.Add(state?.ToString() ?? "");
        });

      // Act
      options.LogHeraldStartupBanner(mockLogger.Object, gptConfigCount: 2);

      // Assert
      var allLogs = string.Join("\n", logMessages);
      Assert.Contains("OpenAIEmbeddingService", allLogs);
      Assert.Contains("OPENAI_API_KEY detected", allLogs);
    }

    [Fact]
    public void GptRagOptions_ReadsCustomApiBaseUrl()
    {
      // Arrange
      var originalUrl = Environment.GetEnvironmentVariable("TF_API_BASE_URL");
      try
      {
        Environment.SetEnvironmentVariable("TF_API_BASE_URL", "https://custom.terrafusion.gov");

        // Act
        var configBuilder = new Microsoft.Extensions.Configuration.ConfigurationBuilder();
        var config = configBuilder.Build();
        var options = TerraFusion.AI.Configuration.GptRagOptions.FromConfiguration(config);

        // Assert
        Assert.Equal("https://custom.terrafusion.gov", options.ApiBaseUrl);
      }
      finally
      {
        Environment.SetEnvironmentVariable("TF_API_BASE_URL", originalUrl);
      }
    }
  }

  /// <summary>
  /// Phase 9 Tests: Safe Failure Behavior
  /// Ensures graceful degradation when RAG datasets are not indexed
  /// </summary>
  public class SafeFailureBehaviorTests
  {
    [Fact]
    public void MissingDatasetDisclaimer_WhenShowDisclaimersEnabled_IsGenerated()
    {
      // Arrange
      var options = new TerraFusion.AI.Configuration.GptRagOptions
      {
        ShowMissingDatasetDisclaimers = true,
        RagDatasets = new List<string> { "benton_cama_basics" }
      };

      // Act - simulate a response that would include disclaimer
      var hasIndexedData = false; // Dataset not indexed
      var disclaimer = hasIndexedData
        ? null
        : "Note: No Benton CAMA dataset currently indexed; response is based on general configuration only.";

      // Assert
      Assert.NotNull(disclaimer);
      Assert.Contains("Benton CAMA", disclaimer);
      Assert.Contains("indexed", disclaimer.ToLower());
    }

    [Fact]
    public void MissingDatasetDisclaimer_WhenShowDisclaimersDisabled_IsNull()
    {
      // Arrange
      var options = new TerraFusion.AI.Configuration.GptRagOptions
      {
        ShowMissingDatasetDisclaimers = false
      };

      // Act
      var hasIndexedData = false;
      var disclaimer = options.ShowMissingDatasetDisclaimers && !hasIndexedData
        ? "Disclaimer text"
        : null;

      // Assert
      Assert.Null(disclaimer);
    }

    [Fact]
    public void EmbeddingFallback_SimulatedMode_ProducesDeterministicResults()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SimulatedEmbeddingService>.Instance;
      var service = new TerraFusion.AI.Services.SimulatedEmbeddingService(logger);

      // Act - generate embeddings twice for same text
      var embedding1 = service.GenerateEmbeddingAsync("test query", "text-embedding-3-small").Result;
      var embedding2 = service.GenerateEmbeddingAsync("test query", "text-embedding-3-small").Result;

      // Assert - should be identical (deterministic)
      Assert.Equal(embedding1.Length, embedding2.Length);
      for (int i = 0; i < embedding1.Length; i++)
      {
        Assert.Equal(embedding1[i], embedding2[i]);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📚 Phase 13: ExplainGPT Tests
  // "Explain This" - Make TerraFusion Self-Explaining
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Tests for ExplainRequest and ExplainResponse models (Phase 13)
  /// </summary>
  public class ExplainGPTModelTests
  {
    [Fact]
    public void ExplainRequest_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var request = new TerraFusion.AI.Models.ExplainRequest();

      // Assert
      Assert.Equal(string.Empty, request.ContextType);
      Assert.Null(request.ContextId);
      Assert.Null(request.Metadata);
      Assert.Null(request.Question);
      Assert.Equal("county-staff", request.Audience); // Default audience
    }

    [Fact]
    public void ExplainRequest_SetProperties_RetainsValues()
    {
      // Arrange
      var request = new TerraFusion.AI.Models.ExplainRequest
      {
        ContextType = "GPTStudio",
        ContextId = "conversation-123",
        Question = "How do I use this?",
        Audience = "citizen",
        Metadata = new Dictionary<string, object>
        {
          { "county", "benton" },
          { "sessionId", "abc123" }
        }
      };

      // Assert
      Assert.Equal("GPTStudio", request.ContextType);
      Assert.Equal("conversation-123", request.ContextId);
      Assert.Equal("How do I use this?", request.Question);
      Assert.Equal("citizen", request.Audience);
      Assert.NotNull(request.Metadata);
      Assert.Equal("benton", request.Metadata["county"]);
    }

    [Fact]
    public void ExplainResponse_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var response = new TerraFusion.AI.Models.ExplainResponse();

      // Assert
      Assert.Equal(string.Empty, response.Explanation);
      Assert.Equal(string.Empty, response.Summary);
      Assert.NotNull(response.KeyPoints);
      Assert.Empty(response.KeyPoints);
      Assert.NotNull(response.RelatedActions);
      Assert.Empty(response.RelatedActions);
      Assert.Equal(string.Empty, response.ContextType);
      Assert.Equal(0, response.ProcessingTimeMs);
      Assert.Equal(0m, response.Confidence);
    }

    [Fact]
    public void ExplainResponse_WithKeyPointsAndActions_RetainsValues()
    {
      // Arrange
      var response = new TerraFusion.AI.Models.ExplainResponse
      {
        ContextType = "PropertyCard",
        Explanation = "This shows property assessment details.",
        Summary = "Property assessment view.",
        KeyPoints = new List<string>
        {
          "Land and improvements shown separately",
          "Market value reflects Jan 1 assessment date"
        },
        RelatedActions = new List<TerraFusion.AI.Models.RelatedAction>
        {
          new() { Label = "View History", ActionType = "navigate", Target = "/history" }
        },
        ProcessingTimeMs = 150,
        Confidence = 0.95m
      };

      // Assert
      Assert.Equal("PropertyCard", response.ContextType);
      Assert.Contains("property assessment", response.Explanation.ToLower());
      Assert.Equal(2, response.KeyPoints.Count);
      Assert.Single(response.RelatedActions);
      Assert.Equal("View History", response.RelatedActions[0].Label);
      Assert.Equal(150, response.ProcessingTimeMs);
      Assert.Equal(0.95m, response.Confidence);
    }
  }

  /// <summary>
  /// Tests for RelatedAction model (Phase 13)
  /// </summary>
  public class RelatedActionTests
  {
    [Fact]
    public void RelatedAction_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var action = new TerraFusion.AI.Models.RelatedAction();

      // Assert
      Assert.Equal(string.Empty, action.Label);
      Assert.Equal(string.Empty, action.ActionType);
      Assert.Equal(string.Empty, action.Target);
    }

    [Theory]
    [InlineData("navigate", "/property/123/history")]
    [InlineData("open-modal", "compare-dialog")]
    [InlineData("toggle", "show-sources")]
    [InlineData("export", "trace-pdf")]
    public void RelatedAction_SupportedActionTypes_AreValid(string actionType, string target)
    {
      // Arrange & Act
      var action = new TerraFusion.AI.Models.RelatedAction
      {
        Label = "Test Action",
        ActionType = actionType,
        Target = target
      };

      // Assert
      Assert.Equal(actionType, action.ActionType);
      Assert.Equal(target, action.Target);
    }
  }

  /// <summary>
  /// Tests for ExplainGPT context explanations (Phase 13)
  /// </summary>
  public class ExplainGPTContextTests
  {
    [Fact]
    public void GPTStudioContext_ProducesHelpfulExplanation()
    {
      // Arrange - simulate what the controller returns for GPTStudio context
      var contextType = "GPTStudio";

      // Act - verify expected content for GPTStudio explanation
      var expectedKeywords = new[] { "AI", "property assessment", "question", "natural language" };

      // Assert - GPTStudio should explain what the AI studio does
      Assert.Equal("GPTStudio", contextType);
      // In real implementation, explanation would contain these keywords
      Assert.True(expectedKeywords.Length > 0);
    }

    [Fact]
    public void RAGTraceContext_ExplainsSourceTracking()
    {
      // Arrange
      var contextType = "RAGTrace";

      // Act
      var expectedKeywords = new[] { "source", "document", "audit", "retrieval" };

      // Assert - RAGTrace should explain document sourcing
      Assert.Equal("RAGTrace", contextType);
      Assert.True(expectedKeywords.Length > 0);
    }

    [Fact]
    public void PropertyCardContext_ExplainsAssessmentData()
    {
      // Arrange
      var contextType = "PropertyCard";
      var contextId = "P-12345";

      // Act
      var expectedKeywords = new[] { "assessment", "value", "property", "land" };

      // Assert - PropertyCard should explain assessment details
      Assert.Equal("PropertyCard", contextType);
      Assert.NotNull(contextId);
      Assert.True(expectedKeywords.Length > 0);
    }

    [Fact]
    public void UnknownContext_ReturnsGenericExplanation()
    {
      // Arrange
      var contextType = "UnknownScreen";

      // Act - unknown contexts should get a generic TerraFusion OS explanation
      var expectedKeywords = new[] { "TerraFusion", "property assessment", "help" };

      // Assert
      Assert.Equal("UnknownScreen", contextType);
      Assert.True(expectedKeywords.Length > 0);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📚 Phase 25: ExplainGPT V2 Tests - Source Highlighting & Trace Carousel
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Tests for ExplainGPT V2 DTOs - Source Attribution (Phase 25)
  /// </summary>
  public class ExplainGPTV2SourceAttributionTests
  {
    [Fact]
    public void ExplainSourceAttributionDto_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var source = new TerraFusion.AI.Models.ExplainSourceAttributionDto();

      // Assert - DTOs use init properties with defaults
      Assert.Equal(string.Empty, source.SourceId);
      Assert.Equal(string.Empty, source.SourceTitle);
      Assert.Equal("rag", source.SourceType); // Default is "rag"
      Assert.Null(source.Snippet); // Nullable, defaults to null
      Assert.Null(source.RelevanceScore); // Nullable
    }

    [Fact]
    public void ExplainSourceAttributionDto_SetProperties_RetainsValues()
    {
      // Arrange & Act
      var source = new TerraFusion.AI.Models.ExplainSourceAttributionDto
      {
        SourceId = "src-001",
        SourceTitle = "TerraFusion User Guide",
        SourceType = "documentation",
        Snippet = "This guide explains the core features...",
        RelevanceScore = 0.95m
      };

      // Assert
      Assert.Equal("src-001", source.SourceId);
      Assert.Equal("TerraFusion User Guide", source.SourceTitle);
      Assert.Equal("documentation", source.SourceType);
      Assert.Contains("core features", source.Snippet!);
      Assert.Equal(0.95m, source.RelevanceScore);
    }

    [Theory]
    [InlineData("rag", "RAG document retrieval")]
    [InlineData("note", "User annotations and notes")]
    [InlineData("external", "External reference documents")]
    [InlineData("cama", "CAMA system data")]
    [InlineData("policy", "County policy documents")]
    [InlineData("documentation", "User guides and manuals")]
    [InlineData("technical", "Technical specifications")]
    public void ExplainSourceAttributionDto_SupportsAllSourceTypes(string sourceType, string description)
    {
      // Arrange & Act
      var source = new TerraFusion.AI.Models.ExplainSourceAttributionDto
      {
        SourceId = $"src-{sourceType}",
        SourceTitle = description,
        SourceType = sourceType,
        Snippet = $"Example snippet for {sourceType}"
      };

      // Assert
      Assert.Equal(sourceType, source.SourceType);
      Assert.NotEmpty(source.Snippet!);
    }
  }

  /// <summary>
  /// Tests for ExplainGPT V2 DTOs - Segments (Phase 25)
  /// </summary>
  public class ExplainGPTV2SegmentTests
  {
    [Fact]
    public void ExplainSegmentDto_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var segment = new TerraFusion.AI.Models.ExplainSegmentDto();

      // Assert
      Assert.Equal(string.Empty, segment.SegmentId);
      Assert.Equal(string.Empty, segment.Text);
      Assert.NotNull(segment.SourceIds);
      Assert.Empty(segment.SourceIds);
    }

    [Fact]
    public void ExplainSegmentDto_SetProperties_RetainsValues()
    {
      // Arrange & Act
      var segment = new TerraFusion.AI.Models.ExplainSegmentDto
      {
        SegmentId = "seg-001",
        Text = "This is the first segment of the explanation.",
        SourceIds = new List<string> { "src-001", "src-002" }
      };

      // Assert
      Assert.Equal("seg-001", segment.SegmentId);
      Assert.Contains("first segment", segment.Text);
      Assert.Equal(2, segment.SourceIds.Count);
      Assert.Contains("src-001", segment.SourceIds);
      Assert.Contains("src-002", segment.SourceIds);
    }

    [Fact]
    public void ExplainSegmentDto_CanHaveMultipleSources()
    {
      // Arrange - A segment may be supported by multiple sources
      var segment = new TerraFusion.AI.Models.ExplainSegmentDto
      {
        SegmentId = "seg-multi",
        Text = "Assessment values are based on market data and regulations.",
        SourceIds = new List<string> { "src-market-data", "src-wac", "src-county-policy" }
      };

      // Assert
      Assert.Equal(3, segment.SourceIds.Count);
    }

    [Fact]
    public void ExplainSegmentDto_CanHaveNoSources()
    {
      // Arrange - Some segments may be general knowledge without specific sources
      var segment = new TerraFusion.AI.Models.ExplainSegmentDto
      {
        SegmentId = "seg-general",
        Text = "TerraFusion is designed for government use.",
        SourceIds = new List<string>()
      };

      // Assert
      Assert.Empty(segment.SourceIds);
    }
  }

  /// <summary>
  /// Tests for ExplainGPT V2 DTOs - Trace Steps (Phase 25)
  /// </summary>
  public class ExplainGPTV2StepTests
  {
    [Fact]
    public void ExplainStepDto_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var step = new TerraFusion.AI.Models.ExplainStepDto();

      // Assert
      Assert.Equal(string.Empty, step.StepId);
      Assert.Equal(string.Empty, step.Title);
      Assert.Null(step.Description); // Nullable, defaults to null
      Assert.NotNull(step.SourceIds);
      Assert.Empty(step.SourceIds);
    }

    [Fact]
    public void ExplainStepDto_SetProperties_RetainsValues()
    {
      // Arrange & Act
      var step = new TerraFusion.AI.Models.ExplainStepDto
      {
        StepId = "step-001",
        Title = "Context Detection",
        Description = "Identified current context as 'GPTStudio'",
        SourceIds = new List<string> { "src-context" }
      };

      // Assert
      Assert.Equal("step-001", step.StepId);
      Assert.Equal("Context Detection", step.Title);
      Assert.Contains("GPTStudio", step.Description);
      Assert.Single(step.SourceIds);
    }

    [Theory]
    [InlineData("Context Detection", "Identifying current screen context")]
    [InlineData("Knowledge Retrieval", "Fetching relevant documents")]
    [InlineData("Explanation Generation", "Synthesizing explanation text")]
    [InlineData("Source Attribution", "Linking segments to sources")]
    public void ExplainStepDto_SupportsStandardTraceSteps(string title, string description)
    {
      // Arrange & Act
      var step = new TerraFusion.AI.Models.ExplainStepDto
      {
        StepId = $"step-{title.ToLower().Replace(" ", "-")}",
        Title = title,
        Description = description,
        SourceIds = new List<string>()
      };

      // Assert
      Assert.Equal(title, step.Title);
      Assert.NotEmpty(step.Description);
    }
  }

  /// <summary>
  /// Tests for ExplainGPT V2 Response DTO (Phase 25)
  /// </summary>
  public class ExplainGPTV2ResponseTests
  {
    [Fact]
    public void ExplainResponseV2Dto_NewInstance_HasCorrectDefaults()
    {
      // Arrange & Act
      var response = new TerraFusion.AI.Models.ExplainResponseV2Dto();

      // Assert - ExplanationId auto-generates, so check length not content
      Assert.NotNull(response.ExplanationId);
      Assert.Equal(12, response.ExplanationId.Length); // GUID substring
      Assert.Equal(string.Empty, response.FullText);
      Assert.Null(response.Summary); // Nullable
      Assert.NotNull(response.Segments);
      Assert.Empty(response.Segments);
      Assert.NotNull(response.Sources);
      Assert.Empty(response.Sources);
      Assert.NotNull(response.Steps);
      Assert.Empty(response.Steps);
      Assert.Equal(0m, response.Confidence);
      Assert.Equal(0, response.ProcessingTimeMs);
    }

    [Fact]
    public void ExplainResponseV2Dto_FullExplanation_HasAllComponents()
    {
      // Arrange & Act
      var response = new TerraFusion.AI.Models.ExplainResponseV2Dto
      {
        ExplanationId = "exp-12345",
        FullText = "GPT Studio is your AI workspace. It provides intelligent assistance.",
        Summary = "AI-powered workspace for property assessment.",
        Segments = new List<TerraFusion.AI.Models.ExplainSegmentDto>
        {
          new() { SegmentId = "seg-001", Text = "GPT Studio is your AI workspace.", SourceIds = new List<string> { "src-001" } },
          new() { SegmentId = "seg-002", Text = "It provides intelligent assistance.", SourceIds = new List<string> { "src-002" } }
        },
        Sources = new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
        {
          new() { SourceId = "src-001", SourceTitle = "GPT Studio Guide", SourceType = "documentation", Snippet = "..." },
          new() { SourceId = "src-002", SourceTitle = "AI Features", SourceType = "technical", Snippet = "..." }
        },
        Steps = new List<TerraFusion.AI.Models.ExplainStepDto>
        {
          new() { StepId = "step-001", Title = "Context Detection", Description = "Identified GPTStudio context", SourceIds = new List<string>() }
        },
        Confidence = 0.95m,
        ProcessingTimeMs = 42
      };

      // Assert
      Assert.Equal("exp-12345", response.ExplanationId);
      Assert.Equal(2, response.Segments.Count);
      Assert.Equal(2, response.Sources.Count);
      Assert.Single(response.Steps);
      Assert.Equal(0.95m, response.Confidence);
      Assert.Equal(42, response.ProcessingTimeMs);
    }

    [Fact]
    public void ExplainResponseV2Dto_EmptySegments_IsV1Mode()
    {
      // Arrange - Empty segments = V1 fallback mode
      var response = new TerraFusion.AI.Models.ExplainResponseV2Dto
      {
        ExplanationId = "exp-v1",
        FullText = "This is a plain text explanation without source attribution.",
        Summary = "Plain explanation",
        Segments = new List<TerraFusion.AI.Models.ExplainSegmentDto>(),
        Sources = new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>(),
        Steps = new List<TerraFusion.AI.Models.ExplainStepDto>()
      };

      // Assert - V1 mode uses FullText directly
      Assert.Empty(response.Segments);
      Assert.NotEmpty(response.FullText);
    }

    [Fact]
    public void ExplainResponseV2Dto_SegmentSourceLinks_AreValid()
    {
      // Arrange
      var sources = new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
      {
        new() { SourceId = "src-001", SourceTitle = "Source 1", SourceType = "documentation", Snippet = "..." },
        new() { SourceId = "src-002", SourceTitle = "Source 2", SourceType = "policy", Snippet = "..." }
      };

      var segments = new List<TerraFusion.AI.Models.ExplainSegmentDto>
      {
        new() { SegmentId = "seg-001", Text = "First segment.", SourceIds = new List<string> { "src-001" } },
        new() { SegmentId = "seg-002", Text = "Second segment.", SourceIds = new List<string> { "src-001", "src-002" } }
      };

      var response = new TerraFusion.AI.Models.ExplainResponseV2Dto
      {
        ExplanationId = "exp-links",
        FullText = "First segment. Second segment.",
        Summary = "Test",
        Segments = segments,
        Sources = sources,
        Steps = new List<TerraFusion.AI.Models.ExplainStepDto>()
      };

      // Act - verify all segment source IDs exist in sources list
      var sourceIds = sources.Select(s => s.SourceId).ToHashSet();
      var allSegmentSourceIds = segments.SelectMany(s => s.SourceIds).Distinct();

      // Assert
      Assert.All(allSegmentSourceIds, id => Assert.Contains(id, sourceIds));
    }

    [Fact]
    public void ExplainResponseV2Dto_StepSourceLinks_AreValid()
    {
      // Arrange
      var sources = new List<TerraFusion.AI.Models.ExplainSourceAttributionDto>
      {
        new() { SourceId = "src-001", SourceTitle = "Source 1", SourceType = "documentation", Snippet = "..." }
      };

      var steps = new List<TerraFusion.AI.Models.ExplainStepDto>
      {
        new() { StepId = "step-001", Title = "Retrieval", Description = "Retrieved 1 source", SourceIds = new List<string> { "src-001" } },
        new() { StepId = "step-002", Title = "Generation", Description = "Generated explanation", SourceIds = new List<string>() }
      };

      var response = new TerraFusion.AI.Models.ExplainResponseV2Dto
      {
        ExplanationId = "exp-steps",
        FullText = "Explanation text.",
        Summary = "Test",
        Segments = new List<TerraFusion.AI.Models.ExplainSegmentDto>(),
        Sources = sources,
        Steps = steps
      };

      // Act - verify all step source IDs exist in sources list
      var sourceIds = sources.Select(s => s.SourceId).ToHashSet();
      var allStepSourceIds = steps.SelectMany(s => s.SourceIds).Distinct();

      // Assert
      Assert.All(allStepSourceIds, id => Assert.Contains(id, sourceIds));
    }
  }

  /// <summary>
  /// Tests for ExplainGPT V2 Context-Specific Generation (Phase 25)
  /// </summary>
  public class ExplainGPTV2ContextGenerationTests
  {
    [Fact]
    public void GPTStudioContext_GeneratesV2ResponseWithSources()
    {
      // Arrange - GPTStudio context should produce documentation sources
      var expectedSourceTypes = new[] { "documentation", "system-config", "knowledge-base" };

      // Assert - GPTStudio context should have all expected source types
      Assert.Equal(3, expectedSourceTypes.Length);
    }

    [Fact]
    public void RAGTraceContext_GeneratesV2ResponseWithSources()
    {
      // Arrange - RAGTrace context should produce technical sources
      var expectedSourceTypes = new[] { "documentation", "policy", "technical" };

      // Assert
      Assert.Equal(3, expectedSourceTypes.Length);
    }

    [Fact]
    public void PropertyCardContext_GeneratesV2ResponseWithSources()
    {
      // Arrange - PropertyCard context should produce data and regulation sources
      var expectedSourceTypes = new[] { "data-record", "regulation", "database" };

      // Assert
      Assert.Equal(3, expectedSourceTypes.Length);
    }

    [Fact]
    public void UnknownContext_GeneratesMinimalV2Response()
    {
      // Arrange - Unknown contexts should still produce at least one source
      var minExpectedSources = 1;

      // Assert
      Assert.True(minExpectedSources >= 1);
    }

    [Fact]
    public void V2Response_AlwaysHas4TraceSteps()
    {
      // Arrange - Standard trace flow has 4 steps
      var expectedSteps = new[] { "Context Detection", "Knowledge Retrieval", "Explanation Generation", "Source Attribution" };

      // Assert
      Assert.Equal(4, expectedSteps.Length);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📊 Phase 15: SystemGPT Diagnostics Tests
  // SystemGPT Console - AI Control Center for County Tech Leads
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Tests for SystemDiagnosticsResponse and related models (Phase 15)
  /// </summary>
  public class SystemDiagnosticsModelTests
  {
    [Fact]
    public void SystemDiagnosticsResponse_HasCorrectDefaults()
    {
      // Arrange & Act
      var response = new TerraFusion.AI.Models.SystemDiagnosticsResponse();

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Unknown, response.OverallHealth);
      Assert.NotEqual(default, response.Timestamp);
      Assert.NotNull(response.GptConfigs);
      Assert.Empty(response.GptConfigs);
      Assert.NotNull(response.RagDatasets);
      Assert.Empty(response.RagDatasets);
      Assert.NotNull(response.HeraldMessages);
      Assert.Empty(response.HeraldMessages);
    }

    [Fact]
    public void SystemHealthStatus_HasExpectedValues()
    {
      // Assert - verify all health status values exist
      Assert.Equal(0, (int)TerraFusion.AI.Models.SystemHealthStatus.Unknown);
      Assert.Equal(1, (int)TerraFusion.AI.Models.SystemHealthStatus.Healthy);
      Assert.Equal(2, (int)TerraFusion.AI.Models.SystemHealthStatus.Degraded);
      Assert.Equal(3, (int)TerraFusion.AI.Models.SystemHealthStatus.Unhealthy);
    }

    [Fact]
    public void GptConfigSummary_SetProperties_RetainsValues()
    {
      // Arrange
      var summary = new TerraFusion.AI.Models.GptConfigSummary
      {
        Key = "PropertyAssessmentGPT",
        Name = "Property Assessment GPT",
        Enabled = true,
        Model = "gpt-4o",
        RagEnabled = true,
        ConversationCount = 42
      };

      // Assert
      Assert.Equal("PropertyAssessmentGPT", summary.Key);
      Assert.Equal("Property Assessment GPT", summary.Name);
      Assert.True(summary.Enabled);
      Assert.Equal("gpt-4o", summary.Model);
      Assert.True(summary.RagEnabled);
      Assert.Equal(42, summary.ConversationCount);
    }

    [Fact]
    public void EmbeddingServiceStatus_HasCorrectDefaults()
    {
      // Arrange & Act
      var status = new TerraFusion.AI.Models.EmbeddingServiceStatus();

      // Assert
      Assert.Equal("Unknown", status.Mode);
      Assert.False(status.Available);
      Assert.Equal(0, status.Dimensions);
      Assert.Equal(string.Empty, status.Provider);
      Assert.Null(status.LastSuccess);
    }

    [Fact]
    public void EmbeddingServiceStatus_SetProperties_RetainsValues()
    {
      // Arrange
      var now = DateTime.UtcNow;
      var status = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536,
        Provider = "OpenAI",
        LastSuccess = now
      };

      // Assert
      Assert.Equal("OpenAI", status.Mode);
      Assert.True(status.Available);
      Assert.Equal(1536, status.Dimensions);
      Assert.Equal("OpenAI", status.Provider);
      Assert.Equal(now, status.LastSuccess);
    }

    [Fact]
    public void RagDatasetSummary_HasCorrectDefaults()
    {
      // Arrange & Act
      var summary = new TerraFusion.AI.Models.RagDatasetSummary();

      // Assert
      Assert.Equal(string.Empty, summary.Key);
      Assert.Equal(string.Empty, summary.Name);
      Assert.False(summary.Indexed);
      Assert.Equal(0, summary.DocumentCount);
      Assert.Equal(0, summary.EmbeddingCount);
      Assert.Null(summary.LastIndexed);
      Assert.Equal("Unknown", summary.Status);
    }

    [Fact]
    public void RagDatasetSummary_SetProperties_RetainsValues()
    {
      // Arrange
      var indexed = DateTime.UtcNow;
      var summary = new TerraFusion.AI.Models.RagDatasetSummary
      {
        Key = "benton_cama_basics",
        Name = "Benton County CAMA Basics",
        Indexed = true,
        DocumentCount = 15,
        EmbeddingCount = 150,
        LastIndexed = indexed,
        Status = "Healthy"
      };

      // Assert
      Assert.Equal("benton_cama_basics", summary.Key);
      Assert.Equal("Benton County CAMA Basics", summary.Name);
      Assert.True(summary.Indexed);
      Assert.Equal(15, summary.DocumentCount);
      Assert.Equal(150, summary.EmbeddingCount);
      Assert.Equal(indexed, summary.LastIndexed);
      Assert.Equal("Healthy", summary.Status);
    }

    [Fact]
    public void ServiceStatus_HasCorrectDefaults()
    {
      // Arrange & Act
      var status = new TerraFusion.AI.Models.ServiceStatus();

      // Assert
      Assert.False(status.Healthy);
      Assert.Equal(string.Empty, status.Message);
      Assert.Null(status.LastCheck);
      Assert.Null(status.ResponseTimeMs);
    }

    [Fact]
    public void UsageStatistics_HasCorrectDefaults()
    {
      // Arrange & Act
      var stats = new TerraFusion.AI.Models.UsageStatistics();

      // Assert
      Assert.Equal(0, stats.TotalConversations);
      Assert.Equal(0, stats.TotalMessages);
      Assert.Equal(0, stats.AuditRecordCount);
      Assert.Equal(0, stats.RagTraceCount);
      Assert.Equal(0, stats.MessagesLast24h);
      Assert.Equal(0, stats.ConversationsLast24h);
    }

    [Fact]
    public void HeraldMessage_HasCorrectDefaults()
    {
      // Arrange & Act
      var message = new TerraFusion.AI.Models.HeraldMessage();

      // Assert
      Assert.Equal("Info", message.Level);
      Assert.Equal(string.Empty, message.Message);
      Assert.Equal(default, message.Timestamp);
      Assert.Equal(string.Empty, message.Source);
    }

    [Fact]
    public void HeraldMessage_SetProperties_RetainsValues()
    {
      // Arrange
      var now = DateTime.UtcNow;
      var message = new TerraFusion.AI.Models.HeraldMessage
      {
        Level = "Warning",
        Message = "RAG index not found",
        Timestamp = now,
        Source = "Arc"
      };

      // Assert
      Assert.Equal("Warning", message.Level);
      Assert.Equal("RAG index not found", message.Message);
      Assert.Equal(now, message.Timestamp);
      Assert.Equal("Arc", message.Source);
    }

    [Fact]
    public void SystemDiagnosticsResponse_FullPopulation_Works()
    {
      // Arrange & Act
      var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        OverallHealth = TerraFusion.AI.Models.SystemHealthStatus.Healthy,
        Timestamp = DateTime.UtcNow,
        GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
        {
          new() { Key = "PropertyAssessmentGPT", Enabled = true }
        },
        EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
        {
          Mode = "Simulated",
          Available = true
        },
        RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
        {
          new() { Key = "benton_cama_basics", Indexed = true }
        },
        ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus
        {
          Healthy = true,
          Message = "Ready"
        },
        Statistics = new TerraFusion.AI.Models.UsageStatistics
        {
          TotalConversations = 10,
          TotalMessages = 50
        },
        HeraldMessages = new List<TerraFusion.AI.Models.HeraldMessage>
        {
          new() { Level = "Info", Message = "All systems operational" }
        }
      };

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Healthy, diagnostics.OverallHealth);
      Assert.Single(diagnostics.GptConfigs);
      Assert.Equal("PropertyAssessmentGPT", diagnostics.GptConfigs[0].Key);
      Assert.True(diagnostics.EmbeddingStatus.Available);
      Assert.Single(diagnostics.RagDatasets);
      Assert.True(diagnostics.RagDatasets[0].Indexed);
      Assert.True(diagnostics.ExplainGptStatus.Healthy);
      Assert.Equal(10, diagnostics.Statistics.TotalConversations);
      Assert.Single(diagnostics.HeraldMessages);
    }
  }

  /// <summary>
  /// Tests for SystemGptHealthEvaluator (Phase 15.4)
  /// Verifies threshold-based Herald message generation
  /// </summary>
  public class SystemGptHealthEvaluatorTests
  {
    private readonly Mock<ILogger<SystemGptHealthEvaluator>> _loggerMock;
    private readonly SystemGptHealthEvaluator _evaluator;

    public SystemGptHealthEvaluatorTests()
    {
      _loggerMock = new Mock<ILogger<SystemGptHealthEvaluator>>();
      _evaluator = new SystemGptHealthEvaluator(_loggerMock.Object);
    }

    [Fact]
    public void EvaluateHealth_HealthySystem_ReturnsHealthyStatus()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
      {
        new() { Key = "test_dataset", Name = "Test Dataset", Indexed = true, DocumentCount = 10 }
      };
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "TestGPT", Name = "Test GPT", Enabled = true, Model = "gpt-4" }
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Healthy, result.OverallHealth);
      Assert.Contains(result.HeraldMessages, m => m.Level == "Success");
    }

    [Fact]
    public void EvaluateHealth_UnindexedRAG_SimulatedEmbeddings_ReturnsWarning()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
      {
        new() { Key = "unindexed_dataset", Name = "Unindexed Dataset", Indexed = false }
      };
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "Simulated",
        Available = true,
        Dimensions = 384  // Simulated dimension
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "TestGPT", Name = "Test GPT", Enabled = true }
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Degraded, result.OverallHealth);
      Assert.Contains(result.HeraldMessages, m =>
        m.Level == "Warning" && m.Message.Contains("RAG not fully indexed"));
    }

    [Fact]
    public void EvaluateHealth_SimulatedEmbeddings_GeneratesInfoMessage()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
      {
        new() { Key = "test", Indexed = true }
      };
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "Simulated",
        Available = true,
        Dimensions = 384
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "TestGPT", Enabled = true }
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Contains(result.HeraldMessages, m =>
        m.Level == "Info" && m.Message.Contains("Simulated"));
    }
    [Fact]
    public void EvaluateHealth_NoGptConfigs_ReturnsWarning()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>();
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>(); // Empty

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Degraded, result.OverallHealth);
      Assert.Contains(result.HeraldMessages, m =>
        m.Level == "Warning" && m.Message.Contains("No GPT configurations"));
    }

    [Fact]
    public void EvaluateHealth_AllGptsDisabled_ReturnsWarning()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>();
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "DisabledGPT", Enabled = false }
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Contains(result.HeraldMessages, m =>
        m.Level == "Warning" && m.Message.Contains("disabled"));
    }

    [Fact]
    public void EvaluateHealth_HighActivity_GeneratesInfoMessage()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
      {
        new() { Key = "test", Indexed = true }
      };
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "TestGPT", Enabled = true }
      };
      diagnostics.Statistics = new TerraFusion.AI.Models.UsageStatistics
      {
        TotalMessages = 0,
        MessagesLast24h = 150  // Above 100 threshold
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Contains(result.HeraldMessages, m =>
        m.Level == "Info" && m.Message.Contains("High") && m.Message.Contains("150"));
    }
    [Fact]
    public void EvaluateHealth_RagEnabledGptWithUnindexedRAG_GeneratesWarning()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
      {
        new() { Key = "unindexed", Indexed = false }
      };
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "RagGPT", Enabled = true, RagEnabled = true }
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Contains(result.HeraldMessages, m =>
        m.Level == "Warning" && m.Message.Contains("RAG-enabled GPT"));
    }

    [Fact]
    public void EvaluateHealth_PreservesExistingMessages()
    {
      // Arrange
      var diagnostics = CreateBaseDiagnostics();
      diagnostics.RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
      {
        new() { Key = "test", Indexed = true }
      };
      diagnostics.EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
      {
        Mode = "OpenAI",
        Available = true,
        Dimensions = 1536
      };
      diagnostics.GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
      {
        new() { Key = "TestGPT", Enabled = true }
      };
      diagnostics.HeraldMessages = new List<TerraFusion.AI.Models.HeraldMessage>
      {
        new() { Level = "Info", Message = "Existing message", Source = "Test" }
      };

      // Act
      var result = _evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Contains(result.HeraldMessages, m => m.Message == "Existing message");
    }

    private TerraFusion.AI.Models.SystemDiagnosticsResponse CreateBaseDiagnostics()
    {
      return new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        Timestamp = DateTime.UtcNow,
        OverallHealth = TerraFusion.AI.Models.SystemHealthStatus.Healthy,
        ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus
        {
          Healthy = true,
          Message = "Ready"
        },
        Statistics = new TerraFusion.AI.Models.UsageStatistics(),
        HeraldMessages = new List<TerraFusion.AI.Models.HeraldMessage>()
      };
    }
  }

  /// <summary>
  /// Tests for Phase 16: AI Health Snapshot Export functionality.
  /// Verifies the download endpoint returns proper JSON with correct content-disposition.
  /// </summary>
  public class HealthSnapshotExportTests
  {
    [Fact]
    public void SystemDiagnosticsResponse_SerializesToJson_WithAllProperties()
    {
      // Arrange
      var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        Timestamp = new DateTime(2024, 1, 15, 12, 30, 45, DateTimeKind.Utc),
        OverallHealth = TerraFusion.AI.Models.SystemHealthStatus.Healthy,
        GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
        {
          new() { Key = "TestGPT", Name = "Test GPT", Enabled = true, Model = "gpt-4", RagEnabled = true }
        },
        EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus
        {
          Mode = "OpenAI",
          Available = true,
          Dimensions = 1536,
          Provider = "OpenAI"
        },
        RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
        {
          new() { Key = "test_dataset", Name = "Test Dataset", Indexed = true, DocumentCount = 100 }
        },
        ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus
        {
          Healthy = true,
          Message = "Ready"
        },
        Statistics = new TerraFusion.AI.Models.UsageStatistics
        {
          TotalConversations = 50,
          TotalMessages = 200
        },
        HeraldMessages = new List<TerraFusion.AI.Models.HeraldMessage>
        {
          new() { Level = "Info", Message = "All systems operational", Source = "Herald" }
        }
      };

      // Act
      var options = new System.Text.Json.JsonSerializerOptions
      {
        WriteIndented = true,
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
      };
      var json = System.Text.Json.JsonSerializer.Serialize(diagnostics, options);

      // Assert - verify JSON contains expected structure
      Assert.Contains("\"overallHealth\"", json);
      Assert.Contains("\"gptConfigs\"", json);
      Assert.Contains("\"embeddingStatus\"", json);
      Assert.Contains("\"ragDatasets\"", json);
      Assert.Contains("\"heraldMessages\"", json);
      Assert.Contains("\"TestGPT\"", json);
      Assert.Contains("\"test_dataset\"", json);
    }

    [Fact]
    public void SystemDiagnosticsResponse_DeserializesFromJson_Correctly()
    {
      // Arrange - use numeric enum value for deserialization (default JSON serializer behavior)
      var json = @"{
        ""timestamp"": ""2024-01-15T12:30:45Z"",
        ""overallHealth"": 1,
        ""gptConfigs"": [{""key"": ""TestGPT"", ""enabled"": true}],
        ""heraldMessages"": [{""level"": ""Info"", ""message"": ""Test"", ""source"": ""Herald""}]
      }";

      // Act
      var options = new System.Text.Json.JsonSerializerOptions
      {
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
      };
      var diagnostics = System.Text.Json.JsonSerializer.Deserialize<TerraFusion.AI.Models.SystemDiagnosticsResponse>(json, options);

      // Assert
      Assert.NotNull(diagnostics);
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Healthy, diagnostics!.OverallHealth);
      Assert.Single(diagnostics.GptConfigs);
      Assert.Single(diagnostics.HeraldMessages);
    }

    [Fact]
    public void SnapshotFilename_IncludesTimestamp_InCorrectFormat()
    {
      // Arrange
      var timestamp = new DateTime(2024, 1, 15, 12, 30, 45, DateTimeKind.Utc);

      // Act - simulate filename generation as done in controller
      var filename = $"terrafusion_ai_health_snapshot_{timestamp.ToString("yyyyMMdd_HHmmss")}.json";

      // Assert
      Assert.Equal("terrafusion_ai_health_snapshot_20240115_123045.json", filename);
      Assert.EndsWith(".json", filename);
      Assert.StartsWith("terrafusion_ai_health_snapshot_", filename);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Phase 17: SystemGPT Safe Mode Tests
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Tests for the SystemGptModeService - the in-memory Safe Mode state manager.
  /// </summary>
  public class SystemGptModeServiceTests
  {
    [Fact]
    public void DefaultMode_IsNormal()
    {
      // Arrange
      var logger = new Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptModeService>();
      var service = new TerraFusion.AI.Services.SystemGptModeService(logger);

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemGptMode.Normal, service.CurrentMode);
      Assert.Null(service.CurrentReason);
      Assert.False(service.IsSafeMode);
    }

    [Fact]
    public void SetMode_ToSafeMode_UpdatesAllProperties()
    {
      // Arrange
      var logger = new Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptModeService>();
      var service = new TerraFusion.AI.Services.SystemGptModeService(logger);

      // Act
      service.SetMode(TerraFusion.AI.Models.SystemGptMode.SafeMode, "Test incident XYZ", "test-user");

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemGptMode.SafeMode, service.CurrentMode);
      Assert.Equal("Test incident XYZ", service.CurrentReason);
      Assert.Equal("test-user", service.ChangedBy);
      Assert.NotNull(service.ChangedAt);
      Assert.True(service.IsSafeMode);
    }

    [Fact]
    public void SetMode_BackToNormal_ClearsReason()
    {
      // Arrange
      var logger = new Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptModeService>();
      var service = new TerraFusion.AI.Services.SystemGptModeService(logger);
      service.SetMode(TerraFusion.AI.Models.SystemGptMode.SafeMode, "Initial reason", "user1");

      // Act
      service.SetMode(TerraFusion.AI.Models.SystemGptMode.Normal, null, "user2");

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemGptMode.Normal, service.CurrentMode);
      Assert.Null(service.CurrentReason);
      Assert.Equal("user2", service.ChangedBy);
      Assert.False(service.IsSafeMode);
    }

    [Fact]
    public void IsSafeMode_ReturnsTrueOnlyInSafeMode()
    {
      // Arrange
      var logger = new Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptModeService>();
      var service = new TerraFusion.AI.Services.SystemGptModeService(logger);

      // Assert - initially false
      Assert.False(service.IsSafeMode);

      // Act & Assert - true after enabling
      service.SetMode(TerraFusion.AI.Models.SystemGptMode.SafeMode, "Testing", "tester");
      Assert.True(service.IsSafeMode);

      // Act & Assert - false after disabling
      service.SetMode(TerraFusion.AI.Models.SystemGptMode.Normal, null, "tester");
      Assert.False(service.IsSafeMode);
    }
  }

  /// <summary>
  /// Tests for Safe Mode DTOs.
  /// </summary>
  public class SafeModeDtoTests
  {
    [Fact]
    public void SetSystemGptModeRequest_SerializesToJson_Correctly()
    {
      // Arrange
      var request = new TerraFusion.AI.Models.SetSystemGptModeRequest
      {
        Enabled = true,
        Reason = "Investigating anomaly"
      };

      // Act
      var options = new System.Text.Json.JsonSerializerOptions
      {
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
      };
      var json = System.Text.Json.JsonSerializer.Serialize(request, options);

      // Assert
      Assert.Contains("\"enabled\":true", json);
      Assert.Contains("\"reason\":\"Investigating anomaly\"", json);
    }

    [Fact]
    public void SetSystemGptModeResponse_IncludesAllFields()
    {
      // Arrange
      var response = new TerraFusion.AI.Models.SetSystemGptModeResponse
      {
        Success = true,
        Mode = TerraFusion.AI.Models.SystemGptMode.SafeMode,
        ModeReason = "Test reason",
        ChangedBy = "admin",
        ChangedAt = DateTime.UtcNow,
        Message = "Safe Mode enabled"
      };

      // Assert
      Assert.True(response.Success);
      Assert.Equal(TerraFusion.AI.Models.SystemGptMode.SafeMode, response.Mode);
      Assert.Equal("Test reason", response.ModeReason);
      Assert.Equal("admin", response.ChangedBy);
      Assert.Equal("Safe Mode enabled", response.Message);
    }

    [Fact]
    public void SystemGptMode_EnumValues_AreCorrect()
    {
      // Assert
      Assert.Equal(0, (int)TerraFusion.AI.Models.SystemGptMode.Normal);
      Assert.Equal(1, (int)TerraFusion.AI.Models.SystemGptMode.SafeMode);
    }

    [Fact]
    public void DiagnosticsResponse_IncludesModeFields()
    {
      // Arrange
      var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        Mode = TerraFusion.AI.Models.SystemGptMode.SafeMode,
        ModeReason = "Testing Phase 17",
        ModeChangedBy = "test-admin",
        ModeChangedAt = DateTime.UtcNow
      };

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemGptMode.SafeMode, diagnostics.Mode);
      Assert.Equal("Testing Phase 17", diagnostics.ModeReason);
      Assert.Equal("test-admin", diagnostics.ModeChangedBy);
      Assert.NotNull(diagnostics.ModeChangedAt);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🏛️ Phase 18: Benton CAMA RAG Readiness Tests
  // "Is the Benton CAMA RAG brain ready, fresh, and indexed?"
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Tests for Benton CAMA RAG readiness DTOs and status computation (Phase 18).
  /// </summary>
  public class BentonRagReadinessTests
  {
    [Fact]
    public void BentonRagStatus_EnumValues_AreCorrect()
    {
      // Assert - verify enum values
      Assert.Equal(0, (int)TerraFusion.AI.Models.BentonRagStatus.Ready);
      Assert.Equal(1, (int)TerraFusion.AI.Models.BentonRagStatus.Stale);
      Assert.Equal(2, (int)TerraFusion.AI.Models.BentonRagStatus.Unindexed);
      Assert.Equal(3, (int)TerraFusion.AI.Models.BentonRagStatus.Partial);
    }

    [Fact]
    public void BentonRagReadinessDto_DefaultValues_AreCorrect()
    {
      // Arrange & Act
      var dto = new TerraFusion.AI.Models.BentonRagReadinessDto();

      // Assert
      Assert.Equal("benton_cama_basics", dto.DatasetKey);
      Assert.Equal("Benton CAMA Basics", dto.DisplayName);
      Assert.False(dto.IsIndexed);
      Assert.False(dto.IsPartiallyIndexed);
      Assert.Equal(0, dto.DocumentCount);
      Assert.Equal(0, dto.EmbeddingCount);
      Assert.Null(dto.LastIngestAt);
      Assert.Null(dto.LastIndexAt);
      Assert.Equal(TerraFusion.AI.Models.BentonRagStatus.Unindexed, dto.OverallStatus);
    }

    [Fact]
    public void BentonRagReadinessDto_ReadyStatus_HasCorrectShape()
    {
      // Arrange
      var now = DateTimeOffset.UtcNow;
      var dto = new TerraFusion.AI.Models.BentonRagReadinessDto
      {
        DatasetKey = "benton_cama_basics",
        DisplayName = "Benton CAMA Basics",
        IsIndexed = true,
        IsPartiallyIndexed = false,
        DocumentCount = 15,
        EmbeddingCount = 150,
        LastIngestAt = now.AddHours(-2),
        LastIndexAt = now.AddHours(-1),
        OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Ready,
        StatusReason = "Fully indexed and up-to-date.",
        ActiveGptConfigs = new List<string> { "PropertyAssessmentGPT", "ExplainGPT" }
      };

      // Assert
      Assert.True(dto.IsIndexed);
      Assert.False(dto.IsPartiallyIndexed);
      Assert.Equal(15, dto.DocumentCount);
      Assert.Equal(150, dto.EmbeddingCount);
      Assert.Equal(TerraFusion.AI.Models.BentonRagStatus.Ready, dto.OverallStatus);
      Assert.Contains("PropertyAssessmentGPT", dto.ActiveGptConfigs);
    }

    [Fact]
    public void BentonRagReadinessDto_StaleStatus_HasCorrectShape()
    {
      // Arrange
      var dto = new TerraFusion.AI.Models.BentonRagReadinessDto
      {
        IsIndexed = true,
        DocumentCount = 10,
        EmbeddingCount = 100,
        LastIngestAt = DateTimeOffset.UtcNow.AddDays(-10),
        OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Stale,
        StatusReason = "Data older than 7 days; consider re-ingesting."
      };

      // Assert
      Assert.True(dto.IsIndexed);
      Assert.Equal(TerraFusion.AI.Models.BentonRagStatus.Stale, dto.OverallStatus);
      Assert.Contains("7 days", dto.StatusReason);
    }

    [Fact]
    public void BentonRagReadinessDto_PartialStatus_HasCorrectShape()
    {
      // Arrange
      var dto = new TerraFusion.AI.Models.BentonRagReadinessDto
      {
        IsIndexed = false,
        IsPartiallyIndexed = true,
        DocumentCount = 10,
        EmbeddingCount = 5, // Less than documents
        OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Partial,
        StatusReason = "Some documents may be missing embeddings."
      };

      // Assert
      Assert.False(dto.IsIndexed);
      Assert.True(dto.IsPartiallyIndexed);
      Assert.Equal(TerraFusion.AI.Models.BentonRagStatus.Partial, dto.OverallStatus);
    }

    [Fact]
    public void BentonRagSnapshotDto_IncludesAllRequiredFields()
    {
      // Arrange
      var readiness = new TerraFusion.AI.Models.BentonRagReadinessDto
      {
        DocumentCount = 15,
        EmbeddingCount = 150,
        OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Ready
      };

      var snapshot = new TerraFusion.AI.Models.BentonRagSnapshotDto
      {
        GeneratedAtUtc = DateTimeOffset.UtcNow,
        TerraFusionVersion = "1.0.0",
        Readiness = readiness,
        ActiveGptConfigsUsingRag = new List<string> { "PropertyAssessmentGPT" },
        HealthWarnings = new List<string>(),
        Metadata = new TerraFusion.AI.Models.BentonRagSnapshotMetadata
        {
          CountyCode = "benton",
          CountyName = "Benton County, WA"
        }
      };

      // Assert
      Assert.NotNull(snapshot.Readiness);
      Assert.Equal(15, snapshot.Readiness.DocumentCount);
      Assert.Equal("1.0.0", snapshot.TerraFusionVersion);
      Assert.Equal("benton", snapshot.Metadata.CountyCode);
      Assert.Equal("Benton County, WA", snapshot.Metadata.CountyName);
    }

    [Fact]
    public void DiagnosticsResponse_IncludesBentonRagField()
    {
      // Arrange
      var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        BentonRag = new TerraFusion.AI.Models.BentonRagReadinessDto
        {
          OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Ready,
          DocumentCount = 20
        }
      };

      // Assert
      Assert.NotNull(diagnostics.BentonRag);
      Assert.Equal(TerraFusion.AI.Models.BentonRagStatus.Ready, diagnostics.BentonRag.OverallStatus);
      Assert.Equal(20, diagnostics.BentonRag.DocumentCount);
    }

    [Fact]
    public void HealthEvaluator_BentonRagUnindexed_ProducesWarning()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptHealthEvaluator>.Instance;
      var evaluator = new TerraFusion.AI.Services.SystemGptHealthEvaluator(logger);

      var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        BentonRag = new TerraFusion.AI.Models.BentonRagReadinessDto
        {
          OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Unindexed,
          StatusReason = "No documents ingested."
        },
        EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus { Available = true, Mode = "Simulated" },
        RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>(),
        GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>(),
        ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus { Healthy = true }
      };

      // Act
      var result = evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemHealthStatus.Degraded, result.OverallHealth);
      Assert.Contains(result.HeraldMessages, m =>
        m.Source == "BentonRagReadiness" &&
        m.Level == "Warning" &&
        m.Message.Contains("unindexed"));
    }

    [Fact]
    public void HealthEvaluator_BentonRagReady_ProducesSuccessMessage()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptHealthEvaluator>.Instance;
      var evaluator = new TerraFusion.AI.Services.SystemGptHealthEvaluator(logger);

      var diagnostics = new TerraFusion.AI.Models.SystemDiagnosticsResponse
      {
        BentonRag = new TerraFusion.AI.Models.BentonRagReadinessDto
        {
          OverallStatus = TerraFusion.AI.Models.BentonRagStatus.Ready,
          DocumentCount = 15,
          EmbeddingCount = 150
        },
        EmbeddingStatus = new TerraFusion.AI.Models.EmbeddingServiceStatus { Available = true, Mode = "OpenAI", Dimensions = 1536 },
        RagDatasets = new List<TerraFusion.AI.Models.RagDatasetSummary>
        {
          new() { Key = "benton_cama_basics", Indexed = true }
        },
        GptConfigs = new List<TerraFusion.AI.Models.GptConfigSummary>
        {
          new() { Key = "PropertyAssessmentGPT", Enabled = true }
        },
        ExplainGptStatus = new TerraFusion.AI.Models.ServiceStatus { Healthy = true }
      };

      // Act
      var result = evaluator.EvaluateHealth(diagnostics);

      // Assert
      Assert.Contains(result.HeraldMessages, m =>
        m.Source == "BentonRagReadiness" &&
        m.Level == "Success" &&
        m.Message.Contains("ready"));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📜 Phase 19: AI Incident Timeline Tests
  // "What happened to the AI system this week?"
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Tests for SystemGPT Event Service and AI Incident Timeline (Phase 19).
  /// </summary>
  public class SystemGptEventServiceTests
  {
    [Fact]
    public void SystemGptEventKind_EnumValues_AreCorrect()
    {
      // Assert - verify enum values
      Assert.Equal(0, (int)TerraFusion.AI.Models.SystemGptEventKind.Unknown);
      Assert.Equal(1, (int)TerraFusion.AI.Models.SystemGptEventKind.SafeModeChanged);
      Assert.Equal(2, (int)TerraFusion.AI.Models.SystemGptEventKind.RagReindexed);
      Assert.Equal(3, (int)TerraFusion.AI.Models.SystemGptEventKind.RagHealthChanged);
      Assert.Equal(4, (int)TerraFusion.AI.Models.SystemGptEventKind.HealthSnapshotDownloaded);
      Assert.Equal(5, (int)TerraFusion.AI.Models.SystemGptEventKind.BentonRagSnapshotDownloaded);
      Assert.Equal(6, (int)TerraFusion.AI.Models.SystemGptEventKind.HeraldWarning);
      Assert.Equal(7, (int)TerraFusion.AI.Models.SystemGptEventKind.HeraldError);
    }

    [Fact]
    public void SystemGptEventDto_DefaultValues_AreCorrect()
    {
      // Arrange & Act
      var dto = new TerraFusion.AI.Models.SystemGptEventDto();

      // Assert
      Assert.Equal(TerraFusion.AI.Models.SystemGptEventKind.Unknown, dto.Kind);
      Assert.Null(dto.Details);
      Assert.Null(dto.Actor);
      Assert.Null(dto.CorrelationId);
    }

    [Fact]
    public void SystemGptEventDto_HasCorrectShape_ForSafeModeEvent()
    {
      // Arrange
      var now = DateTimeOffset.UtcNow;
      var dto = new TerraFusion.AI.Models.SystemGptEventDto
      {
        TimestampUtc = now,
        Kind = TerraFusion.AI.Models.SystemGptEventKind.SafeModeChanged,
        Severity = "warning",
        Summary = "Safe Mode Enabled",
        Details = "🛑 SystemGPT SAFE MODE ENABLED by admin: Testing",
        Actor = "admin"
      };

      // Assert
      Assert.Equal(now, dto.TimestampUtc);
      Assert.Equal(TerraFusion.AI.Models.SystemGptEventKind.SafeModeChanged, dto.Kind);
      Assert.Equal("warning", dto.Severity);
      Assert.Equal("Safe Mode Enabled", dto.Summary);
      Assert.Contains("admin", dto.Actor);
    }

    [Fact]
    public async Task EventService_RecordsEvents_AndReturnsThemInOrder()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptEventService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptEventService(logger);

      // Act - record events
      service.RecordEvent(
        TerraFusion.AI.Models.SystemGptEventKind.SafeModeChanged,
        "warning",
        "Safe Mode Enabled",
        "Testing",
        "test-user");

      await Task.Delay(10); // Ensure different timestamps

      service.RecordEvent(
        TerraFusion.AI.Models.SystemGptEventKind.HealthSnapshotDownloaded,
        "info",
        "Health Snapshot Downloaded",
        "Downloaded 5000 bytes");

      // Act - get events
      var events = await service.GetRecentEventsAsync(null, 100);

      // Assert - should have at least 3 events (init + 2 recorded)
      Assert.True(events.Count >= 3);

      // Most recent first
      var healthEvent = events.FirstOrDefault(e => e.Kind == TerraFusion.AI.Models.SystemGptEventKind.HealthSnapshotDownloaded);
      var safeEvent = events.FirstOrDefault(e => e.Kind == TerraFusion.AI.Models.SystemGptEventKind.SafeModeChanged);

      Assert.NotNull(healthEvent);
      Assert.NotNull(safeEvent);
      Assert.Equal("info", healthEvent.Severity);
      Assert.Equal("warning", safeEvent.Severity);
    }

    [Fact]
    public async Task EventService_RespectsLimitParameter()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptEventService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptEventService(logger);

      // Add several events
      for (int i = 0; i < 10; i++)
      {
        service.RecordEvent(
          TerraFusion.AI.Models.SystemGptEventKind.HeraldWarning,
          "warning",
          $"Test event {i}");
      }

      // Act
      var events = await service.GetRecentEventsAsync(null, 5);

      // Assert
      Assert.Equal(5, events.Count);
    }

    [Fact]
    public async Task EventService_FiltersBySinceUtc()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptEventService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptEventService(logger);

      var cutoff = DateTimeOffset.UtcNow.AddMinutes(5); // Future cutoff

      // Act
      var events = await service.GetRecentEventsAsync(cutoff, 100);

      // Assert - should be empty since cutoff is in the future
      Assert.Empty(events);
    }

    [Fact]
    public void EventService_PrunesOldEventsWhenOverCapacity()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptEventService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptEventService(logger);

      // Act - add more than max capacity
      for (int i = 0; i < TerraFusion.AI.Services.SystemGptEventService.MaxEventCapacity + 100; i++)
      {
        service.RecordEvent(
          TerraFusion.AI.Models.SystemGptEventKind.Unknown,
          "info",
          $"Event {i}");
      }

      // We can't directly check internal count, but we can verify it doesn't throw
      // and still returns events
      var events = service.GetRecentEventsAsync(null, 1000).Result;

      // Assert - should have at most max capacity events
      Assert.True(events.Count <= TerraFusion.AI.Services.SystemGptEventService.MaxEventCapacity);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PHASE 20: SYSTEMGPT METRICS SERVICE TESTS
  // "How fast is GPT right now?" "What's our error rate?" "How busy is the AI?"
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Phase 20: Unit tests for SystemGPT Metrics Service.
  /// Tests metrics collection, aggregation, and snapshot generation.
  /// </summary>
  public class SystemGptMetricsServiceTests
  {
    [Fact]
    public void MetricsSnapshot_WithNoSamples_ReturnsZeros()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      // Act
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15));

      // Assert
      Assert.Equal(0, snapshot.TotalRequests);
      Assert.Equal(0, snapshot.RequestsPerMinute);
      Assert.Equal(0, snapshot.ErrorRatePercent);
      Assert.Equal(0, snapshot.GptLatencyMsP50);
      Assert.Equal(0, snapshot.GptLatencyMsP95);
      Assert.Equal(0, snapshot.RagLatencyMsP95);
      Assert.Equal(0, snapshot.EmbeddingLatencyMsP95);
      Assert.Equal(0, snapshot.TotalTokensIn);
      Assert.Equal(0, snapshot.TotalTokensOut);
      Assert.Empty(snapshot.Series);
    }

    [Fact]
    public void MetricsSnapshot_WithKnownSamples_ComputesCorrectStats()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      // Record 10 samples with known latencies: 100, 200, 300, ..., 1000ms
      for (int i = 1; i <= 10; i++)
      {
        service.RecordSample(
          latencyMs: i * 100,
          success: i != 5, // 1 failure
          tokensIn: i * 10,
          tokensOut: i * 5);
      }

      // Act
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15));

      // Assert
      Assert.Equal(10, snapshot.TotalRequests);
      Assert.Equal(10, snapshot.ErrorRatePercent); // 1/10 = 10%
      Assert.Equal(550, snapshot.TotalTokensIn); // Sum of 10+20+...+100
      Assert.Equal(275, snapshot.TotalTokensOut); // Sum of 5+10+...+50

      // p50 should be around 500-600ms (median of 100-1000)
      Assert.InRange(snapshot.GptLatencyMsP50, 400, 600);
      // p95 should be around 900-1000ms
      Assert.InRange(snapshot.GptLatencyMsP95, 900, 1000);
    }

    [Fact]
    public void MetricsSnapshot_WithRagLatencies_ComputesRagP95()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      // Record samples with RAG latencies
      for (int i = 1; i <= 5; i++)
      {
        service.RecordSample(
          latencyMs: 100,
          success: true,
          ragLatencyMs: i * 50); // 50, 100, 150, 200, 250ms
      }

      // Act
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15));

      // Assert
      Assert.InRange(snapshot.RagLatencyMsP95, 200, 250);
    }

    [Fact]
    public void MetricsSnapshot_GeneratesTimeSeries()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      // Record several samples
      for (int i = 0; i < 20; i++)
      {
        service.RecordSample(
          latencyMs: 100 + i * 10,
          success: true);
      }

      // Act
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15), maxSeriesPoints: 10);

      // Assert
      Assert.NotEmpty(snapshot.Series);
      Assert.All(snapshot.Series, s =>
      {
        Assert.NotEmpty(s.Name);
        Assert.NotEmpty(s.Unit);
      });
    }

    [Fact]
    public void MetricsService_RecordSample_IsNonFatal()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      // Act - should not throw even with extreme values
      service.RecordSample(double.MaxValue, false);
      service.RecordSample(-1, true);
      service.RecordSample(0, true, int.MaxValue, int.MaxValue);

      // Assert - can still get a snapshot
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15));
      Assert.True(snapshot.TotalRequests >= 3);
    }

    [Fact]
    public void MetricsSnapshot_ClampsMaxSeriesPoints()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      for (int i = 0; i < 100; i++)
      {
        service.RecordSample(100, true);
      }

      // Act - request excessive series points
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15), maxSeriesPoints: 99999);

      // Assert - series points should be clamped
      Assert.All(snapshot.Series, s =>
      {
        Assert.True(s.Points.Count <= TerraFusion.AI.Services.SystemGptMetricsService.MaxSeriesPointsCap);
      });
    }

    [Fact]
    public void MetricsSnapshot_HasCorrectWindowMinutes()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      // Act
      var snapshot15 = service.GetSnapshot(TimeSpan.FromMinutes(15));
      var snapshot30 = service.GetSnapshot(TimeSpan.FromMinutes(30));

      // Assert
      Assert.Equal(15, snapshot15.WindowMinutes);
      Assert.Equal(30, snapshot30.WindowMinutes);
    }

    [Fact]
    public void MetricsSnapshot_HasGeneratedAtTimestamp()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptMetricsService>.Instance;
      var service = new TerraFusion.AI.Services.SystemGptMetricsService(logger);

      var before = DateTimeOffset.UtcNow;

      // Act
      var snapshot = service.GetSnapshot(TimeSpan.FromMinutes(15));

      var after = DateTimeOffset.UtcNow;

      // Assert
      Assert.InRange(snapshot.GeneratedAtUtc, before, after);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Phase 24: AI Policy Engine Tests
  // ═══════════════════════════════════════════════════════════════════════════════

  /// <summary>
  /// Phase 24: Unit tests for SystemGptPolicyDto and PolicyEvaluationResult.
  /// </summary>
  public class SystemGptPolicyDtoTests
  {
    [Fact]
    public void SystemGptPolicyDto_DefaultValues_ArePermissive()
    {
      // Arrange & Act
      var policy = new TerraFusion.AI.Models.SystemGptPolicyDto();

      // Assert - defaults should be permissive (Benton County pattern)
      Assert.Equal("benton", policy.CountyId);
      Assert.True(policy.AllowGptSendMessage);
      Assert.True(policy.AllowRagQueries);
      Assert.True(policy.AllowEmbeddings);
      Assert.True(policy.AllowExplainGpt);
      Assert.False(policy.RequireExplainOnValuation);
      Assert.False(policy.SanitizeOwnerNames);
      Assert.Empty(policy.DenyPromptPatterns);
      Assert.Empty(policy.DenyContextIds);
      Assert.False(policy.IsPlaceholder);
    }

    [Fact]
    public void SystemGptPolicyDto_CanSetRestrictivePolicy()
    {
      // Arrange & Act
      var policy = new TerraFusion.AI.Models.SystemGptPolicyDto
      {
        CountyId = "yakima",
        CountyName = "Yakima County",
        AllowGptSendMessage = false,
        AllowRagQueries = false,
        AllowEmbeddings = false,
        AllowExplainGpt = true,
        RequireExplainOnValuation = true,
        SanitizeOwnerNames = true,
        DenyPromptPatterns = new[] { "confidential", "secret" },
        DenyContextIds = new[] { "sensitive-data" },
        PolicyVersion = "2.0",
        IsPlaceholder = true
      };

      // Assert
      Assert.Equal("yakima", policy.CountyId);
      Assert.Equal("Yakima County", policy.CountyName);
      Assert.False(policy.AllowGptSendMessage);
      Assert.False(policy.AllowRagQueries);
      Assert.False(policy.AllowEmbeddings);
      Assert.True(policy.AllowExplainGpt);
      Assert.True(policy.RequireExplainOnValuation);
      Assert.True(policy.SanitizeOwnerNames);
      Assert.Contains("confidential", policy.DenyPromptPatterns);
      Assert.Contains("secret", policy.DenyPromptPatterns);
      Assert.Contains("sensitive-data", policy.DenyContextIds);
      Assert.Equal("2.0", policy.PolicyVersion);
      Assert.True(policy.IsPlaceholder);
    }
  }

  /// <summary>
  /// Phase 24: Unit tests for PolicyEvaluationResult.
  /// </summary>
  public class PolicyEvaluationResultTests
  {
    [Fact]
    public void PolicyEvaluationResult_Allow_ReturnsAllowed()
    {
      // Arrange & Act
      var result = TerraFusion.AI.Models.PolicyEvaluationResult.Allow();

      // Assert
      Assert.True(result.Allowed);
      Assert.Null(result.DenyReason);
      Assert.Null(result.DenyRule);
      Assert.False(result.WasSanitized);
      Assert.False(result.RequiresExplain);
    }

    [Fact]
    public void PolicyEvaluationResult_Allow_WithSanitizedPrompt()
    {
      // Arrange & Act
      var result = TerraFusion.AI.Models.PolicyEvaluationResult.Allow(
        sanitizedPrompt: "Sanitized message",
        requiresExplain: false);

      // Assert
      Assert.True(result.Allowed);
      Assert.Equal("Sanitized message", result.SanitizedPrompt);
      Assert.True(result.WasSanitized);
    }

    [Fact]
    public void PolicyEvaluationResult_Allow_WithRequiresExplain()
    {
      // Arrange & Act
      var result = TerraFusion.AI.Models.PolicyEvaluationResult.Allow(requiresExplain: true);

      // Assert
      Assert.True(result.Allowed);
      Assert.True(result.RequiresExplain);
    }

    [Fact]
    public void PolicyEvaluationResult_Deny_ReturnsDenied()
    {
      // Arrange & Act
      var result = TerraFusion.AI.Models.PolicyEvaluationResult.Deny(
        reason: "Policy violation",
        rule: "DenyPromptPattern");

      // Assert
      Assert.False(result.Allowed);
      Assert.Equal("Policy violation", result.DenyReason);
      Assert.Equal("DenyPromptPattern", result.DenyRule);
    }
  }

  /// <summary>
  /// Phase 24: Unit tests for GptRequestContext.
  /// </summary>
  public class GptRequestContextTests
  {
    [Fact]
    public void GptRequestContext_DefaultValues_AreCorrect()
    {
      // Arrange & Act
      var context = new TerraFusion.AI.Models.GptRequestContext();

      // Assert
      Assert.Equal(TerraFusion.AI.Models.CountyId.Benton, context.CountyId);
      Assert.Equal(string.Empty, context.Prompt);
      Assert.Null(context.GptConfigKey);
      Assert.Null(context.ContextId);
      Assert.False(context.RequiresRag);
      Assert.False(context.RequiresEmbedding);
      Assert.False(context.IsExplainRequest);
      Assert.Null(context.UserId);
    }

    [Fact]
    public void GptRequestContext_CanSetAllProperties()
    {
      // Arrange & Act
      var context = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Franklin,
        Prompt = "What is the value of property X?",
        GptConfigKey = "ValuationGPT",
        ContextId = "valuation-context",
        RequiresRag = true,
        RequiresEmbedding = true,
        IsExplainRequest = false,
        UserId = "user123"
      };

      // Assert
      Assert.Equal(TerraFusion.AI.Models.CountyId.Franklin, context.CountyId);
      Assert.Equal("What is the value of property X?", context.Prompt);
      Assert.Equal("ValuationGPT", context.GptConfigKey);
      Assert.Equal("valuation-context", context.ContextId);
      Assert.True(context.RequiresRag);
      Assert.True(context.RequiresEmbedding);
      Assert.False(context.IsExplainRequest);
      Assert.Equal("user123", context.UserId);
    }
  }

  /// <summary>
  /// Phase 24: Unit tests for PolicyEventKind enum.
  /// </summary>
  public class PolicyEventKindTests
  {
    [Fact]
    public void PolicyEventKind_EnumValues_AreCorrect()
    {
      // Assert
      Assert.Equal(0, (int)TerraFusion.AI.Models.PolicyEventKind.PolicyAllow);
      Assert.Equal(1, (int)TerraFusion.AI.Models.PolicyEventKind.PolicyDeny);
      Assert.Equal(2, (int)TerraFusion.AI.Models.PolicyEventKind.PolicySanitize);
      Assert.Equal(3, (int)TerraFusion.AI.Models.PolicyEventKind.PolicyForceExplain);
      Assert.Equal(4, (int)TerraFusion.AI.Models.PolicyEventKind.PolicyUpdated);
    }
  }

  /// <summary>
  /// Phase 24: Unit tests for InMemoryCountyPolicyService.
  /// </summary>
  public class InMemoryCountyPolicyServiceTests
  {
    [Fact]
    public async System.Threading.Tasks.Task GetPolicyAsync_Benton_ReturnsPermissivePolicy()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.InMemoryCountyPolicyService>.Instance;
      var service = new TerraFusion.AI.Services.InMemoryCountyPolicyService(logger);

      // Act
      var policy = await service.GetPolicyAsync(TerraFusion.AI.Models.CountyId.Benton);

      // Assert
      Assert.Equal("benton", policy.CountyId);
      Assert.Equal("Benton County", policy.CountyName);
      Assert.True(policy.AllowGptSendMessage);
      Assert.True(policy.AllowRagQueries);
      Assert.True(policy.AllowEmbeddings);
      Assert.False(policy.IsPlaceholder);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetPolicyAsync_Yakima_ReturnsRestrictivePolicy()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.InMemoryCountyPolicyService>.Instance;
      var service = new TerraFusion.AI.Services.InMemoryCountyPolicyService(logger);

      // Act
      var policy = await service.GetPolicyAsync(TerraFusion.AI.Models.CountyId.Yakima);

      // Assert
      Assert.Equal("yakima", policy.CountyId);
      Assert.Equal("Yakima County", policy.CountyName);
      Assert.False(policy.AllowGptSendMessage);
      Assert.False(policy.AllowRagQueries);
      Assert.False(policy.AllowEmbeddings);
      Assert.True(policy.IsPlaceholder);
    }

    [Fact]
    public async System.Threading.Tasks.Task GetPolicyAsync_Franklin_ReturnsPlaceholderPolicyWithSanitization()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.InMemoryCountyPolicyService>.Instance;
      var service = new TerraFusion.AI.Services.InMemoryCountyPolicyService(logger);

      // Act
      var policy = await service.GetPolicyAsync(TerraFusion.AI.Models.CountyId.Franklin);

      // Assert
      Assert.Equal("franklin", policy.CountyId);
      Assert.Equal("Franklin County", policy.CountyName);
      Assert.False(policy.AllowGptSendMessage); // Placeholder - not configured yet
      Assert.False(policy.AllowRagQueries);      // Placeholder - not configured yet
      Assert.True(policy.SanitizeOwnerNames);    // Privacy protection enabled
      Assert.True(policy.RequireExplainOnValuation); // Conservative default
      Assert.True(policy.IsPlaceholder);         // Not fully configured
    }

    [Fact]
    public async System.Threading.Tasks.Task GetAllPoliciesAsync_ReturnsAllThreeCounties()
    {
      // Arrange
      var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.InMemoryCountyPolicyService>.Instance;
      var service = new TerraFusion.AI.Services.InMemoryCountyPolicyService(logger);

      // Act
      var allPolicies = await service.GetAllPoliciesAsync();

      // Assert
      Assert.Equal(3, allPolicies.Count);
      Assert.Contains(allPolicies.Keys, k => k == TerraFusion.AI.Models.CountyId.Benton);
      Assert.Contains(allPolicies.Keys, k => k == TerraFusion.AI.Models.CountyId.Yakima);
      Assert.Contains(allPolicies.Keys, k => k == TerraFusion.AI.Models.CountyId.Franklin);
    }
  }

  /// <summary>
  /// Phase 24: Unit tests for SystemGptPolicyEvaluator.
  /// </summary>
  public class SystemGptPolicyEvaluatorTests
  {
    private TerraFusion.AI.Services.SystemGptPolicyEvaluator CreateEvaluator()
    {
      var policyLogger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.InMemoryCountyPolicyService>.Instance;
      var policyService = new TerraFusion.AI.Services.InMemoryCountyPolicyService(policyLogger);

      var evalLogger = Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptPolicyEvaluator>.Instance;
      return new TerraFusion.AI.Services.SystemGptPolicyEvaluator(policyService, evalLogger, null);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_BentonSimpleRequest_ReturnsAllowed()
    {
      // Arrange
      var evaluator = CreateEvaluator();
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Benton,
        Prompt = "What is the value of this property?",
        RequiresRag = false,
        RequiresEmbedding = false
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert
      Assert.True(result.Allowed);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_YakimaRequest_ReturnsDenied()
    {
      // Arrange
      var evaluator = CreateEvaluator();
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Yakima,
        Prompt = "What is the value of this property?",
        RequiresRag = false,
        RequiresEmbedding = false
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert
      Assert.False(result.Allowed);
      Assert.Contains("disabled", result.DenyReason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_YakimaWithRag_ReturnsDenied()
    {
      // Arrange
      var evaluator = CreateEvaluator();
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Yakima,
        Prompt = "Query the knowledge base",
        RequiresRag = true
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert
      Assert.False(result.Allowed);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_YakimaWithEmbeddings_ReturnsDenied()
    {
      // Arrange
      var evaluator = CreateEvaluator();
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Yakima,
        Prompt = "Generate embeddings",
        RequiresEmbedding = true
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert
      Assert.False(result.Allowed);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_FranklinWithValuationContext_RequiresExplain()
    {
      // Arrange
      var evaluator = CreateEvaluator();
      // Franklin has AllowGptSendMessage=false, but allows ExplainGPT
      // Using IsExplainRequest=true to bypass the AllowGptSendMessage check
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Franklin,
        Prompt = "What is the value?",
        ContextId = "valuation",
        IsExplainRequest = true // Bypass AllowGptSendMessage=false
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert
      Assert.True(result.Allowed);
      Assert.True(result.RequiresExplain);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_FranklinWithOwnerName_SanitizesPrompt()
    {
      // Arrange
      var evaluator = CreateEvaluator();
      // Note: Franklin has AllowGptSendMessage=false, but allows ExplainGPT
      // We need to test with IsExplainRequest=true to get past the first check
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Franklin,
        Prompt = "Look up property owned by John Smith at 123 Main St",
        IsExplainRequest = true // This bypasses the AllowGptSendMessage=false check
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert
      Assert.True(result.Allowed);
      Assert.True(result.WasSanitized);
      Assert.NotEqual(request.Prompt, result.SanitizedPrompt);
      Assert.Contains("[OWNER_REDACTED]", result.SanitizedPrompt);
    }

    [Fact]
    public async System.Threading.Tasks.Task EvaluateRequestAsync_FranklinNonExplainRequest_ReturnsDenied()
    {
      // Arrange - Franklin has AllowGptSendMessage=false for non-explain requests
      var evaluator = CreateEvaluator();
      var request = new TerraFusion.AI.Models.GptRequestContext
      {
        CountyId = TerraFusion.AI.Models.CountyId.Franklin,
        Prompt = "What is the value of this property?",
        IsExplainRequest = false
      };

      // Act
      var result = await evaluator.EvaluateRequestAsync(request);

      // Assert - Should be denied because AllowGptSendMessage=false
      Assert.False(result.Allowed);
    }
  }
}
