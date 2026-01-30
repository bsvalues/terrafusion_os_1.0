// =============================================================================
// SpecLock Cosign Verifier (GOD-TIER)
// =============================================================================
// Cryptographic signature verification using Cosign.
// GOD-TIER: Quorum verification with multiple authorities.
// - Verifies manifest.json against multiple authority bundles.
// - Enforces quorum (N-of-M signatures required).
// - Enforces federated constraint (required authorities must sign).
// - Fail-closed when enabled.
// =============================================================================

using System.Diagnostics;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Interface for SpecLock signature verification.
/// </summary>
public interface ISpecLockSignatureVerifier
{
    /// <summary>
    /// Verifies the SpecLock manifest signature(s).
    /// GOD-TIER: Verifies quorum of multiple authority signatures.
    /// Throws if verification fails and is enabled.
    /// </summary>
    Task VerifyAsync(CancellationToken ct);

    /// <summary>
    /// Returns true if signature verification is enabled.
    /// </summary>
    bool IsEnabled { get; }

    /// <summary>
    /// Returns true if quorum verification mode is enabled.
    /// </summary>
    bool IsQuorumMode { get; }
}

/// <summary>
/// GOD-TIER: Quorum-based signature verification.
/// Verifies artifacts/speclock/manifest.json against multiple authority bundles
/// using the speclock-verify-manifest-quorum.sh script.
///
/// Environment:
/// - TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED=true (enable verification)
/// - TF_SPECLOCK_QUORUM_MODE=true (enable multi-authority quorum)
/// - TF_SPECLOCK_MANIFEST_PATH=artifacts/speclock/manifest.json
/// - TF_SPECLOCK_AUTHORITIES_PATH=docs/spec-lock/AUTHORITIES.json
/// - TF_SPECLOCK_BUNDLES_PATH=artifacts/speclock/bundles
/// - TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH (legacy single-key mode)
/// </summary>
public sealed class SpecLockCosignVerifier : ISpecLockSignatureVerifier
{
    private readonly ILogger<SpecLockCosignVerifier> _log;
    private readonly IFileProvider _files;
    private readonly IConfiguration _cfg;
    private readonly IHostEnvironment _env;

    public SpecLockCosignVerifier(
        ILogger<SpecLockCosignVerifier> log,
        IFileProvider files,
        IConfiguration cfg,
        IHostEnvironment env)
    {
        _log = log;
        _files = files;
        _cfg = cfg;
        _env = env;
    }

    public bool IsEnabled => string.Equals(
        _cfg["TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED"], "true", StringComparison.OrdinalIgnoreCase);

    public bool IsQuorumMode => string.Equals(
        _cfg["TF_SPECLOCK_QUORUM_MODE"], "true", StringComparison.OrdinalIgnoreCase);

    public async Task VerifyAsync(CancellationToken ct)
    {
        if (!IsEnabled)
        {
            _log.LogInformation("SpecLock signature verification disabled (TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED != true).");
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            return;
        }

        if (IsQuorumMode)
        {
            await VerifyQuorumAsync(ct);
        }
        else
        {
            await VerifySingleKeyAsync(ct);
        }
    }

    /// <summary>
    /// GOD-TIER: Quorum verification using speclock-verify-manifest-quorum.sh
    /// </summary>
    private async Task VerifyQuorumAsync(CancellationToken ct)
    {
        var manifestPath = _cfg["TF_SPECLOCK_MANIFEST_PATH"] ?? "artifacts/speclock/manifest.json";
        var authoritiesPath = _cfg["TF_SPECLOCK_AUTHORITIES_PATH"] ?? "docs/spec-lock/AUTHORITIES.json";
        var bundlesPath = _cfg["TF_SPECLOCK_BUNDLES_PATH"] ?? "artifacts/speclock/bundles";

        _log.LogInformation("🜂 Verifying SpecLock manifest (GOD-TIER QUORUM MODE)...");

        var scriptPath = Path.Combine(_env.ContentRootPath, "scripts", "speclock-verify-manifest-quorum.sh");

        // Fall back to bash script execution
        var psi = new ProcessStartInfo
        {
            FileName = "bash",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = _env.ContentRootPath
        };

        psi.ArgumentList.Add(scriptPath);
        psi.ArgumentList.Add(manifestPath);
        psi.ArgumentList.Add(authoritiesPath);
        psi.ArgumentList.Add(bundlesPath);

        using var process = Process.Start(psi);
        if (process == null)
        {
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new InvalidOperationException("Failed to start quorum verification process.");
        }

        var stdout = await process.StandardOutput.ReadToEndAsync(ct);
        var stderr = await process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);

