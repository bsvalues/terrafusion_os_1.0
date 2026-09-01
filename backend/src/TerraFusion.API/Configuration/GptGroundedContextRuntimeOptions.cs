namespace TerraFusion.API.Configuration;

public sealed class GptGroundedContextRuntimeOptions
{
    public const string SectionName = "GptGroundedContextRuntime";
    public const string ExpectedArtifactType = "gpt.grounded-context.projection-module@1";
    public const string ExpectedContract = "gpt.grounded-context@1.0.0";
    public const string ExpectedRepository = "bsvalues/terrafusion-gpt";
    public const string ExpectedSourceBranch = "main";
    public const string ExpectedCommit = "550b50f27af6f0911f16c973cbb6fc57a20eb15a";
    public const string ExpectedModulePath =
        "src/grounded-context/project-gpt-grounded-context.mjs";
    public const string ExpectedModuleFilename = "project-gpt-grounded-context.mjs";
    public const string ExpectedModuleSha256 =
        "cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb";
    public const int ExpectedModuleLength = 8578;
    public const string ExpectedModuleGitBlob = "d81a8135caea1685ce02efd5acfdf1f9dfdd930a";
    public const string ExpectedSchemaPath =
        "contract-compat/gpt.grounded-context.v1/gpt.grounded-context.v1.schema.json";
    public const string ExpectedSchemaFilename = "gpt.grounded-context.v1.schema.json";
    public const string ExpectedSchemaSha256 =
        "da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019";
    public const int ExpectedSchemaLength = 3555;
    public const string ExpectedSchemaGitBlob = "42fc40dcb2d459a4b81fbaab4f71b33433402fb5";
    public const string ExpectedSourceManifestPath =
        "contract-compat/gpt.grounded-context.v1/manifest.json";
    public const string ExpectedSourceManifestSha256 =
        "b2c679b3ebb70c9e055cc80a7923a215a7c9c60753d2f2c0984c89b246d81bc1";
    public const int ExpectedSourceManifestLength = 4954;
    public const string ExpectedSourceManifestGitBlob = "fae097a93c2b7435de85e7643cdb15d4714ee9c8";
    public const string ExpectedExecutionManifestPath =
        "canon/GPT_GROUNDED_CONTEXT_EXECUTION_MANIFEST.json";
    public const int ExpectedExecutionManifestLength = 1618;
    public const string ExpectedExecutionManifestSha256 =
        "6d04e14674e4e91a1a5d12ba12f53684cbad0bcec17e4e53ec01d8287618794b";
    public const string ExpectedExecutionManifestGitBlob = "7a9ca7bf114f34f2562102efa8817fd37506b614";
    public const int ExpectedPublishedManifestLength = 1685;
    public const string ExpectedPublishedManifestSha256 =
        "f29c38f994edc434881e9d71de861e49c2ae300dcb0c1b3082fe206cf4a2ee75";
    public const string ExpectedContractSourceSha = "3b588b231098e7e4ce25056a4025e6f10ffbd0d6";
    public const string ExpectedSourceDtoSha256 =
        "a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e";
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath =
        ".terrafusion/runtime/gpt/grounded-context";

    public GptGroundedContextRuntimeMode Mode { get; set; } = GptGroundedContextRuntimeMode.Disabled;
    public int TimeoutSeconds { get; set; } = 30;

    // These paths are resolved only from the code-pinned OS-managed slot. Configuration cannot
    // redirect the runtime to a different module, schema, manifest, repository, or executable.
    public string ModulePath { get; internal set; } = string.Empty;
    public string SchemaPath { get; internal set; } = string.Empty;
    public string NodeExecutablePath { get; internal set; } = string.Empty;
}

public enum GptGroundedContextRuntimeMode
{
    Disabled = 0,
    LocalExact = 1,
}
