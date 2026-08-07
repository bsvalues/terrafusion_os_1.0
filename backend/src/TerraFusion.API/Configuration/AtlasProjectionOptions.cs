namespace TerraFusion.API.Configuration;

public sealed class AtlasProjectionOptions
{
    public const string SectionName = "AtlasProjection";
    public const string ExpectedModuleSha256 =
        "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46";

    public AtlasProjectionMode Mode { get; set; } = AtlasProjectionMode.Disabled;
    public string NodeExecutablePath { get; set; } = string.Empty;
    public string ModulePath { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}

public enum AtlasProjectionMode
{
    Disabled = 0,
    LocalExact = 1,
}
