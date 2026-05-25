
using System.Text;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Exports;

public interface ICurrentUseExportService
{
    byte[] ExportSummaryCsv(CurrentUseOperationalSummaryDto summary);
}

public sealed class CurrentUseExportService : ICurrentUseExportService
{
    public byte[] ExportSummaryCsv(CurrentUseOperationalSummaryDto summary)
    {
        var sb = new StringBuilder();

        sb.AppendLine("Metric,Value");

        sb.AppendLine($"Classified Parcels,{summary.TotalClassifiedParcels}");
        sb.AppendLine($"Classified Acres,{summary.TotalClassifiedAcres}");
        sb.AppendLine($"Rollback Exposure,{summary.EstimatedTotalRollbackExposure}");
        sb.AppendLine($"Monitoring Count,{summary.ActiveMonitoringCount}");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
