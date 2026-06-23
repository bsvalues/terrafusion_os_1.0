using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Services;
using Xunit;

using CoreAuth = TerraFusion.Core.Services;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

/// <summary>
/// PR-2 / Prometheus T3 #2 and #3: the in-memory fallback
/// <c>ISecurityService</c> now denies every permission check and rejects
/// every credential validation. Pre-PR-2 it returned <c>true</c> for any
/// permission and <c>true</c> for any non-empty email+password — silent
/// allow-all. These tests pin the fail-closed default.
/// </summary>
[Trait("Category", "Security")]
[Trait("Component", "InMemorySecurityService")]
[Trait("Slice", "Prometheus-T3")]
public sealed class InMemorySecurityServiceFailClosedTests
{
    private static CoreAuth.ISecurityService BuildSut()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = CreateConfig();
        services.AddSingleton<IConfiguration>(config);
        services.AddTerraFusionAuthentication(config);

        var provider = services.BuildServiceProvider();
        return provider.GetRequiredService<CoreAuth.ISecurityService>();
    }

    [Fact]
    public async Task HasPermissionAsync_ReturnsFalse_ForAnyTuple()
    {
        var sut = BuildSut();

        var result = await sut.HasPermissionAsync("user-123", "system.admin");

        result.Should().BeFalse(
            "PR-2 #2 fail-closed: silent allow-all is gone; real ISecurityService must replace this");
    }

    [Fact]
    public async Task HasModuleAccessAsync_ReturnsFalse_ForAnyTuple()
    {
        var sut = BuildSut();

        var result = await sut.HasModuleAccessAsync("user-123", "terraforge");

        result.Should().BeFalse(
            "PR-2 #2 sibling: module-access fallback must deny too");
    }

    [Fact]
    public async Task ValidateUserCredentialsAsync_ReturnsFalse_ForAnyNonEmptyInput()
    {
        var sut = BuildSut();

        var result = await sut.ValidateUserCredentialsAsync("user@gov.example", "any-password");

        result.Should().BeFalse(
            "PR-2 #3 fail-closed: 'any non-empty pair authenticates' silent default is gone");
    }

    [Fact]
    public async Task ValidateUserCredentialsAsync_ReturnsFalse_ForEmptyInput()
    {
        var sut = BuildSut();

        var emptyEmail = await sut.ValidateUserCredentialsAsync(string.Empty, "pw");
        var emptyPassword = await sut.ValidateUserCredentialsAsync("user@gov.example", string.Empty);

        emptyEmail.Should().BeFalse();
        emptyPassword.Should().BeFalse();
    }

    [Fact]
    public async Task AddTerraFusionAuthentication_WithoutDbContext_ResolvesFailClosedFallback()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = CreateConfig();
        services.AddSingleton<IConfiguration>(config);
        services.AddTerraFusionAuthentication(config);

        using var provider = services.BuildServiceProvider();
        var security = provider.GetRequiredService<CoreAuth.ISecurityService>();
        var provisioned = provider.GetRequiredService<IProvisionedUserContextProvider>();

        security.GetType().Name.Should().Be("InMemorySecurityService");
        (await provisioned.GetProvisionedUserContextAsync("user@county.")).Should().NotBeNull(
            "legacy/test lanes still need a provisioned-user context bridge before credential validation can fail closed");
    }

    private static IConfiguration CreateConfig()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-failclosed-key-at-least-32-chars-long-for-hmac-sha256",
                ["JwtSettings:Issuer"] = "TerraFusion.Test",
                ["JwtSettings:Audience"] = "TerraFusion.Test",
            })
            .Build();
    }
}
