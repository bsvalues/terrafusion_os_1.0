using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using ApiProgram = TerraFusion.API.Program;

namespace TerraFusion.Unit.Tests.R1Week3;

/// <summary>
/// CX-22: Parcel Dossier v0 integration tests.
///
/// Verifies:
///   1. Same-county parcel dossier returns composed response (property + CostForge + levies + notes)
///   2. Cross-county request returns 404 (anti-enumeration)
///   3. Missing county claims returns 403/401
///   4. Invalid parcel ID format returns 400
///   5. Non-existent parcel returns 404
///   6. Response shape contains all expected sections
///
/// Uses Cx19CrossCountyFactory which seeds Benton/King counties,
/// one property per county, and one DossierNote per county.
/// </summary>
[Trait("Category", "R1Week3")]
[Trait("Category", "CX22")]
[Trait("Category", "Integration")]
public sealed class R1Week3Cx22ParcelDossierIntegrationTests
    : IClassFixture<TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory _factory;

    public R1Week3Cx22ParcelDossierIntegrationTests(
        TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── Same-county: composed dossier returns 200 ────────────────────

    [Fact]
    public async Task ParcelDossier_SameCounty_Returns200WithPropertySection()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);

        // Property section present with expected fields
        json.TryGetProperty("property", out var property).Should().BeTrue("response should contain property section");
        property.TryGetProperty("parcelNumber", out _).Should().BeTrue();
        property.TryGetProperty("address", out _).Should().BeTrue();
        property.TryGetProperty("assessedValue", out _).Should().BeTrue();
    }

    [Fact]
    public async Task ParcelDossier_SameCounty_ContainsAllSections()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);

        // All four composition sections should be present
        json.TryGetProperty("parcelId", out _).Should().BeTrue("should contain parcelId");
        json.TryGetProperty("countyId", out _).Should().BeTrue("should contain countyId");
        json.TryGetProperty("countyName", out _).Should().BeTrue("should contain countyName");
        json.TryGetProperty("property", out _).Should().BeTrue("should contain property section");
        json.TryGetProperty("levies", out _).Should().BeTrue("should contain levies section");
        json.TryGetProperty("notes", out _).Should().BeTrue("should contain notes section");
        // CostForge is nullable (best-effort), verify presence
        json.TryGetProperty("costForge", out _).Should().BeTrue("should contain costForge key (may be null)");
    }

    [Fact]
    public async Task ParcelDossier_SameCounty_NotesIncludeSeededNote()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await ParseJsonAsync(response);
        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.TryGetProperty("totalCount", out var totalCount).Should().BeTrue();
        totalCount.GetInt32().Should().BeGreaterOrEqualTo(1, "factory seeds at least one note for Benton");
    }

    // ── Cross-county: 404 (anti-enumeration) ─────────────────────────

    [Fact]
    public async Task ParcelDossier_CrossCounty_Returns404()
    {
        using var client = CreateBentonClient();

        // Benton user requesting King county parcel → 404 (not 403)
        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.KingParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "cross-county access should return 404 for anti-enumeration");
    }

    // ── Missing county claims: 403/401 ───────────────────────────────

    [Fact]
    public async Task ParcelDossier_NoCountyClaims_Returns403Or401()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx22-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id",
            TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.PluginAllPermsId.ToString());

        var response = await client.GetAsync(
            $"/api/dossier/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    // ── Invalid parcel ID format: 400 ────────────────────────────────

    [Fact]
    public async Task ParcelDossier_InvalidParcelFormat_Returns400()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync("/api/dossier/invalid parcel!@#");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Non-existent parcel (same county): 404 ───────────────────────

    [Fact]
    public async Task ParcelDossier_NonExistentParcel_Returns404()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync("/api/dossier/DOES-NOT-EXIST-99");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private HttpClient CreateBentonClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx22-benton-user");
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
