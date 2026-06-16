using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Services;

public sealed class DatabaseInitializationServiceNoMutationTests
{
    [Fact]
    public async Task InitializeAsync_when_skip_auto_migrate_true_does_not_create_a_database_scope()
    {
        var scopeFactory = new ThrowingScopeFactory(new InvalidOperationException("database mutation attempted"));
        var logger = new CapturingLogger<DatabaseInitializationService>();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TF_SKIP_AUTO_MIGRATE"] = "true",
            })
            .Build();

        var service = new DatabaseInitializationService(scopeFactory, logger, configuration);

        Func<Task> act = () => service.InitializeAsync();

        await act.Should().NotThrowAsync("production release lanes must be able to boot without startup DB mutation");
        logger.Entries.Should().Contain(e =>
            e.Level == LogLevel.Information
            && e.Message.Contains("TF_SKIP_AUTO_MIGRATE=true"));
        logger.Entries.Should().NotContain(e =>
            e.Level >= LogLevel.Warning,
            "the skip path must not touch the database scope or report initialization failure");
    }

    private sealed class ThrowingScopeFactory : IServiceScopeFactory
    {
        private readonly Exception _exception;

        public ThrowingScopeFactory(Exception exception) => _exception = exception;

        public IServiceScope CreateScope() => throw _exception;
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