        // Log output for debugging
        if (!string.IsNullOrWhiteSpace(stdout))
            _log.LogDebug("Quorum verification stdout: {Output}", stdout);

        switch (process.ExitCode)
        {
            case 0:
                _log.LogInformation("✅ SpecLock quorum verification passed (GOD-TIER).");
                SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(1);
                break;
            case 2:
                _log.LogError("❌ SpecLock quorum not met: {Error}", stderr);
                SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
                throw new InvalidOperationException("SpecLock quorum not met. Required signatures missing.");
            case 3:
                _log.LogError("❌ SpecLock time window violation: {Error}", stderr);
                SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
                throw new InvalidOperationException("SpecLock manifest outside validity window (nbf/exp).");
            case 4:
                _log.LogError("❌ SpecLock required authority missing: {Error}", stderr);
                SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
                throw new InvalidOperationException("SpecLock required authority signature missing (federated constraint).");
            default:
                _log.LogError("❌ SpecLock quorum verification failed: {Error}", stderr);
                SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
                throw new InvalidOperationException($"SpecLock quorum verification failed (exit code {process.ExitCode}).");
        }
    }

    /// <summary>
    /// Legacy single-key verification (MYTHIC tier)
    /// </summary>
    private async Task VerifySingleKeyAsync(CancellationToken ct)
    {
        var manifestPath = _cfg["TF_SPECLOCK_MANIFEST_PATH"] ?? "artifacts/speclock/manifest.json";
        var bundlePath = _cfg["TF_SPECLOCK_COSIGN_BUNDLE_PATH"] ?? "artifacts/speclock/manifest.bundle.json";
        var pubKeyPath = _cfg["TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH"];

        if (string.IsNullOrWhiteSpace(pubKeyPath))
        {
            _log.LogError("TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH is required when signature verification is enabled.");
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new InvalidOperationException(
                "TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH is required when signature verification is enabled.");
        }

        var manifestFile = _files.GetFileInfo(manifestPath);
        var bundleFile = _files.GetFileInfo(bundlePath);
        var pubKeyFile = _files.GetFileInfo(pubKeyPath);

        if (!manifestFile.Exists)
        {
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new FileNotFoundException($"SpecLock manifest missing: {manifestPath}");
        }

        if (!bundleFile.Exists)
        {
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new FileNotFoundException($"SpecLock bundle missing: {bundlePath}");
        }

        if (!pubKeyFile.Exists)
        {
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new FileNotFoundException($"SpecLock public key missing: {pubKeyPath}");
        }

        var cosignPath = _cfg["TF_COSIGN_PATH"] ?? "cosign";

        _log.LogInformation("🜂 Verifying SpecLock manifest signature (MYTHIC TIER)...");

        var psi = new ProcessStartInfo
        {
            FileName = cosignPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        psi.ArgumentList.Add("verify-blob");
        psi.ArgumentList.Add("--key");
        psi.ArgumentList.Add(pubKeyFile.PhysicalPath!);
        psi.ArgumentList.Add("--bundle");
        psi.ArgumentList.Add(bundleFile.PhysicalPath!);
        psi.ArgumentList.Add(manifestFile.PhysicalPath!);

        using var process = Process.Start(psi);
        if (process == null)
        {
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new InvalidOperationException($"Failed to start cosign process: {cosignPath}");
        }

        var stdout = await process.StandardOutput.ReadToEndAsync(ct);
        var stderr = await process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);

        if (process.ExitCode != 0)
        {
            _log.LogError("Cosign verification failed: {Error}", stderr);
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            throw new InvalidOperationException(
                $"SpecLock manifest signature verification failed (cosign verify-blob).\n{stderr}");
        }

        _log.LogInformation("✅ SpecLock signature verified (cosign).");
        SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(1);

        _ = stdout;
    }
}
