using System.Diagnostics;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs.Pilot;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Services;

/// <summary>
/// Read-only git CLI adapter.
/// Runs bounded, non-destructive git commands at explain time to populate
/// live repo context — branch diff and changed file list.
///
/// All commands have a hard timeout (GitTimeoutMs) and output is truncated
/// to MaxDiffChars to stay within the LLM context budget.
///
/// Design rules (Phase 1 — observability only):
///   - Read-only: only git diff / git diff --name-only
///   - No branch switching, no git add, no git commit
///   - Failures are silent: returns null FileDiff, not exceptions
///   - WorkDir is resolved from TERRAFUSION_REPO_ROOT env var or
///     the assembly location, walking up until .git is found
/// </summary>
public sealed class GitContextService : IGitContextService
{
    private const int GitTimeoutMs = 8_000;
    private const int MaxDiffChars = 4_000;
    private const string BaseBranch = "main";

    private readonly ILogger<GitContextService> _logger;
    private readonly string? _repoRoot;

    public GitContextService(ILogger<GitContextService> logger)
    {
        _logger = logger;
        _repoRoot = ResolveRepoRoot();
    }

    /// <inheritdoc/>
    public async Task<GitContext> GetContextAsync(
        string branch,
        string? filePath,
        CancellationToken ct = default)
    {
        if (_repoRoot is null)
        {
            _logger.LogDebug("GitContextService: no repo root found — returning empty context");
            return new GitContext(branch, null, [], false);
        }

        // Run both commands concurrently — they are independent reads.
        var diffTask = filePath is not null
            ? RunGitAsync($"diff {BaseBranch}..{branch} -- \"{filePath}\"", ct)
            : Task.FromResult<string?>(null);

        var changedTask = RunGitAsync($"diff --name-only {BaseBranch}..{branch}", ct);

        await Task.WhenAll(diffTask, changedTask);

        var rawDiff = await diffTask;
        var rawChanged = await changedTask;

        var fileDiff = rawDiff is { Length: > 0 }
            ? TruncateDiff(rawDiff)
            : null;

        var changedFiles = rawChanged is { Length: > 0 }
            ? rawChanged.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : [];

        return new GitContext(
            Branch: branch,
            FileDiff: fileDiff,
            ChangedFiles: changedFiles,
            HasChanges: fileDiff is not null || changedFiles.Length > 0);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<string?> RunGitAsync(string arguments, CancellationToken ct)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(GitTimeoutMs);

            var psi = new ProcessStartInfo("git", arguments)
            {
                WorkingDirectory = _repoRoot,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            process.Start();

            var stdout = await process.StandardOutput.ReadToEndAsync(cts.Token);
            await process.WaitForExitAsync(cts.Token);

            if (process.ExitCode != 0)
            {
                var stderr = await process.StandardError.ReadToEndAsync(cts.Token);
                _logger.LogDebug("git {Args} exited {Code}: {Err}", arguments, process.ExitCode, stderr.Trim());
                return null;
            }

            return stdout.Length > 0 ? stdout : null;
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("git {Args} timed out after {Ms}ms", arguments, GitTimeoutMs);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "git {Args} failed", arguments);
            return null;
        }
    }

    /// <summary>
    /// Truncates the diff to MaxDiffChars, keeping whole lines and appending
    /// a summary of how many lines were dropped.
    /// </summary>
    private static string TruncateDiff(string diff)
    {
        if (diff.Length <= MaxDiffChars) return diff;

        var truncated = diff[..MaxDiffChars];
        var lastNewline = truncated.LastIndexOf('\n');
        if (lastNewline > 0) truncated = truncated[..lastNewline];

        var totalLines = diff.Count(c => c == '\n');
        var keptLines = truncated.Count(c => c == '\n');
        return truncated + $"\n... [diff truncated — {totalLines - keptLines} more lines]";
    }

    /// <summary>
    /// Walks up from the assembly location looking for a .git directory.
    /// Also checks TERRAFUSION_REPO_ROOT environment variable first.
    /// </summary>
    private static string? ResolveRepoRoot()
    {
        // Allow override for testing or Docker deployments
        var envRoot = Environment.GetEnvironmentVariable("TERRAFUSION_REPO_ROOT");
        if (!string.IsNullOrWhiteSpace(envRoot) && Directory.Exists(Path.Combine(envRoot, ".git")))
            return envRoot;

        // Walk up from the running assembly
        var dir = Path.GetDirectoryName(typeof(GitContextService).Assembly.Location);
        while (dir is not null)
        {
            if (Directory.Exists(Path.Combine(dir, ".git")))
                return dir;
            dir = Path.GetDirectoryName(dir);
        }

        return null;
    }
}
