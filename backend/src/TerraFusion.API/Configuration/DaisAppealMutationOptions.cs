namespace TerraFusion.API.Configuration;

/// <summary>
/// Exact identity of the Dais-owned appeal-mutation decision artifact.
/// This staging child does not register or activate the runtime.
/// </summary>
public sealed class DaisAppealMutationOptions
{
    public const string SectionName = "DaisAppealMutation";
    public const string ExpectedArtifactType = "dais.appeal-mutation.decision-module@1";
    public const string ExpectedContract = "dais.appeal-mutation@1.0.0";
    public const string ExpectedRepository = "bsvalues/terrafusion-dais";
    public const string ExpectedSourceBranch = "main";
    public const string ExpectedCommit = "8a9cfc608bcda835126db2054bb7ba7ecf185275";
    public const string ExpectedModulePath =
        "src/appeal-mutation/decide-dais-appeal-mutation.mjs";
    public const string ExpectedModuleFilename = "decide-dais-appeal-mutation.mjs";
    public const string ExpectedModuleSha256 =
        "779ef37435e2deb8f181b3c34e0712c35829b7a123f047752fc5bf09de331ff2";
    public const string ExpectedModuleGitBlob = "1c718ddd351e0f414cf09421d3377b5892938e97";
    public const int ExpectedModuleLength = 11009;
    public const string ExpectedSchemaPath =
        "contract-compat/dais.appeal-mutation.v1/dais.appeal-mutation.v1.schema.json";
    public const string ExpectedSchemaFilename = "dais.appeal-mutation.v1.schema.json";
    public const string ExpectedSchemaSha256 =
        "db8f1c93a598da7f9c454d5a43c275b849f2de8fc036e9be28c5c1da44432ce2";
    public const string ExpectedSchemaGitBlob = "ed8ba582bd8fbe949e7b12f80dd5850e127e7820";
    public const int ExpectedSchemaLength = 7950;
    public const string ExpectedSourceManifestPath =
        "contract-compat/dais.appeal-mutation.v1/manifest.json";
    public const string ExpectedSourceManifestSha256 =
        "8f4b6ae6bd445b6a4f563f549e6ffb7d04f65e3d3c981e0556e9436744e61ef8";
    public const string ExpectedSourceManifestGitBlob =
        "d947da54c73f4d741d957b85c81e09ebfe2a522c";
    public const int ExpectedSourceManifestLength = 5724;
    public const string ExpectedPublishedManifestSha256 =
        "c858e7cd390502bf1461cf7af6302916a7c437f5f4f47b17d379f49af114b825";
    public const int ExpectedPublishedManifestLength = 1465;
    public const string ExpectedContractSourceSha =
        "52744220509a54b6544e0fa193b6d09e8d93c159";
    public const string ExpectedContractReviewedHeadSha =
        "377ed29b84c4f46b623f61a64d7644f911f76db6";
    public const string ExpectedSourceDtoSha256 =
        "3c32db475a04cd08dd380b13cfeb9cdd6f793445f67981a009992845727cf843";
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath = ".terrafusion/runtime/dais/appeal-mutation";
}
