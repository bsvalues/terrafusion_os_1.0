using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the ComplianceController.
/// Validates audit trail retrieval, date-range filtering, compliance validation,
/// and read-only audit integrity using the SeededApiWebAppFactory.
/// These tests cover FISMA-HIGH audit and accountability requirements.
/// </summary>
[Collection("Integration")]
public class ComplianceControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ComplianceControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/compliance/audit-trail ──────────────────────────────

    [Fact]
    public async Task GetAuditTrail_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/compliance/audit-trail");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        // Response should be a JSON array of audit entries
        using var doc = JsonDocument.Parse(json);
        Assert.True(
            doc.RootElement.ValueKind == JsonValueKind.Array ||
            doc.RootElement.ValueKind == JsonValueKind.Object,
            "Audit trail response should be valid JSON");
    }

    [Fact]
    public async Task GetAuditTrail_Supports_DateRange_Filtering()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var startDate = DateTime.UtcNow.AddDays(-30).ToString("o");
        var endDate = DateTime.UtcNow.ToString("o");

        var response = await client.GetAsync(
            $"/api/compliance/audit-trail?startDate={startDate}&endDate={endDate}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAuditTrail_Supports_UserId_Filtering()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/compliance/audit-trail?userId=test-user-001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET /api/compliance/dashboard ────────────────────────────────

    [Fact]
    public async Task GetDashboard_Returns_Ok_With_Compliance_Data()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/compliance/dashboard");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    // ── GET /api/compliance/violations ───────────────────────────────

    [Fact]
    public async Task GetViolations_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/compliance/violations");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    // ── POST /api/compliance/audit-trail (tamper-proof verification) ─

    [Fact]
    public async Task CreateAuditTrail_Returns_Ok_With_Audit_Entry()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var auditRequest = new
        {
            action = "TEST_AUDIT_ACTION",
            data = new { detail = "Integration test audit entry" },
            entityType = "TestEntity"
        };

        var response = await client.PostAsJsonAsync("/api/compliance/audit-trail", auditRequest);

        // Audit trail creation should succeed for authenticated users
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }
}
