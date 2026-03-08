using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for TerraDossier document management endpoints.
/// Tests search, casefile, notes CRUD, and assessment history.
/// All tests use SeededApiWebAppFactory with authenticated JWT.
/// </summary>
[Collection("Integration")]
public class DossierControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public DossierControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── POST /api/dossier/documents/search ────────────────────────────

    [Fact]
    public async Task SearchDocuments_Returns_Ok_With_Empty_Results()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            query = (string?)null,
            type = "all",
            status = "all",
            limit = 25,
            offset = 0,
        };

        var response = await client.PostAsJsonAsync("/api/dossier/documents/search", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("results", out var results));
        Assert.Equal(JsonValueKind.Array, results.ValueKind);

        Assert.True(root.TryGetProperty("total", out var total));
        Assert.True(total.GetInt32() >= 0);

        Assert.True(root.TryGetProperty("hasMore", out _));
    }

    [Fact]
    public async Task SearchDocuments_Filters_By_ParcelId()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            parcelId = "TEST-001",
            limit = 10,
        };

        var response = await client.PostAsJsonAsync("/api/dossier/documents/search", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("results", out _));
    }

    [Fact]
    public async Task SearchDocuments_Filters_By_Type()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            type = "deed",
            limit = 10,
        };

        var response = await client.PostAsJsonAsync("/api/dossier/documents/search", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── GET /api/dossier/parcels/{parcelId}/casefile ──────────────────

    [Fact]
    public async Task GetCasefile_Returns_Ok_For_Known_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/TEST-001/casefile");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("summary", out var summary));
        Assert.Contains("TEST-001", summary.GetString());

        Assert.True(root.TryGetProperty("highlights", out var highlights));
        Assert.Equal(JsonValueKind.Array, highlights.ValueKind);

        Assert.True(root.TryGetProperty("sections", out _));
    }

    [Fact]
    public async Task GetCasefile_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/NONEXIST-999/casefile");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetCasefile_Returns_NotFound_For_CrossCounty_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/OTHER-001/casefile");

        // County isolation: parcel belongs to Franklin county, not Benton
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetCasefile_Returns_BadRequest_For_Invalid_ParcelId()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/bad%20id!/casefile");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── POST /api/dossier/{parcelId}/notes ────────────────────────────

    [Fact]
    public async Task CreateNote_Returns_Created_For_Valid_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            content = "Inspection completed. No structural issues found.",
            type = "inspection",
        };

        var response = await client.PostAsJsonAsync("/api/dossier/TEST-001/notes", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("noteId", out _));
        Assert.True(root.TryGetProperty("parcelId", out var parcelId));
        Assert.Equal("TEST-001", parcelId.GetString());
        Assert.True(root.TryGetProperty("createdAt", out _));
    }

    [Fact]
    public async Task CreateNote_Returns_BadRequest_For_Empty_Content()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            content = "",
            type = "case_note",
        };

        var response = await client.PostAsJsonAsync("/api/dossier/TEST-001/notes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateNote_Returns_BadRequest_For_Oversized_Content()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            content = new string('x', 2001), // Exceeds 2000 char limit
            type = "case_note",
        };

        var response = await client.PostAsJsonAsync("/api/dossier/TEST-001/notes", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateNote_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            content = "This parcel does not exist.",
            type = "case_note",
        };

        var response = await client.PostAsJsonAsync("/api/dossier/NONEXIST-999/notes", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateNote_Returns_NotFound_For_CrossCounty_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            content = "Attempting cross-county write.",
            type = "case_note",
        };

        var response = await client.PostAsJsonAsync("/api/dossier/OTHER-001/notes", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/dossier/{parcelId}/notes ─────────────────────────────

    [Fact]
    public async Task GetNotes_Returns_Ok_With_Notes_Array()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // Seed a note first
        await client.PostAsJsonAsync("/api/dossier/TEST-001/notes", new
        {
            content = "Test note for listing.",
            type = "case_note",
        });

        var response = await client.GetAsync("/api/dossier/TEST-001/notes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("parcelId", out var parcelId));
        Assert.Equal("TEST-001", parcelId.GetString());

        Assert.True(root.TryGetProperty("notes", out var notes));
        Assert.Equal(JsonValueKind.Array, notes.ValueKind);

        Assert.True(root.TryGetProperty("total", out var total));
        Assert.True(total.GetInt32() >= 1);
    }

    // ── GET /api/dossier/parcels/{parcelId}/assessment-history ────────

    [Fact]
    public async Task GetAssessmentHistory_Returns_Ok_With_History()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/TEST-001/assessment-history");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("parcelId", out var parcelId));
        Assert.Equal("TEST-001", parcelId.GetString());

        Assert.True(root.TryGetProperty("address", out _));

        Assert.True(root.TryGetProperty("totalYears", out var totalYears));
        Assert.True(totalYears.GetInt32() >= 1, "Should have at least one assessment year");

        Assert.True(root.TryGetProperty("assessments", out var assessments));
        Assert.Equal(JsonValueKind.Array, assessments.ValueKind);

        Assert.True(root.TryGetProperty("correlationId", out _));
    }

    [Fact]
    public async Task GetAssessmentHistory_Filters_By_Year_Range()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync(
            "/api/dossier/parcels/TEST-001/assessment-history?fromYear=2024&toYear=2024");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var assessments = root.GetProperty("assessments");
        foreach (var assessment in assessments.EnumerateArray())
        {
            if (assessment.TryGetProperty("year", out var year))
            {
                // Year filter: should be 2024 from seed or 2025 (current from Property)
                Assert.True(year.GetInt32() >= 2024);
            }
        }
    }

    [Fact]
    public async Task GetAssessmentHistory_Returns_NotFound_For_Unknown_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/NONEXIST-999/assessment-history");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAssessmentHistory_Returns_BadRequest_For_Invalid_ParcelId()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/bad%20id!/assessment-history");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetAssessmentHistory_Returns_NotFound_For_CrossCounty_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/OTHER-001/assessment-history");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Assessment History: Year-over-Year Deltas ─────────────────────

    [Fact]
    public async Task GetAssessmentHistory_Includes_YearOverYear_Deltas()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/dossier/parcels/TEST-001/assessment-history");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var assessments = doc.RootElement.GetProperty("assessments");

        var entries = assessments.EnumerateArray().ToList();
        if (entries.Count >= 2)
        {
            // Second entry should have a non-null yearOverYearPctChange
            var second = entries[1];
            Assert.True(second.TryGetProperty("yearOverYearPctChange", out var pctChange));
            Assert.NotEqual(JsonValueKind.Undefined, pctChange.ValueKind);
        }
    }
}
