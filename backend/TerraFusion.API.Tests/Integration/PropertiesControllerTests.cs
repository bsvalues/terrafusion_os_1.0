using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the PropertiesController.
/// Validates property CRUD operations, county data isolation,
/// pagination, and parcel-based lookups using seeded test data.
/// </summary>
[Collection("Integration")]
public class PropertiesControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public PropertiesControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/properties ─────────────────────────────────────────

    [Fact]
    public async Task GetProperties_Returns_Ok_With_Paged_Result()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/properties?page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Paged result should have items array or data property
        Assert.True(
            root.TryGetProperty("items", out _) || root.TryGetProperty("data", out _),
            "Response should contain 'items' or 'data' property for paged results");
    }

    [Fact]
    public async Task GetProperties_Supports_Pagination_Parameters()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/properties?page=1&pageSize=1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET /api/properties/{id} ────────────────────────────────────

    [Fact]
    public async Task GetProperty_Returns_Ok_For_Known_Property()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync($"/api/properties/{SeededApiWebAppFactory.Property1Id}");

        // Should return OK (property exists in caller's county)
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetProperty_Returns_NotFound_For_NonExistent_Id()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var nonExistentId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var response = await client.GetAsync($"/api/properties/{nonExistentId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetProperty_Enforces_County_Isolation()
    {
        // Benton county user should NOT see Franklin county property
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync($"/api/properties/{SeededApiWebAppFactory.OtherPropertyId}");

        // County isolation: property belongs to OTHER county, expect NotFound
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/properties/parcel/{parcelNumber} ───────────────────

    [Fact]
    public async Task GetPropertyByParcel_Returns_Ok_For_Known_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/properties/parcel/TEST-001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));
    }

    [Fact]
    public async Task GetPropertyByParcel_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/properties/parcel/NONEXIST-999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
