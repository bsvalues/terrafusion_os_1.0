namespace TerraFusion.API.Configuration;

/// <summary>Explicit, nonproduction local inference admission. No ambient provider fallback.</summary>
public sealed class GptLocalInferenceOptions
{
    public const string SectionName = "GptLocalInference";
    public bool Enabled { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string EmbeddingEndpoint { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string EmbeddingModel { get; set; } = string.Empty;
    public int EmbeddingDimensions { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
}
