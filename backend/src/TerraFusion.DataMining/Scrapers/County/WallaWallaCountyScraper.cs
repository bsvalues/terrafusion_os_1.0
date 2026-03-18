// TMR-040: Walla Walla County scraper stub
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Scrapers.County
{
    /// <summary>
    /// Scraper stub for Walla Walla County, WA property data.
    /// All endpoints and credentials are loaded from IConfiguration.
    /// </summary>
    public class WallaWallaCountyScraper : BaseCountyScraper
    {
        private readonly IConfiguration _configuration;

        /// <inheritdoc />
        public override string CountyId => "wallawalla";

        /// <inheritdoc />
        public override string CountyName => "Walla Walla County";

        /// <inheritdoc />
        public override string FipsCode => "53071";

        /// <inheritdoc />
        public override string StateCode => "WA";

        /// <summary>GIS base URL from configuration.</summary>
        private string GisBaseUrl =>
            _configuration["DataMining:Counties:WallaWalla:GisBaseUrl"] ?? string.Empty;

        /// <summary>
        /// Initializes the Walla Walla County scraper stub.
        /// </summary>
        /// <param name="httpClient">HTTP client (injected).</param>
        /// <param name="logger">Logger instance.</param>
        /// <param name="configuration">Application configuration.</param>
        public WallaWallaCountyScraper(
            HttpClient httpClient,
            ILogger<WallaWallaCountyScraper> logger,
            IConfiguration configuration)
            : base(httpClient, logger, requestsPerMinute: 6)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        /// <inheritdoc />
        public override Task<IReadOnlyList<ScrapedRecord>> ScrapeAsync(
            IEnumerable<string> parcelIds, CancellationToken cancellationToken = default)
        {
            Logger.LogInformation("[WallaWallaCounty] Stub: ScrapeAsync called - not yet implemented");

            IReadOnlyList<ScrapedRecord> empty = Array.Empty<ScrapedRecord>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public override Task<bool> TestConnectivityAsync(
            CancellationToken cancellationToken = default)
        {
            var hasConfig = !string.IsNullOrWhiteSpace(GisBaseUrl);
            Logger.LogInformation(
                "[WallaWallaCounty] Stub: TestConnectivity - config present: {HasConfig}", hasConfig);

            return Task.FromResult(false);
        }
    }
}
