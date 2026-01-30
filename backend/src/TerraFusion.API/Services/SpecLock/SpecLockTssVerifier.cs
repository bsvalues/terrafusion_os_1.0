// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock COSMIC TIER - TSS Verifier
// ═══════════════════════════════════════════════════════════════════════════════
//
// Verifies FROST-Ed25519 threshold signatures at runtime.
// Calls the speclock-tss CLI tool for actual cryptographic verification.
//
// ONE signature, ONE group public key, k-of-n cooperation required.
// ═══════════════════════════════════════════════════════════════════════════════

using System.Diagnostics;
using System.Text.Json;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// COSMIC verifier - verifies FROST threshold signatures
/// </summary>
public sealed class SpecLockTssVerifier : ISpecLockSignatureVerifier
{
    private readonly ILogger<SpecLockTssVerifier> _log;
    private readonly IConfiguration _cfg;
    private readonly IHostEnvironment _env;

    public SpecLockTssVerifier(
        ILogger<SpecLockTssVerifier> log,
        IConfiguration cfg,
        IHostEnvironment env)
    {
        _log = log;
        _cfg = cfg;
        _env = env;
    }

    public bool IsCosmicMode => true;

    public bool IsEnabled => string.Equals(
        Environment.GetEnvironmentVariable("TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED") ?? _cfg["TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED"],
        "true",
        StringComparison.OrdinalIgnoreCase);

    public bool IsQuorumMode => false; // COSMIC is not quorum mode, it's TSS

