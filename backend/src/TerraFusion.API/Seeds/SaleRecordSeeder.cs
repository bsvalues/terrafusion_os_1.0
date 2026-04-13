using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.API.Seeds;

/// <summary>
/// Dev-only seeder: creates 120 synthetic sale records across three reval areas
/// and two building types so all new PhD Appraiser panels have data to render.
/// Only runs when SaleRecords table is empty (idempotent).
/// </summary>
public sealed class SaleRecordSeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<SaleRecordSeeder> _logger;

    public SaleRecordSeeder(TerraFusionDbContext db, ILogger<SaleRecordSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task SeedAsync(CancellationToken ct = default)
    {
        if (await _db.SaleRecords.AnyAsync(ct))
        {
            _logger.LogInformation("[SaleRecordSeeder] SaleRecords already populated — skipping.");
            return;
        }

        // Require at least one MatrixVersion to FK against
        var version = await _db.MatrixVersions.FirstOrDefaultAsync(ct);
        if (version is null)
        {
            _logger.LogWarning("[SaleRecordSeeder] No MatrixVersion found — skipping sale record seed.");
            return;
        }

        var revalAreas = new[] { "REVAL-1", "REVAL-2", "REVAL-3" };
        var buildingTypes = new[] { "S1", "S2" };
        var rng = new Random(42);
        var records = new List<SaleRecord>();

        int seq = 1;
        foreach (var area in revalAreas)
        {
            foreach (var bt in buildingTypes)
            {
                // 20 sales per area/type combination = 120 total
                var salePrices = Enumerable.Range(0, 20)
                    .Select(_ => 180_000m + rng.Next(-60_000, 120_000))
                    .OrderBy(p => p).ToList();

                // Sort for quintile assignment (rank within this group)
                var sorted = salePrices.OrderBy(p => p).ToList();
                var quintileBoundaries = new[]
                {
                    sorted[(int)(sorted.Count * 0.20)],
                    sorted[(int)(sorted.Count * 0.40)],
                    sorted[(int)(sorted.Count * 0.60)],
                    sorted[(int)(sorted.Count * 0.80)],
                };

                // Compute ratios with slight regressivity baked in
                var ratios = salePrices.Select(sp =>
                {
                    var baseRatio = 0.97m + (decimal)rng.NextDouble() * 0.10m;
                    // Low-value houses slightly over-assessed (regressivity)
                    if (sp < 200_000) baseRatio += 0.03m;
                    return baseRatio;
                }).ToList();

                // IQR outlier detection
                var sortedRatios = ratios.OrderBy(r => r).ToList();
                var q1 = sortedRatios[(int)(sortedRatios.Count * 0.25)];
                var q3 = sortedRatios[(int)(sortedRatios.Count * 0.75)];
                var iqr = q3 - q1;
                var lowerFence = q1 - 1.5m * iqr;
                var upperFence = q3 + 1.5m * iqr;

                // Inject 2 deliberate outliers
                ratios[0] = lowerFence - 0.05m;
                ratios[19] = upperFence + 0.05m;

                for (int i = 0; i < salePrices.Count; i++)
                {
                    var sp = salePrices[i];
                    var ratio = ratios[i];
                    var av = sp * ratio;
                    var yearBuilt = 1950 + rng.Next(0, 75);
                    var saleDate = DateTime.UtcNow.AddMonths(-rng.Next(1, 13));

                    int quintile = 1;
                    for (int q = 0; q < quintileBoundaries.Length; q++)
                        if (sp >= quintileBoundaries[q]) quintile = q + 2;

                    int ageBand = yearBuilt < 1960 ? 1
                        : yearBuilt < 1980 ? 2
                        : yearBuilt < 2000 ? 3
                        : yearBuilt < 2015 ? 4 : 5;

                    bool isOutlier = ratio < lowerFence || ratio > upperFence;
                    string? classification = isOutlier
                        ? (i == 0 ? "ESTATE_SALE" : "RENOVATION")
                        : null;

                    records.Add(new SaleRecord
                    {
                        MatrixVersionId = version.Id,
                        ParcelId = $"B-{area}-{bt}-{seq++:D4}",
                        RevalArea = area,
                        BuildingType = bt,
                        SaleDate = saleDate,
                        SalePrice = Math.Round(sp, 0),
                        AssessedValue = Math.Round(av, 0),
                        Ratio = Math.Round(ratio, 4),
                        IsOutlierIqr = isOutlier,
                        AiClassification = classification,
                        ValueQuintile = quintile,
                        AgeBand = ageBand,
                    });
                }
            }
        }

        _db.SaleRecords.AddRange(records);
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("[SaleRecordSeeder] Seeded {Count} sale records.", records.Count);
    }
}
