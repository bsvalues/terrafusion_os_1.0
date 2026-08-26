namespace TerraFusion.API.Configuration;

public sealed class DaisAppealWorkflowOptions
{
    public const string SectionName = "DaisAppealWorkflow";
    public const string ExpectedArtifactType = "dais.appeal-workflow.projection-module@1";
    public const string ExpectedContract = "dais.appeal-workflow@1.0.0";
    public const string ExpectedRepository = "bsvalues/terrafusion-dais";
    public const string ExpectedSourceBranch = "main";
    public const string ExpectedCommit = "6932bbbf014cf70d7362e070a1dad2a8a680ad47";
    public const string ExpectedModulePath = "src/appeal-workflow/project-dais-appeal-workflow.mjs";
    public const string ExpectedModuleFilename = "project-dais-appeal-workflow.mjs";
    public const string ExpectedModuleSha256 =
        "5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb";
    public const int ExpectedModuleLength = 9269;
    public const string ExpectedSchemaPath =
        "contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json";
    public const string ExpectedSchemaFilename = "dais.appeal-workflow.v1.schema.json";
    public const string ExpectedSchemaSha256 =
        "b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c";
    public const int ExpectedSchemaLength = 3496;
    public const string ExpectedSourceManifestPath =
        "contract-compat/dais.appeal-workflow.v1/manifest.json";
    public const string ExpectedSourceManifestSha256 =
        "6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859";
    public const string ExpectedPublishedManifestSha256 =
        "e9ffd2acd811d7f2d309929757661f7f5dd3873b1027fa1af500b0d7eadb9186";
    public const int ExpectedPublishedManifestLength = 1161;
    public const string ExpectedContractSourceSha = "e57b1eca9c3291d10203efaa1fd586bcbce13f94";
    public const string ExpectedSourceDtoSha256 =
        "c9bb02054fc5a211ed609a3e9d7fe604e34cd0613701a57f6f2788d312348f47";
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath = ".terrafusion/runtime/dais/appeal-workflow";

    // Staging alone must not activate the runtime; selection remains explicit and fail closed.
    public DaisAppealWorkflowMode Mode { get; set; } = DaisAppealWorkflowMode.Disabled;
    public string NodeExecutablePath { get; internal set; } = string.Empty;
    public string ModulePath { get; internal set; } = string.Empty;
    public string SchemaPath { get; internal set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}

public enum DaisAppealWorkflowMode
{
    Disabled = 0,
    LocalExact = 1,
}