    public async Task VerifyAsync(CancellationToken ct)
    {
        var enabled = string.Equals(
            Environment.GetEnvironmentVariable("TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED") ?? _cfg["TF_SPECLOCK_SIGNATURE_VERIFY_ENABLED"],
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (!enabled)
        {
            _log.LogInformation("🜂 COSMIC TSS verification disabled");
            return;
        }

        var authPath = Environment.GetEnvironmentVariable("TF_SPECLOCK_AUTHORITIES_PATH")
            ?? _cfg["TF_SPECLOCK_AUTHORITIES_PATH"]
            ?? "docs/spec-lock/AUTHORITIES.json";

        var manifestPath = Environment.GetEnvironmentVariable("TF_SPECLOCK_MANIFEST_PATH")
            ?? _cfg["TF_SPECLOCK_MANIFEST_PATH"]
            ?? "artifacts/speclock/manifest.json";

        // Read authorities to get paths
        if (!File.Exists(authPath))
        {
            _log.LogWarning("🜂 COSMIC: AUTHORITIES.json not found at {Path}", authPath);
            return;
        }

        var authJson = await File.ReadAllTextAsync(authPath, ct);
        var auth = JsonDocument.Parse(authJson);

        var mode = auth.RootElement.TryGetProperty("mode", out var modeEl)
            ? modeEl.GetString()
            : "mythic";

        if (!string.Equals(mode, "cosmic_tss", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("🜂 COSMIC: Mode is '{Mode}', not cosmic_tss. Skipping TSS verification.", mode);
            return;
        }

        // Get TSS paths from config
        var tss = auth.RootElement.GetProperty("tss");
        var sigPath = tss.GetProperty("signature_path").GetString() ?? "artifacts/speclock/tss/manifest.sig";
        var groupPubPath = tss.GetProperty("group_public_key_path").GetString() ?? "artifacts/speclock/tss/group.pub";
        var thresholdK = tss.GetProperty("threshold_k").GetInt32();
        var participantsN = tss.GetProperty("participants_n").GetInt32();

        _log.LogInformation("🜂 COSMIC TSS Verification: {K}-of-{N} threshold", thresholdK, participantsN);

        // Check files exist
        if (!File.Exists(sigPath))
        {
            var msg = $"COSMIC signature not found: {sigPath}";
            _log.LogError("❌ {Message}", msg);

            var required = string.Equals(
                Environment.GetEnvironmentVariable("TF_SPECLOCK_COSMIC_REQUIRED"),
                "true",
                StringComparison.OrdinalIgnoreCase);

            if (required)
                throw new InvalidOperationException(msg);

            _log.LogWarning("⚠️  TF_SPECLOCK_COSMIC_REQUIRED not set, continuing without signature");
            return;
        }

        if (!File.Exists(groupPubPath))
        {
            throw new InvalidOperationException($"Group public key not found: {groupPubPath}");
        }

        if (!File.Exists(manifestPath))
        {
            throw new InvalidOperationException($"Manifest not found: {manifestPath}");
        }

        // Use the TSS tool to verify
        var tssBin = FindTssBinary();
        if (string.IsNullOrEmpty(tssBin))
        {
            _log.LogWarning("⚠️  speclock-tss binary not found, falling back to hash verification only");
            await VerifyHashesOnlyAsync(manifestPath, ct);
            return;
        }

        var psi = new ProcessStartInfo
        {
            FileName = tssBin,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = _env.ContentRootPath
        };

        psi.ArgumentList.Add("verify");
        psi.ArgumentList.Add("--message");
        psi.ArgumentList.Add(manifestPath);
        psi.ArgumentList.Add("--signature");
        psi.ArgumentList.Add(sigPath);
        psi.ArgumentList.Add("--group-pub");
        psi.ArgumentList.Add(groupPubPath);

        using var process = Process.Start(psi);
        if (process == null)
            throw new InvalidOperationException("Failed to start speclock-tss verify");

        var stdout = await process.StandardOutput.ReadToEndAsync(ct);
        var stderr = await process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);

        if (process.ExitCode != 0)
        {
            _log.LogError("❌ COSMIC TSS verification failed: {Error}", stderr);
            throw new InvalidOperationException($"COSMIC signature verification failed: {stderr}");
        }

        _log.LogInformation("✅ COSMIC TSS signature VERIFIED ({K}-of-{N})", thresholdK, participantsN);
    }

    private string? FindTssBinary()
    {
        var candidates = new[]
        {
            "target/release/speclock-tss",
            "target/debug/speclock-tss",
            "tools/speclock-tss/target/release/speclock-tss",
            "tools/speclock-tss/target/debug/speclock-tss",
            "/usr/local/bin/speclock-tss",
            "speclock-tss"
        };

        // On Windows, add .exe
        if (OperatingSystem.IsWindows())
        {
            candidates = candidates.Select(c => c + ".exe").Concat(candidates).ToArray();
        }

        foreach (var candidate in candidates)
        {
            var fullPath = Path.IsPathRooted(candidate)
                ? candidate
                : Path.Combine(_env.ContentRootPath, candidate);

            if (File.Exists(fullPath))
                return fullPath;
        }

        return null;
    }

    private async Task VerifyHashesOnlyAsync(string manifestPath, CancellationToken ct)
    {
        // Fallback: verify file hashes match manifest (no signature)
        var manifestJson = await File.ReadAllTextAsync(manifestPath, ct);
        var manifest = JsonDocument.Parse(manifestJson);

        if (!manifest.RootElement.TryGetProperty("files", out var files))
        {
            _log.LogWarning("⚠️  No files in manifest to verify");
            return;
        }

        var violations = new List<string>();
        foreach (var file in files.EnumerateObject())
        {
            var filePath = file.Name;
            var expectedHash = file.Value.GetProperty("sha256").GetString();

            if (!File.Exists(filePath))
            {
                violations.Add($"Missing: {filePath}");
                continue;
            }

            using var sha256 = System.Security.Cryptography.SHA256.Create();
            await using var stream = File.OpenRead(filePath);
            var hashBytes = await sha256.ComputeHashAsync(stream, ct);
            var actualHash = Convert.ToHexString(hashBytes).ToLowerInvariant();

            if (!string.Equals(actualHash, expectedHash, StringComparison.OrdinalIgnoreCase))
            {
                violations.Add($"Hash mismatch: {filePath}");
            }
        }

        if (violations.Count > 0)
        {
            throw new InvalidOperationException(
                $"Manifest hash verification failed:\n{string.Join("\n", violations)}");
        }

        _log.LogInformation("✅ Manifest hashes verified (signature check skipped)");
    }
}
