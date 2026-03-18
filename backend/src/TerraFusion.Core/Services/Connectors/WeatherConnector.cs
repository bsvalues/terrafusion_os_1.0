using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Core.Services.Connectors;

/// <summary>
/// Weather and climate data relevant to property valuation adjustments.
/// </summary>
public sealed class WeatherData
{
    public string CountyId { get; set; } = string.Empty;
    public DateTime ObservationDate { get; set; } = DateTime.UtcNow;
    public string Season { get; set; } = string.Empty;

    // Temperature (Fahrenheit)
    public decimal CurrentTempF { get; set; }
    public decimal AvgHighTempF { get; set; }
    public decimal AvgLowTempF { get; set; }
    public int HeatingDegreeDays { get; set; }
    public int CoolingDegreeDays { get; set; }

    // Precipitation
    public decimal AnnualPrecipitationInches { get; set; }
    public decimal MonthlyPrecipitationInches { get; set; }
    public decimal AnnualSnowfallInches { get; set; }
    public int RainyDaysPerYear { get; set; }

    // Climate factors affecting valuation
    public decimal FloodRiskScore { get; set; }        // 0-1 scale
    public decimal WildfireRiskScore { get; set; }     // 0-1 scale
    public decimal DroughtSeverityIndex { get; set; }  // 0-5 scale (D0-D4)
    public bool IsInFloodZone { get; set; }
    public string FloodZoneDesignation { get; set; } = string.Empty; // FEMA zone (A, AE, X, etc.)

    // Growing season (relevant for agricultural properties)
    public int GrowingSeasonDays { get; set; }
    public DateTime? LastFrostDate { get; set; }
    public DateTime? FirstFrostDate { get; set; }
}

/// <summary>
/// Seasonal market activity factors influenced by weather patterns.
/// </summary>
public sealed class SeasonalMarketFactor
{
    public string Season { get; set; } = string.Empty;
    public decimal ListingActivityMultiplier { get; set; } = 1.0m;
    public decimal SaleVolumeMultiplier { get; set; } = 1.0m;
    public decimal PriceSeasonalAdjustment { get; set; } = 0m;
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Contract for weather and climate data integration affecting property valuations.
/// Absorbed from BIV-012.
/// </summary>
public interface IWeatherConnector
{
    /// <summary>
    /// Retrieves current weather and climate data for a county.
    /// </summary>
    Task<WeatherData> GetWeatherDataAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Returns seasonal market factors that indicate how weather patterns
    /// affect listing and sale activity.
    /// </summary>
    Task<SeasonalMarketFactor> GetSeasonalFactorAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Returns flood risk information for a specific location, used for
    /// external obsolescence adjustments in the cost approach.
    /// </summary>
    Task<(decimal FloodRiskScore, string FloodZone, bool IsInFloodZone)> GetFloodRiskAsync(
        string countyId, string? parcelId = null, CancellationToken ct = default);

    /// <summary>
    /// Returns wildfire risk score for a location, used for insurance and
    /// external obsolescence adjustments.
    /// </summary>
    Task<decimal> GetWildfireRiskAsync(string countyId, string? parcelId = null, CancellationToken ct = default);
}

/// <summary>
/// Weather and climate data connector providing temperature, precipitation,
/// flood risk, wildfire risk, and seasonal market factors. Used to compute
/// external obsolescence adjustments and understand seasonal listing patterns.
/// Lineage: BIV-012.
/// </summary>
public sealed class WeatherConnector : IWeatherConnector
{
    private readonly ILogger<WeatherConnector> _logger;
    private readonly IConfiguration _configuration;

    // Seasonal definitions for Pacific Northwest
    private static readonly Dictionary<int, string> MonthToSeason = new()
    {
        [1] = "Winter", [2] = "Winter", [3] = "Spring",
        [4] = "Spring", [5] = "Spring", [6] = "Summer",
        [7] = "Summer", [8] = "Summer", [9] = "Fall",
        [10] = "Fall", [11] = "Fall", [12] = "Winter",
    };

    // Seasonal market activity patterns for eastern WA
    private static readonly Dictionary<string, SeasonalMarketFactor> SeasonalFactors = new()
    {
        ["Spring"] = new SeasonalMarketFactor
        {
            Season = "Spring",
            ListingActivityMultiplier = 1.25m,
            SaleVolumeMultiplier = 1.20m,
            PriceSeasonalAdjustment = 0.02m,
            Description = "Peak listing season. Higher activity and slight price premium.",
        },
        ["Summer"] = new SeasonalMarketFactor
        {
            Season = "Summer",
            ListingActivityMultiplier = 1.15m,
            SaleVolumeMultiplier = 1.30m,
            PriceSeasonalAdjustment = 0.03m,
            Description = "Peak selling season. Highest sale volumes and price premiums.",
        },
        ["Fall"] = new SeasonalMarketFactor
        {
            Season = "Fall",
            ListingActivityMultiplier = 0.90m,
            SaleVolumeMultiplier = 0.85m,
            PriceSeasonalAdjustment = -0.01m,
            Description = "Activity declining. Motivated sellers may accept lower offers.",
        },
        ["Winter"] = new SeasonalMarketFactor
        {
            Season = "Winter",
            ListingActivityMultiplier = 0.70m,
            SaleVolumeMultiplier = 0.65m,
            PriceSeasonalAdjustment = -0.03m,
            Description = "Lowest activity. Sales skew toward motivated buyers/sellers.",
        },
    };

