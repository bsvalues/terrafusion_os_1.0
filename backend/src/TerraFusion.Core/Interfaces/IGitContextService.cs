using TerraFusion.Core.DTOs.Pilot;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Read-only git CLI adapter.
/// Runs bounded, non-destructive git commands at explain time to populate
/// live repo context — branch diff and changed file list.
/// All operations are side-effect-free and safe to call during a request.
/// </summary>
public interface IGitContextService
{
    /// <summary>
    /// Returns git diff and changed-file list for the given branch.
    /// Runs: git diff {baseBranch}..{branch} -- {filePath}
    ///       git diff --name-only {baseBranch}..{branch}
    ///
    /// Both commands are bounded by timeout and diff character limits.
    /// Returns a null FileDiff (not an exception) when git is unavailable
    /// or the file has no changes.
    /// </summary>
    Task<GitContext> GetContextAsync(
        string branch,
        string? filePath,
        CancellationToken ct = default);
}
