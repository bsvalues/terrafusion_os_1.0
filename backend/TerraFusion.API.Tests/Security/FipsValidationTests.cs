using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Security;
using TerraFusion.Core.Configuration;
using Xunit;

namespace TerraFusion.API.Tests.Security;

/// <summary>
/// Phase 4 Sprint 2: FIPS validation service tests
/// Verifies startup behavior under different FIPS configurations
/// </summary>
public class FipsValidationTests
{
    [Fact]
    public async Task FipsValidation_WhenDisabled_LogsWarningAndContinues()
    {
        // Arrange: FIPS enforcement OFF
        var flags = Options.Create(new FeatureFlagsOptions { EnforceFipsCompliance = false });
        var logger = new TestLogger<FipsValidationService>();
        var env = new TestHostEnvironment { EnvironmentName = "Development" };

        var service = new FipsValidationService(logger, flags, env);

        // Act — should NOT throw
        await service.StartAsync(CancellationToken.None);

        // Assert — should log warning about FIPS being disabled
        Assert.Contains(logger.Messages, m => m.Contains("FIPS 140-2 validation DISABLED"));
    }

    [Fact]
    public async Task FipsValidation_WhenEnabledInDev_LogsWarningButDoesNotThrow()
    {
        // Arrange: FIPS enforcement ON, but Development environment
        var flags = Options.Create(new FeatureFlagsOptions { EnforceFipsCompliance = true });
        var logger = new TestLogger<FipsValidationService>();
        var env = new TestHostEnvironment { EnvironmentName = "Development" };

        var service = new FipsValidationService(logger, flags, env);

        // Act — should NOT throw in Development (even if FIPS not detected)
        await service.StartAsync(CancellationToken.None);

        // Assert — logged something (either success or warning)
        Assert.NotEmpty(logger.Messages);
    }

    [Fact]
    public async Task FipsValidation_StopAsync_CompletesImmediately()
    {
        var flags = Options.Create(new FeatureFlagsOptions { EnforceFipsCompliance = false });
        var logger = new TestLogger<FipsValidationService>();
        var env = new TestHostEnvironment { EnvironmentName = "Development" };

        var service = new FipsValidationService(logger, flags, env);

        // StopAsync should complete without error
        await service.StopAsync(CancellationToken.None);
    }

    // === Test helpers ===

    private class TestLogger<T> : ILogger<T>
    {
        public List<string> Messages { get; } = new();

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
            Exception? exception, Func<TState, Exception?, string> formatter)
        {
            Messages.Add(formatter(state, exception));
        }
    }

    private class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "TerraFusion.API.Tests";
        public string ContentRootPath { get; set; } = "/tmp";
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
