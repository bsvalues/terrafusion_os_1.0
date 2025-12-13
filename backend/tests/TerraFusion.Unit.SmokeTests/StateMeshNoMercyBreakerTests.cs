// =============================================================================
// StateMeshNoMercyBreakerTests (FAIL-CLOSED EXPECTATIONS)
// =============================================================================
// These tests verify the NO MERCY enforcement posture.
// If any test fails, the system is not in a deployable state.
// =============================================================================

using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// NO MERCY breaker tests for state mesh enforcement.
/// These tests verify the absolute requirements for deployment.
/// </summary>
public sealed class StateMeshNoMercyBreakerTests
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
    // NO MERCY: Authority File Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Authorities_State_File_Must_Exist()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        Assert.True(File.Exists(path),
            "❌ AUTHORITIES.state.json MUST exist for state mesh enforcement");
    }

    [Fact]
    public void Authorities_State_File_Must_Have_Mesh_Config()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.state.json not found");
            return;
        }

        var json = File.ReadAllText(path);
        Assert.Contains("\"mesh\"", json);
        Assert.Contains("\"threshold\"", json);
        Assert.Contains("\"counties\"", json);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // NO MERCY: Verification Script Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateMesh_Verification_Script_Must_Exist()
    {
        var path = ResolvePath("scripts/speclock-tss-verify-state.sh");
        Assert.True(File.Exists(path),
            "❌ speclock-tss-verify-state.sh MUST exist for state mesh verification");
    }

    [Fact]
    public void StateMesh_Verification_Script_Must_Be_Executable_Shell()
    {
        var path = ResolvePath("scripts/speclock-tss-verify-state.sh");
        if (!File.Exists(path))
        {
            Assert.Fail("Verification script not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.True(content.StartsWith("#!/"),
            "Verification script must have shebang line");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // NO MERCY: Static Guard Tests (file-based verification)
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateMeshGuard_Service_File_Must_Exist()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/StateMeshGuardHostedService.cs");
        Assert.True(File.Exists(path),
            "❌ StateMeshGuardHostedService.cs MUST exist for NO MERCY enforcement");
    }

    [Fact]
    public void StateMeshGuard_Service_Must_Have_Verified_Flag()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/StateMeshGuardHostedService.cs");
        if (!File.Exists(path))
        {
            Assert.Fail("StateMeshGuardHostedService.cs not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("public static volatile bool Verified", content);
        Assert.Contains("public static volatile string FailureReason", content);
    }

    [Fact]
    public void SpecLockMetrics_Must_Have_StateMesh_Gauge()
    {
        var path = ResolvePath("backend/src/TerraFusion.API/Services/SpecLock/SpecLockMetrics.cs");
        if (!File.Exists(path))
        {
            Assert.Fail("SpecLockMetrics.cs not found");
            return;
        }

        var content = File.ReadAllText(path);
        Assert.Contains("tf_state_mesh_verified", content);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // NO MERCY: Generated Artifact Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateReport_Schema_Must_Exist()
    {
        var path = ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json");
        Assert.True(File.Exists(path),
            "❌ Generated state-report.schema.json MUST exist");
    }

    [Fact]
    public void StateReport_Template_Must_Exist()
    {
        var path = ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.template.json");
        Assert.True(File.Exists(path),
            "❌ Generated state-report.template.json MUST exist");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // NO MERCY: Signing Configuration Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateAuthorities_Must_Use_FROST_Ed25519()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.state.json not found");
            return;
        }

        var json = File.ReadAllText(path);
        Assert.Contains("frost_ed25519", json);
    }

    [Fact]
    public void StateAuthorities_Must_Have_Quorum_Threshold()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.state.json not found");
            return;
        }

        var json = File.ReadAllText(path);
        Assert.Contains("\"threshold\"", json);
        Assert.Matches("\"threshold\"\\s*:\\s*[3-9]", json);
    }

    [Fact]
    public void StateAuthorities_Must_Have_Group_Public_Key_Path()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.state.json not found");
            return;
        }

        var json = File.ReadAllText(path);
        Assert.Contains("group_public_key_path", json);
    }
}
