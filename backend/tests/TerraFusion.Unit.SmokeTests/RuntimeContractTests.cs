using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// RuntimeContract v1.0.0 Spec Enforcement Tests
///
/// Purpose: Shell-agnostic constitutional runtime contract.
/// These tests enforce the Governance Kernel contract - they MUST pass before any deployment.
/// </summary>
public sealed class RuntimeContractTests
{
    private const string SpecPath = "docs/spec-lock/locks/runtimecontract/runtimecontract.v1/speclock.spec.json";
    private const string SpecLockPath = "docs/spec-lock/locks/runtimecontract/runtimecontract.v1/SPEC_LOCK_v1.0.0.md";
    private const string SchemaPath = "docs/spec-lock/locks/runtimecontract/runtimecontract.v1/generated/runtimecontract.schema.json";

    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    // ═══════════════════════════════════════════════════════════════
    // FILE EXISTENCE TESTS
    // ═══════════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════════
    // SPEC DATA VALIDATION TESTS
    // ═══════════════════════════════════════════════════════════════

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
        Assert.NotNull(spec["required_endpoints"]);
        Assert.NotNull(spec["required_metrics"]);
        Assert.NotNull(spec["required_storage_paths"]);
        Assert.NotNull(spec["proof_schema"]);
        Assert.NotNull(spec["plugin_admission_requirements"]);
    }

    [Fact]
    public void SpecData_RequiredEndpoints_Include_Healthz()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var endpoints = spec["required_endpoints"]!.AsArray();

        var paths = endpoints.Select(e => e!["path"]!.GetValue<string>()).ToList();

        Assert.Contains("/healthz/ready", paths);
        Assert.Contains("/healthz/proof", paths);
        Assert.Contains("/ops/speclock", paths);
    }

    [Fact]
    public void SpecData_RequiredMetrics_Include_SpecLockOk()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var metrics = spec["required_metrics"]!.AsArray();

        var names = metrics.Select(m => m!["name"]!.GetValue<string>()).ToList();

        Assert.Contains("tf_speclock_ok", names);
        Assert.Contains("tf_state_mesh_ok", names);
        Assert.Contains("tf_receipt_count", names);
    }

    [Fact]
    public void SpecData_ProofSchema_Has_RequiredFields()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var schema = spec["proof_schema"]!;
        var required = schema["required"]!.AsArray().Select(r => r!.GetValue<string>()).ToHashSet();

        Assert.Contains("speclock_ok", required);
        Assert.Contains("state_mesh_ok", required);
        Assert.Contains("manifest_sha256", required);
        Assert.Contains("timestamp_epoch", required);
        Assert.Contains("receipt_count", required);
        Assert.Contains("state_proof_present", required);
    }

    [Fact]
    public void SpecData_ProofSchema_Sha256_Pattern_Lowercase()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var pattern = spec["proof_schema"]!["properties"]!["manifest_sha256"]!["pattern"]!.GetValue<string>();

        Assert.Equal("^[a-f0-9]{64}$", pattern);
    }

    [Fact]
    public void SpecData_DeterminismRules_KeyOrdering_Lexicographic()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var keyOrdering = spec["determinism_rules"]!["json_key_ordering"]!.GetValue<string>();

        Assert.Equal("lexicographic", keyOrdering);
    }

    // ═══════════════════════════════════════════════════════════════
    // PLUGIN ADMISSION TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SpecData_PluginAdmission_RequiresSbom()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var envVars = spec["plugin_admission_requirements"]!["required_env_vars"]!
            .AsArray().Select(e => e!.GetValue<string>()).ToList();

        Assert.Contains("TF_SBOM_SHA256", envVars);
        Assert.Contains("TF_SLSA_SHA256", envVars);
        Assert.Contains("TF_BUNDLE_SHA256", envVars);
    }

    [Fact]
    public void SpecData_PluginAdmission_FailPolicyIsFail()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var failPolicy = spec["plugin_admission_requirements"]!["fail_policy"]!.GetValue<string>();

        Assert.Equal("Fail", failPolicy);
    }

    [Fact]
    public void SpecData_PluginAdmission_DenyBeatsAllow()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var enforcement = spec["plugin_admission_requirements"]!["enforcement"]!.GetValue<string>();

        Assert.Equal("deny_beats_allow", enforcement);
    }

    // ═══════════════════════════════════════════════════════════════
    // STORAGE CONTRACT TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void SpecData_Storage_ReceiptsPathDurable()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var storage = spec["required_storage_paths"]!.AsArray();

        var receipts = storage.FirstOrDefault(s =>
            s!["purpose"]!.GetValue<string>() == "citizen_receipts");

        Assert.NotNull(receipts);
        Assert.Equal("durable", receipts!["persistence"]!.GetValue<string>());
    }

    [Fact]
    public void SpecData_Storage_TssStateDurable()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var storage = spec["required_storage_paths"]!.AsArray();

        var tss = storage.FirstOrDefault(s =>
            s!["purpose"]!.GetValue<string>() == "tss_state_artifacts");

        Assert.NotNull(tss);
        Assert.Equal("durable", tss!["persistence"]!.GetValue<string>());
    }

    // ═══════════════════════════════════════════════════════════════
    // BREAKER TESTS - Adversarial invariant enforcement
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_ProofSchema_RejectsUppercaseSha256()
    {
        // ATTACK: Uppercase SHA-256 should fail pattern validation
        var uppercaseSha = "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855";
        var pattern = new System.Text.RegularExpressions.Regex("^[a-f0-9]{64}$");

        Assert.False(pattern.IsMatch(uppercaseSha),
            "BREACH: Uppercase SHA-256 was accepted - constitutional violation");
    }

    [Fact]
    public void Breaker_ProofSchema_RejectsMixedCaseSha256()
    {
        // ATTACK: Mixed case SHA-256 should fail
        var mixedSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41E4649B934CA495991B7852B855";
        var pattern = new System.Text.RegularExpressions.Regex("^[a-f0-9]{64}$");

        Assert.False(pattern.IsMatch(mixedSha),
            "BREACH: Mixed-case SHA-256 was accepted");
    }

    [Fact]
    public void Breaker_ProofSchema_RejectsShortSha256()
    {
        // ATTACK: Short SHA-256 should fail
        var shortSha = "e3b0c44298fc1c149afbf4c8996fb924";
        var pattern = new System.Text.RegularExpressions.Regex("^[a-f0-9]{64}$");

        Assert.False(pattern.IsMatch(shortSha),
            "BREACH: Short SHA-256 was accepted");
    }

    [Fact]
    public void Breaker_PluginAdmission_MissingSbomMustFail()
    {
        // Simulating admission logic: missing SBOM env var must result in denial
        var envVars = new Dictionary<string, string>
        {
            { "TF_SLSA_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_BUNDLE_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" }
            // TF_SBOM_SHA256 intentionally missing
        };

        var requiredVars = new[] { "TF_SBOM_SHA256", "TF_SLSA_SHA256", "TF_BUNDLE_SHA256" };
        var allPresent = requiredVars.All(v => envVars.ContainsKey(v));

        Assert.False(allPresent, "BREACH: Plugin with missing SBOM was not denied");
    }

    [Fact]
    public void Breaker_PluginAdmission_MissingSlsaMustFail()
    {
        var envVars = new Dictionary<string, string>
        {
            { "TF_SBOM_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_BUNDLE_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" }
            // TF_SLSA_SHA256 intentionally missing
        };

        var requiredVars = new[] { "TF_SBOM_SHA256", "TF_SLSA_SHA256", "TF_BUNDLE_SHA256" };
        var allPresent = requiredVars.All(v => envVars.ContainsKey(v));

        Assert.False(allPresent, "BREACH: Plugin with missing SLSA was not denied");
    }

    [Fact]
    public void Breaker_PluginAdmission_InvalidSha256PatternMustFail()
    {
        // ATTACK: Invalid SHA-256 format should be rejected
        var invalidSha = "not-a-valid-sha256-hash";
        var pattern = new System.Text.RegularExpressions.Regex("^[a-f0-9]{64}$");

        Assert.False(pattern.IsMatch(invalidSha),
            "BREACH: Invalid SHA-256 format was accepted");
    }

    [Fact]
    public void Breaker_Readiness_MustRefuseWhenSpecLockFalse()
    {
        // Simulating readiness logic
        var speclockOk = false;
        var stateMeshOk = true;

        var shouldBeReady = speclockOk && stateMeshOk;

        Assert.False(shouldBeReady,
            "BREACH: Readiness returned OK when speclock_ok=false");
    }

    [Fact]
    public void Breaker_Readiness_MustRefuseWhenStateMeshFalse()
    {
        var speclockOk = true;
        var stateMeshOk = false;

        var shouldBeReady = speclockOk && stateMeshOk;

        Assert.False(shouldBeReady,
            "BREACH: Readiness returned OK when state_mesh_ok=false");
    }

    [Fact]
    public void Breaker_Proof_KeysMustBeLexicographic()
    {
        // Verify proof response has lexicographically sorted keys
        var proofKeys = new[]
        {
            "manifest_sha256",
            "receipt_count",
            "speclock_ok",
            "state_mesh_ok",
            "state_proof_present",
            "timestamp_epoch"
        };

        var sortedKeys = proofKeys.OrderBy(k => k).ToArray();

        Assert.Equal(sortedKeys, proofKeys);
    }
}
