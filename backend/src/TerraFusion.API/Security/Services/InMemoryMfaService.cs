using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Security.Interfaces;

namespace TerraFusion.API.Security.Services;

/// <summary>
/// In-memory TOTP MFA service (RFC 6238).
/// FISMA IA-2(1): MFA for privileged government accounts.
/// Production: swap to hardware-token or authenticator-app backed store.
/// </summary>
public sealed class InMemoryMfaService : IMfaService
{
    private readonly ConcurrentDictionary<string, MfaUserState> _users = new(StringComparer.OrdinalIgnoreCase);
    private readonly ILogger<InMemoryMfaService> _logger;
    private const int SecretLength = 20; // 160-bit secret
    private const int TimeStepSeconds = 30;
    private const int CodeDigits = 6;
    private const int ToleranceSteps = 1; // +/- 1 step window

    public InMemoryMfaService(ILogger<InMemoryMfaService> logger)
    {
        _logger = logger;
    }

    public Task<string> GenerateMfaSecretAsync(string userId)
    {
        var secret = RandomNumberGenerator.GetBytes(SecretLength);
        var encoded = ToBase32(secret);

        _users[userId] = new MfaUserState
        {
            UserId = userId,
            Secret = secret,
            IsEnabled = false
        };

        _logger.LogInformation("MFA secret generated for user {UserId}", userId);
        return Task.FromResult(encoded);
    }

    public Task<bool> IsMfaEnabledAsync(string userId)
    {
        var enabled = _users.TryGetValue(userId, out var state) && state.IsEnabled;
        return Task.FromResult(enabled);
    }

    public Task EnableMfaAsync(string userId, string secret)
    {
        if (_users.TryGetValue(userId, out var state))
        {
            state.IsEnabled = true;
            state.EnabledAt = DateTime.UtcNow;
            _logger.LogInformation("MFA enabled for user {UserId}", userId);
        }
        return Task.CompletedTask;
    }

    public Task DisableMfaAsync(string userId)
    {
        if (_users.TryGetValue(userId, out var state))
        {
            state.IsEnabled = false;
            _logger.LogInformation("MFA disabled for user {UserId}", userId);
        }
        return Task.CompletedTask;
    }

    public Task<bool> ValidateMfaCodeAsync(string userId, string code)
    {
        if (!_users.TryGetValue(userId, out var state) || !state.IsEnabled)
        {
            _logger.LogWarning("MFA validation failed: not enabled for {UserId}", userId);
            return Task.FromResult(false);
        }

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var currentStep = now / TimeStepSeconds;

        for (var i = -ToleranceSteps; i <= ToleranceSteps; i++)
        {
            var expected = ComputeTotp(state.Secret, currentStep + i);
            if (string.Equals(expected, code, StringComparison.Ordinal))
            {
                _logger.LogInformation("MFA code validated for user {UserId}", userId);
                return Task.FromResult(true);
            }
        }

        _logger.LogWarning("MFA code invalid for user {UserId}", userId);
        return Task.FromResult(false);
    }

    public Task<string> GenerateTotpCodeAsync(string userId)
    {
        if (!_users.TryGetValue(userId, out var state) || !state.IsEnabled)
            return Task.FromResult(string.Empty);

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var step = now / TimeStepSeconds;
        return Task.FromResult(ComputeTotp(state.Secret, step));
    }

    // ── HOTP core (RFC 4226 + RFC 6238) ────────────────────────────

    public static string ComputeTotp(byte[] secret, long counter)
    {
        var counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian)
            Array.Reverse(counterBytes);

        using var hmac = new HMACSHA1(secret);
        var hash = hmac.ComputeHash(counterBytes);

        var offset = hash[^1] & 0x0F;
        var binary = ((hash[offset] & 0x7F) << 24)
                   | ((hash[offset + 1] & 0xFF) << 16)
                   | ((hash[offset + 2] & 0xFF) << 8)
                   | (hash[offset + 3] & 0xFF);

        var otp = binary % (int)Math.Pow(10, CodeDigits);
        return otp.ToString($"D{CodeDigits}");
    }

    // ── Base32 (RFC 4648) ──────────────────────────────────────────

    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public static string ToBase32(byte[] data)
    {
        var bits = 0;
        var buffer = 0;
        var result = new char[(data.Length * 8 + 4) / 5];
        var index = 0;

        foreach (var b in data)
        {
            buffer = (buffer << 8) | b;
            bits += 8;
            while (bits >= 5)
            {
                bits -= 5;
                result[index++] = Base32Alphabet[(buffer >> bits) & 0x1F];
            }
        }

        if (bits > 0)
            result[index++] = Base32Alphabet[(buffer << (5 - bits)) & 0x1F];

        return new string(result, 0, index);
    }

    public static byte[] FromBase32(string encoded)
    {
        var bits = 0;
        var buffer = 0;
        var result = new List<byte>();

        foreach (var c in encoded)
        {
            var val = Base32Alphabet.IndexOf(char.ToUpperInvariant(c));
            if (val < 0) continue;

            buffer = (buffer << 5) | val;
            bits += 5;
            if (bits >= 8)
            {
                bits -= 8;
                result.Add((byte)(buffer >> bits));
            }
        }

        return result.ToArray();
    }

    private sealed class MfaUserState
    {
        public string UserId { get; set; } = string.Empty;
        public byte[] Secret { get; set; } = Array.Empty<byte>();
        public bool IsEnabled { get; set; }
        public DateTime? EnabledAt { get; set; }
    }
}
