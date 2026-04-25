// TerraFusion OS — IPD Reference Data Seeder
// Seeds known WA OFM Implicit Price Deflator (IPD) values into ReferenceSources.
// This is authoritative public reference data, NOT dev-only sample data.
// Always runs on startup if no IPD rows exist (idempotent).
//
// Source: WA Office of Financial Management, Property Tax Division — September memo
// Statutory basis: RCW 84.55.005, WAC 458-19-005
//
// WA OFM IPD values (announced September of the assessment year):
//   Tax Year 2022: 5.89% → Limit Factor 1.010000
//   Tax Year 2023: 7.67% → Limit Factor 1.010000
//   Tax Year 2024: 6.08% → Limit Factor 1.010000
//   Tax Year 2025: 4.24% → Limit Factor 1.010000
//   Tax Year 2026: 2.17% → Limit Factor 1.010000
// All recent years exceed the 1% cap, so Limit Factor = 1.01 for all.
//
// Ticket: LEV-136

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.Levy.Seeds;

/// <summary>
/// Idempotent seeder for WA OFM IPD reference data.
/// Runs unconditionally on startup (reference data, not dev-only fixtures).
/// </summary>
public sealed class IpdReferenceDataSeeder
{
    private readonly LevyDbContext _db;
    private readonly ILogger<IpdReferenceDataSeeder> _logger;

    // Deterministic ingest timestamp so rows are repeatable.
    private static readonly DateTime SeedIngestedAt =
        new DateTime(2026, 4, 19, 0, 0, 0, DateTimeKind.Utc);

    public IpdReferenceDataSeeder(LevyDbContext db, ILogger<IpdReferenceDataSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Seeds IPD rows if none exist. Safe to call multiple times.
    /// </summary>
    public async Task SeedAsync(CancellationToken ct = default)
    {
        var anyExists = await _db.ReferenceSources
            .AnyAsync(r => r.SourceType == ReferenceSourceType.Ipd, ct);

        if (anyExists)
        {
            _logger.LogDebug("[IpdSeeder] IPD reference rows already present — skipping seed.");
            return;
        }

        _logger.LogInformation("[IpdSeeder] Seeding WA OFM IPD reference data for tax years 2022–2026.");

        var rows = BuildRows();
        _db.ReferenceSources.AddRange(rows);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[IpdSeeder] Seeded {Count} IPD reference rows.", rows.Count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Static data: WA OFM IPD percentages per tax year
    // Source: https://ofm.wa.gov/washington-data-research/economy-revenue/
    //         washington-economic-and-revenue-forecast-program/forecast-memos
    // Each value announced September of the prior year.
    // ─────────────────────────────────────────────────────────────────────────

    private static readonly (int TaxYear, decimal IpdPercent, DateTime IssuedDate)[] KnownRates =
    [
        (2022, 5.89m,  new DateTime(2021, 9, 1, 0, 0, 0, DateTimeKind.Utc)),
        (2023, 7.67m,  new DateTime(2022, 9, 1, 0, 0, 0, DateTimeKind.Utc)),
        (2024, 6.08m,  new DateTime(2023, 9, 1, 0, 0, 0, DateTimeKind.Utc)),
        (2025, 4.24m,  new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc)),
        (2026, 2.17m,  new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc)),
    ];

    private List<ReferenceSource> BuildRows()
    {
        var list = new List<ReferenceSource>(KnownRates.Length);
        foreach (var (year, ipd, issued) in KnownRates)
        {
            list.Add(new ReferenceSource
            {
                Id = GuidForYear(year),
                CountyId = "WA",                 // Statewide — not county-specific
                SourceType = ReferenceSourceType.Ipd,
                TaxYear = year,
                Citation = "RCW 84.55.005",
                DistrictCode = null,             // Applies to all districts
                Value = ipd,
                ValueUnit = "percent",
                ValueJson = null,
                SourceUrl = "https://ofm.wa.gov/washington-data-research/economy-revenue/washington-economic-and-revenue-forecast-program/forecast-memos",
                IssuedBy = "WA Office of Financial Management (OFM)",
                IssuedDate = issued,
                IngestedAt = SeedIngestedAt,
                IngestedBy = "TerraFusion-seed-v1",
                ReviewedBy = null,
                ReviewedAt = null,
                IsActive = true,
                Notes = $"WA OFM September {issued.Year} IPD memo: {ipd:F2}% IPD for tax year {year}."
            });
        }
        return list;
    }

    /// <summary>
    /// Deterministic GUID per tax year so the seeder is repeatable
    /// (idempotent by <see cref="anyExists"/> check, but stable IDs are good practice).
    /// </summary>
    private static Guid GuidForYear(int year)
    {
        // Name-based UUID v5 (SHA-1) using DNS namespace convention.
        // Input: "terrafusion.levy.ipd.{year}"
        var name = $"terrafusion.levy.ipd.{year}";
        using var sha = System.Security.Cryptography.SHA1.Create();
        var hash = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(name));
        // Copy first 16 bytes of SHA-1 into a GUID.
        var bytes = new byte[16];
        Array.Copy(hash, bytes, 16);
        // Set version 5 (0101) in bits 4-7 of byte 6.
        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x50);
        // Set variant 10xx in bits 6-7 of byte 8.
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80);
        return new Guid(bytes);
    }
}
