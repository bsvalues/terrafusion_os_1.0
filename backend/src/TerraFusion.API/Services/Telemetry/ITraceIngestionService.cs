using TerraFusion.API.Contracts.Trace;

namespace TerraFusion.API.Services.Telemetry;

public interface ITraceIngestionService
{
    /// <summary>
    /// Ingests a trace event. Returns the sequence number (> 0) on success,
    /// or -1 if rejected (e.g., missing CountyId).
    /// </summary>
    long Ingest(TraceEventDto evt);

    TraceEventsPage GetRecent(int limit, string? afterCursor);
}

public sealed record TraceEventsPage(
    IReadOnlyList<TraceEventDto> Events,
    string? NextCursor,
    long TotalIngested);
