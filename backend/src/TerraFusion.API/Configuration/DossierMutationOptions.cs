namespace TerraFusion.API.Configuration;

/// <summary>
/// Exact identity and governed local selection for the Dossier-owned mutation-decision artifact.
/// </summary>
public sealed class DossierMutationOptions
{
    public const string SectionName = "DossierMutation";
    public const string ExpectedArtifactType = "dossier.mutation-decision.decision-module@1";
    public const string ExpectedContract = "dossier.mutation-decision@1.0.0";
    public const string ExpectedRepository = "bsvalues/terrafusion-dossier";
    public const string ExpectedSourceBranch = "main";
    public const string ExpectedCommit = "2c709fe2286b5c1e6bde43fcbc2a35111a456092";
    public const string ExpectedModulePath =
        "src/mutation-decision/decide-dossier-mutation.mjs";
    public const string ExpectedModuleFilename = "decide-dossier-mutation.mjs";
    public const string ExpectedModuleSha256 =
        "b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277";
    public const string ExpectedModuleGitBlob = "c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc";
    public const int ExpectedModuleLength = 18366;
    public const string ExpectedSchemaPath =
        "contract-compat/dossier.mutation-decision.v1/dossier.mutation-decision.v1.schema.json";
    public const string ExpectedSchemaFilename = "dossier.mutation-decision.v1.schema.json";
    public const string ExpectedSchemaSha256 =
        "48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3";
    public const string ExpectedSchemaGitBlob = "42fb0ce560a407ccee27ffd55f3d074dac182243";
    public const int ExpectedSchemaLength = 18611;
    public const string ExpectedSourceManifestPath =
        "contract-compat/dossier.mutation-decision.v1/manifest.json";
    public const string ExpectedSourceManifestSha256 =
        "dd9dfd1f0d6e31689ebbc90e2e7f1674be55b54eff433ec15d041b565d4f2444";
    public const string ExpectedSourceManifestGitBlob =
        "fa128c254b38366133d5017e50e7c7226f37401f";
    public const int ExpectedSourceManifestLength = 6921;
    public const string ExpectedPublishedManifestSha256 =
        "425d36d660ed2d46616a645d014dfa2906cfbac424b4ec0a6d7692ec43ba2716";
    public const int ExpectedPublishedManifestLength = 1493;
    public const string ExpectedContractSourceSha =
        "7cb96bf2ea5efea7caccae6d6e8c9f81f672412e";
    public const string ExpectedContractReviewedHeadSha =
        "285c458e66d47c109b31ee6b67a82b9ce24b8f55";
    public const string ExpectedSourceDtoSha256 =
        "58919613fb6da88763cfa12113c3950790c6daa8526ac7151c569320f3258f9a";
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath = ".terrafusion/runtime/dossier/mutation-decision";

    public DossierMutationMode Mode { get; set; } = DossierMutationMode.Disabled;
    public string NodeExecutablePath { get; internal set; } = string.Empty;
    public string ModulePath { get; internal set; } = string.Empty;
    public string SchemaPath { get; internal set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}

public enum DossierMutationMode
{
    Disabled = 0,
    LocalExact = 1,
}
