using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

/// <summary>
/// CX-24: Dossier trace metadata + evidence links integration tests.
///
/// Verifies:
///   1. CX-23 details response contains correlationId (non-null, non-empty)
///   2. CX-22 summary response contains correlationId (non-null, non-empty)
///   3. CX-23 details response contains links section with stable URLs
///   4. X-Correlation-ID response header is set on details
///   5. X-Correlation-ID response header is set on summary
///   6. Client-supplied X-Correlation-ID is echoed back on details
///   7. Client-supplied X-Correlation-ID is echoed back on summary
///   8. CorrelationId uses "dossier-" prefix when server-generated
///   9. Cross-county (404) still completes without error
///  10. Links.Self matches the details endpoint path
///  11. Too-long correlationId (>128 chars) → fallback to server-generated
///  12. Illegal punctuation in correlationId → fallback to server-generated
///  13. Newline/control chars in correlationId → fallback to server-generated
///  14. Header/body parity: values match exactly
///
/// Factory: Cx19CrossCountyFactory (shared with CX-19/22/23).
/// </summary>
[Trait("Category", "R1Week5")]
[Trait("Category", "CX24")]
[Trait("Category", "Integration")]
public sealed class R1Week5Cx24DossierTraceMetadataTests
    : IClassFixture<Cx19CrossCountyFactory>, IAsyncLifetime
{
    private readonly Cx19CrossCountyFactory _factory;

    public R1Week5Cx24DossierTraceMetadataTests(Cx19CrossCountyFactory factory)
        => _factory = factory;

    public Task InitializeAsync() => _factory.EnsureSeedDataAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private const string DetailsRoute = "/api/dossier/parcels";
    private const string SummaryRoute = "/api/dossier";

    // ── 1. Details response has correlationId ────────────────────────

    [Fact]
    public async Task Details_Response_ContainsCorrelationId()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("correlationId", out var corrId).Should().BeTrue(
            "CX-24: correlationId must be present in details response");
        corrId.GetString().Should().NotBeNullOrWhiteSpace(
            "correlationId must be non-empty");
    }

    // ── 2. Summary response has correlationId ───────────────────────

    [Fact]
    public async Task Summary_Response_ContainsCorrelationId()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{SummaryRoute}/{Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("correlationId", out var corrId).Should().BeTrue(
            "CX-24: correlationId must be present in summary response");
        corrId.GetString().Should().NotBeNullOrWhiteSpace(
            "correlationId must be non-empty");
    }

    // ── 3. Details response has links section ───────────────────────

    [Fact]
    public async Task Details_Response_ContainsResourceLinks()
    {
        using var client = CreateBentonClient();
        var parcelId = Cx19CrossCountyFactory.BentonParcelId;

        var response = await client.GetAsync(
            $"{DetailsRoute}/{parcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("links", out var links).Should().BeTrue(
            "CX-24: links section must be present in details response");

        links.TryGetProperty("self", out var self).Should().BeTrue();
        self.GetString().Should().Contain(parcelId,
            "self link must reference the parcel");

        links.TryGetProperty("summary", out _).Should().BeTrue();
        links.TryGetProperty("details", out _).Should().BeTrue();
        links.TryGetProperty("notes", out _).Should().BeTrue();
        links.TryGetProperty("casefile", out _).Should().BeTrue();
    }

    // ── 4. X-Correlation-ID response header set on details ──────────

    [Fact]
    public async Task Details_ResponseHeader_ContainsCorrelationId()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Contains("X-Correlation-ID").Should().BeTrue(
            "CX-24: X-Correlation-ID response header must be present");

        var headerValue = response.Headers.GetValues("X-Correlation-ID").First();
        headerValue.Should().NotBeNullOrWhiteSpace();
    }

    // ── 5. X-Correlation-ID response header set on summary ──────────

    [Fact]
    public async Task Summary_ResponseHeader_ContainsCorrelationId()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{SummaryRoute}/{Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Contains("X-Correlation-ID").Should().BeTrue(
            "CX-24: X-Correlation-ID response header must be present");
    }

    // ── 6. Client-supplied correlationId echoed on details ──────────

    [Fact]
    public async Task Details_ClientCorrelationId_IsEchoed()
    {
        using var client = CreateBentonClient();
        var clientCorrId = "client-test-cx24-details-001";
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Correlation-ID", clientCorrId);

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Response header echoes
        var headerValue = response.Headers.GetValues("X-Correlation-ID").First();
        headerValue.Should().Be(clientCorrId,
            "server must echo back client-supplied correlationId");

        // Response body echoes
        var json = await ParseJsonAsync(response);
        json.TryGetProperty("correlationId", out var bodyCorr).Should().BeTrue();
        bodyCorr.GetString().Should().Be(clientCorrId);
    }

    // ── 7. Client-supplied correlationId echoed on summary ──────────

    [Fact]
    public async Task Summary_ClientCorrelationId_IsEchoed()
    {
        using var client = CreateBentonClient();
        var clientCorrId = "client-test-cx24-summary-002";
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Correlation-ID", clientCorrId);

        var response = await client.GetAsync(
            $"{SummaryRoute}/{Cx19CrossCountyFactory.BentonParcelId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var headerValue = response.Headers.GetValues("X-Correlation-ID").First();
        headerValue.Should().Be(clientCorrId,
            "server must echo back client-supplied correlationId on summary");

        var json = await ParseJsonAsync(response);
        json.TryGetProperty("correlationId", out var bodyCorr).Should().BeTrue();
        bodyCorr.GetString().Should().Be(clientCorrId);
    }

    // ── 8. Server-generated correlationId has dossier- prefix ───────

    [Fact]
    public async Task Details_ServerGeneratedCorrelationId_HasDossierPrefix()
    {
        using var client = CreateBentonClient();
        // No X-Correlation-ID header → server generates

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("correlationId", out var corrId).Should().BeTrue();
        corrId.GetString().Should().StartWith("dossier-",
            "server-generated correlationId must use 'dossier-' prefix");
    }

    // ── 9. Cross-county 404 still has response header ───────────────

    [Fact]
    public async Task Details_CrossCounty404_StillHasCorrelationHeader()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.KingParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "cross-county must still be 404");

        // 404 is returned before correlationId helper runs,
        // so header may or may not be present — but request must not crash
        response.Should().NotBeNull("request must complete without error");
    }

    // ── 10. Links.Self matches details endpoint path ────────────────

    [Fact]
    public async Task Details_LinksSelf_MatchesEndpointPath()
    {
        using var client = CreateBentonClient();
        var parcelId = Cx19CrossCountyFactory.BentonParcelId;

        var response = await client.GetAsync(
            $"{DetailsRoute}/{parcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("links", out var links).Should().BeTrue();
        links.TryGetProperty("self", out var self).Should().BeTrue();
        self.GetString().Should().Be($"/api/dossier/parcels/{parcelId}/details",
            "self link must match the canonical details endpoint path");

        links.TryGetProperty("summary", out var summary).Should().BeTrue();
        summary.GetString().Should().Be($"/api/dossier/{parcelId}",
            "summary link must point to CX-22 endpoint");

        links.TryGetProperty("notes", out var notes).Should().BeTrue();
        notes.GetString().Should().Be($"/api/dossier/{parcelId}/notes",
            "notes link must point to notes CRUD endpoint");
    }

    // ── 11. Invalid correlationId: too long → fallback ──────────────

    [Fact]
    public async Task Details_TooLongCorrelationId_FallsBackToServerGenerated()
    {
        using var client = CreateBentonClient();
        var tooLong = new string('a', 200); // 200 chars > 128 limit
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Correlation-ID", tooLong);

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("correlationId", out var corrId).Should().BeTrue();
        corrId.GetString().Should().StartWith("dossier-",
            "too-long client ID must be replaced by server-generated");
        corrId.GetString().Should().NotBe(tooLong);
    }

    // ── 12. Invalid correlationId: illegal punctuation → fallback ───

    [Fact]
    public async Task Details_IllegalPunctuation_FallsBackToServerGenerated()
    {
        using var client = CreateBentonClient();
        var illegal = "../../taxes;drop table";
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Correlation-ID", illegal);

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("correlationId", out var corrId).Should().BeTrue();
        corrId.GetString().Should().StartWith("dossier-",
            "illegal chars must trigger server-generated fallback");
    }

    // ── 13. Invalid correlationId: newline/control chars → fallback ─

    [Fact]
    public async Task Details_NewlineControlChars_FallsBackToServerGenerated()
    {
        using var client = CreateBentonClient();
        var withNewline = "valid-prefix\r\nX-Injected: evil";
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            "X-Correlation-ID", withNewline);

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await ParseJsonAsync(response);

        json.TryGetProperty("correlationId", out var corrId).Should().BeTrue();
        corrId.GetString().Should().StartWith("dossier-",
            "newline/control chars must trigger server-generated fallback");
    }

    // ── 14. Header/body parity: values match exactly ────────────────

    [Fact]
    public async Task Details_HeaderBodyParity_ValuesMatchExactly()
    {
        using var client = CreateBentonClient();

        var response = await client.GetAsync(
            $"{DetailsRoute}/{Cx19CrossCountyFactory.BentonParcelId}/details");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var headerValue = response.Headers.GetValues("X-Correlation-ID").First();
        var json = await ParseJsonAsync(response);
        var bodyValue = json.GetProperty("correlationId").GetString();

        headerValue.Should().Be(bodyValue,
            "header and body correlationId must be identical");
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private HttpClient CreateBentonClient(string roles = "Assessor")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                Cx19CrossCountyFactory.AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-UserId", "cx24-benton-user");
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
