using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for DAIS (District Assessment Information System) endpoints.
/// Tests certification status, exemption impact analysis, and notice drafting.
/// All tests use SeededApiWebAppFactory with authenticated JWT.
/// </summary>
[Collection("Integration")]
public class DaisControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public DaisControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/dais/certification/status ────────────────────────────

    [Fact]
    public async Task GetCertificationStatus_Returns_Ok_With_Status()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dais/certification/status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("county", out var county));
        Assert.False(string.IsNullOrWhiteSpace(county.GetString()));

        Assert.True(root.TryGetProperty("year", out var year));
        Assert.True(year.GetInt32() > 2000);

        Assert.True(root.TryGetProperty("status", out var status));
        var statusStr = status.GetString();
        Assert.Contains(statusStr, new[] { "not_started", "in_progress", "certified" });

        Assert.True(root.TryGetProperty("completionPercent", out _));
        Assert.True(root.TryGetProperty("parcelsReviewed", out _));
        Assert.True(root.TryGetProperty("totalParcels", out _));
    }

    [Fact]
    public async Task GetCertificationStatus_Accepts_Year_Parameter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dais/certification/status?year=2024");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(2024, root.GetProperty("year").GetInt32());
    }

    [Fact]
    public async Task GetCertificationStatus_Returns_Unauthorized_Without_CountyClaim()
    {
        var client = _factory.CreateClient();
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            countyId: "",
            countyCode: null,
            permissions: AuthenticatedClientExtensions.AllPermissions);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/dais/certification/status");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/dais/exemptions/{county}/impact ──────────────────────

    [Fact]
    public async Task GetExemptionImpact_Returns_Ok_For_Own_County()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dais/exemptions/BENTON/impact");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("summary", out var summary));
        Assert.False(string.IsNullOrWhiteSpace(summary.GetString()));

        Assert.True(root.TryGetProperty("assumptions", out var assumptions));
        Assert.Equal(JsonValueKind.Array, assumptions.ValueKind);

        Assert.True(root.TryGetProperty("impactBands", out var bands));
        Assert.Equal(JsonValueKind.Array, bands.ValueKind);
        Assert.True(bands.GetArrayLength() >= 1, "Should have at least one impact band");

        // Verify band structure
        foreach (var band in bands.EnumerateArray())
        {
            Assert.True(band.TryGetProperty("tier", out _));
            Assert.True(band.TryGetProperty("estTaxChange", out _));
        }
    }

    [Fact]
    public async Task GetExemptionImpact_Accepts_Program_Filter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync(
            "/api/dais/exemptions/BENTON/impact?program=veteran&year=2025");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var summary = root.GetProperty("summary").GetString();
        Assert.Contains("Veteran", summary, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetExemptionImpact_Forbids_CrossCounty_Request()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // Benton county user tries to access Franklin county exemptions
        var response = await client.GetAsync("/api/dais/exemptions/FRANKLIN/impact");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetExemptionImpact_Returns_Unauthorized_Without_CountyClaim()
    {
        var client = _factory.CreateClient();
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            countyId: "",
            countyCode: null,
            permissions: AuthenticatedClientExtensions.AllPermissions);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/dais/exemptions/BENTON/impact");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/dais/notices/draft ──────────────────────────────────

    [Fact]
    public async Task DraftNotice_Returns_Ok_With_Notice_Payload()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            parcelId = "TEST-001",
            taxYear = 2025,
            reasonCodes = new[] { "market_increase", "remodel" },
            tone = "friendly",
        };

        var response = await client.PostAsJsonAsync("/api/dais/notices/draft", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("title", out var title));
        Assert.Contains("2025", title.GetString());

        Assert.True(root.TryGetProperty("body", out var body));
        Assert.Contains("market_increase", body.GetString());

        Assert.True(root.TryGetProperty("payloadRef", out var payloadRef));
        Assert.Contains("dossier://", payloadRef.GetString());

        Assert.True(root.TryGetProperty("disclaimer", out _));
    }

    [Fact]
    public async Task DraftNotice_Returns_Ok_With_Neutral_Tone()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            parcelId = "TEST-001",
            taxYear = 2025,
            reasonCodes = new[] { "annual_review" },
            // Omit tone to default to neutral
        };

        var response = await client.PostAsJsonAsync("/api/dais/notices/draft", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var body = doc.RootElement.GetProperty("body").GetString()!;

        Assert.Contains("information about your assessment change", body);
    }

    [Fact]
    public async Task DraftNotice_Returns_Unauthorized_Without_CountyClaim()
    {
        var client = _factory.CreateClient();
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            countyId: "",
            countyCode: null,
            permissions: AuthenticatedClientExtensions.AllPermissions);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            parcelId = "TEST-001",
            taxYear = 2025,
            reasonCodes = new[] { "annual_review" },
        };

        var response = await client.PostAsJsonAsync("/api/dais/notices/draft", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/dais/tasks/assign ───────────────────────────────────

    [Fact]
    public async Task AssignTask_Returns_Ok_With_TaskId()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            taskType = "field_inspection",
            assigneeId = "user-123",
            parcelId = "TEST-001",
            description = "Annual inspection",
        };

        var response = await client.PostAsJsonAsync("/api/dais/tasks/assign", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("taskId", out var taskId));
        Assert.StartsWith("task-", taskId.GetString());

        Assert.True(root.TryGetProperty("status", out var status));
        Assert.Equal("assigned", status.GetString());

        Assert.True(root.TryGetProperty("assignedAt", out _));
    }

    // ── POST /api/dais/packets/assemble ───────────────────────────────

    [Fact]
    public async Task AssembleBoePacket_Returns_Ok_With_Sections()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            caseId = "BOE-2025-001",
            include = new[] { "comparable_sales", "photographs" },
        };

        var response = await client.PostAsJsonAsync("/api/dais/packets/assemble", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("caseId", out var caseId));
        Assert.Equal("BOE-2025-001", caseId.GetString());

        Assert.True(root.TryGetProperty("packetRef", out var packetRef));
        Assert.Contains("dossier://", packetRef.GetString());

        Assert.True(root.TryGetProperty("sections", out var sections));
        Assert.Equal(JsonValueKind.Array, sections.ValueKind);
        // Should contain cover_sheet + requested sections + certification
        Assert.True(sections.GetArrayLength() >= 3);

        Assert.True(root.TryGetProperty("assembledAt", out _));
    }
}
