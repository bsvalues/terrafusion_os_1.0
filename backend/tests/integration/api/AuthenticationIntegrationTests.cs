using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using TerraFusion.Core.DTOs;
using Xunit;

namespace TerraFusion.Tests.Integration.Api;

/// <summary>
/// Authentication Integration Tests - AI Swarm Generated
/// Government-grade security testing with JWT and role-based access
/// </summary>
public class AuthenticationIntegrationTests : TerraFusionTestBase
{
    public AuthenticationIntegrationTests(TestSetup factory) : base(factory) { }

    [Fact]
    public async Task POST_Auth_Login_ValidCredentials_ReturnsToken()
    {
        // Arrange - Government user login
        var loginRequest = new LoginRequestDto
        {
            Username = "assessor@bentoncounty.wa.gov",
            Password = "SecurePassword123!",
            County = "Benton County",
            State = "WA"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        loginResponse.Should().NotBeNull();
        loginResponse!.Token.Should().NotBeNullOrEmpty();
        loginResponse.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
        loginResponse.User.Should().NotBeNull();
        loginResponse.User.County.Should().Be("Benton County");
        loginResponse.User.Roles.Should().Contain("PropertyAssessor");
    }

    [Theory]
    [InlineData("admin@bentoncounty.wa.gov", new[] { "SystemAdmin", "PropertyAssessor", "DataViewer" })]
    [InlineData("assessor@bentoncounty.wa.gov", new[] { "PropertyAssessor", "DataViewer" })]
    [InlineData("viewer@bentoncounty.wa.gov", new[] { "DataViewer" })]
    public async Task GET_Auth_UserInfo_ReturnsCorrectRoles(string email, string[] expectedRoles)
    {
        // Arrange - Login to get token
        var token = await GetAuthTokenForUser(email);
        Client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        // Act
        var response = await Client.GetAsync("/api/auth/userinfo");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var userInfo = await response.Content.ReadFromJsonAsync<UserInfoDto>();
        userInfo.Should().NotBeNull();
        userInfo!.Email.Should().Be(email);
        userInfo.County.Should().Be("Benton County");
        userInfo.State.Should().Be("WA");
        
        foreach (var expectedRole in expectedRoles)
        {
            userInfo.Roles.Should().Contain(expectedRole);
        }
    }

    [Fact]
    public async Task GET_Properties_RequiresAuthentication()
    {
        // Act - Request without authentication
        var response = await Client.GetAsync("/api/properties");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task POST_Properties_RequiresAssessorRole()
    {
        // Arrange - Login as viewer (insufficient permissions)
        var token = await GetAuthTokenForUser("viewer@bentoncounty.wa.gov");
        Client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var createDto = new CreatePropertyDto
        {
            Address = "100 Unauthorized St",
            City = "Prosser",
            County = "Benton County",
            State = "WA",
            PropertyType = PropertyType.Residential
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/properties", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<string> GetAuthTokenForUser(string email)
    {
        var loginRequest = new LoginRequestDto
        {
            Username = email,
            Password = "TestPassword123!",
            County = "Benton County",
            State = "WA"
        };

        var response = await Client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        return loginResponse!.Token;
    }
}
