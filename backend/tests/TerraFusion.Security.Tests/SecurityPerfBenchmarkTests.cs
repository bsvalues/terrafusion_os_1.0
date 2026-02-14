using System.Diagnostics;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.Security.Services;
using Xunit;

namespace TerraFusion.Security.Tests;

/// <summary>
/// PHASE 5.4 PERFORMANCE BENCHMARK TESTS
///
/// p95 budget enforcement for security hot paths.
/// Prevents "secure but down" — every security operation must meet
/// a latency ceiling so that crypto/auth work never becomes the bottleneck.
///
/// Budgets (p95):
///   Encrypt   : ≤ 2 ms per operation
///   Decrypt   : ≤ 2 ms per operation
///   PolicyEval: ≤ 0.5 ms per operation
///   HKDF init : ≤ 50 ms (one-time startup cost)
///
/// Anti-flake strategy:
///   - 100 warmup iterations (JIT + tiered compilation settle)
///   - 200 measurement iterations (statistical stability)
///   - Best-of-two runs: if p95 exceeds budget, retry once with fresh warmup
///   - CI_PERF_TOLERANCE env var: multiplier for oversubscribed runners (default 1.0)
/// </summary>
[Trait("Phase", "5.4")]
[Trait("Category", "PerfBudget")]
public sealed class SecurityPerfBenchmarkTests
{
    // ═══════════════════════════════════════════════════════════════════
    // Tuning constants — CI-safe budgets (generous enough for slow CI runners)
    // ═══════════════════════════════════════════════════════════════════

    private const int WarmupIterations = 100;
    private const int MeasureIterations = 200;
    private const double EncryptP95BudgetMs = 2.0;
    private const double DecryptP95BudgetMs = 2.0;
    private const double PolicyEvalP95BudgetMs = 0.5;
    private const double HkdfStartupBudgetMs = 50.0;

    /// <summary>
    /// CI tolerance multiplier — set CI_PERF_TOLERANCE=1.5 on slow runners.
    /// </summary>
    private static double Tolerance =>
        double.TryParse(Environment.GetEnvironmentVariable("CI_PERF_TOLERANCE"), out var t) && t >= 1.0
            ? t
            : 1.0;

    // ═══════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════

    private static (IQuantumResistantEncryptionService svc, IKeyRingProvider ring) BuildService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:Encryption:Keys:0:KeyId"] = "perf-key",
                ["Security:Encryption:Keys:0:Material"] = "cGVyZi10ZXN0LWtleS1tYXRlcmlhbC0zMi1ieXRlcw==",
                ["Security:Encryption:Keys:0:Active"] = "true",
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(config);
        services.AddSingleton<IKeyRingProvider, KeyRingProvider>();
        services.AddSingleton<ISecurityAuditService, SecurityAuditService>();
        services.AddSingleton<IQuantumResistantEncryptionService, QuantumResistantEncryptionService>();

