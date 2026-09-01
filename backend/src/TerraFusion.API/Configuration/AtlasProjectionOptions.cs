namespace TerraFusion.API.Configuration;

public sealed class AtlasProjectionOptions
{
    public const string SectionName = "AtlasProjection";
    public const string ExpectedArtifactType = "atlas.spatial-read.projection-module@1";
    public const string ExpectedRepository = "bsvalues/terrafusion-atlas";
    public const string ExpectedCommit = "6736a53980c73d2b503ec71a440ad8e02aa43782";
    public const string ExpectedModulePath = "src/spatial-read/project-atlas-feature.mjs";
    public const string ExpectedModuleFilename = "project-atlas-feature.mjs";
    public const string ExpectedModuleSha256 =
        "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46";
    public const int ExpectedModuleLength = 917;
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath = ".terrafusion/runtime/atlas/spatial-read";

    public AtlasProjectionMode Mode { get; set; } = AtlasProjectionMode.Disabled;
    public string NodeExecutablePath { get; internal set; } = string.Empty;
    public string ModulePath { get; internal set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}

public enum AtlasProjectionMode
{
    Disabled = 0,
    LocalExact = 1,
}
