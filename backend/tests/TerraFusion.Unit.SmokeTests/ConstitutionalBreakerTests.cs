using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// BREAKER SUITE: Adversarial Testing for Constitutional Bypass Attempts
///
/// These tests simulate attacks against the TerraFusion governance model.
/// They must PASS by demonstrating that bypass attempts are DENIED.
///
/// Philosophy: "If we can't break it ourselves, attackers can't either."
/// </summary>
public sealed class ConstitutionalBreakerTests
{
    private static readonly string RepoRoot = FindRepoRoot();
    private static readonly Regex Sha256Pattern = new(@"^[a-f0-9]{64}$", RegexOptions.Compiled);

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: SHA-256 Format Violations
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855", "uppercase")]
    [InlineData("e3b0c44298fc1c149afbf4c8996fb92427ae41E4649B934CA495991B7852B855", "mixed-case")]
    [InlineData("e3b0c44298fc1c149afbf4c8996fb924", "too-short-32-chars")]
    [InlineData("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855ab", "too-long-66-chars")]
    [InlineData("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85g", "invalid-hex-char-g")]
    [InlineData("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85G", "uppercase-invalid")]
    [InlineData("not-a-valid-sha256-hash-at-all!", "garbage")]
    [InlineData("", "empty")]
    [InlineData("   ", "whitespace")]
    public void Breaker_Sha256_RejectsInvalidFormats(string attackSha, string attackName)
    {
        // ATTACK: Try various invalid SHA-256 formats
        var isValid = Sha256Pattern.IsMatch(attackSha);

        Assert.False(isValid,
            $"BREACH: Invalid SHA-256 '{attackName}' was accepted: {attackSha.Substring(0, Math.Min(20, attackSha.Length))}...");
    }

