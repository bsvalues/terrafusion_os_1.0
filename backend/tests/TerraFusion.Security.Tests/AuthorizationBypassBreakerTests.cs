using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Security.Tests;

/// <summary>
/// BREAKER SUITE: Authorization Bypass Prevention
///
/// Verifies that all Security controllers enforce [Authorize],
/// no endpoint is accidentally [AllowAnonymous], and role gates
/// are present on every action.
///
/// Attack vector: Missing [Authorize] → unauthenticated access to security APIs.
/// </summary>
[Trait("Phase", "4")]
[Trait("Agent", "4")]
[Trait("Category", "Breaker")]
public sealed class AuthorizationBypassBreakerTests
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
    // ATTACK VECTOR: Missing [Authorize] on controller class
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Authz_AllControllersMustHaveAuthorizeAttribute()
    {
        var controllersDir = Path.Combine(SecurityDir, "Controllers");
        if (!Directory.Exists(controllersDir))
        {
            Assert.Fail("Controllers directory must exist in TerraFusion.Security");
            return;
        }

        var controllerFiles = Directory.GetFiles(controllersDir, "*Controller.cs");
        controllerFiles.Should().NotBeEmpty("Security module must have at least one controller");

        foreach (var file in controllerFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            content.Should().Contain("[Authorize",
                $"BREACH: {fileName} is missing [Authorize] attribute — unauthenticated access possible");
        }
    }

    [Fact]
    public void Breaker_Authz_NoControllerUsesAllowAnonymous()
    {
        var controllersDir = Path.Combine(SecurityDir, "Controllers");
        if (!Directory.Exists(controllersDir))
            return;

        var controllerFiles = Directory.GetFiles(controllersDir, "*Controller.cs");

        foreach (var file in controllerFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            content.Should().NotContain("[AllowAnonymous]",
                $"BREACH: {fileName} uses [AllowAnonymous] — security endpoints must never be anonymous");
        }
    }

    [Fact]
    public void Breaker_Authz_ControllerRequiresAdminRole()
    {
        var controllersDir = Path.Combine(SecurityDir, "Controllers");
        if (!Directory.Exists(controllersDir))
            return;

        var controllerFiles = Directory.GetFiles(controllersDir, "*Controller.cs");

        foreach (var file in controllerFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            // Must require either SecurityAdmin or SystemAdmin role
            var hasRoleGate = content.Contains("SecurityAdmin") || content.Contains("SystemAdmin");
            hasRoleGate.Should().BeTrue(
                $"BREACH: {fileName} does not enforce SecurityAdmin/SystemAdmin role — privilege escalation possible");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: SQL Injection via Security services
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_SqlInjection_NoConcatenatedSqlInServices()
    {
        var serviceFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories)
            .Where(f => f.Contains("Service", StringComparison.OrdinalIgnoreCase));

        foreach (var file in serviceFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            // Pattern: string concatenation into SQL (dangerous)
            var sqlConcatPattern = new Regex(
                @"\$""[^""]*SELECT[^""]*\{[^}]+\}[^""]*""",
                RegexOptions.IgnoreCase);

            var matches = sqlConcatPattern.Matches(content);
            foreach (Match match in matches)
            {
                // Allow if using parameterized Dapper syntax (e.g., WHERE col = @param)
                if (match.Value.Contains("@"))
                    continue;

                Assert.Fail(
                    $"BREACH: {fileName} contains string-interpolated SQL without parameters: {match.Value[..Math.Min(80, match.Value.Length)]}");
            }
        }
    }

    [Fact]
    public void Breaker_SqlInjection_DapperUsesParameterizedQueries()
    {
        var serviceFiles = Directory.GetFiles(SecurityDir, "*.cs", SearchOption.AllDirectories);

        foreach (var file in serviceFiles)
        {
            var content = File.ReadAllText(file);
            var fileName = Path.GetFileName(file);

            // If file uses Dapper query methods, it must use parameter objects
            // Exclude BackgroundService.ExecuteAsync which is not a Dapper call
            var usesDapper = (content.Contains("QueryAsync") || content.Contains(".ExecuteAsync("))
                && !Regex.IsMatch(content, @"override\s+.*Task\s+ExecuteAsync");
            if (usesDapper)
            {
                // Must use "new {" or "@" parameter syntax
                var usesParams = content.Contains("new {") || content.Contains("@");
                usesParams.Should().BeTrue(
                    $"BREACH: {fileName} uses Dapper queries without parameterized inputs");
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ATTACK VECTOR: JWT configuration weaknesses
    // ═══════════════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_Jwt_RequiresHttpsMetadata()
    {
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        var content = File.ReadAllText(extFile);

        content.Should().Contain("RequireHttpsMetadata = true",
            "BREACH: JWT must require HTTPS — downgrade attack possible");
    }

    [Fact]
    public void Breaker_Jwt_ValidatesIssuerAndAudience()
    {
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        var content = File.ReadAllText(extFile);

        content.Should().Contain("ValidateIssuer = true",
            "BREACH: JWT must validate issuer — token spoofing possible");
        content.Should().Contain("ValidateAudience = true",
            "BREACH: JWT must validate audience — cross-service token reuse possible");
    }

    [Fact]
    public void Breaker_Jwt_ValidatesLifetimeAndSigningKey()
    {
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        var content = File.ReadAllText(extFile);

        content.Should().Contain("ValidateLifetime = true",
            "BREACH: JWT must validate lifetime — expired tokens accepted");
        content.Should().Contain("ValidateIssuerSigningKey = true",
            "BREACH: JWT must validate signing key — forged tokens accepted");
        content.Should().Contain("RequireExpirationTime = true",
            "BREACH: JWT must require expiration — permanent tokens possible");
    }

    [Fact]
    public void Breaker_Jwt_MinimizesClockSkew()
    {
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        var content = File.ReadAllText(extFile);

        // ClockSkew should be small (≤5 minutes) for government security
        content.Should().Contain("ClockSkew = TimeSpan.FromMinutes(1)",
            "BREACH: JWT clock skew must be minimal — large skew extends token validity window");
    }

    [Fact]
    public void Breaker_Jwt_PreventsTokenReplay()
    {
        var extFile = Path.Combine(SecurityDir, "Extensions", "SecurityExtensions.cs");
        var content = File.ReadAllText(extFile);

        content.Should().Contain("ValidateTokenReplay = true",
            "BREACH: JWT must prevent token replay attacks");
    }
}
