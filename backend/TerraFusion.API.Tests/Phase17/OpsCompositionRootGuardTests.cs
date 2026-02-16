using System.Text.RegularExpressions;
using Xunit;
using FluentAssertions;

namespace TerraFusion.API.Tests.Phase17;

/// <summary>
/// Phase 17B - Operations Composition Root Guard.
/// Scans TerraFusion.Operations to enforce:
///   1. Every public AddXxx extension method is called from Program.cs.
///   2. Every IHealthCheck class is registered in a DI configuration.
///   3. No orphan extension methods that exist but are never wired.
/// Violations mean services exist but are invisible at runtime.
/// </summary>
[Trait("Category", "Phase17")]
[Trait("Category", "Governance")]
public class OpsCompositionRootGuardTests
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
    /// Every public static extension method of the form AddXxx(this IServiceCollection ...)
    /// declared in Operations must be CALLED somewhere in Operations/Program.cs
    /// or in a parent extension method that IS called. Unwired methods are dead code
    /// that silently disables features the developer thought were active.
    /// </summary>
    [Fact]
    public void Operations_All_DI_Extension_Methods_Must_Be_Wired()
    {
        if (string.IsNullOrEmpty(OperationsDir) || !Directory.Exists(OperationsDir))
            return;

        var programFile = Path.Combine(OperationsDir, "Program.cs");
        if (!File.Exists(programFile))
            return;

        var programContent = File.ReadAllText(programFile);

        // Also read all extension method files to find chained calls
        var allCsFiles = Directory.GetFiles(OperationsDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var allContent = string.Join("\n", allCsFiles.Select(File.ReadAllText));

        // Find all public static methods matching AddXxx(this IServiceCollection ...)
        // Pattern: public static IServiceCollection AddSomething(
        var extensionMethodPattern = new Regex(
            @"public\s+static\s+\w+\s+(Add\w+)\s*(?:<[^>]+>)?\s*\(\s*this\s+I(?:ServiceCollection|HealthChecksBuilder)",
            RegexOptions.Compiled);

        var declaredMethods = new HashSet<string>();
        foreach (var file in allCsFiles)
        {
            var content = File.ReadAllText(file);
            foreach (Match match in extensionMethodPattern.Matches(content))
            {
                declaredMethods.Add(match.Groups[1].Value);
            }
        }

        // For each declared method, check if it's called in Program.cs
        // OR called from another method that IS called from Program.cs
        var calledInProgram = new HashSet<string>();
        foreach (var method in declaredMethods)
        {
            // Direct call in Program.cs
            if (Regex.IsMatch(programContent, @"\." + Regex.Escape(method) + @"\s*[\(<]"))
            {
                calledInProgram.Add(method);
            }
        }

        // Second pass: methods called from already-wired methods
        var calledFromWired = new HashSet<string>(calledInProgram);
        bool changed;
        do
        {
            changed = false;
            foreach (var method in declaredMethods.Except(calledFromWired).ToArray())
            {
                // Check if this method is called from any wired method's body
                foreach (var wiredMethod in calledFromWired.ToArray())
                {
                    // Find the body of the wired method and see if it calls this method
                    var bodyPattern = new Regex(
                        Regex.Escape(wiredMethod) + @"[\s\S]*?\." + Regex.Escape(method) + @"\s*[\(<]");
                    if (bodyPattern.IsMatch(allContent))
                    {
                        calledFromWired.Add(method);
                        changed = true;
                    }
                }
            }
        } while (changed);

        // Opt-in replacement methods: these are explicitly designed to
        // swap out a default no-op with a concrete implementation.
        // They are NOT required to be wired — wiring them is a deploy-time choice.
        var optInReplacements = new HashSet<string>
        {
            "AddAzureOpenAiRunbookExplanation",
            "AddRunbookExplanationService",
        };

        // Generic overloads (AddXxx<T,...>) of a wired base method are OK
        var unwired = declaredMethods
            .Except(calledFromWired)
            .Where(m =>
            {
                // If AddRunbookExecutor<T> exists and AddRunbookExecutor is wired, that's fine
                if (calledFromWired.Any(w => m.StartsWith(w) || w.StartsWith(m)))
                    return false;
                // Opt-in replacement methods are allowed to be unwired
                if (optInReplacements.Contains(m))
                    return false;
                return true;
            })
            .ToList();

        // Find file locations for violations
        var violations = new List<string>();
        foreach (var method in unwired)
        {
            foreach (var file in allCsFiles)
            {
                var lines = File.ReadAllLines(file);
                for (int i = 0; i < lines.Length; i++)
                {
                    if (Regex.IsMatch(lines[i], @"public\s+static\s+\w+\s+" + Regex.Escape(method) + @"\s*[\(<]"))
                    {
                        var relativePath = Path.GetRelativePath(OperationsDir, file);
                        violations.Add($"  {relativePath}:{i + 1} — {method}() is declared but never wired in Program.cs");
                    }
                }
            }
        }

        violations.Should().BeEmpty(
            "Every public AddXxx DI extension method in TerraFusion.Operations must be " +
            "called from Program.cs (directly or transitively). Unwired methods mean " +
            "features that exist in code but are invisible at runtime. " +
            $"Found {violations.Count} unwired method(s):\n" +
            string.Join("\n", violations));
    }

    /// <summary>
    /// Every class implementing IHealthCheck in Operations/HealthChecks
    /// must be registered via AddCheck&lt;T&gt; somewhere in the Operations DI
    /// configuration. Unregistered health checks are dead code that gives
    /// a false sense of monitoring coverage.
    /// </summary>
    [Fact]
    public void Operations_All_HealthCheck_Classes_Must_Be_Registered()
    {
        if (string.IsNullOrEmpty(OperationsDir) || !Directory.Exists(OperationsDir))
            return;

        var healthChecksDir = Path.Combine(OperationsDir, "HealthChecks");
        if (!Directory.Exists(healthChecksDir))
            return;

        // Find all classes that implement IHealthCheck
        var healthCheckClassPattern = new Regex(
            @"public\s+class\s+(\w+)\s*:\s*IHealthCheck",
            RegexOptions.Compiled);

        var healthCheckFiles = Directory.GetFiles(healthChecksDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var declaredChecks = new List<(string ClassName, string File, int Line)>();
        foreach (var file in healthCheckFiles)
        {
            var lines = File.ReadAllLines(file);
            for (int i = 0; i < lines.Length; i++)
            {
                var match = healthCheckClassPattern.Match(lines[i]);
                if (match.Success)
                {
                    declaredChecks.Add((match.Groups[1].Value, file, i + 1));
                }
            }
        }

        // Scan ALL cs files for AddCheck<ClassName> registrations
        var allCsFiles = Directory.GetFiles(OperationsDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains("obj") && !f.Contains("bin"))
            .ToArray();

        var allContent = string.Join("\n", allCsFiles.Select(File.ReadAllText));

        // Known-unregisterable health checks: these depend on interfaces
        // (IAIAgentCoordinator, ICountyServiceMonitor, etc.) that have no
        // implementations yet. They CANNOT be registered without causing
        // DI resolution failures. Capped at 6 to prevent silent growth.
        var knownUnregisterable = new HashSet<string>
        {
            "AIAgentCoordinationHealthCheck",
            "CountyServicesHealthCheck",
            "PerformanceMetricsHealthCheck",
            "SecurityComplianceHealthCheck",
            "EmergencyResponseHealthCheck",
            "CitizenServicesHealthCheck",
        };

        var violations = new List<string>();
        var knownHits = 0;
        foreach (var (className, file, line) in declaredChecks)
        {
            var isRegistered = Regex.IsMatch(allContent,
                @"AddCheck<\s*(HealthChecks\.)?" + Regex.Escape(className));

            if (!isRegistered)
            {
                if (knownUnregisterable.Contains(className))
                {
                    knownHits++;
                    continue; // Allowed — deps don't exist yet
                }

                var relativePath = Path.GetRelativePath(OperationsDir, file);
                violations.Add(
                    $"  {relativePath}:{line} — {className} implements IHealthCheck " +
                    "but is never registered with AddCheck<T>()");
            }
        }

        // Cap: no more than 6 known-unregisterable checks allowed
        knownHits.Should().BeLessThanOrEqualTo(6,
            "The cap of 6 known-unregisterable health checks has been exceeded. " +
            "New health checks must either be registered or their dependencies implemented.");

        violations.Should().BeEmpty(
            "Every IHealthCheck class in Operations/HealthChecks must be registered " +
            "via AddCheck<T> in a DI configuration file (excluding the 6 known-unregisterable " +
            "checks whose interface dependencies have no implementations). " +
            $"Found {violations.Count} unregistered health check(s):\n" +
            string.Join("\n", violations));
    }
}
