using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for CostForge USPAP three-approach valuation endpoints.
/// Verifies sales, income, cost, reconciliation approaches, and cost-matrix lookup.
/// All tests use SeededApiWebAppFactory with authenticated JWT + "perm" claims.
/// </summary>
[Collection("Integration")]
public class CostForgeControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public CostForgeControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── POST /api/costforge/approach/sales ────────────────────────────

    [Fact]
    public async Task SalesApproach_Returns_Ok_With_Valid_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            subjectParcelId = "TEST-001",
            subjectCharacteristics = new
            {
                gla = 2000.0,
                lotSize = 8500.0,
                yearBuilt = 1995,
                bedrooms = 3,
                bathrooms = 2,
                condition = "Average",
                location = "Average",
            },
            comparables = new[]
            {
                new
                {
                    compId = "COMP-001",
                    salePrice = 340000L,
                    saleDate = "2024-06-15",
                    gla = 1900.0,
                    lotSize = 8000.0,
                    yearBuilt = 1998,
                    bedrooms = 3,
                    bathrooms = 2,
                    condition = "Average",
                    location = "Average",
                },
            },
            adjustmentRates = new
            {
                glaPerSqFt = 50.0,
                lotSizePerSqFt = 2.0,
                agePerYear = 500.0,
            },
        };

        var response = await client.PostAsJsonAsync("/api/costforge/approach/sales", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("approach", out var approach));
        Assert.Equal("sales_comparison", approach.GetString());

        Assert.True(root.TryGetProperty("countyId", out _));
        Assert.True(root.TryGetProperty("result", out _));
    }

    [Fact]
    public async Task SalesApproach_Returns_BadRequest_With_Empty_Body()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var content = new StringContent("null", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/costforge/approach/sales", content);

        // Empty/null body should return 400 or 500 (controller catches and returns error)
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 400 or 500 but got {(int)response.StatusCode}");
    }

    // ── POST /api/costforge/approach/income ───────────────────────────

    [Fact]
    public async Task IncomeApproach_Returns_Ok_With_Valid_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            subjectId = "TEST-001",
            effectiveDate = "2025-01-01",
            incomeData = new
            {
                potentialGrossIncome = 120000L,
                vacancyRate = 0.05,
                otherIncome = 5000L,
                operatingExpenses = new
                {
                    taxes = 8000L,
                    insurance = 3000L,
                    utilities = 4000L,
                    maintenance = 5000L,
                    management = 6000L,
                    reserves = 2000L,
                    other = 1000L,
                },
            },
            capitalizationRate = new
            {
                rate = 0.08,
                source = "market_survey",
            },
        };

        var response = await client.PostAsJsonAsync("/api/costforge/approach/income", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("approach", out var approach));
        Assert.Equal("income_direct_capitalization", approach.GetString());

        Assert.True(root.TryGetProperty("countyId", out _));
        Assert.True(root.TryGetProperty("result", out _));
    }

    [Fact]
    public async Task IncomeApproach_Returns_BadRequest_With_Null_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var content = new StringContent("null", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/costforge/approach/income", content);

        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 400 or 500 but got {(int)response.StatusCode}");
    }

    // ── POST /api/costforge/approach/cost ─────────────────────────────

    [Fact]
    public async Task CostApproach_Returns_Ok_With_Valid_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            parcelId = "TEST-001",
            buildingType = "residential",
            squareFootage = 2000.0,
            yearBuilt = 1995,
            qualityGrade = "average",
            region = "suburban",
            condition = "average",
            stories = 2,
            basement = false,
            garage = true,
        };

        var response = await client.PostAsJsonAsync("/api/costforge/approach/cost", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("approach", out var approach));
        Assert.Equal("cost_marshall_swift", approach.GetString());

        Assert.True(root.TryGetProperty("countyId", out _));
        Assert.True(root.TryGetProperty("result", out _));
    }

    [Fact]
    public async Task CostApproach_Returns_Error_With_Null_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var content = new StringContent("null", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/costforge/approach/cost", content);

        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 400 or 500 but got {(int)response.StatusCode}");
    }

    // ── POST /api/costforge/approach/reconcile ────────────────────────

    [Fact]
    public async Task Reconciliation_Returns_Ok_With_Three_Approaches()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            subjectId = "TEST-001",
            effectiveDate = "2025-01-01",
            sales = new { indicatedValue = 345000L, confidenceLevel = "high", weight = 0.5 },
            income = new { indicatedValue = 360000L, confidenceLevel = "medium", weight = 0.3 },
            cost = new { indicatedValue = 340000L, confidenceLevel = "medium", weight = 0.2 },
            propertyType = "Residential",
            reconciliationMethod = "weighted_average",
            forcedWeights = false,
        };

        var response = await client.PostAsJsonAsync("/api/costforge/approach/reconcile", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("approach", out var approach));
        Assert.Equal("uspap_reconciliation", approach.GetString());

        Assert.True(root.TryGetProperty("countyId", out _));
        Assert.True(root.TryGetProperty("result", out _));
    }

    [Fact]
    public async Task Reconciliation_Returns_Error_With_Null_Input()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var content = new StringContent("null", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/costforge/approach/reconcile", content);

        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 400 or 500 but got {(int)response.StatusCode}");
    }

    // ── GET /api/costforge/cost-matrix/{buildingType}/{region} ────────

    [Fact]
    public async Task CostMatrix_Returns_NotFound_For_Unknown_Type()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/costforge/cost-matrix/nonexistent/suburban");

        // No seed data for cost matrix, so expect 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CostMatrix_Returns_NotFound_For_Unknown_Region()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/costforge/cost-matrix/residential/nonexistent");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── Auth enforcement ──────────────────────────────────────────────

    [Fact]
    public async Task SalesApproach_Forbids_Without_CountyClaim()
    {
        // Create a client with auth but no county claims
        var client = _factory.CreateClient();
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            countyId: "",
            countyCode: null,
            permissions: AuthenticatedClientExtensions.AllPermissions);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            subjectParcelId = "TEST-001",
            subjectCharacteristics = new { gla = 2000.0, lotSize = 8500.0, yearBuilt = 1995 },
            comparables = Array.Empty<object>(),
            adjustmentRates = new { glaPerSqFt = 50.0, lotSizePerSqFt = 2.0, agePerYear = 500.0 },
        };

        var response = await client.PostAsJsonAsync("/api/costforge/approach/sales", payload);

        // Without valid county context, controller returns Forbid (403)
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
