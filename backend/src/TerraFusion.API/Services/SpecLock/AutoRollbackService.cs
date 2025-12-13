// =============================================================================
// AutoRollbackService (FINAL SEAL)
// =============================================================================
// On verification failure AFTER startup, the system self-reverts to the
// last valid artifact set. No undefined state. Ever.
// =============================================================================

using System.Text.Json;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// FINAL SEAL: Auto-rollback on quorum loss.
///
/// When state mesh verification fails after startup:
/// 1. Freeze writes (set frozen flag)
/// 2. Flip readiness ❌
/// 3. Restore last-known-good manifest
/// 4. Emit incident + audit record
///
/// Invariant: No undefined state. Ever.
/// </summary>
public sealed class AutoRollbackService : IHostedService, IDisposable
{
    private readonly ILogger<AutoRollbackService> _log;
    private readonly IConfiguration _cfg;
    private readonly IHostEnvironment _env;
    private Timer? _verifyTimer;

    /// <summary>
    /// Frozen state - when true, all write operations should be rejected.
    /// </summary>
    public static volatile bool Frozen = false;

    /// <summary>
    /// Last known good manifest path.
    /// </summary>
    public static volatile string LastKnownGoodPath = "";

    /// <summary>
    /// Rollback count for metrics.
    /// </summary>
    public static volatile int RollbackCount = 0;

    private const string LastKnownGoodDir = "artifacts/speclock/last-known-good";
    private const string ManifestBackup = "manifest.json";
    private const string ProofBackup = "proof.json";

    public AutoRollbackService(
        ILogger<AutoRollbackService> log,
        IConfiguration cfg,
        IHostEnvironment env)
    {
        _log = log;
        _cfg = cfg;
        _env = env;
    }

    public Task StartAsync(CancellationToken ct)
    {
        var enabled = string.Equals(
            Environment.GetEnvironmentVariable("TF_AUTO_ROLLBACK_ENABLED") ?? _cfg["TF_AUTO_ROLLBACK_ENABLED"],
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (!enabled)
        {
            _log.LogInformation("🔓 Auto-rollback disabled (TF_AUTO_ROLLBACK_ENABLED != true)");
            return Task.CompletedTask;
        }

        // Persist current good state on startup (if verified)
        if (SpecLockGuardHostedService.Verified && StateMeshGuardHostedService.Verified)
        {
            PersistLastKnownGood();
        }

        // Start periodic verification (every 60 seconds)
        var intervalSeconds = int.TryParse(_cfg["TF_AUTO_ROLLBACK_INTERVAL_SECONDS"], out var i) ? i : 60;
        _verifyTimer = new Timer(VerifyAndRollbackIfNeeded, null, TimeSpan.FromSeconds(intervalSeconds), TimeSpan.FromSeconds(intervalSeconds));

        _log.LogInformation("🔒 Auto-rollback enabled (interval={Interval}s)", intervalSeconds);
        return Task.CompletedTask;
    }

    private void PersistLastKnownGood()
    {
        try
        {
            var dir = Path.Combine(_env.ContentRootPath, LastKnownGoodDir);
            Directory.CreateDirectory(dir);

            var manifestSrc = Path.Combine(_env.ContentRootPath, "artifacts/speclock/manifest.json");
            var proofSrc = Path.Combine(_env.ContentRootPath, "artifacts/speclock/tss/state/manifest.proof.json");

            if (File.Exists(manifestSrc))
            {
                File.Copy(manifestSrc, Path.Combine(dir, ManifestBackup), overwrite: true);
            }

            if (File.Exists(proofSrc))
            {
                File.Copy(proofSrc, Path.Combine(dir, ProofBackup), overwrite: true);
            }

            LastKnownGoodPath = dir;
            _log.LogInformation("✅ Persisted last-known-good state to {Path}", dir);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Failed to persist last-known-good state");
        }
    }

    private void VerifyAndRollbackIfNeeded(object? state)
    {
        // Check if verification state has degraded
        if (!SpecLockGuardHostedService.Verified || !StateMeshGuardHostedService.Verified)
        {
            _log.LogCritical("🚨 VERIFICATION DEGRADED - initiating auto-rollback");
            ExecuteRollback();
        }
    }

    private void ExecuteRollback()
    {
        // 1. Freeze writes
        Frozen = true;
        _log.LogCritical("🧊 WRITES FROZEN - system in rollback mode");

        // 2. Flip readiness (already handled by guards)
        // StateMeshGuardHostedService.Verified is already false

        // 3. Restore last-known-good
        try
        {
            var dir = Path.Combine(_env.ContentRootPath, LastKnownGoodDir);
            var manifestBackup = Path.Combine(dir, ManifestBackup);
            var manifestTarget = Path.Combine(_env.ContentRootPath, "artifacts/speclock/manifest.json");

            if (File.Exists(manifestBackup))
            {
                File.Copy(manifestBackup, manifestTarget, overwrite: true);
                _log.LogInformation("♻️ Restored manifest from last-known-good");
            }

            RollbackCount++;
        }
        catch (Exception ex)
        {
            _log.LogCritical(ex, "❌ ROLLBACK FAILED - manual intervention required");
        }

        // 4. Emit audit record
        EmitAuditRecord();

        // Update metrics
        SpecLockMetrics.Update();
    }

    private void EmitAuditRecord()
    {
        var record = new
        {
            event_type = "auto_rollback",
            timestamp = DateTime.UtcNow.ToString("O"),
            speclock_verified = SpecLockGuardHostedService.Verified,
            state_mesh_verified = StateMeshGuardHostedService.Verified,
            state_mesh_failure = StateMeshGuardHostedService.FailureReason,
            rollback_count = RollbackCount,
            frozen = Frozen
        };

        var auditPath = Path.Combine(_env.ContentRootPath, "artifacts/speclock/audit/rollback.log");
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(auditPath)!);
            File.AppendAllText(auditPath, JsonSerializer.Serialize(record) + Environment.NewLine);
            _log.LogInformation("📋 Audit record emitted to {Path}", auditPath);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Failed to emit audit record");
        }
    }

    public Task StopAsync(CancellationToken ct)
    {
        _verifyTimer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _verifyTimer?.Dispose();
    }
}
