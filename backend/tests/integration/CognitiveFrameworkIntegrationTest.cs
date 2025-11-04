using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Text;
using System.Text.Json;
using TerraFusion.API.DTOs;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.Tests.Integration;

/// <summary>
/// Integration tests for the 3-6-9-12 Cognitive Framework
/// Validates all 4 tiers: Individual (3) → Team (6) → Platform (9) → Organization (12)
/// </summary>
public class CognitiveFrameworkIntegrationTest : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CognitiveFrameworkIntegrationTest(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    #region TIER 1 Tests (3-Phase Individual Tasks)

    [Fact]
    public async Task ClassifyTask_SimpleBugFix_ShouldReturnTier1()
    {
        // Arrange
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Fix login button color",
            Description = "Change login button from blue to green",
            EstimatedHours = 1,
            RequiredSkills = new[] { "CSS" },
            StakeholderCount = 1,
            SystemsAffected = 1,
            RiskLevel = "Low",
            OrganizationalScope = "Individual"
        };

        // Act
        var response = await PostJsonAsync<TaskClassificationResponse>(
            "/api/cognitive-framework/classify", request);

        // Assert
        response.Should().NotBeNull();
        response.Tier.Should().Be(1);
        response.Phases.Should().HaveCount(3);
        response.Phases.Should().Contain(p => p.Name == "UNDERSTAND");
        response.Phases.Should().Contain(p => p.Name == "BUILD");
        response.Phases.Should().Contain(p => p.Name == "VALIDATE");
        response.ConfidenceGate.Should().BeGreaterOrEqualTo(85);
    }

    [Fact]
    public async Task GenerateExecutionPlan_Tier1Task_ShouldOptimizeForIndividualCognition()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Update user documentation",
            Tier = 1,
            CognitiveLoadTarget = 7 // Miller's Law optimization
        };

        // Act
        var response = await PostJsonAsync<ExecutionPlanResponse>(
            "/api/cognitive-framework/execution-plan", request);

        // Assert
        response.Should().NotBeNull();
        response.Phases.Should().HaveCount(3);
        response.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(7);
        response.ParallelizationOpportunities.Should().BeEmpty(); // Individual work
    }

    #endregion

    #region TIER 2 Tests (6-Phase Team Tasks)

    [Fact]
    public async Task ClassifyTask_FeatureImplementation_ShouldReturnTier2()
    {
        // Arrange
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Implement property search API",
            Description = "Build RESTful API for property search with filters, pagination, and validation",
            EstimatedHours = 25,
            RequiredSkills = new[] { "C#", ".NET", "Entity Framework", "Testing" },
            StakeholderCount = 3,
            SystemsAffected = 2,
            RiskLevel = "Medium",
            OrganizationalScope = "Team"
        };

        // Act
        var response = await PostJsonAsync<TaskClassificationResponse>(
            "/api/cognitive-framework/classify", request);

        // Assert
        response.Should().NotBeNull();
        response.Tier.Should().Be(2);
        response.Phases.Should().HaveCount(6);
        response.Phases.Should().Contain(p => p.Name == "CLARIFY");
        response.Phases.Should().Contain(p => p.Name == "RESEARCH");
        response.Phases.Should().Contain(p => p.Name == "DESIGN");
        response.Phases.Should().Contain(p => p.Name == "BUILD");
        response.Phases.Should().Contain(p => p.Name == "VERIFY");
        response.Phases.Should().Contain(p => p.Name == "OPERATE");
        response.ConfidenceGate.Should().BeGreaterOrEqualTo(90);
    }

    [Fact]
    public async Task GenerateExecutionPlan_Tier2Task_ShouldEnableTeamCollaboration()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Implement 3-6-9 Cognitive Framework",
            Tier = 2,
            CognitiveLoadTarget = 6
        };

        // Act
        var response = await PostJsonAsync<ExecutionPlanResponse>(
            "/api/cognitive-framework/execution-plan", request);

        // Assert
        response.Should().NotBeNull();
        response.Phases.Should().HaveCount(6);
        response.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(6);
        response.ParallelizationOpportunities.Should().NotBeEmpty();
        response.TeamSynchronizationPoints.Should().NotBeEmpty();
    }

    #endregion

    #region TIER 3 Tests (9-Phase Platform Tasks)

    [Fact]
    public async Task ClassifyTask_PlatformMigration_ShouldReturnTier3()
    {
        // Arrange
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Migrate TerraFusion to .NET 8",
            Description = "Upgrade entire platform from .NET 6 to .NET 8 with performance optimizations",
            EstimatedHours = 200,
            RequiredSkills = new[] { ".NET 8", "Migration", "Performance", "Testing", "DevOps" },
            StakeholderCount = 8,
            SystemsAffected = 15,
            RiskLevel = "High",
            OrganizationalScope = "Platform"
        };

        // Act
        var response = await PostJsonAsync<TaskClassificationResponse>(
            "/api/cognitive-framework/classify", request);

        // Assert
        response.Should().NotBeNull();
        response.Tier.Should().Be(3);
        response.Phases.Should().HaveCount(9);
        response.Phases.Should().Contain(p => p.Name == "ENVISION");
        response.Phases.Should().Contain(p => p.Name == "ARCHITECT");
        response.Phases.Should().Contain(p => p.Name == "INTEGRATE");
        response.Phases.Should().Contain(p => p.Name == "SECURE");
        response.Phases.Should().Contain(p => p.Name == "OPTIMIZE");
        response.Phases.Should().Contain(p => p.Name == "VALIDATE");
        response.Phases.Should().Contain(p => p.Name == "DEPLOY");
        response.Phases.Should().Contain(p => p.Name == "MONITOR");
        response.Phases.Should().Contain(p => p.Name == "TRANSCEND");
        response.ConfidenceGate.Should().BeGreaterOrEqualTo(95);
    }

    [Fact]
    public async Task GenerateExecutionPlan_Tier3Task_ShouldOptimizePlatformArchitecture()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Build AI Swarm Orchestration Platform",
            Tier = 3,
            CognitiveLoadTarget = 5
        };

        // Act
        var response = await PostJsonAsync<ExecutionPlanResponse>(
            "/api/cognitive-framework/execution-plan", request);

        // Assert
        response.Should().NotBeNull();
        response.Phases.Should().HaveCount(9);
        response.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(5);
        response.ParallelizationOpportunities.Should().HaveCountGreaterThan(3);
        response.ArchitecturalDecisionPoints.Should().NotBeEmpty();
    }

    #endregion

    #region TIER 4 Tests (12-Phase Organizational Transformation)

    [Fact]
    public async Task ClassifyTask_OrganizationalTransformation_ShouldReturnTier4()
    {
        // Arrange - This is the revolutionary 12-phase tier we just added!
        var request = new TaskClassificationRequest
        {
            TaskTitle = "Transform Washington State County Assessment Operations with AI",
            Description = "Deploy TerraFusion OS across 39 counties with 50,000+ AI agents for autonomous government operations",
            EstimatedHours = 5000,
            RequiredSkills = new[] { "Government", "AI", "Change Management", "Policy", "Training", "Compliance" },
            StakeholderCount = 500,
            SystemsAffected = 100,
            RiskLevel = "Critical",
            OrganizationalScope = "Multi-County Government Transformation"
        };

        // Act
        var response = await PostJsonAsync<TaskClassificationResponse>(
            "/api/cognitive-framework/classify", request);

        // Assert
        response.Should().NotBeNull();
        response.Tier.Should().Be(4);
        response.Phases.Should().HaveCount(12);
        response.Phases.Should().Contain(p => p.Name == "ILLUMINATE");
        response.Phases.Should().Contain(p => p.Name == "MOBILIZE");
        response.Phases.Should().Contain(p => p.Name == "STRATEGIZE");
        response.Phases.Should().Contain(p => p.Name == "ARCHITECT");
        response.Phases.Should().Contain(p => p.Name == "VALIDATE");
        response.Phases.Should().Contain(p => p.Name == "DEPLOY");
        response.Phases.Should().Contain(p => p.Name == "INTEGRATE");
        response.Phases.Should().Contain(p => p.Name == "OPTIMIZE");
        response.Phases.Should().Contain(p => p.Name == "MONITOR");
        response.Phases.Should().Contain(p => p.Name == "GOVERN");
        response.Phases.Should().Contain(p => p.Name == "EVOLVE");
        response.Phases.Should().Contain(p => p.Name == "TRANSCEND");
        response.ConfidenceGate.Should().BeGreaterOrEqualTo(97);
    }

    [Fact]
    public async Task GenerateExecutionPlan_Tier4Task_ShouldOrchestrateMassiveTransformation()
    {
        // Arrange
        var request = new ExecutionPlanRequest
        {
            TaskTitle = "Deploy Government.Transcended Operating System",
            Tier = 4,
            CognitiveLoadTarget = 3 // Maximum cognitive load reduction for transformation scale
        };

        // Act
        var response = await PostJsonAsync<ExecutionPlanResponse>(
            "/api/cognitive-framework/execution-plan", request);

        // Assert
        response.Should().NotBeNull();
        response.Phases.Should().HaveCount(12);
        response.EstimatedCognitiveLoad.Should().BeLessOrEqualTo(3);
        response.ParallelizationOpportunities.Should().HaveCountGreaterThan(8);
        response.OrganizationalChangeManagement.Should().NotBeEmpty();
        response.GovernanceFramework.Should().NotBeEmpty();
    }

    #endregion

    #region Edge Cases & Validation

    [Fact]
    public async Task EvaluateConfidenceGate_HighComplexityTask_ShouldRequireHighConfidence()
    {
        // Arrange
        var request = new ConfidenceGateRequest
        {
            TaskComplexity = 9,
            StakeholderCount = 50,
            RiskLevel = "Critical"
        };

        // Act
        var response = await PostJsonAsync<ConfidenceGateResponse>(
            "/api/cognitive-framework/confidence-gate", request);

        // Assert
        response.Should().NotBeNull();
        response.RequiredConfidence.Should().BeGreaterOrEqualTo(95);
        response.RecommendedActions.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetFrameworkMetrics_ShouldReturnUsageStatistics()
    {
        // Act
        var response = await _client.GetAsync("/api/cognitive-framework/metrics");

        // Assert
        response.Should().NotBeNull();
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var metrics = JsonSerializer.Deserialize<FrameworkMetricsResponse>(content, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        metrics.Should().NotBeNull();
        metrics.TotalTasksClassified.Should().BeGreaterOrEqualTo(0);
        metrics.TierDistribution.Should().NotBeEmpty();
    }

    #endregion

    #region Helper Methods

    private async Task<T> PostJsonAsync<T>(string url, object request)
    {
        var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        var response = await _client.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));

        response.IsSuccessStatusCode.Should().BeTrue($"Expected success but got {response.StatusCode}");

        var responseContent = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(responseContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        })!;
    }

    #endregion
}

/// <summary>
/// Test-specific DTOs for validation
/// </summary>
public class FrameworkMetricsResponse
{
    public int TotalTasksClassified { get; set; }
    public Dictionary<int, int> TierDistribution { get; set; } = new();
    public double AverageConfidenceScore { get; set; }
    public List<string> MostCommonPhases { get; set; } = new();
}
