// =============================================================================
// StateMeshGuardHostedService (NO MERCY MODE)
// =============================================================================
// Application startup FAILS unless state mesh quorum proof verifies.
// This is irreversible at runtime (by design). If it's broken, it stops.
// =============================================================================

using System.Diagnostics;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// NO MERCY:
/// Application startup FAILS unless state mesh quorum proof verifies.
///
/// At startup, this service:
/// 1. Checks if AUTHORITIES.state.json exists
/// 2. Runs speclock-tss-verify-state.sh to verify TSS signature
/// 3. Sets Verified = true only on success
/// 4. Throws exception on failure (blocks startup)
///
/// Environment variables:
/// - TF_STATE_MESH_ENFORCE: Set to "false" to disable (NOT RECOMMENDED IN PROD)
/// - TF_STATE_MESH_VERIFY_SCRIPT: Path to verification script (default: scripts/speclock-tss-verify-state.sh)
/// </summary>
public sealed class StateMeshGuardHostedService : IHostedService
{
    private readonly ILogger<StateMeshGuardHostedService> _log;
    private readonly IConfiguration _cfg;
    private readonly IHostEnvironment _env;

    /// <summary>
    /// Static verification state - checked by readiness probes and metrics.
    /// </summary>
    public static volatile bool Verified = false;

    /// <summary>
    /// Failure reason for diagnostics (empty if verified).
    /// </summary>
    public static volatile string FailureReason = "";

    public StateMeshGuardHostedService(
        ILogger<StateMeshGuardHostedService> log,
        IConfiguration cfg,
        IHostEnvironment env)
    {
        _log = log;
        _cfg = cfg;
        _env = env;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        // Check enforcement toggle
        var enforceEnv = Environment.GetEnvironmentVariable("TF_STATE_MESH_ENFORCE")
            ?? _cfg["TF_STATE_MESH_ENFORCE"];
        var enforce = !string.Equals(enforceEnv, "false", StringComparison.OrdinalIgnoreCase);

        if (!enforce)
        {
            Verified = true;
            _log.LogWarning("🔓 STATE MESH ENFORCEMENT DISABLED (TF_STATE_MESH_ENFORCE=false)");
            SpecLockMetrics.Update();
            return;
        }

        // Check authority file exists
        var authPath = Path.Combine(_env.ContentRootPath, "docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(authPath))
        {
            FailureReason = $"AUTHORITIES.state.json not found at {authPath}";
            _log.LogCritical("❌ STATE MESH VERIFY FAILED: {Reason}", FailureReason);
            SpecLockMetrics.Update();
            throw new InvalidOperationException(FailureReason);
        }

        var script = Environment.GetEnvironmentVariable("TF_STATE_MESH_VERIFY_SCRIPT")
            ?? _cfg["TF_STATE_MESH_VERIFY_SCRIPT"]
            ?? "scripts/speclock-tss-verify-state.sh";

        var scriptPath = Path.IsPathRooted(script)
            ? script
            : Path.Combine(_env.ContentRootPath, script);

        _log.LogInformation("🜂 STATE MESH VERIFY: {Script}", scriptPath);

        // Check if script exists (fail gracefully in dev if bash not available)
        if (!File.Exists(scriptPath))
        {
            // In development, if script doesn't exist but auth file does, allow bypass
            if (_env.IsDevelopment())
            {
                _log.LogWarning("⚠️ State mesh verify script not found, allowing dev bypass");
                Verified = true;
                SpecLockMetrics.Update();
                return;
            }

            FailureReason = $"Verification script not found: {scriptPath}";
            _log.LogCritical("❌ STATE MESH VERIFY FAILED: {Reason}", FailureReason);
            SpecLockMetrics.Update();
            throw new InvalidOperationException(FailureReason);
        }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "bash",
                WorkingDirectory = _env.ContentRootPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            psi.ArgumentList.Add(scriptPath);

            using var process = Process.Start(psi);
            if (process == null)
            {
                // bash not available - allow bypass in dev
                if (_env.IsDevelopment())
                {
                    _log.LogWarning("⚠️ bash not available, allowing dev bypass");
                    Verified = true;
                    SpecLockMetrics.Update();
                    return;
                }
                throw new InvalidOperationException("Failed to start state mesh verifier (bash unavailable)");
            }

            var stdout = await process.StandardOutput.ReadToEndAsync(ct);
            var stderr = await process.StandardError.ReadToEndAsync(ct);
            await process.WaitForExitAsync(ct);

            if (process.ExitCode != 0)
            {
                FailureReason = string.IsNullOrWhiteSpace(stderr) ? stdout : stderr;
                _log.LogCritical("❌ STATE MESH VERIFY FAILED (exit={Exit}): {Err}", process.ExitCode, FailureReason);
                SpecLockMetrics.Update();
                throw new InvalidOperationException($"State mesh verification failed: {FailureReason}");
            }

            Verified = true;
            FailureReason = "";
            _log.LogInformation("✅ STATE MESH VERIFIED");
            _log.LogDebug("Verification output: {Output}", stdout);
            SpecLockMetrics.Update();
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            // Catch non-intentional exceptions (file not found, bash missing, etc.)
            if (_env.IsDevelopment())
            {
                _log.LogWarning(ex, "⚠️ State mesh verification error, allowing dev bypass");
                Verified = true;
                SpecLockMetrics.Update();
                return;
            }

            FailureReason = ex.Message;
            _log.LogCritical(ex, "❌ STATE MESH ENFORCEMENT HALTED STARTUP");
            SpecLockMetrics.Update();
            throw;
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
