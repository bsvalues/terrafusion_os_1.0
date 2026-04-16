using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Pacs;
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
        var propertiesPopulated = await _db.Properties.AnyAsync(ct);

        // Ensure Benton County row exists. Look up by FipsCode (stable key);
        // Name may be "Benton" or "Benton County" depending on seed lineage.
        var bentonCounty = await _db.Counties
            .FirstOrDefaultAsync(c => c.FipsCode == "53005", ct);

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

        // Two-step projection avoids EF materialising the full PacsValuation entity
        // (which selects hood_cd — a SQLite column that may be named differently).
        var rawValuations = await _db.PacsValuations
            .AsNoTracking()
            .Where(v => v.SupNum == 0 && parcelIds.Contains(v.ParcelId))
            .Select(v => new
            {
                v.ParcelId, v.PropValYear,
                v.AssessedVal, v.Market, v.AppraisedVal, v.ImprvVal,
                v.LandHstdVal, v.LandNonHstdVal,
                v.ImprvHstdVal, v.ImprvNonHstdVal,
            })
            .ToListAsync(ct);

        var valuationLookup = rawValuations
            .GroupBy(v => v.ParcelId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(v => v.PropValYear).First());

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
                // PropertyId must hold the PACS integer prop_id (not geo_id) so the
                // PropertiesController PacsPropertyProfile fallback join works correctly:
                //   Properties.PropertyId → int.Parse → PacsPropertyProfiles.PacsPropId
                PropertyId = parcel.PropId.ToString(),
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

        if (!propertiesPopulated)
        {
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
        else
        {
            _logger.LogInformation("[DevPropertySeeder] Properties already populated — skipping insert.");

            // Fix-up: PropertyId was previously set to geo_id instead of PropId.
            // Any row where PropertyId == ParcelNumber is wrong — correct it.
            // Use GroupBy to handle parcels where GeoId/SimpleGeoId is not unique.
            var geoIdToPropId = parcels
                .GroupBy(p => p.GeoId ?? p.SimpleGeoId ?? p.PropId.ToString())
                .ToDictionary(g => g.Key, g => g.First().PropId.ToString());

            var badRows = await _db.Properties
                .Where(p => p.PropertyId == p.ParcelNumber)
                .ToListAsync(ct);

            if (badRows.Count > 0)
            {
                foreach (var row in badRows)
                {
                    if (geoIdToPropId.TryGetValue(row.ParcelNumber ?? "", out var correctPropId))
                        row.PropertyId = correctPropId;
                }
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("[DevPropertySeeder] Fixed PropertyId on {Count} rows (geo_id → PropId).", badRows.Count);
            }
        }

        // ── CamaCharacteristics ─────────────────────────────────────────────
        // Seed CamaCharacteristics from the local PACS mirror tables so the
        // PropertiesController CamaCharacteristic path returns GLA, basement,
        // and garage sqft without any live PACS SQL Server connection.
        // Source priority: PacsPropertyProfile.LivingArea (above-grade only) →
        //                  sum of above-grade PacsImprovementDetail segments.
        if (!await _db.CamaCharacteristics.AnyAsync(ct))
        {
            // Load basement/garage detail segments for all parcels in one query.
            // PacsImprovementDetail → PacsImprovement.ParcelId → PacsParcel.Id
            var improvementIds = await _db.PacsImprovements
                .AsNoTracking()
                .Where(i => parcelIds.Contains(i.ParcelId))
                .Select(i => new { i.Id, i.ParcelId, i.PacsPropId })
                .ToListAsync(ct);

            var imprvIdToParcelId = improvementIds.ToDictionary(i => i.Id, i => i.ParcelId);
            var imprvGuids = imprvIdToParcelId.Keys.ToHashSet();

            var detailsByParcel = (await _db.PacsImprovementDetails
                .AsNoTracking()
                .Where(d => imprvGuids.Contains(d.ImprovementId))
                .ToListAsync(ct))
                .GroupBy(d => imprvIdToParcelId.TryGetValue(d.ImprovementId, out var pid) ? pid : Guid.Empty)
                .Where(g => g.Key != Guid.Empty)
                .ToDictionary(g => g.Key, g => g.ToList());

            var segsByParcel = detailsByParcel;

            static bool IsBasement(string? cd) => cd is "BSMT" or "BSM" or "BSMT-FIN"
                or "BSMT-UNFIN" or "BSMT-PART" or "BAS" or "BASEMENT" or "BSMT-GAR";
            static bool IsGarage(string? cd) => cd is "GAR" or "GARATT" or "GARDET"
                or "GARACE" or "GARAGE" or "GARATT-FIN" or "CARPORT" or "CAR";

            var camaList = new List<CamaCharacteristic>(parcels.Count);
            foreach (var parcel in parcels)
            {
                profileLookup.TryGetValue(parcel.Id, out var prof);
                if (prof is null) continue;

                var gla = prof.LivingArea is > 0 ? prof.LivingArea!.Value : 0m;
                if (gla <= 0) continue;

                segsByParcel.TryGetValue(parcel.Id, out var segs);
                var basementSqft = segs?
                    .Where(s => IsBasement(s.ImprvDetTypeCd))
                    .Sum(s => s.ImprvDetArea ?? 0m) ?? 0m;
                var garageSqft = segs?
                    .Where(s => IsGarage(s.ImprvDetTypeCd))
                    .Sum(s => s.ImprvDetArea ?? 0m) ?? 0m;

                var parcelNumber = parcel.GeoId ?? parcel.SimpleGeoId ?? parcel.PropId.ToString();
                camaList.Add(new CamaCharacteristic
                {
                    Id           = Guid.NewGuid(),
                    ParcelId     = parcelNumber,
                    TaxYear      = prof.PropValYear,
                    BuildingType = "R",
                    SquareFeet   = gla,
                    YearBuilt    = prof.YearBuilt.HasValue ? (int?)((int)prof.YearBuilt.Value) : null,
                    BasementSqft = basementSqft > 0 ? basementSqft : null,
                    GarageSqft   = garageSqft > 0 ? garageSqft : null,
                    CountyId     = countyId,
                    UpdatedAt    = DateTime.UtcNow,
                });
            }

            if (camaList.Count > 0)
            {
                foreach (var chunk in camaList.Chunk(chunkSize))
                {
                    _db.CamaCharacteristics.AddRange(chunk);
                    await _db.SaveChangesAsync(ct);
                }
                _logger.LogInformation("[DevPropertySeeder] Seeded {Count} CamaCharacteristic rows from PacsPropertyProfile.",
                    camaList.Count);
            }
        }
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

    // ─────────────────────────────────────────────────────────────────────────
    // Dev fixtures: specific canonical sample parcels that must always exist.
    // Idempotent — skips if the parcel already exists.
    // ─────────────────────────────────────────────────────────────────────────
    public async SystemTask EnsureFixturesAsync(CancellationToken ct = default)
    {
        var bentonCounty = await _db.Counties
            .FirstOrDefaultAsync(c => c.Name == "Benton" && c.State == "WA", ct);
        if (bentonCounty is null)
        {
            _logger.LogWarning("[DevPropertySeeder] Benton County not found — skipping fixtures.");
            return;
        }

        await EnsureOakmontCtAsync(bentonCounty.Id, ct);
    }

    // 106 Oakmont Ct, Richland WA — complete SFR fixture with GLA, lot dims, legal desc.
    private async SystemTask EnsureOakmontCtAsync(Guid countyId, CancellationToken ct)
    {
        const string geoId    = "9990-0106-000";
        const int    propId   = 9990106;
        const int    taxYear  = 2025;

        // Idempotent: skip if already seeded.
        if (await _db.Properties.AnyAsync(p => p.ParcelNumber == geoId, ct))
        {
            _logger.LogDebug("[DevPropertySeeder] 106 Oakmont Ct fixture already present.");
            return;
        }

        _logger.LogInformation("[DevPropertySeeder] Seeding 106 Oakmont Ct fixture (propId={PropId})...", propId);

        // ── PacsParcel ────────────────────────────────────────────────────────
        var pacsParcelId = Guid.NewGuid();
        _db.PacsParcel.Add(new PacsParcel
        {
            Id        = pacsParcelId,
            PropId    = propId,
            GeoId     = geoId,
            PropTypeCd = "R",
            CountyId  = countyId,
        });

        // ── PacsSitus ─────────────────────────────────────────────────────────
        _db.PacsSituses.Add(new PacsSitus
        {
            Id           = Guid.NewGuid(),
            ParcelId     = pacsParcelId,
            PacsPropId   = propId,
            PacsSitusId  = 1,
            StreetNum    = "106",
            StreetName   = "OAKMONT",
            StreetSuffix = "CT",
            City         = "RICHLAND",
            State        = "WA",
            Zip          = "99352",
            SitusDisplay = "106 OAKMONT CT, RICHLAND WA 99352",
            PrimaryFlag  = "Y",
        });

        // ── PacsValuation ─────────────────────────────────────────────────────
        _db.PacsValuations.Add(new PacsValuation
        {
            Id           = Guid.NewGuid(),
            ParcelId     = pacsParcelId,
            PacsPropId   = propId,
            PropValYear  = taxYear,
            SupNum       = 0,
            AppraisedVal = 485000m,
            AssessedVal  = 485000m,
            Market       = 485000m,
            ImprvVal     = 400000m,
            ImprvHstdVal = 400000m,
            LandHstdVal  = 85000m,
            LegalDesc    = "LOT 19 OAKMONT MEADOWS DIV 1 AS PER PLAT RECORDED IN VOLUME 32 OF PLATS PAGE 15 RECORDS OF BENTON COUNTY WASHINGTON",
        });

        // ── PacsPropertyProfile ───────────────────────────────────────────────
        _db.PacsPropertyProfiles.Add(new PacsPropertyProfile
        {
            Id              = Guid.NewGuid(),
            ParcelId        = pacsParcelId,
            PacsPropId      = propId,
            PropValYear     = taxYear,
            SupNum          = 0,
            LivingArea      = 2185m,
            YearBuilt       = 2004m,
            PropertyUseCd   = "1101",
            NeighborhoodCode = "RICH05",
            LandFrontFeet   = 75m,
            LandDepth       = 120m,
        });

        // ── PacsLandDetail ────────────────────────────────────────────────────
        _db.PacsLandDetails.Add(new PacsLandDetail
        {
            Id             = Guid.NewGuid(),
            ParcelId       = pacsParcelId,
            PacsPropId     = propId,
            PropValYear    = taxYear,
            PacsLandSegId  = 1,
            SupNum         = 0,
            LandTypeCode   = "SFR",
            SizeSquareFeet = 9000m,
            EffectiveFront = 75m,
            EffectiveDepth = 120m,
            WidthFront     = 75m,
            DepthRight     = 120m,
        });

        // ── PacsImprovement ───────────────────────────────────────────────────
        var improvementId = Guid.NewGuid();
        _db.PacsImprovements.Add(new PacsImprovement
        {
            Id              = improvementId,
            ParcelId        = pacsParcelId,
            PacsPropId      = propId,
            PropValYear     = taxYear,
            PacsImprvId     = 1,
            SupNum          = 0,
            ImprvTypeCode   = "R",
            ImprvVal        = 400000m,
            ActualYearBuilt = 2004,
            EffectiveYearBuilt = 2013,
        });

        // ── PacsImprovementDetail ─────────────────────────────────────────────
        // Main floor + upper floor = GLA 2185; garage = 480 (not in GLA)
        var details = new[]
        {
            new PacsImprovementDetail
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1, SupNum = 0,
                ImprvDetTypeCd = "1ST", ImprvDetDesc = "First Floor", ImprvDetArea = 1285m,
                ImprvDetClassCd = "avg",
            },
            new PacsImprovementDetail
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 2, SupNum = 0,
                ImprvDetTypeCd = "2ND", ImprvDetDesc = "Second Floor", ImprvDetArea = 900m,
                ImprvDetClassCd = "avg",
            },
            new PacsImprovementDetail
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 3, SupNum = 0,
                ImprvDetTypeCd = "GARATT", ImprvDetDesc = "Attached Garage", ImprvDetArea = 480m,
                ImprvDetClassCd = "avg",
            },
        };
        _db.PacsImprovementDetails.AddRange(details);

        // ── PacsImprovementAttribute ──────────────────────────────────────────
        // AttrCode="Count", AttrUnit=3 → bedrooms; AttrUnit=2 → bathrooms; value = count
        var attrs = new[]
        {
            new PacsImprovementAttribute
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1,
                PacsImprvAttrId = 1, SupNum = 0,
                AttributeCode = "Count", AttrUnit = 3m, AttributeValue = 4m, // 4 bedrooms
            },
            new PacsImprovementAttribute
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1,
                PacsImprvAttrId = 2, SupNum = 0,
                AttributeCode = "Count", AttrUnit = 2m, AttributeValue = 3m, // 3 bathrooms
            },
            new PacsImprovementAttribute
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1,
                PacsImprvAttrId = 3, SupNum = 0,
                AttributeCode = "Vinyl", AttrUnit = 1m, AttributeValue = 1m,
            },
            new PacsImprovementAttribute
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1,
                PacsImprvAttrId = 4, SupNum = 0,
                AttributeCode = "Comp Shingle", AttrUnit = 1m, AttributeValue = 1m,
            },
            new PacsImprovementAttribute
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1,
                PacsImprvAttrId = 5, SupNum = 0,
                AttributeCode = "Heat pump", AttrUnit = 1m, AttributeValue = 1m,
            },
            new PacsImprovementAttribute
            {
                Id = Guid.NewGuid(), ImprovementId = improvementId,
                PacsPropId = propId, PropValYear = taxYear, PacsImprvId = 1, PacsImprvDetId = 1,
                PacsImprvAttrId = 6, SupNum = 0,
                AttributeCode = "Crawl/Concrete Perimeter Piers", AttrUnit = 1m, AttributeValue = 1m,
            },
        };
        _db.PacsImprovementAttributes.AddRange(attrs);

        // ── canonical Property ─────────────────────────────────────────────────
        _db.Properties.Add(new Property
        {
            Id               = Guid.NewGuid(),
            PropertyId       = propId.ToString(),
            ParcelId         = geoId,
            ParcelNumber     = geoId,
            Address          = "106 Oakmont Ct, Richland WA 99352",
            PropertyType     = "Residential",
            YearBuilt        = 2004,
            AssessedValue    = 485000m,
            LandValue        = 85000m,
            ImprovementValue = 400000m,
            MarketValue      = 485000m,
            AssessmentDate   = DateTime.UtcNow,
            LastUpdated      = DateTime.UtcNow,
            TaxYear          = taxYear,
            CountyId         = countyId,
            CreatedAt        = DateTime.UtcNow,
            UpdatedAt        = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("[DevPropertySeeder] 106 Oakmont Ct fixture inserted (parcel={GeoId}).", geoId);
    }
}
