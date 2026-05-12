using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Interfaces;
using TerraFusion.API.Security.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

/// <summary>
/// PR-2 / Prometheus T3 #4: in non-Development environments,
/// <c>AddTerraFusionSecurityServices</c> now registers
/// <see cref="FailClosedLdapService"/> instead of the in-memory dev stub.
/// Every method on the fail-closed implementation must throw
/// <see cref="NotImplementedException"/> so a misconfiguration surfaces
/// loudly instead of allowing dev accounts to log in.
/// </summary>
[Trait("Category", "Security")]
[Trait("Component", "FailClosedLdapService")]
[Trait("Slice", "Prometheus-T3")]
public sealed class FailClosedLdapServiceTests
{
    private static FailClosedLdapService BuildSut()
        => new(NullLogger<FailClosedLdapService>.Instance);

    [Fact]
    public async Task AuthenticateAsync_Throws_NotImplementedException()
    {
        var sut = BuildSut();

        var act = async () => await sut.AuthenticateAsync("any-user", "any-password");

        await act.Should().ThrowAsync<NotImplementedException>()
            .WithMessage("*Production LDAP not configured*");
    }

    [Fact]
    public async Task GetUserAsync_Throws_NotImplementedException()
    {
        var sut = BuildSut();

        var act = async () => await sut.GetUserAsync("any-user");

        await act.Should().ThrowAsync<NotImplementedException>();
    }

    [Fact]
    public async Task IsUserInGroupAsync_Throws_NotImplementedException()
    {
        var sut = BuildSut();

        var act = async () => await sut.IsUserInGroupAsync("any-user", "any-group");

        await act.Should().ThrowAsync<NotImplementedException>();
    }

    [Fact]
    public async Task GetUserGroupsAsync_Throws_NotImplementedException()
    {
        var sut = BuildSut();

        var act = async () => await sut.GetUserGroupsAsync("any-user");

        await act.Should().ThrowAsync<NotImplementedException>();
    }

    [Fact]
    public void AddTerraFusionSecurityServices_NonDevelopment_RegistersFailClosedLdap()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();
        var env = new TestHostEnvironment("Production");

        services.AddTerraFusionSecurityServices(config, env);
        using var provider = services.BuildServiceProvider();

        var ldap = provider.GetRequiredService<ILdapService>();
        ldap.Should().BeOfType<FailClosedLdapService>(
            "non-Development must register the fail-closed implementation, " +
            "not the dev stub that previously allowed hardcoded accounts in prod");
    }

    [Fact]
    public void AddTerraFusionSecurityServices_Development_StillRegistersDevelopmentLdap()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();
        var env = new TestHostEnvironment("Development");

        services.AddTerraFusionSecurityServices(config, env);
        using var provider = services.BuildServiceProvider();

        var ldap = provider.GetRequiredService<ILdapService>();
        ldap.Should().BeOfType<DevelopmentLdapService>(
            "Development environment keeps the in-memory dev stub so local login still works");
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public TestHostEnvironment(string env) => EnvironmentName = env;
        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "TerraFusion.Test";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
