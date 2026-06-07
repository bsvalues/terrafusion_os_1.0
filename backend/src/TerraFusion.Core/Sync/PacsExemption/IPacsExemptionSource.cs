namespace TerraFusion.Core.Sync.PacsExemption;

/// <summary>
/// EXEMPTION-FACT-SEAL: streams current-year active-supplement exemption
/// facts and the exmpt_type dictionary from live Harris PACS.
/// </summary>
public interface IPacsExemptionSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceExemption> StreamExemptionsAsync(
        System.Threading.CancellationToken cancellationToken);

    IAsyncEnumerable<PacsSourceExemptionType> StreamExemptionTypesAsync(
        System.Threading.CancellationToken cancellationToken);
}
