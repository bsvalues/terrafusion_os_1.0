// TerraFusionGPT Suite: GPT Service Unit Tests
// Elite Government OS Engineering - AI Platform
// Note: These tests are designed to run with a real database context.
// For in-memory testing, use the Integration.Tests project.

using System;
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
}
