namespace TerraFusion.Core.Configuration;

/// <summary>
/// Runtime provider selection for the Muse LLM client.
/// Bound from the "Muse" configuration section at startup.
///
/// The provider name drives which Semantic Kernel connector is registered.
/// MuseService never reads this class — it only knows IMuseLlmClient.
///
/// Providers:
///   Local      — OpenAI-compatible local model (Ollama, LM Studio, etc.)
///                Sovereign default: no data leaves the building.
///   AzureOpenAI — Azure-hosted deployment via Azure OpenAI Service.
///                 FISMA-eligible when deployed in Azure Government.
///
/// Additional providers (OpenAI, Cohere, Mistral, etc.) can be added
/// by extending the registration switch in Program.cs — MuseService
/// requires no changes.
/// </summary>
public sealed class MuseLlmOptions
{
    public const string SectionName = "Muse";

    /// <summary>Provider discriminator. Default: "Local".</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>
    /// Model ID passed to the SK connector.
    /// Local: e.g. "llama3", "mistral", "phi3".
    /// AzureOpenAI: deployment name in the Azure resource.
    /// </summary>
    public string ModelId { get; set; } = "llama3";

    /// <summary>
    /// Base URL for the selected provider.
    /// Local default: http://localhost:11434/v1 (Ollama OpenAI-compat endpoint).
    /// AzureOpenAI: https://&lt;resource&gt;.openai.azure.com/
    /// </summary>
    public string? Endpoint { get; set; }

    /// <summary>
    /// API key. Local models typically ignore this (pass any non-empty string).
    /// Required for AzureOpenAI.
    /// </summary>
    public string? ApiKey { get; set; }
}
