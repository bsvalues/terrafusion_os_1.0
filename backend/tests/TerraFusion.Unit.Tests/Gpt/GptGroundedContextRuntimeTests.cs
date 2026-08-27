using System.Diagnostics;
using System.Reflection;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Gpt;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedContextRuntimeTests
{
    [Fact]
    public void DisabledSelectionRegistersNoRuntimeHostOrConsumer()
    {
        var services = new ServiceCollection();
        var configuration = Configuration("Disabled");

        services.AddGptGroundedContextRuntime(
            configuration,
            new TestHostEnvironment("Development", Path.GetTempPath()));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<GptGroundedContextRuntimeOptions>>()
            .Value.Mode.Should().Be(GptGroundedContextRuntimeMode.Disabled);
        provider.GetService<IGptGroundedContextProcessHost>().Should().BeNull();
        provider.GetService<IGptGroundedContextConsumer>().Should().BeNull();
    }

    [Fact]
    public void ProductionRefusesLocalExactBeforeArtifactResolution()
    {
        var services = new ServiceCollection();

        var action = () => services.AddGptGroundedContextRuntime(
            Configuration("LocalExact"),
            new TestHostEnvironment("Production", Path.GetTempPath()));

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*restricted to the Development environment*");
    }

    [Fact]
    public void PublishedDevelopmentHostWithoutSourceMarkersDowngradesToDisabled()
    {
        var services = new ServiceCollection();
        var contentRoot = Path.Combine(
            Path.GetTempPath(),
            "tf-gpt-published-host",
            Guid.NewGuid().ToString("N"));

        services.AddGptGroundedContextRuntime(
            Configuration("LocalExact"),
            new TestHostEnvironment("Development", contentRoot));
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IOptions<GptGroundedContextRuntimeOptions>>()
            .Value.Mode.Should().Be(GptGroundedContextRuntimeMode.Disabled);
        provider.GetService<IGptGroundedContextProcessHost>().Should().BeNull();
    }

    [Theory]
    [InlineData("0")]
    [InlineData("31")]
    public void InvalidTimeoutFailsClosedEvenWhenDisabled(string timeout)
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                [$"{GptGroundedContextRuntimeOptions.SectionName}:Mode"] = "Disabled",
                [$"{GptGroundedContextRuntimeOptions.SectionName}:TimeoutSeconds"] = timeout,
            }).Build();

        var action = () => services.AddGptGroundedContextRuntime(
            configuration,
            new TestHostEnvironment("Development", Path.GetTempPath()));

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*timeout must be between 1 and 30 seconds*");
    }

    [Fact]
    public async Task ExactProtectedArtifactExecutesWhenProofEnvironmentIsConfigured()
    {
        var root = ResolveProofRoot();
        if (root is null) return;

        var host = new GptGroundedContextProcessHost(
            Path.GetFullPath(root),
            FindNodeExecutable(),
            TimeSpan.FromSeconds(30));
        const string exchange = """
            {
              "request": {
                "schemaVersion": "1.0.0",
                "countyId": "42",
                "datasetKey": "rag-dataset:7",
                "queryText": "How is this classified?",
                "topK": 2,
                "scoreThreshold": 0.7,
                "traceId": "trace-runtime-proof"
              },
              "result": {
                "schemaVersion": "1.0.0",
                "countyId": "42",
                "datasetKey": "rag-dataset:7",
                "status": "NO_RELEVANT_CONTEXT",
                "citations": [],
                "traceId": "trace-runtime-proof"
              }
            }
            """;

        var result = await host.ValidateAsync(exchange);

        result.Succeeded.Should().BeTrue();
        result.Accepted.Should().BeTrue();
        result.Violations.Should().BeEmpty();
        result.SourceModuleSha256.Should()
            .Be(GptGroundedContextRuntimeOptions.ExpectedModuleSha256);
        result.CopiedModuleSha256.Should()
            .Be(GptGroundedContextRuntimeOptions.ExpectedModuleSha256);
        result.SourceSchemaSha256.Should()
            .Be(GptGroundedContextRuntimeOptions.ExpectedSchemaSha256);
        result.CopiedSchemaSha256.Should()
            .Be(GptGroundedContextRuntimeOptions.ExpectedSchemaSha256);
    }

    [Fact]
    public async Task PersistentDevelopmentSelectionStartsRestartsRollsBackAndRestores()
    {
        var root = ResolveProofRoot();
        if (root is null) return;
        var configuration = new ConfigurationBuilder()
            .SetBasePath(root)
            .AddJsonFile("backend/src/TerraFusion.API/appsettings.json", optional: false)
            .AddJsonFile("backend/src/TerraFusion.API/appsettings.Development.json", optional: false)
            .Build();

        for (var start = 0; start < 2; start++)
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddGptGroundedContextRuntime(
                configuration,
                new TestHostEnvironment("Development", root));
            using var provider = services.BuildServiceProvider();
            provider.GetRequiredService<IOptions<GptGroundedContextRuntimeOptions>>()
                .Value.Mode.Should().Be(GptGroundedContextRuntimeMode.LocalExact);
            var host = provider.GetRequiredService<IGptGroundedContextProcessHost>();
            var result = await host.ValidateAsync(ValidExchange);
            result.Succeeded.Should().BeTrue();
            result.Accepted.Should().BeTrue();
        }

        var disabledConfiguration = new ConfigurationBuilder()
            .AddConfiguration(configuration)
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{GptGroundedContextRuntimeOptions.SectionName}:Mode"] = "Disabled",
            })
            .Build();
        var disabledServices = new ServiceCollection();
        disabledServices.AddLogging();
        disabledServices.AddGptGroundedContextRuntime(
            disabledConfiguration,
            new TestHostEnvironment("Development", root));
        using (var disabledProvider = disabledServices.BuildServiceProvider())
        {
            disabledProvider.GetRequiredService<IOptions<GptGroundedContextRuntimeOptions>>()
                .Value.Mode.Should().Be(GptGroundedContextRuntimeMode.Disabled);
            disabledProvider.GetService<IGptGroundedContextProcessHost>().Should().BeNull();
        }

        var restoredServices = new ServiceCollection();
        restoredServices.AddLogging();
        restoredServices.AddGptGroundedContextRuntime(
            configuration,
            new TestHostEnvironment("Development", root));
        using var restoredProvider = restoredServices.BuildServiceProvider();
        restoredProvider.GetRequiredService<IGptGroundedContextProcessHost>()
            .Should().NotBeNull();
    }

    [Theory]
    [InlineData("module")]
    [InlineData("schema")]
    [InlineData("manifest")]
    public void ExactRuntimeRefusesEveryStagedArtifactTamper(string target)
    {
        var root = ResolveProofRoot();
        if (root is null) return;
        using var scope = new TamperedArtifactScope(Path.GetFullPath(root), target);

        var action = () => new GptGroundedContextProcessHost(
            scope.Root,
            FindNodeExecutable(),
            TimeSpan.FromSeconds(30));

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*identity*");
    }

    [Fact]
    public async Task PostMeasurementArtifactMutationFailsClosedWithoutDisclosingPath()
    {
        var sourceRoot = ResolveProofRoot();
        if (sourceRoot is null) return;
        using var scope = new ExactArtifactScope(sourceRoot);
        var modulePath = Path.Combine(
            scope.Slot,
            GptGroundedContextRuntimeOptions.ExpectedModuleFilename);
        var host = new GptGroundedContextProcessHost(
            scope.Root,
            FindNodeExecutable(),
            TimeSpan.FromSeconds(30),
            beforeProcessStart: () => File.AppendAllText(modulePath, " "));

        var result = await host.ValidateAsync(ValidExchange);

        result.Succeeded.Should().BeFalse();
        result.Failure.Should().Be("Canonical GPT runtime is unavailable.");
        result.Failure.Should().NotContain(scope.Root);
    }

    [Fact]
    public async Task ProcessStartFailureIsStableAndDoesNotDiscloseDiagnostics()
    {
        var sourceRoot = ResolveProofRoot();
        if (sourceRoot is null) return;
        var host = new GptGroundedContextProcessHost(
            sourceRoot,
            FindNodeExecutable(),
            TimeSpan.FromSeconds(30),
            beforeProcessStart: () => throw new System.ComponentModel.Win32Exception(
                5,
                @"sensitive C:\private\node.exe diagnostic"));

        var result = await host.ValidateAsync(ValidExchange);

        result.Succeeded.Should().BeFalse();
        result.Failure.Should().Be("Canonical GPT runtime is unavailable.");
        result.Failure.Should().NotContain("private");
    }

    [Fact]
    public async Task ConcurrentInvocationLimitFailsAdditionalWorkClosed()
    {
        var sourceRoot = ResolveProofRoot();
        if (sourceRoot is null) return;
        using var release = new ManualResetEventSlim(false);
        var entered = 0;
        var host = new GptGroundedContextProcessHost(
            sourceRoot,
            FindNodeExecutable(),
            TimeSpan.FromSeconds(30),
            beforeProcessStart: () =>
            {
                Interlocked.Increment(ref entered);
                release.Wait(TimeSpan.FromSeconds(10));
            });
        var occupying = Enumerable.Range(0, GptGroundedContextProcessHost.MaximumConcurrentInvocations)
            .Select(_ => Task.Run(() => host.ValidateAsync(ValidExchange)))
            .ToArray();
        SpinWait.SpinUntil(
                () => Volatile.Read(ref entered)
                    == GptGroundedContextProcessHost.MaximumConcurrentInvocations,
                TimeSpan.FromSeconds(10))
            .Should().BeTrue();

        var overflow = await host.ValidateAsync(ValidExchange);
        release.Set();
        await Task.WhenAll(occupying);

        overflow.Succeeded.Should().BeFalse();
        overflow.Failure.Should().Be("Canonical GPT runtime capacity is unavailable.");
    }

    [Fact]
    public async Task BoundedReaderStopsBeforeRetainingOversizedOutput()
    {
        var method = typeof(GptGroundedContextProcessHost).GetMethod(
            "ReadBoundedAsync",
            BindingFlags.NonPublic | BindingFlags.Static);
        method.Should().NotBeNull();
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(new string('x', 4097)));
        using var reader = new StreamReader(stream, Encoding.UTF8);
        using var process = new Process();
        var task = (Task<string>)method!.Invoke(
            null,
            [reader, 4096, process, CancellationToken.None])!;

        var action = async () => await task;

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*bounded channel*");
    }

    private static IConfigurationRoot Configuration(string mode) =>
        new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                [$"{GptGroundedContextRuntimeOptions.SectionName}:Mode"] = mode,
                [$"{GptGroundedContextRuntimeOptions.SectionName}:TimeoutSeconds"] = "30",
            }).Build();

    private static string? ResolveProofRoot()
    {
        var root = Environment.GetEnvironmentVariable("TERRAFUSION_GPT_RUNTIME_PROOF_ROOT");
        if (string.IsNullOrWhiteSpace(root))
        {
            if (string.Equals(
                    Environment.GetEnvironmentVariable("TERRAFUSION_GPT_RUNTIME_PROOF_REQUIRED"),
                    "1",
                    StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "The required GPT runtime proof root was not configured.");
            }
            return null;
        }
        return Path.GetFullPath(root);
    }

    private const string ValidExchange = """
        {
          "request": {
            "schemaVersion": "1.0.0",
            "countyId": "42",
            "datasetKey": "rag-dataset:7",
            "queryText": "How is this classified?",
            "topK": 2,
            "scoreThreshold": 0.7,
            "traceId": "trace-runtime-proof"
          },
          "result": {
            "schemaVersion": "1.0.0",
            "countyId": "42",
            "datasetKey": "rag-dataset:7",
            "status": "NO_RELEVANT_CONTEXT",
            "citations": [],
            "traceId": "trace-runtime-proof"
          }
        }
        """;

    private static string FindNodeExecutable()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("-p");
        startInfo.ArgumentList.Add("process.execPath");
        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Unable to start Node path probe.");
        var output = process.StandardOutput.ReadToEnd().Trim();
        process.WaitForExit();
        if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
        {
            throw new InvalidOperationException("Unable to resolve Node.");
        }
        return Path.GetFullPath(output);
    }

    private sealed class TestHostEnvironment(
        string environmentName,
        string contentRootPath) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "TerraFusion.API.Tests";
        public string ContentRootPath { get; set; } = contentRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class TamperedArtifactScope : IDisposable
    {
        public TamperedArtifactScope(string sourceRoot, string target)
        {
            Root = Path.Combine(
                Path.GetTempPath(),
                "tf-gpt-runtime-tamper",
                Guid.NewGuid().ToString("N"));
            var sourceSlot = Path.Combine(
                sourceRoot,
                GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace(
                    '/',
                    Path.DirectorySeparatorChar));
            var slot = Path.Combine(
                Root,
                GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace(
                    '/',
                    Path.DirectorySeparatorChar));
            Directory.CreateDirectory(slot);
            File.Copy(
                Path.Combine(sourceSlot, GptGroundedContextRuntimeOptions.ExpectedModuleFilename),
                Path.Combine(slot, GptGroundedContextRuntimeOptions.ExpectedModuleFilename));
            File.Copy(
                Path.Combine(sourceSlot, GptGroundedContextRuntimeOptions.ExpectedSchemaFilename),
                Path.Combine(slot, GptGroundedContextRuntimeOptions.ExpectedSchemaFilename));
            File.Copy(Path.Combine(sourceSlot, "manifest.json"), Path.Combine(slot, "manifest.json"));
            var targetPath = target switch
            {
                "module" => Path.Combine(
                    slot,
                    GptGroundedContextRuntimeOptions.ExpectedModuleFilename),
                "schema" => Path.Combine(
                    slot,
                    GptGroundedContextRuntimeOptions.ExpectedSchemaFilename),
                "manifest" => Path.Combine(slot, "manifest.json"),
                _ => throw new ArgumentOutOfRangeException(nameof(target)),
            };
            File.AppendAllText(targetPath, " ");
        }

        public string Root { get; }

        public void Dispose()
        {
            if (Directory.Exists(Root)) Directory.Delete(Root, recursive: true);
        }
    }

    private sealed class ExactArtifactScope : IDisposable
    {
        public ExactArtifactScope(string sourceRoot)
        {
            Root = Path.Combine(
                Path.GetTempPath(),
                "tf-gpt-runtime-exact",
                Guid.NewGuid().ToString("N"));
            var sourceSlot = Path.Combine(
                sourceRoot,
                GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace(
                    '/',
                    Path.DirectorySeparatorChar));
            Slot = Path.Combine(
                Root,
                GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace(
                    '/',
                    Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Slot);
            foreach (var filename in new[]
                     {
                         GptGroundedContextRuntimeOptions.ExpectedModuleFilename,
                         GptGroundedContextRuntimeOptions.ExpectedSchemaFilename,
                         "manifest.json",
                     })
            {
                File.Copy(Path.Combine(sourceSlot, filename), Path.Combine(Slot, filename));
            }
        }

        public string Root { get; }
        public string Slot { get; }

        public void Dispose()
        {
            if (Directory.Exists(Root)) Directory.Delete(Root, recursive: true);
        }
    }
}
