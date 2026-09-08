namespace TerraFusion.API.Configuration;

public class RustKernelsOptions
{
    public const string SectionName = "RustKernels";
    public const string ForgeValuationArtifactType = "terraforge.valuation-kernel.linux-x64-musl@1";
    public const string ForgeValuationProducerCommit = "3fc296da17aaca4c32dd9b727ab62d2d3725d789";
    public const string ForgeValuationCanonicalSourceCommit = "24059c3642339f36877cb454ca63683180915b71";
    public const string ForgeValuationProducerManifestSha256 = "3d83a4a998eabb30b2993e6c777ae5924ca2a7e6f1bd915f7698606fd077fcd6";
    public const string ForgeValuationExecutableSha256 = "a371d8f421b66cd2f83073ed108c885facc97323f9a351547d7293259978c298";

    // Independently admitted protected-main Windows Actions artifact, run34177762622/1.
    // Exact receipt and separate Linux producer evidence are recorded in the active EO.
    // Configuration cannot repin this identity; paths remain separately opt-in below.
    public const string ForgeCostIncomeCanonicalSourceCommit = "5216af45155954ac27a1acbf04b22085019380c1";
    public const string ForgeCostIncomeProducerCommit = "5216af45155954ac27a1acbf04b22085019380c1";
    public const string ForgeCostIncomeProducerManifestSha256 = "9ab975d946f03862159fff95a57e68d3c0fde5767a9af5003b1a549d002c82f7";
    public const string ForgeCostIncomeExecutableSha256 = "dc8a53d2f85a34ae0ddec38e173f83d8c68bd41ba3cea90aba6275363e0ef1be";
    public const string ForgeCostIncomeSpecificationSha256 = "8607b1d52c01ced00b0aec104db26b7f4de9a24dec529e948eaee5588a2baaa2";
    public const string ForgeCostIncomeSourceClosureSha256 = "e5e744804146c838e1ba1a302bb254ed4747be3c7404555367754b612ec16846";
    public const string ForgeCostIncomeDependencyClosureSha256 = "0ad27c47deecea65f88df4b74cba490a0fa69794e33803c40475f3da2e639776";
    public const string ForgeCostIncomeTarget = "x86_64-pc-windows-msvc";
    public const string ForgeCostIncomeWorkflowRunId = "34177762622";
    public const string ForgeCostIncomeWorkflowRunAttempt = "1";
    public const string ForgeCostIncomeArtifactId = "10037872870";
    public const string ForgeCostIncomeArchiveSha256 = "986eb5b52791b79273ee485c034a99c859e33a2649fb7979cca5f1d2c05efdce";
    public const string ForgeCostIncomeReceiptSha256 = "440715247fb5cd083a55460e68fc652cc756c3517ef363c3c1b1bc151a0d159d";

    // Separate opt-in paths: never inherit the historical valuate executable or enable a runtime.
    public string CostIncomeKernelPath { get; set; } = "";
    public string CostIncomeKernelManifestPath { get; set; } = "";
    public string CostIncomeKernelReceiptPath { get; set; } = "";
    public string CostIncomeKernelSourceCommit { get; set; } = ForgeCostIncomeCanonicalSourceCommit;
    public string CostIncomeKernelProducerCommit { get; set; } = ForgeCostIncomeProducerCommit;
    public string CostIncomeKernelProducerManifestSha256 { get; set; } = ForgeCostIncomeProducerManifestSha256;
    public string CostIncomeKernelExecutableSha256 { get; set; } = ForgeCostIncomeExecutableSha256;

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
