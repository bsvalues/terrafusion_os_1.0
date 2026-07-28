using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
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

public sealed class LocalForgeRuntimeRollbackFactAttribute : FactAttribute
{
    public LocalForgeRuntimeRollbackFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_FORGE_RUNTIME_KERNEL_PATH")) ||
            string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH")) ||
            string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_FORGE_RUNTIME_KERNEL_SHA256")) ||
            string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_SHA256")))
        {
            Skip = "Local runtime rollback proof requires Forge and sovereign kernel paths.";
        }
    }
}

public sealed class LocalForgePersistentRuntimeRollbackFactAttribute : FactAttribute
{
    public LocalForgePersistentRuntimeRollbackFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_FORGE_REHEARSAL_CONFIG_PATH")) ||
            string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_FORGE_REHEARSAL_EXPECTED_SHA256")) ||
            string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_FORGE_REHEARSAL_HOST")))
        {
            Skip = "Persistent runtime rehearsal requires the disposable config, expected SHA, and host label.";
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

    [LocalForgeRuntimeRollbackFact]
    public async Task LocalForgeRuntimeSelectionAndRollback_UsesClientHostBoundary()
    {
        var forgePath = RequireEnvironmentPath("TERRAFUSION_FORGE_RUNTIME_KERNEL_PATH");
        var sovereignPath = RequireEnvironmentPath("TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH");
        var forgeSha256 = ComputeFileSha256(forgePath);
        var sovereignSha256 = ComputeFileSha256(sovereignPath);
        Assert.Equal(
            RequireEnvironmentValue("TERRAFUSION_FORGE_RUNTIME_KERNEL_SHA256"),
            forgeSha256);
        Assert.Equal(
            RequireEnvironmentValue("TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_SHA256"),
            sovereignSha256);
        var payload = CreateRuntimeRollbackPayload();

        var (forgeClient, forgeHost) = CreateValuationClient(forgePath);
        var forgeAccepted = await forgeClient.ValuateAsync(payload);

        Assert.True(forgeAccepted.Success, forgeAccepted.ErrorMessage);
        Assert.NotNull(forgeAccepted.Data);
        Assert.Equal(351675.412625, forgeAccepted.Data!.TotalValue, 6);
        Assert.Equal(65000.0, forgeAccepted.Data.Components.Land, 6);
        Assert.Equal(286675.412625, forgeAccepted.Data.Components.Building, 6);
        Assert.Equal(forgeSha256, forgeAccepted.KernelBinarySha256);
        Assert.StartsWith("git:", forgeAccepted.KernelVersion);

        var deniedInvocation = new KernelInvocation<ValuationKernelPayload>(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: "local-runtime-denied",
            Action: "not-authorized",
            Payload: payload);
        var forgeDenied =
            await forgeHost.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
                forgePath,
                "terraforge.kernel.valuation",
                deniedInvocation);

        Assert.False(forgeDenied.Success);
        Assert.Equal(KernelFailureMode.KernelReportedError, forgeDenied.FailureMode);
        Assert.Equal(forgeSha256, forgeDenied.KernelBinarySha256);

        var (sovereignClient, _) = CreateValuationClient(sovereignPath);
        var rollbackAccepted = await sovereignClient.ValuateAsync(payload);

        Assert.True(rollbackAccepted.Success, rollbackAccepted.ErrorMessage);
        Assert.NotNull(rollbackAccepted.Data);
        Assert.Equal(forgeAccepted.Data.TotalValue, rollbackAccepted.Data!.TotalValue);
        Assert.Equal(forgeAccepted.Data.Components, rollbackAccepted.Data.Components);
        Assert.Equal(sovereignSha256, rollbackAccepted.KernelBinarySha256);
        Assert.StartsWith("git:", rollbackAccepted.KernelVersion);
    }

