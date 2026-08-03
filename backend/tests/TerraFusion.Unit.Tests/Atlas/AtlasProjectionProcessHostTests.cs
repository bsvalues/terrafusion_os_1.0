using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using TerraFusion.API.Services.Atlas;
using Xunit;

namespace TerraFusion.Unit.Tests.Atlas;

public sealed class ExactAtlasProjectionHostFactAttribute : FactAttribute
{
    public ExactAtlasProjectionHostFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_ATLAS_HOST_MODULE_PATH")))
        {
            Skip = "Exact Atlas host proof requires TERRAFUSION_ATLAS_HOST_MODULE_PATH.";
        }
    }
}

public sealed class AtlasProjectionProcessHostTests
{
    private const string ExpectedModuleSha256 =
        "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46";
    private const string CountyId = "11111111-2222-3333-4444-555555555555";
    private const string ParcelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    [ExactAtlasProjectionHostFact]
    public async Task ExactModule_ProjectsPolygonWithExactProvenanceAndIdentity()
    {
        using var scope = new TestScope();
        var result = await scope.Host.ProjectAsync(
            RequireExactModule(),
            ExpectedModuleSha256,
            PolygonExchange());

        result.Success.Should().BeTrue();
        result.Outcome.Should().Be(AtlasProjectionOutcome.Polygon);
        result.SourceModuleSha256.Should().Be(ExpectedModuleSha256);
        result.CopiedModuleSha256.Should().Be(ExpectedModuleSha256);
        result.CountyId.Should().Be(CountyId);
        result.ParcelId.Should().Be(ParcelId);
        result.NormalizedFeatureJson.Should().Be(
            "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[-119.2,46.2],[-119.1,46.2],[-119.1,46.3],[-119.2,46.2]]]},\"properties\":{\"countyId\":\"11111111-2222-3333-4444-555555555555\",\"parcelId\":\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\",\"evidenceState\":\"canonical\"}}");
        scope.AssertClean();
    }

    [ExactAtlasProjectionHostFact]
    public async Task ExactModule_ProjectsPointAndNormalizesRepeatedOutput()
    {
        using var scope = new TestScope();
        var first = await scope.Host.ProjectAsync(
            RequireExactModule(), ExpectedModuleSha256, PointExchange());
        var second = await scope.Host.ProjectAsync(
            RequireExactModule(), ExpectedModuleSha256, PointExchange());

        first.Outcome.Should().Be(AtlasProjectionOutcome.Point);
        first.NormalizedFeatureJson.Should().Be(second.NormalizedFeatureJson);
        first.CountyId.Should().Be(CountyId);
        first.ParcelId.Should().Be(ParcelId);
        scope.AssertClean();
    }

    [ExactAtlasProjectionHostFact]
    public async Task ExactModule_ProjectsUnavailableAsJsonNull()
    {
        using var scope = new TestScope();
        var result = await scope.Host.ProjectAsync(
            RequireExactModule(), ExpectedModuleSha256, UnavailableExchange());

        result.Outcome.Should().Be(AtlasProjectionOutcome.Unavailable);
        result.NormalizedFeatureJson.Should().Be("null");
        scope.AssertClean();
    }

    [Fact]
    public async Task MissingModule_FailsClosed()
    {
        using var scope = new TestScope();
        var result = await scope.Host.ProjectAsync(
            Path.Combine(scope.Root, "missing.mjs"), new string('0', 64), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.ModuleNotFound);
        scope.AssertClean();
    }

