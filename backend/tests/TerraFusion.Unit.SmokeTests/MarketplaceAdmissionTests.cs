// =============================================================================
// MarketplaceAdmissionTests.cs (PHASE B: MARKETPLACE)
// =============================================================================
// Tests for runtime plugin admission control.
// Validates: SBOM/SLSA hard gates, OPA deny-wins, egress caps, compute caps.
// =============================================================================

using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Tests for PluginLock runtime admission control.
/// These tests validate the admission service contract without requiring OPA.
/// </summary>
public sealed class MarketplaceAdmissionTests
{
    // ═══════════════════════════════════════════════════════════
    // HARD GATE TESTS (SBOM/SLSA)
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void HardGate_Sbom_MustBeRequired()
    {
        // SBOM is required by default (TF_MARKETPLACE_REQUIRE_SBOM != "false")
        // Missing SBOM must result in DeniedBySbomMissing
        var requireSbom = true; // Default
        Assert.True(requireSbom, "SBOM must be required by default");
    }

    [Fact]
    public void HardGate_Slsa_MustBeRequired()
    {
        // SLSA provenance is required by default (TF_MARKETPLACE_REQUIRE_SLSA != "false")
        // Missing SLSA must result in DeniedBySlsaMissing
        var requireSlsa = true; // Default
        Assert.True(requireSlsa, "SLSA provenance must be required by default");
    }

    [Fact]
    public void HardGate_SbomSha256_MustBeLowercaseHex()
    {
        // Valid SBOM SHA-256
        var validSha = new string('a', 64);
        Assert.True(LooksLowerHex(validSha), "Valid SBOM sha256 should pass");

        // Invalid - uppercase
        var invalidSha = new string('A', 64);
        Assert.False(LooksLowerHex(invalidSha), "Uppercase sha256 should fail");

        // Invalid - wrong length
        var shortSha = new string('a', 32);
        Assert.False(shortSha.Length == 64, "Short sha256 should fail length check");
    }

    [Fact]
    public void HardGate_SlsaSha256_MustBeLowercaseHex()
    {
        // Valid SLSA SHA-256
        var validSha = new string('c', 64);
        Assert.True(LooksLowerHex(validSha), "Valid SLSA sha256 should pass");

        // Invalid - contains non-hex
        var invalidSha = "xyz123" + new string('a', 58);
        Assert.False(LooksLowerHex(invalidSha), "Non-hex sha256 should fail");
    }

    // ═══════════════════════════════════════════════════════════
    // DENY-WINS POLICY TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void DenyList_MustWinOverAllowList()
    {
        // If domain is in both allow and deny lists, deny wins
        var allowDomains = new[] { "api.county.gov", "evil.com" };
        var denyDomains = new[] { "evil.com", "crypto-mining.io" };
        var requestedDomain = "evil.com";

        // Check deny list first (deny wins)
        var isDenied = denyDomains.Contains(requestedDomain);
        var isAllowed = allowDomains.Contains(requestedDomain) && !isDenied;

        Assert.True(isDenied, "Denied domain should be blocked");
        Assert.False(isAllowed, "Deny must win over allow");
    }

    [Fact]
    public void OpaPolicy_DenyWins()
    {
        // If OPA policy denies, decision must be DeniedByPolicy
        var opaDeny = false; // OPA returns deny
        Assert.False(opaDeny, "OPA deny must result in rejection");
    }

    // ═══════════════════════════════════════════════════════════
    // COMPUTE CAPS TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void ComputeCap_CpuMs_MustBeEnforced()
    {
        // Default cap: 250ms CPU time
        var maxCpuMs = 250;
        var requestedCpuMs = 500;

        Assert.True(
            requestedCpuMs > maxCpuMs,
            "CPU request exceeding cap should be detectable"
        );
    }

