namespace TerraFusion.Core.DTOs.Pilot;

public record ExplainRequest(
    string Query,
    string? ParcelId,
    string CountyId,
    string ActorId,
    string Source,
    Dictionary<string, object>? ParcelSummary = null,
    string[]? Statutes = null
);
