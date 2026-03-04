using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using ApiProgram = TerraFusion.API.Program;

namespace TerraFusion.Unit.Tests.R1Week5;

/// <summary>
/// CX-22: Parcel Dossier v0 — cross-county isolation + shape tests.
/// Uses Cx19CrossCountyFactory (shared Benton/King seed data).
/// </summary>
[Trait("Category", "R1Week5")]
[Trait("Category", "CX22")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx22ParcelDossierV0Tests
    : IClassFixture<Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly Cx19CrossCountyFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public R1Week5Cx22ParcelDossierV0Tests(Cx19CrossCountyFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    // ── Same-county: returns 200 with expected shape ──────────────────

    [Fact]
    public async Task ParcelSummary_SameCounty_Returns200WithExpectedShape()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx19CrossCountyFactory.BentonParcelId}/summary");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("parcelId").GetString().Should().Be(Cx19CrossCountyFactory.BentonParcelId);
        root.GetProperty("countyId").GetGuid().Should().Be(Cx19CrossCountyFactory.BentonCountyId);

        // Property section present
        var property = root.GetProperty("property");
        property.GetProperty("id").GetGuid().Should().Be(Cx19CrossCountyFactory.BentonPropertyGuid);
        property.GetProperty("address").GetString().Should().NotBeNullOrEmpty();
        property.GetProperty("assessedValue").GetDecimal().Should().Be(250000m);

        // Notes summary present
        var notes = root.GetProperty("notes");
        notes.GetProperty("noteCount").GetInt32().Should().BeGreaterOrEqualTo(1);

        // Levy history present (county-scoped)
        var levyHistory = root.GetProperty("levyHistory");
        levyHistory.GetArrayLength().Should().BeGreaterOrEqualTo(1);

        // CostBreakdown present (from mock)
        root.TryGetProperty("costBreakdown", out var cb).Should().BeTrue();
        if (cb.ValueKind != JsonValueKind.Null)
        {
            cb.GetProperty("totalValue").GetDecimal().Should().BeGreaterThan(0);
        }

        // Timestamp
        root.GetProperty("generatedAtUtc").GetDateTime().Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));
    }

    // ── Cross-county: Benton user cannot see King parcel ──────────────

    [Fact]
    public async Task ParcelSummary_CrossCounty_Returns404()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx19CrossCountyFactory.KingParcelId}/summary");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Non-existent parcel: 404 ──────────────────────────────────────

    [Fact]
    public async Task ParcelSummary_NonExistentParcel_Returns404()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync("/api/dossier/parcels/DOES-NOT-EXIST/summary");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── No county claim: 403 ──────────────────────────────────────────

    [Fact]
    public async Task ParcelSummary_NoClaim_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx22-no-county");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19CrossCountyFactory.PluginAllPermsId.ToString());

        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx19CrossCountyFactory.BentonParcelId}/summary");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    // ── Invalid parcel format: 400 ────────────────────────────────────

    [Fact]
    public async Task ParcelSummary_InvalidParcelFormat_Returns400()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync("/api/dossier/parcels/INVALID%3B%20DROP%20TABLE/summary");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── Levy history contains ONLY Benton levies (cross-county non-leak) ──

    [Fact]
    public async Task ParcelSummary_LevyHistory_DoesNotLeakCrossCounty()
    {
        using var client = CreateBentonClient();
        var response = await client.GetAsync(
            $"/api/dossier/parcels/{Cx19CrossCountyFactory.BentonParcelId}/summary");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var levyHistory = doc.RootElement.GetProperty("levyHistory");

        foreach (var levy in levyHistory.EnumerateArray())
        {
            var district = levy.GetProperty("taxingDistrict").GetString()!;
            district.Should().NotContain("KING",
                "Benton user must not see King county levy data");

            var purpose = levy.GetProperty("purpose").GetString()!;
            purpose.Should().NotContain("SHOULD NOT LEAK",
                "Benton user must not see King county levy purposes");
        }
    }

    // ── Helper: create Benton-county authenticated client ─────────────

    private HttpClient CreateBentonClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx22-benton-user");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Test-CountyId", Cx19CrossCountyFactory.BentonCountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Plugin-Id", Cx19CrossCountyFactory.PluginAllPermsId.ToString());
        return client;
    }
}
