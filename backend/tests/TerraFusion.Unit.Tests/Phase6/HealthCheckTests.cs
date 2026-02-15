using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Services.Monitoring.HealthChecks;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase6;

[Trait("Phase", "6")]
[Trait("Component", "HealthChecks")]
[Trait("Category", "Monitoring")]
public sealed class HealthCheckTests
{
    #region DatabaseHealthCheck

    [Fact]
    public async Task DatabaseHealthCheck_ReturnsHealthy_WhenDbContextResolvable()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        // Register a mock scope factory — the health check resolves ITerraFusionDbContext from scope
        using var provider = services.BuildServiceProvider();
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        var check = new DatabaseHealthCheck(scopeFactory, NullLogger<DatabaseHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        // Without ITerraFusionDbContext registered, should be Degraded (not crash)
        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("not registered");
    }

    #endregion

    #region RedisHealthCheck

    [Fact]
    public async Task RedisHealthCheck_ReturnsDegraded_WhenNotConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var check = new RedisHealthCheck(config, NullLogger<RedisHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("not configured");
    }

    [Fact]
    public async Task RedisHealthCheck_ReturnsHealthy_WhenConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Redis"] = "localhost:6379"
            })
            .Build();

        var check = new RedisHealthCheck(config, NullLogger<RedisHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public async Task RedisHealthCheck_ReturnsDegraded_WhenFormatInvalid()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Redis"] = "just-a-hostname"
            })
            .Build();

        var check = new RedisHealthCheck(config, NullLogger<RedisHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("format");
    }

    #endregion

    #region ExternalApiHealthCheck

    [Fact]
    public async Task ExternalApiHealthCheck_ReturnsDegraded_WhenNoServicesConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var check = new ExternalApiHealthCheck(config, NullLogger<ExternalApiHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("Consciousness");
    }

    [Fact]
    public async Task ExternalApiHealthCheck_ReturnsHealthy_WhenAllConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Services:Consciousness:Url"] = "http://localhost:3004",
                ["Services:Gateway:Url"] = "http://localhost:3002"
            })
            .Build();

        var check = new ExternalApiHealthCheck(config, NullLogger<ExternalApiHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    #endregion

    #region ApplicationInsightsHealthCheck

    [Fact]
    public async Task AppInsightsHealthCheck_ReturnsDegraded_WhenNotConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var check = new ApplicationInsightsHealthCheck(config, NullLogger<ApplicationInsightsHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("not configured");
    }

    [Fact]
    public async Task AppInsightsHealthCheck_ReturnsHealthy_WhenValidConnectionString()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ApplicationInsights:ConnectionString"] = "InstrumentationKey=test-key-12345;IngestionEndpoint=https://westus2.in.ai.monitor.azure.com/"
            })
            .Build();

        var check = new ApplicationInsightsHealthCheck(config, NullLogger<ApplicationInsightsHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public async Task AppInsightsHealthCheck_ReturnsDegraded_WhenInvalidFormat()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ApplicationInsights:ConnectionString"] = "invalid-connection-string"
            })
            .Build();

        var check = new ApplicationInsightsHealthCheck(config, NullLogger<ApplicationInsightsHealthCheck>.Instance);
        var result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("format");
    }

    #endregion
}
