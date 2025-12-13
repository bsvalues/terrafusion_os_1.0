// =============================================================================
// SpecLock Guard Hosted Service (MACHINE MODE)
// =============================================================================
// Runtime invariant enforcement at startup.
// - Verifies generated artifacts match manifest sha256 values.
// - Fail-closed: throws on mismatch (startup abort) when guard enabled.
// =============================================================================

using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// MACHINE MODE runtime invariant:
/// - If enabled, verifies that generated artifacts on disk match the SpecLock manifest sha256 values.
/// - Fail-closed by throwing on mismatch (startup abort).
/// </summary>
public sealed class SpecLockGuardHostedService : IHostedService
{
    private readonly ILogger<SpecLockGuardHostedService> _log;
    private readonly ISpecLockManifestLoader _loader;
    private readonly ISpecLockSignatureVerifier _signatureVerifier;
    private readonly IFileProvider _files;
    private readonly IConfiguration _cfg;

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
            _log.LogInformation("SpecLock guard disabled (TF_SPECLOCK_GUARD_ENABLED != true).");
            return;
        }

        _log.LogInformation("SpecLock guard ENABLED - validating runtime invariants...");

        // MYTHIC TIER: Verify signature BEFORE trusting manifest contents.
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
            _log.LogError("SpecLock guard FAILED with {Count} error(s).", errors.Count);
            foreach (var e in errors)
                _log.LogError("SpecLockGuard: {Error}", e);

            throw new InvalidOperationException(
                "SpecLock runtime invariant violated. Regenerate artifacts + manifest:\n" +
                "  python scripts/speclock-generate-all.py\n" +
                "  python scripts/speclock-manifest.py\n" +
                "Then redeploy.\n" +
                string.Join("\n", errors));
        }

        _log.LogInformation("SpecLock guard PASSED. (locks={LockCount})", manifest.LockCount);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
