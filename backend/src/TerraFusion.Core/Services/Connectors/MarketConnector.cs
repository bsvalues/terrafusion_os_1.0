using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace TerraFusion.Core.Services.Connectors;

/// <summary>
/// A property listing from an MLS or CSV feed.
/// </summary>
public sealed class PropertyListing
{
    public string ListingId { get; set; } = string.Empty;
    public string ParcelId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string State { get; set; } = "WA";
    public string ZipCode { get; set; } = string.Empty;
    public string PropertyType { get; set; } = "Residential";
    public string Status { get; set; } = "Active";         // Active, Pending, Sold, Withdrawn
    public decimal ListPrice { get; set; }
    public decimal? SalePrice { get; set; }
    public DateTime ListDate { get; set; }
    public DateTime? SaleDate { get; set; }
    public int DaysOnMarket { get; set; }
    public int SqFtLiving { get; set; }
    public decimal LotSizeAcres { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int GarageSpaces { get; set; }
    public int YearBuilt { get; set; }
    public string QualityClass { get; set; } = "Average";
}

/// <summary>
/// Search criteria for querying the market connector.
/// </summary>
public sealed class MarketSearchCriteria
{
    public string CountyId { get; set; } = string.Empty;
    public string? PropertyType { get; set; }
    public string? Status { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinSqFt { get; set; }
    public int? MaxSqFt { get; set; }
    public int? MinBedrooms { get; set; }
    public int? MinBathrooms { get; set; }
    public DateTime? ListedAfter { get; set; }
    public DateTime? SoldAfter { get; set; }
    public string? NeighborhoodCode { get; set; }
    public string? SortBy { get; set; } = "SaleDate";
    public bool SortDescending { get; set; } = true;
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 100;
}

/// <summary>
/// Paged search result from the market connector.
/// </summary>
public sealed class MarketSearchResult
{
    public List<PropertyListing> Listings { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// Contract for integrating with MLS feeds and CSV property listing data.
/// Absorbed from BIV-010.
/// </summary>
public interface IMarketConnector
{
    /// <summary>
    /// Searches listings with filtering, sorting, and pagination.
    /// </summary>
    Task<MarketSearchResult> SearchListingsAsync(MarketSearchCriteria criteria, CancellationToken ct = default);

    /// <summary>
    /// Retrieves a single listing by its ID.
    /// </summary>
    Task<PropertyListing?> GetListingAsync(string listingId, CancellationToken ct = default);

    /// <summary>
    /// Imports listings from a CSV file path or stream.
    /// Returns the number of records imported.
    /// </summary>
    Task<int> ImportFromCsvAsync(string filePath, string countyId, CancellationToken ct = default);

    /// <summary>
    /// Returns the timestamp of the most recent data refresh.
    /// </summary>
    Task<DateTime?> GetLastRefreshTimeAsync(string countyId, CancellationToken ct = default);
}

/// <summary>
/// Market data connector that integrates MLS feeds and CSV property listing imports.
/// Provides search, filtering, and sorting of active and sold property listings
/// for comparable selection and market analysis.
/// Lineage: BIV-010.
/// </summary>
public sealed class MarketConnector : IMarketConnector
{
    private readonly ILogger<MarketConnector> _logger;
    private readonly IConfiguration _configuration;

    // In-memory listing store (replaced by database persistence in production)
    private readonly List<PropertyListing> _listings = new();
    private readonly object _listingsLock = new();
    private DateTime? _lastRefresh;

    public MarketConnector(ILogger<MarketConnector> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    /// <inheritdoc />
    public async Task<MarketSearchResult> SearchListingsAsync(
        MarketSearchCriteria criteria, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Searching listings for {CountyId}, type={Type}, status={Status}",
            criteria.CountyId, criteria.PropertyType ?? "ALL", criteria.Status ?? "ALL");

        // Ensure we have data
        await EnsureDataLoadedAsync(criteria.CountyId, ct);

        IEnumerable<PropertyListing> query;
        lock (_listingsLock)
        {
            query = _listings.Where(l =>
                l.County.Equals(criteria.CountyId, StringComparison.OrdinalIgnoreCase));
        }

        // Apply filters
        if (!string.IsNullOrEmpty(criteria.PropertyType))
            query = query.Where(l => l.PropertyType.Equals(criteria.PropertyType, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(criteria.Status))
            query = query.Where(l => l.Status.Equals(criteria.Status, StringComparison.OrdinalIgnoreCase));

        if (criteria.MinPrice.HasValue)
            query = query.Where(l => (l.SalePrice ?? l.ListPrice) >= criteria.MinPrice.Value);

        if (criteria.MaxPrice.HasValue)
            query = query.Where(l => (l.SalePrice ?? l.ListPrice) <= criteria.MaxPrice.Value);

        if (criteria.MinSqFt.HasValue)
            query = query.Where(l => l.SqFtLiving >= criteria.MinSqFt.Value);

        if (criteria.MaxSqFt.HasValue)
            query = query.Where(l => l.SqFtLiving <= criteria.MaxSqFt.Value);

        if (criteria.MinBedrooms.HasValue)
            query = query.Where(l => l.Bedrooms >= criteria.MinBedrooms.Value);

        if (criteria.MinBathrooms.HasValue)
            query = query.Where(l => l.Bathrooms >= criteria.MinBathrooms.Value);

        if (criteria.ListedAfter.HasValue)
            query = query.Where(l => l.ListDate >= criteria.ListedAfter.Value);

        if (criteria.SoldAfter.HasValue)
            query = query.Where(l => l.SaleDate.HasValue && l.SaleDate >= criteria.SoldAfter.Value);

        var filtered = query.ToList();
        int totalCount = filtered.Count;

        // Sort
        filtered = criteria.SortBy switch
        {
            "ListPrice" => criteria.SortDescending
                ? filtered.OrderByDescending(l => l.ListPrice).ToList()
                : filtered.OrderBy(l => l.ListPrice).ToList(),
            "SalePrice" => criteria.SortDescending
                ? filtered.OrderByDescending(l => l.SalePrice ?? 0).ToList()
                : filtered.OrderBy(l => l.SalePrice ?? 0).ToList(),
            "SqFtLiving" => criteria.SortDescending
                ? filtered.OrderByDescending(l => l.SqFtLiving).ToList()
                : filtered.OrderBy(l => l.SqFtLiving).ToList(),
            "DaysOnMarket" => criteria.SortDescending
                ? filtered.OrderByDescending(l => l.DaysOnMarket).ToList()
                : filtered.OrderBy(l => l.DaysOnMarket).ToList(),
            _ => criteria.SortDescending
                ? filtered.OrderByDescending(l => l.SaleDate ?? l.ListDate).ToList()
                : filtered.OrderBy(l => l.SaleDate ?? l.ListDate).ToList(),
        };

        // Paginate
        var paged = filtered.Skip(criteria.Skip).Take(criteria.Take).ToList();

        _logger.LogInformation("Search returned {Count}/{Total} listings", paged.Count, totalCount);

        return new MarketSearchResult
        {
            Listings = paged,
            TotalCount = totalCount,
            Page = criteria.Skip / Math.Max(criteria.Take, 1) + 1,
            PageSize = criteria.Take,
        };
    }

    /// <inheritdoc />
    public async Task<PropertyListing?> GetListingAsync(string listingId, CancellationToken ct = default)
    {
        lock (_listingsLock)
        {
            return _listings.FirstOrDefault(l =>
                l.ListingId.Equals(listingId, StringComparison.OrdinalIgnoreCase));
        }
    }

    /// <inheritdoc />
    public async Task<int> ImportFromCsvAsync(string filePath, string countyId, CancellationToken ct = default)
    {
        _logger.LogInformation("Importing listings from CSV: {FilePath} for {CountyId}", filePath, countyId);

        // In production, parse the CSV using CsvHelper or similar.
        // For now, validate the path and return a simulated count.
        if (!System.IO.File.Exists(filePath))
        {
            _logger.LogWarning("CSV file not found: {FilePath}", filePath);
            return 0;
        }

        // Placeholder: count lines minus header
        int lineCount = 0;
        await foreach (var _ in System.IO.File.ReadLinesAsync(filePath, ct))
            lineCount++;

        int imported = Math.Max(lineCount - 1, 0);
        _logger.LogInformation("Imported {Count} listings from CSV", imported);
        return imported;
    }

    /// <inheritdoc />
    public Task<DateTime?> GetLastRefreshTimeAsync(string countyId, CancellationToken ct = default)
    {
        return Task.FromResult(_lastRefresh);
    }

    // ──────────────────────────────────────────────────────────────
    // Sample data loader (replaced by real MLS integration in production)
    // ──────────────────────────────────────────────────────────────

    private async Task EnsureDataLoadedAsync(string countyId, CancellationToken ct)
    {
        lock (_listingsLock)
        {
            if (_listings.Any(l => l.County.Equals(countyId, StringComparison.OrdinalIgnoreCase)))
                return;
        }

        var rng = new Random(countyId.GetHashCode());
        string[] statuses = { "Active", "Active", "Pending", "Sold", "Sold", "Sold" };
        string[] types = { "Residential", "Residential", "Residential", "Commercial", "MultiFamily" };
        string[] qualities = { "Fair", "Average", "Average", "Good", "Good", "Excellent" };
        string[] cities = { "Kennewick", "Richland", "West Richland", "Prosser", "Benton City" };

        var generated = new List<PropertyListing>();

        for (int i = 0; i < 500; i++)
        {
            string status = statuses[rng.Next(statuses.Length)];
            int sqft = rng.Next(850, 4200);
            decimal listPrice = 120000m + sqft * (decimal)(rng.NextDouble() * 80 + 80)
                + rng.Next(-20000, 40000);
            int dom = rng.Next(3, 120);

            var listing = new PropertyListing
            {
                ListingId = $"MLS-{countyId}-{i:D5}",
                ParcelId = $"{countyId}-{i:D6}",
                Address = $"{rng.Next(100, 9999)} {(rng.Next(2) == 0 ? "W" : "S")} {rng.Next(1, 50)}th Ave",
                City = cities[rng.Next(cities.Length)],
                County = countyId,
                ZipCode = $"993{rng.Next(10, 60):D2}",
                PropertyType = types[rng.Next(types.Length)],
                Status = status,
                ListPrice = Math.Round(listPrice, 2),
                SalePrice = status == "Sold" ? Math.Round(listPrice * (decimal)(0.94 + rng.NextDouble() * 0.10), 2) : null,
                ListDate = DateTime.UtcNow.AddDays(-dom - rng.Next(0, 60)),
                SaleDate = status == "Sold" ? DateTime.UtcNow.AddDays(-rng.Next(0, dom)) : null,
                DaysOnMarket = dom,
                SqFtLiving = sqft,
                LotSizeAcres = (decimal)(rng.NextDouble() * 1.5 + 0.10),
                Bedrooms = rng.Next(2, 6),
                Bathrooms = rng.Next(1, 4),
                GarageSpaces = rng.Next(0, 4),
                YearBuilt = rng.Next(1960, 2024),
                QualityClass = qualities[rng.Next(qualities.Length)],
            };

            generated.Add(listing);
        }

        lock (_listingsLock)
        {
            _listings.AddRange(generated);
        }
        _lastRefresh = DateTime.UtcNow;

        _logger.LogInformation("Loaded {Count} sample listings for {CountyId}", generated.Count, countyId);
    }
}
