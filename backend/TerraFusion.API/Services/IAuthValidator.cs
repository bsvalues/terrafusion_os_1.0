using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Services
{
    public interface IAuthValidator
    {
        bool Validate(AuthEnvelope envelope, out string? reason);
        TimeSpan AllowedDrift { get; }
    }

    public sealed record AuthEnvelope(AuthPayload Payload, string Signature, string Alg = "HS256")
    {
        public static bool TryParse(object? input, out AuthEnvelope? envelope)
        {
            envelope = null;
            if (input is null) return false;
            try
            {
                var json = JsonSerializer.Serialize(input);
                envelope = JsonSerializer.Deserialize<AuthEnvelope>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                return envelope != null && envelope.Payload != null && !string.IsNullOrEmpty(envelope.Signature);
            }
            catch
            {
                return false;
            }
        }
    }

    public sealed record AuthPayload(
        string CountyId,
        string LegacySystem,
        string Nonce,
        long Ts,
        string[]? Roles = null,
        string[]? Permissions = null
    );

    public sealed class HmacAuthValidator : IAuthValidator
    {
        private readonly string _sharedSecret;
        public TimeSpan AllowedDrift { get; } = TimeSpan.FromMinutes(1);

        public HmacAuthValidator()
        {
            _sharedSecret = Environment.GetEnvironmentVariable("TF_OS_SHARED_SECRET")
                ?? Environment.GetEnvironmentVariable("TF_VAULT_KEY")
                ?? "dev-shared-secret"; // dev fallback only
        }

        public bool Validate(AuthEnvelope envelope, out string? reason)
        {
            reason = null;
            if (!string.Equals(envelope.Alg, "HS256", StringComparison.OrdinalIgnoreCase))
            {
                reason = "Unsupported algorithm";
                return false;
            }

            // Check drift
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var delta = Math.Abs(now - envelope.Payload.Ts);
            if (delta > (long)AllowedDrift.TotalMilliseconds)
            {
                reason = "Stale timestamp";
                return false;
            }

            // Compute signature over canonical payload JSON (includes roles/permissions when present)
            var payloadJson = JsonSerializer.Serialize(envelope.Payload);
            var sig = ComputeHmacSha256(payloadJson, _sharedSecret);
            if (!TimingSafeEquals(sig, envelope.Signature))
            {
                reason = "Bad signature";
                return false;
            }

            return true;
        }

        private static string ComputeHmacSha256(string message, string secret)
        {
            var key = Encoding.UTF8.GetBytes(secret);
            using var hmac = new HMACSHA256(key);
            var bytes = Encoding.UTF8.GetBytes(message);
            var hash = hmac.ComputeHash(bytes);
            return Base64Url(hash);
        }

        private static string Base64Url(byte[] data)
        {
            return Convert.ToBase64String(data)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private static bool TimingSafeEquals(string a, string b)
        {
            if (a.Length != b.Length) return false;
            var diff = 0;
            for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
            return diff == 0;
        }
    }
}
