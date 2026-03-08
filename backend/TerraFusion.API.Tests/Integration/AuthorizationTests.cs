using System.Net;
using System.Net.Http.Json;
using System.Text;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Authorization integration tests verifying:
/// 1. All controller endpoints return 401 without any authentication.
/// 2. Endpoints return 403 when required "perm" claims are missing.
/// 3. County isolation prevents cross-county data access.
/// </summary>
[Collection("Integration")]
public class AuthorizationTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;

    public AuthorizationTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ══════════════════════════════════════════════════════════════════
    // 401 Unauthorized — No authentication token at all
    // ══════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("GET", "/api/costforge/status")]
    [InlineData("POST", "/api/costforge/approach/sales")]
    [InlineData("POST", "/api/costforge/approach/income")]
    [InlineData("POST", "/api/costforge/approach/cost")]
    [InlineData("POST", "/api/costforge/approach/reconcile")]
    [InlineData("GET", "/api/costforge/cost-matrix/residential/suburban")]
    [InlineData("GET", "/api/atlas/parcels/TEST-001")]
    [InlineData("GET", "/api/atlas/parcels/TEST-001/centroid")]
    [InlineData("PUT", "/api/atlas/parcels/TEST-001/geometry")]
    [InlineData("GET", "/api/atlas/geometry/stats")]
    [InlineData("GET", "/api/atlas/parcels/TEST-001/nearby")]
    [InlineData("POST", "/api/dossier/documents/search")]
    [InlineData("GET", "/api/dossier/parcels/TEST-001/casefile")]
    [InlineData("POST", "/api/dossier/TEST-001/notes")]
    [InlineData("GET", "/api/dossier/parcels/TEST-001/assessment-history")]
    [InlineData("GET", "/api/dais/certification/status")]
    [InlineData("GET", "/api/dais/exemptions/BENTON/impact")]
    [InlineData("POST", "/api/dais/notices/draft")]
    [InlineData("POST", "/api/dais/tasks/assign")]
    [InlineData("POST", "/api/dais/packets/assemble")]
    public async Task Unauthenticated_Request_Returns_401(string method, string url)
    {
        using var client = _factory.CreateClient(); // No auth header

        HttpResponseMessage response;
        if (method == "GET")
        {
            response = await client.GetAsync(url);
        }
        else if (method == "PUT")
        {
            var body = new StringContent("{}", Encoding.UTF8, "application/json");
            response = await client.PutAsync(url, body);
        }
        else // POST
        {
            var body = new StringContent("{}", Encoding.UTF8, "application/json");
            response = await client.PostAsync(url, body);
        }

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // 403 Forbidden — Authenticated but missing required permissions
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CostForge_Rejects_User_Without_CostForge_Permission()
    {
        // Generate token WITHOUT any costforge permissions
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            permissions: ["read:parcel", "read:dossier"]);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/costforge/status");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Atlas_Rejects_User_Without_Parcel_Permission()
    {
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            permissions: ["read:dossier", "write:dossier"]);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/atlas/parcels/TEST-001");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Atlas_Rejects_Write_Without_Write_Permission()
    {
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            permissions: ["read:parcel"]); // Has read but NOT write:parcel
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var payload = new { centroidLat = 46.0, centroidLng = -119.0 };
        var response = await client.PutAsJsonAsync(
            "/api/atlas/parcels/TEST-001/geometry", payload);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Dossier_Rejects_User_Without_Dossier_Permission()
    {
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            permissions: ["read:parcel"]);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/dossier/parcels/TEST-001/casefile");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Dais_Rejects_User_Without_Dais_Permission()
    {
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            permissions: ["read:parcel", "read:dossier"]);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/dais/certification/status");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // County Isolation — User from county A cannot see county B data
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Atlas_CountyIsolation_Hides_Other_County_Parcels()
    {
        // Benton county user tries to read Franklin county parcel
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.TestCountyId.ToString(),
            countyCode: "BENTON");

        var response = await client.GetAsync("/api/atlas/parcels/OTHER-001");

        // OTHER-001 belongs to Franklin county; Benton user gets 404
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Atlas_CountyIsolation_Cannot_Write_Geometry_CrossCounty()
    {
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.TestCountyId.ToString(),
            countyCode: "BENTON");

        var payload = new { centroidLat = 46.0, centroidLng = -119.0 };
        var response = await client.PutAsJsonAsync(
            "/api/atlas/parcels/OTHER-001/geometry", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Dossier_CountyIsolation_Hides_CrossCounty_Casefile()
    {
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.TestCountyId.ToString(),
            countyCode: "BENTON");

        var response = await client.GetAsync("/api/dossier/parcels/OTHER-001/casefile");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Dossier_CountyIsolation_Prevents_CrossCounty_NoteCreation()
    {
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.TestCountyId.ToString(),
            countyCode: "BENTON");

        var payload = new { content = "Cross-county test", type = "case_note" };
        var response = await client.PostAsJsonAsync("/api/dossier/OTHER-001/notes", payload);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Dais_CountyIsolation_Forbids_CrossCounty_Exemption_Impact()
    {
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.TestCountyId.ToString(),
            countyCode: "BENTON");

        var response = await client.GetAsync("/api/dais/exemptions/FRANKLIN/impact");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // Franklin county user CAN access Franklin data (positive isolation test)
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Atlas_FranklinUser_Can_Access_Franklin_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.OtherCountyId.ToString(),
            countyCode: "FRANKLIN");

        var response = await client.GetAsync("/api/atlas/parcels/OTHER-001");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Atlas_FranklinUser_Cannot_Access_Benton_Parcel()
    {
        using var client = _factory.CreateAuthenticatedClient(
            countyId: AuthenticatedClientExtensions.OtherCountyId.ToString(),
            countyCode: "FRANKLIN");

        var response = await client.GetAsync("/api/atlas/parcels/TEST-001");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
