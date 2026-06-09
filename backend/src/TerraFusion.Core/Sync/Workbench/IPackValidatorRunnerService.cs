namespace TerraFusion.Core.Sync.Workbench;

// ─────────────────────────────────────────────────────────────────────────────
// WORKBENCH-V0.3 SLICE-K: OS Shell Source Pack Fit Panel
//
// Contract:
//   • Spawn the existing pack-validator-runner.mjs Node.js tool as a child process.
//   • Return raw pipe-delimited stdout for the frontend to parse.
//   • 409 guard: concurrent runs are rejected immediately (RunningNow = true).
//   • Read-only. No drain execution. No canonical mutation.
//
// IProcessRunner and ProcessRunOutcome live in IDoctorRunnerService.cs (Slice J).
// They are shared — do not duplicate them here.
//
// v0.3 bridge implementation — future hardening may port runner to a C# service.
// Per docs/sync/workbench/SLICE_K_OS_SHELL_SOURCE_PACK_FIT_CONTRACT.md.
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Result returned by <see cref="IPackValidatorRunnerService.RunAsync"/>.
/// </summary>
public sealed class PackValidatorRunResult
{
    /// <summary>0 = completed · 2 = error (psql not found or query error)</summary>
    /// <remarks>
    /// Exit code 0 does NOT mean PASS. PASS/WARN/FAIL is determined by parsing stdout.
    /// </remarks>
    public int ExitCode { get; init; }

    /// <summary>Raw pipe-delimited output from harris-pacs-pack-validator.sql.</summary>
    public string Stdout { get; init; } = string.Empty;

    /// <summary>Raw stderr (psql error messages appear here; normally empty).</summary>
    public string Stderr { get; init; } = string.Empty;

    /// <summary>Wall-clock milliseconds for the run.</summary>
    public int DurationMs { get; init; }

    /// <summary>UTC timestamp when the run started.</summary>
    public System.DateTime Timestamp { get; init; }

    /// <summary>
    /// True when the request was rejected because a run is already in progress.
    /// Controller maps this to HTTP 409.
    /// </summary>
    public bool RunningNow { get; init; }
}

/// <summary>
/// WORKBENCH-V0.3 SLICE-K: spawns the existing pack-validator-runner.mjs and
/// returns its raw pipe-delimited output. Concurrent run protection via 409 guard.
/// </summary>
public interface IPackValidatorRunnerService
{
    /// <summary>True while a run is in progress.</summary>
    bool IsRunning { get; }

    /// <summary>
    /// Runs the pack validator and returns the raw output.
    /// Returns immediately with <see cref="PackValidatorRunResult.RunningNow"/> = true
    /// if a run is already in progress.
    /// </summary>
    Task<PackValidatorRunResult> RunAsync(CancellationToken cancellationToken = default);
}
