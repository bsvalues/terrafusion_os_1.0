using System.IO;
using System.Collections.Generic;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.Core.DTOs.Kernel;
using Xunit;

namespace TerraFusion.API.Tests.Services.Valuation;

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
