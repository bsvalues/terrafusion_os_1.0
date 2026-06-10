namespace TerraFusion.Core.Sync.PacsAssessment;

/// <summary>
/// ASSESSMENT-VALUE-SEAL: streams current-year active-supplement
/// assessment value rows from live Harris PACS <c>property_val</c>.
/// </summary>
public interface IPacsAssessmentValueSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }
    string SourceQueryText { get; }

    IAsyncEnumerable<PacsSourceAssessmentValue> StreamAssessmentValuesAsync(
        CancellationToken cancellationToken);
}
