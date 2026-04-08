namespace TerraFusion.Core.Configuration;

/// <summary>
/// Runtime routing matrix for the Muse LLM router.
/// Bound from the "Muse:Router" configuration sub-section at startup.
///
/// When this section is absent or empty, MuseRouter falls back to the
/// single registered IMuseLlmClient — zero config required for single-model
/// deployments (existing behaviour preserved).
///
/// Example appsettings entry (4-lane sovereign portfolio):
/// <code>
/// "Muse": {
///   "Provider": "Local",
///   "ModelId": "devstral-small-2",
///   "Endpoint": "http://localhost:11434/v1",
///   "Router": {
///     "Routes": {
///       "DevAssist":   { "Provider": "Local",       "ModelId": "devstral-small-2" },
///       "Reasoning":   { "Provider": "Local",       "ModelId": "deepseek-r1"      },
///       "AgentTools":  { "Provider": "Local",       "ModelId": "qwen3.5"          },
///       "Document":    { "Provider": "AzureOpenAI", "ModelId": "gpt-4o"           }
///     }
///   }
/// }
/// </code>
///
/// Each route value mirrors <see cref="MuseLlmOptions"/> — the router creates
/// a keyed IMuseLlmClient per route entry during DI registration.
/// Omitting a task key routes that task to the default provider (key "*" or
/// the root Muse options).
/// </summary>
public sealed class MuseRouterOptions
{
    public const string SubSectionName = "Muse:Router";

    /// <summary>
    /// Per-task route overrides. Keys are <see cref="TerraFusion.Core.Interfaces.MuseTaskType"/>
    /// names (case-insensitive). Value is a provider+model+endpoint triple.
    /// </summary>
    public Dictionary<string, MuseRouteEntry> Routes { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

/// <summary>
/// One route entry: the provider discriminator + model for a single task lane.
/// Inherits endpoint/apiKey from the root Muse section when not specified here.
/// </summary>
public sealed class MuseRouteEntry
{
    public string Provider { get; set; } = "Local";
    public string ModelId { get; set; } = "llama3";
    public string? Endpoint { get; set; }
    public string? ApiKey { get; set; }
}
