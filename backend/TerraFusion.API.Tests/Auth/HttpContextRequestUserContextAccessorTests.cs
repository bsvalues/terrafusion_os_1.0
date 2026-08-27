using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TerraFusion.API.Auth;
using Xunit;

namespace TerraFusion.API.Tests.Auth;

public sealed class HttpContextRequestUserContextAccessorTests
{
    [Fact]
    public void Current_ReturnsAnonymousWithoutAuthenticatedIdentity()
    {
        var sut = CreateSut(new ClaimsPrincipal());

        Assert.False(sut.Current.IsAuthenticated);
        Assert.Null(sut.Current.UserId);
        Assert.Null(sut.Current.CountyId);
        Assert.Empty(sut.Current.Roles);
    }

    [Fact]
    public void Current_UsesOneNormalizedCountyClaim()
    {
        var sut = CreateSut(
            new Claim(ClaimTypes.NameIdentifier, "user-1"),
            new Claim("countyId", "  wa-benton  "),
            new Claim(ClaimTypes.Role, "Assessor"));

        Assert.True(sut.Current.IsAuthenticated);
        Assert.Equal("user-1", sut.Current.UserId);
        Assert.Equal("wa-benton", sut.Current.CountyId);
        Assert.Equal(new[] { "Assessor" }, sut.Current.Roles);
    }

    [Fact]
    public void Current_AllowsRepeatedEquivalentCountyClaims()
    {
        var sut = CreateSut(
            new Claim("countyId", "WA-BENTON"),
            new Claim("county_id", "wa-benton"),
            new Claim("countyCode", "  Wa-Benton  "));

        Assert.Equal("wa-benton", sut.Current.CountyId);
    }

    [Fact]
    public void Current_CanonicalizesEquivalentWashingtonAliasesBeforeConflictCheck()
    {
        var sut = CreateSut(
            new Claim("countyId", "Benton County"),
            new Claim("county_id", "benton-wa"),
            new Claim("countyCode", "53005"));

        Assert.Equal("wa-benton", sut.Current.CountyId);
    }

    [Fact]
    public void Current_DeniesCountyAuthorityWhenClaimTypesConflict()
    {
        var sut = CreateSut(
            new Claim("countyId", "wa-benton"),
            new Claim("county_id", "wa-king"),
            new Claim("countyCode", "53005"));

        Assert.True(sut.Current.IsAuthenticated);
        Assert.Null(sut.Current.CountyId);
    }

    [Fact]
    public void Current_DeniesCountyAuthorityWhenOneClaimTypeRepeatsDifferentValues()
    {
        var sut = CreateSut(
            new Claim("countyId", "wa-benton"),
            new Claim("countyId", "wa-king"));

        Assert.Null(sut.Current.CountyId);
    }

    [Fact]
    public void Current_IgnoresBlankCountyClaimsButDoesNotInventFallback()
    {
        var withOneValue = CreateSut(
            new Claim("countyId", " "),
            new Claim("countyCode", "53005"));
        var blanksOnly = CreateSut(
            new Claim("countyId", " "),
            new Claim("countyCode", ""));

        Assert.Equal("wa-benton", withOneValue.Current.CountyId);
        Assert.Null(blanksOnly.Current.CountyId);
    }

    private static HttpContextRequestUserContextAccessor CreateSut(params Claim[] claims)
    {
        return CreateSut(
            new ClaimsPrincipal(new ClaimsIdentity(claims, authenticationType: "test")));
    }

    private static HttpContextRequestUserContextAccessor CreateSut(ClaimsPrincipal user)
    {
        var context = new DefaultHttpContext
        {
            User = user,
        };

        return new HttpContextRequestUserContextAccessor(
            new HttpContextAccessor { HttpContext = context });
    }
}
