// =============================================================================
// SpecLock Guard Hosted Service (GOD-TIER)
// =============================================================================
// Runtime invariant enforcement at startup.
// - Verifies signature quorum (GOD-TIER multi-authority)
// - Verifies time window (nbf/exp)
// - Verifies generated artifacts match manifest sha256 values.
// - Fail-closed: throws on mismatch (startup abort) when guard enabled.
// =============================================================================

using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// GOD-TIER runtime invariant:
/// - Verifies signature quorum BEFORE trusting manifest.
/// - Verifies manifest is within time window (nbf/exp).
/// - Verifies that generated artifacts on disk match the SpecLock manifest sha256 values.
/// - Fail-closed by throwing on mismatch (startup abort).
/// </summary>
public sealed class SpecLockGuardHostedService : IHostedService
{
    private readonly ILogger<SpecLockGuardHostedService> _log;
    private readonly ISpecLockManifestLoader _loader;
    private readonly ISpecLockSignatureVerifier _signatureVerifier;
    private readonly IFileProvider _files;
    private readonly IConfiguration _cfg;

    /// <summary>
    /// Static verification state - checked by readiness probes and metrics.
    /// </summary>
    public static volatile bool Verified = false;

    /// <summary>
    /// Failure reason for diagnostics (empty if verified).
    /// </summary>
    public static volatile string FailureReason = "";

    public SpecLockGuardHostedService(
        ILogger<SpecLockGuardHostedService> log,
        ISpecLockManifestLoader loader,
        ISpecLockSignatureVerifier signatureVerifier,
        IFileProvider files,
        IConfiguration cfg)
    {
        _log = log;
        _loader = loader;
        _signatureVerifier = signatureVerifier;
        _files = files;
        _cfg = cfg;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // Default: OFF in dev unless explicitly enabled.
        // Enable with: TF_SPECLOCK_GUARD_ENABLED=true
        var enabled = string.Equals(_cfg["TF_SPECLOCK_GUARD_ENABLED"], "true", StringComparison.OrdinalIgnoreCase);
        if (!enabled)
        {
            Verified = true; // Allow bypass when guard disabled
            _log.LogInformation("SpecLock guard disabled (TF_SPECLOCK_GUARD_ENABLED != true).");
            SpecLockMetrics.Update();
            return;
        }

        _log.LogInformation("SpecLock guard ENABLED - validating runtime invariants (GOD-TIER)...");

        // GOD-TIER: Verify signature quorum BEFORE trusting manifest contents.
        await _signatureVerifier.VerifyAsync(cancellationToken);

        SpecLockManifest manifest;
        try
        {
            var (m, _) = await _loader.LoadAsync(cancellationToken);
            manifest = m;
        }
        catch (FileNotFoundException ex)
        {
            _log.LogError(ex, "SpecLock manifest not found. Run: python scripts/speclock-manifest.py");
            throw;
        }

        // GOD-TIER: Verify time window (nbf/exp)
        var timeEnforcement = string.Equals(_cfg["TF_SPECLOCK_TIME_ENFORCEMENT"], "true", StringComparison.OrdinalIgnoreCase);
        if (timeEnforcement)
        {
            VerifyTimeWindow(manifest);
        }

        var failOnMissing = !string.Equals(
            _cfg["TF_SPECLOCK_GUARD_ALLOW_MISSING"], "true", StringComparison.OrdinalIgnoreCase);

        var errors = new List<string>();

        foreach (var l in manifest.Locks)
        {
            foreach (var ga in l.GeneratedArtifacts)
            {
                // If manifest has no hash, treat as error unless allow-missing mode is enabled.
                if (string.IsNullOrWhiteSpace(ga.Sha256))
                {
                    var msg = $"Lock '{l.Id}' artifact '{ga.Path}' has null sha256 in manifest.";
                    if (failOnMissing)
                        errors.Add(msg);
                    else
                        _log.LogWarning("{Warning}", msg);
                    continue;
                }

                var fi = _files.GetFileInfo(ga.Path);
                if (!fi.Exists)
                {
                    var msg = $"Lock '{l.Id}' artifact missing on disk: {ga.Path}";
                    if (failOnMissing)
                        errors.Add(msg);
                    else
                        _log.LogWarning("{Warning}", msg);
                    continue;
                }

                await using var s = fi.CreateReadStream();
                var actual = SpecLockManifestLoader.Sha256Hex(s);
                if (!string.Equals(actual, ga.Sha256, StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add($"Lock '{l.Id}' artifact sha mismatch: {ga.Path} expected={ga.Sha256} actual={actual}");
                }
            }
        }

        if (errors.Count > 0)
        {
            FailureReason = string.Join("; ", errors.Take(3));
            _log.LogError("SpecLock guard FAILED with {Count} error(s).", errors.Count);
            foreach (var e in errors)
                _log.LogError("SpecLockGuard: {Error}", e);

            SpecLockMetrics.Update();
            throw new InvalidOperationException(
                "SpecLock runtime invariant violated. Regenerate artifacts + manifest:\n" +
                "  python scripts/speclock-generate-all.py\n" +
                "  python scripts/speclock-manifest.py\n" +
                "Then redeploy.\n" +
                string.Join("\n", errors));
        }

        Verified = true;
        FailureReason = "";
        _log.LogInformation("SpecLock guard PASSED (GOD-TIER). (locks={LockCount})", manifest.LockCount);
        SpecLockMetrics.Update();
    }

    /// <summary>
    /// GOD-TIER: Verify manifest is within time window.
    /// </summary>
    private void VerifyTimeWindow(SpecLockManifest manifest)
    {
        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(manifest.NotBefore))
        {
            if (DateTime.TryParse(manifest.NotBefore, out var nbf) && now < nbf)
            {
                throw new InvalidOperationException(
                    $"SpecLock manifest not yet valid. NBF={manifest.NotBefore}, Now={now:O}");
            }
        }

        if (!string.IsNullOrWhiteSpace(manifest.ExpiresAt))
        {
            if (DateTime.TryParse(manifest.ExpiresAt, out var exp) && now > exp)
            {
                throw new InvalidOperationException(
                    $"SpecLock manifest expired. EXP={manifest.ExpiresAt}, Now={now:O}");
            }
        }

        _log.LogInformation("SpecLock time window verified. NBF={NBF}, EXP={EXP}",
            manifest.NotBefore ?? "(none)", manifest.ExpiresAt ?? "(none)");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
