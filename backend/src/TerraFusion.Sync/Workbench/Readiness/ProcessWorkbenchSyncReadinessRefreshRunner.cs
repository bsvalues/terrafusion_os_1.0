using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Abstractions.Interfaces.Workbench;

namespace TerraFusion.Sync.Workbench.Readiness;

/// <summary>
/// Slice OPS-1-A-2: subprocess-based implementation of
/// <see cref="IWorkbenchSyncReadinessRefreshRunner"/>. Invokes the
/// SyncAtlas CLI tool via <c>dotnet run --project &lt;project&gt;</c>
/// for each of the three diagnostic modes that produce evidence
/// artifacts (catalog health, dictionary loader preflight, sales
/// qualification coverage). The connection probe — question 1 — is
/// owned by <see cref="TerraFusion.Abstractions.Interfaces.Workbench.IPacsReachabilityProbeService"/> and is NOT
/// invoked here.
///
/// <para>Configuration:</para>
/// <list type="bullet">
/// <item><c>Workbench:SyncReadiness:DotnetExecutable</c> — path to
/// the dotnet binary; defaults to "dotnet".</item>
/// <item><c>Workbench:SyncReadiness:SyncAtlasProject</c> — relative
/// path to the SyncAtlas csproj; defaults to
/// "backend/tools/SyncAtlas".</item>
/// <item><c>Workbench:SyncReadiness:WorkingDirectory</c> — working
/// directory for the subprocess; defaults to current.</item>
/// <item><c>Workbench:SyncReadiness:DbConnectionString</c> — the
/// TerraFusion DB connection string passed via SyncAtlas
/// <c>--db</c>.</item>
/// </list>
///
/// <para>Timeouts: catalog health 600s; preflight 60s; coverage
/// 300s. Hard caps. Cancellation kills the subprocess.</para>
/// </summary>
public sealed class ProcessWorkbenchSyncReadinessRefreshRunner
    : IWorkbenchSyncReadinessRefreshRunner
{
    private const int CatalogHealthTimeoutSeconds = 600;
    private const int PreflightTimeoutSeconds = 60;
    private const int CoverageTimeoutSeconds = 300;
    private const int MaxStderrSummaryLength = 500;

    private readonly string _dotnetExecutable;
    private readonly string _syncAtlasProject;
    private readonly string _workingDirectory;
    private readonly string _dbConnectionString;

    public ProcessWorkbenchSyncReadinessRefreshRunner(
        string dotnetExecutable,
        string syncAtlasProject,
        string workingDirectory,
        string dbConnectionString)
    {
        if (string.IsNullOrWhiteSpace(dotnetExecutable))
            throw new ArgumentException("dotnet executable required.", nameof(dotnetExecutable));
        if (string.IsNullOrWhiteSpace(syncAtlasProject))
            throw new ArgumentException("SyncAtlas project path required.", nameof(syncAtlasProject));
        if (string.IsNullOrWhiteSpace(workingDirectory))
            throw new ArgumentException("Working directory required.", nameof(workingDirectory));
        if (string.IsNullOrWhiteSpace(dbConnectionString))
            throw new ArgumentException("Db connection string required.", nameof(dbConnectionString));

        _dotnetExecutable = dotnetExecutable;
        _syncAtlasProject = syncAtlasProject;
        _workingDirectory = workingDirectory;
        _dbConnectionString = dbConnectionString;
    }

    public async Task<WorkbenchSyncReadinessRefreshResult> RunAsync(
        Guid countyId,
        Guid sourceConnectionId,
        Guid workbookId,
        string sessionArtifactDir,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(sessionArtifactDir))
            throw new ArgumentException("Session artifact directory required.", nameof(sessionArtifactDir));

        Directory.CreateDirectory(sessionArtifactDir);

        var startedAt = DateTime.UtcNow;
        var surfaces = new Dictionary<string, WorkbenchSyncReadinessRefreshSurfaceResult>();

        // Catalog health.
        var catalogPath = Path.Combine(sessionArtifactDir, "invariant-report.json");
        surfaces["catalog-health"] = await InvokeAsync(
            surface: "catalog-health",
            timeoutSeconds: CatalogHealthTimeoutSeconds,
            args: BuildCatalogHealthArgs(countyId, sourceConnectionId, catalogPath),
            ct: ct).ConfigureAwait(false);

        // Preflight evidence (default to property_use, the C49-FK-E
        // migrated configKey that always passes preflight under
        // current Benton conditions).
        var preflightPath = Path.Combine(sessionArtifactDir, "preflight-evidence.json");
        surfaces["preflight-evidence"] = await InvokeAsync(
            surface: "preflight-evidence",
            timeoutSeconds: PreflightTimeoutSeconds,
            args: BuildPreflightArgs(countyId, sourceConnectionId, workbookId, preflightPath),
            ct: ct).ConfigureAwait(false);

        // Coverage smoke. Bounded scan default is 200 rows.
        var coveragePath = Path.Combine(sessionArtifactDir, "coverage-report.json");
        surfaces["coverage-report"] = await InvokeAsync(
            surface: "coverage-report",
            timeoutSeconds: CoverageTimeoutSeconds,
            args: BuildCoverageArgs(countyId, sourceConnectionId, workbookId, coveragePath),
            ct: ct).ConfigureAwait(false);

        return new WorkbenchSyncReadinessRefreshResult(
            SessionArtifactDir: sessionArtifactDir,
            StartedAtUtc: startedAt,
            CompletedAtUtc: DateTime.UtcNow,
            Surfaces: surfaces);
    }

    private string[] BuildCatalogHealthArgs(Guid countyId, Guid connId, string artifactPath) =>
        new[]
        {
            "run", "--project", _syncAtlasProject, "--no-build", "--",
            "--db", _dbConnectionString,
            "--county-id", countyId.ToString(),
            "--connection-id", connId.ToString(),
            "--schema-catalog-health",
            "--invariant-artifact-path", artifactPath,
        };

    private string[] BuildPreflightArgs(Guid countyId, Guid connId, Guid wbId, string artifactPath) =>
        new[]
        {
            "run", "--project", _syncAtlasProject, "--no-build", "--",
            "--db", _dbConnectionString,
            "--county-id", countyId.ToString(),
            "--connection-id", connId.ToString(),
            "--load-pacs-dictionary",
            "--workbook-id", wbId.ToString(),
            "--table", "property_use",
            "--preflight-evidence-path", artifactPath,
        };

    private string[] BuildCoverageArgs(Guid countyId, Guid connId, Guid wbId, string artifactPath) =>
        new[]
        {
            "run", "--project", _syncAtlasProject, "--no-build", "--",
            "--db", _dbConnectionString,
            "--county-id", countyId.ToString(),
            "--connection-id", connId.ToString(),
            "--qualify-sales-coverage",
            "--workbook-id", wbId.ToString(),
            "--max-sales", "200",
            "--coverage-evidence-path", artifactPath,
        };

    private async Task<WorkbenchSyncReadinessRefreshSurfaceResult> InvokeAsync(
        string surface,
        int timeoutSeconds,
        string[] args,
        CancellationToken ct)
    {
        var psi = new ProcessStartInfo
        {
            FileName = _dotnetExecutable,
            WorkingDirectory = _workingDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };
        foreach (var a in args) psi.ArgumentList.Add(a);

        // Subprocess inherits parent env (so SYNCATLAS_SECRET_* values
        // propagate). We do NOT add or echo any secret here.

        using var proc = new Process { StartInfo = psi, EnableRaisingEvents = true };
        try
        {
            proc.Start();
        }
        catch (Exception)
        {
            return new WorkbenchSyncReadinessRefreshSurfaceResult(
                Surface: surface,
                Succeeded: false,
                ExitCode: null,
                StderrSummary: "Subprocess failed to start.",
                CompletedAtUtc: DateTime.UtcNow);
        }

        // Drain stdout/stderr asynchronously.
        var stderrTask = proc.StandardError.ReadToEndAsync();
        _ = proc.StandardOutput.ReadToEndAsync();

        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        try
        {
            await proc.WaitForExitAsync(linkedCts.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            try { proc.Kill(entireProcessTree: true); } catch { /* ignore */ }
            return new WorkbenchSyncReadinessRefreshSurfaceResult(
                Surface: surface,
                Succeeded: false,
                ExitCode: null,
                StderrSummary: timeoutCts.IsCancellationRequested ? "Timed out." : "Cancelled.",
                CompletedAtUtc: DateTime.UtcNow);
        }

        var stderr = await stderrTask.ConfigureAwait(false);
        var sanitized = SanitizeStderr(stderr);

        return new WorkbenchSyncReadinessRefreshSurfaceResult(
            Surface: surface,
            Succeeded: proc.ExitCode == 0,
            ExitCode: proc.ExitCode,
            StderrSummary: string.IsNullOrWhiteSpace(sanitized) ? null : sanitized,
            CompletedAtUtc: DateTime.UtcNow);
    }

    /// <summary>
    /// Truncate stderr to a bounded length; defensive scrub for
    /// connection-string / password fragments. The SyncAtlas CLI
    /// itself does not echo secrets, but we treat its stderr as
    /// untrusted on the API side.
    /// </summary>
    public static string SanitizeStderr(string stderr)
    {
        if (string.IsNullOrWhiteSpace(stderr)) return string.Empty;
        var trimmed = stderr.Length > MaxStderrSummaryLength
            ? stderr[..MaxStderrSummaryLength] + " …(truncated)"
            : stderr;
        // Defensive: redact any "Password=…;" fragment.
        return RedactPattern(trimmed, "Password=", ';');
    }

    private static string RedactPattern(string text, string prefix, char terminator)
    {
        var idx = text.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
        while (idx >= 0)
        {
            var end = text.IndexOf(terminator, idx + prefix.Length);
            if (end < 0) end = text.Length;
            text = text[..idx] + prefix + "[REDACTED]" + text[end..];
            idx = text.IndexOf(prefix, idx + prefix.Length + "[REDACTED]".Length, StringComparison.OrdinalIgnoreCase);
        }
        return text;
    }
}
