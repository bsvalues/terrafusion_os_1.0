using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Models;

namespace TerraFusion.CurrentUse.Services;

/// <summary>
/// Hash-chained audit trail service for CurrentUse mutations.
/// Every entry includes a SHA-256 hash of its content + the previous entry's hash,
/// creating a tamper-evident chain per parcel.
/// </summary>
public interface IAuditService
{
    Task RecordAsync(string parcelId, string action, object details, string performedBy, CancellationToken ct = default);
    Task<IReadOnlyList<CurrentUseAuditEntry>> GetHistoryAsync(string parcelId, CancellationToken ct = default);
    Task<bool> VerifyChainIntegrityAsync(string parcelId, CancellationToken ct = default);
}

public class AuditService : IAuditService
{
    private readonly CurrentUseDbContext _db;
    private readonly ILogger<AuditService> _logger;

    public AuditService(CurrentUseDbContext db, ILogger<AuditService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task RecordAsync(string parcelId, string action, object details, string performedBy, CancellationToken ct = default)
    {
        var detailsJson = JsonSerializer.Serialize(details);

        // Get the last entry's hash for this parcel (chain link)
        var lastEntry = await _db.AuditEntries
            .Where(e => e.ParcelId == parcelId)
            .OrderByDescending(e => e.Timestamp)
            .FirstOrDefaultAsync(ct);

        var previousHash = lastEntry?.Hash;
        var timestamp = DateTime.UtcNow;

        // Compute hash: SHA-256(parcelId + action + details + performedBy + timestamp + previousHash)
        var hashInput = $"{parcelId}|{action}|{detailsJson}|{performedBy}|{timestamp:O}|{previousHash ?? "GENESIS"}";
        var hash = ComputeSha256(hashInput);

        var entry = new CurrentUseAuditEntry
        {
            Id = Guid.NewGuid(),
            ParcelId = parcelId,
            Action = action,
            Details = detailsJson,
            PerformedBy = performedBy,
            Timestamp = timestamp,
            PreviousHash = previousHash,
            Hash = hash
        };

        _db.AuditEntries.Add(entry);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Audit: {Action} on {ParcelId} by {PerformedBy} (hash: {Hash})",
            action, parcelId, performedBy, hash[..12]);
    }

    public async Task<IReadOnlyList<CurrentUseAuditEntry>> GetHistoryAsync(string parcelId, CancellationToken ct = default)
    {
        return await _db.AuditEntries
            .Where(e => e.ParcelId == parcelId)
            .OrderBy(e => e.Timestamp)
            .ToListAsync(ct);
    }

    public async Task<bool> VerifyChainIntegrityAsync(string parcelId, CancellationToken ct = default)
    {
        var entries = await GetHistoryAsync(parcelId, ct);
        if (entries.Count == 0) return true;

        string? expectedPreviousHash = null;

        foreach (var entry in entries)
        {
            // Verify chain link
            if (entry.PreviousHash != expectedPreviousHash)
            {
                _logger.LogWarning(
                    "Audit chain broken for {ParcelId} at entry {EntryId}: expected previous hash {Expected}, got {Actual}",
                    parcelId, entry.Id, expectedPreviousHash ?? "null", entry.PreviousHash ?? "null");
                return false;
            }

            // Verify hash integrity
            var hashInput = $"{entry.ParcelId}|{entry.Action}|{entry.Details}|{entry.PerformedBy}|{entry.Timestamp:O}|{entry.PreviousHash ?? "GENESIS"}";
            var computedHash = ComputeSha256(hashInput);

            if (computedHash != entry.Hash)
            {
                _logger.LogWarning(
                    "Audit hash mismatch for {ParcelId} at entry {EntryId}: computed {Computed}, stored {Stored}",
                    parcelId, entry.Id, computedHash[..12], entry.Hash[..12]);
                return false;
            }

            expectedPreviousHash = entry.Hash;
        }

        return true;
    }

    private static string ComputeSha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
