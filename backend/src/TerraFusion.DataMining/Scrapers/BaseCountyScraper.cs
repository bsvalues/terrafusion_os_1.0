// TMR-036: Abstract base class for county web scrapers
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Scrapers
{
    /// <summary>
    /// Represents a single scraped record from a county data source.
    /// </summary>
    public class ScrapedRecord
    {
        /// <summary>Source system identifier (e.g., parcel number).</summary>
        public string SourceId { get; set; } = string.Empty;

        /// <summary>Name of the data source this record came from.</summary>
        public string SourceName { get; set; } = string.Empty;

        /// <summary>Raw key-value data extracted from the source.</summary>
        public Dictionary<string, string> Fields { get; set; } = new();

        /// <summary>UTC timestamp when this record was scraped.</summary>
        public DateTime ScrapedAtUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Abstract base class for all county-specific web scrapers.
    /// Provides rate limiting, browser-like HTTP headers, and standardized
    /// error handling for responsible data collection.
    /// </summary>
    public abstract class BaseCountyScraper : IDisposable
    {
        /// <summary>Logger for the derived scraper.</summary>
        protected readonly ILogger Logger;

        /// <summary>Pre-configured HTTP client with browser-like headers.</summary>
        protected readonly HttpClient HttpClient;

        private readonly SemaphoreSlim _rateLimiter;
        private readonly TimeSpan _requestDelay;
        private bool _disposed;

        /// <summary>Unique identifier for the county this scraper targets.</summary>
        public abstract string CountyId { get; }

        /// <summary>Human-readable county name.</summary>
        public abstract string CountyName { get; }

        /// <summary>FIPS code for the county.</summary>
        public abstract string FipsCode { get; }

        /// <summary>State abbreviation (e.g., "WA").</summary>
        public abstract string StateCode { get; }

        /// <summary>
        /// Initializes the base scraper with rate limiting and browser-like headers.
        /// </summary>
        /// <param name="httpClient">HTTP client instance (injected via factory).</param>
        /// <param name="logger">Logger instance.</param>
        /// <param name="requestsPerMinute">Maximum requests per minute (default: 10).</param>
        protected BaseCountyScraper(HttpClient httpClient, ILogger logger, int requestsPerMinute = 10)
        {
            HttpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _rateLimiter = new SemaphoreSlim(1, 1);
            _requestDelay = TimeSpan.FromMilliseconds(60_000.0 / requestsPerMinute);

            ConfigureBrowserHeaders(httpClient);
        }

        /// <summary>
        /// Scrapes property records for the given parcel identifiers.
        /// </summary>
        /// <param name="parcelIds">Parcel identifiers to look up.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Collection of scraped records.</returns>
        public abstract Task<IReadOnlyList<ScrapedRecord>> ScrapeAsync(
            IEnumerable<string> parcelIds, CancellationToken cancellationToken = default);

        /// <summary>
        /// Tests connectivity to the county data source.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>True if the data source is reachable.</returns>
        public abstract Task<bool> TestConnectivityAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Sends a rate-limited HTTP GET request with browser-like headers.
        /// </summary>
        /// <param name="url">URL to request.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>HTTP response message.</returns>
        protected async Task<HttpResponseMessage> RateLimitedGetAsync(
            string url, CancellationToken cancellationToken = default)
        {
            await _rateLimiter.WaitAsync(cancellationToken);
            try
            {
                Logger.LogDebug("[{County}] GET {Url}", CountyName, url);
                var response = await HttpClient.GetAsync(url, cancellationToken);
                await Task.Delay(_requestDelay, cancellationToken);
                return response;
            }
            finally
            {
                _rateLimiter.Release();
            }
        }

        /// <summary>
        /// Configures browser-like headers on the HTTP client to avoid bot detection.
        /// </summary>
        private static void ConfigureBrowserHeaders(HttpClient client)
        {
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            client.DefaultRequestHeaders.Add("Accept",
                "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7");
            client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
            client.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate, br");
        }

        /// <inheritdoc />
        public void Dispose()
        {
            if (!_disposed)
            {
                _rateLimiter.Dispose();
                _disposed = true;
            }
            GC.SuppressFinalize(this);
        }
    }
}
