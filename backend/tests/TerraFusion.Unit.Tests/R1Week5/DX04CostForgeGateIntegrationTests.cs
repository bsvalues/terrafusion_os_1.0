using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// DX-04: CostForge gate integration tests
//
// Uses the CX-27 test infrastructure (Cx27PermClaimFactory) to exercise
// CostForge endpoints through the REAL authorization pipeline with
// CountyAuditor-equivalent permission sets.
//
// This verifies that the access:costforge gate + read perms reach the
// endpoint, while read perms alone are blocked at the controller level.
//
// Filter: dotnet test --filter "FullyQualifiedName~DX04CostForgeGate"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "DX04")]
[Trait("Category", "Integration")]
public sealed class DX04CostForgeGateIntegrationTests
    : IClassFixture<Cx27PermClaimFactory>, IAsyncLifetime
{
    private readonly Cx27PermClaimFactory _factory;

    public DX04CostForgeGateIntegrationTests(Cx27PermClaimFactory factory) => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── CountyAuditor perms (gate + read) → 200 on read endpoints ─────

    [Fact]
    public async Task CostForgeStatus_WithGateAndReadPerm_ReturnsSuccess()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["access:costforge", "read:system-status"]);

        var response = await client.GetAsync("/api/costforge/status");

        // Endpoint may return 200 (with data) or 204 (empty) — both prove auth passed.
        // The critical assertion: NOT 403 (gate blocked) and NOT 401 (unauthenticated).
        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.OK, HttpStatusCode.NoContent },
            "CountyAuditor with access:costforge + read:system-status should pass the controller gate");
    }

    [Fact]
    public async Task CostForgeMetrics_WithGateAndReadPerm_ReturnsSuccess()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["access:costforge", "read:performance-metrics"]);

        var response = await client.GetAsync("/api/costforge/metrics");

        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.OK, HttpStatusCode.NoContent },
            "CountyAuditor with access:costforge + read:performance-metrics should pass the controller gate");
    }

    // ── Read perms WITHOUT gate → 403 (the DX-04 finding) ────────────

    [Fact]
    public async Task CostForgeStatus_WithReadPermOnly_Returns403()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["read:system-status"]); // gate perm missing!

        var response = await client.GetAsync("/api/costforge/status");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            "Without access:costforge gate, controller-level check should block even with endpoint perms");
    }

    // ── Gate perm WITHOUT endpoint perm → 403 ────────────────────────

    [Fact]
    public async Task CostForgeCalculate_WithGateButNoWritePerm_Returns403()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: ["access:costforge", "read:system-status"]); // no calculate:property-cost

        var response = await client.PostAsync("/api/costforge/calculate",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            "CountyAuditor should not be able to trigger cost calculations — lacks calculate:property-cost");
    }

    // ── No perms at all → 403 ─────────────────────────────────────────

    [Fact]
    public async Task CostForgeStatus_NoPerm_Returns403()
    {
        using var client = CreateClient(
            countyId: Cx27PermClaimFactory.BentonCountyId,
            permClaims: []);

        var response = await client.GetAsync("/api/costforge/status");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private HttpClient CreateClient(Guid countyId, string[] permClaims)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx27PermClaimFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "dx04-auditor");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", countyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");

        if (permClaims.Length > 0)
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Perms", string.Join(",", permClaims));

        return client;
    }
}
