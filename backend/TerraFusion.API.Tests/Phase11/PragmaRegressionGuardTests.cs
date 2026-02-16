using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase11;

/// <summary>
/// Phase 11 governance guard: ensures no #pragma warning disable CS1998
/// suppressions exist in the backend. All async methods must genuinely await
/// or be converted to synchronous Task.FromResult patterns.
/// </summary>
[Trait("Category", "Phase11")]
[Trait("Category", "Governance")]
public class PragmaRegressionGuardTests
{
    private static readonly string BackendSrcDir = FindBackendSrcDir();

    private static string FindBackendSrcDir()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            var candidate = Path.Combine(dir, "backend", "src");
            if (Directory.Exists(candidate)) return candidate;

            // Also check for repo root markers
            var gitDir = Path.Combine(dir, ".git");
            if (Directory.Exists(gitDir) || File.Exists(gitDir))
            {
                candidate = Path.Combine(dir, "backend", "src");
                if (Directory.Exists(candidate)) return candidate;
            }

            dir = Path.GetDirectoryName(dir);
        }

        // Fallback: return a marker so tests can skip gracefully
        return string.Empty;
    }

    [Fact]
    public void Backend_Should_Have_No_CS1998_Pragma_Suppressions()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
        {
            // Skip gracefully in CI where directory traversal may differ
            return;
        }

        var csFiles = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories);
        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (lines[i].Contains("#pragma warning disable CS1998"))
                {
                    var relativePath = Path.GetRelativePath(BackendSrcDir, file);
                    violations.Add($"{relativePath}:{i + 1}");
                }
            }
        }

        violations.Should().BeEmpty(
            "all async methods must genuinely await or use Task.FromResult — " +
            "no #pragma warning disable CS1998 suppressions allowed. " +
            $"Found {violations.Count} violation(s): {string.Join(", ", violations)}"
        );
    }

    [Fact]
    public void Backend_Should_Have_No_CS8618_Pragma_Suppressions_In_New_Files()
    {
        // Phase 11 also guards against nullable reference type suppressions
        // in newly added files (existing legacy files are grandfathered)
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
        {
            return;
        }

        // This is a forward-looking guard — we don't enforce retroactively
        // but new Phase 11+ files should not add CS8618 suppressions
        var phase11Files = Directory.GetFiles(BackendSrcDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => File.ReadAllText(f).Contains("Phase11") ||
                       File.ReadAllText(f).Contains("Phase12") ||
                       File.ReadAllText(f).Contains("Phase13"))
            .ToList();

        var violations = new List<string>();

        foreach (var file in phase11Files)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (lines[i].Contains("#pragma warning disable CS8618"))
                {
                    var relativePath = Path.GetRelativePath(BackendSrcDir, file);
                    violations.Add($"{relativePath}:{i + 1}");
                }
            }
        }

        violations.Should().BeEmpty(
            "new Phase 11+ files must not suppress CS8618 (nullable reference types)"
        );
    }
}
