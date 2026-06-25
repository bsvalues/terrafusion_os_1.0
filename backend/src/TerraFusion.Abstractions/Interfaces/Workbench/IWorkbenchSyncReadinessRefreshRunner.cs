using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces.Workbench;

/// <summary>
/// Slice OPS-1-A-2: refresh-side contract for the Sync Readiness
/// Console. Invokes the four SyncAtlas diagnostic CLI modes against
/// an ephemeral session-scoped artifact directory and reports
/// per-surface success / failure. Production implementation uses a
/// subprocess; tests substitute a fake.
///
/// <para>HG3 read-only at the operational level: the runner shells
/// out to SyncAtlas, which itself never mutates PACS / TerraFusion
/// DB / workbook / canonical state. The only filesystem effect is
/// the artifact write under the supplied ephemeral directory.</para>
///
/// <para>Secrets policy: the production implementation passes the
/// API process's environment variables through to the subprocess.
/// Operators provision <c>SYNCATLAS_SECRET_*</c> env vars for the
/// API process the same way they do for the CLI today; secrets
/// remain in the operator's process environment.</para>
/// </summary>
public interface IWorkbenchSyncReadinessRefreshRunner
{
    /// <summary>
    /// Run the four SyncAtlas diagnostic invocations against the
    /// supplied session-scoped artifact directory. Returns a
    /// per-surface result map.
    /// </summary>
    /// <param name="countyId">Required scope.</param>
    /// <param name="sourceConnectionId">Required scope.</param>
    /// <param name="workbookId">
    /// Required for the preflight + coverage invocations; the
    /// catalog-health invocation ignores it.
    /// </param>
    /// <param name="sessionArtifactDir">
    /// Ephemeral session artifact directory. Implementations write
    /// the four diagnostic JSON artifacts here; do NOT write to the
    /// canonical baseline directories.
    /// </param>
    /// <param name="ct">Cancellation token (terminates subprocesses).</param>
    Task<WorkbenchSyncReadinessRefreshResult> RunAsync(
        Guid countyId,
        Guid sourceConnectionId,
        Guid workbookId,
        string sessionArtifactDir,
        CancellationToken ct);
}

/// <summary>
/// Aggregated refresh result. Per-surface success bool + bounded
/// stderr summary string (sanitized — no secrets, no connection
/// strings).
/// </summary>
public sealed record WorkbenchSyncReadinessRefreshResult(
    string SessionArtifactDir,
    DateTime StartedAtUtc,
    DateTime CompletedAtUtc,
    IReadOnlyDictionary<string, WorkbenchSyncReadinessRefreshSurfaceResult> Surfaces);

/// <summary>One diagnostic surface's invocation result.</summary>
public sealed record WorkbenchSyncReadinessRefreshSurfaceResult(
    string Surface,
    bool Succeeded,
    int? ExitCode,
    string? StderrSummary,
    DateTime CompletedAtUtc);
