using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace TerraFusion.API.Tests.Infrastructure;

/// <summary>
/// Helper for generating JWT tokens and configuring authenticated HttpClients
/// for integration tests. Tokens include countyId/countyCode claims and
/// dynamic "perm" claims used by DynamicModulePolicyProvider + PluginPermissionHandler.
/// </summary>
public static class AuthenticatedClientExtensions
{
    // Must match the default key logic in AuthenticationConfiguration.cs
    // In tests the app uses the default key from appsettings (or fallback).
    // We replicate the key structure the API expects.
    private const string TestIssuer = "TerraFusion";
    private const string TestAudience = "TerraFusionAPI";

    /// <summary>
    /// Well-known test county ID used across all integration tests.
    /// Seed data must insert a County row with this ID.
    /// </summary>
    public static readonly Guid TestCountyId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    /// <summary>
    /// A second county ID for county-isolation tests.
    /// </summary>
    public static readonly Guid OtherCountyId = Guid.Parse("00000000-0000-0000-0000-000000000002");

    /// <summary>
    /// Generate a signed JWT token with the given claims. The signing key
    /// is read from the API's configuration (JwtSettings:SecretKey). Because
    /// ApiWebAppFactory boots the real Program pipeline, the key in
    /// appsettings.json (or the generated default) is used. To make tests
    /// deterministic, we create the token with a long-lived, known key and
    /// override the API's key via WebApplicationFactory configuration.
    /// </summary>
    public static string GenerateTestJwt(
        string userId = "test-user-001",
        string email = "test@county.gov",
        string countyId = "00000000-0000-0000-0000-000000000001",
        string? countyCode = "BENTON",
        string[]? permissions = null,
        string[]? roles = null)
    {
        var key = GetTestSigningKey();
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("countyId", countyId),
        };

        if (countyCode is not null)
            claims.Add(new Claim("countyCode", countyCode));

        foreach (var role in roles ?? ["GovernmentUser", "Assessor", "Admin"])
            claims.Add(new Claim(ClaimTypes.Role, role));

        foreach (var perm in permissions ?? AllPermissions)
            claims.Add(new Claim("perm", perm));

        var token = new JwtSecurityToken(
            issuer: TestIssuer,
            audience: TestAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// The fixed test signing key — must match what the API is configured with.
    /// ApiWebAppFactory overrides JwtSettings:SecretKey to this value.
    /// </summary>
    public static SymmetricSecurityKey GetTestSigningKey()
    {
        return new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(TestSigningKeyValue));
    }

    /// <summary>
    /// The raw key string injected into the API configuration during tests.
    /// Must be at least 32 bytes for HmacSha256.
    /// </summary>
    public const string TestSigningKeyValue =
        "TerraFusion-Integration-Test-Key-2026-ABCDEF0123456789";

    /// <summary>
    /// All permissions used across the four controllers under test.
    /// </summary>
    public static readonly string[] AllPermissions =
    [
        "access:costforge",
        "calculate:property-cost",
        "read:cost-matrix",
        "read:parcel",
        "write:parcel",
        "read:dossier",
        "write:dossier",
        "read:dais",
        "write:dais",
    ];

    /// <summary>
    /// Create an HttpClient pre-configured with an Authorization: Bearer header
    /// for the given user and permissions.
    /// </summary>
    public static System.Net.Http.HttpClient CreateAuthenticatedClient(
        this ApiWebAppFactory factory,
        string? countyId = null,
        string? countyCode = "BENTON",
        string[]? permissions = null)
    {
        var client = factory.CreateClient();
        var token = GenerateTestJwt(
            countyId: countyId ?? TestCountyId.ToString(),
            countyCode: countyCode,
            permissions: permissions);

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        return client;
    }
}
