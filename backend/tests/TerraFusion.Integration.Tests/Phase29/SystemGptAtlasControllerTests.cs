// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29 TEST PLAN: B5 - SSE Controller Tests
// SystemGPT Atlas Real-Time Telemetry & Alert Engine
// "Write the exam before the course"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.AI.Infrastructure;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase29;

/// <summary>
/// B5: SSE Controller Tests
/// Goal: Verify SSE endpoint contract - headers, event format, flushing.
/// These tests validate the SSE infrastructure components directly since
/// the GPTController has many required dependencies.
/// </summary>
public class SystemGptAtlasControllerTests
{
    // ═══════════════════════════════════════════════════════════════════════════════
    // B5.1 – SSE Writer sets correct headers
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B5_1_SseWriter_SetsCorrectContentType()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();

        // Act
        writer.ConfigureResponseHeaders(httpContext.Response);

        // Assert
        Assert.Equal("text/event-stream", httpContext.Response.ContentType);
    }

    [Fact]
    public void B5_1_SseWriter_SetsCacheControlNoCache()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();

        // Act
        writer.ConfigureResponseHeaders(httpContext.Response);

        // Assert
        Assert.True(httpContext.Response.Headers.ContainsKey("Cache-Control"));
        Assert.Contains("no-cache", httpContext.Response.Headers["Cache-Control"].ToString());
    }

    [Fact]
    public void B5_1_SseWriter_SetsConnectionKeepAlive()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();

        // Act
        writer.ConfigureResponseHeaders(httpContext.Response);

        // Assert
        Assert.True(httpContext.Response.Headers.ContainsKey("Connection"));
        Assert.Contains("keep-alive", httpContext.Response.Headers["Connection"].ToString());
    }

    [Fact]
    public void B5_1_SseWriter_DisablesNginxBuffering()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();

        // Act
        writer.ConfigureResponseHeaders(httpContext.Response);

        // Assert
        Assert.True(httpContext.Response.Headers.ContainsKey("X-Accel-Buffering"));
        Assert.Equal("no", httpContext.Response.Headers["X-Accel-Buffering"].ToString());
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B5.2 – SSE event format is correct
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B5_2_SseWriter_WritesCorrectEventFormat()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();
        var bodyStream = new MemoryStream();
        httpContext.Response.Body = bodyStream;

        var testEvent = new SystemGptAtlasLiveEventDto
        {
            Version = "1.0",
            EventType = "atlas_county_batch",
            Timestamp = DateTimeOffset.Parse("2025-12-10T12:00:00Z"),
            Counties = new List<SystemGptAtlasLiveCountyEventDto>
            {
                new() { CountyId = "benton", HealthState = "healthy" }
            }
        };

        // Act
        await writer.WriteEventAsync(httpContext.Response, "atlas_county_batch", testEvent, CancellationToken.None);

        // Assert
        bodyStream.Position = 0;
        var output = Encoding.UTF8.GetString(bodyStream.ToArray());

        // SSE format: event: <type>\ndata: <json>\n\n
        Assert.Contains("event: atlas_county_batch", output);
        Assert.Contains("data: ", output);
        Assert.Contains("\"version\":\"1.0\"", output);
        Assert.Contains("\"countyId\":\"benton\"", output);
        Assert.EndsWith("\n\n", output);
    }

    [Fact]
    public async Task B5_2_SseWriter_SerializesJsonWithCamelCase()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();
        var bodyStream = new MemoryStream();
        httpContext.Response.Body = bodyStream;

        var testEvent = new SystemGptAtlasLiveCountyEventDto
        {
            CountyId = "test",
            HealthScore = 0.95,
            HealthState = "healthy",
            RagActive = true,
            GuardrailTriggered = false,
            ActiveRequests = 42,
            P95LatencyMs = 150.5,
            ErrorRatePercent = 0.1
        };

        // Act
        await writer.WriteEventAsync(httpContext.Response, "test", testEvent, CancellationToken.None);

        // Assert
        bodyStream.Position = 0;
        var output = Encoding.UTF8.GetString(bodyStream.ToArray());

        // Verify camelCase serialization
        Assert.Contains("\"countyId\"", output);
        Assert.Contains("\"healthScore\"", output);
        Assert.Contains("\"healthState\"", output);
        Assert.Contains("\"ragActive\"", output);
        Assert.Contains("\"guardrailTriggered\"", output);
        Assert.Contains("\"activeRequests\"", output);
        Assert.Contains("\"p95LatencyMs\"", output);
        Assert.Contains("\"errorRatePercent\"", output);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B5.3 – Live service streaming behavior
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B5_3_LiveService_StreamYieldsEvents()
    {
        // Arrange
        var mockTelemetrySource = new Mock<ISystemGptAtlasTelemetrySource>();
        mockTelemetrySource.Setup(m => m.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RawCountyMetrics>
            {
                new() { CountyId = "benton", HealthScore = 0.95, RagActive = true }
            });

        var classifier = new SystemGptAtlasClassifier(new SystemGptAtlasThresholds
        {
            WarningHealthScore = 0.80,
            CriticalHealthScore = 0.60,
            WarningErrorRatePercent = 1.0,
            CriticalErrorRatePercent = 5.0,
            WarningP95Ms = 300,
            CriticalP95Ms = 1000
        });

        var options = Microsoft.Extensions.Options.Options.Create(new SystemGptAtlasLiveOptions
        {
            IntervalMs = 100
        });

        var service = new SystemGptAtlasLiveService(
            mockTelemetrySource.Object,
            classifier,
            options,
            NullLogger<SystemGptAtlasLiveService>.Instance);

        // Act
        var cts = new CancellationTokenSource();
        cts.CancelAfter(250); // Allow 2-3 events

        var events = new List<SystemGptAtlasLiveEventDto>();
        try
        {
            await foreach (var evt in service.StreamEventsAsync(cts.Token))
            {
                events.Add(evt);
            }
        }
        catch (OperationCanceledException) { }

        // Assert
        Assert.NotEmpty(events);
        Assert.All(events, e =>
        {
            Assert.Equal("1.0", e.Version);
            Assert.Equal("atlas_county_batch", e.EventType);
            Assert.NotEmpty(e.Counties);
        });
    }

    [Fact]
    public async Task B5_3_Snapshot_ReturnsCurrentState()
    {
        // Arrange
        var mockTelemetrySource = new Mock<ISystemGptAtlasTelemetrySource>();
        mockTelemetrySource.Setup(m => m.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RawCountyMetrics>
            {
                new() { CountyId = "benton", HealthScore = 0.95, RagActive = true },
                new() { CountyId = "yakima", HealthScore = 0.70, RagActive = false }
            });

        var classifier = new SystemGptAtlasClassifier(new SystemGptAtlasThresholds
        {
            WarningHealthScore = 0.80,
            CriticalHealthScore = 0.60
        });

        var options = Microsoft.Extensions.Options.Options.Create(new SystemGptAtlasLiveOptions());

        var service = new SystemGptAtlasLiveService(
            mockTelemetrySource.Object,
            classifier,
            options,
            NullLogger<SystemGptAtlasLiveService>.Instance);

        // Act
        var snapshot = await service.GetCurrentSnapshotAsync(CancellationToken.None);

        // Assert
        Assert.NotNull(snapshot);
        Assert.Equal("1.0", snapshot.Version);
        Assert.Equal("atlas_county_batch", snapshot.EventType);
        Assert.Equal(2, snapshot.Counties.Count);

        var benton = snapshot.Counties.First(c => c.CountyId == "benton");
        Assert.Equal("healthy", benton.HealthState);

        var yakima = snapshot.Counties.First(c => c.CountyId == "yakima");
        Assert.Equal("warning", yakima.HealthState);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B5.4 – Error handling
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task B5_4_SseWriter_HandlesEmptyEvent()
    {
        // Arrange
        var writer = new ServerSentEventsWriter();
        var httpContext = new DefaultHttpContext();
        var bodyStream = new MemoryStream();
        httpContext.Response.Body = bodyStream;

        var emptyEvent = new SystemGptAtlasLiveEventDto
        {
            Version = "1.0",
            EventType = "atlas_county_batch",
            Timestamp = DateTimeOffset.UtcNow,
            Counties = new List<SystemGptAtlasLiveCountyEventDto>()
        };

        // Act
        await writer.WriteEventAsync(httpContext.Response, "atlas_county_batch", emptyEvent, CancellationToken.None);

        // Assert
        bodyStream.Position = 0;
        var output = Encoding.UTF8.GetString(bodyStream.ToArray());
        Assert.Contains("\"counties\":[]", output);
    }

    [Fact]
    public async Task B5_4_LiveService_HandlesEmptyTelemetry()
    {
        // Arrange
        var mockTelemetrySource = new Mock<ISystemGptAtlasTelemetrySource>();
        mockTelemetrySource.Setup(m => m.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RawCountyMetrics>());

        var classifier = new SystemGptAtlasClassifier(new SystemGptAtlasThresholds());
        var options = Microsoft.Extensions.Options.Options.Create(new SystemGptAtlasLiveOptions());

        var service = new SystemGptAtlasLiveService(
            mockTelemetrySource.Object,
            classifier,
            options,
            NullLogger<SystemGptAtlasLiveService>.Instance);

        // Act
        var snapshot = await service.GetCurrentSnapshotAsync(CancellationToken.None);

        // Assert
        Assert.NotNull(snapshot);
        Assert.Empty(snapshot.Counties);
    }

    [Fact]
    public async Task B5_4_LiveService_StreamStopsOnCancellation()
    {
        // Arrange
        var mockTelemetrySource = new Mock<ISystemGptAtlasTelemetrySource>();
        mockTelemetrySource.Setup(m => m.GetCurrentMetricsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RawCountyMetrics>
            {
                new() { CountyId = "test", HealthScore = 0.95 }
            });

        var classifier = new SystemGptAtlasClassifier(new SystemGptAtlasThresholds());
        var options = Microsoft.Extensions.Options.Options.Create(new SystemGptAtlasLiveOptions
        {
            IntervalMs = 50
        });

        var service = new SystemGptAtlasLiveService(
            mockTelemetrySource.Object,
            classifier,
            options,
            NullLogger<SystemGptAtlasLiveService>.Instance);

        // Act
        var cts = new CancellationTokenSource();
        var eventsBeforeCancel = 0;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            await foreach (var evt in service.StreamEventsAsync(cts.Token))
            {
                eventsBeforeCancel++;
                if (eventsBeforeCancel >= 2)
                {
                    cts.Cancel();
                }
            }
        }
        catch (OperationCanceledException) { }

        stopwatch.Stop();

        // Assert
        Assert.True(eventsBeforeCancel >= 2);
        Assert.True(stopwatch.ElapsedMilliseconds < 1000, "Stream should stop quickly after cancellation");
    }
}
