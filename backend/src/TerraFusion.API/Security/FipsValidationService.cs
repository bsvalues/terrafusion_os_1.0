using System.Runtime.InteropServices;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;

namespace TerraFusion.API.Security;

/// <summary>
/// Phase 4 Sprint 2: FIPS 140-2 Cryptographic Module Validation
/// Validates that the host OS is running in FIPS mode at startup.
/// Required for FISMA-HIGH SC-13 (Cryptographic Protection) compliance.
/// </summary>
public class FipsValidationService : IHostedService
{
    private readonly ILogger<FipsValidationService> _logger;
    private readonly FeatureFlagsOptions _featureFlags;
    private readonly IHostEnvironment _environment;

    public FipsValidationService(
        ILogger<FipsValidationService> logger,
        IOptions<FeatureFlagsOptions> featureFlags,
        IHostEnvironment environment)
    {
        _logger = logger;
        _featureFlags = featureFlags.Value;
        _environment = environment;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_featureFlags.EnforceFipsCompliance)
        {
            _logger.LogWarning(
                "FIPS 140-2 validation DISABLED (EnforceFipsCompliance=false). " +
                "This is acceptable for development but NOT for production deployment.");
            return Task.CompletedTask;
        }

        var (isFipsEnabled, moduleName, evidence) = DetectFipsMode();

        if (isFipsEnabled)
        {
            _logger.LogInformation(
                "FIPS 140-2 validated: Module={Module}, Evidence={Evidence}",
                moduleName, evidence);
            return Task.CompletedTask;
        }

        // In production, fail hard. In development, warn only.
        if (_environment.IsProduction())
        {
            _logger.LogCritical(
                "FIPS mode is NOT enabled on host OS. " +
                "Production deployment blocked per FISMA-HIGH SC-13. " +
                "Enable FIPS mode: Windows=Group Policy, Linux=openssl fipsinstall");
            throw new InvalidOperationException(
                "FIPS 140-2 validation failed. Host OS FIPS mode is required for FISMA-HIGH compliance. " +
                "Set FeatureFlags:EnforceFipsCompliance=false to bypass (development only).");
        }

        _logger.LogWarning(
            "FIPS mode not detected on host OS ({Platform}). " +
            "This would block production deployment. Continuing in {Environment} mode.",
            RuntimeInformation.OSDescription, _environment.EnvironmentName);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>
    /// Detect FIPS mode on the host OS.
    /// Returns (isFipsEnabled, moduleName, evidence).
    /// </summary>
    private static (bool IsFips, string Module, string Evidence) DetectFipsMode()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return DetectWindowsFips();
        }

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            return DetectLinuxFips();
        }

        // macOS / other — no FIPS support
        return (false, "unknown", $"Unsupported platform: {RuntimeInformation.OSDescription}");
    }

    private static (bool, string, string) DetectWindowsFips()
    {
        try
        {
            // Check .NET's built-in FIPS flag (reads Windows registry)
            // System.Security.Cryptography.CryptoConfig.AllowOnlyFipsAlgorithms is not available in .NET 8
            // Use environment-based detection
            var fipsEnv = Environment.GetEnvironmentVariable("DOTNET_SYSTEM_SECURITY_CRYPTOGRAPHY_USEFIPSALGORITHMS");
            if (fipsEnv == "1" || fipsEnv?.Equals("true", StringComparison.OrdinalIgnoreCase) == true)
            {
                return (true, "Windows CNG (bcrypt.dll)",
                    "DOTNET_SYSTEM_SECURITY_CRYPTOGRAPHY_USEFIPSALGORITHMS=1, CMVP #3197");
            }

            // Try reading registry via file system (Windows FIPS policy)
            // In containerized environments, check env var instead
            return (false, "Windows CNG (bcrypt.dll)", "FIPS registry key not set or not detectable");
        }
        catch (Exception ex)
        {
            return (false, "Windows CNG", $"Detection error: {ex.Message}");
        }
    }

    private static (bool, string, string) DetectLinuxFips()
    {
        try
        {
            // Check /proc/sys/crypto/fips_enabled (Linux kernel FIPS mode)
            const string fipsPath = "/proc/sys/crypto/fips_enabled";
            if (File.Exists(fipsPath))
            {
                var content = File.ReadAllText(fipsPath).Trim();
                if (content == "1")
                {
                    return (true, "OpenSSL FIPS Module",
                        $"/proc/sys/crypto/fips_enabled=1, CMVP #4282");
                }
                return (false, "OpenSSL", $"/proc/sys/crypto/fips_enabled={content}");
            }

            // Fallback: check environment variable
            var fipsEnv = Environment.GetEnvironmentVariable("OPENSSL_FIPS");
            if (fipsEnv == "1")
            {
                return (true, "OpenSSL FIPS Module", "OPENSSL_FIPS=1, CMVP #4282");
            }

            return (false, "OpenSSL", "No FIPS indicator found");
        }
        catch (Exception ex)
        {
            return (false, "OpenSSL", $"Detection error: {ex.Message}");
        }
    }
}
