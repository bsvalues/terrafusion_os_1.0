using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Security.Tests;

/// <summary>
/// BREAKER SUITE: PII Logging &amp; Data Leakage Prevention
///
/// Verifies that security services never log passwords, tokens, SSNs,
/// or other PII. Government compliance (FISMA-HIGH) requires zero PII
/// in application logs.
///
/// Attack vector: PII in logs → data breach via log aggregation systems.
/// </summary>
[Trait("Phase", "4")]
[Trait("Agent", "4")]
[Trait("Category", "Breaker")]
public sealed class PiiLoggingBreakerTests
{
    private static readonly string RepoRoot = FindRepoRoot();
    private static readonly string SecurityDir = Path.Combine(RepoRoot, "backend", "TerraFusion.Security");

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            // AGENTS.md is unique to the true repo root (TerraFusion.sln also exists in backend/)
            if (File.Exists(Path.Combine(dir, "AGENTS.md")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", ".."));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Password/credential logging
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Pii_NoPasswordInLogStatements()
    {
        var csFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);
            var lines = content.Split('\n');

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];

                // Skip comments and string constants
                if (line.TrimStart().StartsWith("//") || line.TrimStart().StartsWith("*"))
                    continue;

                // Check for logging statements that contain password variables
                if (IsLogStatement(line))
                {
                    var logPiiPattern = new Regex(
                        @"(password|passwd|pwd|secret|apikey|api_key)\b",
                        RegexOptions.IgnoreCase);

                    // Allow "password" in: config key names, property names, field declarations, constants
                    var isDeclaration = line.Contains("string ") || line.Contains("const ") ||
                                        line.Contains("get;") || line.Contains("set;") ||
                                        line.Contains("Configuration") || line.Contains("GetSection") ||
                                        line.Contains("\"password\"") || line.Contains("SensitiveFields");

                    if (!isDeclaration && logPiiPattern.IsMatch(line))
                    {
                        Assert.Fail(
                            $"BREACH: {fileName}:{i + 1} logs credential data — PII leak: {line.Trim()[..Math.Min(100, line.Trim().Length)]}");
                    }
                }
            }
        }
    }

    [Fact]
    public void Breaker_Pii_NoTokenValueInLogStatements()
    {
        var csFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);
            var lines = content.Split('\n');

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                if (line.TrimStart().StartsWith("//") || line.TrimStart().StartsWith("*"))
                    continue;

                if (IsLogStatement(line))
                {
                    // Check for token values being logged (not token types/names)
                    var tokenValuePattern = new Regex(
                        @"\{(token|accessToken|refreshToken|jwtToken|bearerToken)\}",
                        RegexOptions.IgnoreCase);

                    if (tokenValuePattern.IsMatch(line))
                    {
                        Assert.Fail(
                            $"BREACH: {fileName}:{i + 1} logs token value — credential exposure: {line.Trim()[..Math.Min(100, line.Trim().Length)]}");
                    }
                }
            }
        }
    }

    [Fact]
    public void Breaker_Pii_NoSsnOrEmailInLogStatements()
    {
        var csFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);
            var lines = content.Split('\n');

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                if (line.TrimStart().StartsWith("//") || line.TrimStart().StartsWith("*"))
                    continue;

                if (IsLogStatement(line))
                {
                    // SSN patterns in log interpolation
                    var ssnPattern = new Regex(@"\{(ssn|socialSecurity|social_security|taxId|tax_id)\}", RegexOptions.IgnoreCase);
                    if (ssnPattern.IsMatch(line))
                    {
                        Assert.Fail(
                            $"BREACH: {fileName}:{i + 1} logs SSN/tax ID — PII leak: {line.Trim()[..Math.Min(100, line.Trim().Length)]}");
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Audit service leaking sensitive data
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Pii_AuditServiceDeclaresFilteredFields()
    {
        // The audit configuration must declare sensitive fields to filter
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        if (!File.Exists(extFile))
        {
            extFile = Path.Combine(SecurityDir, "SecurityModule.cs");
        }

        // Check either SecurityExtensions or SecurityModule for sensitive field config
        var allCsFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);
        var hasSensitiveFieldConfig = allCsFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            return content.Contains("SensitiveFields") || content.Contains("sensitive") || content.Contains("redact");
        });

        hasSensitiveFieldConfig.Should().BeTrue(
            "BREACH: Security module must declare sensitive fields for audit redaction");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Hardcoded secrets in source code
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Secrets_NoHardcodedCredentials()
    {
        var csFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        // Patterns that indicate hardcoded credentials (not config keys or property names)
        var secretPatterns = new[]
        {
            new Regex(@"password\s*=\s*""[^""]+""", RegexOptions.IgnoreCase),
            new Regex(@"apikey\s*=\s*""[^""]+""", RegexOptions.IgnoreCase),
            new Regex(@"secret\s*=\s*""[a-zA-Z0-9+/=]{16,}""", RegexOptions.IgnoreCase),
            new Regex(@"connectionstring\s*=\s*""[^""]*password[^""]*""", RegexOptions.IgnoreCase),
        };

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            foreach (var pattern in secretPatterns)
            {
                var matches = pattern.Matches(content);
                foreach (Match match in matches)
                {
                    // Allow: empty/placeholder values, config key references, property declarations
                    var value = match.Value;
                    if (value.Contains("string.Empty") || value.Contains("= \"\"") ||
                        value.Contains("= \"test") || value.Contains("Configuration") ||
                        value.Contains("get;") || value.Contains("set;"))
                        continue;

                    Assert.Fail(
                        $"BREACH: {fileName} contains hardcoded credential: {value[..Math.Min(60, value.Length)]}...");
                }
            }
        }
    }

    [Fact]
    public void Breaker_Secrets_NoConnectionStringsInSource()
    {
        var csFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        foreach (var file in csFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            // Connection strings must come from IConfiguration, never hardcoded
            var connStrPattern = new Regex(
                @"""(Server|Host|Data Source)=[^""]*;.*Password=[^""]*""",
                RegexOptions.IgnoreCase);

            connStrPattern.IsMatch(content).Should().BeFalse(
                $"BREACH: {fileName} contains hardcoded connection string");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    private static bool IsLogStatement(string line)
    {
        return line.Contains("LogInformation") || line.Contains("LogWarning") ||
               line.Contains("LogError") || line.Contains("LogCritical") ||
               line.Contains("LogDebug") || line.Contains("LogTrace") ||
               line.Contains("_logger.Log");
    }
}
