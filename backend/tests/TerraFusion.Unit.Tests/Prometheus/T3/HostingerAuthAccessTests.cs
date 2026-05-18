using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.Core.DTOs;
using Xunit;

using CoreAuth = TerraFusion.Core.Services;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

[Trait("Category", "Security")]
[Trait("Component", "HostingerAuthAccess")]
[Trait("Slice", "Prometheus-T3")]
public sealed class HostingerAuthAccessTests
{
    [Fact]
    public async Task AuthController_Login_UsesConfiguredCredentialValidator()
    {
        var authService = new Mock<CoreAuth.IAuthenticationService>(MockBehavior.Strict);
        var securityService = new Mock<CoreAuth.ISecurityService>(MockBehavior.Strict);
        securityService
            .Setup(x => x.IsValidGovernmentUserAsync("operator@terrafusionmarket.com"))
            .ReturnsAsync(true);
        securityService
            .Setup(x => x.ValidateUserCredentialsAsync("operator@terrafusionmarket.com", "WrongPassword123!"))
            .ReturnsAsync(false);
        securityService
            .Setup(x => x.LogSecurityEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var controller = new AuthController(
            authService.Object,
            securityService.Object,
            NullLogger<AuthController>.Instance);

        var result = await controller.Login(new LoginRequest
        {
            Email = "operator@terrafusionmarket.com",
            Password = "WrongPassword123!"
        });

        result.Should().BeOfType<UnauthorizedObjectResult>(
            "Hostinger login must not bypass the configured credential validator");
        securityService.Verify(
            x => x.ValidateUserCredentialsAsync("operator@terrafusionmarket.com", "WrongPassword123!"),
            Times.Once);
        authService.Verify(
            x => x.GenerateJwtTokenAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<IEnumerable<string>>()),
            Times.Never);
    }

    [Fact]
    public async Task AddTerraFusionAuthentication_WithBootstrapCredentials_InstallsProvisionedOperatorLogin()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-hostinger-bootstrap-key-at-least-32-chars-long-for-hmac-sha256",
                ["Auth:Bootstrap:Email"] = "operator@terrafusionmarket.com",
                ["Auth:Bootstrap:Password"] = "CorrectPassword123!",
                ["Auth:Bootstrap:Roles"] = "GovernmentUser,Administrator,FullSystemAccess"
            })
            .Build();

        services.AddTerraFusionAuthentication(config);

        using var provider = services.BuildServiceProvider();
        var security = provider.GetRequiredService<CoreAuth.ISecurityService>();

        (await security.IsValidGovernmentUserAsync("operator@terrafusionmarket.com")).Should().BeTrue();
        (await security.ValidateUserCredentialsAsync("operator@terrafusionmarket.com", "CorrectPassword123!")).Should().BeTrue();
        (await security.ValidateUserCredentialsAsync("operator@terrafusionmarket.com", "WrongPassword123!")).Should().BeFalse();
        (await security.ValidateUserCredentialsAsync("other@terrafusionmarket.com", "CorrectPassword123!")).Should().BeFalse();
        (await security.GetUserRolesAsync("operator@terrafusionmarket.com"))
            .Should()
            .BeEquivalentTo("GovernmentUser", "Administrator", "FullSystemAccess");
    }

    [Fact]
    public void AuthController_AccessPolicy_IsExplicitlyProvisionedAccessOnly()
    {
        var authService = new Mock<CoreAuth.IAuthenticationService>(MockBehavior.Loose);
        var securityService = new Mock<CoreAuth.ISecurityService>(MockBehavior.Loose);
        var controller = new AuthController(
            authService.Object,
            securityService.Object,
            NullLogger<AuthController>.Instance);

        var result = controller.GetAccessPolicy();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new
        {
            signupMode = "provisioned_access_only",
            publicSignupEnabled = false,
            message = "TerraFusion access is provisioned by an administrator. Public self-signup is disabled."
        });
    }
}
