// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29 TEST PLAN: B1 - DTO & Serialization Tests
// SystemGPT Atlas Real-Time Telemetry & Alert Engine
// "Write the exam before the course"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Text.Json;
using TerraFusion.AI.Models;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase29;

/// <summary>
/// B1: DTO & Serialization Tests
/// Goal: Ensure the live DTOs serialize as expected and enforce enums/values.
/// </summary>
public class SystemGptAtlasLiveSerializationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // ═══════════════════════════════════════════════════════════════════════════════
    // B1.1 – Serialize single county event
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B1_1_SerializeSingleCountyEvent_HasExpectedPropertyNames()
    {
        // Arrange
        var countyEvent = new SystemGptAtlasLiveCountyEventDto
        {
            CountyId = "benton",
            HealthScore = 0.95,
            HealthState = "healthy",
            RagActive = true,
            GuardrailTriggered = false,
            ActiveRequests = 42,
            P95LatencyMs = 150.5,
            ErrorRatePercent = 0.1,
            ActiveAlerts = new List<string>()
        };

        // Act
        var json = JsonSerializer.Serialize(countyEvent, JsonOptions);
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Assert
        Assert.True(root.TryGetProperty("countyId", out var countyIdProp));
        Assert.Equal("benton", countyIdProp.GetString());

        Assert.True(root.TryGetProperty("healthScore", out var healthScoreProp));
        Assert.Equal(0.95, healthScoreProp.GetDouble(), 2);

        Assert.True(root.TryGetProperty("healthState", out var healthStateProp));
        Assert.Equal("healthy", healthStateProp.GetString());

        Assert.True(root.TryGetProperty("ragActive", out var ragActiveProp));
        Assert.True(ragActiveProp.GetBoolean());

        Assert.True(root.TryGetProperty("guardrailTriggered", out var guardrailProp));
        Assert.False(guardrailProp.GetBoolean());

        Assert.True(root.TryGetProperty("activeRequests", out var activeRequestsProp));
        Assert.Equal(42, activeRequestsProp.GetInt32());

        Assert.True(root.TryGetProperty("p95LatencyMs", out var latencyProp));
        Assert.Equal(150.5, latencyProp.GetDouble(), 1);

        Assert.True(root.TryGetProperty("errorRatePercent", out var errorRateProp));
        Assert.Equal(0.1, errorRateProp.GetDouble(), 2);

        Assert.True(root.TryGetProperty("activeAlerts", out var alertsProp));
        Assert.Equal(JsonValueKind.Array, alertsProp.ValueKind);
    }

    [Fact]
    public void B1_1_HealthState_RoundTripsCorrectly()
    {
        // Arrange
        var states = new[] { "healthy", "warning", "critical", "offline" };

        foreach (var expectedState in states)
        {
            var countyEvent = new SystemGptAtlasLiveCountyEventDto
            {
                CountyId = "test",
                HealthState = expectedState
            };

            // Act
            var json = JsonSerializer.Serialize(countyEvent, JsonOptions);
            var deserialized = JsonSerializer.Deserialize<SystemGptAtlasLiveCountyEventDto>(json, JsonOptions);

            // Assert
            Assert.NotNull(deserialized);
            Assert.Equal(expectedState, deserialized!.HealthState);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // B1.2 – Serialize batch
    // ═══════════════════════════════════════════════════════════════════════════════

    [Fact]
    public void B1_2_SerializeBatch_HasExpectedRootProperties()
    {
        // Arrange
        var batch = new SystemGptAtlasLiveEventDto
        {
            Version = "1.0",
            EventType = "atlas_county_batch",
            Timestamp = DateTimeOffset.Parse("2025-12-10T12:00:00Z"),
            Counties = new List<SystemGptAtlasLiveCountyEventDto>
            {
                new() { CountyId = "benton", HealthState = "healthy" },
                new() { CountyId = "yakima", HealthState = "warning" },
                new() { CountyId = "franklin", HealthState = "critical" }
            }
        };

        // Act
        var json = JsonSerializer.Serialize(batch, JsonOptions);
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Assert
        Assert.True(root.TryGetProperty("version", out var versionProp));
        Assert.Equal("1.0", versionProp.GetString());

        Assert.True(root.TryGetProperty("eventType", out var eventTypeProp));
        Assert.Equal("atlas_county_batch", eventTypeProp.GetString());

        Assert.True(root.TryGetProperty("timestamp", out var timestampProp));
        Assert.NotNull(timestampProp.GetString());

        Assert.True(root.TryGetProperty("counties", out var countiesProp));
        Assert.Equal(JsonValueKind.Array, countiesProp.ValueKind);
        Assert.Equal(3, countiesProp.GetArrayLength());
    }

    [Fact]
    public void B1_2_SerializeBatch_CountiesLengthMatchesInput()
    {
        // Arrange
        var counties = new List<SystemGptAtlasLiveCountyEventDto>
        {
            new() { CountyId = "benton" },
            new() { CountyId = "yakima" }
        };

        var batch = new SystemGptAtlasLiveEventDto { Counties = counties };

        // Act
        var json = JsonSerializer.Serialize(batch, JsonOptions);
        var deserialized = JsonSerializer.Deserialize<SystemGptAtlasLiveEventDto>(json, JsonOptions);

        // Assert
        Assert.NotNull(deserialized);
        Assert.Equal(2, deserialized!.Counties.Count);
    }
}
