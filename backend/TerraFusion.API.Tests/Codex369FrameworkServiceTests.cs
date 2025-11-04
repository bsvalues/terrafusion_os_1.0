/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 FRAMEWORK SERVICE UNIT TESTS
 * Championship-Level Test Coverage for Divine Balance
 * Validates Foundation (3), Amplification (6), Ultimate Power (9)
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.AI.DTOs;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.API.Tests
{
    /// <summary>
    /// Unit tests for Codex369FrameworkService
    /// Tests all 3 levels: Foundation (3), Amplification (6), Ultimate Power (9)
    /// </summary>
    public class Codex369FrameworkServiceTests
    {
        private readonly Mock<ILogger<Codex369FrameworkService>> _mockLogger;
        private readonly Codex369FrameworkService _service;

        public Codex369FrameworkServiceTests()
        {
            _mockLogger = new Mock<ILogger<Codex369FrameworkService>>();
            _service = new Codex369FrameworkService(_mockLogger.Object);
        }

        #region Foundation Level (3) Tests

        [Fact]
        public async Task MeasureFoundationMetrics_Returns12Metrics()
        {
            // Act
            var metrics = await _service.MeasureFoundationMetricsAsync();

            // Assert
            Assert.NotNull(metrics);
            Assert.Equal(12, metrics.Count);
        }

        [Fact]
        public async Task MeasureFoundationMetrics_AllMetricsHaveRequiredFields()
        {
            // Act
            var metrics = await _service.MeasureFoundationMetricsAsync();

            // Assert
            foreach (var metric in metrics)
            {
                Assert.NotNull(metric.MetricId);
                Assert.NotNull(metric.Name);
                Assert.True(metric.RawValue >= 0, $"{metric.Name} RawValue should be >= 0");
                Assert.True(metric.BaselineThreshold > 0, $"{metric.Name} BaselineThreshold should be > 0");
                Assert.True(metric.NormalizedValue >= 0, $"{metric.Name} NormalizedValue should be >= 0");
                Assert.True(metric.NormalizedValue <= 12, $"{metric.Name} NormalizedValue should be <= 12");
            }
        }

        [Fact]
        public async Task MeasureFoundationMetrics_NormalizationCapsAt12()
        {
            // Act
            var metrics = await _service.MeasureFoundationMetricsAsync();

            // Assert - All normalized values must be capped at 12
            foreach (var metric in metrics)
            {
                Assert.True(metric.NormalizedValue <= 12.0,
                    $"{metric.Name} normalized value {metric.NormalizedValue} exceeds maximum of 12");
            }
        }

        [Fact]
        public async Task MeasureFoundationMetrics_ContainsAllCategories()
        {
            // Act
            var metrics = await _service.MeasureFoundationMetricsAsync();

            // Assert - Should have metrics from all 4 categories
            var categories = metrics.Select(m => m.Category).Distinct().ToList();
            Assert.Contains(MetricCategory.FISMA, categories);
            Assert.Contains(MetricCategory.Performance, categories);
            Assert.Contains(MetricCategory.DataQuality, categories);
            Assert.Contains(MetricCategory.AIExcellence, categories);
        }

        [Fact]
        public async Task MeasureFoundationMetrics_FISMAComplianceMetricExists()
        {
            // Act
            var metrics = await _service.MeasureFoundationMetricsAsync();

            // Assert
            var fismaMetric = metrics.FirstOrDefault(m => m.MetricId == "fisma-compliance-score");
            Assert.NotNull(fismaMetric);
            Assert.Equal("FISMA Compliance Score", fismaMetric.Name);
            Assert.Equal(MetricCategory.FISMA, fismaMetric.Category);
        }

        [Fact]
        public async Task MeasureFoundationMetrics_WithinBaselineCalculatedCorrectly()
        {
            // Act
            var metrics = await _service.MeasureFoundationMetricsAsync();

            // Assert - WithinBaseline should be true when RawValue >= BaselineThreshold
            foreach (var metric in metrics)
            {
                var expectedWithinBaseline = metric.RawValue >= metric.BaselineThreshold;
                Assert.Equal(expectedWithinBaseline, metric.WithinBaseline);
            }
        }

        #endregion

        #region Amplification Level (6) Tests

        [Fact]
        public async Task AmplifyMetrics_Returns5AmplificationGroups()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();

            // Act
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Assert
            Assert.NotNull(amplifications);
            Assert.Equal(5, amplifications.Count);
        }

        [Fact]
        public async Task AmplifyMetrics_AllGroupsHaveRequiredFields()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();

            // Act
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Assert
            foreach (var amp in amplifications)
            {
                Assert.NotNull(amp.Name);
                Assert.NotNull(amp.Description);
                Assert.NotNull(amp.FoundationMetrics);
                Assert.True(amp.FoundationMetrics.Count >= 2, $"{amp.Name} should combine at least 2 metrics");
                Assert.True(amp.RawCombinedValue >= 0, $"{amp.Name} RawCombinedValue should be >= 0");
                Assert.True(amp.ScaledValue >= 0, $"{amp.Name} ScaledValue should be >= 0");
                Assert.True(amp.ScaledValue <= 12, $"{amp.Name} ScaledValue should be <= 12");
            }
        }

        [Fact]
        public async Task AmplifyMetrics_ScalingFormula_Correct()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();

            // Act
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Assert - ScaledValue = RawCombinedValue / 55.5 (where 55.5 = 666 / 12)
            const double AMPLIFICATION_SCALE = 55.5;
            foreach (var amp in amplifications)
            {
                var expectedScaled = Math.Min(12.0, amp.RawCombinedValue / AMPLIFICATION_SCALE);
                Assert.Equal(expectedScaled, amp.ScaledValue, precision: 2);
            }
        }

        [Fact]
        public async Task AmplifyMetrics_666SafeguardValidation()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();

            // Act
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Assert - SafeFromImbalance should be true when RawCombinedValue < 666
            foreach (var amp in amplifications)
            {
                var expectedSafe = amp.RawCombinedValue < 666.0;
                Assert.Equal(expectedSafe, amp.SafeFromImbalance);

                if (amp.SafeFromImbalance)
                {
                    Assert.True(amp.SafetyMargin > 0, $"{amp.Name} should have positive safety margin");
                    Assert.Equal(666.0 - amp.RawCombinedValue, amp.SafetyMargin, precision: 2);
                }
                else
                {
                    Assert.NotNull(amp.ThresholdWarning);
                    Assert.Contains("666", amp.ThresholdWarning);
                }
            }
        }

        [Fact]
        public async Task AmplifyMetrics_ContainsFISMASecurityGroup()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();

            // Act
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Assert
            var fismaGroup = amplifications.FirstOrDefault(a => a.Name.Contains("FISMA"));
            Assert.NotNull(fismaGroup);
            Assert.Contains("fisma-compliance-score", fismaGroup.FoundationMetrics);
            Assert.Contains("security-audit-pass-rate", fismaGroup.FoundationMetrics);
        }

        [Fact]
        public async Task ValidateSafeguard_ValueBelow666_ReturnsTrue()
        {
            // Arrange
            var safeValue = 450.5;

            // Act
            var result = _service.ValidateSafeguard(safeValue);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task ValidateSafeguard_ValueAbove666_ReturnsFalse()
        {
            // Arrange
            var unsafeValue = 670.0;

            // Act
            var result = _service.ValidateSafeguard(unsafeValue);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task ValidateSafeguard_ExactlyAt666_ReturnsFalse()
        {
            // Arrange
            var boundaryValue = 666.0;

            // Act
            var result = _service.ValidateSafeguard(boundaryValue);

            // Assert
            Assert.False(result);
        }

        #endregion

        #region Ultimate Power Level (9) Tests

        [Fact]
        public async Task CalculateUltimatePower_ReturnsValidScore()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Act
            var ultimatePower = await _service.CalculateUltimatePowerAsync(amplifications);

            // Assert
            Assert.NotNull(ultimatePower);
            Assert.True(ultimatePower.UltimatePowerScore >= 0, "Ultimate Power Score should be >= 0");
            Assert.True(ultimatePower.UltimatePowerScore <= 12, "Ultimate Power Score should be <= 12");
            Assert.Equal(12.0, ultimatePower.TargetScore);
        }

        [Fact]
        public async Task CalculateUltimatePower_ScoreIsAverageOfAmplifications()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Act
            var ultimatePower = await _service.CalculateUltimatePowerAsync(amplifications);

            // Assert - Ultimate Power should be average of all amplification scaled values
            var expectedScore = amplifications.Average(a => a.ScaledValue);
            Assert.Equal(expectedScore, ultimatePower.UltimatePowerScore, precision: 2);
        }

        [Fact]
        public async Task CalculateUltimatePower_BalanceProximityCalculation()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Act
            var ultimatePower = await _service.CalculateUltimatePowerAsync(amplifications);

            // Assert - BalanceProximity = UltimatePowerScore / 12
            var expectedProximity = ultimatePower.UltimatePowerScore / 12.0;
            Assert.Equal(expectedProximity, ultimatePower.BalanceProximity, precision: 3);
            Assert.True(ultimatePower.BalanceProximity >= 0, "Balance proximity should be >= 0");
            Assert.True(ultimatePower.BalanceProximity <= 1, "Balance proximity should be <= 1");
        }

        [Fact]
        public async Task CalculateUltimatePower_DivineBalanceDetection()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Act
            var ultimatePower = await _service.CalculateUltimatePowerAsync(amplifications);

            // Assert - InDivineBalance should be true when score >= 11.5
            var expectedDivineBalance = ultimatePower.UltimatePowerScore >= 11.5;
            Assert.Equal(expectedDivineBalance, ultimatePower.InDivineBalance);
        }

        [Fact]
        public async Task CalculateUltimatePower_HealthStatusMapping()
        {
            // Arrange
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);

            // Act
            var ultimatePower = await _service.CalculateUltimatePowerAsync(amplifications);

            // Assert - Health status should map correctly to score ranges
            var score = ultimatePower.UltimatePowerScore;
            if (score >= 11.5)
            {
                Assert.Equal(SystemHealthStatus.DivineBalance, ultimatePower.HealthStatus);
            }
            else if (score >= 10.5)
            {
                Assert.Equal(SystemHealthStatus.Excellent, ultimatePower.HealthStatus);
            }
            else if (score >= 9.0)
            {
                Assert.Equal(SystemHealthStatus.Good, ultimatePower.HealthStatus);
            }
            else if (score >= 7.0)
            {
                Assert.Equal(SystemHealthStatus.NeedsAttention, ultimatePower.HealthStatus);
            }
            else
            {
                Assert.Equal(SystemHealthStatus.Critical, ultimatePower.HealthStatus);
            }
        }

        #endregion

        #region Complete Framework Status Tests

        [Fact]
        public async Task CalculateFrameworkStatus_ReturnsCompleteStatus()
        {
            // Arrange
            var request = new Codex369CalculationRequest
            {
                CountyId = "benton-county",
                StartTime = DateTime.UtcNow.AddHours(-1),
                EndTime = DateTime.UtcNow,
                IncludeDetailedBreakdown = true,
                IncludeRecommendations = true
            };

            // Act
            var status = await _service.CalculateFrameworkStatusAsync(request);

            // Assert
            Assert.NotNull(status);
            Assert.NotNull(status.FoundationMetrics);
            Assert.NotNull(status.AmplificationMetrics);
            Assert.NotNull(status.UltimatePower);
            Assert.NotNull(status.SystemRecommendations);
            Assert.Equal(12, status.TotalFoundationMetrics);
            Assert.Equal(5, status.TotalAmplifications);
        }

        [Fact]
        public async Task CalculateFrameworkStatus_BalanceDeficitCalculation()
        {
            // Arrange
            var request = new Codex369CalculationRequest
            {
                IncludeDetailedBreakdown = true
            };

            // Act
            var status = await _service.CalculateFrameworkStatusAsync(request);

            // Assert - BalanceDeficit = 12 - CurrentPowerScore
            var expectedDeficit = 12.0 - status.CurrentPowerScore;
            Assert.Equal(expectedDeficit, status.BalanceDeficit, precision: 2);
        }

        [Fact]
        public async Task CalculateFrameworkStatus_ComplianceAlignmentCheck()
        {
            // Arrange
            var request = new Codex369CalculationRequest();

            // Act
            var status = await _service.CalculateFrameworkStatusAsync(request);

            // Assert - ComplianceAligned should be true when all foundation metrics are within baseline
            var expectedCompliance = status.FoundationMetrics.All(m => m.WithinBaseline);
            Assert.Equal(expectedCompliance, status.ComplianceAligned);
        }

        [Fact]
        public async Task CalculateFrameworkStatus_GeneratesRecommendations()
        {
            // Arrange
            var request = new Codex369CalculationRequest
            {
                IncludeRecommendations = true
            };

            // Act
            var status = await _service.CalculateFrameworkStatusAsync(request);

            // Assert
            Assert.NotNull(status.SystemRecommendations);
            Assert.NotEmpty(status.SystemRecommendations);

            if (status.UltimatePower.InDivineBalance)
            {
                Assert.Contains(status.SystemRecommendations,
                    r => r.Contains("DIVINE BALANCE"));
            }
        }

        [Fact]
        public async Task GetRealtimeFrameworkStatus_ReturnsValidStatus()
        {
            // Act
            var status = await _service.GetRealtimeFrameworkStatusAsync();

            // Assert
            Assert.NotNull(status);
            Assert.True(status.CurrentPowerScore >= 0);
            Assert.True(status.CurrentPowerScore <= 12);
            Assert.NotNull(status.StatusTimestamp);
            Assert.True(status.StatusTimestamp <= DateTime.UtcNow);
        }

        [Fact]
        public async Task GetRealtimeFrameworkStatus_WithCountyFilter()
        {
            // Act
            var status = await _service.GetRealtimeFrameworkStatusAsync("benton-county");

            // Assert
            Assert.NotNull(status);
            // In production, this would verify county-specific metrics
            // For now, just ensure it returns valid data
            Assert.True(status.CurrentPowerScore >= 0);
        }

        #endregion

        #region Edge Cases and Validation Tests

        [Fact]
        public async Task AmplifyMetrics_EmptyFoundationList_ThrowsException()
        {
            // Arrange
            var emptyFoundation = new List<FoundationMetric>();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _service.AmplifyMetricsAsync(emptyFoundation));
        }

        [Fact]
        public async Task CalculateUltimatePower_EmptyAmplificationList_ThrowsException()
        {
            // Arrange
            var emptyAmplifications = new List<AmplificationMetric>();

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _service.CalculateUltimatePowerAsync(emptyAmplifications));
        }

        [Fact]
        public async Task ValidateSafeguard_NegativeValue_ReturnsTrue()
        {
            // Arrange - Negative values are technically safe (not approaching 666)
            var negativeValue = -100.0;

            // Act
            var result = _service.ValidateSafeguard(negativeValue);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task ValidateSafeguard_ZeroValue_ReturnsTrue()
        {
            // Arrange
            var zeroValue = 0.0;

            // Act
            var result = _service.ValidateSafeguard(zeroValue);

            // Assert
            Assert.True(result);
        }

        #endregion

        #region Integration Scenario Tests

        [Fact]
        public async Task CompleteFramework_Foundation_To_Amplification_To_UltimatePower()
        {
            // Arrange & Act - Complete flow through all 3 levels
            var foundationMetrics = await _service.MeasureFoundationMetricsAsync();
            var amplifications = await _service.AmplifyMetricsAsync(foundationMetrics);
            var ultimatePower = await _service.CalculateUltimatePowerAsync(amplifications);

            // Assert - Verify complete chain
            Assert.Equal(12, foundationMetrics.Count);
            Assert.Equal(5, amplifications.Count);
            Assert.True(ultimatePower.UltimatePowerScore >= 0);
            Assert.True(ultimatePower.UltimatePowerScore <= 12);

            // Verify all amplifications are safe from 666
            Assert.All(amplifications, amp => Assert.True(amp.SafeFromImbalance || amp.ThresholdWarning != null));

            // Verify balance proximity matches score
            Assert.Equal(ultimatePower.UltimatePowerScore / 12.0, ultimatePower.BalanceProximity, precision: 3);
        }

        [Fact]
        public async Task DivineBalance_Scenario_AllMetricsOptimal()
        {
            // This test documents the ideal scenario for divine balance
            // In production with real data, achieving 11.5+ requires:
            // - All 12 foundation metrics at or above baseline
            // - All 5 amplification groups well below 666
            // - Average amplification scaled value >= 11.5

            // Act
            var status = await _service.CalculateFrameworkStatusAsync(new Codex369CalculationRequest
            {
                IncludeDetailedBreakdown = true,
                IncludeRecommendations = true
            });

            // Assert - Document the structure
            Assert.NotNull(status.UltimatePower);
            Assert.True(status.CurrentPowerScore <= 12.0);

            // If divine balance is achieved, verify all indicators
            if (status.UltimatePower.InDivineBalance)
            {
                Assert.True(status.CurrentPowerScore >= 11.5);
                Assert.True(status.UltimatePower.BalanceProximity >= 0.958);
                Assert.Equal(SystemHealthStatus.DivineBalance, status.UltimatePower.HealthStatus);
            }
        }

        #endregion
    }
}
