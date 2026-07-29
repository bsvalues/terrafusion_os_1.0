namespace TerraFusion.API.Configuration;

public class RustKernelsOptions
{
    public const string SectionName = "RustKernels";

    public string CostKernelPath { get; set; } = "";
    public string ValuationKernelPath { get; set; } = "";
    public string ValuationKernelManifestPath { get; set; } = "";
    public string ValuationKernelSourceCommit { get; set; } = "";
    public int TimeoutMs { get; set; } = 5000;
    public string ContractPackVersion { get; set; } = "1.0.0";
    public string ModuleApiVersion { get; set; } = "1.0.0";
    public bool Enabled { get; set; } = true;
}
