using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.Core.DTOs.Kernel;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

public sealed class LocalForgeShadowFactAttribute : FactAttribute
{
    public LocalForgeShadowFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_FORGE_SHADOW_KERNEL_PATH")))
        {
            Skip = "Local sovereign shadow proof requires TERRAFUSION_FORGE_SHADOW_KERNEL_PATH.";
        }
    }
}

public class KernelValuationServiceIntegrationTests
{
    private static readonly string? CostKernelPath = TryFindKernel("terraforge-kernel-cost");
    private static readonly string? ValuationKernelPath = TryFindKernel("terraforge-kernel-valuation");

    private static bool KernelsAvailable =>
        CostKernelPath != null && ValuationKernelPath != null;

    private static KernelValuationService CreateSut()
    {
        var opts = Options.Create(new RustKernelsOptions
        {
            CostKernelPath = CostKernelPath!,
            ValuationKernelPath = ValuationKernelPath!,
            TimeoutMs = 10000,
            ContractPackVersion = "1.0.0",
            ModuleApiVersion = "1.0.0",
        });
        var host = new RustKernelProcessHost(opts, NullLogger<RustKernelProcessHost>.Instance);
        var cost = new CostKernelClient(host, opts, NullLogger<CostKernelClient>.Instance);
        var valn = new ValuationKernelClient(host, opts, NullLogger<ValuationKernelClient>.Instance);
        return new KernelValuationService(cost, valn, NullLogger<KernelValuationService>.Instance);
    }

    [Fact]
    public async Task RealKernels_ComputeExpectedValue()
    {
        // Hard-fail if kernels not found — silent early-return would be a false pass.
        Assert.True(KernelsAvailable,
            "Kernel binaries not found. Build with `cargo build --release` in packages/terrabuild/kernels.");

        var sut = CreateSut();
        var req = new KernelCostApproachRequest(
            ParcelId: "INT-001",
            Sqft: 1850.0, Quality: "GOOD", Condition: "AVERAGE",
            BaseRate: 145.50,
            Modifiers: new Dictionary<string, double>
            {
                ["GOOD"] = 1.15,
                ["AVERAGE"] = 1.0,
                ["DepreciationRate"] = 0.10,
            },
            LandValue: 65000.0,
            NeighborhoodFactor: 1.05,
            LocationFactor: 0.98);

        var result = await sut.ComputeCostWithKernelAsync(req);

        // Cost: 1850 * 145.50 * 1.15 * 1.0 = 309551.25
        Assert.Equal(309551.25, result.ReplacementCost, 2);
        // Depreciation: 0.10 * 309551.25 = 30955.125
        Assert.Equal(30955.125, result.Depreciation, 2);
        // Rcnld: 309551.25 - 30955.125 = 278596.125
        Assert.Equal(278596.125, result.Rcnld, 2);
        // Valuation: building = 278596.125 * 1.05 * 0.98 = 286675.49 (approx)
        // total = 65000 + 286675.49 = 351675.49 (approx)
        Assert.InRange(result.TotalValue, 351000, 352500);
        Assert.Equal(65000.0, result.LandValue, 2);
        // Provenance populated — proves kernels actually ran (not a stub).
        Assert.StartsWith("git:", result.Provenance.CostKernelHash);
        Assert.StartsWith("git:", result.Provenance.ValuationKernelHash);
        Assert.NotEmpty(result.Provenance.CostAuditEventId);
        Assert.NotEmpty(result.Provenance.ValuationAuditEventId);
        Assert.NotEmpty(result.Provenance.CostInputHash);
        Assert.NotEmpty(result.Provenance.ValuationInputHash);
        Assert.Matches("^[a-f0-9]{64}$", result.Provenance.CostKernelBinarySha256 ?? string.Empty);
        Assert.Matches("^[a-f0-9]{64}$", result.Provenance.ValuationKernelBinarySha256 ?? string.Empty);
        Assert.True(result.Provenance.CostDurationMs >= 0);
        Assert.True(result.Provenance.ValuationDurationMs >= 0);
    }

    [Fact]
    public async Task RealKernels_SameInputProducesSameOutput()
    {
        Assert.True(KernelsAvailable,
            "Kernel binaries not found. Build with `cargo build --release` in packages/terrabuild/kernels.");

        var sut = CreateSut();
        var req = new KernelCostApproachRequest(
            "INT-DET", 1850.0, "GOOD", "AVERAGE", 145.50,
            new Dictionary<string, double> { ["GOOD"] = 1.15, ["AVERAGE"] = 1.0 },
            65000.0, 1.05, 0.98);

        var r1 = await sut.ComputeCostWithKernelAsync(req);
        var r2 = await sut.ComputeCostWithKernelAsync(req);

        Assert.Equal(r1.ReplacementCost, r2.ReplacementCost);
        Assert.Equal(r1.Depreciation, r2.Depreciation);
        Assert.Equal(r1.Rcnld, r2.Rcnld);
        Assert.Equal(r1.TotalValue, r2.TotalValue);
        Assert.Equal(r1.LandValue, r2.LandValue);
        Assert.Equal(r1.BuildingValue, r2.BuildingValue);
        // Same binary -> same kernel hash. This is the strong determinism signal
        // at the provenance layer — proves both calls ran against the identical
        // binary, and the numeric equality above proves identical output.
        Assert.Equal(r1.Provenance.CostKernelHash, r2.Provenance.CostKernelHash);
        Assert.Equal(r1.Provenance.ValuationKernelHash, r2.Provenance.ValuationKernelHash);
        Assert.Equal(r1.Provenance.CostKernelBinarySha256, r2.Provenance.CostKernelBinarySha256);
        Assert.Equal(r1.Provenance.ValuationKernelBinarySha256, r2.Provenance.ValuationKernelBinarySha256);
        Assert.NotEmpty(r1.Provenance.CostKernelHash);
        // Input hashes MUST differ between calls: CostKernelClient mints a fresh
        // RequestId (Guid) per invocation, and the hash is computed over the
        // entire serialized envelope including RequestId. This is intentional —
        // it gives every call a unique audit fingerprint. Determinism is
        // asserted via output equality + kernel-hash equality above.
        Assert.NotEqual(r1.Provenance.CostInputHash, r2.Provenance.CostInputHash);
        Assert.NotEqual(r1.Provenance.ValuationInputHash, r2.Provenance.ValuationInputHash);
        Assert.NotEmpty(r1.Provenance.CostInputHash);
        // Different audit event IDs prove kernel actually ran twice (uuid per call).
        Assert.NotEqual(r1.Provenance.CostAuditEventId, r2.Provenance.CostAuditEventId);
        Assert.NotEqual(r1.Provenance.ValuationAuditEventId, r2.Provenance.ValuationAuditEventId);
    }

