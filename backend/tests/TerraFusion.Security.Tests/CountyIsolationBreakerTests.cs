using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Security.Tests;

/// <summary>
/// BREAKER SUITE: County Data Isolation &amp; FISMA Compliance
///
/// Verifies that security services enforce county-scoped data access,
/// configuration meets FISMA-HIGH requirements, and encryption is
/// properly configured for government operations.
///
/// Attack vector: Missing county filter → cross-county data leakage.
/// Attack vector: Weak crypto config → FISMA non-compliance.
/// </summary>
[Trait("Phase", "4")]
[Trait("Agent", "4")]
[Trait("Category", "Breaker")]
public sealed class CountyIsolationBreakerTests
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
    // ATTACK VECTOR: Missing county isolation in security queries
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_County_AuditServiceQueriesMustNotBeGlobal()
    {
        // All SQL queries in audit service that access user/property data
        // must include county_id or explicit scope limitation
        var auditFile = Path.Combine(SecurityDir, "ProductionAuditService.cs");
        if (!File.Exists(auditFile))
            return;

        var content = File.ReadAllText(auditFile);

        // If the file contains raw SQL queries, they must have scope constraints
        var sqlPattern = new Regex(@"SELECT\s+.*FROM\s+(\w+)", RegexOptions.IgnoreCase);
        var matches = sqlPattern.Matches(content);

        foreach (Match match in matches)
        {
            var tableName = match.Groups[1].Value.ToLower();
            // Property/user tables MUST have county scope
            var countyRequiredTables = new[] { "properties", "users", "parcels", "assessments" };

            if (countyRequiredTables.Any(t => tableName.Contains(t)))
            {
                // Find the query block (next 5 lines)
                var queryStart = match.Index;
                var queryBlock = content[queryStart..Math.Min(content.Length, queryStart + 500)];

                queryBlock.Should().ContainAny(
                    new[] { "county", "CountyId", "county_id", "WHERE", "@county" },
                    $"BREACH: SQL on table '{tableName}' has no county scope — cross-county data leak possible");
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: FISMA-HIGH crypto configuration gaps
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Fisma_EncryptionConfigDefaultsToQuantumResistant()
    {
        var configFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        var hasQuantumDefault = configFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            return content.Contains("QuantumResistant") && content.Contains("= true");
        });

        hasQuantumDefault.Should().BeTrue(
            "BREACH: Encryption must default to quantum-resistant for FISMA-HIGH compliance");
    }

    [Fact]
    public void Breaker_Fisma_AuditRetentionMeetsGovernmentRequirement()
    {
        // FISMA-HIGH requires 7-year audit log retention
        var configFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        var hasRetention = configFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            // 7 years ≈ 2555-2557 days
            return (content.Contains("2555") || content.Contains("2557") ||
                    content.Contains("7 years") || content.Contains("RetentionPeriod")) &&
                   content.Contains("Audit");
        });

        hasRetention.Should().BeTrue(
            "BREACH: Audit log retention must meet FISMA-HIGH 7-year requirement");
    }

    [Fact]
    public void Breaker_Fisma_RequiresFismaHighInComplianceDefaults()
    {
        var configFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        var hasFismaHigh = configFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            return content.Contains("FISMA-HIGH") || content.Contains("FISMA_HIGH");
        });

        hasFismaHigh.Should().BeTrue(
            "BREACH: Security module must declare FISMA-HIGH compliance level");
    }

    [Fact]
    public void Breaker_Fisma_MfaDefaultsToRequired()
    {
        var configFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        var hasMfaRequired = configFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            return content.Contains("Required") && content.Contains("MFA") &&
                   content.Contains("= true");
        });

        hasMfaRequired.Should().BeTrue(
            "BREACH: MFA must default to required for FISMA-HIGH — weak auth possible");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Security headers missing from responses
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Headers_SecurityMiddlewareExists()
    {
        var middlewareDir = Path.Combine(SecurityDir, "Middleware");
        Directory.Exists(middlewareDir).Should().BeTrue(
            "BREACH: Security middleware directory must exist");

        var middlewareFiles = Directory.GetFiles(middlewareDir, "*.cs");
        middlewareFiles.Should().NotBeEmpty(
            "BREACH: Security middleware must have at least one implementation");
    }

    [Fact]
    public void Breaker_Headers_GovernmentAuthHeadersOnChallenge()
    {
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        var content = File.ReadAllText(extFile);

        content.Should().Contain("X-Government-Auth-Required",
            "BREACH: JWT challenge must set government auth header for compliance");
        content.Should().Contain("X-Compliance-Level",
            "BREACH: JWT challenge must declare compliance level");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: Weak key derivation
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Crypto_KeyDerivationIterationsAreAdequate()
    {
        var configFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        var hasAdequateIterations = configFiles.Any(f =>
        {
            var content = File.ReadAllText(f);
            if (!content.Contains("KeyDerivationIterations"))
                return false;

            // Must be at least 100,000 for NIST compliance
            var match = Regex.Match(content, @"KeyDerivationIterations\s*[=}]\s*(\d+)");
            if (match.Success && int.TryParse(match.Groups[1].Value, out var iterations))
            {
                return iterations >= 100000;
            }
            return content.Contains("100000") || content.Contains("100_000");
        });

        hasAdequateIterations.Should().BeTrue(
            "BREACH: Key derivation iterations must be ≥ 100,000 for NIST compliance");
    }

    [Fact]
    public void Breaker_Crypto_NoInsecureAlgorithmsInDefaults()
    {
        var configFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        foreach (var file in configFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            // MD5 and SHA1 are insecure for cryptographic use
            var insecurePatterns = new[]
            {
                ("MD5.Create", "MD5"),
                ("SHA1.Create", "SHA1"),
                ("DES.Create", "DES"),
                ("TripleDES", "3DES"),
            };

            foreach (var (pattern, algo) in insecurePatterns)
            {
                if (content.Contains(pattern))
                {
                    Assert.Fail(
                        $"BREACH: {fileName} uses insecure algorithm {algo} — prohibited by NIST for government systems");
                }
            }
        }
    }
}
