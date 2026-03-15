// TFR-089: Web scraper for county assessor public data
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Scrapers
{
    /// <summary>
    /// Represents a single property record extracted from an assessor website.
    /// </summary>
    public class ScrapedPropertyRecord
    {
        /// <summary>Parcel number as displayed on the assessor site.</summary>
        public string ParcelNumber { get; set; } = string.Empty;

        /// <summary>Situs (physical) address.</summary>
        public string? SitusAddress { get; set; }

        /// <summary>Owner name as displayed publicly.</summary>
        public string? OwnerName { get; set; }

        /// <summary>Total assessed value.</summary>
        public decimal? AssessedValue { get; set; }

        /// <summary>Land value component.</summary>
        public decimal? LandValue { get; set; }

        /// <summary>Improvement value component.</summary>
        public decimal? ImprovementValue { get; set; }

        /// <summary>Tax year for the values.</summary>
        public int? TaxYear { get; set; }

        /// <summary>Property class or type code.</summary>
        public string? PropertyType { get; set; }

        /// <summary>Acreage.</summary>
        public decimal? Acres { get; set; }

        /// <summary>Year built of primary improvement.</summary>
        public int? YearBuilt { get; set; }

        /// <summary>Source URL the record was scraped from.</summary>
        public string SourceUrl { get; set; } = string.Empty;

        /// <summary>UTC timestamp when the record was scraped.</summary>
        public DateTime ScrapedAt { get; set; } = DateTime.UtcNow;

        /// <summary>County name or FIPS code.</summary>
        public string County { get; set; } = string.Empty;

        /// <summary>Additional key-value data extracted from the page.</summary>
        public Dictionary<string, string> ExtendedFields { get; set; } = new();
    }

    /// <summary>
    /// Result of a scraping operation.
    /// </summary>
    public class ScrapeResult
    {
        /// <summary>Whether the scrape completed successfully.</summary>
        public bool Success { get; set; }

        /// <summary>Error message if the scrape failed.</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>Records extracted.</summary>
        public List<ScrapedPropertyRecord> Records { get; set; } = new();

        /// <summary>Total pages processed.</summary>
        public int PagesProcessed { get; set; }

        /// <summary>Duration of the scrape operation.</summary>
        public TimeSpan Duration { get; set; }

        /// <summary>Source domain that was scraped.</summary>
        public string Domain { get; set; } = string.Empty;
    }

    /// <summary>
    /// Interface for county assessor website scrapers.
    /// Implementations extract property records from public assessor data.
    /// </summary>
    public interface IAssessorScraper
    {
        /// <summary>
        /// Gets the county name this scraper targets.
        /// </summary>
        string CountyName { get; }

        /// <summary>
        /// Gets the base URL of the assessor website.
        /// </summary>
        string BaseUrl { get; }

        /// <summary>
        /// Scrapes a single property record by parcel number.
        /// </summary>
        /// <param name="parcelNumber">The parcel number to look up.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Scrape result with the property record if found.</returns>
        Task<ScrapeResult> ScrapeByParcelAsync(string parcelNumber, CancellationToken cancellationToken = default);

        /// <summary>
        /// Scrapes property records matching an address search.
        /// </summary>
        /// <param name="address">Address or partial address to search.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Scrape result with matching records.</returns>
        Task<ScrapeResult> ScrapeByAddressAsync(string address, CancellationToken cancellationToken = default);

        /// <summary>
        /// Scrapes a batch of property records by parcel number range.
        /// </summary>
        /// <param name="parcelNumbers">List of parcel numbers to look up.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Scrape result with all found records.</returns>
        Task<ScrapeResult> ScrapeBatchAsync(IEnumerable<string> parcelNumbers, CancellationToken cancellationToken = default);

        /// <summary>
        /// Tests whether the assessor website is reachable and the scraper can parse it.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>True if the site is reachable and parseable.</returns>
        Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Base implementation for assessor scrapers with rate limiting and error handling.
    /// Subclass this for county-specific scraping logic.
    /// </summary>
    public abstract class AssessorScraperBase : IAssessorScraper
    {
        private readonly HttpClient _httpClient;
        private readonly SemaphoreSlim _rateLimiter;
        private DateTime _lastRequestTime = DateTime.MinValue;

        /// <summary>
        /// Minimum delay between requests to the same domain.
        /// </summary>
        protected TimeSpan MinRequestInterval { get; set; } = TimeSpan.FromSeconds(2);

        /// <summary>
        /// Maximum concurrent requests.
        /// </summary>
        protected int MaxConcurrency { get; set; } = 2;

        /// <inheritdoc />
        public abstract string CountyName { get; }

        /// <inheritdoc />
        public abstract string BaseUrl { get; }

        /// <summary>
        /// Initializes the scraper with an HttpClient.
        /// </summary>
        /// <param name="httpClient">HttpClient instance (should be from IHttpClientFactory).</param>
        protected AssessorScraperBase(HttpClient httpClient)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _rateLimiter = new SemaphoreSlim(MaxConcurrency, MaxConcurrency);

            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
                "TerraFusion-Sync/1.0 (Government Property Data Integration)");
        }

        /// <inheritdoc />
        public abstract Task<ScrapeResult> ScrapeByParcelAsync(string parcelNumber, CancellationToken cancellationToken = default);

        /// <inheritdoc />
        public abstract Task<ScrapeResult> ScrapeByAddressAsync(string address, CancellationToken cancellationToken = default);

        /// <inheritdoc />
        public virtual async Task<ScrapeResult> ScrapeBatchAsync(
            IEnumerable<string> parcelNumbers,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            var allRecords = new List<ScrapedPropertyRecord>();
            var pagesProcessed = 0;

            foreach (var parcelNumber in parcelNumbers)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var result = await ScrapeByParcelAsync(parcelNumber, cancellationToken);
                if (result.Success)
                {
                    allRecords.AddRange(result.Records);
                    pagesProcessed += result.PagesProcessed;
                }
            }

            return new ScrapeResult
            {
                Success = true,
                Records = allRecords,
                PagesProcessed = pagesProcessed,
                Duration = DateTime.UtcNow - startTime,
                Domain = new Uri(BaseUrl).Host,
            };
        }

        /// <inheritdoc />
        public virtual async Task<bool> TestConnectionAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var response = await _httpClient.GetAsync(BaseUrl, cancellationToken);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Fetches a URL with rate limiting applied.
        /// </summary>
        /// <param name="url">URL to fetch.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Response body as string.</returns>
        protected async Task<string> FetchWithRateLimitAsync(string url, CancellationToken cancellationToken = default)
        {
            await _rateLimiter.WaitAsync(cancellationToken);
            try
            {
                var elapsed = DateTime.UtcNow - _lastRequestTime;
                if (elapsed < MinRequestInterval)
                {
                    await Task.Delay(MinRequestInterval - elapsed, cancellationToken);
                }

                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                _lastRequestTime = DateTime.UtcNow;
                return await response.Content.ReadAsStringAsync(cancellationToken);
            }
            finally
            {
                _rateLimiter.Release();
            }
        }
    }
}
