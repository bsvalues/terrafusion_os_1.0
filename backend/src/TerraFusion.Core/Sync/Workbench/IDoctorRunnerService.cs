using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Workbench;

// ─────────────────────────────────────────────────────────────────────────────
// WORKBENCH-V0.3 SLICE-J: OS Shell Doctor Panel
//
// Contract:
//   • Spawn the existing tf-sync-doctor.mjs Node.js tool as a child process.
//   • Return raw stdout + stderr + exit-code for the frontend to parse.
//   • 409 guard: concurrent runs are rejected immediately (RunningNow = true).
//   • Read-only. No drain execution. No canonical mutation.
//
// v0.3 bridge implementation — future hardening may port runner to a C# service.
// Per docs/sync/workbench/SLICE_J_OS_SHELL_DOCTOR_PANEL_CONTRACT.md.
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Result returned by <see cref="IDoctorRunnerService.RunAsync"/>.
/// </summary>
public sealed class DoctorRunResult
{
    /// <summary>0 = PASS/WARN · 1 = FAIL · 2 = error or already-running</summary>
    public int ExitCode { get; init; }

    /// <summary>Raw stdout from tf-sync-doctor.mjs. Parsed by the frontend.</summary>
    public string Stdout { get; init; } = string.Empty;

    /// <summary>Raw stderr (normally empty; non-empty = unexpected).</summary>
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
/// Abstraction over system process spawning for the doctor runner.
/// Implemented by <c>SystemProcessRunner</c> in production; replaced by
/// a fake in tests.
/// </summary>
public interface IProcessRunner
{
    Task<ProcessRunOutcome> RunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        string workingDirectory,
        IReadOnlyDictionary<string, string> environmentVars,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Output from a single spawned process.
/// </summary>
public sealed class ProcessRunOutcome
{
    public int ExitCode { get; init; }
    public string Stdout { get; init; } = string.Empty;
    public string Stderr { get; init; } = string.Empty;
    public int DurationMs { get; init; }
}

/// <summary>
/// WORKBENCH-V0.3 SLICE-J: spawns the existing tf-sync-doctor.mjs and
/// returns its raw output. Concurrent run protection via 409 guard.
/// </summary>
public interface IDoctorRunnerService
{
    /// <summary>True while a run is in progress.</summary>
    bool IsRunning { get; }

    /// <summary>
    /// Runs the doctor and returns the raw output.
    /// Returns immediately with <see cref="DoctorRunResult.RunningNow"/> = true
    /// if a run is already in progress.
    /// </summary>
    Task<DoctorRunResult> RunAsync(CancellationToken cancellationToken = default);
}