    [LocalForgeShadowFact]
    public void LocalForgeShadowKernel_MatchesSovereignAcceptedAndFailClosedBehavior()
    {
        var forgePath = RequireEnvironmentPath("TERRAFUSION_FORGE_SHADOW_KERNEL_PATH");
        var sovereignPath = RequireEnvironmentPath("TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH");

        const string acceptedInput =
            """
            {"contractPackVersion":"1.0.0","moduleApiVersion":"1.0.0","requestId":"local-shadow-accepted","action":"valuate","payload":{"subject":{"parcelId":"SYNTHETIC-LOCAL-001","attributes":{}},"costBreakdown":{"replacementCost":309551.25,"depreciation":30955.125,"rcnld":278596.125},"model":{"landValue":65000.0,"adjustmentFactors":{"neighborhood":1.05,"location":0.98}}}}
            """;
        const string failClosedInput =
            """
            {"contractPackVersion":"1.0.0","moduleApiVersion":"1.0.0","requestId":"local-shadow-denied","action":"not-authorized","payload":{}}
            """;

        AssertKernelParity(sovereignPath, forgePath, acceptedInput);
        AssertKernelParity(sovereignPath, forgePath, failClosedInput);

        var first = RunKernel(forgePath, acceptedInput);
        var second = RunKernel(forgePath, acceptedInput);
        Assert.Equal(0, first.ExitCode);
        Assert.Equal(0, second.ExitCode);
        Assert.Equal(NormalizeKernelOutput(first.Stdout), NormalizeKernelOutput(second.Stdout));
    }

    private static void AssertKernelParity(string sovereignPath, string forgePath, string input)
    {
        var sovereign = RunKernel(sovereignPath, input);
        var forge = RunKernel(forgePath, input);

        Assert.Equal(sovereign.ExitCode, forge.ExitCode);
        Assert.Equal(0, forge.ExitCode);
        Assert.Equal(string.Empty, sovereign.Stderr);
        Assert.Equal(string.Empty, forge.Stderr);
        Assert.Equal(NormalizeKernelOutput(sovereign.Stdout), NormalizeKernelOutput(forge.Stdout));
    }

    private static string RequireEnvironmentPath(string name)
    {
        var path = Environment.GetEnvironmentVariable(name);
        Assert.False(string.IsNullOrWhiteSpace(path), $"{name} is required.");
        Assert.True(File.Exists(path), $"{name} does not identify an existing file: {path}");
        return Path.GetFullPath(path!);
    }

    private static KernelProcessResult RunKernel(string path, string input)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = path,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            },
        };

        process.Start();
        process.StandardInput.Write(input);
        process.StandardInput.Close();
        var stdout = process.StandardOutput.ReadToEnd().Trim();
        var stderr = process.StandardError.ReadToEnd().Trim();
        if (!process.WaitForExit(10_000))
        {
            process.Kill(entireProcessTree: true);
            throw new TimeoutException($"Kernel process timed out: {path}");
        }

        return new KernelProcessResult(process.ExitCode, stdout, stderr);
    }

    private static string NormalizeKernelOutput(string output)
    {
        var root = JsonNode.Parse(output)?.AsObject()
            ?? throw new JsonException("Kernel output was not a JSON object.");
        root.Remove("auditEvent");
        return root.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
    }

    private sealed record KernelProcessResult(int ExitCode, string Stdout, string Stderr);

    // Worktree-aware kernel locator. The worktree root may redirect cargo's
    // target-dir via `.cargo/config.toml`, so binaries can land at either the
    // per-crate `packages/terrabuild/kernels/target/...` OR at the
    // workspace-level `<repoRoot>/target/...`. Check both. `.git` can be a
    // directory (normal clone) or a file (worktree pointer) — handle both.
    private static string? TryFindKernel(string name)
    {
        var repoRoot = FindRepoRoot();
        if (repoRoot == null) return null;
        string[] candidates =
        {
            Path.Combine(repoRoot, "target", "release", $"{name}.exe"),
            Path.Combine(repoRoot, "target", "debug", $"{name}.exe"),
            Path.Combine(repoRoot, "packages", "terrabuild", "kernels", "target", "release", $"{name}.exe"),
            Path.Combine(repoRoot, "packages", "terrabuild", "kernels", "target", "debug", $"{name}.exe"),
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
            var gitPath = Path.Combine(dir.FullName, ".git");
            if (Directory.Exists(gitPath) || File.Exists(gitPath) ||
                File.Exists(Path.Combine(dir.FullName, "terrafusion.app.json")))
                return dir.FullName;
            dir = dir.Parent;
        }
        return null;
    }
}
