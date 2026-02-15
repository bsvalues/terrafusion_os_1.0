using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Security;
using TerraFusion.API.Security.Interfaces;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase5;

[Trait("Phase", "5")]
[Trait("Component", "DependencyInjection")]
[Trait("Category", "Security")]
public sealed class SecurityDIRegistrationTests
{
    private ServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-key-that-is-long-enough-for-hmac-sha256-validation",
                ["JwtSettings:Issuer"] = "TerraFusion-Test",
                ["JwtSettings:Audience"] = "TerraFusion-Test"
            })
            .Build();

        services.AddTerraFusionSecurityServices(config);
        return services.BuildServiceProvider();
    }

    [Fact]
    public void AddTerraFusionSecurityServices_RegistersIMfaService()
    {
        using var provider = BuildServiceProvider();
        var service = provider.GetService<IMfaService>();
        service.Should().NotBeNull();
        service.Should().BeOfType<TerraFusion.API.Security.Services.InMemoryMfaService>();
    }

    [Fact]
    public void AddTerraFusionSecurityServices_RegistersISessionManager()
    {
        using var provider = BuildServiceProvider();
        var service = provider.GetService<ISessionManager>();
        service.Should().NotBeNull();
        service.Should().BeOfType<TerraFusion.API.Security.Services.InMemorySessionManager>();
    }

    [Fact]
    public void AddTerraFusionSecurityServices_RegistersILdapService()
    {
        using var provider = BuildServiceProvider();
        var service = provider.GetService<ILdapService>();
        service.Should().NotBeNull();
        service.Should().BeOfType<TerraFusion.API.Security.Services.DevelopmentLdapService>();
    }

    [Fact]
    public void AllSecurityServices_AreResolvable()
    {
        using var provider = BuildServiceProvider();
        var mfa = provider.GetRequiredService<IMfaService>();
        var session = provider.GetRequiredService<ISessionManager>();
        var ldap = provider.GetRequiredService<ILdapService>();
        mfa.Should().NotBeNull();
        session.Should().NotBeNull();
        ldap.Should().NotBeNull();
    }

    [Fact]
    public void SecurityServices_AreSingletons()
    {
        using var provider = BuildServiceProvider();
        var mfa1 = provider.GetRequiredService<IMfaService>();
        var mfa2 = provider.GetRequiredService<IMfaService>();
        mfa1.Should().BeSameAs(mfa2, "MFA service should be a singleton");
    }
}
