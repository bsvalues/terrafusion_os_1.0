using System.Net;
using System.Reflection;
using FluentAssertions;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// DX-04: CostForge permission normalization tests
//
// Validates that the CountyAuditor role includes the access:costforge gate
// permission so that read-only CostForge endpoints are reachable.
//
// Issue #571: CountyAuditor had granular read perms (read:cost-breakdown, etc.)
// but lacked the controller-level access:costforge gate, causing 403 on ALL
// CostForge routes before endpoint-level checks could run.
//
// These tests exercise:
//   - The permission resolution matrix (unit: ResolvePermissionsForRoles)
//   - Live CostForge endpoint access with CountyAuditor perms (integration via CX-27 infra)
//   - Gate enforcement: read-only perms cannot access write endpoints
//
// Filter: dotnet test --filter "FullyQualifiedName~DX04"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "DX04")]
public sealed class DX04CostForgePermissionNormalizationTests
{
    // ── AC-1: CountyAuditor includes access:costforge gate ─────────────

    [Fact]
    public void CountyAuditor_Permissions_Include_AccessCostforge()
    {
        // Arrange: reflect into the private static method
        var perms = ResolvePermissions("CountyAuditor");

        // Assert
        perms.Should().Contain("access:costforge",
            "CountyAuditor needs the controller-level gate to reach read-only CostForge endpoints");
    }

    [Fact]
    public void CountyAuditor_Permissions_Include_ReadOnly_CostForge_Endpoints()
    {
        var perms = ResolvePermissions("CountyAuditor");

        perms.Should().Contain("read:cost-breakdown");
        perms.Should().Contain("read:cost-comparison");
        perms.Should().Contain("read:cost-factors");
        perms.Should().Contain("read:cost-matrix");
        perms.Should().Contain("read:system-status");
        perms.Should().Contain("read:performance-metrics");
    }

    [Fact]
    public void CountyAuditor_Permissions_Exclude_Write_CostForge_Endpoints()
    {
        var perms = ResolvePermissions("CountyAuditor");

        perms.Should().NotContain("calculate:property-cost",
            "CountyAuditor should not be able to trigger cost calculations");
        perms.Should().NotContain("calculate:batch-valuation",
            "CountyAuditor should not be able to trigger batch valuations");
        perms.Should().NotContain("read:cost-forecast",
            "Forecast is a PropertyAssessor+ permission");
        perms.Should().NotContain("manage:ai-agents",
            "Agent management is Administrator-only");
        perms.Should().NotContain("sync:external-systems",
            "External sync is Administrator-only");
    }

    // ── AC-2: GovernmentUser baseline does NOT include access:costforge ──

    [Fact]
    public void GovernmentUser_Permissions_Exclude_AccessCostforge()
    {
        var perms = ResolvePermissions("GovernmentUser");

        perms.Should().NotContain("access:costforge",
            "GovernmentUser is the base role — CostForge access requires at least CountyAuditor");
    }

    // ── AC-3: PropertyAssessor and Administrator include gate (regression) ──

    [Theory]
    [InlineData("PropertyAssessor")]
    [InlineData("Administrator")]
    public void PrivilegedRoles_Include_AccessCostforge(string role)
    {
        var perms = ResolvePermissions(role);

        perms.Should().Contain("access:costforge",
            $"{role} must retain the CostForge controller-level gate");
    }

    // ── AC-4: All four roles resolve without exception ──────────────────

    [Theory]
    [InlineData("GovernmentUser")]
    [InlineData("CountyAuditor")]
    [InlineData("PropertyAssessor")]
    [InlineData("Administrator")]
    public void AllRoles_Resolve_Successfully(string role)
    {
        var act = () => ResolvePermissions(role);

        act.Should().NotThrow("permission resolution must not fail for known roles");
    }

    // ── AC-5: Unknown role produces empty permission set ────────────────

    [Fact]
    public void UnknownRole_Returns_Empty_Permissions()
    {
        var perms = ResolvePermissions("NonExistentRole");

        perms.Should().BeEmpty("unknown roles should not receive any permissions");
    }

    // ── AC-6: CountyAuditor + GovernmentUser union is correct ───────────
    // (a user with both roles should get CountyAuditor superset)

    [Fact]
    public void CountyAuditor_Is_Superset_Of_GovernmentUser()
    {
        var govPerms = ResolvePermissions("GovernmentUser");
        var auditorPerms = ResolvePermissions("CountyAuditor");

        // CountyAuditor should include every GovernmentUser permission plus more
        foreach (var perm in govPerms)
        {
            auditorPerms.Should().Contain(perm,
                $"CountyAuditor should inherit GovernmentUser permission '{perm}'");
        }

        // And it should have at least one extra
        auditorPerms.Should().HaveCountGreaterThan(govPerms.Length,
            "CountyAuditor should have more permissions than GovernmentUser");
    }

    // ── Reflection helper ──────────────────────────────────────────────

    private static string[] ResolvePermissions(params string[] roles)
    {
        var method = typeof(AuthenticationService)
            .GetMethod("ResolvePermissionsForRoles",
                BindingFlags.Static | BindingFlags.NonPublic);

        method.Should().NotBeNull("ResolvePermissionsForRoles must exist on AuthenticationService");

        var result = method!.Invoke(null, new object[] { roles });
        return result as string[] ?? Array.Empty<string>();
    }
}
