using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.API.Tests.Phase11;

/// <summary>
/// Phase 11 — Sovereign Guard: verifies that SovereignGuard correctly loads
/// and validates the sovereign.yaml manifest.
/// </summary>
[Trait("Category", "Phase11")]
[Trait("Category", "Governance")]
public class SovereignGuardTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir, "sovereign.yaml")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        throw new InvalidOperationException("Could not locate repo root containing sovereign.yaml");
    }

    [Fact]
    public void SovereignGuard_WithValidManifest_ReturnsValid()
    {
        // Arrange
        var manifestPath = Path.Combine(RepoRoot, "sovereign.yaml");
        File.Exists(manifestPath).Should().BeTrue($"sovereign.yaml must exist at {manifestPath}");

        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, manifestPath);

        // Act
        var result = guard.Verify();

        // Assert
        result.IsValid.Should().BeTrue(because: $"sovereign.yaml passed all law checks. Violation: {result.Violation}");
        result.Violation.Should().BeNull();
        result.ManifestHash.Should().NotBeNullOrWhiteSpace("manifest hash must be computed for audit trail");
    }

    [Fact]
    public void SovereignGuard_ManifestHashIsReproducible()
    {
        // Two calls to Verify on the same file must produce the same hash (determinism).
        var manifestPath = Path.Combine(RepoRoot, "sovereign.yaml");
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, manifestPath);

        var first = guard.Verify();
        var second = guard.Verify();

        first.IsValid.Should().BeTrue();
        first.ManifestHash.Should().Be(second.ManifestHash, "SHA-256 hash must be deterministic");
    }

    [Fact]
    public void SovereignGuard_MissingManifest_ReturnsInvalid()
    {
        // Arrange — point guard at a path that does not exist
        var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, "/nonexistent/path/sovereign.yaml");

        // Act
        var result = guard.Verify();

        // Assert
        result.IsValid.Should().BeFalse();
        result.Violation.Should().Be("Manifest not found");
    }

    [Fact]
    public void SovereignGuard_EmptyManifest_ReturnsInvalid()
    {
        // Arrange — write a temporary empty manifest
        var tmpPath = Path.Combine(Path.GetTempPath(), $"sovereign_empty_{Guid.NewGuid():N}.yaml");
        try
        {
            File.WriteAllText(tmpPath, "   ");
            var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, tmpPath);

            // Act
            var result = guard.Verify();

            // Assert
            result.IsValid.Should().BeFalse();
            result.Violation.Should().Be("Manifest is empty");
        }
        finally
        {
            File.Delete(tmpPath);
        }
    }

    [Fact]
    public void SovereignGuard_ManifestMissingHitlApproval_ReturnsInvalid()
    {
        // Arrange — manifest that has all sections but no HITL approval flag
        var content = """
            hitl:
              enabled: true
            county_isolation:
              enforced: true
            truthgate:
              enabled: true
            """;

        var tmpPath = Path.Combine(Path.GetTempPath(), $"sovereign_nohitl_{Guid.NewGuid():N}.yaml");
        try
        {
            File.WriteAllText(tmpPath, content);
            var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, tmpPath);

            // Act
            var result = guard.Verify();

            // Assert
            result.IsValid.Should().BeFalse();
            result.Violation.Should().Be("HITL approval not enabled");
        }
        finally
        {
            File.Delete(tmpPath);
        }
    }

    [Fact]
    public void SovereignGuard_ManifestMissingRequiredSections_ReturnsInvalid()
    {
        // Arrange — manifest that is missing truthgate section
        var content = """
            hitl:
              ai_pilot_mutations_require_approval: true
            county_isolation:
              enforced: true
            """;

        var tmpPath = Path.Combine(Path.GetTempPath(), $"sovereign_nosections_{Guid.NewGuid():N}.yaml");
        try
        {
            File.WriteAllText(tmpPath, content);
            var guard = new SovereignGuard(NullLogger<SovereignGuard>.Instance, tmpPath);

            // Act
            var result = guard.Verify();

            // Assert
            result.IsValid.Should().BeFalse();
            result.Violation.Should().Be("Missing required law sections");
        }
        finally
        {
            File.Delete(tmpPath);
        }
    }
}
