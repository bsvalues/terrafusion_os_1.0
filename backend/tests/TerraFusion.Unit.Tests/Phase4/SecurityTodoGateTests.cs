using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase4;

[Trait("Phase", "4")]
[Trait("Component", "SecurityTodoGate")]
[Trait("Category", "Governance")]
public sealed class SecurityTodoGateTests
{
    private static readonly Regex ForbiddenPattern = new(
        @"\b(TODO|FIXME)\s*:\s*security\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly string[] ScopedDirectories =
    {
        "backend/src/TerraFusion.API",
        "backend/src/TerraFusion.Core",
        "backend/src/TerraFusion.Security"
    };

    [Fact]
    public void FailsIfSecurityTODOExistsInBackendScopedDirs()
    {
        var repoRoot = FindRepoRoot();
        var matches = new List<string>();

        foreach (var relativeDir in ScopedDirectories)
        {
            var absoluteDir = Path.Combine(
                repoRoot,
                relativeDir.Replace('/', Path.DirectorySeparatorChar));

            if (!Directory.Exists(absoluteDir))
            {
                continue;
            }

            var files = Directory.EnumerateFiles(absoluteDir, "*.cs", SearchOption.AllDirectories)
                .Where(path =>
                    !path.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase) &&
                    !path.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase));

            foreach (var filePath in files)
            {
                var lineNumber = 0;
                foreach (var line in File.ReadLines(filePath))
                {
                    lineNumber++;
                    if (!ForbiddenPattern.IsMatch(line))
                    {
                        continue;
                    }

                    var relativePath = Path.GetRelativePath(repoRoot, filePath).Replace('\\', '/');
                    matches.Add($"{relativePath}:{lineNumber}: {line.Trim()}");
                }
            }
        }

        matches.Should().BeEmpty(
            "security TODO/FIXME markers are forbidden in scoped backend directories.\nFound:\n{0}",
            string.Join("\n", matches));
    }

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (!string.IsNullOrWhiteSpace(dir))
        {
            var lockPath = Path.Combine(dir, "docs", "spec-lock", "INDEX.json");
            if (File.Exists(lockPath))
            {
                return dir;
            }

            dir = Directory.GetParent(dir)?.FullName;
        }

        return Directory.GetCurrentDirectory();
    }
}