    [LocalForgePersistentRuntimeRollbackFact]
    public async Task LocalForgePersistentRuntimeSelection_BindsDisposableConfiguration()
    {
        var configPath = RequireEnvironmentPath("TERRAFUSION_FORGE_REHEARSAL_CONFIG_PATH");
        var expectedSha256 =
            RequireEnvironmentValue("TERRAFUSION_FORGE_REHEARSAL_EXPECTED_SHA256");
        var hostLabel = RequireEnvironmentValue("TERRAFUSION_FORGE_REHEARSAL_HOST");

        using var document = JsonDocument.Parse(File.ReadAllText(configPath));
        var rootProperties = document.RootElement.EnumerateObject().ToArray();
        Assert.Single(rootProperties);
        Assert.Equal(RustKernelsOptions.SectionName, rootProperties[0].Name);
        var kernelProperties = rootProperties[0].Value.EnumerateObject().ToArray();
        Assert.Single(kernelProperties);
        Assert.Equal(nameof(RustKernelsOptions.ValuationKernelPath), kernelProperties[0].Name);

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.GetDirectoryName(configPath)!)
            .AddJsonFile(Path.GetFileName(configPath), optional: false, reloadOnChange: false)
            .Build();
        var options = configuration
            .GetSection(RustKernelsOptions.SectionName)
            .Get<RustKernelsOptions>();

        Assert.NotNull(options);
        Assert.Equal(
            Path.GetFullPath(kernelProperties[0].Value.GetString()!),
            Path.GetFullPath(options!.ValuationKernelPath));
        var selectedSha256 = ComputeFileSha256(options.ValuationKernelPath);
        Assert.Equal(expectedSha256, selectedSha256);

        var (client, host) = CreateValuationClient(options.ValuationKernelPath);
        var accepted = await client.ValuateAsync(CreateRuntimeRollbackPayload());

        Assert.True(accepted.Success, $"{hostLabel}: {accepted.ErrorMessage}");
        Assert.NotNull(accepted.Data);
        Assert.Equal(351675.412625, accepted.Data!.TotalValue, 6);
        Assert.Equal(selectedSha256, accepted.KernelBinarySha256);

        var deniedInvocation = new KernelInvocation<ValuationKernelPayload>(
            ContractPackVersion: "1.0.0",
            ModuleApiVersion: "1.0.0",
            RequestId: $"persistent-rehearsal-{hostLabel}-denied",
            Action: "not-authorized",
            Payload: CreateRuntimeRollbackPayload());
        var denied = await host.InvokeAsync<ValuationKernelPayload, ValuationKernelResult>(
            options.ValuationKernelPath,
            "terraforge.kernel.valuation",
            deniedInvocation);

        Assert.False(denied.Success);
        Assert.Equal(KernelFailureMode.KernelReportedError, denied.FailureMode);
        Assert.Equal(selectedSha256, denied.KernelBinarySha256);
    }

    private static (ValuationKernelClient Client, RustKernelProcessHost Host)
        CreateValuationClient(string valuationKernelPath)
    {
        var options = Options.Create(new RustKernelsOptions
        {
            ValuationKernelPath = valuationKernelPath,
            TimeoutMs = 10000,
            ContractPackVersion = "1.0.0",
            ModuleApiVersion = "1.0.0",
        });
        var host = new RustKernelProcessHost(
            options,
            NullLogger<RustKernelProcessHost>.Instance);
        var client = new ValuationKernelClient(
            host,
            options,
            NullLogger<ValuationKernelClient>.Instance);
        return (client, host);
    }

    private static ValuationKernelPayload CreateRuntimeRollbackPayload()
    {
        return new ValuationKernelPayload(
            new ValuationSubject(
                "SYNTHETIC-LOCAL-RUNTIME-001",
                JsonDocument.Parse("{}").RootElement.Clone()),
            new ValuationCostBreakdown(
                ReplacementCost: 309551.25,
                Depreciation: 30955.125,
                Rcnld: 278596.125),
            new ValuationModel(
                LandValue: 65000.0,
                AdjustmentFactors: new AdjustmentFactors(
                    Neighborhood: 1.05,
                    Location: 0.98)));
    }

    private static string ComputeFileSha256(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private static string RequireEnvironmentValue(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);
        Assert.False(string.IsNullOrWhiteSpace(value), $"{name} is required.");
        return value!.ToLowerInvariant();
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
        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        try
        {
            process.WaitForExitAsync(timeout.Token).GetAwaiter().GetResult();
        }
        catch (OperationCanceledException)
        {
            process.Kill(entireProcessTree: true);
            throw new TimeoutException($"Kernel process timed out: {path}");
        }

        Task.WhenAll(stdoutTask, stderrTask).GetAwaiter().GetResult();
        var stdout = stdoutTask.Result.Trim();
        var stderr = stderrTask.Result.Trim();
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
