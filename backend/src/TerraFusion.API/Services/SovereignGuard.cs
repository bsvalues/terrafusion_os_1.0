using System.Security.Cryptography;
using System.Text;

namespace TerraFusion.API.Services;

/// <summary>
/// SovereignGuard — Verifies the sovereign.yaml manifest at startup.
/// Tampered manifest blocks initialization.
/// </summary>
public class SovereignGuard
{
    private readonly string _manifestPath;
    private readonly ILogger<SovereignGuard> _logger;

    public SovereignGuard(ILogger<SovereignGuard> logger, string? manifestPath = null)
    {
        _logger = logger;
        _manifestPath = manifestPath ?? Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "sovereign.yaml");
    }

    /// <summary>
    /// Verify the sovereign manifest exists and is not empty.
    /// Returns the SHA256 hash of the manifest for audit logging.
    /// </summary>
    public SovereignVerification Verify()
    {
        if (!File.Exists(_manifestPath))
        {
            _logger.LogCritical("SOVEREIGN VIOLATION: sovereign.yaml not found at {Path}", _manifestPath);
            return new SovereignVerification(false, null, "Manifest not found");
        }

        var content = File.ReadAllText(_manifestPath);
        if (string.IsNullOrWhiteSpace(content))
        {
            _logger.LogCritical("SOVEREIGN VIOLATION: sovereign.yaml is empty");
            return new SovereignVerification(false, null, "Manifest is empty");
        }

        var hash = ComputeHash(content);

        // Verify required laws are present
        if (!content.Contains("hitl:") || !content.Contains("county_isolation:") || !content.Contains("truthgate:"))
        {
            _logger.LogCritical("SOVEREIGN VIOLATION: sovereign.yaml missing required law sections");
            return new SovereignVerification(false, hash, "Missing required law sections");
        }

        if (!content.Contains("ai_pilot_mutations_require_approval: true"))
        {
            _logger.LogCritical("SOVEREIGN VIOLATION: HITL approval requirement disabled or missing");
            return new SovereignVerification(false, hash, "HITL approval not enabled");
        }

        _logger.LogInformation("Sovereign manifest verified. Hash: {Hash}", hash);
        return new SovereignVerification(true, hash, null);
    }

    private static string ComputeHash(string content)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

/// <summary>
/// Result of sovereign manifest verification.
/// </summary>
public record SovereignVerification(bool IsValid, string? ManifestHash, string? Violation);
