using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using TerraFusion.API.Services.Dais;
using Xunit;

namespace TerraFusion.Unit.Tests.Dais;

public sealed class DaisAppealMutationProcessHostTests
{
    private const string RequestJson = """
        {"schemaVersion":"1.0.0","operation":"create","commandId":"11111111-1111-1111-1111-111111111111","countyId":"22222222-2222-2222-2222-222222222222","effectiveAt":"2026-02-03T04:05:06Z","command":{}}
        """;

    [Fact]
    public async Task DecideAsync_ExecutesExactCopiedArtifacts_AndReportsFourHashes()
    {
        using var fixture = new Fixture(ValidModule);
        var host = fixture.Host();

        var result = await fixture.Invoke(host);

        result.Success.Should().BeTrue(result.ErrorMessage);
        result.ResultJson.Should().Contain("\"decision\":\"accepted\"");
        result.SourceModuleSha256.Should().Be(fixture.ModuleHash);
        result.CopiedModuleSha256.Should().Be(fixture.ModuleHash);
        result.SourceSchemaSha256.Should().Be(fixture.SchemaHash);
        result.CopiedSchemaSha256.Should().Be(fixture.SchemaHash);
        Directory.GetDirectories(fixture.TempRoot, "*", SearchOption.AllDirectories)
            .Should().NotContain(path => Path.GetFileName(path).Length == 32);
    }

