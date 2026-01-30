// PluginAdmissionService.cs
// TerraFusion PluginLock Runtime Enforcement (GOD-TIER)
//
// Enforces PluginLock permissions at plugin load and runtime.
// Implements: deny-wins, SBOM/SLSA gate, compute caps, network egress control.

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Services.Marketplace;

/// <summary>
/// Plugin admission decision result.
/// </summary>
public enum AdmissionDecision
{
    Allow,
    Deny,
    DenyMissingSbom,
    DenyMissingSlsa,
    DenyInvalidPermissions,
    DenyComputeExceeded,
    DenyNetworkEgress,
    DenyDataScope,
    DenyCountyMismatch
}

/// <summary>
/// Plugin admission request containing all plugin metadata.
/// </summary>
public sealed record PluginAdmissionRequest
{
    public required string PluginId { get; init; }
    public required string Version { get; init; }
    public required Guid CountyId { get; init; }
    public string? SbomSha256 { get; init; }
    public string? SlsaProvenanceSha256 { get; init; }
    public PluginPermissionsRequest? RequestedPermissions { get; init; }
}

/// <summary>
/// Plugin permissions request (what the plugin is asking for).
/// </summary>
public sealed record PluginPermissionsRequest
{
    public List<string> DataScopes { get; init; } = [];
    public List<string> NetworkDomains { get; init; } = [];
    public int CpuMs { get; init; }
    public int MemoryMb { get; init; }
    public List<string> StorageTypes { get; init; } = [];
    public bool TelemetryEnabled { get; init; }
}

/// <summary>
/// Plugin admission response with decision and reason.
/// </summary>
public sealed record PluginAdmissionResponse
{
    public required AdmissionDecision Decision { get; init; }
    public required string Reason { get; init; }
    public DateTime EvaluatedAt { get; init; } = DateTime.UtcNow;
    public string? PolicyVersion { get; init; }
    public Dictionary<string, object>? ViolationDetails { get; init; }
}

/// <summary>
/// PluginLock permissions loaded from pluginlock.permissions.json.
/// </summary>
public sealed record PluginLockPermissions
{
    [JsonPropertyName("plugin_id")]
    public string PluginId { get; init; } = "";

    [JsonPropertyName("version")]
    public string Version { get; init; } = "";

    [JsonPropertyName("data_scopes")]
    public List<string> DataScopes { get; init; } = [];

    [JsonPropertyName("network")]
    public NetworkPermissions? Network { get; init; }

    [JsonPropertyName("compute")]
    public ComputePermissions? Compute { get; init; }

    [JsonPropertyName("storage")]
    public List<string> Storage { get; init; } = [];

    [JsonPropertyName("telemetry_required")]
    public bool TelemetryRequired { get; init; }
}

public sealed record NetworkPermissions
{
    [JsonPropertyName("allow_domains")]
    public List<string> AllowDomains { get; init; } = [];

    [JsonPropertyName("deny_domains")]
    public List<string> DenyDomains { get; init; } = [];
}

public sealed record ComputePermissions
{
    [JsonPropertyName("max_cpu_ms")]
    public int MaxCpuMs { get; init; }

    [JsonPropertyName("max_memory_mb")]
    public int MaxMemoryMb { get; init; }
}

/// <summary>
/// Service interface for plugin admission control.
/// </summary>
public interface IPluginAdmissionService
{
    /// <summary>
    /// Evaluate plugin admission request against PluginLock permissions.
    /// </summary>
    Task<PluginAdmissionResponse> EvaluateAsync(PluginAdmissionRequest request, CancellationToken ct = default);

    /// <summary>
    /// Load PluginLock permissions for a plugin.
    /// </summary>
    Task<PluginLockPermissions?> LoadPermissionsAsync(string pluginId, CancellationToken ct = default);

    /// <summary>
    /// Validate runtime network egress request.
    /// </summary>
    bool ValidateNetworkEgress(string pluginId, string domain);

    /// <summary>
    /// Validate runtime compute usage.
    /// </summary>
    bool ValidateComputeUsage(string pluginId, int cpuMs, int memoryMb);
}

/// <summary>
/// PluginLock runtime admission controller implementing deny-wins policy.
/// </summary>
public sealed class PluginAdmissionService : IPluginAdmissionService
{
    private readonly ILogger<PluginAdmissionService> _log;
    private readonly string _permissionsBasePath;
    private readonly Dictionary<string, PluginLockPermissions> _permissionsCache = new();
    private readonly object _cacheLock = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public PluginAdmissionService(ILogger<PluginAdmissionService> log, IConfiguration cfg)
    {
        _log = log;
        _permissionsBasePath = cfg["TF_PLUGINLOCK_PERMISSIONS_PATH"]
            ?? "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated";
    }

