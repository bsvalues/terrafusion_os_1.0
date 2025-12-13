// =============================================================================
// SpecLock Health Check (MACHINE MODE)
// =============================================================================
// Runtime health check for SpecLock invariants.
// - Healthy: no errors
// - Degraded: errors present AND guard disabled
// - Unhealthy: errors present AND guard enabled
// =============================================================================

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// HealthCheck that validates generated artifacts against the SpecLock manifest.
/// - Healthy: no errors
/// - Degraded: errors present AND guard disabled
/// - Unhealthy: errors present AND guard enabled
/// </summary>
public sealed class SpecLockHealthCheck : IHealthCheck
{
    private readonly ISpecLockManifestLoader _loader;
    private readonly IFileProvider _files;
    private readonly IConfiguration _cfg;

    public SpecLockHealthCheck(
        ISpecLockManifestLoader loader,
        IFileProvider files,
        IConfiguration cfg)
    {
        _loader = loader;
        _files = files;
        _cfg = cfg;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var guardEnabled = string.Equals(
            _cfg["TF_SPECLOCK_GUARD_ENABLED"], "true", StringComparison.OrdinalIgnoreCase);
        var allowMissing = string.Equals(
            _cfg["TF_SPECLOCK_GUARD_ALLOW_MISSING"], "true", StringComparison.OrdinalIgnoreCase);

        try
        {
            var (manifest, _) = await _loader.LoadAsync(cancellationToken);
            var errors = new List<string>();

            foreach (var l in manifest.Locks)
            {
                foreach (var ga in l.GeneratedArtifacts)
                {
                    if (string.IsNullOrWhiteSpace(ga.Sha256))
                    {
                        if (!allowMissing)
                            errors.Add($"{l.Id}: missing sha256 for {ga.Path}");
                        continue;
                    }

                    var fi = _files.GetFileInfo(ga.Path);
                    if (!fi.Exists)
                    {
                        if (!allowMissing)
                            errors.Add($"{l.Id}: missing file {ga.Path}");
                        continue;
                    }

                    await using var s = fi.CreateReadStream();
                    var actual = SpecLockManifestLoader.Sha256Hex(s);
                    if (!string.Equals(actual, ga.Sha256, StringComparison.OrdinalIgnoreCase))
                        errors.Add($"{l.Id}: sha mismatch {ga.Path}");
                }
            }

            if (errors.Count == 0)
            {
                return HealthCheckResult.Healthy("SpecLock invariant satisfied.", new Dictionary<string, object?>
                {
                    ["lockCount"] = manifest.LockCount,
                    ["generatedAt"] = manifest.GeneratedAt
                });
            }

            var data = new Dictionary<string, object?>
            {
                ["lockCount"] = manifest.LockCount,
                ["errorCount"] = errors.Count,
                ["errorsSample"] = errors.Take(5).ToArray()
            };

            if (guardEnabled)
                return HealthCheckResult.Unhealthy("SpecLock invariant violated (guard enabled).", data: data);

            return HealthCheckResult.Degraded("SpecLock invariant violated (guard disabled).", data: data);
        }
        catch (FileNotFoundException)
        {
            // Manifest missing - depends on guard state
            var data = new Dictionary<string, object?>
            {
                ["error"] = "manifest.json not found"
            };

            if (guardEnabled)
                return HealthCheckResult.Unhealthy("SpecLock manifest missing (guard enabled).", data: data);

            return HealthCheckResult.Degraded("SpecLock manifest missing (guard disabled).", data: data);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("SpecLock health check failed.", ex);
        }
    }
}
