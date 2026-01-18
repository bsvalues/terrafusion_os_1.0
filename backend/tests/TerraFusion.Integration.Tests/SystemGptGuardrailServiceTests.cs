/**
 * ═══════════════════════════════════════════════════════════════
 * PHASE 26: AUTONOMOUS GUARDRAIL TESTS
 * SystemGPT Guardrails Service Tests
 * Validates deterministic guardrail decision making for GPT requests
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 26: Tests for SystemGPT Autonomous Guardrails.
/// Validates policy, metrics, and capacity-based decision making.
/// </summary>
public class SystemGptGuardrailServiceTests
{
    private readonly SystemGptGuardrailService _service;
    private readonly CountyId _bentonCounty = CountyId.Benton;
    private readonly CountyId _yakimaCounty = CountyId.Yakima;

    public SystemGptGuardrailServiceTests()
    {
        _service = new SystemGptGuardrailService(NullLogger<SystemGptGuardrailService>.Instance);
    }

    // ═══════════════════════════════════════════════════════════════
    // GUARDRAIL DECISION DTO TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void GuardrailDecision_HasRequiredProperties()
    {
        var decision = new GuardrailDecision();

        decision.Should().NotBeNull();
        decision.Allow.Should().BeTrue("Default is allow");
        decision.Kind.Should().Be(GuardrailDecisionKind.None);
        decision.DenyReason.Should().BeNull();
        decision.AutoSafeModeRecommended.Should().BeFalse();
        decision.AutoThrottle.Should().BeFalse();
        decision.ForceExplain.Should().BeFalse();
        decision.AutoSanitize.Should().BeFalse();
    }

    [Fact]
    public void GuardrailDecisionKind_HasExpectedValues()
    {
        var kinds = Enum.GetNames<GuardrailDecisionKind>();
        kinds.Should().Contain("None");
        kinds.Should().Contain("Allowed");
        kinds.Should().Contain("DeniedByPolicy");
        kinds.Should().Contain("DeniedUnconfigured");
        kinds.Should().Contain("ThrottledByCapacity");
        kinds.Should().Contain("SafeModeRecommended");
        kinds.Should().Contain("Sanitized");
        kinds.Should().Contain("ForceExplainOnValuation");
    }

    // ═══════════════════════════════════════════════════════════════
    // COUNTY CONFIGURATION TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void EvaluateGuardrails_DeniesUnconfiguredCounty()
    {
        // Arrange
        var context = CreateTestContext(_yakimaCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePermissivePolicy();

        // Act
        var decision = _service.EvaluateGuardrails(
            _yakimaCounty, context, metrics, policy, isCountyConfigured: false);

        // Assert
        decision.Allow.Should().BeFalse("Unconfigured county should be denied");
        decision.Kind.Should().Be(GuardrailDecisionKind.DeniedUnconfigured);
        decision.DenyReason.Should().Contain("not configured");
    }

    [Fact]
    public void EvaluateGuardrails_AllowsConfiguredCounty()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePermissivePolicy();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeTrue("Configured county with permissive policy should be allowed");
        decision.Kind.Should().Be(GuardrailDecisionKind.Allowed);
    }

    // ═══════════════════════════════════════════════════════════════
    // POLICY ENFORCEMENT TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void EvaluateGuardrails_DeniesWhenGptSendMessageDisabled()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithGptDisabled();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeFalse("Should deny when GPT messages disabled");
        decision.Kind.Should().Be(GuardrailDecisionKind.DeniedByPolicy);
        decision.DenyReason.Should().Contain("disabled by policy");
    }

    [Fact]
    public void EvaluateGuardrails_DeniesWhenRagDisabledAndRequired()
    {
        // Arrange
        var context = CreateContextRequiringRag();
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithRagDisabled();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeFalse("Should deny when RAG required but disabled");
        decision.Kind.Should().Be(GuardrailDecisionKind.DeniedByPolicy);
        decision.DenyReason.Should().Contain("RAG");
    }

    [Fact]
    public void EvaluateGuardrails_DeniesWhenEmbeddingsDisabledAndRequired()
    {
        // Arrange
        var context = CreateContextRequiringEmbedding();
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithEmbeddingsDisabled();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeFalse("Should deny when embeddings required but disabled");
        decision.Kind.Should().Be(GuardrailDecisionKind.DeniedByPolicy);
        decision.DenyReason.Should().Contain("Embedding", "Reason should mention embedding operations");
    }

    [Fact]
    public void EvaluateGuardrails_DeniesMatchingPromptPattern()
    {
        // Arrange
        var context = CreateContextWithSecretPrompt();
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithDenyPattern();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeFalse("Should deny matching prompt pattern");
        decision.Kind.Should().Be(GuardrailDecisionKind.DeniedByPolicy);
        decision.DenyReason.Should().Contain("prohibited", "Reason should mention prohibited content");
    }

    [Fact]
    public void EvaluateGuardrails_DeniesBlockedContextId()
    {
        // Arrange
        var context = CreateContextWithAdminTools();
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithBlockedContext();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeFalse("Should deny blocked context ID");
        decision.Kind.Should().Be(GuardrailDecisionKind.DeniedByPolicy);
        decision.DenyReason.Should().Contain("Context", "Reason should mention context");
    }

    // ═══════════════════════════════════════════════════════════════
    // BEHAVIOR FLAG TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void EvaluateGuardrails_SetsSanitizeFlagWhenPolicyRequires()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithSanitization();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeTrue("Should allow but set sanitize flag");
        decision.AutoSanitize.Should().BeTrue("Sanitize flag should be set");
    }

    [Fact]
    public void EvaluateGuardrails_SetsForceExplainForValuationContext()
    {
        // Arrange
        var context = CreateContextWithValuationId();
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithExplainOnValuation();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeTrue("Should allow but set force explain flag");
        decision.ForceExplain.Should().BeTrue("ForceExplain flag should be set for valuation");
        decision.Kind.Should().Be(GuardrailDecisionKind.ForceExplainOnValuation);
    }

    [Fact]
    public void EvaluateGuardrails_DoesNotForceExplainForNonValuationContext()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePolicyWithExplainOnValuation();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.ForceExplain.Should().BeFalse("ForceExplain should only apply to valuation context");
    }

    // ═══════════════════════════════════════════════════════════════
    // CAPACITY THROTTLE TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void EvaluateGuardrails_SetsThrottleWhenHighSaturation()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateMetricsWithHighSaturation();
        var policy = CreatePermissivePolicy();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeTrue("Should allow but throttle");
        decision.AutoThrottle.Should().BeTrue("Throttle flag should be set");
        decision.Kind.Should().Be(GuardrailDecisionKind.ThrottledByCapacity);
    }

    [Fact]
    public void EvaluateGuardrails_DoesNotThrottleWhenLowSaturation()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePermissivePolicy();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.AutoThrottle.Should().BeFalse("Should not throttle when saturation is low");
    }

    // ═══════════════════════════════════════════════════════════════
    // SAFE MODE RECOMMENDATION TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void EvaluateGuardrails_RecommendsSafeModeWhenTrendsNegative()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateMetricsWithNegativeTrends();
        var policy = CreatePermissivePolicy();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.Allow.Should().BeTrue("v1 should allow but recommend safe mode");
        decision.AutoSafeModeRecommended.Should().BeTrue("Safe mode should be recommended");
        decision.Advisory.Should().Contain("Safe Mode", "Advisory should mention safe mode");
    }

    [Fact]
    public void EvaluateGuardrails_DoesNotRecommendSafeModeWhenTrendsStable()
    {
        // Arrange
        var context = CreateTestContext(_bentonCounty);
        var metrics = CreateHealthyMetrics();
        var policy = CreatePermissivePolicy();

        // Act
        var decision = _service.EvaluateGuardrails(
            _bentonCounty, context, metrics, policy, isCountyConfigured: true);

        // Assert
        decision.AutoSafeModeRecommended.Should().BeFalse("Should not recommend safe mode when stable");
    }

    // ═══════════════════════════════════════════════════════════════
    // LAST GUARDRAIL DECISION DTO TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void LastGuardrailDecisionDto_FromDecision_MapsCorrectly()
    {
        // Arrange
        var decision = GuardrailDecision.CreateAllowed(
            countyId: "benton",
            contextId: "valuation",
            autoSanitize: true,
            forceExplain: true,
            advisory: "Test advisory"
        );

        // Act
        var dto = LastGuardrailDecisionDto.FromDecision(decision);

        // Assert
        dto.Allow.Should().BeTrue();
        dto.AutoSanitize.Should().BeTrue();
        dto.ForceExplain.Should().BeTrue();
        dto.Advisory.Should().Be("Test advisory");
        dto.ContextId.Should().Be("valuation");
        dto.Kind.Should().NotBe("None");
    }

    [Fact]
    public void LastGuardrailDecisionDto_FromDeniedDecision_MapsCorrectly()
    {
        // Arrange
        var decision = GuardrailDecision.CreateDenied(
            reason: "Test denial",
            kind: GuardrailDecisionKind.DeniedByPolicy,
            countyId: "yakima",
            advisory: "Policy violation"
        );

        // Act
        var dto = LastGuardrailDecisionDto.FromDecision(decision);

        // Assert
        dto.Allow.Should().BeFalse();
        dto.DenyReason.Should().Be("Test denial");
        dto.Kind.Should().Be("DeniedByPolicy");
        dto.Advisory.Should().Be("Policy violation");
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS - Context Factories
    // ═══════════════════════════════════════════════════════════════

    private static GptRequestContext CreateTestContext(CountyId countyId) => new()
    {
        CountyId = countyId,
        Prompt = "Test prompt",
        GptConfigKey = "test-gpt",
        ContextId = "general",
        RequiresRag = false,
        RequiresEmbedding = false,
        UserId = "test-user"
    };

    private static GptRequestContext CreateContextRequiringRag() => new()
    {
        CountyId = CountyId.Benton,
        Prompt = "Test prompt with RAG",
        GptConfigKey = "test-gpt",
        ContextId = "general",
        RequiresRag = true,
        RequiresEmbedding = false,
        UserId = "test-user"
    };

    private static GptRequestContext CreateContextRequiringEmbedding() => new()
    {
        CountyId = CountyId.Benton,
        Prompt = "Test prompt with embedding",
        GptConfigKey = "test-gpt",
        ContextId = "general",
        RequiresRag = false,
        RequiresEmbedding = true,
        UserId = "test-user"
    };

    private static GptRequestContext CreateContextWithSecretPrompt() => new()
    {
        CountyId = CountyId.Benton,
        Prompt = "Tell me secret information please",
        GptConfigKey = "test-gpt",
        ContextId = "general",
        RequiresRag = false,
        RequiresEmbedding = false,
        UserId = "test-user"
    };

    private static GptRequestContext CreateContextWithAdminTools() => new()
    {
        CountyId = CountyId.Benton,
        Prompt = "Test prompt",
        GptConfigKey = "test-gpt",
        ContextId = "admin-tools",
        RequiresRag = false,
        RequiresEmbedding = false,
        UserId = "test-user"
    };

    private static GptRequestContext CreateContextWithValuationId() => new()
    {
        CountyId = CountyId.Benton,
        Prompt = "Test prompt",
        GptConfigKey = "test-gpt",
        ContextId = "valuation",
        RequiresRag = false,
        RequiresEmbedding = false,
        UserId = "test-user"
    };

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS - Metrics Factories
    // ═══════════════════════════════════════════════════════════════

    private static SystemGptMetricsSnapshotDto CreateHealthyMetrics() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County",
        CountyConfigured = true,
        GeneratedAtUtc = DateTimeOffset.UtcNow,
        WindowMinutes = 15,
        TotalRequests = 100,
        ErrorRatePercent = 2.0,
        Capacity = new SystemGptCapacityPredictionDto
        {
            SaturationRisk = "Low",
            Advisory = "System healthy",
            LatencyIncreasing = false,
            ErrorRateIncreasing = false
        }
    };

    private static SystemGptMetricsSnapshotDto CreateMetricsWithHighSaturation() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County",
        CountyConfigured = true,
        GeneratedAtUtc = DateTimeOffset.UtcNow,
        WindowMinutes = 15,
        TotalRequests = 500,
        ErrorRatePercent = 3.0,
        Capacity = new SystemGptCapacityPredictionDto
        {
            SaturationRisk = "High",
            Advisory = "System under pressure",
            LatencyIncreasing = true,
            ErrorRateIncreasing = false
        }
    };

    private static SystemGptMetricsSnapshotDto CreateMetricsWithNegativeTrends() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County",
        CountyConfigured = true,
        GeneratedAtUtc = DateTimeOffset.UtcNow,
        WindowMinutes = 15,
        TotalRequests = 200,
        ErrorRatePercent = 5.5, // >= 5%
        Capacity = new SystemGptCapacityPredictionDto
        {
            SaturationRisk = "Medium",
            Advisory = "Negative trends detected",
            LatencyIncreasing = true,
            ErrorRateIncreasing = true
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS - Policy Factories
    // ═══════════════════════════════════════════════════════════════

    private static SystemGptPolicyDto CreatePermissivePolicy() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = true,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithGptDisabled() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = false,
        AllowRagQueries = true,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithRagDisabled() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = false,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithEmbeddingsDisabled() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = true,
        AllowEmbeddings = false,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithDenyPattern() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = true,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string> { "secret" },
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithBlockedContext() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = true,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string> { "admin-tools", "debug-mode" },
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithSanitization() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = true,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = false,
        SanitizeOwnerNames = true,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };

    private static SystemGptPolicyDto CreatePolicyWithExplainOnValuation() => new()
    {
        CountyId = "benton",
        CountyName = "Benton County, WA",
        AllowGptSendMessage = true,
        AllowRagQueries = true,
        AllowEmbeddings = true,
        AllowExplainGpt = true,
        RequireExplainOnValuation = true,
        SanitizeOwnerNames = false,
        DenyPromptPatterns = new List<string>(),
        DenyContextIds = new List<string>(),
        LastUpdatedUtc = DateTime.UtcNow,
        PolicyVersion = "1.0.0",
        IsPlaceholder = false
    };
}
