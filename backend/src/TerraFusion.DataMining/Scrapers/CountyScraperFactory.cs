// TMR-037: Factory for creating county-specific scraper instances
using System;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Scrapers
{
    /// <summary>
    /// Interface for the county scraper factory.
    /// </summary>
    public interface ICountyScraperFactory
    {
        /// <summary>
        /// Creates a scraper instance for the specified county.
        /// </summary>
        /// <param name="countyId">County identifier (e.g., "benton", "franklin").</param>
        /// <returns>A configured county scraper, or null if the county is not supported.</returns>
        BaseCountyScraper? CreateScraper(string countyId);

        /// <summary>
        /// Returns all supported county identifiers.
        /// </summary>
        /// <returns>Collection of supported county IDs.</returns>
        IReadOnlyList<string> GetSupportedCounties();
    }

    /// <summary>
    /// Factory that creates county-specific scraper instances using the DI container.
    /// Scrapers are resolved from the service provider to ensure proper HTTP client
    /// and configuration injection.
    /// </summary>
    public class CountyScraperFactory : ICountyScraperFactory
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CountyScraperFactory> _logger;

        private static readonly Dictionary<string, Type> ScraperRegistry = new(StringComparer.OrdinalIgnoreCase)
        {
            ["benton"] = typeof(County.BentonCountyScraper),
            ["franklin"] = typeof(County.FranklinCountyScraper),
            ["wallawalla"] = typeof(County.WallaWallaCountyScraper),
        };

        /// <summary>
        /// Initializes the county scraper factory.
        /// </summary>
        /// <param name="serviceProvider">DI service provider for resolving scrapers.</param>
        /// <param name="logger">Logger instance.</param>
        public CountyScraperFactory(IServiceProvider serviceProvider, ILogger<CountyScraperFactory> logger)
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public BaseCountyScraper? CreateScraper(string countyId)
        {
            if (string.IsNullOrWhiteSpace(countyId))
            {
                _logger.LogWarning("CreateScraper called with null/empty countyId");
                return null;
            }

            if (!ScraperRegistry.TryGetValue(countyId, out var scraperType))
            {
                _logger.LogWarning("No scraper registered for county: {CountyId}", countyId);
                return null;
            }

            try
            {
                var scraper = (BaseCountyScraper)ActivatorUtilities.CreateInstance(
                    _serviceProvider, scraperType);
                _logger.LogInformation("Created scraper for county: {CountyId} ({Type})",
                    countyId, scraperType.Name);
                return scraper;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create scraper for county: {CountyId}", countyId);
                return null;
            }
        }

        /// <inheritdoc />
        public IReadOnlyList<string> GetSupportedCounties()
        {
            return new List<string>(ScraperRegistry.Keys).AsReadOnly();
        }
    }
}
