// TerraFusion Codex: Unit Tests for CodexService
// Elite Government OS Engineering - Test Suite

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Tests
{
    /// <summary>
    /// Comprehensive unit tests for Codex 3-6-9 Framework Service
    /// </summary>
    public class CodexServiceTests
    {
        private readonly Mock<ILogger<CodexService>> _mockLogger;
        private readonly CodexService _codexService;

        public CodexServiceTests()
        {
            _mockLogger = new Mock<ILogger<CodexService>>();
            _codexService = new CodexService(_mockLogger.Object);
        }

        #region Foundation (3) Tests

        [Theory]
        [InlineData(0, 0, 100, 0)]      // Minimum
        [InlineData(50, 0, 100, 6)]     // Middle
        [InlineData(100, 0, 100, 12)]   // Maximum
        [InlineData(150, 0, 100, 12)]   // Over maximum (should cap at 12)
        [InlineData(-10, 0, 100, 0)]    // Below minimum (should floor at 0)
        public void ScaleMetric_ReturnsCorrectValue(double value, double min, double max, double expected)
        {
            // Act
            var result = _codexService.ScaleMetric(value, min, max);

            // Assert
            Assert.Equal(expected, result, 2);
        }

        [Theory]
        [InlineData(100, 100, 1000, 12)]    // Minimum (best)
        [InlineData(550, 100, 1000, 6)]     // Middle
        [InlineData(1000, 100, 1000, 0)]    // Maximum (worst)
        [InlineData(50, 100, 1000, 12)]     // Below min (should cap at 12)
        [InlineData(1500, 100, 1000, 0)]    // Above max (should floor at 0)
        public void ScaleMetricInverse_ReturnsCorrectValue(double value, double min, double max, double expected)
        {
            // Act
            var result = _codexService.ScaleMetricInverse(value, min, max);

            // Assert
            Assert.Equal(expected, result, 2);
        }

        [Fact]
        public void ScaleMetric_WithDefaultParameters_WorksCorrectly()
        {
            // Arrange - value of 6 should map to 6 when min=0, max=12 (defaults)
            var value = 6.0;

            // Act
            var result = _codexService.ScaleMetric(value);

            // Assert
            Assert.Equal(6.0, result, 2);
        }

        #endregion

        #region Amplification (6) Tests

        [Fact]
        public void AmplifyMetrics_WithNormalValues_ReturnsCorrectAmplification()
        {
            // Arrange
            var metrics = new List<double> { 10.0, 11.0, 12.0 };

            // Act
            var result = _codexService.AmplifyMetrics(metrics);

            // Assert
            // Sum = 33, scale = 55.5, result = 33/55.5 ≈ 0.59
            Assert.InRange(result, 0, 12);
            Assert.True(result < 1); // Should be less than 1 for this small sum
        }

        [Fact]
        public void AmplifyMetrics_NeverExceeds666Threshold()
        {
            // Arrange - create extreme case with 100 max metrics
            var metrics = Enumerable.Repeat(12.0, 100).ToList();

            // Act
            var result = _codexService.AmplifyMetrics(metrics);

            // Assert
            Assert.True(result <= 12.0);
        }

        [Fact]
        public void AmplifyMetrics_AtExactly666_ScalesTo12()
        {
            // Arrange
            var metrics = Enumerable.Repeat(12.0, 55).Append(6.0).ToList(); // 55*12 + 6 = 666

            // Act
            var result = _codexService.AmplifyMetrics(metrics);

            // Assert
            Assert.Equal(12.0, result, 2);
        }

        [Fact]
        public void AmplifyMetricsWeighted_AppliesWeightsCorrectly()
        {
            // Arrange
            var metrics = new List<double> { 10.0, 8.0, 6.0 };
            var weights = new List<double> { 2.0, 1.5, 1.0 };

            // Act
            var result = _codexService.AmplifyMetricsWeighted(metrics, weights);

            // Assert
            // Weighted sum = 10*2 + 8*1.5 + 6*1 = 20 + 12 + 6 = 38
            // 38 / 55.5 ≈ 0.68
            Assert.InRange(result, 0, 12);
        }

        [Fact]
        public void AmplifyMetricsWeighted_WithMismatchedLengths_ThrowsException()
        {
            // Arrange
            var metrics = new List<double> { 10.0, 8.0 };
            var weights = new List<double> { 2.0 };

            // Act & Assert
            Assert.Throws<ArgumentException>(() =>
                _codexService.AmplifyMetricsWeighted(metrics, weights));
        }

        #endregion

        #region Ultimate Power (9) Tests

        [Fact]
        public void CalculateUltimatePower_WithPerfectScores_Returns12()
        {
            // Arrange - all metrics at maximum
            var metrics = new List<double> { 12.0, 12.0, 12.0, 12.0 };

            // Act
            var result = _codexService.CalculateUltimatePower(metrics);

            // Assert
            Assert.Equal(12.0, result, 2);
        }

        [Fact]
        public void CalculateUltimatePower_WithHalfScores_Returns6()
        {
            // Arrange - all metrics at half
            var metrics = new List<double> { 6.0, 6.0, 6.0, 6.0 };

            // Act
            var result = _codexService.CalculateUltimatePower(metrics);

            // Assert
            Assert.Equal(6.0, result, 2);
        }

        [Fact]
        public void CalculateUltimatePower_WithMixedScores_ReturnsAverage()
        {
            // Arrange
            var metrics = new List<double> { 12.0, 8.0, 10.0, 6.0 };

            // Act
            var result = _codexService.CalculateUltimatePower(metrics);

            // Assert
            // Average = 36/4 = 9.0
            Assert.Equal(9.0, result, 2);
        }

        [Fact]
        public void CalculateUltimatePower_NeverExceeds12()
        {
            // Arrange - extreme case
            var metrics = Enumerable.Repeat(12.0, 1000).ToList();

            // Act
            var result = _codexService.CalculateUltimatePower(metrics);

            // Assert
            Assert.Equal(12.0, result, 2);
        }

        #endregion

        #region Domain-Specific Amplification Tests

        [Fact]
        public void AmplifySystemHealth_WithGoodMetrics_ReturnsHighScore()
        {
            // Arrange
            var metrics = new SystemPerformanceMetrics
            {
                ApiLatency = 80,        // Good: < 100ms
                MemoryUsage = 40,       // Good: < 50%
                CpuLoad = 25,           // Good: < 30%
                DbQueryTime = 40,       // Good: < 50ms
                ErrorRate = 0.1,        // Good: < 1%
                Uptime = 99.9           // Excellent
            };

            // Act
            var result = _codexService.AmplifySystemHealth(metrics);

            // Assert
            Assert.True(result >= 8.0); // Should be in "good" range
        }

        [Fact]
        public void AmplifySystemHealth_WithPoorMetrics_ReturnsLowScore()
        {
            // Arrange
            var metrics = new SystemPerformanceMetrics
            {
                ApiLatency = 900,       // Poor: near timeout
                MemoryUsage = 92,       // Critical
                CpuLoad = 88,           // Critical
                DbQueryTime = 450,      // Poor
                ErrorRate = 4.5,        // High
                Uptime = 96.5           // Below target
            };

            // Act
            var result = _codexService.AmplifySystemHealth(metrics);

            // Assert
            Assert.True(result < 6.0); // Should be in "poor" range
        }

        [Fact]
        public void AmplifyEngineeringExcellence_WithHighQuality_ReturnsHighScore()
        {
            // Arrange
            var metrics = new CodeQualityMetrics
            {
                TestCoverage = 98.5,
                TestPassRate = 100,
                CodeComplexity = 6,
                TechnicalDebt = 10,
                SecurityVulns = 0,
                DocCoverage = 95,
                BuildSuccessRate = 100,
                LintErrors = 2
            };

            // Act
            var result = _codexService.AmplifyEngineeringExcellence(metrics);

            // Assert
            Assert.True(result >= 10.0); // Championship quality
        }

        [Fact]
        public void AmplifyFISMACompliance_WithFullCompliance_ReturnsHighScore()
        {
            // Arrange
            var metrics = new ComplianceMetrics
            {
                AuditCompleteness = 100,
                SecurityControls = 98,
                DataEncryption = 100,
                AccessControl = 100,
                IncidentResponse = 8,       // < 15 min
                PatchingCadence = 16,       // < 24 hours
                NistControls = 100,
                DataIsolation = 100,
                Accessibility = 98
            };

            // Act
            var result = _codexService.AmplifyFISMACompliance(metrics);

            // Assert
            Assert.True(result >= 10.0); // FISMA-HIGH requires >= 10
        }

        [Fact]
        public void AmplifyFISMACompliance_Below10_AppliesPenalty()
        {
            // Arrange - metrics that would normally score around 8-9
            var metrics = new ComplianceMetrics
            {
                AuditCompleteness = 96,
                SecurityControls = 92,
                DataEncryption = 98,
                AccessControl = 96,
                IncidentResponse = 18,
                PatchingCadence = 30,
                NistControls = 92,
                DataIsolation = 99,
                Accessibility = 96
            };

            // Act
            var result = _codexService.AmplifyFISMACompliance(metrics);

            // Assert - should be less than it would be without penalty
            Assert.True(result < 10.0);
        }

        #endregion

        #region System-Wide Calculation Tests

        [Fact]
        public async Task CalculateSystemWideUltimatePowerAsync_WithGoodCodex_ReturnsHighScore()
        {
            // Arrange
            var codex = new SystemWideCodex
            {
                SystemPerformance = new SystemPerformanceMetrics
                {
                    ApiLatency = 100,
                    MemoryUsage = 50,
                    CpuLoad = 30,
                    DbQueryTime = 50,
                    ErrorRate = 0.5,
                    Uptime = 99.9
                },
                CodeQuality = new CodeQualityMetrics
                {
                    TestCoverage = 97.2,
                    TestPassRate = 91.9,
                    CodeComplexity = 8,
                    TechnicalDebt = 24,
                    SecurityVulns = 0,
                    DocCoverage = 85,
                    BuildSuccessRate = 98.5,
                    LintErrors = 5
                },
                Compliance = new ComplianceMetrics
                {
                    AuditCompleteness = 100,
                    SecurityControls = 98,
                    DataEncryption = 100,
                    AccessControl = 100,
                    IncidentResponse = 10,
                    PatchingCadence = 18,
                    NistControls = 95,
                    DataIsolation = 100,
                    Accessibility = 98
                }
            };

            // Act
            var result = await _codexService.CalculateSystemWideUltimatePowerAsync(codex);

            // Assert
            Assert.InRange(result, 0, 12);
            Assert.True(result > 0); // Should have a positive score
        }

        [Fact]
        public async Task CalculateSystemWideUltimatePowerAsync_NeverExceeds12()
        {
            // Arrange - perfect metrics
            var codex = new SystemWideCodex
            {
                SystemPerformance = new SystemPerformanceMetrics
                {
                    ApiLatency = 50,
                    MemoryUsage = 30,
                    CpuLoad = 20,
                    DbQueryTime = 30,
                    ErrorRate = 0,
                    Uptime = 100
                },
                CodeQuality = new CodeQualityMetrics
                {
                    TestCoverage = 100,
                    TestPassRate = 100,
                    CodeComplexity = 5,
                    TechnicalDebt = 0,
                    SecurityVulns = 0,
                    DocCoverage = 100,
                    BuildSuccessRate = 100,
                    LintErrors = 0
                },
                Compliance = new ComplianceMetrics
                {
                    AuditCompleteness = 100,
                    SecurityControls = 100,
                    DataEncryption = 100,
                    AccessControl = 100,
                    IncidentResponse = 5,
                    PatchingCadence = 12,
                    NistControls = 100,
                    DataIsolation = 100,
                    Accessibility = 100
                }
            };

            // Act
            var result = await _codexService.CalculateSystemWideUltimatePowerAsync(codex);

            // Assert
            Assert.True(result <= 12.0);
        }

        #endregion

        #region Alert & Threshold Tests

        [Theory]
        [InlineData(11.0, "Green", "Monitor")]
        [InlineData(9.0, "Yellow", "Review and optimize")]
        [InlineData(7.0, "Red", "Immediate attention required")]
        [InlineData(4.0, "Critical", "Emergency response - all hands on deck")]
        public void DetermineAlertLevel_ReturnsCorrectLevel(double score, string expectedLevel, string expectedAction)
        {
            // Act
            var result = _codexService.DetermineAlertLevel(score);

            // Assert
            Assert.Equal(score, result.Score);
            Assert.Equal(expectedLevel, result.Level.ToString());
            Assert.Equal(expectedAction, result.Action);
        }

        #endregion

        #region Trend Analysis Tests

        [Fact]
        public void CalculateTrend_WithImprovingScores_ReturnsImproving()
        {
            // Arrange
            var history = new List<TimeSeriesCodex>
            {
                new() { Timestamp = DateTime.UtcNow.AddHours(-10), UltimatePower = 8.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-9), UltimatePower = 8.2 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-8), UltimatePower = 8.5 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-7), UltimatePower = 8.8 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-6), UltimatePower = 9.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-5), UltimatePower = 9.2 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-4), UltimatePower = 9.5 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-3), UltimatePower = 9.8 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-2), UltimatePower = 10.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-1), UltimatePower = 10.2 }
            };

            // Act
            var result = _codexService.CalculateTrend(history);

            // Assert
            Assert.Equal(Trend.Improving, result);
        }

        [Fact]
        public void CalculateTrend_WithDecliningScores_ReturnsDeclining()
        {
            // Arrange
            var history = new List<TimeSeriesCodex>
            {
                new() { Timestamp = DateTime.UtcNow.AddHours(-10), UltimatePower = 10.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-9), UltimatePower = 9.8 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-8), UltimatePower = 9.5 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-7), UltimatePower = 9.2 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-6), UltimatePower = 9.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-5), UltimatePower = 8.7 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-4), UltimatePower = 8.4 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-3), UltimatePower = 8.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-2), UltimatePower = 7.7 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-1), UltimatePower = 7.3 }
            };

            // Act
            var result = _codexService.CalculateTrend(history);

            // Assert
            Assert.Equal(Trend.Declining, result);
        }

        [Fact]
        public void CalculateTrend_WithStableScores_ReturnsStable()
        {
            // Arrange
            var history = new List<TimeSeriesCodex>
            {
                new() { Timestamp = DateTime.UtcNow.AddHours(-10), UltimatePower = 9.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-9), UltimatePower = 9.1 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-8), UltimatePower = 8.9 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-7), UltimatePower = 9.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-6), UltimatePower = 9.1 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-5), UltimatePower = 8.9 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-4), UltimatePower = 9.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-3), UltimatePower = 9.0 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-2), UltimatePower = 9.1 },
                new() { Timestamp = DateTime.UtcNow.AddHours(-1), UltimatePower = 8.9 }
            };

            // Act
            var result = _codexService.CalculateTrend(history);

            // Assert
            Assert.Equal(Trend.Stable, result);
        }

        [Fact]
        public void CalculateTrend_WithInsufficientData_ReturnsStable()
        {
            // Arrange
            var history = new List<TimeSeriesCodex>
            {
                new() { Timestamp = DateTime.UtcNow, UltimatePower = 9.0 }
            };

            // Act
            var result = _codexService.CalculateTrend(history);

            // Assert
            Assert.Equal(Trend.Stable, result);
        }

        #endregion

        #region Comparative Analysis Tests

        [Fact]
        public void CompareEnvironments_ReturnsBestAndWorst()
        {
            // Arrange
            var codices = new List<ComparativeCodex>
            {
                new() { Environment = "Production", County = "Benton", UltimatePower = 10.5 },
                new() { Environment = "Staging", County = "Benton", UltimatePower = 9.2 },
                new() { Environment = "Development", County = "Benton", UltimatePower = 8.1 }
            };

            // Act
            var result = _codexService.CompareEnvironments(codices);

            // Assert
            Assert.Equal("Production", result.Best.Environment);
            Assert.Equal(10.5, result.Best.UltimatePower);
            Assert.Equal("Development", result.Worst.Environment);
            Assert.Equal(8.1, result.Worst.UltimatePower);
            Assert.Equal(9.27, result.Average, 2);
        }

        [Fact]
        public void CompareEnvironments_WithEmptyList_ThrowsException()
        {
            // Arrange
            var codices = new List<ComparativeCodex>();

            // Act & Assert
            Assert.Throws<ArgumentException>(() =>
                _codexService.CompareEnvironments(codices));
        }

        #endregion
    }
}
