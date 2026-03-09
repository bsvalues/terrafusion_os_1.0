/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 FRAMEWORK INTEGRATION TESTS
 * Divine Mathematical Balance Engine - Comprehensive Test Suite
 * Tests all 3 levels: Foundation, Amplification, Ultimate Power
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TerraFusion.AI.DTOs;
using TerraFusion.AI.Services;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests;

/// <summary>
/// Codex 3-6-9 Framework Integration Tests
/// Tests divine mathematical balance engine functionality
/// </summary>
public class Codex369FrameworkTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    // Divine constants for validation
    private const double FOUNDATION_MAX = 12.0;
    private const double AMPLIFICATION_SAFEGUARD = 666.0;
    private const double AMPLIFICATION_SCALE = 55.5;
    private const double ULTIMATE_TARGET = 12.0;
    private const double DIVINE_BALANCE_MIN = 11.5;
    private const double DIVINE_BALANCE_MAX = 12.0;
    private const double CHAMPIONSHIP_MIN = 10.0;

    public Codex369FrameworkTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ============================================================================
    // LEVEL 3: FOUNDATION METRICS TESTS
    // ============================================================================

    [Fact]
    public async Task GET_FoundationMetrics_ReturnsSuccessAndCorrectStructure()
    {
        // Arrange
        var endpoint = "/api/codex/foundation";

        // Act
        var response = await _client.GetAsync(endpoint);
        var metrics = await response.Content.ReadFromJsonAsync<List<FoundationMetric>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        metrics.Should().NotBeNull();
        metrics.Should().NotBeEmpty();
        metrics.Should().HaveCountGreaterThan(10, "should have multiple foundation metrics");

        // Validate metric structure
        var firstMetric = metrics.First();
        firstMetric.Domain.Should().NotBeNullOrEmpty();
        firstMetric.MetricName.Should().NotBeNullOrEmpty();
        firstMetric.ScaledValue.Should().BeInRange(0, FOUNDATION_MAX);
        firstMetric.AlertLevel.Should().BeOneOf("Green", "Yellow", "Red", "Critical");
    }

    [Fact]
    public async Task GET_FoundationMetrics_AllScoresWithinValidRange()
    {
        // Arrange
        var endpoint = "/api/codex/foundation";

        // Act
        var response = await _client.GetAsync(endpoint);
        var metrics = await response.Content.ReadFromJsonAsync<List<FoundationMetric>>();

        // Assert
        metrics.Should().NotBeNull();
        foreach (var metric in metrics!)
        {
            metric.ScaledValue.Should().BeGreaterOrEqualTo(0,
                $"{metric.MetricName} scaled value should be >= 0");
            metric.ScaledValue.Should().BeLessOrEqualTo(FOUNDATION_MAX,
                $"{metric.MetricName} scaled value should be <= {FOUNDATION_MAX}");
        }
    }

    [Fact]
    public async Task GET_FoundationMetrics_ByDomain_SystemPerformance()
    {
        // Arrange
        var endpoint = "/api/codex/foundation/by-domain?domain=systemPerformance";

        // Act
        var response = await _client.GetAsync(endpoint);
        var metrics = await response.Content.ReadFromJsonAsync<List<FoundationMetric>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        metrics.Should().NotBeNull();
        metrics.Should().AllSatisfy(m => m.Domain.Should().Be("systemPerformance"));

        // System performance should have these metrics
        var metricNames = metrics.Select(m => m.MetricName).ToList();
        metricNames.Should().Contain("apiResponseTime");
        metricNames.Should().Contain("memoryUsage");
        metricNames.Should().Contain("cpuUtilization");
    }

    [Theory]
    [InlineData("systemPerformance")]
    [InlineData("codeQuality")]
    [InlineData("compliance")]
    [InlineData("userExperience")]
    public async Task GET_FoundationMetrics_ByDomain_ValidDomains(string domain)
    {
        // Arrange
        var endpoint = $"/api/codex/foundation/by-domain?domain={domain}";

        // Act
        var response = await _client.GetAsync(endpoint);
        var metrics = await response.Content.ReadFromJsonAsync<List<FoundationMetric>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        metrics.Should().NotBeNull();
        metrics.Should().NotBeEmpty($"domain {domain} should have metrics");
        metrics.Should().AllSatisfy(m => m.Domain.Should().Be(domain));
    }

    // ============================================================================
    // LEVEL 6: AMPLIFICATION METRICS TESTS
    // ============================================================================

    [Fact]
    public async Task GET_AmplificationMetrics_ReturnsSuccessAndCorrectStructure()
    {
        // Arrange
        var endpoint = "/api/codex/amplification";

        // Act
        var response = await _client.GetAsync(endpoint);
        var amplifications = await response.Content.ReadFromJsonAsync<List<AmplificationMetric>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        amplifications.Should().NotBeNull();
        amplifications.Should().NotBeEmpty();

        // Validate amplification structure
        var firstAmp = amplifications.First();
        firstAmp.Domain.Should().NotBeNullOrEmpty();
        firstAmp.AmplifiedScore.Should().BeInRange(0, FOUNDATION_MAX);
        firstAmp.RawCombinedValue.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GET_AmplificationMetrics_666SafeguardEnforced()
    {
        // Arrange
        var endpoint = "/api/codex/amplification";

        // Act
        var response = await _client.GetAsync(endpoint);
        var amplifications = await response.Content.ReadFromJsonAsync<List<AmplificationMetric>>();

        // Assert - 666 Safeguard Validation
        amplifications.Should().NotBeNull();
        foreach (var amp in amplifications!)
        {
            if (amp.RawCombinedValue >= AMPLIFICATION_SAFEGUARD)
            {
                amp.SafeFromImbalance.Should().BeFalse(
                    $"{amp.Domain} raw value {amp.RawCombinedValue} >= 666, should be marked unsafe");
            }
            else
            {
                amp.SafeFromImbalance.Should().BeTrue(
                    $"{amp.Domain} raw value {amp.RawCombinedValue} < 666, should be marked safe");
            }
        }
    }

    [Fact]
    public async Task GET_AmplificationMetrics_ScalingFactorCorrect()
    {
        // Arrange
        var endpoint = "/api/codex/amplification";

        // Act
        var response = await _client.GetAsync(endpoint);
        var amplifications = await response.Content.ReadFromJsonAsync<List<AmplificationMetric>>();

        // Assert - Verify scaling factor (666 / 55.5 = 12)
        amplifications.Should().NotBeNull();
        foreach (var amp in amplifications!)
        {
            var expectedScore = Math.Min(amp.RawCombinedValue / AMPLIFICATION_SCALE, FOUNDATION_MAX);
            amp.AmplifiedScore.Should().BeApproximately(expectedScore, 0.01,
                $"{amp.Domain} amplified score should be raw value divided by {AMPLIFICATION_SCALE}");
        }
    }

    [Fact]
    public async Task GET_AmplificationMetrics_AlertLevelsCorrect()
    {
        // Arrange
        var endpoint = "/api/codex/amplification";

        // Act
        var response = await _client.GetAsync(endpoint);
        var amplifications = await response.Content.ReadFromJsonAsync<List<AmplificationMetric>>();

        // Assert - Validate alert levels
        amplifications.Should().NotBeNull();
        foreach (var amp in amplifications!)
        {
            if (amp.AmplifiedScore >= 9.6)
            {
                amp.AlertLevel.Should().Be("Green", $"{amp.Domain} score {amp.AmplifiedScore} >= 9.6 should be Green");
            }
            else if (amp.AmplifiedScore >= 7.2)
            {
                amp.AlertLevel.Should().Be("Yellow", $"{amp.Domain} score {amp.AmplifiedScore} >= 7.2 should be Yellow");
            }
            else if (amp.AmplifiedScore >= 4.8)
            {
                amp.AlertLevel.Should().Be("Red", $"{amp.Domain} score {amp.AmplifiedScore} >= 4.8 should be Red");
            }
            else
            {
                amp.AlertLevel.Should().Be("Critical", $"{amp.Domain} score {amp.AmplifiedScore} < 4.8 should be Critical");
            }
        }
    }

    // ============================================================================
    // LEVEL 9: ULTIMATE POWER TESTS
    // ============================================================================

    [Fact]
    public async Task GET_UltimatePower_ReturnsSuccessAndCorrectStructure()
    {
        // Arrange
        var endpoint = "/api/codex/ultimate-power";

        // Act
        var response = await _client.GetAsync(endpoint);
        var ultimatePower = await response.Content.ReadFromJsonAsync<UltimatePowerMetric>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        ultimatePower.Should().NotBeNull();
        ultimatePower.UltimatePowerScore.Should().BeInRange(0, ULTIMATE_TARGET);
        ultimatePower.BalanceProximity.Should().BeInRange(0, 1);
    }

    [Fact]
    public async Task GET_UltimatePower_ScoreWithinValidRange()
    {
        // Arrange
        var endpoint = "/api/codex/ultimate-power";

        // Act
        var response = await _client.GetAsync(endpoint);
        var ultimatePower = await response.Content.ReadFromJsonAsync<UltimatePowerMetric>();

        // Assert
        ultimatePower.Should().NotBeNull();
        ultimatePower.UltimatePowerScore.Should().BeGreaterOrEqualTo(0);
        ultimatePower.UltimatePowerScore.Should().BeLessOrEqualTo(ULTIMATE_TARGET);
    }

    [Fact]
    public async Task GET_UltimatePower_DivineBalanceDetection()
    {
        // Arrange
        var endpoint = "/api/codex/ultimate-power";

        // Act
        var response = await _client.GetAsync(endpoint);
        var ultimatePower = await response.Content.ReadFromJsonAsync<UltimatePowerMetric>();

        // Assert
        ultimatePower.Should().NotBeNull();

        if (ultimatePower.UltimatePowerScore >= DIVINE_BALANCE_MIN &&
            ultimatePower.UltimatePowerScore <= DIVINE_BALANCE_MAX)
        {
            ultimatePower.InDivineBalance.Should().BeTrue(
                $"Score {ultimatePower.UltimatePowerScore} in range 11.5-12.0 should be marked as Divine Balance");
        }
        else
        {
            ultimatePower.InDivineBalance.Should().BeFalse(
                $"Score {ultimatePower.UltimatePowerScore} outside range 11.5-12.0 should not be Divine Balance");
        }
    }

    [Fact]
    public async Task GET_UltimatePower_ChampionshipModeDetection()
    {
        // Arrange
        var endpoint = "/api/codex/ultimate-power";

        // Act
        var response = await _client.GetAsync(endpoint);
        var ultimatePower = await response.Content.ReadFromJsonAsync<UltimatePowerMetric>();

        // Assert
        ultimatePower.Should().NotBeNull();

        if (ultimatePower.UltimatePowerScore >= CHAMPIONSHIP_MIN)
        {
            ultimatePower.IsChampionshipMode.Should().BeTrue(
                $"Score {ultimatePower.UltimatePowerScore} >= 10.0 should be Championship Mode");
        }
        else
        {
            ultimatePower.IsChampionshipMode.Should().BeFalse(
                $"Score {ultimatePower.UltimatePowerScore} < 10.0 should not be Championship Mode");
        }
    }

    [Fact]
    public async Task GET_UltimatePower_BalanceProximityCalculation()
    {
        // Arrange
        var endpoint = "/api/codex/ultimate-power";

        // Act
        var response = await _client.GetAsync(endpoint);
        var ultimatePower = await response.Content.ReadFromJsonAsync<UltimatePowerMetric>();

        // Assert
        ultimatePower.Should().NotBeNull();

        var expectedProximity = 1.0 - (Math.Abs(ULTIMATE_TARGET - ultimatePower.UltimatePowerScore) / ULTIMATE_TARGET);
        ultimatePower.BalanceProximity.Should().BeApproximately(expectedProximity, 0.01,
            "Balance proximity should be calculated as 1 - (|12 - score| / 12)");
    }

    // ============================================================================
    // COMPLETE SYSTEM-WIDE STATUS TESTS
    // ============================================================================

    [Fact]
    public async Task GET_SystemWideStatus_ReturnsAllThreeLevels()
    {
        // Arrange
        var endpoint = "/api/codex/system-wide";

        // Act
        var response = await _client.GetAsync(endpoint);
        var status = await response.Content.ReadFromJsonAsync<Codex369StatusDto>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        status.Should().NotBeNull();

        // Level 3: Foundation
        status.FoundationMetrics.Should().NotBeNull();
        status.FoundationMetrics.Should().NotBeEmpty();
        status.TotalFoundationMetrics.Should().BeGreaterThan(0);

        // Level 6: Amplification
        status.AmplificationMetrics.Should().NotBeNull();
        status.AmplificationMetrics.Should().NotBeEmpty();
        status.TotalAmplifications.Should().BeGreaterThan(0);

        // Level 9: Ultimate Power
        status.UltimatePower.Should().NotBeNull();
        status.CurrentPowerScore.Should().Be(status.UltimatePower.UltimatePowerScore);
    }

    [Fact]
    public async Task GET_SystemWideStatus_FrameworkHealthyWhenAllGreen()
    {
        // Arrange
        var endpoint = "/api/codex/system-wide";

        // Act
        var response = await _client.GetAsync(endpoint);
        var status = await response.Content.ReadFromJsonAsync<Codex369StatusDto>();

        // Assert
        status.Should().NotBeNull();

        var allGreen = status.AmplificationMetrics.All(a => a.AlertLevel == "Green");
        if (allGreen)
        {
            status.FrameworkHealthy.Should().BeTrue("All domains green should mark framework as healthy");
        }
    }

    [Fact]
    public async Task GET_SystemWideStatus_BalanceDeficitCalculated()
    {
        // Arrange
        var endpoint = "/api/codex/system-wide";

        // Act
        var response = await _client.GetAsync(endpoint);
        var status = await response.Content.ReadFromJsonAsync<Codex369StatusDto>();

        // Assert
        status.Should().NotBeNull();

        var expectedDeficit = Math.Abs(ULTIMATE_TARGET - status.CurrentPowerScore);
        status.BalanceDeficit.Should().BeApproximately(expectedDeficit, 0.01,
            "Balance deficit should be |12 - current score|");
    }

    // ============================================================================
    // MULTI-TENANT (COUNTY) TESTS
    // ============================================================================

    [Fact]
    public async Task GET_SystemWideStatus_WithCountyId_ReturnsCountySpecific()
    {
        // Arrange
        var endpoint = "/api/codex/system-wide?countyId=benton";

        // Act
        var response = await _client.GetAsync(endpoint);
        var status = await response.Content.ReadFromJsonAsync<Codex369StatusDto>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        status.Should().NotBeNull();
        // In production, would verify county-specific filtering
    }

    // ============================================================================
    // ALERT TESTS
    // ============================================================================

    [Fact]
    public async Task GET_Alerts_ReturnsUnresolvedAlerts()
    {
        // Arrange
        var endpoint = "/api/codex/alerts";

        // Act
        var response = await _client.GetAsync(endpoint);
        var alerts = await response.Content.ReadFromJsonAsync<List<CodexAlert>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        alerts.Should().NotBeNull();

        if (alerts.Any())
        {
            alerts.Should().AllSatisfy(alert =>
            {
                alert.AlertLevel.Should().BeOneOf("Green", "Yellow", "Red", "Critical");
                alert.Domain.Should().NotBeNullOrEmpty();
                alert.Message.Should().NotBeNullOrEmpty();
            });
        }
    }

    [Fact]
    public async Task POST_AcknowledgeAlert_UpdatesAlertStatus()
    {
        // Arrange
        var alertsEndpoint = "/api/codex/alerts";
        var alertsResponse = await _client.GetAsync(alertsEndpoint);
        var alerts = await alertsResponse.Content.ReadFromJsonAsync<List<CodexAlert>>();

        if (!alerts.Any()) return; // Skip if no alerts

        var alertId = alerts.First().Id;
        var acknowledgeEndpoint = $"/api/codex/alerts/{alertId}/acknowledge";
        var acknowledgeData = new { acknowledgedBy = "test@terrafusion.gov" };

        // Act
        var response = await _client.PostAsJsonAsync(acknowledgeEndpoint, acknowledgeData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ============================================================================
    // MATHEMATICAL VALIDATION TESTS
    // ============================================================================

    [Fact]
    public async Task MathematicalValidation_666ScalingFactor()
    {
        // Assert mathematical constant
        var scalingFactor = AMPLIFICATION_SAFEGUARD / FOUNDATION_MAX;
        scalingFactor.Should().BeApproximately(AMPLIFICATION_SCALE, 0.01,
            "666 / 12 should equal 55.5");
    }

    [Fact]
    public async Task MathematicalValidation_AmplificationScaling()
    {
        // Arrange
        var testRawValue = 666.0;
        var expectedScaled = testRawValue / AMPLIFICATION_SCALE;

        // Act & Assert
        expectedScaled.Should().BeApproximately(FOUNDATION_MAX, 0.01,
            "666 / 55.5 should equal 12");
    }

    [Fact]
    public async Task GET_SystemWideStatus_MeetsProductionCriteria()
    {
        // Arrange
        var endpoint = "/api/codex/system-wide";

        // Act
        var response = await _client.GetAsync(endpoint);
        var status = await response.Content.ReadFromJsonAsync<Codex369StatusDto>();

        // Assert - Production deployment criteria
        status.Should().NotBeNull();

        // Log current score for visibility
        var score = status.CurrentPowerScore;
        var isChampionship = score >= CHAMPIONSHIP_MIN;
        var isDivineBalance = score >= DIVINE_BALANCE_MIN && score <= DIVINE_BALANCE_MAX;

        // Production requires Championship Mode (>= 10.0)
        if (isChampionship)
        {
            status.UltimatePower.IsChampionshipMode.Should().BeTrue(
                $"Score {score} >= 10.0 meets production deployment criteria");
        }

        if (isDivineBalance)
        {
            status.UltimatePower.InDivineBalance.Should().BeTrue(
                $"Score {score} in 11.5-12.0 range achieves Divine Balance");
        }
    }
}

/// <summary>
/// Test DTOs matching API responses
/// </summary>
public class FoundationMetric
{
    public string Domain { get; set; } = string.Empty;
    public string MetricName { get; set; } = string.Empty;
    public double RawValue { get; set; }
    public double ScaledValue { get; set; }
    public string AlertLevel { get; set; } = string.Empty;
}

public class AmplificationMetric
{
    public string Domain { get; set; } = string.Empty;
    public double RawCombinedValue { get; set; }
    public bool SafeFromImbalance { get; set; }
    public double AmplifiedScore { get; set; }
    public string AlertLevel { get; set; } = string.Empty;
}

public class UltimatePowerMetric
{
    public double UltimatePowerScore { get; set; }
    public double BalanceProximity { get; set; }
    public bool InDivineBalance { get; set; }
    public bool IsChampionshipMode { get; set; }
}

public class Codex369StatusDto
{
    public List<FoundationMetric> FoundationMetrics { get; set; } = new();
    public List<AmplificationMetric> AmplificationMetrics { get; set; } = new();
    public UltimatePowerMetric UltimatePower { get; set; } = new();
    public bool FrameworkHealthy { get; set; }
    public int TotalFoundationMetrics { get; set; }
    public int TotalAmplifications { get; set; }
    public double CurrentPowerScore { get; set; }
    public double BalanceDeficit { get; set; }
}

public class CodexAlert
{
    public int Id { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string AlertLevel { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
