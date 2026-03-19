using System.Globalization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Contracts.Trace;

namespace TerraFusion.API.Services.Telemetry;

public sealed class TraceIngestionService : ITraceIngestionService
{
    private readonly object _gate = new();
    private readonly int _capacity;
    private readonly TraceEventDto?[] _buffer;
    private readonly ILogger<TraceIngestionService> _logger;

    private long _seq;
    private int _count;
    private int _writeIndex;

    public TraceIngestionService(IConfiguration configuration, ILogger<TraceIngestionService> logger)
    {
        _logger = logger;
        var cap = configuration.GetValue<int>("Tracing:TraceIngestionBufferCapacity", 1000);
        _capacity = Math.Max(100, cap);
        _buffer = new TraceEventDto?[_capacity];
    }

    public long Ingest(TraceEventDto evt)
    {
        if (string.IsNullOrWhiteSpace(evt.CountyId))
        {
            _logger.LogWarning("Trace event rejected: CountyId is null or empty. Action={Action}", evt.Action);
            return -1;
        }

        var seq = Interlocked.Increment(ref _seq);

        lock (_gate)
        {
            _buffer[_writeIndex] = evt;
            _writeIndex = (_writeIndex + 1) % _capacity;
            _count = Math.Min(_capacity, _count + 1);
        }

        return seq;
    }

    public TraceEventsPage GetRecent(int limit, string? afterCursor)
    {
        limit = Math.Clamp(limit, 1, 500);
        var afterSeq = ParseCursor(afterCursor);

        List<TraceEventDto> events;
        long maxSeq;
        long totalIngested;

        lock (_gate)
        {
            totalIngested = Interlocked.Read(ref _seq);

            events = new List<TraceEventDto>(_count);
            var startIndex = _count == _capacity ? _writeIndex : 0;

            for (var i = 0; i < _count; i++)
            {
                var idx = (startIndex + i) % _capacity;
                var item = _buffer[idx];
                if (item is null) continue;
                events.Add(item);
            }

            if (events.Count > limit)
            {
                events = events.Skip(events.Count - limit).ToList();
            }

            maxSeq = totalIngested;
        }

        var nextCursor = maxSeq > afterSeq ? MakeCursor(maxSeq) : afterCursor;
        return new TraceEventsPage(events, nextCursor, totalIngested);
    }

    private static string MakeCursor(long seq) => seq.ToString(CultureInfo.InvariantCulture);

    private static long ParseCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor)) return 0;
        return long.TryParse(cursor, NumberStyles.Integer, CultureInfo.InvariantCulture, out var seq) ? seq : 0;
    }
}
