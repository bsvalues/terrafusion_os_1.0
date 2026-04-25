// TerraFusion OS — IPD Rate Service
// Resolves the RCW 84.55.005 Limit Factor from the ReferenceSources table.
// Limit Factor = min(1.01, 1 + IPD%) where IPD is the annual Implicit Price
// Deflator published by WA OFM each September.
//
// When no data is seeded, falls back to 1.01 (the statutory cap) so calculations
// remain conservative and compliant. The caller can inspect DataSeeded to surface
// a banner to the operator.
//
// Ticket: LEV-136

using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Services;

// ─────────────────────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────────────────────

public interface IIpdRateService
{
    /// <summary>
    /// Returns the limit factor for the given tax year per RCW 84.55.005:
    /// <c>min(1.01, 1 + IPD%)</c>.
    /// Falls back to 1.01 (statutory cap) if no seeded data is found.
    /// </summary>
    Task<IpdLimitFactorResult> GetLimitFactorAsync(int taxYear, CancellationToken ct = default);

    /// <summary>
    /// Returns all active IPD reference rows, ordered by tax year descending.
    /// </summary>
    Task<IReadOnlyList<IpdAnnualRateRecord>> GetAllRatesAsync(CancellationToken ct = default);
}

// ─────────────────────────────────────────────────────────────────────────────
// Result records
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Resolved limit factor for a specific tax year.
/// </summary>
public record IpdLimitFactorResult(
    /// <summary>Computed limit factor: min(1.01, 1 + IPD/100).</summary>
    decimal LimitFactor,
    /// <summary>Raw IPD percentage (e.g. 4.24 for 4.24%). Null if not seeded.</summary>
    decimal? IpdPercent,
    /// <summary>True when the value came from the ReferenceSources table.</summary>
    bool DataSeeded,
    /// <summary>Issuing authority or fallback description.</summary>
    string Source,
    /// <summary>Human-readable note for audit/display.</summary>
    string Note
);

/// <summary>
/// One row of IPD reference data for display in the F1 panel.
/// </summary>
public record IpdAnnualRateRecord(
    int TaxYear,
    decimal IpdPercent,
    decimal LimitFactor,
    string IssuedBy,
    DateTime IssuedDate,
    DateTime IngestedAt,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? Notes
);

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

public sealed class IpdRateService : IIpdRateService
{
    private readonly LevyDbContext _db;

    public IpdRateService(LevyDbContext db) => _db = db;

    /// <inheritdoc />
    public async Task<IpdLimitFactorResult> GetLimitFactorAsync(
        int taxYear,
        CancellationToken ct = default)
    {
        var row = await _db.ReferenceSources
            .AsNoTracking()
            .Where(r => r.SourceType == ReferenceSourceType.Ipd
                     && r.TaxYear == taxYear
                     && r.IsActive
                     && r.Value != null)
            .OrderByDescending(r => r.IngestedAt)
            .FirstOrDefaultAsync(ct);

        if (row is null)
        {
            return new IpdLimitFactorResult(
                LimitFactor: 1.01m,
                IpdPercent: null,
                DataSeeded: false,
                Source: "Statutory cap (no IPD data seeded for this year)",
                Note: $"No active IPD reference found for tax year {taxYear}. " +
                      "Using maximum statutory limit factor 1.01 per RCW 84.55.005. " +
                      "Import the WA OFM September memo to resolve.");
        }

        var ipdPercent = row.Value!.Value;
        var limitFactor = Math.Round(Math.Min(1.01m, 1m + ipdPercent / 100m), 6);

        return new IpdLimitFactorResult(
            LimitFactor: limitFactor,
            IpdPercent: ipdPercent,
            DataSeeded: true,
            Source: row.IssuedBy,
            Note: $"IPD {ipdPercent:F4}% → Limit factor {limitFactor:F6} per RCW 84.55.005.");
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<IpdAnnualRateRecord>> GetAllRatesAsync(
        CancellationToken ct = default)
    {
        var rows = await _db.ReferenceSources
            .AsNoTracking()
            .Where(r => r.SourceType == ReferenceSourceType.Ipd
                     && r.IsActive
                     && r.Value != null)
            .OrderByDescending(r => r.TaxYear)
            .ToListAsync(ct);

        return rows.Select(r =>
        {
            var ipd = r.Value!.Value;
            var lf = Math.Round(Math.Min(1.01m, 1m + ipd / 100m), 6);
            return new IpdAnnualRateRecord(
                TaxYear: r.TaxYear,
                IpdPercent: ipd,
                LimitFactor: lf,
                IssuedBy: r.IssuedBy,
                IssuedDate: r.IssuedDate,
                IngestedAt: r.IngestedAt,
                ReviewedBy: r.ReviewedBy,
                ReviewedAt: r.ReviewedAt,
                Notes: r.Notes);
        }).ToList().AsReadOnly();
    }
}
