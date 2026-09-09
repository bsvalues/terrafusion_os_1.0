using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.HostedServices;

public sealed class EliteEndpointValidationServiceTests
{
    [Theory]
    [InlineData("false")]
    [InlineData("FALSE")]
    public async Task ExplicitFalse_CompletesBeforeDiagnosticStartup(string value)
    {
        // Catches an ignored or case-sensitive opt-out, and cancellation checked before opt-out.
        var observation = await ObserveStartAsync(ConfigurationWith(value));

        AssertDisabled(observation);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("true")]
    public async Task MissingSettingOrTrue_PreservesEnabledStartupCancellation(string? value)
    {
        // Catches changing the default to disabled or swallowing the original startup cancellation.
        var observation = await ObserveStartAsync(ConfigurationWith(value));

        AssertEnabledCancellation(observation);
    }

    [Theory]
    [InlineData("")]
    [InlineData("WAL007B_PRIVATE_INVALID_VALUE")]
    public async Task InvalidSetting_FaultsWithFixedCodeBeforeDiagnosticStartup(string value)
    {
        // Catches treating malformed input as a default/disabled success or leaking the value.
        var observation = await ObserveStartAsync(ConfigurationWith(value));

        var failure = Assert.IsType<InvalidOperationException>(observation.StartFailure);
        Assert.Equal("ENDPOINT_VALIDATION_INVALID_ENABLED", failure.Message);
        Assert.NotNull(observation.Execution);
        Assert.Equal(TaskStatus.Faulted, observation.Execution.Status);
        Assert.NotNull(observation.Execution.Exception);
        Assert.Same(failure, Assert.Single(observation.Execution.Exception.InnerExceptions));
        Assert.Empty(observation.StartLogs);
        Assert.Null(observation.StopFailure);
    }

    [Fact]
    public async Task MissingConfigurationService_PreservesConstructorAndEnabledDefault()
    {
        // Catches requiring a new constructor dependency or treating absent IConfiguration as false.
        var observation = await ObserveStartAsync(configuration: null);

        AssertEnabledCancellation(observation);
    }

    [Fact]
    public async Task LastConfigurationProviderFalse_DisablesInsteadOfUsingEarlierTrue()
    {
        // Catches bypassing the effective IConfiguration value for a default or an earlier provider.
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EndpointValidation:Enabled"] = "true",
            })
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EndpointValidation:Enabled"] = "false",
            })
            .Build();

        var observation = await ObserveStartAsync(configuration);

        AssertDisabled(observation);
    }

    [Fact]
    public void MissingPortConfiguration_UsesDefaultPrimaryApiUrl()
    {
        Assert.Equal("http://localhost:5046",
            EliteEndpointValidationService.ResolveConfiguredApiUrl(null));
    }

    [Fact]
    public void MissingRootPortKey_UsesDefaultInsteadOfNestedSetting()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EndpointValidation:TF_API_PORT"] = "12345",
            })
            .Build();
        using var disposable = (IDisposable)configuration;

        Assert.Equal("http://localhost:5046",
            EliteEndpointValidationService.ResolveConfiguredApiUrl(configuration));
    }

    [Theory]
    [InlineData("12345", "http://localhost:12345")]
    [InlineData("1", "http://localhost:1")]
    [InlineData("65535", "http://localhost:65535")]
    public void ConfiguredPort_UsesEffectiveRootValueWithinInclusiveBounds(string value, string expected)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["TF_API_PORT"] = "5046" })
            .AddInMemoryCollection(new Dictionary<string, string?> { ["TF_API_PORT"] = value })
            .Build();
        using var disposable = (IDisposable)configuration;

        Assert.Equal(expected, EliteEndpointValidationService.ResolveConfiguredApiUrl(configuration));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" \t")]
    [InlineData("WAL007B_PRIVATE_INVALID_PORT")]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("65536")]
    public void InvalidExplicitPort_ThrowsFixedCodeInsteadOfFallingBack(string value)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["TF_API_PORT"] = "5046" })
            .AddInMemoryCollection(new Dictionary<string, string?> { ["TF_API_PORT"] = value })
            .Build();
        using var disposable = (IDisposable)configuration;

        var failure = Assert.Throws<InvalidOperationException>(
            () => EliteEndpointValidationService.ResolveConfiguredApiUrl(configuration));

        Assert.Equal("ENDPOINT_VALIDATION_INVALID_PORT", failure.Message);
        Assert.Null(failure.InnerException);
    }

    private static IConfiguration ConfigurationWith(string? value)
    {
        var values = new Dictionary<string, string?>();
        if (value is not null)
            values.Add("EndpointValidation:Enabled", value);
        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }

    private static void AssertDisabled(StartObservation observation)
    {
        Assert.Null(observation.StartFailure);
        Assert.NotNull(observation.Execution);
        Assert.Equal(TaskStatus.RanToCompletion, observation.Execution.Status);
        Assert.True(observation.Execution.IsCompletedSuccessfully);
        Assert.Empty(observation.StartLogs);
        Assert.Null(observation.StopFailure);
    }

    private static void AssertEnabledCancellation(StartObservation observation)
    {
        Assert.IsAssignableFrom<OperationCanceledException>(observation.StartFailure);
        Assert.NotNull(observation.Execution);
        Assert.Equal(TaskStatus.Canceled, observation.Execution.Status);
        var entry = Assert.Single(observation.StartLogs);
        Assert.Equal(LogLevel.Information, entry.Level);
        Assert.Equal("Endpoint Validation Service started.", entry.Message);
        Assert.Null(entry.Exception);
        Assert.Null(observation.StopFailure);
    }

    private static async Task<StartObservation> ObserveStartAsync(IConfiguration? configuration)
    {
        var services = new ServiceCollection();
        if (configuration is not null)
            services.AddSingleton<IConfiguration>(configuration);
        using var provider = services.BuildServiceProvider();
        var logger = new CapturingLogger();
        // Exercise the existing production constructor and public lifecycle, not a substitute host.
        using var service = new EliteEndpointValidationService(logger, provider);
        var alreadyCancelled = new CancellationToken(canceled: true);
        Assert.True(alreadyCancelled.IsCancellationRequested);

        Exception? startFailure = null;
        Exception? stopFailure = null;
        Task? execution = null;
        LogEntry[] startLogs = [];
        try
        {
            // The sole StartAsync site ALWAYS receives an already-cancelled token.
            // The original initial delay cannot advance to HTTP or netstat during RED.
            startFailure = await Record.ExceptionAsync(() => service.StartAsync(alreadyCancelled));
            execution = service.ExecuteTask;
            startLogs = logger.Entries.ToArray();
        }
        finally
        {
            // Preserve the start outcome separately; cleanup errors cannot replace it.
            // Existing StopAsync disposes its HttpClient and observes the terminal execution task.
            stopFailure = await Record.ExceptionAsync(() => service.StopAsync(CancellationToken.None));
        }

        return new StartObservation(startFailure, execution, startLogs, stopFailure);
    }

    private sealed record StartObservation(
        Exception? StartFailure, Task? Execution, LogEntry[] StartLogs, Exception? StopFailure);

    private sealed record LogEntry(LogLevel Level, string Message, Exception? Exception);

    private sealed class CapturingLogger : ILogger<EliteEndpointValidationService>
    {
        public List<LogEntry> Entries { get; } = new();

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add(new LogEntry(logLevel, formatter(state, exception), exception));
        }
    }
}

