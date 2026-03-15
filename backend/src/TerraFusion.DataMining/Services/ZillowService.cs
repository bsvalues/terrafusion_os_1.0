// TMR-076: Zillow data access service
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Services
{
    /// <summary>
    /// Zillow property estimate (Zestimate) data.
    /// </summary>
    public class ZillowEstimate
    {
        /// <summary>Zillow property ID (ZPID).</summary>
        public string ZpId { get; set; } = string.Empty;

        /// <summary>Property address.</summary>
        public string Address { get; set; } = string.Empty;

        /// <summary>City.</summary>
        public string City { get; set; } = string.Empty;

        /// <summary>State code.</summary>
        public string State { get; set; } = string.Empty;

        /// <summary>ZIP code.</summary>
        public string ZipCode { get; set; } = string.Empty;

        /// <summary>Zestimate value.</summary>
        public decimal? Zestimate { get; set; }

        /// <summary>Zestimate low range.</summary>
        public decimal? ZestimateLow { get; set; }

        /// <summary>Zestimate high range.</summary>
        public decimal? ZestimateHigh { get; set; }

        /// <summary>Rental Zestimate.</summary>
        public decimal? RentZestimate { get; set; }

        /// <summary>Last sale price.</summary>
        public decimal? LastSalePrice { get; set; }

        /// <summary>Last sale date.</summary>
        public DateTime? LastSaleDate { get; set; }

        /// <summary>Number of bedrooms.</summary>
        public int? Bedrooms { get; set; }

        /// <summary>Number of bathrooms.</summary>
        public decimal? Bathrooms { get; set; }

        /// <summary>Living area in square feet.</summary>
        public int? SquareFeet { get; set; }

        /// <summary>Year built.</summary>
        public int? YearBuilt { get; set; }

        /// <summary>Lot size in square feet.</summary>
        public int? LotSizeSqFt { get; set; }

        /// <summary>Property type (e.g., SingleFamily, Condo).</summary>
        public string PropertyType { get; set; } = string.Empty;

        /// <summary>UTC timestamp of data retrieval.</summary>
        public DateTime RetrievedAtUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Interface for Zillow data access.
    /// </summary>
    public interface IZillowService
    {
        /// <summary>Gets a Zillow estimate by address.</summary>
        Task<ZillowEstimate?> GetEstimateByAddressAsync(string address, string city, string state, CancellationToken ct = default);

        /// <summary>Gets comparable sales from Zillow for an address.</summary>
        Task<IReadOnlyList<ZillowEstimate>> GetComparablesAsync(string address, string city, string state, int count = 10, CancellationToken ct = default);

        /// <summary>Tests Zillow API connectivity.</summary>
        Task<bool> TestConnectivityAsync(CancellationToken ct = default);
    }

    /// <summary>
    /// Stub service for accessing Zillow property data.
    /// API key and base URL are loaded from IConfiguration under "DataMining:Zillow".
    /// No actual API calls are made in this stub.
    /// </summary>
    public class ZillowService : IZillowService
    {
        private readonly ILogger<ZillowService> _logger;
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Initializes the Zillow service stub.
        /// </summary>
        /// <param name="logger">Logger instance.</param>
        /// <param name="configuration">Application configuration (API key from config only).</param>
        public ZillowService(ILogger<ZillowService> logger, IConfiguration configuration)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        /// <inheritdoc />
        public Task<ZillowEstimate?> GetEstimateByAddressAsync(
            string address, string city, string state, CancellationToken ct = default)
        {
            _logger.LogInformation(
                "[Zillow] Stub: GetEstimateByAddress for {Address}, {City}, {State}",
                address, city, state);
            return Task.FromResult<ZillowEstimate?>(null);
        }

        /// <inheritdoc />
        public Task<IReadOnlyList<ZillowEstimate>> GetComparablesAsync(
            string address, string city, string state, int count = 10, CancellationToken ct = default)
        {
            _logger.LogInformation(
                "[Zillow] Stub: GetComparables for {Address}, {City}, {State}",
                address, city, state);
            IReadOnlyList<ZillowEstimate> empty = Array.Empty<ZillowEstimate>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public Task<bool> TestConnectivityAsync(CancellationToken ct = default)
        {
            var hasApiKey = !string.IsNullOrWhiteSpace(
                _configuration["DataMining:Zillow:ApiKey"]);
            _logger.LogInformation(
                "[Zillow] Stub: TestConnectivity - API key present: {HasKey}", hasApiKey);
            return Task.FromResult(false);
        }
    }
}
