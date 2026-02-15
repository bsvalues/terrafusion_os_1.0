using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Tokens;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase4;

[Trait("Phase", "4")]
[Trait("Component", "JwtTokenService")]
[Trait("Category", "Security")]
public sealed class JwtTokenServiceSecurityTests
{
    private const string ExpectedIssuer = "TerraFusion.Test.Issuer";
    private const string ExpectedAudience = "TerraFusion.Test.Audience";
    private const string ValidSecret = "this-is-a-test-secret-key-at-least-32-chars";
    private const string AlternateSecret = "alternate-test-secret-key-at-least-32-chars";

    private static JwtTokenService CreateSut()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = ValidSecret,
                ["JwtSettings:Issuer"] = ExpectedIssuer,
                ["JwtSettings:Audience"] = ExpectedAudience,
                ["JwtSettings:ExpirationMinutes"] = "60",
                ["JwtSettings:RefreshTokenExpirationDays"] = "7"
            })
            .Build();

        return new JwtTokenService(config, NullLogger<JwtTokenService>.Instance);
    }

    private static string BuildToken(
        string issuer,
        string audience,
        string signingSecret,
        DateTime expiresUtc,
        DateTime notBeforeUtc)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-123"),
                new Claim(ClaimTypes.Email, "user@terrafusion.test"),
                new Claim("jti", Guid.NewGuid().ToString("N"))
            },
            notBefore: notBeforeUtc,
            expires: expiresUtc,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [Fact]
    public void ValidateToken_WrongIssuer_ReturnsInvalid()
    {
        var sut = CreateSut();
        var token = BuildToken(
            issuer: "Wrong.Issuer",
            audience: ExpectedAudience,
            signingSecret: ValidSecret,
            expiresUtc: DateTime.UtcNow.AddMinutes(5),
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-1));

        var result = sut.ValidateToken(token);

        result.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_WrongAudience_ReturnsInvalid()
    {
        var sut = CreateSut();
        var token = BuildToken(
            issuer: ExpectedIssuer,
            audience: "Wrong.Audience",
            signingSecret: ValidSecret,
            expiresUtc: DateTime.UtcNow.AddMinutes(5),
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-1));

        var result = sut.ValidateToken(token);

        result.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_InvalidSignature_ReturnsInvalid()
    {
        var sut = CreateSut();
        var token = BuildToken(
            issuer: ExpectedIssuer,
            audience: ExpectedAudience,
            signingSecret: AlternateSecret,
            expiresUtc: DateTime.UtcNow.AddMinutes(5),
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-1));

        var result = sut.ValidateToken(token);

        result.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_Expired_ReturnsInvalid()
    {
        var sut = CreateSut();
        var token = BuildToken(
            issuer: ExpectedIssuer,
            audience: ExpectedAudience,
            signingSecret: ValidSecret,
            expiresUtc: DateTime.UtcNow.AddMinutes(-2),
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-10));

        var result = sut.ValidateToken(token);

        result.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_ClockSkewBeyondAllowed_ReturnsInvalid()
    {
        var sut = CreateSut();
        var token = BuildToken(
            issuer: ExpectedIssuer,
            audience: ExpectedAudience,
            signingSecret: ValidSecret,
            expiresUtc: DateTime.UtcNow.AddSeconds(-30),
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-5));

        var result = sut.ValidateToken(token);

        // Strict validation target for Phase 4: recently expired tokens are rejected.
        result.Should().BeNull();
    }
}
