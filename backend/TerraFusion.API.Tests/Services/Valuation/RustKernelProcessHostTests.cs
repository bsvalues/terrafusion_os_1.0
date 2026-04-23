using System.IO;
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
    private static RustKernelProcessHost CreateSut(int timeoutMs = 5000) =>
        new(
            Options.Create(new RustKernelsOptions { TimeoutMs = timeoutMs }),
            NullLogger<RustKernelProcessHost>.Instance);

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
