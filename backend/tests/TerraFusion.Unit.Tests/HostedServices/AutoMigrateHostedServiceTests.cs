using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.API.HostedServices;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.HostedServices;

/// <summary>
/// SYNC-INFRA-1: tests for <see cref="AutoMigrateHostedService"/>.
///
/// Strategy: we exercise the service through its real <see cref="IServiceScopeFactory"/>
/// boundary. Each test sets up a fresh DI container with a TerraFusionDbContext
/// (in-memory or a deliberately-broken context) and asserts on captured log
/// events from a custom <see cref="CapturingLogger{T}"/>.
/// </summary>
public sealed class AutoMigrateHostedServiceTests
{
    private static (AutoMigrateHostedService svc, CapturingLogger<AutoMigrateHostedService> logger)
        BuildWithInMemoryDbContext()
    {
        // InMemory provider does not support relational migrations — calling
        // GetPendingMigrationsAsync against it throws. The service must catch
        // this and log an error, not crash the host. We assert that contract.
        var services = new ServiceCollection();
        services.AddDbContext<TerraFusionDbContext>(o =>
            o.UseInMemoryDatabase($"automigrate-tests-{Guid.NewGuid():N}"));
        services.AddSingleton<IConfiguration>(
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "InMemory",
                })
                .Build());
        var provider = services.BuildServiceProvider();
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        var logger = new CapturingLogger<AutoMigrateHostedService>();
        var svc = new AutoMigrateHostedService(scopeFactory, logger);
        return (svc, logger);
    }

    [Fact]
    public async Task StartAsync_when_scope_factory_throws_logs_error_and_does_not_propagate()
    {
        // Arrange: a scope factory that throws when creating a scope simulates
        // a misconfigured DI graph or a transient resolution failure.
        var scopeFactory = new ThrowingScopeFactory(new InvalidOperationException("boom"));
        var logger = new CapturingLogger<AutoMigrateHostedService>();
        var svc = new AutoMigrateHostedService(scopeFactory, logger);

        // Act: must not throw.
        Func<Task> act = () => svc.StartAsync(CancellationToken.None);
        await act.Should().NotThrowAsync(
            because: "AutoMigrate must be non-fatal so the backend can boot");

        // Assert: error was logged with the original exception.
        logger.Entries.Should().ContainSingle(e =>
            e.Level == LogLevel.Error
            && e.Exception is InvalidOperationException
            && e.Message.Contains("AutoMigrate failed"));
    }

    [Fact]
    public async Task StartAsync_against_inmemory_provider_is_non_fatal_and_logs_error()
    {
        // Arrange: InMemory provider is non-relational; GetPendingMigrationsAsync
        // will throw. This proves the catch-block contract end-to-end through
        // a real ServiceProvider scope.
        var (svc, logger) = BuildWithInMemoryDbContext();

        // Act: must not throw.
        Func<Task> act = () => svc.StartAsync(CancellationToken.None);
        await act.Should().NotThrowAsync();

        // Assert: an error entry was recorded; informational completion was NOT.
        logger.Entries.Should().Contain(e =>
            e.Level == LogLevel.Error
            && e.Message.Contains("AutoMigrate failed"));
        logger.Entries.Should().NotContain(e => e.Message.Contains("AutoMigrate: complete"));
    }

    [Fact]
    public async Task StartAsync_respects_cancellation_without_throwing()
    {
        // Arrange: a cancelled token. The service should still not throw —
        // its catch block absorbs OperationCanceledException as a "DB out of
        // sync" condition the operator can fix and restart.
        var (svc, _) = BuildWithInMemoryDbContext();
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        // Act + Assert.
        Func<Task> act = () => svc.StartAsync(cts.Token);
        await act.Should().NotThrowAsync(
            because: "AutoMigrate must never crash the host, including on cancellation");
    }

    [Fact]
    public async Task StopAsync_completes_immediately_and_does_not_throw()
    {
        // Arrange: any service instance — StopAsync has no work to do.
        var scopeFactory = new ThrowingScopeFactory(new InvalidOperationException("never reached"));
        var logger = new CapturingLogger<AutoMigrateHostedService>();
        var svc = new AutoMigrateHostedService(scopeFactory, logger);

        // Act.
        var task = svc.StopAsync(CancellationToken.None);

        // Assert.
        task.IsCompletedSuccessfully.Should().BeTrue(
            because: "StopAsync is a no-op; it must return a completed task");
        await task; // sanity: does not throw.
        logger.Entries.Should().BeEmpty(
            because: "StopAsync should not log anything");
    }

    // ------------------------------------------------------------------------
    // Test doubles
    // ------------------------------------------------------------------------

    private sealed class ThrowingScopeFactory : IServiceScopeFactory
    {
        private readonly Exception _ex;
        public ThrowingScopeFactory(Exception ex) => _ex = ex;
        public IServiceScope CreateScope() => throw _ex;
    }

    private sealed class CapturingLogger<T> : ILogger<T>
    {
        public List<LogEntry> Entries { get; } = new();

        IDisposable? ILogger.BeginScope<TState>(TState state) => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add(new LogEntry(logLevel, formatter(state, exception), exception));
        }
    }

    private sealed record LogEntry(LogLevel Level, string Message, Exception? Exception);
}
