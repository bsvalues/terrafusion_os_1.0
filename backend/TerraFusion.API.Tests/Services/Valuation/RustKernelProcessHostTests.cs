using System.IO;
using System.Security.Cryptography;
using System.Reflection;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public class RustKernelProcessHostTests
{
    private const string ForgeCommit = "24059c3642339f36877cb454ca63683180915b71";
    private static readonly IReadOnlyDictionary<string, string> ForgeSourceSha256 =
        new Dictionary<string, string>
        {
            ["kernels/terraforge.kernel.valuation/Cargo.toml"] =
                "c27750c78f2ddf77e5cfca3fc6a020bd2bf5ddecb97fa10e44d2e20d2c5e2358",
            ["kernels/terraforge.kernel.valuation/Cargo.lock"] =
                "087367b4a37c7a55700b4f9bec1ac073d5c6e8cc3932f1a4220a9abbba0b48bd",
            ["kernels/terraforge.kernel.valuation/build.rs"] =
                "9220a3d4c6011d835c4fd45ef07cf34a109fe434527926d4e12848ebbae921f6",
            ["kernels/terraforge.kernel.valuation/src/main.rs"] =
                "3dbad9a2c89c061fccdfc2a0d05d7074a6b397bc05da6ee5e9a23844d209f4ae",
        };

    private static RustKernelProcessHost CreateSut(
        int timeoutMs = 5000,
        Action<RustKernelsOptions>? configure = null)
    {
        var options = new RustKernelsOptions { TimeoutMs = timeoutMs };
        configure?.Invoke(options);
        return new(
            Options.Create(options),
            NullLogger<RustKernelProcessHost>.Instance);
    }

    private static KernelInvocation<CostKernelPayload> SampleCostInvocation() =>
        new(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: "test-001",
            Action: "calculate_cost",
            Payload: new CostKernelPayload(
                new CostSubject("PARCEL-001", new CostAttributes(1850.0, "GOOD", "AVERAGE")),
                new CostTables(145.50, new Dictionary<string, double> { ["GOOD"] = 1.15 })));

    [Fact]
    public async Task MissingExecutable_ReturnsExecutableNotFoundFailure()
    {
        var host = CreateSut();
        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            executablePath: "this-does-not-exist.exe",
            kernelName: "terraforge.kernel.cost",
            invocation: SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.ExecutableNotFound, result.FailureMode);
        Assert.Null(result.Data);
        Assert.Equal("terraforge.kernel.cost", result.KernelName);
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public async Task InputHash_IsStableForSameRequest()
    {
        var host = CreateSut();
        var inv = SampleCostInvocation();
        var r1 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "does-not-exist.exe", "cost", inv);
        var r2 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "does-not-exist.exe", "cost", inv);

        // Both fail on missing exe, but hash should match — hash is computed before invocation.
        Assert.Equal(r1.InputHash, r2.InputHash);
        Assert.NotEmpty(r1.InputHash);
    }

    [Fact]
    public async Task InputHash_ChangesWhenPayloadChanges()
    {
        var host = CreateSut();
        var inv1 = SampleCostInvocation();
        var inv2 = inv1 with
        {
            Payload = inv1.Payload! with
            {
                Subject = inv1.Payload.Subject with
                {
                    Attributes = inv1.Payload.Subject.Attributes with { Sqft = 9999.0 }
                }
            }
        };

        var r1 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>("nope.exe", "cost", inv1);
        var r2 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>("nope.exe", "cost", inv2);

        Assert.NotEqual(r1.InputHash, r2.InputHash);
    }

    [Fact]
    public async Task DurationMs_IsNonNegative()
    {
        var host = CreateSut();
        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "does-not-exist.exe", "cost", SampleCostInvocation());

        Assert.True(result.DurationMs >= 0);
        Assert.True(result.CompletedAt >= result.StartedAt);
    }

    [Fact]
    public async Task OversizedInput_FailsBeforeProcessStart()
    {
        var host = CreateSut(configure: options => options.MaxStdinBytes = 8);

        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            "this-does-not-exist.exe", "cost", SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.InputLimitExceeded, result.FailureMode);
        Assert.DoesNotContain("PARCEL-001", result.ErrorMessage ?? string.Empty, StringComparison.Ordinal);
    }

    [Fact]
    public async Task StdoutLimit_FailsClosedWithoutRawOutput()
    {
        var host = CreateSut(configure: options =>
        {
            options.MaxStdinBytes = 64 * 1024;
            options.MaxStdoutBytes = 8;
        });

        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            FindPassthroughExecutable(), "cost", SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.OutputLimitExceeded, result.FailureMode);
        Assert.DoesNotContain("PARCEL-001", result.ErrorMessage ?? string.Empty, StringComparison.Ordinal);
    }

    [Fact]
    public async Task KernelReportedFailure_RecordsOnlyBoundedHashesAndCounts()
    {
        var host = CreateSut();

        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            FindPassthroughExecutable(), "cost", SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.KernelReportedError, result.FailureMode);
        Assert.True(result.StdoutByteCount > 0);
        Assert.Matches("^[a-f0-9]{64}$", result.StdoutSha256 ?? string.Empty);
        Assert.DoesNotContain("PARCEL-001", result.ErrorMessage ?? string.Empty, StringComparison.Ordinal);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public async Task CallerCancellation_IsDistinctFromTimeout()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var host = CreateSut(timeoutMs: 30_000);

        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            FindPassthroughExecutable(), "cost", SampleCostInvocation(), cancellation.Token);

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.Cancellation, result.FailureMode);
    }

    [Fact]
    public async Task ZeroTimeout_IsReportedAsTimeout()
    {
        var host = CreateSut(timeoutMs: 0);

        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            FindPassthroughExecutable(), "cost", SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.Timeout, result.FailureMode);
    }

    [Fact]
    public void ProcessEnvironment_DropsUnapprovedInheritedVariables()
    {
        const string variable = "TF_SR_008I_SECRET_SENTINEL";
        Environment.SetEnvironmentVariable(variable, "must-not-propagate");
        try
        {
            var method = typeof(RustKernelProcessHost).GetMethod(
                "CreateProcessStartInfo", BindingFlags.NonPublic | BindingFlags.Static);
            var info = Assert.IsType<System.Diagnostics.ProcessStartInfo>(
                method!.Invoke(null, [FindPassthroughExecutable()]));

            Assert.False(info.Environment.ContainsKey(variable));
            Assert.True(info.RedirectStandardInput);
            Assert.True(info.RedirectStandardOutput);
            Assert.True(info.RedirectStandardError);
            Assert.False(info.UseShellExecute);
        }
        finally
        {
            Environment.SetEnvironmentVariable(variable, null);
        }
    }

    [Fact]
    public async Task NonzeroExit_IsTypedAndSanitized()
    {
        var executable = FindNonzeroExecutable();
        if (executable is null)
            return;
        var result = await CreateSut().InvokeAsync<CostKernelPayload, CostKernelResult>(
            executable, "cost", SampleCostInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.NonZeroExit, result.FailureMode);
        Assert.DoesNotContain("PARCEL-001", result.ErrorMessage ?? string.Empty, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ValuationKernel_MissingManifest_FailsClosedBeforeExecution()
    {
        using var fixture = ProvenanceFixture.Create();
        var host = CreateSut(configure: options =>
        {
            options.ValuationKernelManifestPath = fixture.MissingManifestPath;
            options.ValuationKernelSourceCommit = ForgeCommit;
        });

        var result = await host.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            fixture.ExecutablePath,
            "terraforge.kernel.valuation",
            SampleValuationInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.ProvenanceFailure, result.FailureMode);
        Assert.Contains("manifest", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValuationKernel_MismatchedExecutableHash_FailsClosedBeforeExecution()
    {
        using var fixture = ProvenanceFixture.Create(writeManifest: true, executableSha256: new string('0', 64));
        var host = CreateSut(configure: options =>
        {
            options.ValuationKernelManifestPath = fixture.ManifestPath;
            options.ValuationKernelSourceCommit = ForgeCommit;
        });

        var result = await host.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            fixture.ExecutablePath,
            "terraforge.kernel.valuation",
            SampleValuationInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.ProvenanceFailure, result.FailureMode);
        Assert.Contains("did not match", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        Assert.Matches("^[a-f0-9]{64}$", result.KernelBinarySha256 ?? string.Empty);
    }

    [Fact]
    public async Task ValuationKernel_MismatchedSourceHash_FailsClosedBeforeExecution()
    {
        using var fixture = ProvenanceFixture.Create(
            writeManifest: true,
            useActualExecutableSha256: true,
            mismatchSourceHash: true);
        var host = CreateSut(configure: options =>
        {
            options.ValuationKernelManifestPath = fixture.ManifestPath;
            options.ValuationKernelSourceCommit = ForgeCommit;
        });

        var result = await host.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            fixture.ExecutablePath,
            "terraforge.kernel.valuation",
            SampleValuationInvocation());

        Assert.False(result.Success);
        Assert.Equal(KernelFailureMode.ProvenanceFailure, result.FailureMode);
        Assert.Contains("did not match", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RealKernel_ReturnsSuccessForValidCostInput()
    {
        // Locate kernel binary: try release first, then debug.
        var kernelPath = TryFindKernelBinary("terraforge-kernel-cost");
        if (kernelPath == null)
        {
            // No compiled kernel — skip. Recorded as a message, not a failure.
            // To enable: `cd packages/terrabuild/kernels && cargo build`.
            return;
        }

        var host = CreateSut();
        var result = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(
            kernelPath, "terraforge.kernel.cost", SampleCostInvocation());

        Assert.True(result.Success, $"Expected success, got: {result.ErrorMessage}");
        Assert.NotNull(result.Data);
        // sqft=1850 * baseRate=145.50 * modQ=1.15 * modC=1.0 = 309551.25
        Assert.Equal(309551.25, result.Data!.ReplacementCost, 2);
        Assert.Equal(30955.125, result.Data.Depreciation, 2);
        Assert.NotNull(result.AuditEvent);
        Assert.StartsWith("git:", result.AuditEvent!.Hash);
        Assert.Matches("^[a-f0-9]{64}$", result.KernelBinarySha256 ?? string.Empty);
    }

    [Fact]
    public async Task RealKernel_DeterministicSameInputProducesSameResult()
    {
        var kernelPath = TryFindKernelBinary("terraforge-kernel-cost");
        if (kernelPath == null) return;

        var host = CreateSut();
        var inv = SampleCostInvocation();
        var r1 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(kernelPath, "cost", inv);
        var r2 = await host.InvokeAsync<CostKernelPayload, CostKernelResult>(kernelPath, "cost", inv);

        Assert.True(r1.Success && r2.Success);
        Assert.Equal(r1.Data!.ReplacementCost, r2.Data!.ReplacementCost);
        Assert.Equal(r1.Data.Depreciation, r2.Data.Depreciation);
        Assert.Equal(r1.Data.Rcnld, r2.Data.Rcnld);
        // Same input hash
        Assert.Equal(r1.InputHash, r2.InputHash);
        // Same kernel binary hash (from audit event)
        Assert.Equal(r1.AuditEvent!.Hash, r2.AuditEvent!.Hash);
        Assert.Equal(r1.KernelBinarySha256, r2.KernelBinarySha256);
        Assert.Matches("^[a-f0-9]{64}$", r1.KernelBinarySha256 ?? string.Empty);
        // Different audit event IDs (uuid per call) — this confirms kernel ran twice
        Assert.NotEqual(r1.AuditEvent.EventId, r2.AuditEvent.EventId);
    }

    private static string? TryFindKernelBinary(string name)
    {
        var repoRoot = FindRepoRoot();
        if (repoRoot == null) return null;
        // Check in order: per-crate release/debug, then workspace-level target (.cargo/config.toml redirects here)
        string[] candidates =
        {
            Path.Combine(repoRoot, "packages", "terrabuild", "kernels", "target", "release", $"{name}.exe"),
            Path.Combine(repoRoot, "packages", "terrabuild", "kernels", "target", "debug", $"{name}.exe"),
            Path.Combine(repoRoot, "target", "release", $"{name}.exe"),
            Path.Combine(repoRoot, "target", "debug", $"{name}.exe"),
        };
        foreach (var c in candidates)
        {
            if (File.Exists(c)) return c;
        }
        return null;
    }

    private static string FindPassthroughExecutable()
    {
        if (OperatingSystem.IsWindows())
        {
            var path = Path.Combine(Environment.SystemDirectory, "more.com");
            if (File.Exists(path)) return path;
        }
        if (File.Exists("/bin/cat")) return "/bin/cat";
        throw new InvalidOperationException("No local passthrough executable is available for host tests.");
    }

    private static string? FindNonzeroExecutable()
    {
        if (OperatingSystem.IsWindows())
        {
            var path = Path.Combine(Environment.SystemDirectory, "where.exe");
            return File.Exists(path) ? path : null;
        }
        return File.Exists("/bin/false") ? "/bin/false" : null;
    }

    private static KernelInvocation<ValuationKernelPayload> SampleValuationInvocation() =>
        new(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: "valuation-provenance-test",
            Action: "valuate",
            Payload: new ValuationKernelPayload(
                new ValuationSubject("SYNTHETIC-001", JsonDocument.Parse("{}").RootElement.Clone()),
                new ValuationCostBreakdown(100, 10, 90),
                new ValuationModel(30, null)));

    private sealed class ProvenanceFixture : IDisposable
    {
        private ProvenanceFixture(string root)
        {
            Root = root;
            ExecutablePath = Path.Combine(root, "terraforge-kernel-valuation.exe");
            ManifestPath = Path.Combine(root, "manifest.json");
            MissingManifestPath = Path.Combine(root, "missing-manifest.json");
        }

        public string Root { get; }
        public string ExecutablePath { get; }
        public string ManifestPath { get; }
        public string MissingManifestPath { get; }

        public static ProvenanceFixture Create(
            bool writeManifest = false,
            string? executableSha256 = null,
            bool useActualExecutableSha256 = false,
            bool mismatchSourceHash = false)
        {
            var fixture = new ProvenanceFixture(
                Path.Combine(Path.GetTempPath(), $"tf-forge-provenance-{Guid.NewGuid():N}"));
            Directory.CreateDirectory(fixture.Root);
            File.WriteAllText(fixture.ExecutablePath, "not-an-executable");

            if (writeManifest)
            {
                var sourceBlobSha256 = new Dictionary<string, string>(ForgeSourceSha256);
                if (mismatchSourceHash)
                {
                    sourceBlobSha256["kernels/terraforge.kernel.valuation/src/main.rs"] =
                        new string('0', 64);
                }
                var manifest = new
                {
                    schemaVersion = 1,
                    repository = "bsvalues/terrafusion-forge",
                    commit = ForgeCommit,
                    transport = "local-os-managed-artifact-slot",
                    sourceBlobSha256,
                    executableFilename = Path.GetFileName(fixture.ExecutablePath),
                    executableSha256 = useActualExecutableSha256
                        ? Convert.ToHexString(SHA256.HashData(
                            File.ReadAllBytes(fixture.ExecutablePath))).ToLowerInvariant()
                        : executableSha256,
                };
                File.WriteAllText(fixture.ManifestPath, JsonSerializer.Serialize(manifest));
            }

            return fixture;
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }
    }

    private static string? FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            // `.git` may be a directory (normal clone) or a file (worktree pointer).
            var gitPath = Path.Combine(dir.FullName, ".git");
            if (Directory.Exists(gitPath) || File.Exists(gitPath) ||
                File.Exists(Path.Combine(dir.FullName, "terrafusion.app.json")))
                return dir.FullName;
            dir = dir.Parent;
        }
        return null;
    }
}
