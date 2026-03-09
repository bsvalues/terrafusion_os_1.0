using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the AuthController.
/// Validates login with government email domain enforcement, profile retrieval,
/// logout, and token revocation endpoints using the SeededApiWebAppFactory.
/// </summary>
[Collection("Integration")]
public class AuthControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public AuthControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ── POST /api/auth/login ──────────────────────────────────────────

    [Fact]
    public async Task Login_WithValidGovernmentEmail_Returns_Ok_With_Token()
    {
        using var client = _factory.CreateClient();

        var body = new StringContent(
            JsonSerializer.Serialize(new { email = "admin@county.gov", password = "test" }),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/login", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // LoginResponse should contain a token
        Assert.True(
            root.TryGetProperty("token", out var tokenProp) ||
            root.TryGetProperty("Token", out tokenProp),
            "Login response should contain a 'token' property");
        Assert.False(string.IsNullOrWhiteSpace(tokenProp.GetString()));
    }

    [Fact]
    public async Task Login_WithNonGovernmentEmail_Returns_Unauthorized()
    {
        using var client = _factory.CreateClient();

        var body = new StringContent(
            JsonSerializer.Serialize(new { email = "user@gmail.com", password = "test" }),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/login", body);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── GET /api/auth/profile ─────────────────────────────────────────

    [Fact]
    public async Task Profile_Returns_Ok_For_Authenticated_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/auth/profile");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Profile should have email information
        Assert.True(
            root.TryGetProperty("email", out _) ||
            root.TryGetProperty("Email", out _),
            "Profile response should contain an 'email' property");
    }

    [Fact]
    public async Task Profile_Returns_Unauthorized_For_Unauthenticated_User()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/profile");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────

    [Fact]
    public async Task Logout_Returns_Ok_For_Authenticated_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── POST /api/auth/revoke ─────────────────────────────────────────

    [Fact]
    public async Task Revoke_WithValidJwtToken_Returns_NoContent()
    {
        using var client = _factory.CreateClient();

        var token = AuthenticatedClientExtensions.GenerateTestJwt();

        var body = new StringContent(
            JsonSerializer.Serialize(new { token }),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/revoke", body);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Revoke_WithEmptyOrNullToken_Returns_BadRequest(string? token)
    {
        using var client = _factory.CreateClient();

        var body = new StringContent(
            JsonSerializer.Serialize(new { token }),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/revoke", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Revoke_WithNonJwtString_Returns_BadRequest()
    {
        using var client = _factory.CreateClient();

        var body = new StringContent(
            JsonSerializer.Serialize(new { token = "not-a-valid-jwt-token" }),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/revoke", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
