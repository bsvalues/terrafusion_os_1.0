namespace TerraFusion.Core.Services;

public interface IGovernanceExportService
{
    System.Threading.Tasks.Task<GovernancePackage> BuildDorPackageAsync(Guid countyId, DateTime from, DateTime to, CancellationToken ct = default);
    System.Threading.Tasks.Task<GovernancePackage> BuildLegislativeAuditPackageAsync(Guid countyId, int years, CancellationToken ct = default);
    System.Threading.Tasks.Task<ProvenanceReport> BuildProvenanceReportAsync(Guid countyId, CancellationToken ct = default);
}

public record GovernancePackage(
    string PackageType,
    Guid CountyId,
    DateTime GeneratedAt,
    object Data);

public record ProvenanceReport(
    Guid CountyId,
    DateTime GeneratedAt,
    IReadOnlyList<ProvenanceEntry> Entries);

public record ProvenanceEntry(
    string BuildingType,
    string RevalArea,
    decimal CurrentRate,
    DateTime LastCalibratedAt,
    string CalibratedBy,
    int EvidenceAgeMonths,
    string EvidenceStatus);