    [Fact]
    public async Task DecideAsync_FailsClosedWhenSourceIdentityDoesNotMatch()
    {
        using var fixture = new Fixture(ValidModule);
        File.AppendAllText(fixture.ModulePath, "// tamper");

        var result = await fixture.Invoke(fixture.Host());

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.SourceModuleHashMismatch);
        result.ResultJson.Should().BeNull();
    }

    [Fact]
    public async Task DecideAsync_FailsClosedWhenDisposableCopyIsTampered()
    {
        using var fixture = new Fixture(ValidModule);
        var host = fixture.Host(afterModuleCopied: (path, _) =>
        {
            File.AppendAllText(path, "// tamper");
            return Task.CompletedTask;
        });

        var result = await fixture.Invoke(host);

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.CopiedModuleHashMismatch);
    }

    [Theory]
    [InlineData(NetworkModule)]
    [InlineData(FileSystemEscapeModule)]
    public async Task DecideAsync_DeniesNetworkAndFilesystemEscape(string module)
    {
        using var fixture = new Fixture(module);

        var result = await fixture.Invoke(fixture.Host());

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.NonZeroExit);
    }

    [Fact]
    public async Task DecideAsync_EnforcesTimeout()
    {
        using var fixture = new Fixture(HangingModule);

        var result = await fixture.Invoke(fixture.Host(TimeSpan.FromMilliseconds(150)));

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.Timeout);
    }

    [Fact]
    public async Task DecideAsync_PropagatesCallerCancellationAsTypedFailure()
    {
        using var fixture = new Fixture(HangingModule);
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(150));

        var result = await fixture.Invoke(fixture.Host(TimeSpan.FromSeconds(5)), cancellation.Token);

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.Cancelled);
    }

    [Fact]
    public async Task DecideAsync_RejectsOversizeInputBeforeExecution()
    {
        using var fixture = new Fixture(ValidModule);
        var request = RequestJson[..^1] + ",\"padding\":\"" +
            new string('x', DaisAppealMutationProcessHost.MaximumInputBytes) + "\"}";

        var result = await fixture.Invoke(fixture.Host(), requestJson: request);

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.InputTooLarge);
    }

    [Fact]
    public async Task DecideAsync_KillsProcessWhenStandardOutputExceedsBound()
    {
        using var fixture = new Fixture(OversizeOutputModule);

        var result = await fixture.Invoke(fixture.Host());

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.StandardOutputTooLarge);
    }

    [Fact]
    public async Task DecideAsync_RejectsResultIdentityMismatch()
    {
        using var fixture = new Fixture(IdentityMismatchModule);

        var result = await fixture.Invoke(fixture.Host());

        result.Failure.Should().Be(DaisAppealMutationProcessFailure.IdentityMismatch);
    }

    private const string ValidModule = """
        export function decideDaisAppealMutation(request) {
          return {
            schemaVersion: request.schemaVersion,
            operation: request.operation,
            commandId: request.commandId,
            countyId: request.countyId,
            decision: 'accepted',
            mutation: {
              ground: 'MARKET_VALUE', status: 'filed', taxYear: 2026,
              filedAt: request.effectiveAt, updatedAt: request.effectiveAt
            },
            violations: []
          };
        }
        export function validateDaisAppealMutationSchema() { return []; }
        """;

    private const string NetworkModule = """
        export function decideDaisAppealMutation(request) {
          fetch('http://127.0.0.1:1');
          return request;
        }
        export function validateDaisAppealMutationSchema() { return []; }
        """;

    private const string FileSystemEscapeModule = """
        import fs from 'node:fs';
        export function decideDaisAppealMutation(request) {
          fs.readFileSync(process.execPath, 'utf8');
          return request;
        }
        export function validateDaisAppealMutationSchema() { return []; }
        """;

    private const string HangingModule = """
        export function decideDaisAppealMutation() { while (true) {} }
        export function validateDaisAppealMutationSchema() { return []; }
        """;

    private const string OversizeOutputModule = """
        export function decideDaisAppealMutation(request) {
          return { operation: request.operation, commandId: request.commandId,
            countyId: request.countyId, padding: 'x'.repeat(1100000) };
        }
        export function validateDaisAppealMutationSchema() { return []; }
        """;

    private const string IdentityMismatchModule = """
        export function decideDaisAppealMutation(request) {
          return { operation: request.operation,
            commandId: '33333333-3333-3333-3333-333333333333', countyId: request.countyId };
        }
        export function validateDaisAppealMutationSchema() { return []; }
        """;

    private sealed class Fixture : IDisposable
    {
        public Fixture(string module)
        {
            Root = Path.Combine(Path.GetTempPath(), "tf-dais-mutation-host-tests", Guid.NewGuid().ToString("N"));
            TempRoot = Path.Combine(Root, "temp");
            Directory.CreateDirectory(TempRoot);
            ModulePath = Path.GetFullPath(Path.Combine(Root, "decide.mjs"));
            SchemaPath = Path.GetFullPath(Path.Combine(Root, "schema.json"));
            File.WriteAllText(ModulePath, module, new UTF8Encoding(false));
            File.WriteAllText(SchemaPath, "{}", new UTF8Encoding(false));
            ModuleHash = Hash(ModulePath);
            SchemaHash = Hash(SchemaPath);
        }

        public string Root { get; }
        public string TempRoot { get; }
        public string ModulePath { get; }
        public string SchemaPath { get; }
        public string ModuleHash { get; }
        public string SchemaHash { get; }

        public DaisAppealMutationProcessHost Host(
            TimeSpan? timeout = null,
            Func<string, CancellationToken, Task>? afterModuleCopied = null) =>
            new(
                DaisAppealWorkflowRuntimeRegistration.ResolveNodeExecutablePath(),
                timeout ?? TimeSpan.FromSeconds(5),
                TempRoot,
                afterModuleCopied,
                afterSchemaCopied: null);

        public Task<DaisAppealMutationProcessResult> Invoke(
            DaisAppealMutationProcessHost host,
            CancellationToken cancellationToken = default,
            string requestJson = RequestJson) =>
            host.DecideAsync(
                ModulePath,
                ModuleHash,
                SchemaPath,
                SchemaHash,
                requestJson,
                cancellationToken);

        public void Dispose()
        {
            if (Directory.Exists(Root))
                Directory.Delete(Root, recursive: true);
        }

        private static string Hash(string path) =>
            Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path))).ToLowerInvariant();
    }
}
