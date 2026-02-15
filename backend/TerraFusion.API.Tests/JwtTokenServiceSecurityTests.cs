using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.IdentityModel.Tokens;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.API.Tests;

public sealed class JwtTokenServiceSecurityTests
{
    private const string ValidIssuer = "TerraFusion.API";
    private const string ValidAudience = "TerraFusion.Client";
    private const string ValidSecret = "0123456789ABCDEF0123456789ABCDEF";

    [Fact]
    public void ValidateToken_WrongIssuer_ReturnsInvalid()
    {
        var service = CreateService();
        var token = CreateToken(
            secret: ValidSecret,
            issuer: "Wrong.Issuer",
            audience: ValidAudience,
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-1),
            expiresUtc: DateTime.UtcNow.AddMinutes(10));

        var principal = service.ValidateToken(token);

        Assert.Null(principal);
    }

    [Fact]
    public void ValidateToken_WrongAudience_ReturnsInvalid()
    {
        var service = CreateService();
        var token = CreateToken(
            secret: ValidSecret,
            issuer: ValidIssuer,
            audience: "Wrong.Audience",
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-1),
            expiresUtc: DateTime.UtcNow.AddMinutes(10));

        var principal = service.ValidateToken(token);

        Assert.Null(principal);
    }

    [Fact]
    public void ValidateToken_InvalidSignature_ReturnsInvalid()
    {
        var service = CreateService();
        var token = CreateToken(
            secret: "FEDCBA9876543210FEDCBA9876543210",
            issuer: ValidIssuer,
            audience: ValidAudience,
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-1),
            expiresUtc: DateTime.UtcNow.AddMinutes(10));

        var principal = service.ValidateToken(token);

        Assert.Null(principal);
    }

    [Fact]
    public void ValidateToken_Expired_ReturnsInvalid()
    {
        var service = CreateService();
        var token = CreateToken(
            secret: ValidSecret,
            issuer: ValidIssuer,
            audience: ValidAudience,
            notBeforeUtc: DateTime.UtcNow.AddMinutes(-10),
            // Expired beyond 1-minute skew configured in JwtTokenService
            expiresUtc: DateTime.UtcNow.AddMinutes(-2));

        var principal = service.ValidateToken(token);

        Assert.Null(principal);
    }

    [Fact]
    public void ValidateToken_ClockSkewBeyondAllowed_ReturnsInvalid()
    {
        var service = CreateService();
        var token = CreateToken(
            secret: ValidSecret,
            issuer: ValidIssuer,
            audience: ValidAudience,
            // Not valid yet beyond 1-minute skew configured in JwtTokenService
            notBeforeUtc: DateTime.UtcNow.AddMinutes(2),
            expiresUtc: DateTime.UtcNow.AddMinutes(10));

        var principal = service.ValidateToken(token);

        Assert.Null(principal);
    }

    private static JwtTokenService CreateService()
    {
        var configValues = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = ValidSecret,
            ["JwtSettings:Issuer"] = ValidIssuer,
            ["JwtSettings:Audience"] = ValidAudience,
            ["JwtSettings:ExpirationMinutes"] = "60",
            ["JwtSettings:RefreshTokenExpirationDays"] = "7"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        return new JwtTokenService(configuration, NullLogger<JwtTokenService>.Instance);
    }

    private static string CreateToken(
        string secret,
        string issuer,
        string audience,
        DateTime notBeforeUtc,
        DateTime expiresUtc)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, "user-123"),
                new Claim(ClaimTypes.Email, "user@example.com")
            ]),
            Issuer = issuer,
            Audience = audience,
            NotBefore = notBeforeUtc,
            Expires = expiresUtc,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(descriptor);
        return tokenHandler.WriteToken(token);
    }
}
