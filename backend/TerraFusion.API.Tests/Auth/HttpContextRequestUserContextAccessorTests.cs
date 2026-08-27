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
        Assert.Equal("benton", sut.Current.CountyId);
        Assert.Equal(new[] { "Assessor" }, sut.Current.Roles);
    }

    [Fact]
    public void Current_AllowsRepeatedEquivalentCountyClaims()
    {
        var sut = CreateSut(
            new Claim("countyId", "WA-BENTON"),
            new Claim("county_id", "wa-benton"),
            new Claim("countyCode", "  Wa-Benton  "));

        Assert.Equal("benton", sut.Current.CountyId);
    }

    [Fact]
    public void Current_CanonicalizesEquivalentWashingtonAliasesBeforeConflictCheck()
    {
        var sut = CreateSut(
            new Claim("countyId", "Benton County"),
            new Claim("county_id", "benton-wa"),
            new Claim("countyCode", "53005"));

        Assert.Equal("benton", sut.Current.CountyId);
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

        Assert.Equal("benton", withOneValue.Current.CountyId);
        Assert.Null(blanksOnly.Current.CountyId);
    }

    [Theory]
    [InlineData("countyId", "benton")]
    [InlineData("countyId", "Benton County")]
    [InlineData("countyCode", "53005")]
    public void Current_ReturnsNormalizedCanonicalCountyNameForOneNonGuidAlias(
        string claimType,
        string claimValue)
    {
        var sut = CreateSut(
            new Claim(ClaimTypes.NameIdentifier, "user-1"),
            new Claim(claimType, claimValue));

        Assert.Equal("benton", sut.Current.CountyId);
    }

    [Fact]
    public void Current_PreservesSoleCountyGuidWhenIssuedTokenAlsoContainsCountyCode()
    {
        var countyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
        var sut = CreateSut(
            new Claim(ClaimTypes.NameIdentifier, "user-1"),
            new Claim("countyId", countyId.ToString("D").ToUpperInvariant()),
            new Claim("countyCode", "benton"));

        Assert.Equal(countyId.ToString("D"), sut.Current.CountyId);
    }

    [Fact]
    public void Current_DeniesMultipleDistinctCountyGuids()
    {
        var sut = CreateSut(
            new Claim("countyId", "11111111-2222-3333-4444-555555555555"),
            new Claim("county_id", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));

        Assert.Null(sut.Current.CountyId);
    }

    [Fact]
    public void Current_DeniesConflictingSupplementalAliasesEvenWithOneCountyGuid()
    {
        var sut = CreateSut(
            new Claim("countyId", "11111111-2222-3333-4444-555555555555"),
            new Claim("countyCode", "53005"),
            new Claim("countyCode", "53033"));

        Assert.Null(sut.Current.CountyId);
    }

    [Fact]
    public void Current_DeniesUnknownSupplementalAliasEvenWithOneCountyGuid()
    {
        var sut = CreateSut(
            new Claim("countyId", "11111111-2222-3333-4444-555555555555"),
            new Claim("countyCode", "not-a-county"));

        Assert.Null(sut.Current.CountyId);
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
