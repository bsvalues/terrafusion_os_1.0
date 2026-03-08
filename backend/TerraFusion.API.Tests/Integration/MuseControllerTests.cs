using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the Muse NLP engine controller endpoints.
/// Tests all 7 endpoints: capabilities, explain (2), draft (3), synthesize (1).
/// Verifies authentication, authorization, and county isolation.
/// All tests use SeededApiWebAppFactory with authenticated JWT.
/// </summary>
[Collection("Integration")]
public class MuseControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    /// <summary>
    /// Permissions required by MuseController endpoints.
    /// Includes read:parcel, write:notice, write:appeal plus base permissions.
    /// </summary>
    private static readonly string[] MusePermissions =
    [
        "read:parcel",
        "write:parcel",
        "write:notice",
        "write:appeal",
        "read:dossier",
        "write:dossier",
    ];

    public MuseControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/muse/capabilities ────────────────────────────────────

    [Fact]
    public async Task Capabilities_Returns_Ok_With_Engine_Metadata()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var response = await client.GetAsync("/api/muse/capabilities");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("engine", out var engine));
        Assert.Equal("muse-template-v1", engine.GetString());

        Assert.True(root.TryGetProperty("aiPowered", out var aiPowered));
        Assert.False(aiPowered.GetBoolean());

        Assert.True(root.TryGetProperty("supportedTypes", out var types));
        Assert.Equal(JsonValueKind.Array, types.ValueKind);
        Assert.True(types.GetArrayLength() >= 6);

        Assert.True(root.TryGetProperty("audiences", out var audiences));
        Assert.Equal(JsonValueKind.Array, audiences.ValueKind);
        Assert.True(audiences.GetArrayLength() >= 4);
    }

    [Fact]
    public async Task Capabilities_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/muse/capabilities");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/muse/explain/value-change ───────────────────────────

    [Fact]
    public async Task ExplainValueChange_Returns_Ok_With_ExplanationResult()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new
        {
            parcelId = "TEST-001",
            fromYear = 2023,
            toYear = 2024,
            fromValue = 310000m,
            toValue = 350000m,
            audience = "internal",
        };

        var response = await client.PostAsJsonAsync("/api/muse/explain/value-change", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("parcelId", out var parcelId));
        Assert.Equal("TEST-001", parcelId.GetString());

        Assert.True(root.TryGetProperty("explanation", out var explanation));
        Assert.False(string.IsNullOrWhiteSpace(explanation.GetString()));

        Assert.True(root.TryGetProperty("drivers", out var drivers));
        Assert.Equal(JsonValueKind.Array, drivers.ValueKind);
        Assert.True(drivers.GetArrayLength() > 0);

        Assert.True(root.TryGetProperty("confidence", out var confidence));
        Assert.True(confidence.GetDouble() > 0);

        Assert.True(root.TryGetProperty("engine", out var engine));
        Assert.Equal("muse-template-v1", engine.GetString());
    }

    [Fact]
    public async Task ExplainValueChange_Taxpayer_Audience_Returns_PlainLanguage()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new
        {
            parcelId = "TEST-001",
            fromValue = 300000m,
            toValue = 350000m,
            audience = "taxpayer",
        };

        var response = await client.PostAsJsonAsync("/api/muse/explain/value-change", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var explanation = doc.RootElement.GetProperty("explanation").GetString()!;
        Assert.Contains("Your property", explanation);
        Assert.Contains("TEST-001", explanation);
    }

    [Fact]
    public async Task ExplainValueChange_Commissioner_Audience_Returns_ExecutiveSummary()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new
        {
            parcelId = "TEST-001",
            fromYear = 2023,
            toYear = 2024,
            fromValue = 310000m,
            toValue = 350000m,
            audience = "commissioner",
        };

        var response = await client.PostAsJsonAsync("/api/muse/explain/value-change", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var explanation = doc.RootElement.GetProperty("explanation").GetString()!;
        Assert.Contains("USPAP", explanation);
        Assert.Contains("IAAO", explanation);
    }

    [Fact]
    public async Task ExplainValueChange_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var payload = new { parcelId = "TEST-001", fromValue = 100000m, toValue = 200000m };

        var response = await client.PostAsJsonAsync("/api/muse/explain/value-change", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/muse/explain/assessment ─────────────────────────────

    [Fact]
    public async Task ExplainAssessment_Returns_Ok_For_Known_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new { parcelId = "TEST-001", audience = "internal" };

        var response = await client.PostAsJsonAsync("/api/muse/explain/assessment", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("TEST-001", root.GetProperty("parcelId").GetString());

        var explanation = root.GetProperty("explanation").GetString()!;
        Assert.Contains("123 Main St", explanation);
        Assert.Contains("Residential", explanation);
        Assert.Contains("USPAP", explanation);
        Assert.Contains("RCW 84.40.030", explanation);

        Assert.True(root.GetProperty("confidence").GetDouble() > 0.9);
        Assert.Equal("muse-template-v1", root.GetProperty("engine").GetString());
    }

    [Fact]
    public async Task ExplainAssessment_Returns_Ok_With_NotFound_Message_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new { parcelId = "NONEXIST-999" };

        var response = await client.PostAsJsonAsync("/api/muse/explain/assessment", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var explanation = doc.RootElement.GetProperty("explanation").GetString()!;
        Assert.Contains("No property record found", explanation);
        Assert.Equal(0.0, doc.RootElement.GetProperty("confidence").GetDouble());
    }

    [Fact]
    public async Task ExplainAssessment_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var payload = new { parcelId = "TEST-001" };

        var response = await client.PostAsJsonAsync("/api/muse/explain/assessment", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/muse/draft/notice ───────────────────────────────────

    [Fact]
    public async Task DraftNotice_Returns_Ok_With_DraftResult()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new
        {
            parcelId = "TEST-001",
            noticeType = "value_change",
            taxYear = 2025,
        };

        var response = await client.PostAsJsonAsync("/api/muse/draft/notice", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("TEST-001", root.GetProperty("parcelId").GetString());

        var draft = root.GetProperty("draft").GetString()!;
        Assert.Contains("NOTICE OF ASSESSED VALUE", draft);
        Assert.Contains("RCW 84.40.030", draft);
        Assert.Contains("RCW 84.40.038", draft);
        Assert.Contains("Board of Equalization", draft);

        Assert.Equal("value_change", root.GetProperty("noticeType").GetString());
        Assert.Equal("muse-template-v1", root.GetProperty("engine").GetString());
    }

    [Fact]
    public async Task DraftNotice_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var payload = new { parcelId = "TEST-001" };

        var response = await client.PostAsJsonAsync("/api/muse/draft/notice", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/muse/draft/appeal-response ──────────────────────────

    [Fact]
    public async Task DraftAppealResponse_Returns_Ok_With_DraftResult()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new
        {
            parcelId = "TEST-001",
            caseId = "CASE-2025-001",
            assessedValue = 350000m,
        };

        var response = await client.PostAsJsonAsync("/api/muse/draft/appeal-response", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("TEST-001", root.GetProperty("parcelId").GetString());

        var draft = root.GetProperty("draft").GetString()!;
        Assert.Contains("CASE-2025-001", draft);
        Assert.Contains("Board of Equalization", draft);
        Assert.Contains("USPAP", draft);
        Assert.Contains("RCW 84.40.030", draft);

        Assert.Equal("appeal_response", root.GetProperty("noticeType").GetString());
        Assert.Equal("muse-template-v1", root.GetProperty("engine").GetString());
    }

    [Fact]
    public async Task DraftAppealResponse_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var payload = new { parcelId = "TEST-001", caseId = "CASE-001", assessedValue = 100000m };

        var response = await client.PostAsJsonAsync("/api/muse/draft/appeal-response", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/muse/draft/memo ─────────────────────────────────────

    [Fact]
    public async Task DraftMemo_Returns_Ok_With_DraftResult()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new
        {
            topic = "2025 Residential Property Assessment Trends",
            context = "Residential values increased 5% county-wide.",
        };

        var response = await client.PostAsJsonAsync("/api/muse/draft/memo", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var draft = root.GetProperty("draft").GetString()!;
        Assert.Contains("MEMORANDUM", draft);
        Assert.Contains("Board of County Commissioners", draft);
        Assert.Contains("2025 Residential Property Assessment Trends", draft);
        Assert.Contains("Residential values increased 5% county-wide.", draft);

        Assert.Equal("commissioner_memo", root.GetProperty("noticeType").GetString());
        Assert.Equal("muse-template-v1", root.GetProperty("engine").GetString());
    }

    [Fact]
    public async Task DraftMemo_Returns_Ok_Without_Context()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new { topic = "Annual Assessment Review" };

        var response = await client.PostAsJsonAsync("/api/muse/draft/memo", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var draft = doc.RootElement.GetProperty("draft").GetString()!;
        Assert.Contains("MEMORANDUM", draft);
        Assert.Contains("Annual Assessment Review", draft);
    }

    [Fact]
    public async Task DraftMemo_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var payload = new { topic = "Test" };

        var response = await client.PostAsJsonAsync("/api/muse/draft/memo", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/muse/synthesize ─────────────────────────────────────

    [Fact]
    public async Task SynthesizeEvidence_Returns_Ok_For_Known_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new { parcelId = "TEST-001" };

        var response = await client.PostAsJsonAsync("/api/muse/synthesize", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("TEST-001", root.GetProperty("parcelId").GetString());

        var synthesis = root.GetProperty("synthesis").GetString()!;
        Assert.Contains("TEST-001", synthesis);
        Assert.Contains("USPAP", synthesis);

        Assert.True(root.TryGetProperty("sources", out var sources));
        Assert.Equal(JsonValueKind.Array, sources.ValueKind);
        Assert.True(sources.GetArrayLength() > 0);

        Assert.True(root.GetProperty("confidence").GetDouble() > 0);
        Assert.Equal("muse-template-v1", root.GetProperty("engine").GetString());
    }

    [Fact]
    public async Task SynthesizeEvidence_Returns_Ok_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        var payload = new { parcelId = "NONEXIST-999" };

        var response = await client.PostAsJsonAsync("/api/muse/synthesize", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var synthesis = doc.RootElement.GetProperty("synthesis").GetString()!;
        Assert.Contains("No property record found", synthesis);
    }

    [Fact]
    public async Task SynthesizeEvidence_Returns_401_Without_Auth()
    {
        using var client = _factory.CreateClient();

        var payload = new { parcelId = "TEST-001" };

        var response = await client.PostAsJsonAsync("/api/muse/synthesize", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── County Isolation ──────────────────────────────────────────────

    [Fact]
    public async Task ExplainAssessment_CrossCounty_Parcel_Returns_NotFound_Explanation()
    {
        using var client = _factory.CreateAuthenticatedClient(permissions: MusePermissions);

        // OTHER-001 belongs to Franklin county; test user is Benton county
        var payload = new { parcelId = "OTHER-001" };

        var response = await client.PostAsJsonAsync("/api/muse/explain/assessment", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var explanation = doc.RootElement.GetProperty("explanation").GetString()!;
        Assert.Contains("No property record found", explanation);
    }
}
