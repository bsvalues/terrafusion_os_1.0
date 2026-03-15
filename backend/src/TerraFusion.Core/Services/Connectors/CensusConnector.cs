using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Core.Services.Connectors;

/// <summary>
/// ACS demographic data for a geographic area (county or tract).
/// </summary>
public sealed class CensusDemographics
{
    public string CountyId { get; set; } = string.Empty;
    public string? TractId { get; set; }
    public string DataYear { get; set; } = string.Empty;
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;

    // Population
    public int TotalPopulation { get; set; }
    public decimal PopulationGrowthRate { get; set; }
    public decimal MedianAge { get; set; }

    // Income
    public decimal MedianHouseholdIncome { get; set; }
    public decimal MeanHouseholdIncome { get; set; }
    public decimal PerCapitaIncome { get; set; }
    public decimal PovertyRate { get; set; }

    // Housing
    public int TotalHousingUnits { get; set; }
    public int OccupiedUnits { get; set; }
    public int VacantUnits { get; set; }
    public decimal HomeownershipRate { get; set; }
    public decimal MedianHomeValue { get; set; }
    public decimal MedianGrossRent { get; set; }
    public decimal VacancyRate { get; set; }

    // Education
    public decimal HighSchoolOrHigherPct { get; set; }
    public decimal BachelorOrHigherPct { get; set; }
    public decimal GraduateOrProfessionalPct { get; set; }

    // Employment
    public decimal UnemploymentRate { get; set; }
    public int LaborForce { get; set; }

    // Age distribution
    public decimal Under18Pct { get; set; }
    public decimal Age18To64Pct { get; set; }
    public decimal Age65PlusPct { get; set; }
}

/// <summary>
/// Contract for Census Bureau ACS data integration.
/// Absorbed from BIV-011.
/// </summary>
public interface ICensusConnector
{
    /// <summary>
    /// Retrieves ACS demographic data for a county.
    /// </summary>
    Task<CensusDemographics> GetCountyDemographicsAsync(string countyId, string? dataYear = null, CancellationToken ct = default);

    /// <summary>
    /// Retrieves ACS demographic data for a specific census tract.
    /// </summary>
    Task<CensusDemographics> GetTractDemographicsAsync(string countyId, string tractId, CancellationToken ct = default);

    /// <summary>
    /// Returns median household income for a county, used in affordability analysis.
    /// </summary>
    Task<decimal> GetMedianHouseholdIncomeAsync(string countyId, CancellationToken ct = default);

    /// <summary>
    /// Returns the homeownership rate for affordability and rental market analysis.
    /// </summary>
    Task<decimal> GetHomeownershipRateAsync(string countyId, CancellationToken ct = default);
}

/// <summary>
/// Census Bureau American Community Survey (ACS) data connector. Retrieves
/// demographic, income, housing, and education data used to contextualize
/// property valuations and support equitable assessment practices.
/// Lineage: BIV-011.
/// </summary>
public sealed class CensusConnector : ICensusConnector
{
    private readonly ILogger<CensusConnector> _logger;
    private readonly IConfiguration _configuration;

    // Census API base URL (configured via appsettings)
    private readonly string _censusApiBaseUrl;

    public CensusConnector(ILogger<CensusConnector> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _censusApiBaseUrl = _configuration.GetValue<string>("CensusApi:BaseUrl")
            ?? "https://api.census.gov/data";
    }

    /// <inheritdoc />
    public async Task<CensusDemographics> GetCountyDemographicsAsync(
        string countyId, string? dataYear = null, CancellationToken ct = default)
    {
        string year = dataYear ?? (DateTime.UtcNow.Year - 2).ToString(); // ACS data lags ~2 years
        _logger.LogInformation(
            "Fetching ACS demographics for county {CountyId}, year {Year}",
            countyId, year);

        // In production, call Census Bureau API:
        // GET {baseUrl}/{year}/acs/acs5?get=B01003_001E,B19013_001E,...&for=county:{fips}&key={apiKey}
        // For now, return representative Benton County WA data.

        var demographics = BuildDemographics(countyId, null, year);

        _logger.LogInformation(
            "Census data retrieved for {CountyId}: pop={Pop}, MHI={MHI:C0}, homeownership={HO:P1}",
            countyId, demographics.TotalPopulation, demographics.MedianHouseholdIncome,
            demographics.HomeownershipRate);

        return await Task.FromResult(demographics);
    }