    public WeatherConnector(ILogger<WeatherConnector> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    /// <inheritdoc />
    public async Task<WeatherData> GetWeatherDataAsync(string countyId, CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching weather data for county {CountyId}", countyId);

        // In production, call NWS API or OpenWeatherMap.
        // Data modeled on Benton County, WA (semi-arid climate, Tri-Cities area).
        var rng = new Random(HashCode.Combine(countyId, DateTime.UtcNow.DayOfYear));
        string season = MonthToSeason[DateTime.UtcNow.Month];

        decimal baseTemp = season switch
        {
            "Winter" => 35m,
            "Spring" => 58m,
            "Summer" => 88m,
            "Fall" => 52m,
            _ => 55m,
        };

        var data = new WeatherData
        {
            CountyId = countyId,
            Season = season,

            CurrentTempF = baseTemp + rng.Next(-8, 8),
            AvgHighTempF = baseTemp + 10m,
            AvgLowTempF = baseTemp - 15m,
            HeatingDegreeDays = season is "Winter" or "Fall" ? rng.Next(400, 900) : rng.Next(0, 150),
            CoolingDegreeDays = season is "Summer" ? rng.Next(300, 700) : rng.Next(0, 100),

            // Benton County is semi-arid: ~8 inches annual precip
            AnnualPrecipitationInches = 7.5m + (decimal)(rng.NextDouble() * 3.0),
            MonthlyPrecipitationInches = season == "Winter" ? 1.2m : 0.4m + (decimal)(rng.NextDouble() * 0.6),
            AnnualSnowfallInches = 12m + rng.Next(-5, 10),
            RainyDaysPerYear = rng.Next(55, 80),

            FloodRiskScore = (decimal)(rng.NextDouble() * 0.15),
            WildfireRiskScore = season == "Summer"
                ? 0.30m + (decimal)(rng.NextDouble() * 0.25)
                : 0.05m + (decimal)(rng.NextDouble() * 0.10),
            DroughtSeverityIndex = season == "Summer" ? (decimal)(rng.NextDouble() * 3.0) : (decimal)(rng.NextDouble() * 1.0),
            IsInFloodZone = rng.Next(10) == 0, // ~10% of parcels
            FloodZoneDesignation = rng.Next(10) == 0 ? "AE" : "X",

            GrowingSeasonDays = rng.Next(170, 210),
            LastFrostDate = new DateTime(DateTime.UtcNow.Year, 4, rng.Next(5, 25)),
            FirstFrostDate = new DateTime(DateTime.UtcNow.Year, 10, rng.Next(10, 30)),
        };

        _logger.LogInformation(
            "Weather data for {CountyId}: season={Season}, temp={Temp}F, floodRisk={Flood:F2}, fireRisk={Fire:F2}",
            countyId, season, data.CurrentTempF, data.FloodRiskScore, data.WildfireRiskScore);

        return await Task.FromResult(data);
    }

    /// <inheritdoc />
    public async Task<SeasonalMarketFactor> GetSeasonalFactorAsync(
        string countyId, CancellationToken ct = default)
    {
        string season = MonthToSeason[DateTime.UtcNow.Month];
        var factor = SeasonalFactors.GetValueOrDefault(season, SeasonalFactors["Spring"]);

        _logger.LogDebug(
            "Seasonal factor for {CountyId}: {Season}, listing multiplier={Mult:F2}",
            countyId, season, factor.ListingActivityMultiplier);

        return await Task.FromResult(factor);
    }

    /// <inheritdoc />
    public async Task<(decimal FloodRiskScore, string FloodZone, bool IsInFloodZone)> GetFloodRiskAsync(
        string countyId, string? parcelId = null, CancellationToken ct = default)
    {
        _logger.LogInformation("Checking flood risk for {CountyId}, parcel {ParcelId}", countyId, parcelId ?? "N/A");

        // In production, query FEMA NFHL (National Flood Hazard Layer) API.
        var rng = new Random(HashCode.Combine(countyId, parcelId ?? ""));
        bool inFloodZone = rng.Next(10) == 0;
        string zone = inFloodZone ? (rng.Next(2) == 0 ? "AE" : "A") : "X";
        decimal risk = inFloodZone ? 0.40m + (decimal)(rng.NextDouble() * 0.40) : (decimal)(rng.NextDouble() * 0.10);

        return await Task.FromResult((Math.Round(risk, 4), zone, inFloodZone));
    }

    /// <inheritdoc />
    public async Task<decimal> GetWildfireRiskAsync(
        string countyId, string? parcelId = null, CancellationToken ct = default)
    {
        _logger.LogInformation("Checking wildfire risk for {CountyId}, parcel {ParcelId}", countyId, parcelId ?? "N/A");

        // In production, query USFS Wildfire Risk data.
        var rng = new Random(HashCode.Combine(countyId, parcelId ?? "", "fire"));
        string season = MonthToSeason[DateTime.UtcNow.Month];
        decimal baseRisk = season == "Summer" ? 0.25m : 0.08m;
        decimal risk = baseRisk + (decimal)(rng.NextDouble() * 0.20);

        return await Task.FromResult(Math.Round(Math.Min(risk, 1.0m), 4));
    }
}
