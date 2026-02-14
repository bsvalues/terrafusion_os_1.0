using System.Security.Cryptography;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Security.Services;
using Xunit;

namespace TerraFusion.Security.Tests;

/// <summary>
/// PHASE 5.1 ACCEPTANCE TESTS: Key Ring + Rotation
///
/// Verifies:
///  - Encryption key is separate from JWT secret
///  - Key ring supports multiple keys (encrypt with newest, decrypt with any)
///  - Key rotation doesn't break decryption of old ciphertext
///  - Unknown key IDs are rejected
///  - HKDF derivation produces correct key length
///  - Ciphertext format contains KeyId prefix
///  - Config-schema gate: required keys exist
/// </summary>
[Trait("Phase", "5.1")]
[Trait("Category", "KeyRing")]
public sealed class KeyRingAcceptanceTests
{
    // ═══════════════════════════════════════════════════════════════════
    // Helper: build a scoped encryption service from config dict
    // ═══════════════════════════════════════════════════════════════════

    private static (IQuantumResistantEncryptionService svc, IKeyRingProvider ring) BuildService(
        Dictionary<string, string?> configValues)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(config);
        services.AddSingleton<IKeyRingProvider, KeyRingProvider>();
        services.AddSingleton<ISecurityAuditService, SecurityAuditService>();
        services.AddSingleton<IQuantumResistantEncryptionService, QuantumResistantEncryptionService>();

