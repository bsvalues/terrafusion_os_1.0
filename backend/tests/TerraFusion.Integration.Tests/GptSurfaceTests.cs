/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GPT SURFACE INTEGRATION TESTS
 * Elite Government AI Assistant Platform Validation
 * THE TERRAFUSION WAY - Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using FluentAssertions;
using TerraFusion.AI.Entities;
using TerraFusion.AI.Interfaces;
using TerraFusion.Core.Entities;
using Xunit;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Integration tests for GPT API surface
/// Validates interface contracts and entity structure
/// </summary>
public class GptSurfaceTests
{
    // ═══════════════════════════════════════════════════════════════
    // SERVICE INTERFACE CONTRACT TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void IGPTConfigurationService_HasGetSystemGPTsAsync()
    {
        // Assert: Interface defines required method
        var interfaceType = typeof(IGPTConfigurationService);
        var method = interfaceType.GetMethod("GetSystemGPTsAsync");

        method.Should().NotBeNull("GetSystemGPTsAsync is required for GPT catalog");
        method!.ReturnType.Should().BeAssignableTo(typeof(System.Threading.Tasks.Task<>));
    }

    [Fact]
    public void IGPTConfigurationService_HasGetGPTByNameAsync()
    {
        var interfaceType = typeof(IGPTConfigurationService);
        var method = interfaceType.GetMethod("GetGPTByNameAsync");

        method.Should().NotBeNull("GetGPTByNameAsync is required for GPT lookup by key");
    }

    [Fact]
    public void IGPTOrchestrationService_HasCreateConversationAsync()
    {
        var interfaceType = typeof(IGPTOrchestrationService);
        var method = interfaceType.GetMethod("CreateConversationAsync");

        method.Should().NotBeNull("CreateConversationAsync is required for chat");

        var parameters = method!.GetParameters();
        parameters.Should().HaveCountGreaterOrEqualTo(3, "should accept gptConfigId, userId, countyId");
    }

    [Fact]
    public void IGPTOrchestrationService_HasSendMessageAsync()
    {
        var interfaceType = typeof(IGPTOrchestrationService);
        var method = interfaceType.GetMethod("SendMessageAsync");

        method.Should().NotBeNull("SendMessageAsync is required for chat");

        var parameters = method!.GetParameters();
        parameters.Should().HaveCountGreaterOrEqualTo(4, "should accept gptConfigId, conversationId, userMessage, userId");
    }

    [Fact]
    public void IGPTOrchestrationService_HasGetConversationAsync()
    {
        var interfaceType = typeof(IGPTOrchestrationService);
        var method = interfaceType.GetMethod("GetConversationAsync");

        method.Should().NotBeNull("GetConversationAsync is required for chat retrieval");
    }

    // ═══════════════════════════════════════════════════════════════
    // ENTITY STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void GPTConfiguration_HasRequiredProperties()
    {
        var entityType = typeof(GPTConfiguration);

        entityType.GetProperty("Id").Should().NotBeNull();
        entityType.GetProperty("Name").Should().NotBeNull();
        entityType.GetProperty("DisplayName").Should().NotBeNull();
        entityType.GetProperty("IsSystemGPT").Should().NotBeNull();
        entityType.GetProperty("SystemPrompt").Should().NotBeNull();
        entityType.GetProperty("ModelProvider").Should().NotBeNull();
        entityType.GetProperty("ModelName").Should().NotBeNull();
        entityType.GetProperty("EnableRAG").Should().NotBeNull();
    }

    [Fact]
    public void GPTConversation_HasRequiredProperties()
    {
        var entityType = typeof(GPTConversation);

        entityType.GetProperty("Id").Should().NotBeNull();
        entityType.GetProperty("GPTConfigurationId").Should().NotBeNull();
        entityType.GetProperty("UserId").Should().NotBeNull();
        entityType.GetProperty("CountyId").Should().NotBeNull("CountyId required for FISMA county isolation");
        entityType.GetProperty("Status").Should().NotBeNull();
    }

    [Fact]
    public void GPTMessage_HasRequiredProperties()
    {
        var entityType = typeof(GPTMessage);

        entityType.GetProperty("Id").Should().NotBeNull();
        entityType.GetProperty("ConversationId").Should().NotBeNull();
        entityType.GetProperty("Role").Should().NotBeNull();
        entityType.GetProperty("Content").Should().NotBeNull();
    }

    // ═══════════════════════════════════════════════════════════════
    // ENTITY INSTANTIATION TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void GPTConfiguration_CanInstantiate()
    {
        var config = new GPTConfiguration
        {
            Name = "PropertyAssessmentGPT",
            DisplayName = "Property Assessment AI",
            Description = "Elite property valuation assistant",
            IsSystemGPT = true,
            IsPublic = true,
            ModelProvider = "AzureOpenAI",
            ModelName = "gpt-4-turbo",
            SystemPrompt = "You are an expert property assessment assistant.",
            Temperature = 0.3m,
            MaxTokens = 4096,
            EnableRAG = true,
            EnableFunctions = true,
            Status = "active"
        };

        config.Name.Should().Be("PropertyAssessmentGPT");
        config.IsSystemGPT.Should().BeTrue();
        config.EnableRAG.Should().BeTrue();
    }

    [Fact]
    public void GPTConversation_CanInstantiate_WithCountyId()
    {
        var conversation = new GPTConversation
        {
            GPTConfigurationId = 1,
            UserId = "test-user",
            CountyId = 1, // County isolation field
            Title = "Test Conversation",
            Status = "active"
        };

        conversation.UserId.Should().Be("test-user");
        conversation.CountyId.Should().Be(1, "CountyId must be set for FISMA compliance");
        conversation.Status.Should().Be("active");
    }

    [Fact]
    public void GPTMessage_CanInstantiate()
    {
        var message = new GPTMessage
        {
            ConversationId = 1,
            Role = "user",
            Content = "What is the assessed value of this property?",
            PromptTokens = 15,
            CompletionTokens = 0,
            TotalTokens = 15
        };

        message.Role.Should().Be("user");
        message.Content.Should().Contain("assessed value");
    }
}
