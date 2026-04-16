/*
 * PacsCanonicalizer
 *
 * Sole bridge from Pacs* staging entities to canonical TerraFusion entities.
 * Writes to CamaCharacteristic.City (from PacsSitus.City via PacsParcel.GeoId)
 * and CamaCharacteristic.PropertyUseStratum (derived from BuildingType).
 *
 * Boundary rule: the only writer to these two CamaCharacteristic fields.
 * CostForge v2 reads canonical entities only; PacsCanonicalizer is the single
 * transform from staging to canonical.
 *
 * @version 1.0.0 - Track 0 (CostForge Benton Method v2)
 */

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Canonicalizers;

public record CanonicalizerResult(int RowsTouched, int RowsUpdatedCity, int RowsUpdatedStratum);

public interface IPacsCanonicalizer
{
    Task<CanonicalizerResult> PopulateCityAndStratumAsync(
        Guid countyId, int taxYear, CancellationToken ct = default);
}

public class PacsCanonicalizer : IPacsCanonicalizer
{
    private readonly TerraFusionDbContext _context;
    private readonly ILogger<PacsCanonicalizer> _logger;

    public PacsCanonicalizer(TerraFusionDbContext context, ILogger<PacsCanonicalizer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CanonicalizerResult> PopulateCityAndStratumAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        // Step 1: build GeoId -> Pacs parcel Guid lookup.
        // PacsParcel may have multiple rows per GeoId (historical dupes from
        // PACS sync); dedupe by taking the last-updated row per GeoId.
        var pacsRows = await _context.PacsParcel
            .Where(p => p.CountyId == countyId && p.GeoId != null)
            .Select(p => new { p.Id, p.GeoId, p.SyncedAt })
            .ToListAsync(ct);

        var geoToPacsId = pacsRows
            .GroupBy(p => p.GeoId!)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(p => p.SyncedAt).First().Id);

        // Step 2: build PacsParcel.Guid -> City map from primary PacsSitus rows
        var pacsIdToCity = await _context.PacsSituses
            .Where(s => s.City != null)
            .Select(s => new { s.ParcelId, s.City, s.PrimaryFlag })
            .ToListAsync(ct);

        // Prefer Primary='Y', fall back to any non-null City per ParcelId
        var cityByPacsId = pacsIdToCity
            .Where(s => geoToPacsId.Values.Contains(s.ParcelId))
            .GroupBy(s => s.ParcelId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(s => s.PrimaryFlag == "Y").First().City!);

        // Step 3: load canonical CamaCharacteristic rows for this county+year
        var camaRows = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear)
            .ToListAsync(ct);

        int touched = 0, cityUpd = 0, stratUpd = 0;

        foreach (var cama in camaRows)
        {
            touched++;

            // City via GeoId -> Pacs.Guid -> City
            string? rawCity = null;
            if (geoToPacsId.TryGetValue(cama.ParcelId, out var pacsGuid))
            {
                cityByPacsId.TryGetValue(pacsGuid, out rawCity);
            }

            var normalizedCity = NormalizeCity(rawCity);
            if (cama.City != normalizedCity)
            {
                cama.City = normalizedCity;
                cityUpd++;
            }

            // Stratum from BuildingType
            var stratum = DeriveStratum(cama.BuildingType);
            if (cama.PropertyUseStratum != stratum)
            {
                cama.PropertyUseStratum = stratum;
                stratUpd++;
            }
        }

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation(
            "PacsCanonicalizer: county={County} year={Year} touched={Touched} cityUpd={City} stratUpd={Strat}",
            countyId, taxYear, touched, cityUpd, stratUpd);

        return new CanonicalizerResult(touched, cityUpd, stratUpd);
    }

    /// <summary>
    /// Normalize a raw PacsSitus.City string to one of the canonical Benton
    /// city labels, or "Unincorporated" as a safe fallback.
    /// </summary>
    public static string NormalizeCity(string? raw)
    {
        var trimmed = (raw ?? string.Empty).Trim().ToUpperInvariant();
        return trimmed switch
        {
            "KENNEWICK" => "Kennewick",
            "RICHLAND" => "Richland",
            "PASCO" => "Pasco",
            "PROSSER" => "Prosser",
            "BENTON CITY" => "Benton City",
            "WEST RICHLAND" => "West Richland",
            _ => "Unincorporated"
        };
    }

    /// <summary>
    /// Derive PropertyUseStratum from the PACS building-type code.
    /// R* → residential, M* → manufactured, C*/I*/S* → commercial/industrial/special,
    /// A* → agricultural, V* → vacant, X* → exempt. Unknown bucket: X.
    /// </summary>
    public static string DeriveStratum(string buildingType)
    {
        var bt = (buildingType ?? string.Empty).Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(bt)) return "X";
        if (bt.StartsWith("R")) return "R";
        if (bt.StartsWith("M")) return "M";
        if (bt.StartsWith("C")) return "C";
        if (bt.StartsWith("I")) return "C";
        if (bt.StartsWith("S")) return "C";
        if (bt.StartsWith("A")) return "A";
        if (bt.StartsWith("V")) return "V";
        if (bt.StartsWith("X")) return "X";
        return "X";
    }
}