        var provider = services.BuildServiceProvider();
        return (provider.GetRequiredService<IQuantumResistantEncryptionService>(),
                provider.GetRequiredService<IKeyRingProvider>());
    }

    private static ClaimsPrincipal MakeUser(string role)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Name, "perf-user"),
            new Claim(ClaimTypes.Role, role),
        }, "test");
        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Returns p95 latency in milliseconds from a sorted array of tick measurements.
    /// </summary>
    private static double P95Ms(long[] sortedTicks)
    {
        var idx = (int)Math.Ceiling(sortedTicks.Length * 0.95) - 1;
        return sortedTicks[Math.Clamp(idx, 0, sortedTicks.Length - 1)] / (double)Stopwatch.Frequency * 1000.0;
    }

    /// <summary>
    /// Applies CI tolerance multiplier to a budget value.
    /// </summary>
    private static double Budget(double baseMs) => baseMs * Tolerance;

    // ═══════════════════════════════════════════════════════════════════
    // 1. Encrypt throughput — p95 ≤ 2 ms
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Encrypt_P95_WithinBudget()
    {
        var (svc, _) = BuildService();
        var payload = "SSN:123-45-6789|parcel:R123456|assessment:425000.00";
        var budget = Budget(EncryptP95BudgetMs);

        var p95 = await MeasureEncryptP95(svc, payload);

        // Best-of-two: retry once if first run exceeded budget (CI noise defense)
        if (p95 > budget)
            p95 = Math.Min(p95, await MeasureEncryptP95(svc, payload));

        p95.Should().BeLessThanOrEqualTo(budget,
            $"Encrypt p95 = {p95:F3} ms must be ≤ {budget:F1} ms (tolerance={Tolerance:F1}x)");
    }

    private static async Task<double> MeasureEncryptP95(IQuantumResistantEncryptionService svc, string payload)
    {
        for (var i = 0; i < WarmupIterations; i++)
            await svc.EncryptAsync(payload);

        var ticks = new long[MeasureIterations];
        for (var i = 0; i < MeasureIterations; i++)
        {
            var sw = Stopwatch.StartNew();
            await svc.EncryptAsync(payload);
            sw.Stop();
            ticks[i] = sw.ElapsedTicks;
        }

        Array.Sort(ticks);
        return P95Ms(ticks);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Decrypt throughput — p95 ≤ 2 ms
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task Decrypt_P95_WithinBudget()
    {
        var (svc, _) = BuildService();
        var payload = "SSN:123-45-6789|parcel:R123456|assessment:425000.00";
        var budget = Budget(DecryptP95BudgetMs);

        var p95 = await MeasureDecryptP95(svc, payload);

        if (p95 > budget)
            p95 = Math.Min(p95, await MeasureDecryptP95(svc, payload));

        p95.Should().BeLessThanOrEqualTo(budget,
            $"Decrypt p95 = {p95:F3} ms must be ≤ {budget:F1} ms (tolerance={Tolerance:F1}x)");
    }

    private static async Task<double> MeasureDecryptP95(IQuantumResistantEncryptionService svc, string payload)
    {
        var ciphertexts = new string[MeasureIterations + WarmupIterations];
        for (var i = 0; i < ciphertexts.Length; i++)
            ciphertexts[i] = await svc.EncryptAsync(payload);

        for (var i = 0; i < WarmupIterations; i++)
            await svc.DecryptAsync(ciphertexts[i]);

        var ticks = new long[MeasureIterations];
        for (var i = 0; i < MeasureIterations; i++)
        {
            var sw = Stopwatch.StartNew();
            await svc.DecryptAsync(ciphertexts[WarmupIterations + i]);
            sw.Stop();
            ticks[i] = sw.ElapsedTicks;
        }

        Array.Sort(ticks);
        return P95Ms(ticks);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Policy eval latency — p95 ≤ 0.5 ms
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task PolicyEval_P95_WithinBudget()
    {
        var engine = new ZeroTrustSecurityPolicyEngine();
        var user = MakeUser("Assessor");
        var budget = Budget(PolicyEvalP95BudgetMs);

        var p95 = await MeasurePolicyP95(engine, "property/parcels", "read", user);

        if (p95 > budget)
            p95 = Math.Min(p95, await MeasurePolicyP95(engine, "property/parcels", "read", user));

        p95.Should().BeLessThanOrEqualTo(budget,
            $"PolicyEval p95 = {p95:F3} ms must be ≤ {budget:F1} ms (tolerance={Tolerance:F1}x)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. PolicyEval deny path — p95 ≤ 0.5 ms (zero-trust deny-by-default)
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task PolicyEval_DenyPath_P95_WithinBudget()
    {
        var engine = new ZeroTrustSecurityPolicyEngine();
        var user = MakeUser("CustomerService"); // no access to security
        var budget = Budget(PolicyEvalP95BudgetMs);

        var p95 = await MeasurePolicyP95(engine, "security/keys", "rotate", user);

        if (p95 > budget)
            p95 = Math.Min(p95, await MeasurePolicyP95(engine, "security/keys", "rotate", user));

        p95.Should().BeLessThanOrEqualTo(budget,
            $"PolicyEval deny-path p95 = {p95:F3} ms must be ≤ {budget:F1} ms (tolerance={Tolerance:F1}x)");
    }

    private static async Task<double> MeasurePolicyP95(
        ZeroTrustSecurityPolicyEngine engine, string resource, string action, ClaimsPrincipal user)
    {
        for (var i = 0; i < WarmupIterations; i++)
            await engine.EvaluatePolicyAsync(resource, action, user);

        var ticks = new long[MeasureIterations];
        for (var i = 0; i < MeasureIterations; i++)
        {
            var sw = Stopwatch.StartNew();
            await engine.EvaluatePolicyAsync(resource, action, user);
            sw.Stop();
            ticks[i] = sw.ElapsedTicks;
        }

        Array.Sort(ticks);
        return P95Ms(ticks);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. HKDF key ring init — total ≤ 50 ms
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public void HkdfKeyRingInit_WithinBudget()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:Encryption:Keys:0:KeyId"] = "bench-k1",
                ["Security:Encryption:Keys:0:Material"] = "cGVyZi10ZXN0LWtleS1tYXRlcmlhbC0zMi1ieXRlcw==",
                ["Security:Encryption:Keys:0:Active"] = "false",
                ["Security:Encryption:Keys:1:KeyId"] = "bench-k2",
                ["Security:Encryption:Keys:1:Material"] = "c2Vjb25kLWtleS1tYXRlcmlhbC0zMi1ieXRlcyEh",
                ["Security:Encryption:Keys:1:Active"] = "false",
                ["Security:Encryption:Keys:2:KeyId"] = "bench-k3",
                ["Security:Encryption:Keys:2:Material"] = "dGhpcmQta2V5LW1hdGVyaWFsLTMyLWJ5dGVzISEh",
                ["Security:Encryption:Keys:2:Active"] = "true",
            })
            .Build();

        var loggerFactory = LoggerFactory.Create(b => { });
        var logger = loggerFactory.CreateLogger<KeyRingProvider>();
        var budget = Budget(HkdfStartupBudgetMs);

        // Warmup two instances to trigger JIT
        _ = new KeyRingProvider(config, logger);
        _ = new KeyRingProvider(config, logger);

        var sw = Stopwatch.StartNew();
        var ring = new KeyRingProvider(config, logger);
        sw.Stop();
        var ms = sw.Elapsed.TotalMilliseconds;

        // Best-of-two: retry if first run noisy
        if (ms > budget)
        {
            sw = Stopwatch.StartNew();
            ring = new KeyRingProvider(config, logger);
            sw.Stop();
            ms = Math.Min(ms, sw.Elapsed.TotalMilliseconds);
        }

        ring.KeyIds.Should().HaveCount(3);

        ms.Should().BeLessThanOrEqualTo(budget,
            $"HKDF key ring init = {ms:F3} ms must be ≤ {budget:F1} ms (3 keys, tolerance={Tolerance:F1}x)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. Round-trip encrypt+decrypt — p95 ≤ 4 ms combined
    // ═══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task RoundTrip_P95_WithinBudget()
    {
        var (svc, _) = BuildService();
        var payload = "county:benton|parcel:R123456|value:425000";
        var budget = Budget(4.0);

        var p95 = await MeasureRoundTripP95(svc, payload);

        if (p95 > budget)
            p95 = Math.Min(p95, await MeasureRoundTripP95(svc, payload));

        p95.Should().BeLessThanOrEqualTo(budget,
            $"Round-trip p95 = {p95:F3} ms must be ≤ {budget:F1} ms (tolerance={Tolerance:F1}x)");
    }

    private static async Task<double> MeasureRoundTripP95(IQuantumResistantEncryptionService svc, string payload)
    {
        for (var i = 0; i < WarmupIterations; i++)
        {
            var ct = await svc.EncryptAsync(payload);
            await svc.DecryptAsync(ct);
        }

        var ticks = new long[MeasureIterations];
        for (var i = 0; i < MeasureIterations; i++)
        {
            var sw = Stopwatch.StartNew();
            var ct = await svc.EncryptAsync(payload);
            await svc.DecryptAsync(ct);
            sw.Stop();
            ticks[i] = sw.ElapsedTicks;
        }

        Array.Sort(ticks);
        return P95Ms(ticks);
    }
}