        var provider = services.BuildServiceProvider();
        return (provider.GetRequiredService<IQuantumResistantEncryptionService>(),
                provider.GetRequiredService<IKeyRingProvider>());
    }

    private static Dictionary<string, string?> SingleKeyConfig(string keyId = "k1", string material = "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE=")
    {
        return new Dictionary<string, string?>
        {
            [$"Security:Encryption:Keys:0:KeyId"] = keyId,
            [$"Security:Encryption:Keys:0:Material"] = material,
            [$"Security:Encryption:Keys:0:Active"] = "true",
        };
    }

    private static Dictionary<string, string?> TwoKeyConfig()
    {
        return new Dictionary<string, string?>
        {
            ["Security:Encryption:Keys:0:KeyId"] = "k1-old",
            ["Security:Encryption:Keys:0:Material"] = "b2xkLWtleS1tYXRlcmlhbC0zMi1ieXRlcyEhIQ==",
            ["Security:Encryption:Keys:0:Active"] = "false",
            ["Security:Encryption:Keys:1:KeyId"] = "k2-current",
            ["Security:Encryption:Keys:1:Material"] = "bmV3LWtleS1tYXRlcmlhbC0zMi1ieXRlcyEhIQ==",
            ["Security:Encryption:Keys:1:Active"] = "true",
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Key separation: encryption key != JWT secret
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task KeySeparation_EncryptionDoesNotRequireJwtSecret()
    {
        var (svc, _) = BuildService(SingleKeyConfig());

        var encrypted = await svc.EncryptAsync("sensitive-data");
        var decrypted = await svc.DecryptAsync(encrypted);

        decrypted.Should().Be("sensitive-data",
            "Encryption must work with dedicated key, not JWT secret");
    }

    [Fact]
    public async Task KeySeparation_DifferentJwtSecretDoesNotAffectDecryption()
    {
        var cfg = SingleKeyConfig();
        cfg["Security:Jwt:SecretKey"] = "some-jwt-secret-that-should-be-ignored";

        var (svc, _) = BuildService(cfg);

        var encrypted = await svc.EncryptAsync("government-data");
        var decrypted = await svc.DecryptAsync(encrypted);

        decrypted.Should().Be("government-data");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Key ring: encrypt with active, decrypt with any
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task KeyRing_EncryptUsesActiveKey()
    {
        var (svc, ring) = BuildService(TwoKeyConfig());

        ring.ActiveKey.KeyId.Should().Be("k2-current");

        var encrypted = await svc.EncryptAsync("data");
        encrypted.Should().StartWith("k2-current:",
            "Ciphertext must be prefixed with the active key ID");
    }

    [Fact]
    public async Task KeyRing_DecryptOldCiphertextAfterRotation()
    {
        // Step 1: Encrypt with old key only
        var oldConfig = SingleKeyConfig("k1-old", "b2xkLWtleS1tYXRlcmlhbC0zMi1ieXRlcyEhIQ==");
        var (oldSvc, _) = BuildService(oldConfig);
        var oldCiphertext = await oldSvc.EncryptAsync("legacy-record");

        oldCiphertext.Should().StartWith("k1-old:");

        // Step 2: Build new service with both keys (k2 is now active)
        var (newSvc, _) = BuildService(TwoKeyConfig());
        var decrypted = await newSvc.DecryptAsync(oldCiphertext);

        decrypted.Should().Be("legacy-record",
            "Decryption must work with old key ID after key rotation");
    }

    [Fact]
    public async Task KeyRing_RejectsUnknownKeyId()
    {
        var (svc, _) = BuildService(SingleKeyConfig());

        // Forge a ciphertext with unknown key ID
        var forgedCiphertext = "unknown-key:AAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAA==:AAAA";

        var act = async () => await svc.DecryptAsync(forgedCiphertext);
        await act.Should().ThrowAsync<CryptographicException>()
            .WithMessage("*Unknown encryption key ID*");
    }

    [Fact]
    public void KeyRing_AllConfiguredKeysAreResolvable()
    {
        var (_, ring) = BuildService(TwoKeyConfig());

        ring.KeyIds.Should().HaveCount(2);
        ring.GetKey("k1-old").Should().NotBeNull();
        ring.GetKey("k2-current").Should().NotBeNull();
        ring.GetKey("nonexistent").Should().BeNull();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Ciphertext format: keyId:nonce:tag:cipher
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CiphertextFormat_HasFourColonSeparatedParts()
    {
        var (svc, _) = BuildService(SingleKeyConfig());

        var encrypted = await svc.EncryptAsync("test");
        var parts = encrypted.Split(':');

        parts.Should().HaveCount(4,
            "Format must be keyId:nonce:tag:cipher (4 parts)");
        parts[0].Should().Be("k1", "First part must be the key ID");
    }

    [Fact]
    public async Task CiphertextFormat_NonceIs12Bytes()
    {
        var (svc, _) = BuildService(SingleKeyConfig());

        var encrypted = await svc.EncryptAsync("test");
        var nonce = Convert.FromBase64String(encrypted.Split(':')[1]);

        nonce.Should().HaveCount(12, "GCM nonce must be 12 bytes");
    }

    [Fact]
    public async Task CiphertextFormat_TagIs16Bytes()
    {
        var (svc, _) = BuildService(SingleKeyConfig());

        var encrypted = await svc.EncryptAsync("test");
        var tag = Convert.FromBase64String(encrypted.Split(':')[2]);

        tag.Should().HaveCount(16, "GCM authentication tag must be 16 bytes");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. HKDF derivation sanity
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public void HKDF_DerivedKeyIs256Bits()
    {
        var (_, ring) = BuildService(SingleKeyConfig());

        ring.ActiveKey.DerivedKey.Should().HaveCount(32,
            "Derived key must be 256 bits (32 bytes) for AES-256-GCM");
    }

    [Fact]
    public void HKDF_DifferentKeyIdsProduce_DifferentDerivedKeys()
    {
        var (_, ring) = BuildService(TwoKeyConfig());

        var k1 = ring.GetKey("k1-old")!.DerivedKey;
        var k2 = ring.GetKey("k2-current")!.DerivedKey;

        k1.Should().NotEqual(k2,
            "Different key IDs must derive different encryption keys even with same material format");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. Tamper detection
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task TamperDetection_ModifiedCiphertextThrows()
    {
        var (svc, _) = BuildService(SingleKeyConfig());

        var encrypted = await svc.EncryptAsync("classified");
        var parts = encrypted.Split(':');

        // Flip a byte in the cipher portion
        var cipherBytes = Convert.FromBase64String(parts[3]);
        cipherBytes[0] ^= 0xFF;
        parts[3] = Convert.ToBase64String(cipherBytes);
        var tampered = string.Join(':', parts);

        var act = async () => await svc.DecryptAsync(tampered);
        await act.Should().ThrowAsync<CryptographicException>(
            "Tampered ciphertext must be detected and rejected by GCM auth tag");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Config schema gate: required keys enforcement
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public void ConfigSchemaGate_FallbackKeyConfigHasKnownDevId()
    {
        // No encryption keys configured at all — dev fallback should be used
        var (_, ring) = BuildService(new Dictionary<string, string?>());

        ring.ActiveKey.KeyId.Should().Be("dev-fallback",
            "With no keys configured, dev-fallback key must be used (and config-schema-gate should reject in CI)");
    }

    [Fact]
    public async Task ConfigSchemaGate_DedicatedEncryptionKeyOverridesDevFallback()
    {
        var cfg = new Dictionary<string, string?>
        {
            ["Security:EncryptionKey"] = "c3RhbmRhbG9uZS1lbmNyeXB0aW9uLWtleS1tYXRlcmlhbA==",
        };

        var (svc, ring) = BuildService(cfg);

        ring.ActiveKey.KeyId.Should().Be("default");

        // Should still encrypt/decrypt correctly
        var encrypted = await svc.EncryptAsync("test");
        var decrypted = await svc.DecryptAsync(encrypted);
        decrypted.Should().Be("test");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. Monotonic key ID ordering
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public void KeyRing_ActiveKeyIsListedFirst()
    {
        var (_, ring) = BuildService(TwoKeyConfig());

        ring.KeyIds[0].Should().Be("k2-current",
            "Active key must be listed first in KeyIds ordering");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. Startup hardening: uniqueness + active count + material length
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public void Hardening_RejectsDuplicateKeyIds()
    {
        var cfg = new Dictionary<string, string?>
        {
            ["Security:Encryption:Keys:0:KeyId"] = "same-id",
            ["Security:Encryption:Keys:0:Material"] = "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE=",
            ["Security:Encryption:Keys:0:Active"] = "true",
            ["Security:Encryption:Keys:1:KeyId"] = "same-id",
            ["Security:Encryption:Keys:1:Material"] = "b3RoZXIta2V5LW1hdGVyaWFsLTMyLWJ5dGVzISE=",
            ["Security:Encryption:Keys:1:Active"] = "false",
        };

        var act = () => BuildService(cfg);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Duplicate encryption key ID*same-id*");
    }

    [Fact]
    public void Hardening_RejectsZeroActiveKeys()
    {
        var cfg = new Dictionary<string, string?>
        {
            ["Security:Encryption:Keys:0:KeyId"] = "k1",
            ["Security:Encryption:Keys:0:Material"] = "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE=",
            ["Security:Encryption:Keys:0:Active"] = "false",
        };

        var act = () => BuildService(cfg);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*No active encryption key*");
    }

    [Fact]
    public void Hardening_RejectsMultipleActiveKeys()
    {
        var cfg = new Dictionary<string, string?>
        {
            ["Security:Encryption:Keys:0:KeyId"] = "k1",
            ["Security:Encryption:Keys:0:Material"] = "dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE=",
            ["Security:Encryption:Keys:0:Active"] = "true",
            ["Security:Encryption:Keys:1:KeyId"] = "k2",
            ["Security:Encryption:Keys:1:Material"] = "b3RoZXIta2V5LW1hdGVyaWFsLTMyLWJ5dGVzISE=",
            ["Security:Encryption:Keys:1:Active"] = "true",
        };

        var act = () => BuildService(cfg);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Multiple active encryption keys*");
    }

    [Fact]
    public void Hardening_RejectsShortKeyMaterial()
    {
        var cfg = new Dictionary<string, string?>
        {
            ["Security:Encryption:Keys:0:KeyId"] = "k1",
            ["Security:Encryption:Keys:0:Material"] = "short",
            ["Security:Encryption:Keys:0:Active"] = "true",
        };

        var act = () => BuildService(cfg);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*too short*");
    }
}
