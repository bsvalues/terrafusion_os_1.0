using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.Unit.Tests.Phase16;

/// <summary>
/// Phase 16 — Operations Service Stub Eradication Gate.
/// Mechanical enforcement: ZERO TODOs or NotImplementedExceptions allowed
/// in TerraFusion.Operations after completion.
/// This test acts as a regression blocker post-cleanup.
/// </summary>
[Trait("Category", "Phase16")]
[Trait("Category", "Governance")]
public class OperationsStubEradicationGateTests
{
    private static readonly string BackendSrcDir = FindBackendSrcDir();

    private static string FindBackendSrcDir()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            var candidate = Path.Combine(dir, "backend", "src");
            if (Directory.Exists(candidate)) return candidate;
            var gitDir = Path.Combine(dir, ".git");
            if (Directory.Exists(gitDir) || File.Exists(gitDir))
            {
                candidate = Path.Combine(dir, "backend", "src");
                if (Directory.Exists(candidate)) return candidate;
            }
            dir = Path.GetDirectoryName(dir);
        }
        return string.Empty;
    }

    /// <summary>
    /// GATE: Zero TODOs allowed in TerraFusion.Operations.
    /// Once Phase 16 is complete, any reintroduction of TODOs will break this gate.
    /// </summary>
    [Fact]
    public void TerraFusionOperations_Must_Have_Zero_TODOs()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var operationsDir = Path.Combine(BackendSrcDir, "TerraFusion.Operations");
        if (!Directory.Exists(operationsDir))
        {
            // If the Operations project doesn't exist, skip this test
            return;
        }

        var todoPattern = new Regex(
            @"//\s*TODO\b",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(operationsDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var matches = todoPattern.Matches(content);
            
            if (matches.Count > 0)
            {
                var rel = Path.GetRelativePath(operationsDir, file);
                foreach (Match match in matches)
                {
                    var lineNumber = GetLineNumber(content, match.Index);
                    violations.Add($"  {rel}:{lineNumber} — TODO found");
                }
            }
        }

        violations.Should().BeEmpty(
            "Phase 16 complete: TerraFusion.Operations must have ZERO TODOs. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// GATE: Zero NotImplementedExceptions allowed in TerraFusion.Operations.
    /// Once Phase 16 is complete, any reintroduction will break this gate.
    /// </summary>
    [Fact]
    public void TerraFusionOperations_Must_Have_Zero_NotImplementedExceptions()
    {
        if (string.IsNullOrEmpty(BackendSrcDir) || !Directory.Exists(BackendSrcDir))
            return;

        var operationsDir = Path.Combine(BackendSrcDir, "TerraFusion.Operations");
        if (!Directory.Exists(operationsDir))
        {
            // If the Operations project doesn't exist, skip this test
            return;
        }

        var notImplementedPattern = new Regex(
            @"\bNotImplementedException\b",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(operationsDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var violations = new List<string>();

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var matches = notImplementedPattern.Matches(content);
            
            if (matches.Count > 0)
            {
                var rel = Path.GetRelativePath(operationsDir, file);
                foreach (Match match in matches)
                {
                    var lineNumber = GetLineNumber(content, match.Index);
                    violations.Add($"  {rel}:{lineNumber} — NotImplementedException found");
                }
            }
        }

        violations.Should().BeEmpty(
            "Phase 16 complete: TerraFusion.Operations must have ZERO NotImplementedExceptions. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Helper: Get line number from string index
    /// </summary>
    private static int GetLineNumber(string content, int index)
    {
        return content.Substring(0, index).Count(c => c == '\n') + 1;
    }
}
