// =============================================================================
// StateMeshGuardHostedService (NO MERCY MODE)
// =============================================================================
// Application startup FAILS unless state mesh quorum proof verifies.
// This is irreversible at runtime (by design). If it's broken, it stops.
// =============================================================================

using System.Diagnostics;
using System.Text.Json;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// NO MERCY:
/// Application startup FAILS unless state mesh quorum proof verifies.
///
/// At startup, this service:
/// 1. Checks if AUTHORITIES.state.json exists
/// 2. Natively verifies strict schema compliance (NO JQ/BASH)
/// 3. Sets Verified = true only on success
/// 4. Throws exception on failure (blocks startup)
///
/// Environment variables:
/// - TF_STATE_MESH_ENFORCE: Set to "false" to disable (NOT RECOMMENDED IN PROD)
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
        // Check enforcement toggle (defaults to TRUE)
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

        _log.LogInformation("🜂 STATE MESH VERIFY: {Path}", authPath);

        try
        {
            // Native Parsing - Zero allocations context-aware
            var json = await File.ReadAllTextAsync(authPath, ct);
            
            // Delegate logic to verified utility
            TerraFusion.API.Utilities.StateMeshGuard.ValidateAuthorityState(json);

            Verified = true;
            FailureReason = "";
            _log.LogInformation("✅ STATE MESH VERIFIED (Native Mode)");
            SpecLockMetrics.Update();
        }
        catch (Exception ex)
        {
            // Fail closed - no mercy
            FailureReason = ex.Message;
            _log.LogCritical(ex, "❌ STATE MESH ENFORCEMENT HALTED STARTUP");
            SpecLockMetrics.Update();
            throw new InvalidOperationException($"State mesh verification failed: {FailureReason}", ex);
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

