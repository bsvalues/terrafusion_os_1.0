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

        // Resolve a bare filename ("MuseChat.tsx") to its full repo-relative path
        // ("frontend/apps/os-shell/src/pages/MuseChat.tsx") before diffing.
        // Without this, git diff -- "MuseChat.tsx" matches nothing because the
        // working tree path is always repo-root-relative.
        var resolvedPath = filePath is not null
            ? await ResolveFilePathAsync(filePath, ct)
            : null;

        // Run the file diff and the branch-wide changed list concurrently.
        var diffTask = resolvedPath is not null
            ? RunGitAsync($"diff {BaseBranch}..{branch} -- \"{resolvedPath}\"", ct)
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
            HasChanges: fileDiff is not null || changedFiles.Length > 0,
            ResolvedFilePath: resolvedPath);
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
    /// Resolves a filename (bare or relative) to its repo-relative path using
    /// <c>git ls-files --full-name</c>.
    ///
    /// Examples:
    ///   "MuseChat.tsx"  →  "frontend/apps/os-shell/src/pages/MuseChat.tsx"
    ///   "frontend/apps/os-shell/src/pages/MuseChat.tsx"  →  same (already resolved)
    ///   "DoesNotExist.tsx"  →  null (git ls-files returns empty)
    ///
    /// When the glob matches multiple files the first result is used. This is
    /// intentional — the context bus always sends the active editor file and
    /// filenames within a single repo are typically unique enough for this purpose.
    /// </summary>
    private async Task<string?> ResolveFilePathAsync(string filePath, CancellationToken ct)
    {
        // Already a repo-relative path (contains a slash) — use as-is.
        if (filePath.Contains('/') || filePath.Contains('\\'))
            return filePath;

        // Bare filename — ask git for the full path.
        var output = await RunGitAsync($"ls-files --full-name \"**/{filePath}\"", ct);
        if (output is null) return null;

        var first = output.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                          .FirstOrDefault();

        if (first is null)
            _logger.LogDebug("GitContextService: ls-files found no match for {File}", filePath);
        else
            _logger.LogDebug("GitContextService: resolved {File} → {Path}", filePath, first);

        return first;
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
