// StateMeshBreakerTests - Fail-closed expectations for state mesh posture
// Validates presence of state authority profile and generated artifacts
// Part of TerraFusion OS governance test suite

using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Breaker tests for state mesh artifacts.
/// These tests verify the presence of critical state mesh files.
/// Fail-closed: if any artifact is missing, the build should fail.
/// </summary>
public sealed class StateMeshBreakerTests
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
    // Authority Profile Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateAuthorities_File_Exists()
        => Assert.True(
            File.Exists(ResolvePath("docs/spec-lock/AUTHORITIES.state.json")),
            "AUTHORITIES.state.json must exist for state mesh operations");

    [Fact]
    public void StateAuthorities_Contains_Required_Fields()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.state.json not found");
            return;
        }

        var json = File.ReadAllText(path);
        // Mesh configuration
        Assert.Contains("\"mesh\"", json);
        Assert.Contains("\"federated_quorum\"", json);
        Assert.Contains("\"threshold\"", json);
        // Counties array
        Assert.Contains("\"counties\"", json);
        // Signing configuration
        Assert.Contains("\"signing\"", json);
    }

    [Fact]
    public void StateAuthorities_Has_Valid_TSS_Config()
    {
        var path = ResolvePath("docs/spec-lock/AUTHORITIES.state.json");
        if (!File.Exists(path))
        {
            Assert.Fail("AUTHORITIES.state.json not found");
            return;
        }

        var json = File.ReadAllText(path);
        // TSS scheme must be frost_ed25519
        Assert.Contains("\"frost_ed25519\"", json);
        // Must have group public key path
        Assert.Contains("group_public_key_path", json);
        // Must have threshold
        Assert.Contains("\"threshold\"", json);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Generated Artifact Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateReport_SpecLock_Exists()
        => Assert.True(
            File.Exists(ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/SPEC_LOCK_v1.0.0.md")),
            "StateReportLock SPEC_LOCK must exist");

    [Fact]
    public void StateReport_Schema_Generated_Exists()
        => Assert.True(
            File.Exists(ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json")),
            "Generated state-report.schema.json must exist");

    [Fact]
    public void StateReport_Template_Generated_Exists()
        => Assert.True(
            File.Exists(ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.template.json")),
            "Generated state-report.template.json must exist");

    // ─────────────────────────────────────────────────────────────────────────────
    // Index Wiring Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Index_Contains_StateReport_Lock()
    {
        var path = ResolvePath("docs/spec-lock/INDEX.json");
        var json = File.ReadAllText(path);
        Assert.Contains("\"statereport.v1\"", json);
        Assert.Contains("\"state-report\"", json);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Schema Validation Tests
    // ─────────────────────────────────────────────────────────────────────────────

    [Fact]
    public void StateReport_Schema_Has_Required_Fields()
    {
        var path = ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json");
        if (!File.Exists(path))
        {
            // Skip if not generated yet - generator will create it
            return;
        }

        var json = File.ReadAllText(path);
        Assert.Contains("\"report_id\"", json);
        Assert.Contains("\"report_type\"", json);
        Assert.Contains("\"issued_at\"", json);
        Assert.Contains("\"nbf\"", json);
        Assert.Contains("\"exp\"", json);
        Assert.Contains("\"county_set\"", json);
        Assert.Contains("\"data_sha256\"", json);
        Assert.Contains("\"signing\"", json);
    }

    [Fact]
    public void StateReport_Schema_Enforces_CosmicTSS_Mode()
    {
        var path = ResolvePath("docs/spec-lock/locks/state-report/state-report.v1/generated/state-report.schema.json");
        if (!File.Exists(path))
        {
            return;
        }

        var json = File.ReadAllText(path);
        // Schema should enforce cosmic_tss as the only allowed mode
        Assert.Contains("\"cosmic_tss\"", json);
    }
}
