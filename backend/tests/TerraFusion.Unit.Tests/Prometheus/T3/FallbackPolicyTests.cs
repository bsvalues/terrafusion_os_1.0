using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Security;
using Xunit;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

/// <summary>
/// PR-2 / Prometheus T3 #1: assert that <c>AddTerraFusionAuthentication</c>
/// installs a global <c>FallbackPolicy.RequireAuthenticatedUser()</c>.
/// Any controller without <c>[Authorize]</c> or <c>[AllowAnonymous]</c>
/// gets challenged → 401 in production, instead of silently defaulting
/// to anonymous (which was the pre-PR-2 behavior).
/// </summary>
[Trait("Category", "Security")]
[Trait("Component", "AuthenticationConfiguration")]
[Trait("Slice", "Prometheus-T3")]
public sealed class FallbackPolicyTests
{
    private static IServiceProvider BuildProvider()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddOptions();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-fallback-policy-key-at-least-32-chars-long-for-hmac-sha256",
                ["JwtSettings:Issuer"] = "TerraFusion.Test",
                ["JwtSettings:Audience"] = "TerraFusion.Test",
            })
            .Build();

        services.AddTerraFusionAuthentication(config);
        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task AddTerraFusionAuthentication_InstallsFallbackPolicy_RequiringAuthenticatedUser()
    {
        using var provider = (ServiceProvider)BuildProvider();
        var policyProvider = provider.GetRequiredService<IAuthorizationPolicyProvider>();

        var fallback = await policyProvider.GetFallbackPolicyAsync();

        fallback.Should().NotBeNull(
            "FallbackPolicy must be set so untagged controllers get challenged, not allowed anonymously");

        fallback!.Requirements
            .OfType<DenyAnonymousAuthorizationRequirement>()
            .Should().NotBeEmpty(
                "FallbackPolicy must include DenyAnonymousAuthorizationRequirement (RequireAuthenticatedUser)");
    }

    [Fact]
    public async Task FallbackPolicy_IsDistinctFromDefaultPolicy()
    {
        using var provider = (ServiceProvider)BuildProvider();
        var policyProvider = provider.GetRequiredService<IAuthorizationPolicyProvider>();

        var defaultPolicy = await policyProvider.GetDefaultPolicyAsync();
        var fallback = await policyProvider.GetFallbackPolicyAsync();

        defaultPolicy.Should().NotBeNull();
        fallback.Should().NotBeNull(
            "FallbackPolicy must be set explicitly — its absence is what produced the silent-anonymous default");
    }
}
