namespace TerraFusion.Core.DTOs.Pilot;

/// <summary>
/// Response for GET /api/pilot/router/status.
/// Reports live/offline state and probe latency for every configured model lane.
/// </summary>
/// <param name="Lanes">One entry per route key in Muse:Router:Routes.</param>
/// <param name="FallbackActive">True when at least one lane is offline — those
/// requests will hit the static template until the model is reachable.</param>
public record RouterStatusResponse(
    IReadOnlyDictionary<string, LaneStatus> Lanes,
    bool FallbackActive
);

/// <summary>Status snapshot for a single router lane.</summary>
/// <param name="Model">ModelId as configured in Muse:Router:Routes.</param>
/// <param name="Endpoint">Ollama / OpenAI-compatible base URL for this lane.</param>
/// <param name="Live">True when the endpoint responded within the probe timeout.</param>
/// <param name="LatencyMs">Round-trip time in milliseconds; null when offline.</param>
public record LaneStatus(
    string Model,
    string Endpoint,
    bool Live,
    int? LatencyMs
);
