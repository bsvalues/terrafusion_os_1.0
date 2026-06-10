using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.API.Services.Workbench;

// WORKBENCH-V0.3 SLICE-J: v0.3 bridge implementation.
// Spawns the existing tools/sync/tf-sync-doctor.mjs Node.js tool and returns
// raw stdout + stderr for the frontend to parse. No C# doctor logic.

/// <summary>
/// Singleton service that runs the OS doctor tool as a child process.
/// The 409 guard (concurrent run prevention) uses <see cref="Interlocked"/>
/// compare-exchange on <c>_running</c>.
/// </summary>
public sealed class DoctorRunnerService : IDoctorRunnerService
{
    private readonly IProcessRunner _runner;
    private readonly IConfiguration _config;
    private readonly string _repoRoot;

    private int _running; // 0 = idle, 1 = running

    public bool IsRunning => Volatile.Read(ref _running) == 1;

    // ── Production constructor — resolved by DI ──────────────────────────────
    public DoctorRunnerService(
        IProcessRunner runner,
        IConfiguration config,
        IWebHostEnvironment env)
        : this(runner, config, ResolveRepoRoot(env))
    {
    }

    // ── Testability constructor — injected by unit tests ─────────────────────
    // Public so TerraFusion.API.Tests can use it directly without InternalsVisibleTo.
    public DoctorRunnerService(
        IProcessRunner runner,
        IConfiguration config,
        string repoRoot)
    {
        _runner = runner;
        _config = config;
        _repoRoot = repoRoot;
    }

    public async Task<DoctorRunResult> RunAsync(CancellationToken cancellationToken = default)
    {
        // 409 guard — only one concurrent run allowed.
        if (Interlocked.CompareExchange(ref _running, 1, 0) != 0)
        {
            return new DoctorRunResult
            {
                ExitCode = 2,
                Stdout = string.Empty,
                Stderr = string.Empty,
                DurationMs = 0,
                Timestamp = DateTime.UtcNow,
                RunningNow = true,
            };
        }

        var timestamp = DateTime.UtcNow;
        try
        {
            var envVars = BuildPgEnvVars();
            var outcome = await _runner.RunAsync(
                fileName: "node",
                arguments: ["tools/sync/tf-sync-doctor.mjs"],
                workingDirectory: _repoRoot,
                environmentVars: envVars,
                cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            return new DoctorRunResult
            {
                ExitCode = outcome.ExitCode,
                Stdout = outcome.Stdout,
                Stderr = outcome.Stderr,
                DurationMs = outcome.DurationMs,
                Timestamp = timestamp,
                RunningNow = false,
            };
        }
        finally
        {
            Volatile.Write(ref _running, 0);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private IReadOnlyDictionary<string, string> BuildPgEnvVars()
    {
        // Forward PostgreSQL connection env vars from configuration so
        // tf-sync-doctor.mjs connects to the same database as the API.
        // If values are absent the doctor falls back to its own defaults
        // (127.0.0.1:5432 / terrafusion / postgres / devpassword123).
        var vars = new Dictionary<string, string>(StringComparer.Ordinal);

        SetIfPresent(vars, "PG_HOST", "Postgres:Host");
        SetIfPresent(vars, "PG_PORT", "Postgres:Port");
        SetIfPresent(vars, "PG_DB", "Postgres:Database");
        SetIfPresent(vars, "PG_USER", "Postgres:User");
        SetIfPresent(vars, "PGPASSWORD", "Postgres:Password");

        return vars;
    }

    private void SetIfPresent(Dictionary<string, string> vars, string envKey, string configKey)
    {
        var value = _config[configKey];
        if (!string.IsNullOrEmpty(value))
            vars[envKey] = value;
    }

    private static string ResolveRepoRoot(IWebHostEnvironment env)
    {
        // TerraFusion.API runs from backend/src/TerraFusion.API.
        // Repo root is three levels up (backend/src/TerraFusion.API → backend/src → backend → repo root).
        return Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", ".."));
    }
}
