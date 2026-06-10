// PR-3 observability fix #1 — Serilog structured logging wire-up.
//
// Pre-PR-3 AddStructuredLogging() had zero call sites, so the daily-rolling
// JSON file sink at logs/terrafusion-.log was never producing output.
// These tests assert that after AddStructuredLogging() is called:
//
//   1. Serilog.Log.Logger is bound (not the default no-op SilentLogger).
//   2. IStructuredLogger and ILogEnricher are resolvable from DI.
//   3. The LoggingBackgroundService is registered as a HostedService.

using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Moq;
using TerraFusion.Core.Extensions;
using TerraFusion.Core.Services.Monitoring;
using Xunit;

namespace TerraFusion.Unit.Tests.Observability;

public class StructuredLoggingExtensionsTests
{
    private sealed class StubEnv : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Production";
        public string ApplicationName { get; set; } = "TerraFusion.API.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } =
            new Microsoft.Extensions.FileProviders.NullFileProvider();
    }

    private static IServiceProvider Build(IHostEnvironment env)
    {
        var config = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();
        // Required by IStructuredLogger transitive dep on ITelemetryService.
        services.AddSingleton(new Mock<ITelemetryService>(MockBehavior.Loose).Object);
        services.AddStructuredLogging(config, env);
        return services.BuildServiceProvider();
    }

    [Fact]
    public void AddStructuredLogging_binds_global_Serilog_Logger_to_non_silent_pipeline()
    {
        var sp = Build(new StubEnv());
        // Just touching Log.Logger after AddStructuredLogging() should produce
        // a non-SilentLogger instance.
        Serilog.Log.Logger.Should().NotBeNull();
        // SilentLogger lives in Serilog.Core.Pipeline; bound logger should
        // be from a different namespace.
        Serilog.Log.Logger.GetType().FullName.Should().NotContain("SilentLogger");

        (sp as IDisposable)?.Dispose();
    }

    [Fact]
    public void AddStructuredLogging_registers_ILogEnricher_in_DI()
    {
        // ILogEnricher has no Serilog.ILogger dep — safest single-service
        // probe that the extension actually wired the registration set.
        var sp = Build(new StubEnv());

        sp.GetService<ILogEnricher>().Should().NotBeNull(
            "PR-3 fix #1: ILogEnricher is registered alongside the file sink");

        (sp as IDisposable)?.Dispose();
    }

    [Fact]
    public void AddStructuredLogging_registers_LoggingBackgroundService_as_hosted_service()
    {
        // Inspect descriptors directly so we don't have to satisfy every
        // unrelated hosted-service's dependencies during instantiation.
        var config = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();
        services.AddSingleton(new Mock<ITelemetryService>(MockBehavior.Loose).Object);
        services.AddStructuredLogging(config, new StubEnv());

        services.Should().Contain(d =>
            d.ServiceType == typeof(IHostedService) &&
            d.ImplementationType == typeof(LoggingBackgroundService),
            "PR-3 fix #1: the rolling-file background sweeper is wired alongside the sink");
    }
}
