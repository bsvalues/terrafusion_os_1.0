using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase16;

/// <summary>
/// Phase 16 — Operations Service Stub Eradication Gate.
/// Ensures TerraFusion.Operations has zero TODO comments and
/// zero NotImplementedException occurrences. Any match means
/// a stub was left behind (or re-introduced) and must be replaced
/// with a safe default or a concrete implementation.
/// </summary>
[Trait("Category", "Phase16")]
[Trait("Category", "Governance")]
public class OperationsStubEradicationGateTests
{
    private static readonly string OperationsDir = FindOperationsDir();

    private static string FindOperationsDir()
    {
        var dir = AppContext.BaseDirectory;
        while (dir != null)
        {
            var candidate = Path.Combine(dir, "backend", "src", "TerraFusion.Operations");
            if (Directory.Exists(candidate)) return candidate;
            var gitDir = Path.Combine(dir, ".git");
            if (Directory.Exists(gitDir) || File.Exists(gitDir))
            {
                candidate = Path.Combine(dir, "backend", "src", "TerraFusion.Operations");
                if (Directory.Exists(candidate)) return candidate;
            }
            dir = Path.GetDirectoryName(dir);
        }
        return string.Empty;
    }

    /// <summary>
    /// No C# file under TerraFusion.Operations may contain a TODO comment.
    /// TODOs indicate deferred work that must be replaced with concrete
    /// implementations or intentionally-minimal safe defaults.
    /// </summary>
    [Fact]
    public void Operations_Must_Have_Zero_TODO_Comments()
    {
        if (string.IsNullOrEmpty(OperationsDir) || !Directory.Exists(OperationsDir))
            return;

        var todoPattern = new Regex(
            @"//\s*TODO\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        var csFiles = Directory.GetFiles(OperationsDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var violations = new List<string>();
        foreach (var file in csFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (todoPattern.IsMatch(lines[i]))
                {
                    var relativePath = Path.GetRelativePath(OperationsDir, file);
                    violations.Add($"  {relativePath}:{i + 1} — {lines[i].Trim()}");
                }
            }
        }

        violations.Should().BeEmpty(
            "TerraFusion.Operations must have zero TODO comments. " +
            "Replace each TODO with a concrete implementation or safe no-op default. " +
            $"Found {violations.Count} TODO(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// No C# file under TerraFusion.Operations may throw NotImplementedException.
    /// This is a runtime bomb waiting to blow up in production.
    /// </summary>
    [Fact]
    public void Operations_Must_Have_Zero_NotImplementedException()
    {
        if (string.IsNullOrEmpty(OperationsDir) || !Directory.Exists(OperationsDir))
            return;

        var niePattern = new Regex(
            @"NotImplementedException",
            RegexOptions.Compiled);

        var csFiles = Directory.GetFiles(OperationsDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var violations = new List<string>();
        foreach (var file in csFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (niePattern.IsMatch(lines[i]))
                {
                    var relativePath = Path.GetRelativePath(OperationsDir, file);
                    violations.Add($"  {relativePath}:{i + 1} — {lines[i].Trim()}");
                }
            }
        }

        violations.Should().BeEmpty(
            "TerraFusion.Operations must have zero NotImplementedException. " +
            "Replace with a concrete implementation or safe no-op default. " +
            $"Found {violations.Count} violation(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Commented-out service registrations in DI configuration indicate
    /// unfinished wiring. Each must be either deleted (if the interface
    /// does not exist) or uncommented with a real/no-op implementation.
    /// </summary>
    [Fact]
    public void Operations_DI_Must_Have_Zero_Commented_Out_Registrations()
    {
        if (string.IsNullOrEmpty(OperationsDir) || !Directory.Exists(OperationsDir))
            return;

        // Match: // services.Add*  (commented-out DI lines)
        var commentedDiPattern = new Regex(
            @"^\s*//\s*services\.Add",
            RegexOptions.Compiled);

        var diFiles = Directory.GetFiles(
                Path.Combine(OperationsDir, "Configuration"), "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var violations = new List<string>();
        foreach (var file in diFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (commentedDiPattern.IsMatch(lines[i]))
                {
                    var relativePath = Path.GetRelativePath(OperationsDir, file);
                    violations.Add($"  {relativePath}:{i + 1} — {lines[i].Trim()}");
                }
            }
        }

        violations.Should().BeEmpty(
            "Operations DI configuration must not contain commented-out service registrations. " +
            "Either wire a concrete/no-op implementation or delete the line. " +
            $"Found {violations.Count} commented-out registration(s):\n" +
            string.Join("\n", violations));
    }
}
