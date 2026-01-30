using System.Net;
using System.Text.Json;
using TerraFusion.API.Contracts.Agents;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

[Collection("Integration")]
public class AgentTelemetryContractTests : IClassFixture<ApiWebAppFactory>
{
    private readonly ApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public AgentTelemetryContractTests(ApiWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetStatus_Returns_Valid_Telemetry()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/agents/status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var status = JsonSerializer.Deserialize<AgentSystemStatusResponse>(json, _jsonOpts);

        Assert.NotNull(status);
        Assert.True(status.TotalAgents >= 0);
        Assert.True(status.ActiveAgents >= 0);
        Assert.True(status.QueueDepth >= 0);
        Assert.Contains(status.ExecutionMode, new[] { "Autonomous", "HumanInLoop", "Passive" });
    }

    [Fact]
    public async Task GetEvents_Returns_Response_With_Cursor()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/agents/events?limit=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var payload = JsonSerializer.Deserialize<AgentEventsResponse>(json, _jsonOpts);

        Assert.NotNull(payload);
        Assert.NotNull(payload.Events);

        if (payload.Events.Count > 1)
        {
            var first = payload.Events[0].Seq;
            var last = payload.Events[^1].Seq;
            Assert.True(first <= last, "Events should be ascending by seq.");
        }
    }

    [Fact]
    public async Task GetEvents_Respects_Limit_Parameter()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/agents/events?limit=1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var payload = JsonSerializer.Deserialize<AgentEventsResponse>(json, _jsonOpts);

        Assert.NotNull(payload);
        Assert.True(payload.Events.Count <= 1, $"Expected max 1 event, got {payload.Events.Count}.");
    }

    [Fact]
    public async Task GetEvents_Cursor_RoundTrip_Ensures_Zero_Overlap()
    {
        using var client = _factory.CreateClient();

        var initialResp = await client.GetAsync("/api/agents/events?limit=2");
        initialResp.EnsureSuccessStatusCode();
        var initialJson = await initialResp.Content.ReadAsStringAsync();
        var batch1 = JsonSerializer.Deserialize<AgentEventsResponse>(initialJson, _jsonOpts);

        if (batch1 == null || batch1.Events.Count == 0)
        {
            return;
        }

        var pivotSeq = batch1.Events.Max(e => e.Seq);

        var nextResp = await client.GetAsync($"/api/agents/events?limit=10&after={pivotSeq}");
        nextResp.EnsureSuccessStatusCode();
        var nextJson = await nextResp.Content.ReadAsStringAsync();
        var batch2 = JsonSerializer.Deserialize<AgentEventsResponse>(nextJson, _jsonOpts);

        if (batch2 == null || batch2.Events.Count == 0)
        {
            return;
        }

        Assert.True(batch2.Events.All(e => e.Seq > pivotSeq), "Overlap detected in cursor pagination.");

        var ordered = batch2.Events.OrderBy(e => e.Seq).Select(e => e.Seq).ToList();
        var received = batch2.Events.Select(e => e.Seq).ToList();
        Assert.Equal(ordered, received);
    }

    [Fact]
    public async Task GetEvents_Response_Includes_DroppedBeforeSeq_Field()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/agents/events?limit=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();

        // Verify the response shape includes droppedBeforeSeq field
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("events", out _), "Response must have 'events' array");
        Assert.True(root.TryGetProperty("nextCursor", out _), "Response must have 'nextCursor' field");
        Assert.True(root.TryGetProperty("droppedBeforeSeq", out var droppedProp), "Response must have 'droppedBeforeSeq' field");

        // droppedBeforeSeq must be a number (not null) - always present
        Assert.True(
            droppedProp.ValueKind == JsonValueKind.Number,
            $"droppedBeforeSeq must be a number, got {droppedProp.ValueKind}");

        var droppedValue = droppedProp.GetInt64();
        Assert.True(droppedValue >= 0, "droppedBeforeSeq must be >= 0");
    }

    [Fact]
    public async Task GetEvents_Response_Includes_NextAfter_Field()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/agents/events?limit=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("nextAfter", out var nextAfterProp), "Response must have 'nextAfter' field");

        // nextAfter must be a number (not null) - always present
        Assert.True(
            nextAfterProp.ValueKind == JsonValueKind.Number,
            $"nextAfter must be a number, got {nextAfterProp.ValueKind}");

        var nextAfterValue = nextAfterProp.GetInt64();
        Assert.True(nextAfterValue >= 0, "nextAfter must be >= 0");
    }

    [Fact]
    public async Task GetEvents_Sequence_Numbers_Are_Strictly_Monotonic()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/agents/events?limit=100");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var payload = JsonSerializer.Deserialize<AgentEventsResponse>(json, _jsonOpts);

        Assert.NotNull(payload);

        if (payload.Events.Count < 2)
        {
            return; // Not enough events to verify ordering
        }

        // Verify strictly monotonic ascending sequence
        for (var i = 1; i < payload.Events.Count; i++)
        {
            var prev = payload.Events[i - 1].Seq;
            var curr = payload.Events[i].Seq;
            Assert.True(curr > prev, $"Events must be strictly ascending: seq[{i - 1}]={prev}, seq[{i}]={curr}");
        }
    }
}
