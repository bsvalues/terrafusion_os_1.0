// =============================================================================
// PublicReceiptProofService.cs (PHASE A: PROOF)
// =============================================================================
// File-backed proof store for deterministic receipt verification.
// Receipts stored at: artifacts/receipts/{receiptId}.receipt.json
// Response: { receipt, speclock_proof, verified }
// =============================================================================

using System.Text.Json;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Service interface for building public receipt proofs.
/// </summary>
public interface IPublicReceiptProofService
{
    Task<PublicProofResult> BuildProofAsync(string receiptId, CancellationToken ct);
}

/// <summary>
/// Result type for public proof operations.
/// </summary>
public abstract record PublicProofResult
{
    public static readonly PublicProofResult NotFound = new NotFoundResult();
    private sealed record NotFoundResult : PublicProofResult;
    public sealed record InvalidReceipt(string Details) : PublicProofResult;
    public sealed record Ok(object Payload) : PublicProofResult;
}

/// <summary>
/// File-backed proof store (deterministic):
/// - Receipts are stored as JSON at artifacts/receipts/{receiptId}.receipt.json
/// - Response includes receipt + /ops/speclock/proof snapshot + verified boolean
/// </summary>
public sealed class PublicReceiptProofService : IPublicReceiptProofService
{
    private readonly IFileProvider _files;
    private readonly ILogger<PublicReceiptProofService> _log;
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _cfg;

    public PublicReceiptProofService(
        IFileProvider files,
        ILogger<PublicReceiptProofService> log,
        IHttpClientFactory http,
        IConfiguration cfg)
    {
        _files = files;
        _log = log;
        _http = http;
        _cfg = cfg;
    }

    public async Task<PublicProofResult> BuildProofAsync(string receiptId, CancellationToken ct)
    {
        // Sanitize receiptId to prevent path traversal
        if (string.IsNullOrWhiteSpace(receiptId) ||
            receiptId.Contains("..") ||
            receiptId.Contains('/') ||
            receiptId.Contains('\\'))
        {
            return new PublicProofResult.InvalidReceipt("Invalid receipt ID format.");
        }

        var path = $"artifacts/receipts/{receiptId}.receipt.json";
        var fi = _files.GetFileInfo(path);
        if (!fi.Exists) return PublicProofResult.NotFound;

        JsonDocument receiptDoc;
        try
        {
            using var s = fi.CreateReadStream();
            receiptDoc = await JsonDocument.ParseAsync(s, cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Failed to parse receipt json: {Path}", path);
            return new PublicProofResult.InvalidReceipt("Receipt JSON is invalid.");
        }

        // Minimal invariant checks (full schema enforcement lives in tests + offline verifier)
        // - required keys exist
        // - UTC window shape and nbf <= exp
        if (!TryGetString(receiptDoc.RootElement, "nbf", out var nbf) ||
            !TryGetString(receiptDoc.RootElement, "exp", out var exp) ||
            !TryGetString(receiptDoc.RootElement, "receipt_id", out var rid))
        {
            return new PublicProofResult.InvalidReceipt("Missing required fields: receipt_id, nbf, exp.");
        }

        if (!DateTimeOffset.TryParse(nbf, out var nbfDt) ||
            !DateTimeOffset.TryParse(exp, out var expDt))
        {
            return new PublicProofResult.InvalidReceipt("nbf/exp must be RFC3339 timestamps.");
        }
        if (nbfDt > expDt)
        {
            return new PublicProofResult.InvalidReceipt("Invalid window: nbf > exp.");
        }
        if (!string.Equals(rid, receiptId, StringComparison.Ordinal))
        {
            return new PublicProofResult.InvalidReceipt("receipt_id mismatch.");
        }

        // Verified == within window AND sha256 fields are lowercase hex (lightweight)
        var now = DateTimeOffset.UtcNow;
        var verified = now >= nbfDt && now <= expDt && ShaFieldsLookLowercaseHex(receiptDoc.RootElement);

        // Snapshot ops proof deterministically by calling local endpoint (can be disabled)
        object? speclockProof = null;
        try
        {
            var allow = !string.Equals(_cfg["TF_PUBLIC_PROOF_DISABLE_OPS_SNAPSHOT"], "true", StringComparison.OrdinalIgnoreCase);
            if (allow)
            {
                var client = _http.CreateClient("LocalOps");
                // local relative call (hosted under same app); if unavailable, still return receipt
                var resp = await client.GetAsync("/ops/speclock/proof", ct);
                if (resp.IsSuccessStatusCode)
                {
                    var json = await resp.Content.ReadAsStringAsync(ct);
                    speclockProof = JsonSerializer.Deserialize<object>(json);
                }
            }
        }
        catch (Exception ex)
        {
            _log.LogDebug(ex, "ops proof snapshot unavailable");
        }

        var payload = new
        {
            receipt = JsonSerializer.Deserialize<object>(receiptDoc.RootElement.GetRawText()),
            verified,
            speclock_proof = speclockProof
        };

        return new PublicProofResult.Ok(payload);
    }

    private static bool TryGetString(JsonElement root, string key, out string value)
    {
        value = "";
        if (!root.TryGetProperty(key, out var p)) return false;
        if (p.ValueKind != JsonValueKind.String) return false;
        value = p.GetString() ?? "";
        return value.Length > 0;
    }

    private static bool ShaFieldsLookLowercaseHex(JsonElement root)
    {
        static bool Looks(string s)
        {
            if (s.Length == 0) return false;
            for (int i = 0; i < s.Length; i++)
            {
                var c = s[i];
                var isHex = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f');
                if (!isHex) return false;
            }
            return true;
        }

        // Receipt allows multiple sha fields; we only enforce lowercase hex if present
        foreach (var name in new[] { "speclock_manifest_sha256", "policy_bundle_sha256" })
        {
            if (root.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String)
            {
                if (!Looks(p.GetString() ?? "")) return false;
            }
        }
        if (root.TryGetProperty("artifact", out var art) && art.ValueKind == JsonValueKind.Object)
        {
            if (art.TryGetProperty("sha256", out var p) && p.ValueKind == JsonValueKind.String)
            {
                if (!Looks(p.GetString() ?? "")) return false;
            }
        }
        if (root.TryGetProperty("signing", out var sign) && sign.ValueKind == JsonValueKind.Object)
        {
            if (sign.TryGetProperty("signature_sha256", out var p) && p.ValueKind == JsonValueKind.String)
            {
                if (!Looks(p.GetString() ?? "")) return false;
            }
        }
        return true;
    }
}
