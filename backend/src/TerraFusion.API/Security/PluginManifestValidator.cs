using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Security
{
    public sealed class PluginManifestValidator
    {
        private readonly ILogger<PluginManifestValidator> _logger;
        private readonly Dictionary<string, string> _countyKeys;

        public PluginManifestValidator(ILogger<PluginManifestValidator> logger)
        {
            _logger = logger;
            // Per-county signing keys (in production, load from secure config)
            _countyKeys = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["benton"] = Environment.GetEnvironmentVariable("TF_BENTON_PLUGIN_KEY") ?? "benton-dev-plugin-key-2025",
                ["clark"] = Environment.GetEnvironmentVariable("TF_CLARK_PLUGIN_KEY") ?? "clark-dev-plugin-key-2025"
            };
        }

        public bool ValidateManifest(string manifestJson, string countyId)
        {
            try
            {
                var manifest = JsonSerializer.Deserialize<PluginManifest>(manifestJson);
                if (manifest == null)
                {
                    _logger.LogWarning("Invalid manifest JSON");
                    return false;
                }

                // Verify county targeting
                if (!manifest.TargetCounties.Contains(countyId, StringComparer.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Plugin {Name} not authorized for county {County}", manifest.Name, countyId);
                    return false;
                }

                // Verify signature
                if (!VerifySignature(manifest, countyId))
                {
                    _logger.LogWarning("Invalid signature for plugin {Name} in county {County}", manifest.Name, countyId);
                    return false;
                }

                _logger.LogInformation("Plugin {Name} v{Version} validated for county {County}", 
                    manifest.Name, manifest.Version, countyId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating plugin manifest");
                return false;
            }
        }

        private bool VerifySignature(PluginManifest manifest, string countyId)
        {
            if (!_countyKeys.TryGetValue(countyId, out var key))
            {
                _logger.LogWarning("No signing key found for county {County}", countyId);
                return false;
            }

            // Extract signature components
            var sigParts = manifest.Signature.Split(':');
            if (sigParts.Length != 3 || sigParts[0] != "HMAC-SHA256" || sigParts[1] != countyId)
            {
                return false;
            }

            // Create canonical payload for verification
            var canonical = CreateCanonicalPayload(manifest);
            
            // Compute expected signature
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(canonical));
            var expectedSig = Convert.ToBase64String(computedHash)
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');

            return sigParts[2] == expectedSig;
        }

        private string CreateCanonicalPayload(PluginManifest manifest)
        {
            // Create deterministic string for signing
            return $"{manifest.Name}|{manifest.Version}|{manifest.Hash}|{manifest.CreatedAt}|{string.Join(",", manifest.Permissions)}";
        }

        public string SignManifest(PluginManifest manifest, string countyId)
        {
            if (!_countyKeys.TryGetValue(countyId, out var key))
            {
                throw new ArgumentException($"No signing key for county {countyId}");
            }

            var canonical = CreateCanonicalPayload(manifest);
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(canonical));
            var signature = Convert.ToBase64String(hash)
                .Replace('+', '-').Replace('/', '_').TrimEnd('=');

            return $"HMAC-SHA256:{countyId}:{signature}";
        }
    }

    public sealed record PluginManifest(
        string Name,
        string Version,
        string Description,
        string Author,
        string[] Permissions,
        string[] TargetCounties,
        string[] LegacySystems,
        string[] Dependencies,
        string EntryPoint,
        string CreatedAt,
        string Hash,
        string Signature
    );
}