    public async Task<PluginAdmissionResponse> EvaluateAsync(PluginAdmissionRequest request, CancellationToken ct = default)
    {
        _log.LogInformation("🔒 Evaluating plugin admission: {PluginId} v{Version} for county {CountyId}",
            request.PluginId, request.Version, request.CountyId);

        // Gate 1: SBOM required
        if (string.IsNullOrWhiteSpace(request.SbomSha256))
        {
            _log.LogWarning("❌ Plugin {PluginId} denied: Missing SBOM", request.PluginId);
            return new PluginAdmissionResponse
            {
                Decision = AdmissionDecision.DenyMissingSbom,
                Reason = "SBOM (Software Bill of Materials) is required for all plugins",
                PolicyVersion = "v1.0.0"
            };
        }

        // Gate 2: SLSA provenance required
        if (string.IsNullOrWhiteSpace(request.SlsaProvenanceSha256))
        {
            _log.LogWarning("❌ Plugin {PluginId} denied: Missing SLSA provenance", request.PluginId);
            return new PluginAdmissionResponse
            {
                Decision = AdmissionDecision.DenyMissingSlsa,
                Reason = "SLSA provenance attestation is required for all plugins",
                PolicyVersion = "v1.0.0"
            };
        }

        // Load permissions for this plugin
        var permissions = await LoadPermissionsAsync(request.PluginId, ct);
        if (permissions == null)
        {
            _log.LogWarning("❌ Plugin {PluginId} denied: No PluginLock permissions found", request.PluginId);
            return new PluginAdmissionResponse
            {
                Decision = AdmissionDecision.DenyInvalidPermissions,
                Reason = $"No PluginLock permissions defined for plugin '{request.PluginId}'",
                PolicyVersion = "v1.0.0"
            };
        }

        // Gate 3: Validate data scopes
        if (request.RequestedPermissions != null)
        {
            var invalidScopes = request.RequestedPermissions.DataScopes
                .Where(s => !permissions.DataScopes.Contains(s))
                .ToList();

            if (invalidScopes.Count > 0)
            {
                _log.LogWarning("❌ Plugin {PluginId} denied: Invalid data scopes {Scopes}",
                    request.PluginId, string.Join(", ", invalidScopes));
                return new PluginAdmissionResponse
                {
                    Decision = AdmissionDecision.DenyDataScope,
                    Reason = $"Plugin requested unauthorized data scopes: {string.Join(", ", invalidScopes)}",
                    PolicyVersion = "v1.0.0",
                    ViolationDetails = new Dictionary<string, object>
                    {
                        ["requested"] = invalidScopes,
                        ["allowed"] = permissions.DataScopes
                    }
                };
            }
        }

        // Gate 4: Validate network domains (DENY-WINS policy)
        if (request.RequestedPermissions?.NetworkDomains != null && permissions.Network != null)
        {
            foreach (var domain in request.RequestedPermissions.NetworkDomains)
            {
                // DENY-WINS: Check deny list first
                if (permissions.Network.DenyDomains.Any(d => DomainMatches(domain, d)))
                {
                    _log.LogWarning("❌ Plugin {PluginId} denied: Network domain {Domain} is in deny list",
                        request.PluginId, domain);
                    return new PluginAdmissionResponse
                    {
                        Decision = AdmissionDecision.DenyNetworkEgress,
                        Reason = $"Network domain '{domain}' is explicitly denied (deny-wins policy)",
                        PolicyVersion = "v1.0.0",
                        ViolationDetails = new Dictionary<string, object>
                        {
                            ["domain"] = domain,
                            ["policy"] = "deny-wins"
                        }
                    };
                }

                // Then check allow list
                if (!permissions.Network.AllowDomains.Any(d => DomainMatches(domain, d)))
                {
                    _log.LogWarning("❌ Plugin {PluginId} denied: Network domain {Domain} not in allow list",
                        request.PluginId, domain);
                    return new PluginAdmissionResponse
                    {
                        Decision = AdmissionDecision.DenyNetworkEgress,
                        Reason = $"Network domain '{domain}' is not in allowed list",
                        PolicyVersion = "v1.0.0",
                        ViolationDetails = new Dictionary<string, object>
                        {
                            ["domain"] = domain,
                            ["allowed"] = permissions.Network.AllowDomains
                        }
                    };
                }
            }
        }

        // Gate 5: Validate compute limits
        if (request.RequestedPermissions != null && permissions.Compute != null)
        {
            if (request.RequestedPermissions.CpuMs > permissions.Compute.MaxCpuMs)
            {
                _log.LogWarning("❌ Plugin {PluginId} denied: CPU {Requested}ms exceeds max {Max}ms",
                    request.PluginId, request.RequestedPermissions.CpuMs, permissions.Compute.MaxCpuMs);
                return new PluginAdmissionResponse
                {
                    Decision = AdmissionDecision.DenyComputeExceeded,
                    Reason = $"Requested CPU time ({request.RequestedPermissions.CpuMs}ms) exceeds limit ({permissions.Compute.MaxCpuMs}ms)",
                    PolicyVersion = "v1.0.0",
                    ViolationDetails = new Dictionary<string, object>
                    {
                        ["requested_cpu_ms"] = request.RequestedPermissions.CpuMs,
                        ["max_cpu_ms"] = permissions.Compute.MaxCpuMs
                    }
                };
            }

            if (request.RequestedPermissions.MemoryMb > permissions.Compute.MaxMemoryMb)
            {
                _log.LogWarning("❌ Plugin {PluginId} denied: Memory {Requested}MB exceeds max {Max}MB",
                    request.PluginId, request.RequestedPermissions.MemoryMb, permissions.Compute.MaxMemoryMb);
                return new PluginAdmissionResponse
                {
                    Decision = AdmissionDecision.DenyComputeExceeded,
                    Reason = $"Requested memory ({request.RequestedPermissions.MemoryMb}MB) exceeds limit ({permissions.Compute.MaxMemoryMb}MB)",
                    PolicyVersion = "v1.0.0",
                    ViolationDetails = new Dictionary<string, object>
                    {
                        ["requested_memory_mb"] = request.RequestedPermissions.MemoryMb,
                        ["max_memory_mb"] = permissions.Compute.MaxMemoryMb
                    }
                };
            }
        }

        // Gate 6: Telemetry requirement
        if (permissions.TelemetryRequired &&
            request.RequestedPermissions != null &&
            !request.RequestedPermissions.TelemetryEnabled)
        {
            _log.LogWarning("❌ Plugin {PluginId} denied: Telemetry is required but not enabled", request.PluginId);
            return new PluginAdmissionResponse
            {
                Decision = AdmissionDecision.Deny,
                Reason = "Plugin must enable telemetry as per PluginLock policy",
                PolicyVersion = "v1.0.0"
            };
        }

        // All gates passed
        _log.LogInformation("✅ Plugin {PluginId} ADMITTED", request.PluginId);
        return new PluginAdmissionResponse
        {
            Decision = AdmissionDecision.Allow,
            Reason = "Plugin passed all admission gates",
            PolicyVersion = permissions.Version
        };
    }

