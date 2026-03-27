using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Seeds;

/// <summary>
/// CARD-06: Dev-only seeder that projects PacsParcel rows into the canonical
/// Properties table so Dossier, Workbench, and any DB query against Properties
/// return data instead of an empty set.
///
/// Only runs when Properties table is empty (idempotent).
/// Only registered / called in Development environment.
/// NOT a replacement for production ETL via PacsDataSeeder + TerraFusionSync.
/// </summary>
public sealed class DevPropertySeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DevPropertySeeder> _logger;

    public DevPropertySeeder(TerraFusionDbContext db, ILogger<DevPropertySeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async SystemTask SeedAsync(CancellationToken ct = default)
    {
        if (await _db.Properties.AnyAsync(ct))
        {
            _logger.LogInformation("[DevPropertySeeder] Properties table already populated — skipping.");
            return;
        }

        // Ensure Benton County row exists.
        var bentonCounty = await _db.Counties
            .FirstOrDefaultAsync(c => c.Name == "Benton" && c.State == "WA", ct);

        if (bentonCounty is null)
        {
            bentonCounty = new County
            {
                Id = Guid.NewGuid(),
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
                Population = 206873,
                Area = 1703.0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _db.Counties.Add(bentonCounty);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("[DevPropertySeeder] Created Benton County row (Id={Id}).", bentonCounty.Id);
        }

        var countyId = bentonCounty.Id;

        // Load parcels from the PACS mirror tables.
        var parcels = await _db.PacsParcel
            .AsNoTracking()
            .Where(p => p.CountyId == countyId)
            .ToListAsync(ct);

        if (parcels.Count == 0)
        {
            // CountyId on PacsParcel may not match if seeded under a different County row.
            // Fall back to all parcels.
            parcels = await _db.PacsParcel
                .AsNoTracking()
                .ToListAsync(ct);
        }

        if (parcels.Count == 0)
        {
            _logger.LogWarning("[DevPropertySeeder] No PacsParcel rows found — run --seed-pacs first.");
            return;
        }

        // Load situs and valuation data in one query each to avoid N+1.
        var parcelIds = parcels.Select(p => p.Id).ToHashSet();

        var situsLookup = await _db.PacsSituses
            .AsNoTracking()
            .Where(s => parcelIds.Contains(s.ParcelId))
            .GroupBy(s => s.ParcelId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.OrderByDescending(s => s.PrimaryFlag == "Y" ? 1 : 0).First(),
                ct);

        var valuationLookup = await _db.PacsValuations
            .AsNoTracking()
            .Where(v => parcelIds.Contains(v.ParcelId))
            .GroupBy(v => v.ParcelId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.OrderByDescending(v => v.PropValYear).First(),
                ct);

        var profileLookup = await _db.PacsPropertyProfiles
            .AsNoTracking()
            .Where(pp => parcelIds.Contains(pp.ParcelId))
            .GroupBy(pp => pp.ParcelId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.OrderByDescending(pp => pp.PropValYear).First(),
                ct);

        var properties = new List<Property>(parcels.Count);

        foreach (var parcel in parcels)
        {
            situsLookup.TryGetValue(parcel.Id, out var situs);
            valuationLookup.TryGetValue(parcel.Id, out var val);
            profileLookup.TryGetValue(parcel.Id, out var profile);

            var parcelNumber = parcel.GeoId ?? parcel.SimpleGeoId ?? parcel.PropId.ToString();
            var address = situs?.SitusDisplay
                ?? BuildAddressFromSitus(situs)
                ?? "Address unavailable";

            var assessedValue = (decimal)(val?.AssessedVal ?? 0m);
            var landValue = (decimal)(val?.LandHstdVal ?? 0m) + (decimal)(val?.LandNonHstdVal ?? 0m);
            var improvementValue = (decimal)(val?.ImprvHstdVal ?? 0m) + (decimal)(val?.ImprvNonHstdVal ?? 0m);
            var marketValue = (decimal)(val?.Market ?? val?.AppraisedVal ?? 0m);
            var taxYear = val?.PropValYear ?? DateTime.UtcNow.Year;
            var yearBuilt = profile?.YearBuilt.HasValue == true ? (int?)((int)profile.YearBuilt.Value) : null;

            // Map PACS prop_type_cd → readable Property type
            var propertyType = MapPropertyType(parcel.PropTypeCd, profile?.PropertyUseCd);

            properties.Add(new Property
            {
                Id = Guid.NewGuid(),
                PropertyId = parcelNumber,
                ParcelId = parcelNumber,
                ParcelNumber = parcelNumber,
                Address = address,
                PropertyType = propertyType,
                YearBuilt = yearBuilt,
                AssessedValue = assessedValue,
                LandValue = landValue,
                ImprovementValue = improvementValue,
                MarketValue = marketValue,
                AssessmentDate = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow,
                TaxYear = taxYear,
                CountyId = countyId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        // Batch insert in chunks to avoid SQLite parameter limits.
        const int chunkSize = 500;
        var total = 0;
        foreach (var chunk in properties.Chunk(chunkSize))
        {
            _db.Properties.AddRange(chunk);
            await _db.SaveChangesAsync(ct);
            total += chunk.Length;
            _logger.LogInformation("[DevPropertySeeder] Inserted {Total}/{Grand} properties...",
                total, properties.Count);
        }

        _logger.LogInformation("[DevPropertySeeder] Done. {Count} Properties projected from PacsParcel.",
            properties.Count);
    }

    private static string? BuildAddressFromSitus(TerraFusion.Core.Entities.Pacs.PacsSitus? s)
    {
        if (s is null) return null;
        var parts = new[] { s.StreetNum, s.StreetPrefix, s.StreetName, s.StreetSuffix, s.City, s.State, s.Zip };
        var line = string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
        return string.IsNullOrWhiteSpace(line) ? null : line;
    }

    private static string MapPropertyType(string? propTypeCd, string? propertyUseCd)
    {
        return propTypeCd?.Trim().ToUpperInvariant() switch
        {
            "R" or "REAL" => "Residential",
            "P" or "PERS" => "Personal Property",
            "MH" => "Manufactured Home",
            "AG" or "AGRI" => "Agricultural",
            "C" or "COMM" => "Commercial",
            "I" or "INDUS" => "Industrial",
            "EX" or "EXEMPT" => "Exempt",
            _ => propertyUseCd?.Trim() ?? "Residential",
        };
    }
}
