using Microsoft.Extensions.Configuration;

namespace TerraFusion.Consciousness.Services;

internal static class ConsciousnessRuntimePolicy
{
    internal const string NotConfiguredMessage =
        "Canonical consciousness runtime is not configured for this environment.";

    internal static bool IsCanonicalRuntimeEnabled(IConfiguration configuration)
    {
        return configuration.GetValue<bool>("Consciousness:EnableCanonicalRuntime");
    }

    internal static InvalidOperationException CreateNotConfiguredException()
    {
        return new InvalidOperationException(NotConfiguredMessage);
    }
}
