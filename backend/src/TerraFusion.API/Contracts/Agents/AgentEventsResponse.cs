namespace TerraFusion.API.Contracts.Agents;

public sealed class AgentEventsResponse
{
    public List<AgentEvent> Events { get; init; } = new();

    /// <summary>
    /// String cursor for next request (legacy, equals nextAfter as string).
    /// </summary>
    public string? NextCursor { get; init; }

    /// <summary>
    /// Sequence number to use as 'after' in next request.
    /// - If events returned: equals last event's seq
    /// - If no events: equals the 'after' param (or 0 if none)
    /// Always present; use this for cursor-driven polling.
    /// </summary>
    public long NextAfter { get; init; }

    /// <summary>
    /// Earliest available sequence in the ring buffer.
    /// If client's cursor (after) is less than this value, they have missed events.
    /// Always present: 0 means buffer is empty, otherwise holds the oldest seq.
    /// </summary>
    public long DroppedBeforeSeq { get; init; }
}