    [Fact]
    public async Task RelativeAndNonCanonicalPaths_FailClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ReturnPolygonModule());
        var hash = Hash(module);

        (await scope.Host.ProjectAsync("module.mjs", hash, PolygonExchange()))
            .Failure.Should().Be(AtlasProjectionFailure.InvalidModulePath);
        var nonCanonical = Path.Combine(scope.Root, "child", "..", Path.GetFileName(module));
        (await scope.Host.ProjectAsync(nonCanonical, hash, PolygonExchange()))
            .Failure.Should().Be(AtlasProjectionFailure.InvalidModulePath);
        scope.AssertClean();
    }

    [Fact]
    public async Task SourceHashMismatch_FailsBeforeCopyExecution()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ReturnPolygonModule());
        var result = await scope.Host.ProjectAsync(module, new string('0', 64), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.SourceHashMismatch);
        scope.AssertClean();
    }

    [Fact]
    public async Task CopiedModuleHashMismatch_FailsBeforeProcessCreation()
    {
        using var scope = new TestScope(
            afterCopy: (path, _) => File.AppendAllTextAsync(path, "\n// tampered\n"));
        var module = scope.CreateModule(ReturnPolygonModule());
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.CopiedModuleHashMismatch);
        scope.AssertClean();
    }

    [Fact]
    public async Task MalformedExchange_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ReturnPolygonModule());
        var result = await scope.Host.ProjectAsync(module, Hash(module), "{not-json");

        result.Failure.Should().Be(AtlasProjectionFailure.InvalidExchange);
        scope.AssertClean();
    }

    [Fact]
    public async Task OversizedInput_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ReturnPolygonModule());
        var oversized = "{\"result\":{\"countyId\":\"" + CountyId +
            "\",\"parcelId\":\"" + ParcelId +
            "\",\"evidenceState\":\"" + new string('x', AtlasProjectionProcessHost.MaximumInputBytes) +
            "\"}}";

        var result = await scope.Host.ProjectAsync(module, Hash(module), oversized);

        result.Failure.Should().Be(AtlasProjectionFailure.InputTooLarge);
        scope.AssertClean();
    }

    [Theory]
    [MemberData(nameof(InvalidOutputCases))]
    public async Task InvalidOutput_FailsClosed(string moduleSource, AtlasProjectionFailure failure)
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(moduleSource);
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(failure);
        scope.AssertClean();
    }

    public static IEnumerable<object[]> InvalidOutputCases()
    {
        yield return [
            "process.stdout.write('not-json'); export function projectAtlasFeature(){return null;}",
            AtlasProjectionFailure.InvalidOutput,
        ];
        yield return [
            "process.stdout.write('{}'); export function projectAtlasFeature(){return null;}",
            AtlasProjectionFailure.InvalidOutput,
        ];
        yield return [
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Point',coordinates:[1,2]},properties:{countyId:'" + CountyId + "',parcelId:'" + ParcelId + "',evidenceState:'canonical'},extra:true};}",
            AtlasProjectionFailure.InvalidOutput,
        ];
        yield return [
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Point',coordinates:[1,2]},properties:{countyId:'" + CountyId + "',parcelId:'" + ParcelId + "',evidenceState:'canonical',provider:'x'}};}",
            AtlasProjectionFailure.InvalidOutput,
        ];
        yield return [
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Point',coordinates:[1,2]},properties:{countyId:'wrong',parcelId:'" + ParcelId + "',evidenceState:'canonical'}};}",
            AtlasProjectionFailure.IdentityMismatch,
        ];
        yield return [
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Point',coordinates:[1,2]},properties:{countyId:'" + CountyId + "',parcelId:'wrong',evidenceState:'canonical'}};}",
            AtlasProjectionFailure.IdentityMismatch,
        ];
        yield return [
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Polygon',coordinates:[[[1,2],[3,4],[5,6],[7,8]]]},properties:{countyId:'" + CountyId + "',parcelId:'" + ParcelId + "',evidenceState:'canonical'}};}",
            AtlasProjectionFailure.InvalidGeometry,
        ];
        yield return [
            "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Point',coordinates:[181,91]},properties:{countyId:'" + CountyId + "',parcelId:'" + ParcelId + "',evidenceState:'canonical'}};}",
            AtlasProjectionFailure.InvalidGeometry,
        ];
    }

    [Theory]
    [InlineData("export function projectAtlasFeature(){return null;}")]
    [InlineData("export function projectAtlasFeature(e){return {type:'Feature',geometry:{type:'Point',coordinates:[-119.2,46.2]},properties:{countyId:e.result.countyId,parcelId:e.result.parcelId,evidenceState:e.result.evidenceState}};}")]
    public async Task OutputGeometryStateMismatch_FailsClosed(string moduleSource)
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(moduleSource);
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.InvalidOutput);
        scope.AssertClean();
    }

    [Fact]
    public async Task UnknownExchangeGeometryState_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ReturnPolygonModule());
        var exchange = PolygonExchange().Replace(
            "\"available\"",
            "\"ambiguous\"",
            StringComparison.Ordinal);
        var result = await scope.Host.ProjectAsync(module, Hash(module), exchange);

        result.Failure.Should().Be(AtlasProjectionFailure.InvalidExchange);
        scope.AssertClean();
    }

    [Fact]
    public async Task NonzeroExit_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule("export function projectAtlasFeature(){process.exit(7);}");
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.NonZeroExit);
        scope.AssertClean();
    }

    [Fact]
    public async Task NetworkAttempt_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(
            "import net from 'node:net'; export function projectAtlasFeature(){return net.connect(9,'127.0.0.1');}");
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.NonZeroExit);
        scope.AssertClean();
    }

    [Fact]
    public async Task FilesystemEscapeAttempt_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(
            "import fs from 'node:fs'; export function projectAtlasFeature(){fs.readFileSync(process.execPath);return null;}");
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.NonZeroExit);
        scope.AssertClean();
    }

    [Fact]
    public async Task Timeout_KillsProcessTreeAndCleansInvocation()
    {
        using var scope = new TestScope(timeout: TimeSpan.FromMilliseconds(300));
        var module = scope.CreateModule(
            "export async function projectAtlasFeature(){await new Promise(resolve=>setTimeout(resolve,60000));return null;}");
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.Timeout);
        scope.AssertClean();
    }

    [Fact]
    public async Task Cancellation_KillsProcessTreeAndCleansInvocation()
    {
        using var scope = new TestScope(timeout: TimeSpan.FromSeconds(10));
        var module = scope.CreateModule(
            "export async function projectAtlasFeature(){await new Promise(resolve=>setTimeout(resolve,60000));return null;}");
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(300));
        var result = await scope.Host.ProjectAsync(
            module, Hash(module), PolygonExchange(), cancellation.Token);

        result.Failure.Should().Be(AtlasProjectionFailure.Cancelled);
        scope.AssertClean();
    }

    [Fact]
    public async Task OversizedStdout_FailsClosedAndCleansInvocation()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(
            "export function projectAtlasFeature(){process.stdout.write('x'.repeat(1048577));return null;}");
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.StandardOutputTooLarge);
        scope.AssertClean();
    }

    [Fact]
    public async Task OversizedStderr_FailsClosedAndCleansInvocation()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(
            "export function projectAtlasFeature(){process.stderr.write('x'.repeat(65537));return null;}");
        var result = await scope.Host.ProjectAsync(module, Hash(module), PolygonExchange());

        result.Failure.Should().Be(AtlasProjectionFailure.StandardErrorTooLarge);
        scope.AssertClean();
    }

    private static string RequireExactModule() =>
        Path.GetFullPath(Environment.GetEnvironmentVariable("TERRAFUSION_ATLAS_HOST_MODULE_PATH")!);

    private static string PolygonExchange() => JsonSerializer.Serialize(new
    {
        result = new
        {
            countyId = CountyId,
            parcelId = ParcelId,
            evidenceState = "canonical",
            boundary = new
            {
                geometryState = "available",
                outerRing = new[]
                {
                    new { longitude = -119.2, latitude = 46.2 },
                    new { longitude = -119.1, latitude = 46.2 },
                    new { longitude = -119.1, latitude = 46.3 },
                    new { longitude = -119.2, latitude = 46.2 },
                },
            },
        },
    });

    private static string PointExchange() => JsonSerializer.Serialize(new
    {
        result = new
        {
            countyId = CountyId,
            parcelId = ParcelId,
            evidenceState = "canonical",
            boundary = new
            {
                geometryState = "centroid_only",
                centroid = new { longitude = -119.15, latitude = 46.22 },
            },
        },
    });

    private static string UnavailableExchange() => JsonSerializer.Serialize(new
    {
        result = new
        {
            countyId = CountyId,
            parcelId = ParcelId,
            evidenceState = "unavailable",
            boundary = new { geometryState = "unavailable" },
        },
    });

    private static string ReturnPolygonModule() =>
        "export function projectAtlasFeature(){return {type:'Feature',geometry:{type:'Polygon',coordinates:[[[1,2],[3,4],[5,6],[1,2]]]},properties:{countyId:'" +
        CountyId + "',parcelId:'" + ParcelId + "',evidenceState:'canonical'}};}";

    private static string Hash(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private sealed class TestScope : IDisposable
    {
        public TestScope(
            TimeSpan? timeout = null,
            Func<string, CancellationToken, Task>? afterCopy = null)
        {
            Root = Path.Combine(Path.GetTempPath(), "tf-atlas-host-tests", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(Root);
            Host = new AtlasProjectionProcessHost(
                FindNodeExecutable(),
                timeout,
                Root,
                afterCopy);
        }

        public string Root { get; }

        public AtlasProjectionProcessHost Host { get; }

        public string CreateModule(string source)
        {
            var path = Path.Combine(Root, $"module-{Guid.NewGuid():N}.mjs");
            File.WriteAllText(path, source, new UTF8Encoding(false));
            return path;
        }

        public void AssertClean()
        {
            var invocationRoot = Path.Combine(Root, "terrafusion-atlas-projection-host");
            (!Directory.Exists(invocationRoot) || !Directory.EnumerateFileSystemEntries(invocationRoot).Any())
                .Should().BeTrue("every invocation must remove its owned directory");
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }

        private static string FindNodeExecutable()
        {
            var configured = Environment.GetEnvironmentVariable("TERRAFUSION_ATLAS_NODE_PATH");
            if (!string.IsNullOrWhiteSpace(configured))
            {
                return Path.GetFullPath(configured);
            }

            var startInfo = new ProcessStartInfo("where.exe", "node.exe")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = Process.Start(startInfo)
                ?? throw new InvalidOperationException("Unable to locate node.exe.");
            var first = process.StandardOutput.ReadLine();
            process.WaitForExit();
            if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(first))
            {
                throw new InvalidOperationException("node.exe is unavailable.");
            }

            return Path.GetFullPath(first);
        }
    }
}
