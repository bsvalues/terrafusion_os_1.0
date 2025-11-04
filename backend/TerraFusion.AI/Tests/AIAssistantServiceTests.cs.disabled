// ═══════════════════════════════════════════════════════════════
// AIAssistantService Unit Tests
// TerraFusion Elite Government OS - Backend Testing Suite
// Comprehensive xUnit test coverage with Moq dependencies
// Government. Transcended. - Championship Test Excellence
// ═══════════════════════════════════════════════════════════════

using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.AI.Services;
using TerraFusion.AI.Models;
using TerraFusion.AI.Interfaces;
using TerraFusion.Consciousness.Interfaces;

namespace TerraFusion.AI.Tests
{
    /// <summary>
    /// Comprehensive unit tests for AIAssistantService
    /// Coverage: All public methods, edge cases, error handling
    /// Test Framework: xUnit with Moq for dependency injection
    /// </summary>
    public class AIAssistantServiceTests : IDisposable
    {
        private readonly Mock<ILogger<AIAssistantService>> _mockLogger;
        private readonly Mock<IConsciousnessEngine> _mockConsciousnessEngine;
        private readonly Mock<TerraFusion.AI.Services.IPropertyValuationService> _mockPropertyValuation;
        private readonly Mock<IComplianceService> _mockComplianceService;
        private readonly AIAssistantService _service;
        private readonly CancellationTokenSource _cancellationTokenSource;

        public AIAssistantServiceTests()
        {
            // Initialize mocks for all dependencies
            _mockLogger = new Mock<ILogger<AIAssistantService>>();
            _mockConsciousnessEngine = new Mock<IConsciousnessEngine>();
            _mockPropertyValuation = new Mock<TerraFusion.AI.Services.IPropertyValuationService>();
            _mockComplianceService = new Mock<IComplianceService>();
            _cancellationTokenSource = new CancellationTokenSource();

            // Create service with mocked dependencies
            _service = new AIAssistantService(
                _mockLogger.Object,
                _mockConsciousnessEngine.Object,
                _mockPropertyValuation.Object,
                _mockComplianceService.Object
            );
        }

        public void Dispose()
        {
            _cancellationTokenSource?.Dispose();
        }

        #region SendMessage Tests

        [Fact]
        public async Task SendMessage_WithValidInput_ReturnsSuccessResponse()
        {
            // Arrange
            var request = new AIMessageRequest
            {
                CountyId = "benton",
                UserId = "assessor-001",
                Message = "Analyze property #8842 for assessment accuracy",
                Context = new MessageContext { PropertyId = "8842" }
            };

            var expectedResponse = new AIMessageResponse
            {
                MessageId = Guid.NewGuid().ToString(),
                Response = "Property #8842 analysis complete. Current assessment: $485,000. AI valuation: $498,500 (+2.8%). Confidence: 96.3%",
                Confidence = 0.963m,
                Insights = new List<AIInsight>
                {
                    new AIInsight { Type = "VALUATION", Description = "Market value increase detected", Priority = "HIGH" }
                },
                ProcessingTimeMs = 85
            };

            _mockConsciousnessEngine
                .Setup(x => x.ProcessMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _service.SendMessageAsync(request, _cancellationTokenSource.Token);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Response.Should().Contain("Property #8842");
            result.Confidence.Should().BeGreaterThan(0.95m);
            result.ProcessingTimeMs.Should().BeLessThan(100);

            _mockConsciousnessEngine.Verify(
                x => x.ProcessMessageAsync(request.Message, request.CountyId, It.IsAny<CancellationToken>()),
                Times.Once
            );
        }

        [Fact]
        public async Task SendMessage_WithNullRequest_ThrowsArgumentNullException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.SendMessageAsync(null!, _cancellationTokenSource.Token)
            );
        }

        [Theory]
        [InlineData(null, "assessor-001", "Test message")]
        [InlineData("", "assessor-001", "Test message")]
        [InlineData("benton", null, "Test message")]
        [InlineData("benton", "", "Test message")]
        [InlineData("benton", "assessor-001", null)]
        [InlineData("benton", "assessor-001", "")]
        public async Task SendMessage_WithInvalidParameters_ThrowsArgumentException(
            string countyId, string userId, string message)
        {
            // Arrange
            var request = new AIMessageRequest
            {
                CountyId = countyId,
                UserId = userId,
                Message = message
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.SendMessageAsync(request, _cancellationTokenSource.Token)
            );
        }

