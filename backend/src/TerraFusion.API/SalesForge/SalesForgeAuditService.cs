using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.SalesForge;

/// <summary>
/// Hash-chained audit trail for all SalesForge mutations.
/// Every qualification decision, recommendation computation, and batch operation
/// is recorded with a SHA-256 hash chain for tamper-evident compliance.
/// </summary>
public sealed class SalesForgeAuditService
{
    private readonly ILogger<SalesForgeAuditService> _logger;
    private string _lastHash = "GENESIS";

    public SalesForgeAuditService(ILogger<SalesForgeAuditService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Record a qualification decision audit entry.
    /// </summary>
    public SalesForgeAuditEntry RecordQualificationDecision(
        Guid saleId,
        Guid countyId,
        string previousDecision,
        string newDecision,
        string decisionBy,
        string decisionSource)
    {
        return RecordEntry(new SalesForgeAuditEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTimeOffset.UtcNow,
            EventType = SalesAuditEventType.QualificationDecision,
            SaleId = saleId,
            CountyId = countyId,
            PreviousValue = previousDecision,
            NewValue = newDecision,
            Actor = decisionBy,
            Source = decisionSource,
        });
    }

    /// <summary>
    /// Record a batch compute-qualifications operation.
    /// </summary>
    public SalesForgeAuditEntry RecordBatchCompute(
        Guid countyId,
        int taxYear,
        int salesProcessed,
        int recommendationsGenerated,
        string actor)
    {
        return RecordEntry(new SalesForgeAuditEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTimeOffset.UtcNow,
            EventType = SalesAuditEventType.BatchCompute,
            CountyId = countyId,
            PreviousValue = $"taxYear={taxYear}",
            NewValue = $"processed={salesProcessed},recommendations={recommendationsGenerated}",
            Actor = actor,
            Source = "TerraForge",
        });
    }

    /// <summary>
    /// Record a batch apply-recommendations operation.
    /// </summary>
    public SalesForgeAuditEntry RecordBatchApply(
        Guid countyId,
        int taxYear,
        int salesApplied,
        string actor)
    {
        return RecordEntry(new SalesForgeAuditEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTimeOffset.UtcNow,
            EventType = SalesAuditEventType.BatchApply,
            CountyId = countyId,
            PreviousValue = $"taxYear={taxYear}",
            NewValue = $"applied={salesApplied}",
            Actor = actor,
            Source = "TerraForge",
        });
    }

    /// <summary>
    /// Record a ratio study export event.
    /// </summary>
    public SalesForgeAuditEntry RecordRatioStudyExport(
        Guid countyId,
        int taxYear,
        int salesIncluded,
        string actor)
    {
        return RecordEntry(new SalesForgeAuditEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTimeOffset.UtcNow,
            EventType = SalesAuditEventType.RatioStudyExport,
            CountyId = countyId,
            PreviousValue = $"taxYear={taxYear}",
            NewValue = $"salesIncluded={salesIncluded}",
            Actor = actor,
            Source = "TerraForge",
        });
    }

    private SalesForgeAuditEntry RecordEntry(SalesForgeAuditEntry entry)
    {
        entry.PreviousHash = _lastHash;
        entry.Hash = ComputeHash(entry);
        _lastHash = entry.Hash;

        _logger.LogInformation(
            "[SalesForge Audit] {EventType} | Sale={SaleId} County={CountyId} | Actor={Actor} | Hash={Hash}",
            entry.EventType, entry.SaleId, entry.CountyId, entry.Actor, entry.Hash[..12]);

        return entry;
    }

    private static string ComputeHash(SalesForgeAuditEntry entry)
    {
        var payload = JsonSerializer.Serialize(new
        {
            entry.Id,
            entry.Timestamp,
            entry.EventType,
            entry.SaleId,
            entry.CountyId,
            entry.PreviousValue,
            entry.NewValue,
            entry.Actor,
            entry.Source,
            entry.PreviousHash,
        });

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Verify the hash chain integrity of a sequence of audit entries.
    /// </summary>
    public static bool VerifyChain(IReadOnlyList<SalesForgeAuditEntry> entries)
    {
        for (int i = 0; i < entries.Count; i++)
        {
            var entry = entries[i];
            var expectedHash = ComputeHash(entry);
            if (entry.Hash != expectedHash) return false;

            if (i == 0)
            {
                if (entry.PreviousHash != "GENESIS") return false;
            }
            else
            {
                if (entry.PreviousHash != entries[i - 1].Hash) return false;
            }
        }
        return true;
    }
}

// ─── Audit Entry Model ────────────────────────────────────────────────────────

public sealed class SalesForgeAuditEntry
{
    public Guid Id { get; init; }
    public DateTimeOffset Timestamp { get; init; }
    public SalesAuditEventType EventType { get; init; }
    public Guid? SaleId { get; init; }
    public Guid CountyId { get; init; }
    public string PreviousValue { get; init; } = string.Empty;
    public string NewValue { get; init; } = string.Empty;
    public string Actor { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public string PreviousHash { get; set; } = string.Empty;
    public string Hash { get; set; } = string.Empty;
}

public enum SalesAuditEventType
{
    QualificationDecision,
    BatchCompute,
    BatchApply,
    RatioStudyExport,
    ManualOverride,
}
