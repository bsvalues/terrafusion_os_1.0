using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using TerraFusion.Security;
using TerraFusion.Security.Background;
using TerraFusion.Security.Services;
using Xunit;

namespace TerraFusion.Security.Tests;

/// <summary>
/// BREAKER SUITE: DI Wiring &amp; Module Registration
///
/// Verifies that AddTerraFusionSecurity registers all required services
/// and that no critical service is silently missing at runtime.
///
/// Attack vector: Missing DI registration → NullReferenceException in prod.
/// </summary>
[Trait("Phase", "4")]
[Trait("Agent", "4")]
[Trait("Category", "Breaker")]
public sealed class SecurityModuleWiringTests
{
    private readonly IServiceProvider _provider;

    public SecurityModuleWiringTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:Jwt:SecretKey"] = "test-secret-key-minimum-32-chars-long!!",
                ["Security:Jwt:Issuer"] = "TerraFusion-Test",
                ["Security:Jwt:Audiences:0"] = "TerraFusion-Test-Audience",
                ["Security:Encryption:QuantumResistant"] = "true",
                ["Security:MFA:Required"] = "false",
                ["Security:Compliance:RequiredStandards:0"] = "FISMA-HIGH",
            })
            .Build();

        var envMock = new Mock<IWebHostEnvironment>();
        envMock.Setup(e => e.EnvironmentName).Returns("Development");

        services.AddTerraFusionSecurity(config, envMock.Object);

        _provider = services.BuildServiceProvider();
    }

    [Fact]
    public void SecurityModule_Resolves_ITokenValidationService()
    {
        var svc = _provider.GetService<ITokenValidationService>();
        svc.Should().NotBeNull("ITokenValidationService must be registered by SecurityModule");
    }

    [Fact]
    public void SecurityModule_Resolves_IQuantumResistantEncryptionService()
    {
        var svc = _provider.GetService<IQuantumResistantEncryptionService>();
        svc.Should().NotBeNull("IQuantumResistantEncryptionService must be registered by SecurityModule");
    }

    [Fact]
    public void SecurityModule_Resolves_ISecurityAuditService()
    {
        var svc = _provider.GetService<ISecurityAuditService>();
        svc.Should().NotBeNull("ISecurityAuditService must be registered by SecurityModule");
    }

    [Fact]
    public void SecurityModule_Resolves_IMultiFactorAuthService()
    {
        var svc = _provider.GetService<IMultiFactorAuthService>();
        svc.Should().NotBeNull("IMultiFactorAuthService must be registered by SecurityModule");
    }

    [Fact]
    public void SecurityModule_Resolves_IPenetrationTester()
    {
        var svc = _provider.GetService<IPenetrationTester>();
        svc.Should().NotBeNull("IPenetrationTester must be registered for automated pen testing");
    }

    [Fact]
    public void SecurityModule_Resolves_IVulnerabilityScanner()
    {
        var svc = _provider.GetService<IVulnerabilityScanner>();
        svc.Should().NotBeNull("IVulnerabilityScanner must be registered for vulnerability scanning");
    }

    [Fact]
    public void SecurityModule_Resolves_ISecurityIncidentResponseService()
    {
        var svc = _provider.GetService<ISecurityIncidentResponseService>();
        svc.Should().NotBeNull("ISecurityIncidentResponseService must be registered for incident response");
    }

    [Fact]
    public void SecurityModule_Does_Not_Throw_On_Build()
    {
        // If we got here, BuildServiceProvider succeeded
        _provider.Should().NotBeNull();
    }

    [Fact]
    public void SecurityModule_Registers_SecurityConfiguration_Options()
    {
        var opts = _provider.GetService<Microsoft.Extensions.Options.IOptions<SecurityConfiguration>>();
        opts.Should().NotBeNull("SecurityConfiguration must be bound from config section");
        opts!.Value.Should().NotBeNull();
    }
}
