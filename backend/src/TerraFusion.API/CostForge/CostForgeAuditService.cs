using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.CostForge;

/// <summary>
/// SHA-256 hash-chained audit trail for CostForge operations.
/// Every valuation calculation, batch operation, and configuration change
/// is recorded with tamper-evident integrity.
/// </summary>
public interface ICostForgeAuditService
{
    Task RecordCalculationAsync(CostForgeAuditEntry entry);
    Task RecordBatchOperationAsync(string jobId, string operation, int recordCount, string userId);
    Task<IReadOnlyList<CostForgeAuditEntry>> GetAuditTrailAsync(string? parcelNumber, int limit = 50);
    Task<bool> VerifyChainIntegrityAsync(int lastN = 100);
}

public sealed class CostForgeAuditService : ICostForgeAuditService
{
    private readonly List<CostForgeAuditEntry> _entries = new();
    private readonly SemaphoreSlim _lock = new(1, 1);
    private string _lastHash = "GENESIS";

    public async Task RecordCalculationAsync(CostForgeAuditEntry entry)
    {
        await _lock.WaitAsync();
        try
        {
            entry = entry with
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTime.UtcNow,
                PreviousHash = _lastHash,
            };
            entry = entry with { Hash = ComputeHash(entry) };
            _lastHash = entry.Hash;
            _entries.Add(entry);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task RecordBatchOperationAsync(string jobId, string operation, int recordCount, string userId)
    {
        var entry = new CostForgeAuditEntry
        {
            Operation = $"BATCH:{operation}",
            ParcelNumber = $"JOB:{jobId}",
            UserId = userId,
            Details = JsonSerializer.Serialize(new { jobId, operation, recordCount }),
        };
        await RecordCalculationAsync(entry);
    }

    public Task<IReadOnlyList<CostForgeAuditEntry>> GetAuditTrailAsync(string? parcelNumber, int limit = 50)
    {
        IEnumerable<CostForgeAuditEntry> query = _entries.AsEnumerable().Reverse();

        if (!string.IsNullOrWhiteSpace(parcelNumber))
        {
            query = query.Where(e => e.ParcelNumber == parcelNumber);
        }

        var result = query.Take(limit).ToList();
        return Task.FromResult<IReadOnlyList<CostForgeAuditEntry>>(result);
    }

    public Task<bool> VerifyChainIntegrityAsync(int lastN = 100)
    {
        var entriesToCheck = _entries.TakeLast(lastN).ToList();
        if (entriesToCheck.Count < 2)
            return Task.FromResult(true);

        for (int i = 1; i < entriesToCheck.Count; i++)
        {
            var current = entriesToCheck[i];
            var previous = entriesToCheck[i - 1];

            // Verify chain link
            if (current.PreviousHash != previous.Hash)
                return Task.FromResult(false);

            // Verify hash integrity
            var expectedHash = ComputeHash(current with { Hash = "" });
            if (current.Hash != expectedHash)
                return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }

    private static string ComputeHash(CostForgeAuditEntry entry)
    {
        var payload = $"{entry.Id}|{entry.Timestamp:O}|{entry.Operation}|{entry.ParcelNumber}|{entry.UserId}|{entry.Details}|{entry.PreviousHash}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

public sealed record CostForgeAuditEntry
{
    public Guid Id { get; init; }
    public DateTime Timestamp { get; init; }
    public string Operation { get; init; } = "";
    public string ParcelNumber { get; init; } = "";
    public string UserId { get; init; } = "";
    public string Details { get; init; } = "";
    public string PreviousHash { get; init; } = "";
    public string Hash { get; init; } = "";
}
