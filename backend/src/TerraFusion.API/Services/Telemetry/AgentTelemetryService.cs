using System.Globalization;
using TerraFusion.API.Contracts.Agents;

namespace TerraFusion.API.Services.Telemetry;

public sealed class AgentTelemetryService : IAgentTelemetryService
{
    private readonly object _gate = new();
    private readonly int _capacity;
    private readonly AgentEvent[] _buffer;

    private long _nextSeq;
    private int _count;
    private int _writeIndex;
    private DateTime? _lastActivityUtc;

    public AgentTelemetryService(int capacity = 1000)
    {
        _capacity = Math.Max(100, capacity);
        _buffer = new AgentEvent[_capacity];
    }

    public void Emit(string level, string agent, string topic, string message, object? data = null, string? correlationId = null)
    {
        var seq = Interlocked.Increment(ref _nextSeq);
        var evt = new AgentEvent
        {
            Seq = seq,
            TsUtc = DateTime.UtcNow,
            Level = level,
            Agent = agent,
            Topic = topic,
            Message = message,
            Data = data,
            CorrelationId = correlationId
        };

        lock (_gate)
        {
            _buffer[_writeIndex] = evt;
            _writeIndex = (_writeIndex + 1) % _capacity;
            _count = Math.Min(_capacity, _count + 1);
            _lastActivityUtc = evt.TsUtc;
        }
    }

    public AgentSystemStatusResponse GetStatus()
    {
        var eventCount = Interlocked.Read(ref _nextSeq);

        return new AgentSystemStatusResponse
        {
            ExecutionMode = "Passive",
            TotalAgents = 0,
            ActiveAgents = 0,
            QueueDepth = 0,
            LastActivityUtc = _lastActivityUtc,
            EventCount = eventCount,
            Provider = "TerraFusion.API",
            Warnings = new List<string>
            {
                "Agent runtime not wired: counts are telemetry-only (events)."
            }
        };
    }

    public AgentEventsResponse GetEvents(int limit, string? afterCursor)
    {
        limit = Math.Clamp(limit, 1, 500);
        var afterSeq = ParseCursor(afterCursor);

        List<AgentEvent> events;
        long maxSeq;
        long droppedBeforeSeq;

        lock (_gate)
        {
            // Determine oldest event in buffer (for gap detection)
            // Always set droppedBeforeSeq to oldest seq (0 if empty)
            long oldestSeq = 0;
            if (_count > 0)
            {
                var oldestIndex = _count == _capacity ? _writeIndex : 0;
                var oldestEvt = _buffer[oldestIndex];
                if (oldestEvt != null)
                {
                    oldestSeq = oldestEvt.Seq;
                }
            }

            // Always provide the oldest available seq (0 if buffer empty)
            droppedBeforeSeq = oldestSeq;

            events = new List<AgentEvent>(_count);

            var startIndex = _count == _capacity ? _writeIndex : 0;
            for (var i = 0; i < _count; i += 1)
            {
                var idx = (startIndex + i) % _capacity;
                var evt = _buffer[idx];
                if (evt == null)
                {
                    continue;
                }

                if (evt.Seq > afterSeq)
                {
                    events.Add(evt);
                }
            }

            if (events.Count > limit)
            {
                events = events.Skip(events.Count - limit).ToList();
            }

            maxSeq = events.Count == 0 ? afterSeq : events[^1].Seq;
        }

        return new AgentEventsResponse
        {
            Events = events,
            NextCursor = maxSeq > afterSeq ? MakeCursor(maxSeq) : afterCursor,
            NextAfter = maxSeq,
            DroppedBeforeSeq = droppedBeforeSeq
        };
    }

    private static string MakeCursor(long seq) => seq.ToString(CultureInfo.InvariantCulture);

    private static long ParseCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor))
        {
            return 0;
        }

        return long.TryParse(cursor, NumberStyles.Integer, CultureInfo.InvariantCulture, out var seq)
            ? seq
            : 0;
    }
}
