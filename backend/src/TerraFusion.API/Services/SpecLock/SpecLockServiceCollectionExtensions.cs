// =============================================================================
// SpecLock Service Collection Extensions (COSMIC TIER)
// =============================================================================
// DI registration for SpecLock runtime services.
// Supports MYTHIC (Cosign), GOD-TIER (Quorum), and COSMIC (TSS) modes.
// =============================================================================

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Text.Json;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Extension methods for registering SpecLock runtime services.
/// </summary>
public static class SpecLockServiceCollectionExtensions
{
    /// <summary>
    /// Adds SpecLock runtime services:
    /// - ISpecLockManifestLoader (singleton)
    /// - ISpecLockSignatureVerifier (mode-dependent: Cosign or TSS)
    /// - SpecLockGuardHostedService (startup guard)
    /// - SpecLockHealthCheck (ready gate)
    /// </summary>
    public static IServiceCollection AddSpecLockRuntime(this IServiceCollection services)
    {
        // Use PhysicalFileProvider rooted at content root so relative paths resolve.
        // This is registered as a named instance to avoid conflicts with other IFileProvider uses.
        services.AddSingleton<IFileProvider>(sp =>
        {
            var env = sp.GetRequiredService<IHostEnvironment>();
            return new PhysicalFileProvider(env.ContentRootPath);
        });

        services.AddSingleton<ISpecLockManifestLoader, SpecLockManifestLoader>();

        // Mode-dependent verifier registration
        services.AddSingleton<ISpecLockSignatureVerifier>(sp =>
        {
            var cfg = sp.GetRequiredService<IConfiguration>();
            var env = sp.GetRequiredService<IHostEnvironment>();
            var files = sp.GetRequiredService<IFileProvider>();
            var log = sp.GetRequiredService<ILoggerFactory>();

            // Check AUTHORITIES.json for mode
            var mode = GetSignatureMode(cfg, env);

            if (string.Equals(mode, "cosmic_tss", StringComparison.OrdinalIgnoreCase))
            {
                // COSMIC TIER: FROST-Ed25519 threshold signatures
                return new SpecLockTssVerifier(
                    log.CreateLogger<SpecLockTssVerifier>(),
                    cfg,
                    env);
            }

            // MYTHIC/GOD-TIER: Cosign-based verification
            return new SpecLockCosignVerifier(
                log.CreateLogger<SpecLockCosignVerifier>(),
                files,
                cfg,
                env);
        });

        services.AddHostedService<SpecLockGuardHostedService>();

        // 🔒 NO MERCY: State Mesh Guard (fail-closed startup enforcement)
        services.AddHostedService<StateMeshGuardHostedService>();

        // 🔒 Public Proof Service (PHASE A: Citizen-Verifiable Trust)
        services.AddHttpClient("LocalOps"); // used for proof snapshot (safe to fail)
        services.AddSingleton<IPublicReceiptProofService, PublicReceiptProofService>();

        return services;
    }

    /// <summary>
    /// Adds SpecLock health check to the health check builder.
    /// Tags: "ready", "ops", "speclock"
    /// </summary>
    public static IHealthChecksBuilder AddSpecLockCheck(this IHealthChecksBuilder builder)
    {
        return builder.AddCheck<SpecLockHealthCheck>(
            "speclock",
            tags: new[] { "ready", "ops", "speclock" });
    }

    private static string GetSignatureMode(IConfiguration cfg, IHostEnvironment env)
    {
        // First check environment variable
        var envMode = Environment.GetEnvironmentVariable("TF_SPECLOCK_SIGNATURE_MODE")
            ?? cfg["TF_SPECLOCK_SIGNATURE_MODE"];
        if (!string.IsNullOrEmpty(envMode))
            return envMode;

        // Check AUTHORITIES.json
        var authPath = Environment.GetEnvironmentVariable("TF_SPECLOCK_AUTHORITIES_PATH")
            ?? cfg["TF_SPECLOCK_AUTHORITIES_PATH"]
            ?? "docs/spec-lock/AUTHORITIES.json";

        var fullPath = Path.IsPathRooted(authPath)
            ? authPath
            : Path.Combine(env.ContentRootPath, authPath);

        if (!File.Exists(fullPath))
            return "mythic_cosign";

        try
        {
            var json = File.ReadAllText(fullPath);
            var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("mode", out var modeEl))
                return modeEl.GetString() ?? "mythic_cosign";
        }
        catch
        {
            // Ignore parse errors, default to mythic
        }

        return "mythic_cosign";
    }
}
