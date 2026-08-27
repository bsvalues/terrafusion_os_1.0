namespace TerraFusion.API.Configuration;

public sealed class DaisAppealMutationOptions
{
    public const string SectionName = "DaisAppealMutation";
    public const string ExpectedArtifactType = "dais.appeal-mutation.decision-module@1";
    public const string ExpectedContract = "dais.appeal-mutation@1.0.0";
    public const string ExpectedRepository = "bsvalues/terrafusion-dais";
    public const string ExpectedSourceBranch = "main";
    public const string ExpectedCommit = "8a9cfc608bcda835126db2054bb7ba7ecf185275";
    public const string ExpectedModulePath = "src/appeal-mutation/decide-dais-appeal-mutation.mjs";
    public const string ExpectedModuleFilename = "decide-dais-appeal-mutation.mjs";
    public const string ExpectedModuleSha256 =
        "779ef37435e2deb8f181b3c34e0712c35829b7a123f047752fc5bf09de331ff2";
    public const int ExpectedModuleLength = 11009;
    public const string ExpectedSchemaPath =
        "contract-compat/dais.appeal-mutation.v1/dais.appeal-mutation.v1.schema.json";
    public const string ExpectedSchemaFilename = "dais.appeal-mutation.v1.schema.json";
    public const string ExpectedSchemaSha256 =
        "db8f1c93a598da7f9c454d5a43c275b849f2de8fc036e9be28c5c1da44432ce2";
    public const int ExpectedSchemaLength = 7950;
    public const string ExpectedSourceManifestPath =
        "contract-compat/dais.appeal-mutation.v1/manifest.json";
    public const string ExpectedSourceManifestSha256 =
        "8f4b6ae6bd445b6a4f563f549e6ffb7d04f65e3d3c981e0556e9436744e61ef8";

    // Filled from the protected WO-SR-010E staging result before runtime adoption is committed.
    public const string ExpectedPublishedManifestSha256 = "PENDING_WO_SR_010E";
    public const int ExpectedPublishedManifestLength = 0;

    public const string ExpectedContractSourceSha =
        "52744220509a54b6544e0fa193b6d09e8d93c159";
    public const string ExpectedSourceDtoSha256 =
        "3c32db475a04cd08dd380b13cfeb9cdd6f793445f67981a009992845727cf843";
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath = ".terrafusion/runtime/dais/appeal-mutation";

    public DaisAppealMutationMode Mode { get; set; } = DaisAppealMutationMode.Disabled;
    public string NodeExecutablePath { get; internal set; } = string.Empty;
    public string ModulePath { get; internal set; } = string.Empty;
    public string SchemaPath { get; internal set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}

public enum DaisAppealMutationMode
{
    Disabled = 0,
    LocalExact = 1,
}
