// TerraFusion OS – Arc Constellation (RAG Configuration)
// Genesis Era – Phase 9: GPT/RAG Operational Hardening

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Configuration;

/// <summary>
/// Centralized configuration for GPT/RAG subsystem.
/// Part of Arc Constellation – manages embedding providers, RAG datasets, and operational modes.
/// </summary>
public class GptRagOptions
{
    /// <summary>
    /// Whether to use real (OpenAI) embeddings vs simulated embeddings.
    /// Determined by presence of OPENAI_API_KEY environment variable.
    /// </summary>
    public bool UseRealEmbeddings { get; set; }

    /// <summary>
    /// The active embedding provider: "OpenAI" or "Simulated"
    /// </summary>
    public string EmbeddingProvider { get; set; } = "Simulated";

    /// <summary>
    /// The embedding model to use (e.g., "text-embedding-3-small")
    /// </summary>
    public string EmbeddingModel { get; set; } = "text-embedding-3-small";

    /// <summary>
    /// List of RAG dataset IDs that should be available
    /// </summary>
    public List<string> RagDatasets { get; set; } = new() { "benton_cama_basics", "assessment-standards" };

    /// <summary>
    /// Base URL for TerraFusion API (used by clients)
    /// </summary>
    public string ApiBaseUrl { get; set; } = "http://localhost:5000";

    /// <summary>
    /// Whether Herald-style diagnostic logging is enabled
    /// </summary>
    public bool EnableHeraldLogging { get; set; } = true;

    /// <summary>
    /// Whether to show disclaimers when RAG datasets are not indexed
    /// </summary>
    public bool ShowMissingDatasetDisclaimers { get; set; } = true;

    /// <summary>
    /// Create GptRagOptions from configuration and environment.
    /// Automatically detects OPENAI_API_KEY to determine embedding provider.
    /// </summary>
    public static GptRagOptions FromConfiguration(IConfiguration configuration)
    {
        var options = new GptRagOptions();

        // Check for OpenAI API key - primary determinant of embedding mode
        var openAiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")
            ?? configuration["OpenAI:ApiKey"];

        options.UseRealEmbeddings = !string.IsNullOrEmpty(openAiKey);
        options.EmbeddingProvider = options.UseRealEmbeddings ? "OpenAI" : "Simulated";

        // Read additional config values
        options.EmbeddingModel = configuration["GptRag:EmbeddingModel"]
            ?? options.EmbeddingModel;

        options.ApiBaseUrl = Environment.GetEnvironmentVariable("TF_API_BASE_URL")
            ?? configuration["GptRag:ApiBaseUrl"]
            ?? options.ApiBaseUrl;

        options.EnableHeraldLogging = configuration.GetValue("GptRag:EnableHeraldLogging", true);
        options.ShowMissingDatasetDisclaimers = configuration.GetValue("GptRag:ShowMissingDatasetDisclaimers", true);

        // Parse RAG datasets from config
        var datasetsConfig = configuration.GetSection("GptRag:RagDatasets").Get<List<string>>();
        if (datasetsConfig != null && datasetsConfig.Count > 0)
        {
            options.RagDatasets = datasetsConfig;
        }

        return options;
    }

    /// <summary>
    /// Log the current configuration using Herald Constellation style.
    /// Called at startup to make embedding mode visible.
    /// </summary>
    public void LogConfiguration(ILogger logger)
    {
        if (!EnableHeraldLogging) return;

        LogHeraldStartupBanner(logger, gptConfigCount: null);
    }

    /// <summary>
    /// Log the comprehensive Herald startup banner with all system status.
    /// Phase 12.5: Enhanced DX with era branding, GPT config count, and DX commands.
    /// </summary>
    /// <param name="logger">Logger instance</param>
    /// <param name="gptConfigCount">Number of GPT configurations (optional, from IGPTConfigurationService)</param>
    /// <param name="gptConfigNames">Names of configured GPTs (optional)</param>
    public void LogHeraldStartupBanner(ILogger logger, int? gptConfigCount, IEnumerable<string>? gptConfigNames = null)
    {
        if (!EnableHeraldLogging) return;

        const string era = "TerraFusion OS 1.0 – Genesis Era";

        logger.LogInformation("");
        logger.LogInformation("╔══════════════════════════════════════════════════════════════════════════╗");
        logger.LogInformation("║  📢 HERALD STATUS – {Era}                           ║", era.PadRight(30));
        logger.LogInformation("╠══════════════════════════════════════════════════════════════════════════╣");

        // Embedding mode
        if (UseRealEmbeddings)
        {
            logger.LogInformation("║  🟢 Embeddings: OpenAIEmbeddingService (OPENAI_API_KEY detected)         ║");
            logger.LogInformation("║     Model: {Model}                                                   ║", EmbeddingModel.PadRight(20));
        }
        else
        {
            logger.LogInformation("║  🟡 Embeddings: SimulatedEmbeddingService (no OPENAI_API_KEY)            ║");
            logger.LogInformation("║     Safe dev/CI mode – deterministic, no external API calls             ║");
        }

        // RAG Datasets
        var datasetStr = string.Join(", ", RagDatasets.Select(d => $"{d} [NOT INDEXED]"));
        logger.LogInformation("║  📚 RAG datasets: {Datasets}                                    ║",
            datasetStr.Length > 40 ? datasetStr.Substring(0, 37) + "..." : datasetStr.PadRight(40));

        // GPT Configs
        if (gptConfigCount.HasValue)
        {
            var gptNames = gptConfigNames != null ? string.Join(", ", gptConfigNames) : "PropertyAssessmentGPT, ...";
            logger.LogInformation("║  🤖 GPT configs: {Count} configured ({Names})                            ║",
                gptConfigCount.Value, gptNames.Length > 30 ? gptNames.Substring(0, 27) + "..." : gptNames);
        }
        else
        {
            logger.LogInformation("║  🤖 GPT configs: Loading...                                              ║");
        }

        // DX Commands
        logger.LogInformation("╠══════════════════════════════════════════════════════════════════════════╣");
        logger.LogInformation("║  ✨ DX: make oneclick | make gpt-ingest | make dev                       ║");
        logger.LogInformation("╚══════════════════════════════════════════════════════════════════════════╝");
        logger.LogInformation("");
    }

    /// <summary>
    /// Get a summary string for the current configuration.
    /// </summary>
    public string GetSummary()
    {
        return $"EmbeddingProvider={EmbeddingProvider}, Model={EmbeddingModel}, " +
               $"Datasets=[{string.Join(",", RagDatasets)}], UseReal={UseRealEmbeddings}";
    }
}

/// <summary>
/// Extension methods for registering GptRagOptions in DI.
/// </summary>
public static class GptRagOptionsExtensions
{
    /// <summary>
    /// Add GptRagOptions to the service collection with automatic configuration.
    /// </summary>
    public static IServiceCollection AddGptRagOptions(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var options = GptRagOptions.FromConfiguration(configuration);
        services.AddSingleton(options);
        return services;
    }
}
