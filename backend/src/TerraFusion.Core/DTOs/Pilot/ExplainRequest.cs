namespace TerraFusion.Core.DTOs.Pilot;

/// <summary>
/// Dev/operator surface context published by the OS shell and sent with every explain call.
/// All fields are optional — backend degrades gracefully when Canon or Vite are not running.
/// </summary>
public record WorkContext(
    string? ActiveBranch,
    string? ActiveFile,
    string? BuildStatus,
    string? ActiveSuite,
    string? ActiveTab
);

public record ExplainRequest(
    string Query,
    string? ParcelId,
    string CountyId,
    string ActorId,
    string Source,
    Dictionary<string, object>? ParcelSummary = null,
    string[]? Statutes = null,
    WorkContext? Context = null
);
