namespace TerraFusion.API.Configuration;

public sealed class DossierEvidenceRegistryReadOptions
{
    public const string SectionName = "DossierEvidenceRegistryRead";
    public const string ExpectedArtifactType = "dossier.evidence-registry-read.projection-module@1";
    public const string ExpectedContract = "dossier.evidence-registry-read@1.0.0";
    public const string ExpectedRepository = "bsvalues/terrafusion-dossier";
    public const string ExpectedSourceBranch = "main";
    public const string ExpectedCommit = "7558cfebfeea0c7b536251769b1d779c4558a763";
    public const string ExpectedModulePath =
        "src/evidence-registry/project-dossier-evidence-registry-read.mjs";
    public const string ExpectedModuleFilename = "project-dossier-evidence-registry-read.mjs";
    public const string ExpectedModuleSha256 =
        "bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b";
    public const int ExpectedModuleLength = 8901;
    public const string ExpectedSchemaPath =
        "contract-compat/dossier.evidence-registry-read.v1/dossier.evidence-registry-read.v1.schema.json";
    public const string ExpectedSchemaFilename = "dossier.evidence-registry-read.v1.schema.json";
    public const string ExpectedSchemaSha256 =
        "f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270";
    public const int ExpectedSchemaLength = 2851;
    public const string ExpectedSourceManifestPath =
        "contract-compat/dossier.evidence-registry-read.v1/manifest.json";
    public const string ExpectedSourceManifestSha256 =
        "0c8310e45a02face985fd9d628f16ff26bfac6b078107fa8f96e6f22f1ebcb07";
    public const string ExpectedContractSourceSha = "cfcd460d6387c7dc5aefbc83a389e74333cf0201";
    public const string ExpectedSourceDtoSha256 =
        "414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f";
    public const string ExpectedTransport = "local-os-managed-artifact-slot";
    public const string ArtifactSlotRelativePath =
        ".terrafusion/runtime/dossier/evidence-registry-read";

    // Staging is deliberately inert. A successor Work Order must implement and adopt a runtime.
    public DossierEvidenceRegistryReadMode Mode { get; set; } = DossierEvidenceRegistryReadMode.Disabled;
}

public enum DossierEvidenceRegistryReadMode
{
    Disabled = 0,
    LocalExact = 1,
}
