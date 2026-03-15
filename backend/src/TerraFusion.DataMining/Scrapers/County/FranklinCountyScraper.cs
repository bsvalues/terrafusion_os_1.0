// TMR-039: Franklin County scraper stub
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
    /// Scraper stub for Franklin County, WA property data.
    /// Franklin County uses a separate GIS portal and assessment system.
    /// All endpoints and credentials are loaded from IConfiguration.
    /// </summary>
    public class FranklinCountyScraper : BaseCountyScraper
    {
        private readonly IConfiguration _configuration;

        /// <inheritdoc />
        public override string CountyId => "franklin";

        /// <inheritdoc />
        public override string CountyName => "Franklin County";

        /// <inheritdoc />
        public override string FipsCode => "53021";

        /// <inheritdoc />
        public override string StateCode => "WA";

        /// <summary>GIS base URL from configuration.</summary>
        private string GisBaseUrl =>
            _configuration["DataMining:Counties:Franklin:GisBaseUrl"] ?? string.Empty;

        /// <summary>
        /// Initializes the Franklin County scraper stub.
        /// </summary>
        /// <param name="httpClient">HTTP client (injected).</param>
        /// <param name="logger">Logger instance.</param>
        /// <param name="configuration">Application configuration.</param>
        public FranklinCountyScraper(
            HttpClient httpClient,
            ILogger<FranklinCountyScraper> logger,
            IConfiguration configuration)
            : base(httpClient, logger, requestsPerMinute: 8)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        /// <inheritdoc />
        public override Task<IReadOnlyList<ScrapedRecord>> ScrapeAsync(
            IEnumerable<string> parcelIds, CancellationToken cancellationToken = default)
        {
            Logger.LogInformation("[FranklinCounty] Stub: ScrapeAsync called - not yet implemented");

            IReadOnlyList<ScrapedRecord> empty = Array.Empty<ScrapedRecord>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public override Task<bool> TestConnectivityAsync(
            CancellationToken cancellationToken = default)
        {
            var hasConfig = !string.IsNullOrWhiteSpace(GisBaseUrl);
            Logger.LogInformation(
                "[FranklinCounty] Stub: TestConnectivity - config present: {HasConfig}", hasConfig);

            return Task.FromResult(false);
        }
    }
}
