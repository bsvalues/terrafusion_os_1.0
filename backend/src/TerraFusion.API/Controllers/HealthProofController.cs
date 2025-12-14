// =============================================================================
// HealthProofController - Constitutional Verification Endpoint
// =============================================================================
// Returns deterministic proof of constitutional compliance:
// - speclock_ok: bool - whether SpecLock + StateMesh guards are verified
// - manifest_sha256: string - SHA256 of the manifest file (empty if missing)
// - timestamp_epoch: long - Unix timestamp of response generation
// - receipt_count: int - Number of receipt files in artifacts/receipts/
//
// HTTP 200 = constitutional (speclock_ok=true)
// HTTP 503 = unconstitutional (speclock_ok=false)
// =============================================================================

using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("healthz")]
public sealed class HealthProofController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<HealthProofController> _log;

    public HealthProofController(
        IWebHostEnvironment env,
        ILogger<HealthProofController> log)
    {
        _env = env;
        _log = log;
    }

    /// <summary>
    /// Constitutional proof endpoint.
    /// Returns deterministic payload for external verification.
    /// </summary>
    [HttpGet("proof")]
    [ProducesResponseType(typeof(HealthProofResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(HealthProofResponse), StatusCodes.Status503ServiceUnavailable)]
    public IActionResult GetProof()
    {
        // Constitution: must reflect real state (no guesses)
        var speclockOk = Services.SpecLock.SpecLockGuardHostedService.Verified
                      && Services.SpecLock.StateMeshGuardHostedService.Verified;

        // Manifest hash (best-effort, deterministic): if missing -> empty string (still evidence)
        var manifestPath = Path.Combine(_env.ContentRootPath, "docs/spec-lock/manifest.json");
        var manifestSha = Sha256OfFile(manifestPath);

        // Receipt count (file-backed): artifacts/receipts/*.receipt.json
        var receiptsDir = Path.Combine(_env.ContentRootPath, "artifacts/receipts");
        var receiptCount = CountReceipts(receiptsDir);

        // State proof exists check
        var stateProofPath = Path.Combine(_env.ContentRootPath, "artifacts/speclock/tss/state/proof.json");
        var stateProofExists = System.IO.File.Exists(stateProofPath);

        var epoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var response = new HealthProofResponse
        {
            SpecLockOk = speclockOk,
            ManifestSha256 = manifestSha,
            TimestampEpoch = epoch,
            ReceiptCount = receiptCount,
            StateProofPresent = stateProofExists,
            SpecLockFailureReason = speclockOk ? null : GetFailureReason()
        };

        if (!speclockOk)
        {
            _log.LogWarning("Constitutional proof requested but speclock_ok=false. Reason: {Reason}",
                response.SpecLockFailureReason);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }

        return Ok(response);
    }

    /// <summary>
    /// Readiness endpoint that gates on constitutional verification.
    /// Returns 200 only if speclock_ok=true, otherwise 503.
    /// </summary>
    [HttpGet("ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public IActionResult GetReady()
    {
        var speclockOk = Services.SpecLock.SpecLockGuardHostedService.Verified
                      && Services.SpecLock.StateMeshGuardHostedService.Verified;

        if (!speclockOk)
        {
            var reason = GetFailureReason();
            _log.LogWarning("Readiness check failed: speclock_ok=false. Reason: {Reason}", reason);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                ready = false,
                reason = reason
            });
        }

        return Ok(new
        {
            ready = true,
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        });
    }

    private static string Sha256OfFile(string path)
    {
        if (!System.IO.File.Exists(path))
            return string.Empty;

        try
        {
            using var stream = System.IO.File.OpenRead(path);
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(stream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
        catch
        {
            return string.Empty;
        }
    }

    private static int CountReceipts(string dir)
    {
        if (!Directory.Exists(dir))
            return 0;

        try
        {
            return Directory.EnumerateFiles(dir, "*.receipt.json", SearchOption.TopDirectoryOnly).Count();
        }
        catch
        {
            return 0;
        }
    }

    private static string? GetFailureReason()
    {
        if (!Services.SpecLock.SpecLockGuardHostedService.Verified)
        {
            var reason = Services.SpecLock.SpecLockGuardHostedService.FailureReason;
            return string.IsNullOrEmpty(reason) ? "SpecLock guard not verified" : reason;
        }

        if (!Services.SpecLock.StateMeshGuardHostedService.Verified)
        {
            var reason = Services.SpecLock.StateMeshGuardHostedService.FailureReason;
            return string.IsNullOrEmpty(reason) ? "State mesh guard not verified" : reason;
        }

        return null;
    }
}

/// <summary>
/// Deterministic constitutional proof response.
/// </summary>
public sealed class HealthProofResponse
{
    /// <summary>
    /// True if both SpecLock and StateMesh guards are verified.
    /// </summary>
    public bool SpecLockOk { get; init; }

    /// <summary>
    /// SHA256 of docs/spec-lock/manifest.json (empty if file doesn't exist).
    /// </summary>
    public string ManifestSha256 { get; init; } = string.Empty;

    /// <summary>
    /// Unix timestamp when this response was generated.
    /// </summary>
    public long TimestampEpoch { get; init; }

    /// <summary>
    /// Count of receipt files in artifacts/receipts/*.receipt.json.
    /// </summary>
    public int ReceiptCount { get; init; }

    /// <summary>
    /// Whether artifacts/speclock/tss/state/proof.json exists.
    /// </summary>
    public bool StateProofPresent { get; init; }

    /// <summary>
    /// Failure reason if speclock_ok is false (null otherwise).
    /// </summary>
    public string? SpecLockFailureReason { get; init; }
}