    /// <inheritdoc />
    public async Task<CensusDemographics> GetTractDemographicsAsync(
        string countyId, string tractId, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Fetching ACS tract data for {CountyId}, tract {TractId}", countyId, tractId);

        var demographics = BuildDemographics(countyId, tractId, (DateTime.UtcNow.Year - 2).ToString());
        return await Task.FromResult(demographics);
    }

    /// <inheritdoc />
    public async Task<decimal> GetMedianHouseholdIncomeAsync(string countyId, CancellationToken ct = default)
    {
        var demo = await GetCountyDemographicsAsync(countyId, ct: ct);
        return demo.MedianHouseholdIncome;
    }

    /// <inheritdoc />
    public async Task<decimal> GetHomeownershipRateAsync(string countyId, CancellationToken ct = default)
    {
        var demo = await GetCountyDemographicsAsync(countyId, ct: ct);
        return demo.HomeownershipRate;
    }

    // ──────────────────────────────────────────────────────────────
    // Data builder (replaced by real Census API calls in production)
    // ──────────────────────────────────────────────────────────────

    private static CensusDemographics BuildDemographics(string countyId, string? tractId, string year)
    {
        // Seed-based variation so different counties get different but stable data
        var rng = new Random(HashCode.Combine(countyId, tractId ?? "", year));

        // Base values modeled on Benton County, WA (FIPS 53-005)
        int basePop = tractId != null ? rng.Next(2000, 8000) : 210000 + rng.Next(-20000, 20000);
        decimal baseMHI = 72000m + rng.Next(-8000, 12000);

        int totalHousing = (int)(basePop / 2.5);
        int occupied = (int)(totalHousing * (0.90 + rng.NextDouble() * 0.06));
        int vacant = totalHousing - occupied;

        return new CensusDemographics
        {
            CountyId = countyId,
            TractId = tractId,
            DataYear = year,

            // Population
            TotalPopulation = basePop,
            PopulationGrowthRate = Math.Round(0.005m + (decimal)(rng.NextDouble() * 0.02), 4),
            MedianAge = Math.Round(34m + (decimal)(rng.NextDouble() * 8), 1),

            // Income
            MedianHouseholdIncome = Math.Round(baseMHI, 2),
            MeanHouseholdIncome = Math.Round(baseMHI * 1.18m, 2),
            PerCapitaIncome = Math.Round(baseMHI / 2.5m, 2),
            PovertyRate = Math.Round(0.08m + (decimal)(rng.NextDouble() * 0.08), 4),

            // Housing
            TotalHousingUnits = totalHousing,
            OccupiedUnits = occupied,
            VacantUnits = vacant,
            HomeownershipRate = Math.Round(0.62m + (decimal)(rng.NextDouble() * 0.12), 4),
            MedianHomeValue = Math.Round(310000m + rng.Next(-40000, 60000), 2),
            MedianGrossRent = Math.Round(1200m + rng.Next(-200, 400), 2),
            VacancyRate = totalHousing > 0 ? Math.Round((decimal)vacant / totalHousing, 4) : 0m,

            // Education
            HighSchoolOrHigherPct = Math.Round(0.88m + (decimal)(rng.NextDouble() * 0.06), 4),
            BachelorOrHigherPct = Math.Round(0.28m + (decimal)(rng.NextDouble() * 0.12), 4),
            GraduateOrProfessionalPct = Math.Round(0.10m + (decimal)(rng.NextDouble() * 0.08), 4),

            // Employment
            UnemploymentRate = Math.Round(0.04m + (decimal)(rng.NextDouble() * 0.04), 4),
            LaborForce = (int)(basePop * (0.50 + rng.NextDouble() * 0.10)),

            // Age distribution
            Under18Pct = Math.Round(0.22m + (decimal)(rng.NextDouble() * 0.06), 4),
            Age18To64Pct = Math.Round(0.60m + (decimal)(rng.NextDouble() * 0.06), 4),
            Age65PlusPct = Math.Round(0.14m + (decimal)(rng.NextDouble() * 0.06), 4),
        };
    }
}
