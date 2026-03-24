namespace TerraFusion.API.Contracts.Trace;

/// <summary>
/// Matches the TraceEvent interface in frontend/apps/os-shell/src/services/terraTrace.ts.
/// CountyId is required — sovereign county isolation invariant (FISMA).
/// </summary>
public sealed record TraceEventDto
{
    public required string Id { get; init; }
    public required string Timestamp { get; init; }
    public required string Action { get; init; }
    public required string EntityType { get; init; }
    public required string EntityId { get; init; }
    public required string Actor { get; init; }

    /// <summary>Required. Sovereign county isolation — reject if null/empty.</summary>
    public required string CountyId { get; init; }

    public List<FieldDiffDto> Diffs { get; init; } = new();
    public Dictionary<string, System.Text.Json.JsonElement>? Meta { get; init; }
}

public sealed record FieldDiffDto(string Field,
    System.Text.Json.JsonElement? Before,
    System.Text.Json.JsonElement? After);

public sealed record TraceIngestionResponse(bool Accepted, long Seq);
