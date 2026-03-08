using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the CountyDeploymentController.
/// Validates deployment listing, single deployment lookup, deployment templates,
/// and county health endpoints using the SeededApiWebAppFactory.
/// </summary>
[Collection("Integration")]
public class CountyDeploymentControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public CountyDeploymentControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/countydeployment/deployments ───────────────────────

    [Fact]
    public async Task GetCountyDeployments_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/countydeployment/deployments");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("deployments", out var deployments));
        Assert.Equal(JsonValueKind.Array, deployments.ValueKind);
    }

    // ── GET /api/countydeployment/deployments/{countyId} ────────────

    [Fact]
    public async Task GetCountyDeployment_Returns_NotFound_For_Unknown_County()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/countydeployment/deployments/nonexistent-county-id");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/countydeployment/templates ──────────────────────────

    [Fact]
    public async Task GetDeploymentTemplates_Returns_Ok_With_Templates()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/countydeployment/templates");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("templates", out var templates));
        Assert.Equal(JsonValueKind.Array, templates.ValueKind);

        // Should have Basic, Professional, and Enterprise templates
        Assert.Equal(3, templates.GetArrayLength());
    }

    [Fact]
    public async Task GetDeploymentTemplates_Contains_Expected_Template_Types()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/countydeployment/templates");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var templates = doc.RootElement.GetProperty("templates");

        var templateNames = new List<string>();
        foreach (var template in templates.EnumerateArray())
        {
            if (template.TryGetProperty("name", out var name))
                templateNames.Add(name.GetString()!);
        }

        Assert.Contains("Basic County", templateNames);
        Assert.Contains("Professional County", templateNames);
        Assert.Contains("Enterprise County", templateNames);
    }

    // ── PUT /api/countydeployment/deployments/{countyId}/configuration ──

    [Fact]
    public async Task UpdateCountyConfiguration_Returns_NotFound_For_Unknown_County()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var config = new
        {
            databaseConnection = "Server=test;Database=test",
            apiEndpoint = "https://test.county.gov/api",
            enabledFeatures = new[] { "GIS", "Assessment" },
            customSettings = new Dictionary<string, string> { { "key", "value" } }
        };

        var response = await client.PutAsJsonAsync(
            "/api/countydeployment/deployments/00000000-0000-0000-0000-999999999999/configuration",
            config);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── POST /api/countydeployment/deployments/{countyId}/validate ───

    [Fact]
    public async Task ValidateCountyData_Returns_Ok_With_Validation_Result()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var countyId = AuthenticatedClientExtensions.TestCountyId.ToString();
        var response = await client.PostAsync(
            $"/api/countydeployment/deployments/{countyId}/validate",
            null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("countyId", out var returnedId));
        Assert.Equal(countyId, returnedId.GetString());
        Assert.True(root.TryGetProperty("isValid", out _));
        Assert.True(root.TryGetProperty("message", out _));
    }
}
