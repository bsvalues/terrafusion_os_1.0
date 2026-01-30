// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29 TEST PLAN: B4 - Live Service Tests
// SystemGPT Atlas Real-Time Telemetry & Alert Engine
// "Write the exam before the course"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase29;

/// <summary>
/// B4: Live Service Tests
/// Goal: Verify StreamEventsAsync behavior, cancellation, and event generation.
/// </summary>
public class SystemGptAtlasLiveServiceTests
{
    // ═══════════════════════════════════════════════════════════════════════════════
    // B4.1 – StreamEventsAsync yields events
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B4_1_StreamEventsAsync_YieldsEventsAtInterval()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 3);
        var service = CreateLiveService(telemetrySource, intervalMs: 100);
        var cts = new CancellationTokenSource();
        var receivedEvents = new List<SystemGptAtlasLiveEventDto>();

        // Act - collect events for ~250ms (should get 2-3 events)
        var streamTask = Task.Run(async () =>
        {
            await foreach (var evt in service.StreamEventsAsync(cts.Token))
            {
                receivedEvents.Add(evt);
                if (receivedEvents.Count >= 2) cts.Cancel();
            }
        });

        cts.CancelAfter(500); // safety timeout
        try { await streamTask; } catch (OperationCanceledException) { }

        // Assert
        Assert.True(receivedEvents.Count >= 2, $"Expected at least 2 events, got {receivedEvents.Count}");
    }

    [Fact]
    public async Task B4_1_StreamEventsAsync_EventsHaveCorrectVersion()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 1);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();

        // Act
        await foreach (var evt in service.StreamEventsAsync(cts.Token))
        {
            // Assert
            Assert.Equal("1.0", evt.Version);
            Assert.Equal("atlas_county_batch", evt.EventType);
            cts.Cancel();
            break;
        }
    }

    [Fact]
    public async Task B4_1_StreamEventsAsync_EventsContainAllCounties()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 5);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();

        // Act
        await foreach (var evt in service.StreamEventsAsync(cts.Token))
        {
            // Assert
            Assert.Equal(5, evt.Counties.Count);
            cts.Cancel();
            break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B4.2 – Cancellation handling
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B4_2_StreamEventsAsync_StopsOnCancellation()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 1);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();
        var eventCount = 0;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        cts.CancelAfter(150);

        // Async enumerator may either throw or complete gracefully on cancellation
        try
        {
            await foreach (var evt in service.StreamEventsAsync(cts.Token))
            {
                eventCount++;
            }
        }
        catch (OperationCanceledException)
        {
            // Expected - cancellation occurred during enumeration
        }
        
        stopwatch.Stop();

        // Assert - stream stopped within reasonable time
        Assert.True(stopwatch.ElapsedMilliseconds < 1000, "Stream should stop quickly after cancellation");
    }

    [Fact]
    public async Task B4_2_StreamEventsAsync_ImmediateCancellation_DoesNotYieldEvents()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 1);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();
        cts.Cancel(); // Cancel immediately

        // Act & Assert - may either throw or complete without events
        // When the token is already cancelled, async enumerator may not throw
        var eventCount = 0;
        try
        {
            await foreach (var _ in service.StreamEventsAsync(cts.Token))
            {
                eventCount++;
            }
        }
        catch (OperationCanceledException)
        {
            // Expected
        }

        // Either no events or exception - both are valid
        Assert.True(eventCount == 0, "Should not receive events when cancelled");
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B4.3 – Timestamp accuracy
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B4_3_StreamEventsAsync_TimestampsAreRecent()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 1);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();
        var beforeStart = DateTimeOffset.UtcNow;

        // Act
        await foreach (var evt in service.StreamEventsAsync(cts.Token))
        {
            var afterEvent = DateTimeOffset.UtcNow;

            // Assert - timestamp should be between start and now
            Assert.True(evt.Timestamp >= beforeStart.AddSeconds(-1), "Timestamp too old");
            Assert.True(evt.Timestamp <= afterEvent.AddSeconds(1), "Timestamp in the future");

            cts.Cancel();
            break;
        }
    }

    [Fact]
    public async Task B4_3_StreamEventsAsync_TimestampsIncreaseMonotonically()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 1);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();
        DateTimeOffset? previousTimestamp = null;
        var eventCount = 0;

        // Act
        await foreach (var evt in service.StreamEventsAsync(cts.Token))
        {
            if (previousTimestamp.HasValue)
            {
                // Assert - each timestamp should be >= previous
                Assert.True(evt.Timestamp >= previousTimestamp.Value,
                    $"Timestamps should increase: {previousTimestamp} → {evt.Timestamp}");
            }

            previousTimestamp = evt.Timestamp;
            eventCount++;
            if (eventCount >= 3) { cts.Cancel(); break; }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B4.4 – Classification integration
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B4_4_StreamEventsAsync_CountiesHaveClassifiedHealthState()
    {
        // Arrange
        var telemetrySource = CreateMockTelemetrySource(countyCount: 1);
        var service = CreateLiveService(telemetrySource, intervalMs: 50);
        var cts = new CancellationTokenSource();

        // Act
        await foreach (var evt in service.StreamEventsAsync(cts.Token))
        {
            // Assert - every county should have a valid health state
            foreach (var county in evt.Counties)
            {
                Assert.Contains(county.HealthState, new[] { "healthy", "warning", "critical", "offline" });
            }

            cts.Cancel();
            break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Helper: Create mock telemetry source
    // ═══════════════════════════════════════════════════════════════════════════════

    private static ISystemGptAtlasTelemetrySource CreateMockTelemetrySource(int countyCount)
    {
        var mock = new Mock<ISystemGptAtlasTelemetrySource>();

        var rawMetrics = new List<RawCountyMetrics>();
        for (int i = 0; i < countyCount; i++)
        {
            rawMetrics.Add(new RawCountyMetrics
            {
                CountyId = $"county_{i}",
                HealthScore = 0.95 - (i * 0.1),
                RagActive = true,
                GuardrailTriggered = false,
                ActiveRequests = 10 + i,
                P95LatencyMs = 100 + (i * 50),
                ErrorRatePercent = 0.1 * i
            });
        }

        mock.Setup(m => m.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(rawMetrics);

        return mock.Object;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Helper: Create live service
    // ═══════════════════════════════════════════════════════════════════════════════

    private static ISystemGptAtlasLiveService CreateLiveService(
        ISystemGptAtlasTelemetrySource telemetrySource,
        int intervalMs = 1000)
    {
        var thresholds = new SystemGptAtlasThresholds();
        var classifier = new SystemGptAtlasClassifier(thresholds);
        var options = Options.Create(new SystemGptAtlasLiveOptions
        {
            IntervalMs = intervalMs
        });

        return new SystemGptAtlasLiveService(
            telemetrySource,
            classifier,
            options,
            NullLogger<SystemGptAtlasLiveService>.Instance);
    }
}
