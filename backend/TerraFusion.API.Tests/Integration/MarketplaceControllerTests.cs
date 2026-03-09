using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the MarketplaceController.
/// Validates plugin listing, category retrieval, plugin download,
/// rating submission, plugin submission, and plugin publishing
/// using seeded test data.
/// </summary>
[Collection("Integration")]
public class MarketplaceControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public MarketplaceControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/marketplace/plugins ──────────────────────────────

    [Fact]
    public async Task GetPlugins_Returns_Ok_With_Plugins_Array()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(
            root.TryGetProperty("plugins", out var pluginsElement),
            "Response should contain 'plugins' property");
        Assert.Equal(JsonValueKind.Array, pluginsElement.ValueKind);
    }

    [Fact]
    public async Task GetPlugins_Supports_Search_Filter()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins?search=nonexistent-plugin-xyz");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("plugins", out var pluginsElement));
        Assert.Equal(JsonValueKind.Array, pluginsElement.ValueKind);
    }

    [Fact]
    public async Task GetPlugins_Supports_Category_Filter()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins?category=Government");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("plugins", out _));
    }

    [Fact]
    public async Task GetPlugins_Supports_Sort_By_Rating()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins?sort=rating");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPlugins_Supports_Sort_By_Name()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins?sort=name");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPlugins_Supports_Sort_By_Updated()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins?sort=updated");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPlugins_Default_Sort_Is_Downloads()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET /api/marketplace/categories ───────────────────────────

    [Fact]
    public async Task GetCategories_Returns_Ok_With_Array()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal(JsonValueKind.Array, root.ValueKind);
        Assert.True(root.GetArrayLength() > 0, "Categories array should not be empty");
    }

    [Fact]
    public async Task GetCategories_Contains_Expected_Category_Properties()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var firstCategory = root[0];
        Assert.True(firstCategory.TryGetProperty("name", out _), "Category should have 'name' property");
        Assert.True(firstCategory.TryGetProperty("count", out _), "Category should have 'count' property");
        Assert.True(firstCategory.TryGetProperty("icon", out _), "Category should have 'icon' property");
    }

    // ── POST /api/marketplace/plugins/{id}/download ──────────────

    [Fact]
    public async Task DownloadPlugin_Returns_NotFound_For_Unknown_Plugin()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/marketplace/plugins/nonexistent-plugin/download", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── POST /api/marketplace/plugins/{id}/rate ──────────────────

    [Fact]
    public async Task RatePlugin_Returns_Ok_With_Valid_Rating()
    {
        using var client = _factory.CreateClient();

        var ratingPayload = new { Rating = 5 };
        var response = await client.PostAsJsonAsync("/api/marketplace/plugins/test-plugin/rate", ratingPayload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("message", out var messageElement));
        Assert.Contains("Rating submitted", messageElement.GetString());
    }

    // ── POST /api/marketplace/submit ─────────────────────────────

    [Fact]
    public async Task SubmitPlugin_Returns_BadRequest_For_Invalid_Model()
    {
        using var client = _factory.CreateClient();

        // Send empty object - required fields are missing
        var invalidPayload = new { };
        var response = await client.PostAsJsonAsync("/api/marketplace/submit", invalidPayload);

        // Should return BadRequest due to model validation failure
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SubmitPlugin_Returns_BadRequest_For_Invalid_Version_Format()
    {
        using var client = _factory.CreateClient();

        var payload = new
        {
            Name = "Test Plugin",
            Version = "invalid-version",
            Description = "A test plugin",
            Category = "Government",
            PackageData = "dGVzdA==",
            ManifestJson = "{}"
        };

        var response = await client.PostAsJsonAsync("/api/marketplace/submit", payload);

        // Should return BadRequest due to version format validation
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── POST /api/marketplace/publish ────────────────────────────

    [Fact]
    public async Task PublishPlugin_Returns_BadRequest_For_Invalid_Model()
    {
        using var client = _factory.CreateClient();

        // Send empty object - required fields are missing
        var invalidPayload = new { };
        var response = await client.PostAsJsonAsync("/api/marketplace/publish", invalidPayload);

        // Should return BadRequest due to model validation failure
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Authorization tests ──────────────────────────────────────
    // Note: MarketplaceController does NOT have [Authorize] attribute,
    // so all endpoints are publicly accessible. These tests verify
    // that unauthenticated access is allowed (no 401 returned).

    [Fact]
    public async Task GetPlugins_Allows_Unauthenticated_Access()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/plugins");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetCategories_Allows_Unauthenticated_Access()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/marketplace/categories");

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RatePlugin_Allows_Unauthenticated_Access()
    {
        using var client = _factory.CreateClient();

        var ratingPayload = new { Rating = 4 };
        var response = await client.PostAsJsonAsync("/api/marketplace/plugins/test-plugin/rate", ratingPayload);

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Authenticated client tests ───────────────────────────────
    // Verify authenticated requests also work correctly.

    [Fact]
    public async Task GetPlugins_Returns_Ok_With_Authenticated_Client()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/marketplace/plugins");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("plugins", out _));
    }

    [Fact]
    public async Task GetCategories_Returns_Ok_With_Authenticated_Client()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/marketplace/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
