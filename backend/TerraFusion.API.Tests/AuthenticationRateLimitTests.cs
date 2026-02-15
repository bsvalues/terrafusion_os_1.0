using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;
using TerraFusion.API.Tests.Infrastructure;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests;

[Trait("Category", "Phase4")]
[Trait("Category", "Integration")]
public sealed class AuthenticationRateLimitTests : IClassFixture<ApiWebAppFactory>
{
    private readonly ApiWebAppFactory _factory;

    public AuthenticationRateLimitTests(ApiWebAppFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AuthEndpoints_Burst_Returns429()
    {
        var authService = new Mock<IAuthenticationService>(MockBehavior.Loose);
        authService
            .Setup(x => x.GenerateJwtTokenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync("test-token");

        var securityService = new Mock<ISecurityService>(MockBehavior.Loose);
        securityService
            .Setup(x => x.IsValidGovernmentUserAsync(It.IsAny<string>()))
            .ReturnsAsync(true);
        securityService
            .Setup(x => x.LogSecurityEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var configuredFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IAuthenticationService>();
                services.RemoveAll<ISecurityService>();
                services.AddSingleton(authService.Object);
                services.AddSingleton(securityService.Object);
            });
        });

        using var client = configuredFactory.CreateClient();

        var request = new LoginRequest
        {
            // Intentionally invalid format to keep execution on model validation path
            // and avoid auth service dependencies masking rate-limit behavior.
            Email = "invalid-email",
            Password = "TestPassword123!"
        };

        var statuses = new List<HttpStatusCode>();

        for (var i = 0; i < 40; i++)
        {
            var response = await client.PostAsJsonAsync("/api/auth/login", request);
            statuses.Add(response.StatusCode);
        }

        statuses.Should().NotContain(HttpStatusCode.NotFound,
            "auth login endpoint must exist before rate-limit enforcement can be validated");

        statuses.Should().NotContain(HttpStatusCode.InternalServerError,
            "auth login requests should not fail with server errors during throttle validation");

        statuses.Should().Contain(HttpStatusCode.TooManyRequests,
            "auth login endpoint must enforce burst throttling and return HTTP 429");
    }
}
