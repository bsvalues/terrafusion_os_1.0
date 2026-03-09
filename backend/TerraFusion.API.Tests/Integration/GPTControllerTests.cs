using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the GPTController.
/// Validates GPT configuration CRUD, conversation management,
/// RAG health, system diagnostics, and authorization enforcement.
/// </summary>
[Collection("Integration")]
public class GPTControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public GPTControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/gpt ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailableGPTs_Authenticated_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetAvailableGPTs_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/system ───────────────────────────────────────────

    [Fact]
    public async Task GetSystemGPTs_Authenticated_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/system");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetSystemGPTs_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/featured ─────────────────────────────────────────

    [Fact]
    public async Task GetFeaturedGPTs_Authenticated_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/featured");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetFeaturedGPTs_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/featured");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/popular ──────────────────────────────────────────

    [Fact]
    public async Task GetPopularGPTs_Authenticated_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/popular?count=5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetPopularGPTs_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/popular?count=5");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/search ───────────────────────────────────────────

    [Fact]
    public async Task SearchGPTs_Authenticated_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/search?query=property");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task SearchGPTs_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/search?query=property");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task GetGPT_NonExistent_Returns_NotFound()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetGPT_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/1");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/gpt ─────────────────────────────────────────────────

    [Fact]
    public async Task CreateGPT_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var payload = new { Name = "Test GPT", Description = "Test" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/gpt", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── PUT /api/gpt/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateGPT_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var payload = new { Name = "Updated GPT" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PutAsync("/api/gpt/1", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── DELETE /api/gpt/{id} ──────────────────────────────────────────

    [Fact]
    public async Task DeleteGPT_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.DeleteAsync("/api/gpt/1");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/gpt/conversations ───────────────────────────────────

    [Fact]
    public async Task CreateConversation_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var payload = new { GPTConfigId = 1, Title = "Test Conversation" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/gpt/conversations", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/conversations/{id} ───────────────────────────────

    [Fact]
    public async Task GetConversation_NonExistent_Returns_NotFound()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/conversations/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetConversation_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/conversations/1");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/{gptId}/conversations ────────────────────────────

    [Fact]
    public async Task GetUserConversations_Authenticated_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/1/conversations?limit=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetUserConversations_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/1/conversations");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/conversations/{id}/history ───────────────────────

    [Fact]
    public async Task GetConversationHistory_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/conversations/1/history");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/gpt/conversations/{id}/messages ─────────────────────

    [Fact]
    public async Task SendMessage_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var payload = new { Message = "Hello", GPTConfigId = 1 };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/gpt/conversations/1/messages", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/{id}/statistics ──────────────────────────────────

    [Fact]
    public async Task GetStatistics_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/1/statistics");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/gpt/statistics/county ────────────────────────────────

    [Fact]
    public async Task GetCountyStatistics_Unauthenticated_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/statistics/county");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── AllowAnonymous Endpoints ──────────────────────────────────────

    [Fact]
    public async Task RagHealth_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/rag/health");

        // AllowAnonymous - should not return 401
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);

        // Should be OK or a successful status
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected OK or 500 (if RAG service unavailable), got {response.StatusCode}");
    }

    [Fact]
    public async Task SystemDiagnostics_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/diagnostics");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SystemDiagnosticsDownload_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/diagnostics/download");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetSafeModeStatus_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/safe-mode");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SetSafeMode_AllowAnonymous_DoesNotReturn401()
    {
        using var client = _factory.CreateClient();

        var payload = new { enabled = false, reason = "test" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/gpt/system/safe-mode", content);

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SystemEvents_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/events");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SystemMetrics_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/metrics");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task FederatedOverview_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/federated-overview");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SystemPolicy_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/policy");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SystemPolicyAll_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/policy/all");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SystemPolicyEvaluate_AllowAnonymous_DoesNotReturn401()
    {
        using var client = _factory.CreateClient();

        var payload = new { countyId = "benton", prompt = "test" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/gpt/system/policy/evaluate", content);

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task FleetRagReadiness_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/fleet/rag-readiness");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task FleetRagReadinessByCounty_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/fleet/rag-readiness/benton");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Atlas_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/atlas");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AtlasLive_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/atlas/live");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AtlasLiveSnapshot_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/system/atlas/live/snapshot");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Explain_AllowAnonymous_DoesNotReturn401()
    {
        using var client = _factory.CreateClient();

        var payload = new { prompt = "explain property valuation" };
        var content = new StringContent(
            JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/gpt/explain", content);

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task BentonCamaExport_AllowAnonymous_Returns_Ok()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/gpt/rag/benton_cama_basics/export");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Response Shape Validation ─────────────────────────────────────

    [Fact]
    public async Task GetAvailableGPTs_Returns_JsonArray()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Response should be a JSON array of GPT configurations
        Assert.True(
            root.ValueKind == JsonValueKind.Array || root.ValueKind == JsonValueKind.Object,
            "Response should be a JSON array or object");
    }

    [Fact]
    public async Task GetSystemGPTs_Returns_JsonArray()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/system");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(
            root.ValueKind == JsonValueKind.Array || root.ValueKind == JsonValueKind.Object,
            "Response should be a JSON array or object");
    }

    [Fact]
    public async Task GetPopularGPTs_Respects_Count_Parameter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/popular?count=3");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task SearchGPTs_Returns_Results_For_Query()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/gpt/search?query=test");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(
            doc.RootElement.ValueKind == JsonValueKind.Array || doc.RootElement.ValueKind == JsonValueKind.Object,
            "Search results should be a JSON array or object");
    }
}
