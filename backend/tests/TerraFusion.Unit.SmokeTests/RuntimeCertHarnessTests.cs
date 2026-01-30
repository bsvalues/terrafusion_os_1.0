using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Tests for the Runtime Certification Harness spec and configuration.
/// Ensures the cert harness is properly configured for runtimecontract.v1 enforcement.
/// </summary>
public sealed class RuntimeCertHarnessTests
{
    private static readonly string RepoRoot = FindRepoRoot();
    private const string CertSpecPath = "tools/runtime-cert/cert.spec.json";
    private const string CertScriptPath = "tools/runtime-cert/cert.sh";
    private const string CertPythonPath = "tools/runtime-cert/runtime-cert.py";

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "tools", "runtime-cert")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE EXISTENCE TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void CertSpec_File_Exists()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        Assert.True(File.Exists(path), $"cert.spec.json missing: {path}");
    }

    [Fact]
    public void CertScript_Bash_Exists()
    {
        var path = Path.Combine(RepoRoot, CertScriptPath);
        Assert.True(File.Exists(path), $"cert.sh missing: {path}");
    }

    [Fact]
    public void CertScript_Python_Exists()
    {
        var path = Path.Combine(RepoRoot, CertPythonPath);
        Assert.True(File.Exists(path), $"runtime-cert.py missing: {path}");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SPEC STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void CertSpec_HasRequiredTopLevelFields()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var spec = JsonNode.Parse(json)!;

        Assert.NotNull(spec["version"]);
        Assert.NotNull(spec["spec_lock"]);
        Assert.NotNull(spec["checks"]);
        Assert.NotNull(spec["exit_codes"]);
    }

    [Fact]
    public void CertSpec_ReferencesRuntimeContractV1()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var specLock = spec["spec_lock"]!.GetValue<string>();

        Assert.Equal("runtimecontract.v1", specLock);
    }

    [Fact]
    public void CertSpec_HasCriticalChecks()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var checks = spec["checks"]!.AsArray();

        var checkIds = checks.Select(c => c!["id"]!.GetValue<string>()).ToHashSet();

        // Critical checks per runtimecontract.v1
        Assert.Contains("readiness_endpoint", checkIds);
        Assert.Contains("proof_endpoint", checkIds);
        Assert.Contains("speclock_status", checkIds);
        Assert.Contains("state_mesh_status", checkIds);
        Assert.Contains("metrics_endpoint", checkIds);
    }

    [Fact]
    public void CertSpec_ReadinessCheck_IsCritical()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var checks = spec["checks"]!.AsArray();

        var readinessCheck = checks.FirstOrDefault(c =>
            c!["id"]!.GetValue<string>() == "readiness_endpoint");

        Assert.NotNull(readinessCheck);
        Assert.Equal("critical", readinessCheck!["severity"]!.GetValue<string>());
    }

    [Fact]
    public void CertSpec_SpecLockStatus_IsCritical()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var checks = spec["checks"]!.AsArray();

        var speclockCheck = checks.FirstOrDefault(c =>
            c!["id"]!.GetValue<string>() == "speclock_status");

        Assert.NotNull(speclockCheck);
        Assert.Equal("critical", speclockCheck!["severity"]!.GetValue<string>());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTITUTIONAL INVARIANTS TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void CertSpec_ConstitutionalInvariants_FailClosed()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var invariants = spec["constitutional_invariants"]!;

        Assert.True(invariants["fail_closed"]!.GetValue<bool>(),
            "fail_closed must be true");
    }

    [Fact]
    public void CertSpec_ConstitutionalInvariants_DenyBeatsAllow()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var invariants = spec["constitutional_invariants"]!;

        Assert.True(invariants["deny_beats_allow"]!.GetValue<bool>(),
            "deny_beats_allow must be true");
    }

    [Fact]
    public void CertSpec_ConstitutionalInvariants_DeterministicProofs()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var invariants = spec["constitutional_invariants"]!;

        Assert.True(invariants["deterministic_proofs"]!.GetValue<bool>(),
            "deterministic_proofs must be true");
    }

    [Fact]
    public void CertSpec_ConstitutionalInvariants_LowercaseSha256Only()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var invariants = spec["constitutional_invariants"]!;

        Assert.True(invariants["lowercase_sha256_only"]!.GetValue<bool>(),
            "lowercase_sha256_only must be true");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXIT CODE TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void CertSpec_ExitCodes_ZeroIsCertified()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var exitCodes = spec["exit_codes"]!;

        var code0 = exitCodes["0"]!.GetValue<string>();
        Assert.Contains("CERTIFIED", code0);
    }

    [Fact]
    public void CertSpec_ExitCodes_OneIsFailed()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var exitCodes = spec["exit_codes"]!;

        var code1 = exitCodes["1"]!.GetValue<string>();
        Assert.Contains("FAILED", code1);
    }

    [Fact]
    public void CertSpec_ExitCodes_TwoIsUnreachable()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var exitCodes = spec["exit_codes"]!;

        var code2 = exitCodes["2"]!.GetValue<string>();
        Assert.Contains("UNREACHABLE", code2);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROOF ENDPOINT CHECK TESTS
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void CertSpec_ProofCheck_HasRequiredFields()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var checks = spec["checks"]!.AsArray();

        var proofCheck = checks.FirstOrDefault(c =>
            c!["id"]!.GetValue<string>() == "proof_endpoint");

        Assert.NotNull(proofCheck);

        var requiredFields = proofCheck!["required_fields"]!.AsArray()
            .Select(f => f!.GetValue<string>()).ToHashSet();

        // Per runtimecontract.v1
        Assert.Contains("speclock_ok", requiredFields);
        Assert.Contains("state_mesh_ok", requiredFields);
        Assert.Contains("manifest_sha256", requiredFields);
        Assert.Contains("timestamp_epoch", requiredFields);
        Assert.Contains("receipt_count", requiredFields);
        Assert.Contains("state_proof_present", requiredFields);
    }

    [Fact]
    public void CertSpec_Sha256Check_HasCorrectPattern()
    {
        var path = Path.Combine(RepoRoot, CertSpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var checks = spec["checks"]!.AsArray();

        var sha256Check = checks.FirstOrDefault(c =>
            c!["id"]!.GetValue<string>() == "sha256_format");

        Assert.NotNull(sha256Check);
        Assert.Equal("^[a-f0-9]{64}$", sha256Check!["pattern"]!.GetValue<string>());
    }
}
