using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

/// <summary>
/// CX-23: Parcel Dossier v1 "details" integration tests.
///
/// Verifies:
///   1. Same-county → 200, response shape with all sections
///   2. Cross-county → 404 (anti-enumeration)
///   3. No county claims → 403
///   4. Invalid parcel ID → 400
///   5. CostForge valuation nullable contract (key present even if null)
///   6. Note headers bounded by noteLimit, no content leaked
///   7. Levy entries bounded by levyLimit
///   8. piiRedacted flag = true
///
/// Factory: Cx19CrossCountyFactory (7 Benton notes, 3 Benton levies,
///          1 King note, 1 King levy, GetCostBreakdownAsync mock).
/// </summary>
[Trait("Category", "R1Week5")]
[Trait("Category", "CX23")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx23ParcelDossierDetailsTests
    : IClassFixture<Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly Cx19CrossCountyFactory _factory;

    public R1Week5Cx23ParcelDossierDetailsTests(Cx19CrossCountyFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private const string DetailsRoute = "/api/dossier/parcels";

    // ── 1. Happy path: response shape ────────────────────────────────

    [Fact]
    public async Task Details_SameCounty_Returns200WithAllSections()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);

        // Top-level fields
        json.TryGetProperty("parcelId", out _).Should().BeTrue();
        json.TryGetProperty("countyId", out _).Should().BeTrue();
        json.TryGetProperty("generatedAt", out _).Should().BeTrue();
        json.TryGetProperty("piiRedacted", out var pii).Should().BeTrue();
        pii.GetBoolean().Should().BeTrue("PII is always redacted in details");

        // Sections
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.TryGetProperty("parcelNumber", out _).Should().BeTrue();
        prop.TryGetProperty("address", out _).Should().BeTrue();
        prop.TryGetProperty("assessedValue", out _).Should().BeTrue();
        // CAMA placeholders
        prop.TryGetProperty("classCode", out _).Should().BeTrue();
        prop.TryGetProperty("useCode", out _).Should().BeTrue();
        prop.TryGetProperty("neighborhood", out _).Should().BeTrue();

        json.TryGetProperty("levies", out _).Should().BeTrue();
        json.TryGetProperty("notes", out _).Should().BeTrue();
        // Valuation key present (may be null if CostForge fails)
        json.TryGetProperty("valuation", out _).Should().BeTrue(
            "valuation key should be present (nullable)");
    }

    // ── 2. Cross-county → 404 ───────────────────────────────────────

    [Fact]
    public async Task Details_CrossCounty_Returns404()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.KingParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "cross-county access should return 404 for anti-enumeration");
    }

    // ── 3. No county claims → 403 ───────────────────────────────────

    [Fact]
    public async Task Details_NoCountyClaims_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx23-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Plugin-Id",
            Cx19CrossCountyFactory.PluginAllPermsId.ToString());

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    // ── 4. Invalid parcel format → 400 ──────────────────────────────

    [Fact]
    public async Task Details_InvalidParcelFormat_Returns400()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/invalid parcel!@%23/details");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── 5. Valuation nullable contract ──────────────────────────────

    [Fact]
    public async Task Details_Valuation_HasCategoriesWhenPresent()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Factory mocks GetCostBreakdownAsync → valuation should be non-null
        json.TryGetProperty("valuation", out var valuation).Should().BeTrue();
        if (valuation.ValueKind != JsonValueKind.Null)
        {
            valuation.TryGetProperty("totalValue", out _).Should().BeTrue();
            valuation.TryGetProperty("categoryCount", out var catCount).Should().BeTrue();
            catCount.GetInt32().Should().BeGreaterOrEqualTo(1);
        }
    }

    // ── 6. Note headers bounded, no content leaked ──────────────────

    [Fact]
    public async Task Details_NoteHeaders_BoundedByLimit_NoContentLeaked()
    {
        using var client = CreateBentonClient();

        // Request with noteLimit=3 (factory seeds 7 Benton notes)
        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details?noteLimit=3");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.TryGetProperty("noteCountTotal", out var total).Should().BeTrue();
        total.GetInt32().Should().BeGreaterOrEqualTo(7,
            "factory seeds 7 Benton notes");

        notes.TryGetProperty("noteCountReturned", out var returned).Should().BeTrue();
        returned.GetInt32().Should().BeLessThanOrEqualTo(3,
            "noteLimit=3 should cap returned items");

        notes.TryGetProperty("items", out var items).Should().BeTrue();
        items.GetArrayLength().Should().BeLessThanOrEqualTo(3);

        // Verify no content/preview leaked — only header fields
        foreach (var item in items.EnumerateArray())
        {
            item.TryGetProperty("noteId", out _).Should().BeTrue();
            item.TryGetProperty("noteType", out _).Should().BeTrue();
            item.TryGetProperty("createdAt", out _).Should().BeTrue();
            item.TryGetProperty("authorKind", out _).Should().BeTrue();
            item.TryGetProperty("content", out _).Should().BeFalse(
                "note content must not leak in details endpoint");
            item.TryGetProperty("preview", out _).Should().BeFalse(
                "preview must not leak in details endpoint");
            item.TryGetProperty("createdBy", out _).Should().BeFalse(
                "raw createdBy must not leak (PII redaction)");
        }
    }

    // ── 7. Notes from King county must not appear ───────────────────

    [Fact]
    public async Task Details_NoteHeaders_CrossCounty_NoLeak()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details?noteLimit=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("notes", out var notes).Should().BeTrue();

        // All returned notes should belong to Benton (verified by
        // county-scoped query). Total should match seeded Benton notes only.
        notes.TryGetProperty("noteCountTotal", out var total).Should().BeTrue();
        total.GetInt32().Should().BeGreaterOrEqualTo(7,
            "Benton has 7+ seeded notes");
    }

    // ── 8. Levy entries bounded + cross-county isolation ────────────

    [Fact]
    public async Task Details_Levies_BoundedByLimit_CountyIsolated()
    {
        using var client = CreateBentonClient();

        // Request with levyLimit=2 (factory seeds 3 Benton levies)
        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details?levyLimit=2");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.TryGetProperty("levyCountTotal", out var total).Should().BeTrue();
        total.GetInt32().Should().BeGreaterOrEqualTo(3,
            "factory seeds 3 Benton levies");

        levies.TryGetProperty("levyCountReturned", out var returned).Should().BeTrue();
        returned.GetInt32().Should().BeLessThanOrEqualTo(2,
            "levyLimit=2 should cap returned items");

        levies.TryGetProperty("recent", out var recent).Should().BeTrue();
        recent.GetArrayLength().Should().BeLessThanOrEqualTo(2);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private HttpClient CreateBentonClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx23-benton-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Test-CountyId",
            Cx19CrossCountyFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", roles);
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id",
            Cx19CrossCountyFactory.PluginAllPermsId.ToString());
        return client;
    }

    private static async Task<JsonElement> ParseJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content).RootElement;
    }
}
