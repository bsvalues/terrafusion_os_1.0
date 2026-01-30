using TerraFusion.API.Services.Telemetry;
using Xunit;

namespace TerraFusion.Unit.Tests.Telemetry;

/// <summary>
/// Unit tests for AgentTelemetryService ring buffer and cursor invariants.
/// These tests are deterministic (no external deps) and simulate all cursor edge cases.
/// </summary>
[Trait("Category", "Unit")]
public class AgentTelemetryServiceTests
{
    [Fact]
    public void GetEvents_Empty_Returns_DroppedBeforeSeq_Zero()
    {
        var svc = new AgentTelemetryService(capacity: 10);
        var result = svc.GetEvents(limit: 10, afterCursor: null);

        Assert.Empty(result.Events);
        Assert.Equal(0, result.DroppedBeforeSeq);
    }

    [Fact]
    public void GetEvents_Returns_Events_In_Ascending_Seq_Order()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        svc.Emit("Info", "TestAgent", "topic", "msg1");
        svc.Emit("Info", "TestAgent", "topic", "msg2");
        svc.Emit("Info", "TestAgent", "topic", "msg3");

        var result = svc.GetEvents(limit: 10, afterCursor: null);

        Assert.Equal(3, result.Events.Count);
        Assert.True(result.Events[0].Seq < result.Events[1].Seq);
        Assert.True(result.Events[1].Seq < result.Events[2].Seq);
    }

    [Fact]
    public void GetEvents_Respects_Limit()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        for (var i = 0; i < 10; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        var result = svc.GetEvents(limit: 3, afterCursor: null);

        Assert.Equal(3, result.Events.Count);
    }

    [Fact]
    public void GetEvents_After_Cursor_Filters_Old_Events()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        svc.Emit("Info", "TestAgent", "topic", "msg1"); // seq 1
        svc.Emit("Info", "TestAgent", "topic", "msg2"); // seq 2
        svc.Emit("Info", "TestAgent", "topic", "msg3"); // seq 3

        var result = svc.GetEvents(limit: 10, afterCursor: "1");

        Assert.Equal(2, result.Events.Count);
        Assert.True(result.Events.All(e => e.Seq > 1));
    }

    [Fact]
    public void GetEvents_Stale_Cursor_Returns_DroppedBeforeSeq_Greater_Than_Zero()
    {
        // Ring buffer with capacity 100 (service enforces minimum 100)
        var svc = new AgentTelemetryService(capacity: 100);

        // Push 110 events (will wrap after 100, oldest 10 dropped)
        for (var i = 1; i <= 110; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        // Query with stale cursor (before oldest available)
        var result = svc.GetEvents(limit: 200, afterCursor: "0");

        // Should get 100 events (11-110) and droppedBeforeSeq = 11
        Assert.Equal(100, result.Events.Count);
        Assert.True(result.DroppedBeforeSeq > 0, "droppedBeforeSeq should signal gap");
        Assert.Equal(11, result.DroppedBeforeSeq); // oldest available is seq 11
    }

    [Fact]
    public void GetEvents_Cursor_Within_Buffer_Returns_DroppedBeforeSeq_As_Oldest()
    {
        var svc = new AgentTelemetryService(capacity: 10);

        for (var i = 1; i <= 5; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        // Query with cursor at seq 2 (within buffer)
        var result = svc.GetEvents(limit: 10, afterCursor: "2");

        // Should get events 3, 4, 5 and droppedBeforeSeq = 1 (oldest)
        Assert.Equal(3, result.Events.Count);
        Assert.Equal(1, result.DroppedBeforeSeq); // oldest available, client not stale
    }

    [Fact]
    public void NextCursor_Returns_Max_Seq_When_Events_Exist()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        svc.Emit("Info", "TestAgent", "topic", "msg1"); // seq 1
        svc.Emit("Info", "TestAgent", "topic", "msg2"); // seq 2
        svc.Emit("Info", "TestAgent", "topic", "msg3"); // seq 3

        var result = svc.GetEvents(limit: 10, afterCursor: null);

        Assert.Equal("3", result.NextCursor);
        Assert.Equal(3, result.NextAfter);
    }

    [Fact]
    public void NextAfter_Equals_Last_Event_Seq()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        for (var i = 1; i <= 5; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        // With limit=3, service returns the LAST 3 events (3, 4, 5)
        var result = svc.GetEvents(limit: 3, afterCursor: null);

        Assert.Equal(3, result.Events.Count);
        Assert.Equal(5, result.Events[^1].Seq); // last event is seq 5
        Assert.Equal(result.Events[^1].Seq, result.NextAfter);
    }

    [Fact]
    public void NextAfter_Monotonic_Across_Calls()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        // Emit initial events
        for (var i = 1; i <= 5; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        var result1 = svc.GetEvents(limit: 100, afterCursor: null);
        Assert.Equal(5, result1.NextAfter);

        // Emit more events
        for (var i = 6; i <= 10; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        // Fetch with cursor from last call
        var result2 = svc.GetEvents(limit: 100, afterCursor: result1.NextAfter.ToString());

        Assert.Equal(5, result2.Events.Count); // events 6-10
        Assert.True(result2.NextAfter > result1.NextAfter, "NextAfter must be monotonically increasing when new events exist");
        Assert.Equal(10, result2.NextAfter);
    }

    [Fact]
    public void NextCursor_Unchanged_When_No_New_Events()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        svc.Emit("Info", "TestAgent", "topic", "msg1");
        svc.Emit("Info", "TestAgent", "topic", "msg2");

        // First fetch
        var result1 = svc.GetEvents(limit: 10, afterCursor: null);
        Assert.Equal("2", result1.NextCursor);

        // Second fetch with cursor at last position (no new events)
        var result2 = svc.GetEvents(limit: 10, afterCursor: "2");
        Assert.Empty(result2.Events);
        Assert.Equal("2", result2.NextCursor); // unchanged
    }

    [Fact]
    public void Cursor_Pagination_Has_Zero_Overlap()
    {
        var svc = new AgentTelemetryService(capacity: 100);

        // Emit initial batch
        for (var i = 1; i <= 5; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        // Page 1: get all current events
        var page1 = svc.GetEvents(limit: 100, afterCursor: null);
        Assert.Equal(5, page1.Events.Count);
        Assert.Equal(5, page1.NextAfter);

        // Emit more events
        for (var i = 6; i <= 10; i++)
        {
            svc.Emit("Info", "TestAgent", "topic", $"msg{i}");
        }

        // Page 2: get new events using cursor
        var page2 = svc.GetEvents(limit: 100, afterCursor: page1.NextCursor);
        Assert.Equal(5, page2.Events.Count);

        // No overlap
        var page1Seqs = page1.Events.Select(e => e.Seq).ToHashSet();
        var page2Seqs = page2.Events.Select(e => e.Seq).ToHashSet();
        Assert.Empty(page1Seqs.Intersect(page2Seqs));

        // Contiguous
        var maxPage1 = page1.Events.Max(e => e.Seq);
        var minPage2 = page2.Events.Min(e => e.Seq);
        Assert.Equal(maxPage1 + 1, minPage2);
    }
}
