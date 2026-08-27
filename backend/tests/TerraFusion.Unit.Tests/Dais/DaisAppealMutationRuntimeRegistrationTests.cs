using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Dais;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisAppealMutationRuntimeRegistrationTests
{
    [Fact]
    public async Task Disabled_RegistersFailClosedDecisionPortAndOptions()
    {
        var services = new ServiceCollection();
        services.AddDaisAppealMutationRuntime(Configuration(("Mode", "Disabled")), Environment("Development"));
        await using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<DaisAppealMutationOptions>>().Value.Mode
            .Should().Be(DaisAppealMutationMode.Disabled);
        var port = provider.GetRequiredService<IDaisAppealMutationDecisionPort>();
        var act = () => port.DecideCreateAsync(Request());
        await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
    }

    [Fact]
    public void LocalExact_IsRejectedOutsideDevelopment()
    {
        var services = new ServiceCollection();

        var act = () => services.AddDaisAppealMutationRuntime(
            Configuration(("Mode", "LocalExact")), Environment("Production"));

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*restricted to Development*");
    }

    [Fact]
    public async Task LocalExact_PublishedDevelopmentWithoutSovereignSlot_DegradesToUnavailable()
    {
        var root = Path.Combine(Path.GetTempPath(), "tf-dais-mutation-registration", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            var services = new ServiceCollection();
            services.AddDaisAppealMutationRuntime(
                Configuration(("Mode", "LocalExact")),
                Environment("Development", root));
            await using var provider = services.BuildServiceProvider();

            provider.GetRequiredService<IOptions<DaisAppealMutationOptions>>().Value.Mode
                .Should().Be(DaisAppealMutationMode.Disabled);
            var act = () => provider.GetRequiredService<IDaisAppealMutationDecisionPort>()
                .DecideCreateAsync(Request());
            await act.Should().ThrowAsync<DaisAppealMutationUnavailableException>();
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Theory]
    [InlineData("0")]
    [InlineData("31")]
    public void InvalidTimeout_IsRejected(string seconds)
    {
        var services = new ServiceCollection();
        var act = () => services.AddDaisAppealMutationRuntime(
            Configuration(("Mode", "Disabled"), ("TimeoutSeconds", seconds)),
            Environment("Development"));
        act.Should().Throw<InvalidOperationException>().WithMessage("*between 1 and 30*");
    }

    private static IConfiguration Configuration(params (string Key, string Value)[] pairs) =>
        new ConfigurationBuilder().AddInMemoryCollection(
            pairs.ToDictionary(
                pair => $"{DaisAppealMutationOptions.SectionName}:{pair.Key}",
                pair => (string?)pair.Value)).Build();

    private static IHostEnvironment Environment(string name, string? root = null) =>
        new TestEnvironment
        {
            EnvironmentName = name,
            ApplicationName = "TerraFusion.Unit.Tests",
            ContentRootPath = root ?? Path.GetFullPath("."),
            ContentRootFileProvider = new NullFileProvider(),
        };

    private static DaisAppealCreateDecisionRequest Request() => new()
    {
        SchemaVersion = "1.0.0",
        Operation = DaisAppealMutationOperation.create,
        CommandId = "11111111-1111-1111-1111-111111111111",
        CountyId = "22222222-2222-2222-2222-222222222222",
        EffectiveAt = DateTimeOffset.UtcNow,
        Command = new DaisAppealCreateDecisionCommand(),
    };

    private sealed class TestEnvironment : IHostEnvironment
    {
        public required string EnvironmentName { get; set; }
        public required string ApplicationName { get; set; }
        public required string ContentRootPath { get; set; }
        public required IFileProvider ContentRootFileProvider { get; set; }
    }
}
