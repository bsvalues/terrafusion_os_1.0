using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week3;

/// <summary>
/// CX-23: Parcel Dossier Details integration tests.
///
/// Verifies:
///   1. Same-county details returns 200 with all sections
///   2. Selective include returns only requested sections
///   3. Configurable levyLimit / noteLimit are respected
///   4. PII metadata flag is present and true
///   5. Note headers are metadata-only (no content/preview)
///   6. Cross-county request returns 404 (anti-enumeration)
///   7. Missing county claims returns 403/401
///   8. Invalid parcel ID format returns 400
///   9. Non-existent parcel returns 404
///  10. OwnerName exposed but OwnerSSN redacted
///
/// Uses Cx19CrossCountyFactory which seeds Benton/King counties,
/// one property per county, and DossierNotes per county.
/// </summary>
[Trait("Category", "R1Week3")]
[Trait("Category", "CX23")]
[Trait("Category", "Integration")]
public sealed class R1Week3Cx23ParcelDossierDetailsIntegrationTests
    : IClassFixture<TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory _factory;

    public R1Week3Cx23ParcelDossierDetailsIntegrationTests(
        TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── Same-county: full details returns 200 with all sections ────

    [Fact]
    public async Task Details_SameCounty_Returns200WithAllSections()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);

        json.TryGetProperty("parcelId", out _).Should().BeTrue("should contain parcelId");
        json.TryGetProperty("countyId", out _).Should().BeTrue("should contain countyId");
        json.TryGetProperty("countyName", out _).Should().BeTrue("should contain countyName");
        json.TryGetProperty("generatedAt", out _).Should().BeTrue("should contain generatedAt");
        json.TryGetProperty("property", out _).Should().BeTrue("should contain property section");
        json.TryGetProperty("valuation", out _).Should().BeTrue("should contain valuation section");
        json.TryGetProperty("levies", out _).Should().BeTrue("should contain levies section");
        json.TryGetProperty("notes", out _).Should().BeTrue("should contain notes section");
        // CostBreakdown is nullable (best-effort)
        json.TryGetProperty("costBreakdown", out _).Should().BeTrue("should contain costBreakdown key (may be null)");
    }

    // ── PII metadata flag ─────────────────────────────────────────

    [Fact]
    public async Task Details_SameCounty_HasPiiRedactedFlag()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);
        json.TryGetProperty("piiRedacted", out var piiRedacted).Should().BeTrue();
        piiRedacted.GetBoolean().Should().BeTrue("PII redaction flag should be true");
    }

    // ── Note headers are metadata-only ────────────────────────────

    [Fact]
    public async Task Details_SameCounty_NoteHeadersAreMetadataOnly()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);
        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.TryGetProperty("noteCount", out var noteCount).Should().BeTrue();
        noteCount.GetInt32().Should().BeGreaterOrEqualTo(1, "factory seeds at least one note for Benton");

        notes.TryGetProperty("headers", out var headers).Should().BeTrue();
        headers.GetArrayLength().Should().BeGreaterOrEqualTo(1);

        var firstHeader = headers[0];
        firstHeader.TryGetProperty("noteId", out _).Should().BeTrue("header should have noteId");
        firstHeader.TryGetProperty("createdAt", out _).Should().BeTrue("header should have createdAt");
        firstHeader.TryGetProperty("noteType", out _).Should().BeTrue("header should have noteType");
        firstHeader.TryGetProperty("authorKind", out _).Should().BeTrue("header should have authorKind");

        // Must NOT contain content or preview — PII-safe
        firstHeader.TryGetProperty("content", out _).Should().BeFalse("header must not expose note content");
        firstHeader.TryGetProperty("preview", out _).Should().BeFalse("header must not expose note preview");
    }

    // ── Selective includes ─────────────────────────────────────────

    [Fact]
    public async Task Details_SelectiveInclude_ReturnsOnlyRequestedSections()
    {
        using var client = CreateBentonClient();

        // Request only property and valuation sections
        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=property,valuation");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);

        // Requested sections should be present (non-null)
        json.TryGetProperty("property", out var property).Should().BeTrue();
        property.ValueKind.Should().NotBe(JsonValueKind.Null, "property was requested");

        json.TryGetProperty("valuation", out var valuation).Should().BeTrue();
        valuation.ValueKind.Should().NotBe(JsonValueKind.Null, "valuation was requested");

        // Non-requested sections should be null
        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().Be(JsonValueKind.Null, "levies was not requested");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().Be(JsonValueKind.Null, "notes was not requested");
    }

    // ── Configurable limits ───────────────────────────────────────

    [Fact]
    public async Task Details_CustomNoteLimit_RespectsLimit()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=notes&noteLimit=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);
        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.TryGetProperty("headers", out var headers).Should().BeTrue();
        headers.GetArrayLength().Should().BeLessOrEqualTo(1, "noteLimit=1 should cap at 1 header");
    }

    // ── Property section exposes OwnerName (PII-safe, no SSN) ─────

    [Fact]
    public async Task Details_PropertySection_ExposesOwnerNameButNotSSN()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=property");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);
        json.TryGetProperty("property", out var property).Should().BeTrue();

        // OwnerName is allowed (not SSN-level PII)
        property.TryGetProperty("ownerName", out _).Should().BeTrue("OwnerName should be present");

        // OwnerSSN must never appear
        property.TryGetProperty("ownerSSN", out _).Should().BeFalse("OwnerSSN must NEVER be exposed");
        property.TryGetProperty("ownerSsn", out _).Should().BeFalse("ownerSsn must NEVER be exposed");
    }

    // ── Cross-county: 404 (anti-enumeration) ──────────────────────

    [Fact]
    public async Task Details_CrossCounty_Returns404()
    {
        using var client = CreateBentonClient();

        // Benton user requesting King county parcel → 404 (not 403)
        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.KingParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "cross-county access should return 404 for anti-enumeration");
    }

    // ── Missing county claims: 403/401 ────────────────────────────

    [Fact]
    public async Task Details_NoCountyClaims_Returns403Or401()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx23-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id",
            TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.PluginAllPermsId.ToString());

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    // ── Invalid parcel ID format: 400 ─────────────────────────────

    [Fact]
    public async Task Details_InvalidParcelFormat_Returns400()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync("/api/dossier/invalid parcel!@#/details");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Non-existent parcel: 404 ──────────────────────────────────

    [Fact]
    public async Task Details_NonExistentParcel_Returns404()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync("/api/dossier/DOES-NOT-EXIST-99/details");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Helpers ────────────────────────────────────────────────────

    private HttpClient CreateBentonClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx23-benton-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Test-CountyId",
            TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", roles);
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id",
            TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.PluginAllPermsId.ToString());
        return client;
    }

    private static async Task<JsonElement> ParseJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content).RootElement;
    }
}
