using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Services;
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
        var provisionedUsers = new Mock<IProvisionedUserContextProvider>(MockBehavior.Strict);
        provisionedUsers
            .Setup(x => x.GetProvisionedUserContextAsync("operator@terrafusionmarket.com"))
            .ReturnsAsync(new ProvisionedUserAuthContext(
                Guid.NewGuid(),
                "operator@terrafusionmarket.com",
                new[] { "GovernmentUser" },
                new[] { "read:parcel" },
                null,
                null,
                null,
                null));
        securityService
            .Setup(x => x.ValidateUserCredentialsAsync("operator@terrafusionmarket.com", "WrongPassword123!"))
            .ReturnsAsync(false);
        securityService
            .Setup(x => x.LogSecurityEventAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var controller = new AuthController(
            authService.Object,
            securityService.Object,
            provisionedUsers.Object,
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
    public void AddTerraFusionAuthentication_RegistersDatabaseProvisionedSecurityService()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(options =>
            options.UseInMemoryDatabase($"hostinger-auth-{Guid.NewGuid():N}"));
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-hostinger-db-auth-key-at-least-32-chars-long-for-hmac-sha256"
            })
            .Build();

        services.AddTerraFusionAuthentication(config);
        services.AddSingleton<IConfiguration>(config);

        using var provider = services.BuildServiceProvider();
        var security = provider.GetRequiredService<CoreAuth.ISecurityService>();
        var provisioned = provider.GetRequiredService<IProvisionedUserContextProvider>();

        security.Should().BeOfType<DatabaseProvisionedSecurityService>();
        provisioned.Should().BeSameAs(security);
    }

    [Fact]
    public async Task AddTerraFusionAuthentication_WithBootstrapCredentials_DoesNotEnableBootstrapLogin()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<TerraFusion.Data.TerraFusionDbContext>(options =>
            options.UseInMemoryDatabase($"hostinger-auth-bootstrap-blocked-{Guid.NewGuid():N}"));
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-hostinger-db-auth-key-at-least-32-chars-long-for-hmac-sha256",
                ["Auth:Bootstrap:Email"] = "operator@terrafusionmarket.com",
                ["Auth:Bootstrap:Password"] = "CorrectPassword123!",
                ["Auth:Bootstrap:Roles"] = "GovernmentUser,Administrator"
            })
            .Build();

        services.AddTerraFusionAuthentication(config);
        services.AddSingleton<IConfiguration>(config);

        using var provider = services.BuildServiceProvider();
        var security = provider.GetRequiredService<CoreAuth.ISecurityService>();

        security.Should().BeOfType<DatabaseProvisionedSecurityService>();
        (await security.IsValidGovernmentUserAsync("operator@terrafusionmarket.com")).Should().BeFalse();
        (await security.ValidateUserCredentialsAsync("operator@terrafusionmarket.com", "CorrectPassword123!")).Should().BeFalse();
    }

    [Fact]
    public void AuthController_AccessPolicy_IsExplicitlyProvisionedAccessOnly()
    {
        var authService = new Mock<CoreAuth.IAuthenticationService>(MockBehavior.Loose);
        var securityService = new Mock<CoreAuth.ISecurityService>(MockBehavior.Loose);
        var provisionedUsers = new Mock<IProvisionedUserContextProvider>(MockBehavior.Loose);
        var controller = new AuthController(
            authService.Object,
            securityService.Object,
            provisionedUsers.Object,
            NullLogger<AuthController>.Instance);

        var result = controller.GetAccessPolicy();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeEquivalentTo(new
        {
            signupMode = "provisioned_access_only",
            publicSignupEnabled = false,
            message = "TerraFusion access is provisioned by an administrator. Public self-signup and public access requests are disabled."
        });
    }
}
