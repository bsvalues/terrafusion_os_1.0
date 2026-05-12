using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Security;
using Xunit;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

/// <summary>
/// PR-2 / Prometheus T3 #5: <c>AddTerraFusionAuthentication</c> must
/// fail-fast when no JWT signing key is configured in non-Development.
/// Pre-PR-2 it silently synthesized a random
/// <c>"TerraFusion-Default-Key-..." + 8-char GUID</c> key — a working-but-
/// forgeable JWT signer with only a <c>Console.WriteLine</c> warning.
/// Development still accepts a missing key and falls back to a long,
/// fixed dev key so local dev keeps working.
/// </summary>
[Trait("Category", "Security")]
[Trait("Component", "AuthenticationConfiguration")]
[Trait("Slice", "Prometheus-T3")]
public sealed class JwtConfigurationFailFastTests
{
    [Fact]
    public void AddTerraFusionAuthentication_NoKey_NonDevelopment_Throws()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build(); // no JwtSettings:SecretKey
        var env = new TestHostEnvironment("Production");

        var act = () => services.AddTerraFusionAuthentication(config, env);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*JwtSettings:SecretKey is required in non-Development*");
    }

    [Fact]
    public void AddTerraFusionAuthentication_NoKey_Staging_Throws()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();
        var env = new TestHostEnvironment("Staging");

        var act = () => services.AddTerraFusionAuthentication(config, env);

        act.Should().Throw<InvalidOperationException>(
            "any non-Development environment (Staging included) must fail-fast on missing JWT key");
    }

    [Fact]
    public void AddTerraFusionAuthentication_NoKey_Development_DoesNotThrow()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();
        var env = new TestHostEnvironment("Development");

        var act = () => services.AddTerraFusionAuthentication(config, env);

        act.Should().NotThrow(
            "Development gets a long, fixed dev-only fallback key so local dev works without env vars");
    }

    [Fact]
    public void AddTerraFusionAuthentication_NoEnvironment_TreatsAsNonDevelopment_Throws()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder().Build();

        // No environment passed → treated as non-Development → fail-fast.
        var act = () => services.AddTerraFusionAuthentication(config);

        act.Should().Throw<InvalidOperationException>(
            "absent IHostEnvironment must be treated as non-Development for safety");
    }

    [Fact]
    public void AddTerraFusionAuthentication_KeyPresent_NonDevelopment_DoesNotThrow()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "real-prod-key-supplied-by-operator-32-chars-minimum-length-padding",
            })
            .Build();
        var env = new TestHostEnvironment("Production");

        var act = () => services.AddTerraFusionAuthentication(config, env);

        act.Should().NotThrow("explicit operator-supplied key satisfies the fail-fast check");
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
