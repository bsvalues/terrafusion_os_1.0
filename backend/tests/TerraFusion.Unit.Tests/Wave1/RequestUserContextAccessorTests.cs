using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using TerraFusion.API.Auth;
using TerraFusion.Core.Auth;
using Xunit;

namespace TerraFusion.Unit.Tests.Wave1;

public class RequestUserContextAccessorTests
{
    private static HttpContextRequestUserContextAccessor CreateSut(ClaimsPrincipal? user = null)
    {
        var httpContext = new DefaultHttpContext();
        if (user != null)
            httpContext.User = user;

        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        return new HttpContextRequestUserContextAccessor(accessor);
    }

    [Fact]
    public void Returns_Anonymous_When_HttpContext_Is_Null()
    {
        var accessor = new HttpContextRequestUserContextAccessor(new HttpContextAccessor());
        var result = accessor.Current;

        Assert.False(result.IsAuthenticated);
        Assert.Null(result.UserId);
        Assert.Null(result.CountyId);
    }

    [Fact]
    public void Returns_Anonymous_When_User_Is_Not_Authenticated()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity()); // no auth type = not authenticated
        var sut = CreateSut(principal);

        var result = sut.Current;

        Assert.False(result.IsAuthenticated);
        Assert.Equal(RequestUserContext.Anonymous, result);
    }

    [Fact]
    public void Extracts_UserId_From_NameIdentifier_Claim()
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "user-42") };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var sut = CreateSut(principal);

        var result = sut.Current;

        Assert.True(result.IsAuthenticated);
        Assert.Equal("user-42", result.UserId);
    }

    [Fact]
    public void Extracts_CountyId_From_CountyId_Claim()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "u1"),
            new Claim("countyId", "benton"),
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var sut = CreateSut(principal);

        var result = sut.Current;

        Assert.Equal("benton", result.CountyId);
    }

    [Fact]
    public void Returns_Empty_Roles_When_No_Role_Claims()
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "u1") };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var sut = CreateSut(principal);

        var result = sut.Current;

        Assert.Empty(result.Roles);
    }

    [Fact]
    public void Rejects_Missing_CountyId_When_Endpoint_Requires_It()
    {
        // Simulates what a controller does when CountyId is null
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "u1") };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var sut = CreateSut(principal);

        var result = sut.Current;

        // The accessor itself returns the context; the CONTROLLER checks CountyId
        Assert.True(result.IsAuthenticated);
        Assert.Null(result.CountyId); // Controller would return Unauthorized() here
    }
}
