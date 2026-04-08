namespace TerraFusion.Core.DTOs.Pilot;

/// <summary>
/// Stripped-down editor diagnostic for LLM consumption.
/// Only severity and message are sent — file/line are noise for natural-language answers.
/// Frontend filters to severity != 'hint' before sending.
/// </summary>
public record EditorMarker(string Severity, string Message);

/// <summary>
/// Dev/operator surface context published by the OS shell and sent with every explain call.
/// All fields are optional — backend degrades gracefully when Canon or Vite are not running.
/// </summary>
public record WorkContext(
    string? ActiveBranch,
    string? ActiveFile,
    string? BuildStatus,
    string? ActiveSuite,
    string? ActiveTab,
    EditorMarker[]? EditorMarkers = null
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
