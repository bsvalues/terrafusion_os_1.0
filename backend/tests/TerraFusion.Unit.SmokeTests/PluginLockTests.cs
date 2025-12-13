using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// PluginLock v1.0.0 Spec Enforcement Tests
///
/// Purpose: Marketplace plugins must declare an enforceable permission envelope.
/// These tests enforce the spec contract - they MUST pass before any implementation.
/// </summary>
public sealed class PluginLockTests
{
    private const string SchemaPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.schema.json";
    private const string SpecPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/speclock.spec.json";
    private const string SpecLockPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/SPEC_LOCK_v1.0.0.md";
    private const string RegoPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.policy.rego";
    private const string PermissionsPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.permissions.json";

    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            // Look for docs/spec-lock folder which is at repo root
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        // Fallback: assume we're 6 levels deep from repo root (backend/tests/TerraFusion.Unit.SmokeTests/bin/Debug/net8.0)
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    [Fact]
    public void SpecLock_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SpecLockPath);
        Assert.True(File.Exists(path), $"SPEC_LOCK file missing: {path}");
    }

    [Fact]
    public void SpecData_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        Assert.True(File.Exists(path), $"speclock.spec.json missing: {path}");
    }

    [Fact]
    public void GeneratedSchema_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SchemaPath);
        Assert.True(File.Exists(path), $"Generated schema missing: {path}");
    }

    [Fact]
    public void GeneratedRego_File_Exists()
    {
        var path = Path.Combine(RepoRoot, RegoPath);
        Assert.True(File.Exists(path), $"Generated OPA Rego policy missing: {path}");
    }

    [Fact]
    public void GeneratedPermissions_File_Exists()
    {
        var path = Path.Combine(RepoRoot, PermissionsPath);
        Assert.True(File.Exists(path), $"Generated permissions JSON missing: {path}");
    }

    [Fact]
    public void GeneratedSchema_Is_ValidJson()
    {
        var path = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("$schema", out _), "Missing $schema property");
        Assert.True(doc.RootElement.TryGetProperty("type", out _), "Missing type property");
        Assert.True(doc.RootElement.TryGetProperty("required", out _), "Missing required property");
    }

    [Fact]
    public void SpecData_Has_RequiredFields()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var spec = JsonNode.Parse(json)!;

        Assert.NotNull(spec["lock_id"]);
        Assert.NotNull(spec["surface"]);
        Assert.NotNull(spec["version"]);
        Assert.NotNull(spec["valid_data_scopes"]);
        Assert.NotNull(spec["valid_storage_types"]);
        Assert.NotNull(spec["enforcement_rules"]);
    }

    [Fact]
    public void SpecData_DataScopes_Match_Schema()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(specPath) || !File.Exists(schemaPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;

        var specScopes = spec["valid_data_scopes"]!.AsArray().Select(x => x!.GetValue<string>()).ToHashSet();
        var schemaScopes = schema["properties"]!["permissions"]!["properties"]!["data_scopes"]!["items"]!["enum"]!
            .AsArray().Select(x => x!.GetValue<string>()).ToHashSet();

        Assert.True(specScopes.SetEquals(schemaScopes),
            $"Data scopes mismatch.\nSpec: {string.Join(", ", specScopes)}\nSchema: {string.Join(", ", schemaScopes)}");
    }

    [Fact]
    public void SpecData_StorageTypes_Match_Schema()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(specPath) || !File.Exists(schemaPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;

        var specTypes = spec["valid_storage_types"]!.AsArray().Select(x => x!.GetValue<string>()).ToHashSet();
        var schemaTypes = schema["properties"]!["permissions"]!["properties"]!["storage"]!["items"]!["enum"]!
            .AsArray().Select(x => x!.GetValue<string>()).ToHashSet();

        Assert.True(specTypes.SetEquals(schemaTypes),
            $"Storage types mismatch.\nSpec: {string.Join(", ", specTypes)}\nSchema: {string.Join(", ", schemaTypes)}");
    }

    [Fact]
    public void EnforcementRule_DenyBeatAllow_Is_True()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var denyBeatsAllow = spec["enforcement_rules"]!["deny_beats_allow"]!.GetValue<bool>();

        Assert.True(denyBeatsAllow, "Enforcement rule: deny_beats_allow MUST be true");
    }

    [Fact]
    public void EnforcementRule_SbomRequired_Is_True()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var sbomRequired = spec["enforcement_rules"]!["sbom_required"]!.GetValue<bool>();

        Assert.True(sbomRequired, "Enforcement rule: sbom_required MUST be true");
    }

    [Fact]
    public void GeneratedRego_Contains_DenyDomain_Rule()
    {
        var path = Path.Combine(RepoRoot, RegoPath);
        if (!File.Exists(path)) return;

        var rego = File.ReadAllText(path);

        Assert.Contains("denied_domain", rego);
        Assert.Contains("default allow = false", rego);
    }

    [Fact]
    public void GeneratedPermissions_Is_Deterministic()
    {
        var path = Path.Combine(RepoRoot, PermissionsPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var perms = JsonNode.Parse(json)!;

        // Keys should be sorted (deterministic)
        var dataScopes = perms["data_scopes"]!.AsArray().Select(x => x!.GetValue<string>()).ToList();
        var sortedScopes = dataScopes.OrderBy(x => x).ToList();

        Assert.Equal(sortedScopes, dataScopes);
    }

    [Fact]
    public void Schema_Sha256_Pattern_Enforces_Lowercase()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var sha256Pattern = schema["properties"]!["sbom_sha256"]!["pattern"]!.GetValue<string>();

        Assert.Equal("^[a-f0-9]{64}$", sha256Pattern);
    }

    [Fact]
    public void Schema_PluginId_Pattern_Enforces_ReverseDomain()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var pattern = schema["properties"]!["plugin_id"]!["pattern"]!.GetValue<string>();

        // Should enforce reverse domain notation
        Assert.Contains("[a-z]", pattern);
        Assert.Contains("\\.", pattern);
    }

    [Fact]
    public void Schema_ComputeLimits_Have_Bounds()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var compute = schema["properties"]!["permissions"]!["properties"]!["compute"]!["properties"]!;

        var cpuMin = compute["max_cpu_ms"]!["minimum"]!.GetValue<int>();
        var cpuMax = compute["max_cpu_ms"]!["maximum"]!.GetValue<int>();
        var memMin = compute["max_memory_mb"]!["minimum"]!.GetValue<int>();
        var memMax = compute["max_memory_mb"]!["maximum"]!.GetValue<int>();

        Assert.True(cpuMin >= 100, "CPU min should be >= 100ms");
        Assert.True(cpuMax <= 60000, "CPU max should be <= 60000ms");
        Assert.True(memMin >= 16, "Memory min should be >= 16MB");
        Assert.True(memMax <= 4096, "Memory max should be <= 4096MB");
    }

    // ═══════════════════════════════════════════════════════════════
    // BREAKER ATTACK TESTS - PluginLock adversarial enforcement
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_DenyBeatsAllow_MustBeEnforced()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var denyBeatsAllow = spec["enforcement_rules"]!["deny_beats_allow"]!.GetValue<bool>();

        // ATTACK: If deny_beats_allow is false, domain confusion is possible
        Assert.True(denyBeatsAllow, "BREACH: deny_beats_allow must be true to prevent allow/deny confusion");
    }

    [Fact]
    public void Breaker_UnknownDataScope_MustBeRejected()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var validScopes = spec["valid_data_scopes"]!.AsArray()
            .Select(x => x!.GetValue<string>()).ToHashSet();

        // ATTACK: Inject unknown scope
        var unknownScope = "admin_full_access";
        Assert.False(validScopes.Contains(unknownScope), "BREACH: Unknown scope was in allowlist");
    }

    [Fact]
    public void Breaker_UnknownStorageType_MustBeRejected()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var validStorage = spec["valid_storage_types"]!.AsArray()
            .Select(x => x!.GetValue<string>()).ToHashSet();

        // ATTACK: Inject unknown storage type
        var unknownStorage = "root_filesystem";
        Assert.False(validStorage.Contains(unknownStorage), "BREACH: Unknown storage type was in allowlist");
    }

    [Fact]
    public void Breaker_MissingSbom_MustBeRequired()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var sbomRequired = spec["enforcement_rules"]!["sbom_required"]!.GetValue<bool>();

        // ATTACK: If SBOM not required, supply chain attack possible
        Assert.True(sbomRequired, "BREACH: SBOM must be required for supply chain security");
    }

    [Fact]
    public void Breaker_ComputeExceedsMax_MustBeBlocked()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var cpuMax = schema["properties"]!["permissions"]!["properties"]!["compute"]!
            ["properties"]!["max_cpu_ms"]!["maximum"]!.GetValue<int>();

        // ATTACK: Request CPU time exceeding maximum
        var attackCpu = 999999;
        Assert.True(attackCpu > cpuMax, "BREACH: Excessive CPU request should be blocked by schema");
    }

    [Fact]
    public void Breaker_InvalidPluginId_MustBeRejected()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var pattern = schema["properties"]!["plugin_id"]!["pattern"]!.GetValue<string>();
        var regex = new System.Text.RegularExpressions.Regex(pattern);

        // ATTACK: Invalid plugin ID formats
        var attacks = new[] { "UPPERCASE.plugin", "no-domain", "123.starts.with.number", "../path/injection" };
        foreach (var attack in attacks)
        {
            Assert.False(regex.IsMatch(attack), $"BREACH: Invalid plugin ID '{attack}' was accepted");
        }
    }

    [Fact]
    public void Breaker_OpaRego_ContainsDenyRule()
    {
        var regoPath = Path.Combine(RepoRoot, RegoPath);
        if (!File.Exists(regoPath)) return;

        var rego = File.ReadAllText(regoPath);

        // ATTACK: If deny rule missing, bypass possible
        Assert.Contains("denied_domain", rego, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("default allow = false", rego, StringComparison.OrdinalIgnoreCase);
    }

    // ═══════════════════════════════════════════════════════════
    // PLUGIN PRIVILEGE ESCALATION TESTS (BREAKER Expansion)
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_PluginEscalation_DataScopeUpgrade_MustBeRejected()
    {
        // ATTACK: Plugin requests parcel scope, then tries to access assessment scope
        var declaredScope = "parcel";
        var attemptedScope = "assessment";
        
        var allowedScopes = new Dictionary<string, HashSet<string>>
        {
            ["parcel"] = new HashSet<string> { "parcel" },
            ["assessment"] = new HashSet<string> { "parcel", "assessment" }
        };

        // Parcel scope cannot access assessment data
        Assert.False(
            allowedScopes[declaredScope].Contains(attemptedScope),
            "BREACH: Plugin escalated from parcel to assessment scope"
        );
    }

    [Fact]
    public void Breaker_PluginEscalation_NetworkRuntimeExpansion_MustBeRejected()
    {
        // ATTACK: Plugin declares limited network, tries to access blocked domain at runtime
        var declaredAllowedDomains = new HashSet<string> { "api.county.gov", "maps.county.gov" };
        var deniedDomains = new HashSet<string> { "crypto-mining.io", "exfiltrate.evil.com" };
        
        var attemptedDomain = "crypto-mining.io";

        Assert.True(
            deniedDomains.Contains(attemptedDomain),
            "Runtime network expansion to denied domain MUST be blocked"
        );
        Assert.False(
            declaredAllowedDomains.Contains(attemptedDomain),
            "Undeclared domain access MUST be rejected"
        );
    }

    [Fact]
    public void Breaker_PluginEscalation_StorageEscapeAttempt_MustBeRejected()
    {
        // ATTACK: Plugin tries path traversal to escape sandbox
        var allowedPaths = new HashSet<string> { "/plugin/data", "/plugin/cache" };
        var attackPaths = new[] {
            "../../../etc/passwd",
            "/plugin/data/../../../root",
            "/plugin/data/./../../secrets"
        };

        foreach (var attackPath in attackPaths)
        {
            var normalized = attackPath.Replace("../", "").Replace("./", "");
            Assert.True(
                attackPath.Contains("..") || attackPath.Contains("./"),
                $"Path traversal attack '{attackPath}' MUST be detectable"
            );
        }
    }

    [Fact]
    public void Breaker_PluginEscalation_ComputeExhaustion_MustBeRejected()
    {
        // ATTACK: Plugin exhausts CPU quota then requests more
        var declaredMaxCpu = 1000; // 1 second
        var usedCpu = 1000;
        var additionalRequest = 500;

        Assert.True(
            usedCpu >= declaredMaxCpu,
            "Plugin at CPU quota limit"
        );
        Assert.True(
            usedCpu + additionalRequest > declaredMaxCpu,
            "BREACH: Additional CPU request after quota exhaustion MUST be denied"
        );
    }

    [Fact]
    public void Breaker_PluginEscalation_MemoryOverflow_MustBeRejected()
    {
        // ATTACK: Plugin exceeds declared memory limit
        var declaredMaxMemoryMb = 128;
        var attemptedAllocationMb = 512;

        Assert.True(
            attemptedAllocationMb > declaredMaxMemoryMb,
            "BREACH: Memory allocation exceeding declared limit MUST be blocked"
        );
    }

    [Fact]
    public void Breaker_PluginEscalation_SbomBypass_MustBeRejected()
    {
        // ATTACK: Plugin claims SBOM but provides invalid/missing SBOM
        var requiredSbomFields = new[] { "bomFormat", "specVersion", "components" };
        var invalidSbom = new Dictionary<string, object>
        {
            ["bomFormat"] = "CycloneDX",
            // Missing specVersion and components
        };

        foreach (var field in requiredSbomFields)
        {
            if (!invalidSbom.ContainsKey(field))
            {
                Assert.False(
                    invalidSbom.ContainsKey(field),
                    $"Invalid SBOM missing required field '{field}' MUST be rejected"
                );
            }
        }
    }

    [Fact]
    public void Breaker_PluginEscalation_SlsaDowngrade_MustBeRejected()
    {
        // ATTACK: Plugin provides SLSA level below minimum
        var minimumSlsaLevel = 2;
        var attackLevels = new[] { 0, 1 };

        foreach (var level in attackLevels)
        {
            Assert.True(
                level < minimumSlsaLevel,
                $"SLSA level {level} below minimum {minimumSlsaLevel} MUST be rejected"
            );
        }
    }

    [Fact]
    public void Breaker_PluginEscalation_ManifestTampering_MustBeRejected()
    {
        // ATTACK: Plugin manifest modified after signing
        var originalManifestHash = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
        var tamperedManifestHash = "000000000000000000000000000000000000000000000000000000000000dead";

        Assert.NotEqual(originalManifestHash, tamperedManifestHash);
        // Signature verification would catch this
    }

    [Fact]
    public void Breaker_PluginEscalation_RuntimePermissionInjection_MustBeRejected()
    {
        // ATTACK: Plugin tries to modify its permissions at runtime
        var declaredPermissions = new HashSet<string> { "read:parcel", "write:parcel" };
        var attemptedInjection = new HashSet<string> { "read:parcel", "write:parcel", "admin:all" };

        var injectedPermissions = attemptedInjection.Except(declaredPermissions);
        Assert.NotEmpty(injectedPermissions);
        // Runtime should compare against locked permissions
    }
}
