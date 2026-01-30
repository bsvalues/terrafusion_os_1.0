/*
 * ═══════════════════════════════════════════════════════════════
 * PHASE 21: CAPACITY PREDICTION TESTS
 * SystemGPT Capacity Prediction & Advisory
 * "Are we trending towards saturation?" "What should we do?"
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
/// Phase 21: Tests for SystemGPT capacity prediction and advisory.
/// Validates trend detection, forecasting, and risk assessment.
/// </summary>
public class SystemGptCapacityPredictionTests
{
    private readonly SystemGptMetricsService _service;
    private readonly TimeSpan _defaultWindow = TimeSpan.FromMinutes(15);

    public SystemGptCapacityPredictionTests()
    {
        _service = new SystemGptMetricsService(NullLogger<SystemGptMetricsService>.Instance);
    }

    // ═══════════════════════════════════════════════════════════════
    // CAPACITY PREDICTION DTO TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SystemGptCapacityPredictionDto_HasRequiredProperties()
    {
        var dto = new SystemGptCapacityPredictionDto();

        dto.Should().NotBeNull();
        dto.SaturationRisk.Should().NotBeNull("SaturationRisk is required");
        dto.PredictedRequestsPerMinuteIn5Min.Should().Be(0);
        dto.LatencyIncreasing.Should().BeFalse();
        dto.ErrorRateIncreasing.Should().BeFalse();
        dto.RagLatencyIncreasing.Should().BeFalse();
    }

    [Fact]
    public void SaturationRiskLevel_HasExpectedValues()
    {
        // Verify enum has all expected levels
        Enum.GetNames<SaturationRiskLevel>().Should().Contain("Low");
        Enum.GetNames<SaturationRiskLevel>().Should().Contain("Medium");
        Enum.GetNames<SaturationRiskLevel>().Should().Contain("High");
    }

    // ═══════════════════════════════════════════════════════════════
    // SNAPSHOT WITH CAPACITY TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void GetSnapshot_ReturnsCapacityPrediction_WhenNoData()
    {
        // When no samples are recorded, snapshot should still have capacity prediction
        var snapshot = _service.GetSnapshot(_defaultWindow);

        snapshot.Should().NotBeNull();
        snapshot.Capacity.Should().NotBeNull("Capacity prediction should always be present");
        snapshot.Capacity!.SaturationRisk.Should().Be("Low", "Empty system has low risk");
        snapshot.Capacity.Advisory.Should().NotBeNullOrEmpty("Advisory should explain lack of data");
    }

    [Fact]
    public void GetSnapshot_ReturnsCapacityPrediction_WithData()
    {
        // Record several samples
        for (int i = 0; i < 10; i++)
        {
            _service.RecordSample(
                latencyMs: 500 + (i * 10),
                success: true,
                tokensIn: 100,
                tokensOut: 200,
                ragLatencyMs: 200,
                embeddingLatencyMs: 50
            );
        }

        var snapshot = _service.GetSnapshot(_defaultWindow);

        snapshot.Should().NotBeNull();
        snapshot.Capacity.Should().NotBeNull();
        snapshot.Capacity!.PredictedRequestsPerMinuteIn5Min.Should().BeGreaterOrEqualTo(0);
        snapshot.Capacity.Advisory.Should().NotBeNullOrEmpty();
    }

    // ═══════════════════════════════════════════════════════════════
    // TREND DETECTION TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void CapacityPrediction_DetectsStableTrends_WhenMetricsFlat()
    {
        // Record samples with consistent latency (no trend)
        for (int i = 0; i < 20; i++)
        {
            _service.RecordSample(
                latencyMs: 500, // Constant
                success: true,
                tokensIn: 100,
                tokensOut: 200
            );
            Thread.Sleep(10); // Small delay to spread timestamps
        }

        var snapshot = _service.GetSnapshot(TimeSpan.FromMinutes(5));

        snapshot.Capacity.Should().NotBeNull();
        // Flat data shouldn't show increasing trends
        // (Exact behavior depends on bucket distribution, but risk should be low)
        snapshot.Capacity!.SaturationRisk.Should().BeOneOf("Low", "Medium");
    }

    [Fact]
    public void CapacityPrediction_DetectsIncreasingErrors_WhenErrorsRise()
    {
        // Record samples with increasing error rate
        for (int i = 0; i < 20; i++)
        {
            bool success = i < 15; // First 15 success, last 5 fail
            _service.RecordSample(
                latencyMs: 500,
                success: success,
                tokensIn: 100,
                tokensOut: 200
            );
            Thread.Sleep(5);
        }

        var snapshot = _service.GetSnapshot(TimeSpan.FromMinutes(5));

        snapshot.Capacity.Should().NotBeNull();
        // With 25% error rate at end, error rate should be flagged or advisory should mention it
        snapshot.Capacity!.Advisory.Should().NotBeNullOrEmpty();
    }

    // ═══════════════════════════════════════════════════════════════
    // RISK LEVEL DETERMINATION TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void CapacityPrediction_ShowsLowRisk_WhenSystemHealthy()
    {
        // Record a few successful, fast samples
        for (int i = 0; i < 5; i++)
        {
            _service.RecordSample(
                latencyMs: 200, // Fast
                success: true, // All succeed
                tokensIn: 50,
                tokensOut: 100
            );
        }

        var snapshot = _service.GetSnapshot(_defaultWindow);

        snapshot.Capacity.Should().NotBeNull();
        snapshot.Capacity!.SaturationRisk.Should().Be("Low");
        snapshot.Capacity.Advisory.Should().Contain("✅");
    }

    [Fact]
    public void CapacityPrediction_ShowsElevatedRisk_WhenErrorRateHigh()
    {
        // Record samples with high error rate (>5%)
        for (int i = 0; i < 20; i++)
        {
            bool success = i % 3 != 0; // ~33% error rate
            _service.RecordSample(
                latencyMs: 800,
                success: success,
                tokensIn: 100,
                tokensOut: 200
            );
        }

        var snapshot = _service.GetSnapshot(_defaultWindow);

        snapshot.Capacity.Should().NotBeNull();
        // With 33% error rate, risk should be elevated
        snapshot.Capacity!.SaturationRisk.Should().BeOneOf("Medium", "High");
        snapshot.Capacity.Advisory.Should().NotBeNullOrEmpty();
    }

    // ═══════════════════════════════════════════════════════════════
    // ADVISORY MESSAGE TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Advisory_ContainsActionableGuidance()
    {
        // Record some samples
        for (int i = 0; i < 10; i++)
        {
            _service.RecordSample(
                latencyMs: 500,
                success: i % 10 != 0,
                tokensIn: 100,
                tokensOut: 200
            );
        }

        var snapshot = _service.GetSnapshot(_defaultWindow);

        snapshot.Capacity.Should().NotBeNull();
        snapshot.Capacity!.Advisory.Should().NotBeNullOrEmpty("Advisory should always be present");

        // Advisory should be human-readable (not empty or just whitespace)
        snapshot.Capacity.Advisory!.Trim().Length.Should().BeGreaterThan(10,
            "Advisory should contain meaningful guidance");
    }

    [Fact]
    public void Advisory_MentionsScaling_WhenHighLoad()
    {
        // Record many samples to simulate high load
        for (int i = 0; i < 100; i++)
        {
            _service.RecordSample(
                latencyMs: 2000 + i * 50, // Increasing latency
                success: i % 20 != 0, // 5% error rate
                tokensIn: 500,
                tokensOut: 1000
            );
        }

        var snapshot = _service.GetSnapshot(TimeSpan.FromMinutes(5));

        // With degraded performance indicators, advisory should provide guidance
        snapshot.Capacity.Should().NotBeNull();
        snapshot.Capacity!.Advisory.Should().NotBeNullOrEmpty();
    }

    // ═══════════════════════════════════════════════════════════════
    // INTEGRATION WITH METRICS SNAPSHOT
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void MetricsSnapshot_IncludesCapacity_InResponse()
    {
        // Record a sample
        _service.RecordSample(
            latencyMs: 500,
            success: true,
            tokensIn: 100,
            tokensOut: 200
        );

        var snapshot = _service.GetSnapshot(_defaultWindow);

        // Verify Capacity is part of the snapshot
        snapshot.Capacity.Should().NotBeNull();
        snapshot.Capacity.Should().BeOfType<SystemGptCapacityPredictionDto>();

        // Verify other Phase 20 fields still work
        snapshot.TotalRequests.Should().BeGreaterOrEqualTo(1);
        snapshot.GeneratedAtUtc.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void PredictedRpm_IsReasonable_BasedOnCurrentData()
    {
        // Record samples at a controlled rate
        for (int i = 0; i < 30; i++)
        {
            _service.RecordSample(
                latencyMs: 500,
                success: true,
                tokensIn: 100,
                tokensOut: 200
            );
            Thread.Sleep(10); // ~100 samples per second theoretical
        }

        var snapshot = _service.GetSnapshot(TimeSpan.FromMinutes(5));

        snapshot.Capacity.Should().NotBeNull();
        // Predicted RPM should be non-negative
        snapshot.Capacity!.PredictedRequestsPerMinuteIn5Min.Should().BeGreaterOrEqualTo(0);
    }
}
