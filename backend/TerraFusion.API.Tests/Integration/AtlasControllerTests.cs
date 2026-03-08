using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for TerraAtlas GIS / parcel geometry endpoints.
/// Tests parcel lookup, centroid, geometry upsert, stats, and nearby queries.
/// All tests use SeededApiWebAppFactory with authenticated JWT.
/// </summary>
[Collection("Integration")]
public class AtlasControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public AtlasControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── GET /api/atlas/parcels/{parcelId} ─────────────────────────────

    [Fact]
    public async Task GetParcelGeometry_Returns_Ok_For_Known_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/parcels/TEST-001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("parcelId", out var parcelId));
        Assert.Equal("TEST-001", parcelId.GetString());

        Assert.True(root.TryGetProperty("address", out _));
        Assert.True(root.TryGetProperty("propertyType", out _));
        Assert.True(root.TryGetProperty("layers", out var layers));
        Assert.Equal(JsonValueKind.Array, layers.ValueKind);
        Assert.True(root.TryGetProperty("geometryAvailable", out _));
    }

    [Fact]
    public async Task GetParcelGeometry_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/parcels/NONEXIST-999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetParcelGeometry_Returns_BadRequest_For_Invalid_ParcelId()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // Parcel IDs with special chars should be rejected
        var response = await client.GetAsync("/api/atlas/parcels/invalid%20id%21");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetParcelGeometry_Returns_NotFound_For_CrossCounty_Parcel()
    {
        // Benton county user tries to access Franklin county parcel
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/parcels/OTHER-001");

        // County isolation: parcel belongs to OTHER county, not the caller's county
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/atlas/parcels/{parcelId}/centroid ────────────────────

    [Fact]
    public async Task GetParcelCentroid_Returns_NotFound_Without_Geometry()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // TEST-001 exists but has no ParcelGeometry seeded, so centroid unavailable
        var response = await client.GetAsync("/api/atlas/parcels/TEST-001/centroid");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetParcelCentroid_Returns_BadRequest_For_Invalid_ParcelId()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/parcels/bad%20id!/centroid");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── PUT /api/atlas/parcels/{parcelId}/geometry ────────────────────

    [Fact]
    public async Task UpsertGeometry_Creates_New_Geometry_For_Known_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            geoJson = """{"type":"Polygon","coordinates":[[[-119.28,46.28],[-119.27,46.28],[-119.27,46.29],[-119.28,46.29],[-119.28,46.28]]]}""",
            centroidLat = 46.285,
            centroidLng = -119.275,
            areaSqft = 43560.0,
            areaAcres = 1.0,
            zoningCode = "R-1",
            zoningDescription = "Residential Single Family",
            srid = 4326,
            source = "test_import",
        };

        var response = await client.PutAsJsonAsync("/api/atlas/parcels/TEST-001/geometry", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("TEST-001", root.GetProperty("parcelId").GetString());
        Assert.Equal("created", root.GetProperty("status").GetString());
        Assert.True(root.GetProperty("geometryAvailable").GetBoolean());
    }

    [Fact]
    public async Task UpsertGeometry_Updates_Existing_Geometry()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // First create
        var createPayload = new
        {
            centroidLat = 46.285,
            centroidLng = -119.275,
            zoningCode = "R-1",
        };
        await client.PutAsJsonAsync("/api/atlas/parcels/TEST-002/geometry", createPayload);

        // Now update
        var updatePayload = new
        {
            centroidLat = 46.290,
            centroidLng = -119.280,
            zoningCode = "C-2",
            zoningDescription = "Commercial General",
        };
        var response = await client.PutAsJsonAsync("/api/atlas/parcels/TEST-002/geometry", updatePayload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("updated", doc.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task UpsertGeometry_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { centroidLat = 46.0, centroidLng = -119.0 };
        var response = await client.PutAsJsonAsync("/api/atlas/parcels/NONEXIST-999/geometry", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpsertGeometry_Returns_NotFound_For_CrossCounty_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { centroidLat = 46.0, centroidLng = -119.0 };
        var response = await client.PutAsJsonAsync("/api/atlas/parcels/OTHER-001/geometry", payload);

        // County isolation: cannot modify parcel in another county
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/atlas/geometry/stats ─────────────────────────────────

    [Fact]
    public async Task GetGeometryStats_Returns_Ok_With_Coverage_Metrics()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/geometry/stats");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("totalParcels", out var total));
        Assert.True(total.GetInt32() >= 0);

        Assert.True(root.TryGetProperty("withGeometry", out _));
        Assert.True(root.TryGetProperty("withCentroid", out _));
        Assert.True(root.TryGetProperty("withZoning", out _));
        Assert.True(root.TryGetProperty("coveragePercent", out _));
        Assert.True(root.TryGetProperty("centroidCoveragePercent", out _));
    }

    // ── GET /api/atlas/parcels/{parcelId}/nearby ──────────────────────

    [Fact]
    public async Task GetNearbyParcels_Returns_Ok_With_Fallback_Heuristic()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/parcels/TEST-001/nearby?limit=5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("subjectParcelId", out var subject));
        Assert.Equal("TEST-001", subject.GetString());

        Assert.True(root.TryGetProperty("total", out var total));
        Assert.True(total.GetInt32() >= 0);

        Assert.True(root.TryGetProperty("parcels", out var parcels));
        Assert.Equal(JsonValueKind.Array, parcels.ValueKind);
    }

    [Fact]
    public async Task GetNearbyParcels_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/atlas/parcels/NONEXIST-999/nearby");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetNearbyParcels_Clamps_Limit_Parameter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // Request limit > 50 should be clamped to 50
        var response = await client.GetAsync("/api/atlas/parcels/TEST-001/nearby?limit=999");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var parcels = root.GetProperty("parcels");
        Assert.True(parcels.GetArrayLength() <= 50);
    }

    [Fact]
    public async Task GetNearbyParcels_Filters_By_PropertyType()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync(
            "/api/atlas/parcels/TEST-001/nearby?propertyType=Commercial&limit=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("propertyTypeFilter", out var filter));
        Assert.Equal("Commercial", filter.GetString());
    }
}