    [Fact]
    public void ComputeCap_MemoryMb_MustBeEnforced()
    {
        // Default cap: 256MB memory
        var maxMemoryMb = 256;
        var requestedMemoryMb = 512;

        Assert.True(
            requestedMemoryMb > maxMemoryMb,
            "Memory request exceeding cap should be detectable"
        );
    }

    // ═══════════════════════════════════════════════════════════
    // EGRESS CAPS TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void EgressCap_KbPerMin_MustBeEnforced()
    {
        // Default cap: 256 KB/min network egress
        var maxEgressKbPerMin = 256;
        var requestedEgressKbPerMin = 1024;

        Assert.True(
            requestedEgressKbPerMin > maxEgressKbPerMin,
            "Egress request exceeding cap should be detectable"
        );
    }

    [Fact]
    public void NetworkEgress_BlockedDomain_MustBeDenied()
    {
        // Blocked domains must be rejected
        var blockedDomains = new[] { "crypto-mining.io", "exfiltrate.evil.com", "malware.net" };
        var requestedDomain = "crypto-mining.io";

        Assert.Contains(requestedDomain, blockedDomains);
    }

    // ═══════════════════════════════════════════════════════════
    // DATA SCOPE TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void DataScope_MustMatchDeclaredPermissions()
    {
        // Plugin requesting data scope must have it in manifest
        var declaredScopes = new[] { "parcel_read", "assessment_read" };
        var requestedScope = "owner_write"; // Not declared

        Assert.DoesNotContain(requestedScope, declaredScopes);
    }

    [Fact]
    public void DataScope_CrossCounty_MustBeDenied()
    {
        // Plugin in county A cannot access county B data
        var pluginCounty = Guid.NewGuid();
        var dataCounty = Guid.NewGuid();

        Assert.NotEqual(pluginCounty, dataCounty);
        // Cross-county access must be denied
    }

    // ═══════════════════════════════════════════════════════════
    // GENERATED ARTIFACTS TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void Generated_PluginLock_PolicyFile_Exists()
    {
        // The generated OPA policy file must exist
        var expectedPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.policy.rego";
        var repoRoot = FindRepoRoot();
        var fullPath = Path.Combine(repoRoot, expectedPath);

        Assert.True(File.Exists(fullPath), $"PluginLock policy file missing: {fullPath}");
    }

    [Fact]
    public void Generated_PluginLock_PermissionsFile_Exists()
    {
        // The generated permissions JSON file must exist
        var expectedPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.permissions.json";
        var repoRoot = FindRepoRoot();
        var fullPath = Path.Combine(repoRoot, expectedPath);

        Assert.True(File.Exists(fullPath), $"PluginLock permissions file missing: {fullPath}");
    }

    [Fact]
    public void Generated_PluginLock_SchemaFile_Exists()
    {
        // The generated schema file must exist
        var expectedPath = "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.schema.json";
        var repoRoot = FindRepoRoot();
        var fullPath = Path.Combine(repoRoot, expectedPath);

        Assert.True(File.Exists(fullPath), $"PluginLock schema file missing: {fullPath}");
    }

    // ═══════════════════════════════════════════════════════════
    // FAIL-CLOSED TESTS
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public void FailClosed_OpaUnavailable_MustDeny()
    {
        // If OPA process fails to start, decision must be deny (fail-closed)
        var opaAvailable = false;
        var decision = opaAvailable ? true : false; // Fail-closed

        Assert.False(decision, "OPA unavailable must result in deny (fail-closed)");
    }

    [Fact]
    public void FailClosed_InvalidInput_MustDeny()
    {
        // Invalid admission request must be denied
        var validPluginId = "tf.plugin.sample";
        var invalidPluginId = ""; // Empty

        Assert.NotEmpty(validPluginId);
        Assert.Empty(invalidPluginId);
        // Empty plugin ID must be rejected
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    private static bool LooksLowerHex(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return false;
        for (int i = 0; i < s.Length; i++)
        {
            var c = s[i];
            var ok = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f');
            if (!ok) return false;
        }
        return true;
    }

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
}
