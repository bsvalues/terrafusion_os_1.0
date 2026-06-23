namespace TerraFusion.Core.Entities.Forge;

/// <summary>Forge engine selection for shadow-first rollout (Forge:Engine flag).</summary>
public enum ForgeEngineMode
{
    /// <summary>Legacy AI-narrative path remains authoritative.</summary>
    AiNarrativeLegacy,

    /// <summary>The deterministic TF-native engine is authoritative.</summary>
    Native,

    /// <summary>Native computes in parallel for parity evidence; legacy stays authoritative (default).</summary>
    Shadow,
}

/// <summary>Rollout options for the Forge engine, parsed from the Forge:Engine configuration value.</summary>
public sealed record ForgeEngineOptions(ForgeEngineMode Mode)
{
    /// <summary>Parses the Forge:Engine value; defaults to Shadow (safe shadow-first rollout).</summary>
    public static ForgeEngineOptions FromConfiguration(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return new ForgeEngineOptions(ForgeEngineMode.Shadow);

        return value.Trim().ToLowerInvariant() switch
        {
            "native" => new ForgeEngineOptions(ForgeEngineMode.Native),
            "legacy" or "ainarrative" or "ainarrativelegacy" => new ForgeEngineOptions(ForgeEngineMode.AiNarrativeLegacy),
            "shadow" => new ForgeEngineOptions(ForgeEngineMode.Shadow),
            _ => new ForgeEngineOptions(ForgeEngineMode.Shadow),
        };
    }
}
