// =============================================================================
// FinalSealBreakerTests (CONSTITUTIONAL INVARIANTS)
// =============================================================================
// These tests verify the FINAL SEAL enforcement posture.
// If any test fails, the system is not in a sealed state.
// =============================================================================

using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// FINAL SEAL breaker tests.
/// These tests verify the constitutional invariants of the sealed system.
/// </summary>
public sealed class FinalSealBreakerTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null && !File.Exists(Path.Combine(dir, "docs", "spec-lock", "INDEX.json")))
        {
            dir = Directory.GetParent(dir)?.FullName;
        }
        return dir ?? Directory.GetCurrentDirectory();
    }

    private string ResolvePath(string relativePath)
        => Path.Combine(RepoRoot, relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));

    // ─────────────────────────────────────────────────────────────────────────────
    // SEAL: Inscription Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Sealed_Inscription_Must_Exist()
    {
        var path = ResolvePath("SEALED.md");
        Assert.True(File.Exists(path),
            "❌ SEALED.md inscription MUST exist for final seal");
    }

    [Fact]
    public void Sealed_Inscription_Contains_Governance_Law()
    {
        var path = ResolvePath("SEALED.md");
        if (!File.Exists(path))
        {
            Assert.Fail("SEALED.md not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("cryptographic law", content);
        Assert.Contains("SpecLock", content);
        Assert.Contains("quorum", content);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SEAL: Auto-Rollback Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AutoRollback_Service_Must_Exist()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/AutoRollbackService.cs");
        Assert.True(File.Exists(path),
            "❌ AutoRollbackService.cs MUST exist for auto-rollback");
    }

    [Fact]
    public void AutoRollback_Service_Has_Frozen_Flag()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/AutoRollbackService.cs");
        if (!File.Exists(path))
        {
            Assert.Fail("AutoRollbackService.cs not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("public static volatile bool Frozen", content);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SEAL: Interstate Authority Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Interstate_Authority_Must_Exist()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.interstate.json");
        Assert.True(File.Exists(path),
            "❌ AUTHORITIES.interstate.json MUST exist for multi-state expansion gate");
    }

    [Fact]
    public void Interstate_Authority_Has_Vendor_Exclusion()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.interstate.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.interstate.json not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("vendor_exclusion", content);
        Assert.Contains("Vendors cannot sign at the interstate level", content);
    }

    [Fact]
    public void Interstate_Authority_Has_Dual_Quorum_Requirement()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.interstate.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.interstate.json not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("dual_quorum", content);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SEAL: CI Gate Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void CI_Seal_Gate_Must_Exist()
    {
        var path = ResolvePath("scripts/ci-seal-gate.sh");
        Assert.True(File.Exists(path),
            "❌ ci-seal-gate.sh MUST exist for CI enforcement");
    }

    [Fact]
    public void CI_Seal_Gate_Has_All_Gates()
    {
        var path = ResolvePath("scripts/ci-seal-gate.sh");
        if (!File.Exists(path))
        {
            Assert.Fail("ci-seal-gate.sh not found");
            return;
        }

        var content = File.ReadAllText(path);
        // Must have all 7 gates
        Assert.Contains("Gate 1", content);
        Assert.Contains("Gate 2", content);
        Assert.Contains("Gate 3", content);
        Assert.Contains("Gate 4", content);
        Assert.Contains("Gate 5", content);
        Assert.Contains("Gate 6", content);
        Assert.Contains("Gate 7", content);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SEAL: Citizen Verification Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void CitizenVerifiable_Service_Must_Exist()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/CitizenVerifiableReportService.cs");
        Assert.True(File.Exists(path),
            "❌ CitizenVerifiableReportService.cs MUST exist for citizen verification");
    }

    [Fact]
    public void CitizenVerifiable_Service_Has_Bundle_Generation()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/CitizenVerifiableReportService.cs");
        if (!File.Exists(path))
        {
            Assert.Fail("CitizenVerifiableReportService.cs not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("GenerateBundleAsync", content);
        Assert.Contains("VerifyBundleAsync", content);
        Assert.Contains("OfflineVerification", content);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SEAL: Constitutional Properties
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void System_Has_No_Admin_Bypass()
    {
        // Search for dangerous patterns in critical files
        var criticalFiles = new[]
        {
            "backend/src/TerraFusion.API/Services/SpecLock/SpecLockGuardHostedService.cs",
            "backend/src/TerraFusion.API/Services/SpecLock/StateMeshGuardHostedService.cs"
        };

        foreach (var relativePath in criticalFiles)
        {
            var path = ResolvePath(relativePath);
            if (!File.Exists(path)) continue;

            var content = File.ReadAllText(path);
            // Should not have dangerous bypass patterns
            Assert.DoesNotContain("ADMIN_BYPASS", content);
            Assert.DoesNotContain("SKIP_VERIFICATION", content);
            Assert.DoesNotContain("FORCE_PASS", content);
        }
    }

    [Fact]
    public void All_Authority_Files_Exist()
    {
        var authorities = new[]
        {
            "docs/spec-lock/AUTHORITIES.json",
            "docs/spec-lock/AUTHORITIES.state.json",
            "docs/spec-lock/AUTHORITIES.interstate.json"
        };

        foreach (var relativePath in authorities)
        {
            var path = ResolvePath(relativePath);
            Assert.True(File.Exists(path),
                $"❌ Authority file missing: {relativePath}");
        }
    }
}
