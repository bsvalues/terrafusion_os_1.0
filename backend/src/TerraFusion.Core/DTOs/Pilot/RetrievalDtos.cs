namespace TerraFusion.Core.DTOs.Pilot;

/// <summary>
/// Live git state for the active branch and file, populated at explain time.
/// Truncated to token budget before insertion into contextPreamble.
/// </summary>
public record GitContext(
    /// <summary>Resolved branch name (echo of WorkContext.ActiveBranch).</summary>
    string Branch,

    /// <summary>
    /// Unified diff for the active file only, truncated to MaxDiffChars.
    /// Null when the file has no changes relative to the base branch,
    /// or when git is unavailable.
    /// </summary>
    string? FileDiff,

    /// <summary>All files changed in this branch relative to the base branch.</summary>
    string[] ChangedFiles,

    /// <summary>True when FileDiff or ChangedFiles are non-empty.</summary>
    bool HasChanges
);

/// <summary>
/// Contract document resolved from the active file path and suite.
/// Used to answer "what contract governs this surface?" without an LLM lookup.
/// </summary>
public record SurfaceContract(
    /// <summary>Human-readable surface name, e.g. "Pilot Explain API".</summary>
    string Surface,

    /// <summary>
    /// One-paragraph contract summary injected directly into contextPreamble.
    /// Written as a statement the LLM can quote: "This surface is responsible for..."
    /// </summary>
    string Summary,

    /// <summary>Optional path to the full contract document for RAG retrieval.</summary>
    string? DocPath
);
