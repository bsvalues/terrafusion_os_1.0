// TMR-077: NARRPR data access service
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Scrapers;

namespace TerraFusion.DataMining.Services
{
    /// <summary>
    /// Processed NARRPR data record for use in assessments.
    /// </summary>
    public class NarrprPropertyData
    {
        /// <summary>Property address.</summary>
        public string Address { get; set; } = string.Empty;

        /// <summary>City.</summary>
        public string City { get; set; } = string.Empty;

        /// <summary>State code.</summary>
        public string State { get; set; } = string.Empty;

        /// <summary>Estimated market value.</summary>
        public decimal? EstimatedValue { get; set; }

        /// <summary>Number of comparable sales found.</summary>
        public int ComparableCount { get; set; }

        /// <summary>Comparable sale details.</summary>
        public List<NarrprComparable> Comparables { get; set; } = new();

        /// <summary>Data freshness timestamp.</summary>
        public DateTime RetrievedAtUtc { get; set; } = DateTime.UtcNow;

        /// <summary>Whether this data is from cache or live retrieval.</summary>
        public bool IsCached { get; set; }
    }

    /// <summary>
    /// Interface for the NARRPR data access service.
    /// </summary>
    public interface INarrprService
    {
        /// <summary>Gets NARRPR data for a property by address.</summary>
        Task<NarrprPropertyData?> GetPropertyDataAsync(string address, string city, string state, CancellationToken ct = default);

        /// <summary>Gets NARRPR data for a property by parcel number.</summary>
        Task<NarrprPropertyData?> GetPropertyDataByParcelAsync(string parcelNumber, string countyId, CancellationToken ct = default);

        /// <summary>Checks if the NARRPR service is available.</summary>
        Task<bool> IsAvailableAsync(CancellationToken ct = default);
    }

    /// <summary>
    /// Service layer for NARRPR data access. Wraps the NARRPR scraper
    /// with caching, error handling, and data normalization.
    /// </summary>
    public class NarrprService : INarrprService
    {
        private readonly INarrprScraper _scraper;
        private readonly ILogger<NarrprService> _logger;

        /// <summary>
        /// Initializes the NARRPR service.
        /// </summary>
        /// <param name="scraper">NARRPR scraper instance.</param>
        /// <param name="logger">Logger instance.</param>
        public NarrprService(INarrprScraper scraper, ILogger<NarrprService> logger)
        {
            _scraper = scraper ?? throw new ArgumentNullException(nameof(scraper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<NarrprPropertyData?> GetPropertyDataAsync(
            string address, string city, string state, CancellationToken ct = default)
        {
            _logger.LogInformation(
                "[NarrprService] Fetching data for {Address}, {City}, {State}",
                address, city, state);

            try
            {
                var report = await _scraper.GetReportByAddressAsync(address, city, state, ct);
                if (report == null)
                    return null;

                return MapReportToData(report);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[NarrprService] Failed to fetch data for {Address}", address);
                return null;
            }
        }

        /// <inheritdoc />
        public async Task<NarrprPropertyData?> GetPropertyDataByParcelAsync(
            string parcelNumber, string countyId, CancellationToken ct = default)
        {
            _logger.LogInformation(
                "[NarrprService] Fetching data for parcel {Parcel} in {County}",
                parcelNumber, countyId);

            try
            {
                var report = await _scraper.GetReportByParcelAsync(parcelNumber, countyId, ct);
                if (report == null)
                    return null;

                return MapReportToData(report);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[NarrprService] Failed to fetch data for parcel {Parcel}", parcelNumber);
                return null;
            }
        }

        /// <inheritdoc />
        public Task<bool> IsAvailableAsync(CancellationToken ct = default)
        {
            return _scraper.TestConnectivityAsync(ct);
        }

        /// <summary>
        /// Maps a raw NARRPR report to the service data model.
        /// </summary>
        private static NarrprPropertyData MapReportToData(NarrprReport report)
        {
            return new NarrprPropertyData
            {
                Address = report.Address,
                City = report.City,
                State = report.State,
                EstimatedValue = report.EstimatedValue,
                ComparableCount = report.Comparables.Count,
                Comparables = report.Comparables,
                RetrievedAtUtc = report.RetrievedAtUtc,
                IsCached = false,
            };
        }
    }
}