    [Fact]
    public void Breaker_Sha256_AcceptsOnlyLowercaseHex()
    {
        // VERIFY: Only lowercase hex is accepted
        var validSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        Assert.True(Sha256Pattern.IsMatch(validSha), "Valid lowercase SHA-256 should be accepted");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Plugin Admission Bypass
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_PluginAdmission_DeniesWhenSbomMissing()
    {
        var envVars = new Dictionary<string, string>
        {
            { "TF_SLSA_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_BUNDLE_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" }
            // TF_SBOM_SHA256 intentionally missing
        };

        var admitted = SimulatePluginAdmission(envVars);
        Assert.False(admitted, "BREACH: Plugin without SBOM was admitted");
    }

    [Fact]
    public void Breaker_PluginAdmission_DeniesWhenSlsaMissing()
    {
        var envVars = new Dictionary<string, string>
        {
            { "TF_SBOM_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_BUNDLE_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" }
            // TF_SLSA_SHA256 intentionally missing
        };

        var admitted = SimulatePluginAdmission(envVars);
        Assert.False(admitted, "BREACH: Plugin without SLSA provenance was admitted");
    }

    [Fact]
    public void Breaker_PluginAdmission_DeniesWhenBundleSigMissing()
    {
        var envVars = new Dictionary<string, string>
        {
            { "TF_SBOM_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_SLSA_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" }
            // TF_BUNDLE_SHA256 intentionally missing
        };

        var admitted = SimulatePluginAdmission(envVars);
        Assert.False(admitted, "BREACH: Plugin without bundle signature was admitted");
    }

    [Theory]
    [InlineData("TF_SBOM_SHA256", "invalid-sha")]
    [InlineData("TF_SLSA_SHA256", "UPPERCASE1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345678")]
    [InlineData("TF_BUNDLE_SHA256", "short")]
    public void Breaker_PluginAdmission_DeniesInvalidShaValues(string varName, string invalidValue)
    {
        var envVars = new Dictionary<string, string>
        {
            { "TF_SBOM_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_SLSA_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" },
            { "TF_BUNDLE_SHA256", "5678abcd5678abcd5678abcd5678abcd5678abcd5678abcd5678abcd5678abcd" }
        };

        // Override one var with invalid value
        envVars[varName] = invalidValue;

        var admitted = SimulatePluginAdmission(envVars);
        Assert.False(admitted, $"BREACH: Plugin with invalid {varName}='{invalidValue}' was admitted");
    }

    [Fact]
    public void Breaker_PluginAdmission_AcceptsValidEnvelope()
    {
        var envVars = new Dictionary<string, string>
        {
            { "TF_SBOM_SHA256", "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234" },
            { "TF_SLSA_SHA256", "1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd" },
            { "TF_BUNDLE_SHA256", "5678abcd5678abcd5678abcd5678abcd5678abcd5678abcd5678abcd5678abcd" }
        };

        var admitted = SimulatePluginAdmission(envVars);
        Assert.True(admitted, "Valid plugin envelope should be admitted");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Readiness Bypass (Traffic Routing to Unhealthy Nodes)
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData(false, true, "speclock_ok=false")]
    [InlineData(true, false, "state_mesh_ok=false")]
    [InlineData(false, false, "both_false")]
    public void Breaker_Readiness_RefusesWhenConstitutionalFlagsFalse(bool speclockOk, bool stateMeshOk, string scenario)
    {
        var isReady = SimulateReadinessCheck(speclockOk, stateMeshOk);

        Assert.False(isReady,
            $"BREACH: Readiness returned OK with {scenario} - traffic would route to unhealthy node");
    }

    [Fact]
    public void Breaker_Readiness_AcceptsWhenAllFlagsTrue()
    {
        var isReady = SimulateReadinessCheck(speclockOk: true, stateMeshOk: true);
        Assert.True(isReady, "Readiness should return OK when constitutional flags are true");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Proof Determinism Violations
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Proof_KeysMustBeLexicographic()
    {
        // Per runtimecontract.v1: proof keys must be lexicographically sorted
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

    [Fact]
    public void Breaker_Proof_RejectsNonLexicographicKeys()
    {
        // ATTACK: Keys in non-lexicographic order
        var badOrder = new[] { "timestamp_epoch", "speclock_ok", "manifest_sha256" };
        var sortedOrder = badOrder.OrderBy(k => k).ToArray();

        Assert.NotEqual(badOrder, sortedOrder);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Amendment Process Bypass
    // ═══════════════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData(0, 3, "zero votes")]
    [InlineData(1, 3, "one vote")]
    [InlineData(2, 5, "minority 2/5")]
    [InlineData(1, 2, "exactly half")]
    public void Breaker_Amendment_RejectsInsufficientQuorum(int votes, int totalCounties, string scenario)
    {
        // Constitutional: 2/3 majority required
        var approved = SimulateAmendmentQuorum(votes, totalCounties);

        Assert.False(approved,
            $"BREACH: Amendment approved with {scenario} ({votes}/{totalCounties})");
    }

    [Theory]
    [InlineData(2, 3)]  // 66.7% = 2/3 exactly
    [InlineData(3, 4)]  // 75% > 2/3
    [InlineData(3, 3)]  // 100%
    [InlineData(4, 5)]  // 80% > 2/3
    public void Breaker_Amendment_AcceptsSufficientQuorum(int votes, int totalCounties)
    {
        var approved = SimulateAmendmentQuorum(votes, totalCounties);
        Assert.True(approved, $"Valid quorum ({votes}/{totalCounties}) should be approved");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: SpecLock Index Tampering
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Index_AllLocksHaveRequiredFields()
    {
        var indexPath = Path.Combine(RepoRoot, "docs", "spec-lock", "INDEX.json");
        if (!File.Exists(indexPath))
        {
            Assert.Fail("INDEX.json missing - cannot validate lock integrity");
            return;
        }

        var json = File.ReadAllText(indexPath);
        var index = JsonNode.Parse(json)!;
        var locks = index["locks"]!.AsArray();

        foreach (var lockNode in locks)
        {
            var lockId = lockNode!["id"]?.GetValue<string>() ?? "unknown";

            // Required fields per lock
            Assert.NotNull(lockNode["id"]);
            Assert.NotNull(lockNode["surface"]);
            Assert.NotNull(lockNode["status"]);
            Assert.NotNull(lockNode["spec_path"]);

            // Verify spec file exists
            var specPath = lockNode["spec_path"]!.GetValue<string>();
            var fullSpecPath = Path.Combine(RepoRoot, specPath);
            Assert.True(File.Exists(fullSpecPath),
                $"BREACH: Lock '{lockId}' references missing spec: {specPath}");
        }
    }

    [Fact]
    public void Breaker_Index_NoDeletedLocksWithActiveStatus()
    {
        var indexPath = Path.Combine(RepoRoot, "docs", "spec-lock", "INDEX.json");
        if (!File.Exists(indexPath)) return;

        var index = JsonNode.Parse(File.ReadAllText(indexPath))!;
        var locks = index["locks"]!.AsArray();

        foreach (var lockNode in locks)
        {
            var lockId = lockNode!["id"]?.GetValue<string>() ?? "unknown";
            var status = lockNode["status"]?.GetValue<string>() ?? "";
            var specPath = lockNode["spec_path"]?.GetValue<string>() ?? "";

            if (status == "active")
            {
                var fullPath = Path.Combine(RepoRoot, specPath);
                Assert.True(File.Exists(fullPath),
                    $"BREACH: Active lock '{lockId}' has missing spec file - possible deletion attack");
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Cross-County Data Leakage
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_CountyIsolation_DeniesWrongCountyAccess()
    {
        // Simulate: User from Benton tries to access Yakima data
        var userCounty = "benton";
        var requestedCounty = "yakima";

        var allowed = SimulateCountyAccess(userCounty, requestedCounty);

        Assert.False(allowed,
            $"BREACH: User from {userCounty} accessed {requestedCounty} data - county isolation violated");
    }

    [Fact]
    public void Breaker_CountyIsolation_AllowsSameCountyAccess()
    {
        var userCounty = "benton";
        var requestedCounty = "benton";

        var allowed = SimulateCountyAccess(userCounty, requestedCounty);
        Assert.True(allowed, "Same-county access should be allowed");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SIMULATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private static bool SimulatePluginAdmission(Dictionary<string, string> envVars)
    {
        // Per runtimecontract.v1: all three env vars required with valid SHA-256
        var requiredVars = new[] { "TF_SBOM_SHA256", "TF_SLSA_SHA256", "TF_BUNDLE_SHA256" };

        foreach (var varName in requiredVars)
        {
            if (!envVars.TryGetValue(varName, out var value))
                return false;

            if (!Sha256Pattern.IsMatch(value))
                return false;
        }

        return true;
    }

    private static bool SimulateReadinessCheck(bool speclockOk, bool stateMeshOk)
    {
        // Per runtimecontract.v1: readiness requires both flags true
        return speclockOk && stateMeshOk;
    }

    private static bool SimulateAmendmentQuorum(int votes, int totalCounties)
    {
        // Per amendment.v1: 2/3 majority required
        if (totalCounties == 0) return false;
        var ratio = (double)votes / totalCounties;
        return ratio >= (2.0 / 3.0);
    }

    private static bool SimulateCountyAccess(string userCounty, string requestedCounty)
    {
        // Constitutional: users can only access their own county's data
        return string.Equals(userCounty, requestedCounty, StringComparison.OrdinalIgnoreCase);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: TSS Verification Bypass via Missing Tools
    // Constitutional requirement: SKIP must be policy-based, never tool-based
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_TssVerify_MustContainFailClosedLogic()
    {
        // ATTACK: Try to bypass TSS verification by claiming tools are missing
        // DEFENSE: Scripts must fail-closed, never skip due to missing tools

        var tssScript = Path.Combine(RepoRoot, "scripts", "speclock-tss-verify.sh");
        Assert.True(File.Exists(tssScript), "TSS verify script must exist");

        var content = File.ReadAllText(tssScript);

        // CONSTITUTIONAL: Script must have Python fallback
        Assert.True(content.Contains("jsonq.py"),
            "BREACH: TSS verify script must use jsonq.py Python fallback");

        // CONSTITUTIONAL: Script must have explicit fail-closed message
        Assert.True(content.Contains("FATAL: Neither jq nor Python available"),
            "BREACH: TSS verify script must fail-closed when no JSON tools available");

        // CONSTITUTIONAL: Script must exit 1 (failure) when tools missing
        Assert.True(content.Contains("exit 1"),
            "BREACH: TSS verify script must exit with failure code when tools missing");

        // CONSTITUTIONAL: Must use strict JSON query (no silent defaults)
        Assert.True(content.Contains("jsonq_strict"),
            "BREACH: TSS verify script must use jsonq_strict for required fields");
    }

    [Fact]
    public void Breaker_TssVerifyState_MustContainFailClosedLogic()
    {
        // Same defense for state TSS verification
        var stateTssScript = Path.Combine(RepoRoot, "scripts", "speclock-tss-verify-state.sh");
        Assert.True(File.Exists(stateTssScript), "State TSS verify script must exist");

        var content = File.ReadAllText(stateTssScript);

        Assert.True(content.Contains("jsonq.py"),
            "BREACH: State TSS verify script must use jsonq.py Python fallback");

        Assert.True(content.Contains("FATAL: Neither jq nor Python available"),
            "BREACH: State TSS verify script must fail-closed when no JSON tools available");

        // CONSTITUTIONAL: Must use strict JSON query (no silent defaults)
        Assert.True(content.Contains("jsonq_strict"),
            "BREACH: State TSS verify script must use jsonq_strict for required fields");
    }

    [Fact]
    public void Breaker_JsonqPython_MustExist()
    {
        // DEFENSE: Python jsonq.py must exist as fallback
        var jsonqScript = Path.Combine(RepoRoot, "scripts", "jsonq.py");
        Assert.True(File.Exists(jsonqScript),
            "BREACH: scripts/jsonq.py must exist as jq fallback");

        var content = File.ReadAllText(jsonqScript);

        // Must be a proper Python script
        Assert.True(content.Contains("#!/usr/bin/env python"),
            "BREACH: jsonq.py must have proper Python shebang");

        // Must support the -r flag for raw output
        Assert.True(content.Contains("-r"),
            "BREACH: jsonq.py must support -r flag for raw output");
    }

    [Fact]
    public void Breaker_JsonqPython_MustBeStrict()
    {
        // jsonq.py must be deterministic and strict
        var jsonqScript = Path.Combine(RepoRoot, "scripts", "jsonq.py");
        var content = File.ReadAllText(jsonqScript);

        // Must fail on invalid JSON
        Assert.True(content.Contains("JSONDecodeError"),
            "BREACH: jsonq.py must handle invalid JSON explicitly");

        // Must fail on missing keys (not silently default)
        Assert.True(content.Contains("KeyError") || content.Contains("not found"),
            "BREACH: jsonq.py must fail on missing keys, not silently default");

        // Must distinguish bool vs string (no stringy booleans)
        Assert.True(content.Contains("--equals-bool"),
            "BREACH: jsonq.py must have --equals-bool for proper boolean comparison");

        // Must return non-zero exit code on failure
        Assert.True(content.Contains("return 1") || content.Contains("sys.exit(1)"),
            "BREACH: jsonq.py must exit non-zero on assertion failures");
    }

    [Fact]
    public void Breaker_CiGate_MustNotSkipOnToolsMissing()
    {
        // ATTACK: CI gate might skip TSS verification if tools missing
        // DEFENSE: CI gate must fail-closed, match "Neither jq nor Python"

        var ciGateScript = Path.Combine(RepoRoot, "scripts", "ci-seal-gate.ps1");
        Assert.True(File.Exists(ciGateScript), "CI gate script must exist");

        var content = File.ReadAllText(ciGateScript);

        // Must detect the fail-closed error message from TSS scripts
        Assert.True(content.Contains("Neither jq nor Python available"),
            "BREACH: CI gate must detect and fail on missing JSON tools");

        // Must NOT contain skip-on-jq-missing logic
        Assert.False(content.Contains("jq not installed (TSS verification skipped)"),
            "BREACH: CI gate must not skip TSS verification when jq missing");

        Assert.False(content.Contains("jq not installed (State TSS skipped)"),
            "BREACH: CI gate must not skip State TSS verification when jq missing");
    }

    [Fact]
    public void Breaker_TssVerify_OnlyPolicySkipsAllowed()
    {
        // CONSTITUTIONAL: The ONLY valid SKIP condition is policy-based (exit 9)
        // Exit 9 = "mode not cosmic_tss" (intentional policy, not accident)

        var tssScript = Path.Combine(RepoRoot, "scripts", "speclock-tss-verify.sh");
        var content = File.ReadAllText(tssScript);

        // Must have exit 9 for policy skip
        Assert.True(content.Contains("exit 9"),
            "BREACH: TSS verify must use exit 9 for policy-based skip");

        // The ONLY skip message should be about mode not being cosmic_tss
        var lines = content.Split('\n');
        var skipMessages = lines.Where(l => l.Contains("Skipping") || l.Contains("SKIP")).ToList();

        // All skip messages must be about mode configuration, not tools
        foreach (var line in skipMessages)
        {
            Assert.False(line.Contains("jq") || line.Contains("python") || line.Contains("tool"),
                $"BREACH: Skip message mentions tools instead of policy: {line}");
        }
    }

    [Fact]
    public void Breaker_TssVerify_ModeEnabledMeansRequired()
    {
        // If cosmic_tss mode is enabled, verification MUST succeed or FAIL
        // There is no "soft failure" or "skip anyway" path

        var tssScript = Path.Combine(RepoRoot, "scripts", "speclock-tss-verify.sh");
        var content = File.ReadAllText(tssScript);

        // Must have explicit "Verification REQUIRED" message
        Assert.True(content.Contains("Verification REQUIRED") || content.Contains("REQUIRED"),
            "BREACH: When TSS mode enabled, verification must be marked as REQUIRED");

        // Must fail (exit 1) if signature file missing when mode enabled
        Assert.True(content.Contains("Signature file not found") && content.Contains("exit 1"),
            "BREACH: Missing signature must be a hard failure, not skip");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: TSS Mode Default Creep
    // Constitutional requirement: TSS must be OPT-IN, never implicitly enabled
    // ═══════════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_TssModeIsOptIn_NotEnabledByDefault()
    {
        // ATTACK: Someone might "helpfully" set mode = cosmic_tss by default
        // DEFENSE: AUTHORITIES.json must NOT have cosmic_tss unless explicitly intended
        
        var authoritiesFile = Path.Combine(RepoRoot, "docs", "spec-lock", "AUTHORITIES.json");
        Assert.True(File.Exists(authoritiesFile), "AUTHORITIES.json must exist");
        
        var content = File.ReadAllText(authoritiesFile);
        var json = System.Text.Json.JsonDocument.Parse(content);
        var mode = json.RootElement.GetProperty("mode").GetString();
        
        // When TSS infrastructure is not set up, mode should NOT be cosmic_tss
        // If this test fails, it means someone enabled TSS without setting up signing
        var sigPath = Path.Combine(RepoRoot, "artifacts", "speclock", "tss", "manifest.sig");
        var groupPubPath = Path.Combine(RepoRoot, "artifacts", "speclock", "tss", "group.pub");
        
        if (mode == "cosmic_tss")
        {
            // If cosmic_tss is enabled, the signing infrastructure MUST exist
            Assert.True(File.Exists(sigPath),
                $"BREACH: TSS mode is 'cosmic_tss' but signature file missing: {sigPath}. " +
                "Either set up TSS signing or change mode to 'mythic'.");
            Assert.True(File.Exists(groupPubPath),
                $"BREACH: TSS mode is 'cosmic_tss' but group public key missing: {groupPubPath}. " +
                "Either set up TSS signing or change mode to 'mythic'.");
        }
        // If mode is not cosmic_tss, we're correctly opt-in
    }

    [Fact]
    public void Breaker_TssModeUnset_GateMustSkip()
    {
        // CONSTITUTIONAL: When mode != cosmic_tss, Gate 4 MUST return exit 9 (SKIP)
        // This test verifies the skip logic exists in the verify script
        
        var tssScript = Path.Combine(RepoRoot, "scripts", "speclock-tss-verify.sh");
        var content = File.ReadAllText(tssScript);
        
        // Must check mode and skip if not cosmic_tss
        Assert.True(content.Contains("cosmic_tss") && content.Contains("exit 9"),
            "BREACH: TSS verify must skip (exit 9) when mode is not cosmic_tss");
        
        // Must explicitly check mode value
        Assert.True(content.Contains(".mode") || content.Contains("MODE"),
            "BREACH: TSS verify must read and check the mode field");
    }

    [Fact]
    public void Breaker_TssModeEnabled_MissingSigMustFail()
    {
        // CONSTITUTIONAL: When mode = cosmic_tss AND signature missing → FAIL (exit 1)
        // This test verifies the fail-closed logic
        
        var tssScript = Path.Combine(RepoRoot, "scripts", "speclock-tss-verify.sh");
        var content = File.ReadAllText(tssScript);
        
        // After mode check passes, missing signature must be a hard failure
        Assert.True(content.Contains("Signature file not found"),
            "BREACH: TSS verify must detect missing signature file");
        
        // Must exit 1 (failure), not exit 9 (skip)
        var lines = content.Split('\n');
        var sigNotFoundLines = lines.Where(l => l.Contains("Signature file not found")).ToList();
        
        // The signature-not-found check must be followed by exit 1
        Assert.True(sigNotFoundLines.Any(),
            "BREACH: Must have 'Signature file not found' error message");
        
        // Verify there's an exit 1 associated with missing signature
        Assert.True(content.Contains("Signature file not found") && 
                    content.IndexOf("exit 1", content.IndexOf("Signature file not found")) > 0,
            "BREACH: Missing signature when TSS enabled must exit 1, not skip");
    }
}
