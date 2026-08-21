namespace TerraFusion.API.Configuration;

public class RustKernelsOptions
{
    public const string SectionName = "RustKernels";
    public const string ForgeValuationArtifactType = "terraforge.valuation-kernel.linux-x64-musl@1";
    public const string ForgeValuationProducerCommit = "3fc296da17aaca4c32dd9b727ab62d2d3725d789";
    public const string ForgeValuationCanonicalSourceCommit = "24059c3642339f36877cb454ca63683180915b71";
    public const string ForgeValuationProducerManifestSha256 = "3d83a4a998eabb30b2993e6c777ae5924ca2a7e6f1bd915f7698606fd077fcd6";
    public const string ForgeValuationExecutableSha256 = "a371d8f421b66cd2f83073ed108c885facc97323f9a351547d7293259978c298";

    public string CostKernelPath { get; set; } = "";
    public string ValuationKernelPath { get; set; } =
        ".terrafusion/runtime/forge/valuation/terraforge-kernel-valuation";
    public string ValuationKernelManifestPath { get; set; } =
        ".terrafusion/runtime/forge/valuation/producer-manifest.json";
    public string ValuationKernelSourceCommit { get; set; } = ForgeValuationCanonicalSourceCommit;
    public string ValuationKernelArtifactType { get; set; } = ForgeValuationArtifactType;
    public string ValuationKernelProducerCommit { get; set; } = ForgeValuationProducerCommit;
    public string ValuationKernelProducerManifestSha256 { get; set; } =
        ForgeValuationProducerManifestSha256;
    public string ValuationKernelExecutableSha256 { get; set; } =
        ForgeValuationExecutableSha256;
    public int TimeoutMs { get; set; } = 5000;
    public int MaxStdinBytes { get; set; } = 64 * 1024;
    public int MaxStdoutBytes { get; set; } = 64 * 1024;
    public int MaxStderrBytes { get; set; } = 16 * 1024;
    public string ContractPackVersion { get; set; } = "1.0.0";
    public string ModuleApiVersion { get; set; } = "1.0.0";
    public bool Enabled { get; set; } = true;
    public ForgeCanonicalConsumerMode ForgeCanonicalConsumerMode { get; set; } =
        ForgeCanonicalConsumerMode.Disabled;
}

public enum ForgeCanonicalConsumerMode
{
    Disabled,
    Shadow,
}
