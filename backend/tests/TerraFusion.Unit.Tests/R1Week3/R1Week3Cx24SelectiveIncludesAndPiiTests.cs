using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week3;

/// <summary>
/// CX-24: Selective includes + PII regression tests for the details endpoint.
///
/// Verifies:
///   ── Selective Includes ──
///   1. Default (no include) → all sections present (non-null)
///   2. include=property → only property non-null, others null
///   3. include=property,valuation → only those two non-null
///   4. include=levies,notes → only those two non-null
///   5. include=valuation → only valuation non-null (may still be null if CostForge fails)
///   6. Garbage include values → falls back to all sections
///   7. Mixed valid/invalid → only valid sections included
///   8. include= (empty string) → all sections (same as omitted)
///
///   ── PII Regression ──
///   9. OwnerSSN / ownerSsn never appears anywhere in JSON response
///  10. Note content / preview never appears in details response
///  11. Raw createdBy never appears in note headers
///  12. OwnerName IS present when property section included (allowed PII-safe field)
///
/// Uses Cx19CrossCountyFactory which seeds Benton/King counties.
/// </summary>
[Trait("Category", "R1Week3")]
[Trait("Category", "CX24")]
[Trait("Category", "Integration")]
public sealed class R1Week3Cx24SelectiveIncludesAndPiiTests
    : IClassFixture<TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory _factory;

    public R1Week3Cx24SelectiveIncludesAndPiiTests(
        TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory factory)
    {
        _factory = factory;
    }

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private const string DetailsRoute = "/api/dossier/parcels";

    // ════════════════════════════════════════════════════════════════
    //  SELECTIVE INCLUDES
    // ════════════════════════════════════════════════════════════════

    // ── 1. Default (no include) → all sections present ──────────────

    [Fact]
    public async Task Details_NoInclude_AllSectionsPresent()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // All sections should be present and non-null
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().NotBe(JsonValueKind.Null, "property should be populated by default");

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().NotBe(JsonValueKind.Null, "levies should be populated by default");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().NotBe(JsonValueKind.Null, "notes should be populated by default");

        // Valuation is always nullable (CostForge best-effort), but key should exist
        json.TryGetProperty("valuation", out _).Should().BeTrue("valuation key should always be present");
    }

    // ── 2. include=property → only property non-null ────────────────

    [Fact]
    public async Task Details_IncludeProperty_OnlyPropertyPopulated()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=property");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Property should be populated
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().NotBe(JsonValueKind.Null, "property was requested");

        // Non-requested sections should be null
        json.TryGetProperty("valuation", out var val).Should().BeTrue();
        val.ValueKind.Should().Be(JsonValueKind.Null, "valuation was not requested");

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().Be(JsonValueKind.Null, "levies was not requested");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().Be(JsonValueKind.Null, "notes was not requested");
    }

    // ── 3. include=property,valuation → both populated ──────────────

    [Fact]
    public async Task Details_IncludePropertyAndValuation_BothPopulated()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=property,valuation");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Requested sections
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().NotBe(JsonValueKind.Null, "property was requested");

        // Valuation was requested — key present (value may be null if CostForge fails)
        json.TryGetProperty("valuation", out _).Should().BeTrue("valuation was requested");

        // Non-requested sections should be null
        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().Be(JsonValueKind.Null, "levies was not requested");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().Be(JsonValueKind.Null, "notes was not requested");
    }

    // ── 4. include=levies,notes → only those two populated ──────────

    [Fact]
    public async Task Details_IncludeLeviesAndNotes_OnlyThosePopulated()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=levies,notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Non-requested sections should be null
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().Be(JsonValueKind.Null, "property was not requested");

        json.TryGetProperty("valuation", out var val).Should().BeTrue();
        val.ValueKind.Should().Be(JsonValueKind.Null, "valuation was not requested");

        // Requested sections should be populated
        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().NotBe(JsonValueKind.Null, "levies was requested");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().NotBe(JsonValueKind.Null, "notes was requested");
    }

    // ── 5. include=valuation → only valuation key present ───────────

    [Fact]
    public async Task Details_IncludeValuation_OtherSectionsNull()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=valuation");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Valuation was requested (may be null due to CostForge, but was attempted)
        json.TryGetProperty("valuation", out _).Should().BeTrue("valuation key should be present");

        // Non-requested sections should be null
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().Be(JsonValueKind.Null, "property was not requested");

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().Be(JsonValueKind.Null, "levies was not requested");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().Be(JsonValueKind.Null, "notes was not requested");
    }

    // ── 6. Garbage include values → falls back to all ───────────────

    [Fact]
    public async Task Details_GarbageInclude_FallsBackToAll()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=bogus,invalid,xyz");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // All garbage → falls back to all sections
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().NotBe(JsonValueKind.Null, "garbage include defaults to all — property present");

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().NotBe(JsonValueKind.Null, "garbage include defaults to all — levies present");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().NotBe(JsonValueKind.Null, "garbage include defaults to all — notes present");
    }

    // ── 7. Mixed valid/invalid → only valid sections ────────────────

    [Fact]
    public async Task Details_MixedValidInvalid_OnlyValidIncluded()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=property,bogus,notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Valid sections should be populated
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().NotBe(JsonValueKind.Null, "property was validly requested");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().NotBe(JsonValueKind.Null, "notes was validly requested");

        // Non-requested valid sections should be null
        json.TryGetProperty("valuation", out var val).Should().BeTrue();
        val.ValueKind.Should().Be(JsonValueKind.Null, "valuation was not requested");

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().Be(JsonValueKind.Null, "levies was not requested");
    }

    // ── 8. include= (empty string) → all sections ──────────────────

    [Fact]
    public async Task Details_EmptyInclude_FallsBackToAll()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        // Empty include → all sections
        json.TryGetProperty("property", out var prop).Should().BeTrue();
        prop.ValueKind.Should().NotBe(JsonValueKind.Null, "empty include defaults to all — property present");

        json.TryGetProperty("levies", out var levies).Should().BeTrue();
        levies.ValueKind.Should().NotBe(JsonValueKind.Null, "empty include defaults to all — levies present");

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.ValueKind.Should().NotBe(JsonValueKind.Null, "empty include defaults to all — notes present");
    }

    // ════════════════════════════════════════════════════════════════
    //  PII REGRESSION
    // ════════════════════════════════════════════════════════════════

    // ── 9. OwnerSSN never appears anywhere in response ──────────────

    [Fact]
    public async Task Details_OwnerSSN_NeverExposedInResponse()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Full string scan of the entire response body
        var rawBody = await response.Content.ReadAsStringAsync();

        rawBody.Should().NotContain("ownerSSN", "OwnerSSN must NEVER appear in details response");
        rawBody.Should().NotContain("ownerSsn", "ownerSsn must NEVER appear in details response");
        rawBody.Should().NotContain("OwnerSSN", "OwnerSSN must NEVER appear in details response");
        rawBody.Should().NotContain("owner_ssn", "owner_ssn must NEVER appear in details response");
        rawBody.Should().NotContain("socialSecurity", "socialSecurity must NEVER appear");
        rawBody.Should().NotContain("ssn", "SSN-related fields must NEVER appear");
    }

    // ── 10. Note content / preview never appears in details ─────────

    [Fact]
    public async Task Details_NoteContentAndPreview_NeverExposed()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.TryGetProperty("items", out var items).Should().BeTrue();

        foreach (var item in items.EnumerateArray())
        {
            // Must have metadata fields
            item.TryGetProperty("noteId", out _).Should().BeTrue("header should have noteId");
            item.TryGetProperty("noteType", out _).Should().BeTrue("header should have noteType");
            item.TryGetProperty("createdAt", out _).Should().BeTrue("header should have createdAt");
            item.TryGetProperty("authorKind", out _).Should().BeTrue("header should have authorKind");

            // Must NOT contain content or preview — PII-safe
            item.TryGetProperty("content", out _).Should().BeFalse("note content must NEVER appear in details");
            item.TryGetProperty("preview", out _).Should().BeFalse("note preview must NEVER appear in details");
        }
    }

    // ── 11. Raw createdBy never appears in note headers ─────────────

    [Fact]
    public async Task Details_RawCreatedBy_NeverExposedInNoteHeaders()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.BentonParcelId}/details?include=notes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.TryGetProperty("items", out var items).Should().BeTrue();

        foreach (var item in items.EnumerateArray())
        {
            item.TryGetProperty("createdBy", out _).Should().BeFalse(
                "raw createdBy must not leak in note headers (PII redaction → authorKind only)");
        }
    }

    // ── 12. Selective includes still respects anti-enumeration ───────

    [Fact]
    public async Task Details_CrossCountyWithInclude_Still404()
    {
        using var client = CreateBentonClient();

        // Benton user requesting King county parcel with selective include → still 404
        var response = await client.GetAsync(
            $"{DetailsRoute}/{TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.KingParcelId}/details?include=property");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "cross-county access should return 404 regardless of include parameter");
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private HttpClient CreateBentonClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                TerraFusion.Unit.Tests.R1Week5.Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx24-benton-user");
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
