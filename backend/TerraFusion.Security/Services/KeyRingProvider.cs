using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TerraFusion.Security.Services;

/// <summary>
/// Manages a ring of encryption keys, keyed by purpose.
/// Encrypt always uses the newest active key; decrypt can use any known key.
/// Keys are configured separately from JWT signing material.
/// </summary>
public interface IKeyRingProvider
{
    /// <summary>Current (newest active) key entry for encryption.</summary>
    KeyEntry ActiveKey { get; }

    /// <summary>Resolve a key by its ID (for decryption of older ciphertext).</summary>
    KeyEntry? GetKey(string keyId);

    /// <summary>All configured key IDs, ordered newest-first.</summary>
    IReadOnlyList<string> KeyIds { get; }
}

public sealed class KeyRingProvider : IKeyRingProvider
{
    private readonly Dictionary<string, KeyEntry> _ring;
    private readonly KeyEntry _activeKey;
    private readonly IReadOnlyList<string> _keyIds;

    public KeyRingProvider(IConfiguration configuration, ILogger<KeyRingProvider> logger)
    {
        _ring = new Dictionary<string, KeyEntry>(StringComparer.OrdinalIgnoreCase);

        // Load key ring from Security:Encryption:Keys[]
        var keysSection = configuration.GetSection("Security:Encryption:Keys");
        var entries = keysSection.GetChildren().ToList();

        if (entries.Count > 0)
        {
            foreach (var entry in entries)
            {
                var keyId = entry["KeyId"];
                var material = entry["Material"];
                var activeFlag = entry["Active"];

                if (string.IsNullOrEmpty(keyId) || string.IsNullOrEmpty(material))
                    continue;

                // Reject duplicate KeyIds
                if (_ring.ContainsKey(keyId))
                    throw new InvalidOperationException($"Duplicate encryption key ID: '{keyId}'. Each KeyId must be unique.");

                // Validate material length (>= 16 bytes when decoded, or >= 16 chars raw)
                var materialBytes = System.Text.Encoding.UTF8.GetBytes(material);
                if (materialBytes.Length < 16)
                    throw new InvalidOperationException($"Encryption key '{keyId}' material is too short ({materialBytes.Length} bytes). Minimum 16 bytes required.");

                var derived = DeriveKey(material, keyId);
                _ring[keyId] = new KeyEntry(keyId, derived, string.Equals(activeFlag, "true", StringComparison.OrdinalIgnoreCase));
            }

            // Enforce exactly one Active key
            var activeCount = _ring.Values.Count(k => k.IsActive);
            if (activeCount == 0)
                throw new InvalidOperationException("No active encryption key configured. Exactly one key must have Active=true.");
            if (activeCount > 1)
                throw new InvalidOperationException($"Multiple active encryption keys configured ({activeCount}). Exactly one key must have Active=true.");
        }

        // Fallback: derive from dedicated EncryptionKey (separate from JWT)
        if (_ring.Count == 0)
        {
            var dedicatedKey = configuration["Security:EncryptionKey"];
            if (!string.IsNullOrEmpty(dedicatedKey))
            {
                var derived = DeriveKey(dedicatedKey, "default");
                _ring["default"] = new KeyEntry("default", derived, true);
            }
        }

        // Last-resort dev fallback (never in production — config-schema-gate will reject)
        if (_ring.Count == 0)
        {
            logger.LogWarning("No encryption keys configured — using dev-only fallback. Set Security:Encryption:Keys or Security:EncryptionKey.");
            var derived = DeriveKey("TerraFusion-Dev-Only-Key-NOT-FOR-PRODUCTION", "dev-fallback");
            _ring["dev-fallback"] = new KeyEntry("dev-fallback", derived, true);
        }

        // Active key = first explicitly active, or the last loaded
        _activeKey = _ring.Values.FirstOrDefault(k => k.IsActive) ?? _ring.Values.Last();

        // Key IDs ordered: active first, then alphabetical
        _keyIds = _ring.Keys
            .OrderByDescending(k => _ring[k].IsActive)
            .ThenBy(k => k, StringComparer.Ordinal)
            .ToList()
            .AsReadOnly();

        logger.LogInformation("Key ring loaded: {Count} key(s), active={ActiveKeyId}", _ring.Count, _activeKey.KeyId);
    }

    public KeyEntry ActiveKey => _activeKey;
    public KeyEntry? GetKey(string keyId) => _ring.GetValueOrDefault(keyId);
    public IReadOnlyList<string> KeyIds => _keyIds;

    /// <summary>
    /// Derive a 256-bit encryption subkey via HKDF-SHA256.
    /// Input is already high-entropy (base64 or passphrase from secret store),
    /// so HKDF is the correct primitive (not PBKDF2 which is for passwords).
    /// </summary>
    private static byte[] DeriveKey(string material, string keyId)
    {
        var ikm = System.Text.Encoding.UTF8.GetBytes(material);
        var info = System.Text.Encoding.UTF8.GetBytes($"TerraFusion.Security.EncryptionKey/v1/{keyId}");
        // HKDF with no salt (RFC 5869 §2.2: salt defaults to HashLen zeros)
        return HKDF.DeriveKey(HashAlgorithmName.SHA256, ikm, outputLength: 32, salt: null, info: info);
    }
}

/// <summary>
/// A single entry in the encryption key ring.
/// </summary>
public sealed record KeyEntry(string KeyId, byte[] DerivedKey, bool IsActive);