    public async Task<PluginLockPermissions?> LoadPermissionsAsync(string pluginId, CancellationToken ct = default)
    {
        // Check cache first
        lock (_cacheLock)
        {
            if (_permissionsCache.TryGetValue(pluginId, out var cached))
                return cached;
        }

        // Load from disk
        var permissionsPath = Path.Combine(_permissionsBasePath, "pluginlock.permissions.json");
        if (!File.Exists(permissionsPath))
        {
            _log.LogWarning("PluginLock permissions file not found: {Path}", permissionsPath);
            return null;
        }

        try
        {
            var json = await File.ReadAllTextAsync(permissionsPath, ct);
            var permissions = JsonSerializer.Deserialize<PluginLockPermissions>(json, JsonOptions);

            if (permissions != null && permissions.PluginId == pluginId)
            {
                lock (_cacheLock)
                {
                    _permissionsCache[pluginId] = permissions;
                }
                return permissions;
            }

            _log.LogWarning("Plugin ID mismatch: expected {Expected}, got {Actual}",
                pluginId, permissions?.PluginId);
            return null;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Failed to load PluginLock permissions from {Path}", permissionsPath);
            return null;
        }
    }

    public bool ValidateNetworkEgress(string pluginId, string domain)
    {
        lock (_cacheLock)
        {
            if (!_permissionsCache.TryGetValue(pluginId, out var permissions))
                return false;

            if (permissions.Network == null)
                return false;

            // DENY-WINS: Check deny list first
            if (permissions.Network.DenyDomains.Any(d => DomainMatches(domain, d)))
                return false;

            // Then check allow list
            return permissions.Network.AllowDomains.Any(d => DomainMatches(domain, d));
        }
    }

    public bool ValidateComputeUsage(string pluginId, int cpuMs, int memoryMb)
    {
        lock (_cacheLock)
        {
            if (!_permissionsCache.TryGetValue(pluginId, out var permissions))
                return false;

            if (permissions.Compute == null)
                return true; // No limits defined

            return cpuMs <= permissions.Compute.MaxCpuMs &&
                   memoryMb <= permissions.Compute.MaxMemoryMb;
        }
    }

    /// <summary>
    /// Check if a domain matches a pattern (supports wildcard *.example.com).
    /// </summary>
    private static bool DomainMatches(string domain, string pattern)
    {
        if (pattern.StartsWith("*."))
        {
            var suffix = pattern[1..]; // ".example.com"
            return domain.EndsWith(suffix, StringComparison.OrdinalIgnoreCase) ||
                   domain.Equals(pattern[2..], StringComparison.OrdinalIgnoreCase);
        }

        return domain.Equals(pattern, StringComparison.OrdinalIgnoreCase);
    }
}
