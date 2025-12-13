// =============================================================================
// SpecLock Cosign Verifier (MYTHIC TIER)
// =============================================================================
// Cryptographic signature verification using Cosign.
// - Verifies manifest.json against manifest.bundle.json using public key.
// - Fail-closed when enabled.
// - Anchors trust in transparency log (Rekor proof in bundle).
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
    /// Verifies the SpecLock manifest signature.
    /// Throws if verification fails and is enabled.
    /// </summary>
    Task VerifyAsync(CancellationToken ct);

    /// <summary>
    /// Returns true if signature verification is enabled.
    /// </summary>
    bool IsEnabled { get; }
}

/// <summary>
/// MYTHIC TIER: Cosign-based signature verification.
/// Verifies artifacts/speclock/manifest.json against artifacts/speclock/manifest.bundle.json
/// using a pinned public key.
///
/// Environment:
/// - TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED=true (enable verification)
/// - TF_SPECLOCK_COSIGN_PUBLIC_KEY_PATH=artifacts/speclock/cosign.pub
/// - TF_SPECLOCK_COSIGN_BUNDLE_PATH=artifacts/speclock/manifest.bundle.json
/// - TF_COSIGN_PATH=/usr/local/bin/cosign (optional, defaults to "cosign")
/// </summary>
public sealed class SpecLockCosignVerifier : ISpecLockSignatureVerifier
{
    private readonly ILogger<SpecLockCosignVerifier> _log;
    private readonly IFileProvider _files;
    private readonly IConfiguration _cfg;

    public SpecLockCosignVerifier(
        ILogger<SpecLockCosignVerifier> log,
        IFileProvider files,
        IConfiguration cfg)
    {
        _log = log;
        _files = files;
        _cfg = cfg;
    }

    public bool IsEnabled => string.Equals(
        _cfg["TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED"], "true", StringComparison.OrdinalIgnoreCase);

    public async Task VerifyAsync(CancellationToken ct)
    {
        if (!IsEnabled)
        {
            _log.LogInformation("SpecLock signature verification disabled (TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED != true).");
            SpecLockMetrics.SpecLockSignatureVerified.WithLabels("terrafusion-api").Set(0);
            return;
        }

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

        // stdout intentionally unused; avoid logging potentially large output
        _ = stdout;
    }
}