        [Fact]
        public async Task SendMessage_WhenConsciousnessEngineThrows_HandlesGracefully()
        {
            // Arrange
            var request = new AIMessageRequest
            {
                CountyId = "benton",
                UserId = "assessor-001",
                Message = "Test message"
            };

            _mockConsciousnessEngine
                .Setup(x => x.ProcessMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("AI swarm coordination failure"));

            // Act
            var result = await _service.SendMessageAsync(request, _cancellationTokenSource.Token);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Error.Should().Contain("AI swarm coordination failure");

            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once
            );
        }

        [Fact]
        public async Task SendMessage_WithCancellation_ThrowsOperationCanceledException()
        {
            // Arrange
            var request = new AIMessageRequest
            {
                CountyId = "benton",
                UserId = "assessor-001",
                Message = "Test message"
            };

            var cts = new CancellationTokenSource();
            cts.Cancel();

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(
                () => _service.SendMessageAsync(request, cts.Token)
            );
        }

        #endregion

        #region GetSwarmStatus Tests

        [Fact]
        public async Task GetSwarmStatus_WithValidCountyId_ReturnsComprehensiveStatus()
        {
            // Arrange
            var countyId = "benton";
            var expectedStatus = new AISwarmStatus
            {
                CountyId = countyId,
                ActiveAgents = 50247,
                TotalAgents = 50000,
                QuantumOptimizationFactor = 949,
                AccuracyScore = 0.995m,
                AverageResponseTimeMs = 45,
                ProcessingCapacity = 0.87m,
                LastUpdateUtc = DateTime.UtcNow
            };

            _mockConsciousnessEngine
                .Setup(x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedStatus);

            // Act
            var result = await _service.GetSwarmStatusAsync(countyId, _cancellationTokenSource.Token);

            // Assert
            result.Should().NotBeNull();
            result.CountyId.Should().Be(countyId);
            result.ActiveAgents.Should().BeGreaterThan(50000);
            result.QuantumOptimizationFactor.Should().Be(949);
            result.AccuracyScore.Should().BeGreaterThan(0.99m);
            result.AverageResponseTimeMs.Should().BeLessThan(50);

            _mockConsciousnessEngine.Verify(
                x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()),
                Times.Once
            );
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public async Task GetSwarmStatus_WithInvalidCountyId_ThrowsArgumentException(string countyId)
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.GetSwarmStatusAsync(countyId, _cancellationTokenSource.Token)
            );
        }

        [Fact]
        public async Task GetSwarmStatus_WithUnknownCounty_ReturnsEmptyStatus()
        {
            // Arrange
            var countyId = "unknown-county";

            _mockConsciousnessEngine
                .Setup(x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((AISwarmStatus?)null);

            // Act
            var result = await _service.GetSwarmStatusAsync(countyId, _cancellationTokenSource.Token);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetSwarmStatus_VerifiesChampionshipMetrics()
        {
            // Arrange
            var countyId = "benton";
            var status = new AISwarmStatus
            {
                CountyId = countyId,
                ActiveAgents = 50247,
                AccuracyScore = 0.997m,
                AverageResponseTimeMs = 38,
                QuantumOptimizationFactor = 949
            };

            _mockConsciousnessEngine
                .Setup(x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(status);

            // Act
            var result = await _service.GetSwarmStatusAsync(countyId, _cancellationTokenSource.Token);

            // Assert - Championship standards
            result!.AccuracyScore.Should().BeGreaterThan(0.995m, "Championship accuracy: >99.5%");
            result.AverageResponseTimeMs.Should().BeLessThan(50, "Championship response: <50ms");
            result.QuantumOptimizationFactor.Should().Be(949, "Quantum factor: 949");
            result.ActiveAgents.Should().BeGreaterThan(50000, "AI swarm: >50,000 agents");
        }

        #endregion

        #region GetRecommendations Tests

        [Fact]
        public async Task GetRecommendations_WithValidInput_ReturnsAIInsights()
        {
            // Arrange
            var countyId = "benton";
            var userId = "assessor-001";
            var expectedRecommendations = new List<AIRecommendation>
            {
                new AIRecommendation
                {
                    Id = Guid.NewGuid().ToString(),
                    Type = "PROPERTY_VALUATION",
                    Title = "Market Value Adjustment Recommended",
                    Description = "3 properties show significant market value changes (+15-20%)",
                    Confidence = 0.942m,
                    Priority = "HIGH",
                    ActionItems = new[] { "Review comparable sales", "Update valuations", "Notify assessors" }
                },
                new AIRecommendation
                {
                    Id = Guid.NewGuid().ToString(),
                    Type = "WORKFLOW_OPTIMIZATION",
                    Title = "Bulk Assessment Workflow Optimization",
                    Description = "Process 847 properties 18.5 hours faster with AI coordination",
                    Confidence = 0.967m,
                    Priority = "MEDIUM",
                    EstimatedTimeSavings = TimeSpan.FromHours(18.5)
                }
            };

            _mockConsciousnessEngine
                .Setup(x => x.GetRecommendationsAsync(countyId, userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedRecommendations);

            // Act
            var result = await _service.GetRecommendationsAsync(countyId, userId, _cancellationTokenSource.Token);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.Should().Contain(r => r.Type == "PROPERTY_VALUATION");
            result.Should().Contain(r => r.Confidence > 0.94m);
            result.Should().OnlyContain(r => r.Priority is "HIGH" or "MEDIUM" or "LOW");
        }

        [Fact]
        public async Task GetRecommendations_FiltersLowConfidenceInsights()
        {
            // Arrange
            var countyId = "benton";
            var userId = "assessor-001";
            var allRecommendations = new List<AIRecommendation>
            {
                new AIRecommendation { Confidence = 0.98m, Title = "High confidence" },
                new AIRecommendation { Confidence = 0.75m, Title = "Medium confidence" },
                new AIRecommendation { Confidence = 0.45m, Title = "Low confidence" }
            };

            _mockConsciousnessEngine
                .Setup(x => x.GetRecommendationsAsync(countyId, userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(allRecommendations);

            // Act
            var result = await _service.GetRecommendationsAsync(
                countyId, userId, _cancellationTokenSource.Token, minConfidence: 0.90m);

            // Assert
            result.Should().HaveCount(1);
            result.Should().OnlyContain(r => r.Confidence >= 0.90m);
        }

        #endregion

        #region AnalyzeProperty Tests

        [Fact]
        public async Task AnalyzeProperty_WithValidPropertyId_ReturnsComprehensiveAnalysis()
        {
            // Arrange
            var countyId = "benton";
            var propertyId = "8842";
            var expectedAnalysis = new PropertyAnalysis
            {
                PropertyId = propertyId,
                CountyId = countyId,
                CurrentAssessment = 485000m,
                AIValuation = 498500m,
                ValuationConfidence = 0.963m,
                MarketTrend = "INCREASING",
                ComparableSales = 847,
                IAAOCompliance = new ComplianceResult
                {
                    IsCompliant = true,
                    COD = 14.8m, // Coefficient of Dispersion
                    PRD = 1.01m, // Price-Related Differential
                    AssessmentLevel = 0.985m
                },
                Insights = new List<AIInsight>
                {
                    new AIInsight
                    {
                        Type = "VALUATION_ADJUSTMENT",
                        Description = "Market value increase detected: +2.8%",
                        Confidence = 0.963m,
                        Priority = "HIGH"
                    }
                },
                AnalysisTimestamp = DateTime.UtcNow,
                ProcessingTimeMs = 125
            };

            _mockPropertyValuation
                .Setup(x => x.AnalyzePropertyAsync(propertyId, countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedAnalysis);

            _mockComplianceService
                .Setup(x => x.ValidateIAAOComplianceAsync(It.IsAny<PropertyAnalysis>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedAnalysis.IAAOCompliance);

            // Act
            var result = await _service.AnalyzePropertyAsync(countyId, propertyId, _cancellationTokenSource.Token);

            // Assert
            result.Should().NotBeNull();
            result.PropertyId.Should().Be(propertyId);
            result.AIValuation.Should().BeGreaterThan(result.CurrentAssessment);
            result.ValuationConfidence.Should().BeGreaterThan(0.95m);
            result.IAAOCompliance.Should().NotBeNull();
            result.IAAOCompliance!.IsCompliant.Should().BeTrue();
            result.ComparableSales.Should().BeGreaterThan(0);
            result.ProcessingTimeMs.Should().BeLessThan(200);

            _mockPropertyValuation.Verify(
                x => x.AnalyzePropertyAsync(propertyId, countyId, It.IsAny<CancellationToken>()),
                Times.Once
            );
        }

        [Fact]
        public async Task AnalyzeProperty_ValidatesIAAOStandards()
        {
            // Arrange
            var countyId = "benton";
            var propertyId = "8842";
            var analysis = new PropertyAnalysis
            {
                PropertyId = propertyId,
                CountyId = countyId,
                IAAOCompliance = new ComplianceResult
                {
                    IsCompliant = true,
                    COD = 14.8m,  // Should be ≤15.0% for residential
                    PRD = 1.01m,   // Should be 0.98-1.03
                    AssessmentLevel = 0.985m // Should be 0.90-1.10
                }
            };

            _mockPropertyValuation
                .Setup(x => x.AnalyzePropertyAsync(propertyId, countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(analysis);

            _mockComplianceService
                .Setup(x => x.ValidateIAAOComplianceAsync(It.IsAny<PropertyAnalysis>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(analysis.IAAOCompliance);

            // Act
            var result = await _service.AnalyzePropertyAsync(countyId, propertyId, _cancellationTokenSource.Token);

            // Assert - IAAO Standard compliance
            result.IAAOCompliance!.COD.Should().BeLessOrEqualTo(15.0m, "COD should be ≤15% for residential");
            result.IAAOCompliance.PRD.Should().BeInRange(0.98m, 1.03m, "PRD should be 0.98-1.03");
            result.IAAOCompliance.AssessmentLevel.Should().BeInRange(0.90m, 1.10m, "Assessment level 0.90-1.10");

            _mockComplianceService.Verify(
                x => x.ValidateIAAOComplianceAsync(It.IsAny<PropertyAnalysis>(), It.IsAny<CancellationToken>()),
                Times.Once
            );
        }

        [Fact]
        public async Task AnalyzeProperty_WithNonExistentProperty_ReturnsNull()
        {
            // Arrange
            var countyId = "benton";
            var propertyId = "non-existent-99999";

            _mockPropertyValuation
                .Setup(x => x.AnalyzePropertyAsync(propertyId, countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((PropertyAnalysis?)null);

            // Act
            var result = await _service.AnalyzePropertyAsync(countyId, propertyId, _cancellationTokenSource.Token);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region Performance Tests

        [Fact]
        public async Task SendMessage_MeetsChampionshipResponseTime()
        {
            // Arrange
            var request = new AIMessageRequest
            {
                CountyId = "benton",
                UserId = "assessor-001",
                Message = "Quick status check"
            };

            var response = new AIMessageResponse
            {
                MessageId = Guid.NewGuid().ToString(),
                Response = "Status: Operational",
                ProcessingTimeMs = 42
            };

            _mockConsciousnessEngine
                .Setup(x => x.ProcessMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Act
            var result = await _service.SendMessageAsync(request, _cancellationTokenSource.Token);

            stopwatch.Stop();

            // Assert - Championship standard: <100ms total
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(100, "Championship response time: <100ms");
            result.ProcessingTimeMs.Should().BeLessThan(50, "AI processing: <50ms");
        }

        [Fact]
        public async Task GetSwarmStatus_HandlesConcurrentRequests()
        {
            // Arrange
            var countyId = "benton";
            var status = new AISwarmStatus
            {
                CountyId = countyId,
                ActiveAgents = 50247,
                AccuracyScore = 0.995m
            };

            _mockConsciousnessEngine
                .Setup(x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(status);

            // Act - 100 concurrent requests
            var tasks = Enumerable.Range(0, 100)
                .Select(_ => _service.GetSwarmStatusAsync(countyId, _cancellationTokenSource.Token))
                .ToArray();

            var results = await Task.WhenAll(tasks);

            // Assert
            results.Should().HaveCount(100);
            results.Should().OnlyContain(r => r != null);
            results.Should().OnlyContain(r => r!.CountyId == countyId);

            // Verify caching or efficient handling
            _mockConsciousnessEngine.Verify(
                x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()),
                Times.AtLeast(1)
            );
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public async Task Service_HandlesConsciousnessEngineTimeout()
        {
            // Arrange
            var request = new AIMessageRequest
            {
                CountyId = "benton",
                UserId = "assessor-001",
                Message = "Test message"
            };

            _mockConsciousnessEngine
                .Setup(x => x.ProcessMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new TimeoutException("AI swarm coordination timeout after 30 seconds"));

            // Act
            var result = await _service.SendMessageAsync(request, _cancellationTokenSource.Token);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Error.Should().Contain("timeout");

            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once
            );
        }

        [Fact]
        public async Task Service_HandlesPropertyValuationFailure()
        {
            // Arrange
            var countyId = "benton";
            var propertyId = "8842";

            _mockPropertyValuation
                .Setup(x => x.AnalyzePropertyAsync(propertyId, countyId, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Property data unavailable"));

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.AnalyzePropertyAsync(countyId, propertyId, _cancellationTokenSource.Token)
            );
        }

        #endregion

        #region Integration Tests

        [Fact]
        public async Task CompleteWorkflow_MessageToAnalysis_IntegratesCorrectly()
        {
            // Arrange - Simulate complete user workflow
            var countyId = "benton";
            var userId = "assessor-001";
            var propertyId = "8842";

            // Setup mocks for complete workflow
            var messageResponse = new AIMessageResponse
            {
                MessageId = Guid.NewGuid().ToString(),
                Response = "Property analysis available",
                Confidence = 0.98m
            };

            var swarmStatus = new AISwarmStatus
            {
                CountyId = countyId,
                ActiveAgents = 50247,
                AccuracyScore = 0.995m
            };

            var propertyAnalysis = new PropertyAnalysis
            {
                PropertyId = propertyId,
                CountyId = countyId,
                AIValuation = 498500m,
                ValuationConfidence = 0.963m
            };

            _mockConsciousnessEngine
                .Setup(x => x.ProcessMessageAsync(It.IsAny<string>(), countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(messageResponse);

            _mockConsciousnessEngine
                .Setup(x => x.GetSwarmStatusAsync(countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(swarmStatus);

            _mockPropertyValuation
                .Setup(x => x.AnalyzePropertyAsync(propertyId, countyId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(propertyAnalysis);

            // Act - Execute complete workflow
            var messageRequest = new AIMessageRequest
            {
                CountyId = countyId,
                UserId = userId,
                Message = $"Analyze property #{propertyId}"
            };

            var messageResult = await _service.SendMessageAsync(messageRequest, _cancellationTokenSource.Token);
            var statusResult = await _service.GetSwarmStatusAsync(countyId, _cancellationTokenSource.Token);
            var analysisResult = await _service.AnalyzePropertyAsync(countyId, propertyId, _cancellationTokenSource.Token);

            // Assert - Complete workflow validation
            messageResult.Success.Should().BeTrue();
            messageResult.Confidence.Should().BeGreaterThan(0.95m);

            statusResult.Should().NotBeNull();
            statusResult!.ActiveAgents.Should().BeGreaterThan(50000);
            statusResult.AccuracyScore.Should().BeGreaterThan(0.99m);

            analysisResult.Should().NotBeNull();
            analysisResult!.ValuationConfidence.Should().BeGreaterThan(0.95m);

            // Verify all services called
            _mockConsciousnessEngine.Verify(
                x => x.ProcessMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Once
            );
            _mockConsciousnessEngine.Verify(
                x => x.GetSwarmStatusAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Once
            );
            _mockPropertyValuation.Verify(
                x => x.AnalyzePropertyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Once
            );
        }

        #endregion
    }
}
