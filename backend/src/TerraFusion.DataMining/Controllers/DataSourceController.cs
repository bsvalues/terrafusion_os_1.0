// TMR-094: Data source configuration controller
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Regional;
using TerraFusion.DataMining.Scrapers;

namespace TerraFusion.DataMining.Controllers
{
    /// <summary>
    /// Represents a configured data source and its current status.
    /// </summary>
    public class DataSourceInfo
    {
        /// <summary>Unique data source identifier.</summary>
        public string SourceId { get; set; } = string.Empty;

        /// <summary>Human-readable name.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Source type (GIS, PACS, MLS, API).</summary>
        public string SourceType { get; set; } = string.Empty;

        /// <summary>Associated county (or "all").</summary>
        public string CountyId { get; set; } = string.Empty;

        /// <summary>Whether configuration is present.</summary>
        public bool IsConfigured { get; set; }

        /// <summary>Whether the source is currently reachable.</summary>
        public bool? IsConnected { get; set; }

        /// <summary>Last connectivity check time.</summary>
        public DateTime? LastCheckUtc { get; set; }

        /// <summary>Additional status notes.</summary>
        public string StatusMessage { get; set; } = string.Empty;
    }

    /// <summary>
    /// Controller for managing data source configurations and monitoring
    /// data source connectivity across the DataMining module.
    /// </summary>
    [ApiController]
    [Route("api/datamining/[controller]")]
    public class DataSourceController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUnifiedAssessmentApi _assessmentApi;
        private readonly ICountyScraperFactory _scraperFactory;
        private readonly ILogger<DataSourceController> _logger;

        /// <summary>
        /// Initializes the data source controller.
        /// </summary>
        /// <param name="configuration">Application configuration.</param>
        /// <param name="assessmentApi">Unified assessment API.</param>
        /// <param name="scraperFactory">County scraper factory.</param>
        /// <param name="logger">Logger instance.</param>
        public DataSourceController(
            IConfiguration configuration,
            IUnifiedAssessmentApi assessmentApi,
            ICountyScraperFactory scraperFactory,
            ILogger<DataSourceController> logger)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _assessmentApi = assessmentApi ?? throw new ArgumentNullException(nameof(assessmentApi));
            _scraperFactory = scraperFactory ?? throw new ArgumentNullException(nameof(scraperFactory));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Lists all configured data sources and their current status.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>List of data source configurations.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DataSourceInfo>>> GetDataSources(
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[DataSource] Listing all data sources");

            var sources = new List<DataSourceInfo>();

            // PACS data source
            var pacsConnStr = _configuration.GetConnectionString("BentonPacs");
            sources.Add(new DataSourceInfo
            {
                SourceId = "benton-pacs",
                Name = "Benton County PACS (Harris 9.0)",
                SourceType = "PACS",
                CountyId = "benton",
                IsConfigured = !string.IsNullOrWhiteSpace(pacsConnStr),
                StatusMessage = "Credential-file type connector"
            });

            // GIS data source
            var gisUrl = _configuration["DataMining:BentonGis:BaseUrl"];
            sources.Add(new DataSourceInfo
            {
                SourceId = "benton-gis",
                Name = "Benton County ArcGIS REST",
                SourceType = "GIS",
                CountyId = "benton",
                IsConfigured = !string.IsNullOrWhiteSpace(gisUrl),
                StatusMessage = "Public ArcGIS REST endpoint"
            });

            // Zillow
            var zillowKey = _configuration["DataMining:Zillow:ApiKey"];
            sources.Add(new DataSourceInfo
            {
                SourceId = "zillow",
                Name = "Zillow API",
                SourceType = "API",
                CountyId = "all",
                IsConfigured = !string.IsNullOrWhiteSpace(zillowKey),
                StatusMessage = "Third-party property data"
            });

            // NARRPR
            var narrprUrl = _configuration["DataMining:Narrpr:BaseUrl"];
            sources.Add(new DataSourceInfo
            {
                SourceId = "narrpr",
                Name = "NARRPR (Realtors Property Resource)",
                SourceType = "API",
                CountyId = "all",
                IsConfigured = !string.IsNullOrWhiteSpace(narrprUrl),
                StatusMessage = "NAR member data access"
            });

            // County scrapers
            foreach (var countyId in _scraperFactory.GetSupportedCounties())
            {
                var meta = SeWaRegionalConfig.GetCounty(countyId);
                sources.Add(new DataSourceInfo
                {
                    SourceId = $"{countyId}-scraper",
                    Name = $"{meta?.Name ?? countyId} Web Scraper",
                    SourceType = "Scraper",
                    CountyId = countyId,
                    IsConfigured = true,
                    StatusMessage = "Stub implementation"
                });
            }

            return Ok(sources);
        }

        /// <summary>
        /// Tests connectivity for a specific data source.
        /// </summary>
        /// <param name="sourceId">Data source identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Connectivity test result.</returns>
        [HttpGet("{sourceId}/test")]
        public async Task<ActionResult<DataSourceInfo>> TestDataSource(
            string sourceId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[DataSource] Testing connectivity for {SourceId}", sourceId);

            // Stub: return disconnected status for all sources
            return Ok(new DataSourceInfo
            {
                SourceId = sourceId,
                IsConnected = false,
                LastCheckUtc = DateTime.UtcNow,
                StatusMessage = "Connectivity test - stub implementation"
            });
        }

        /// <summary>
        /// Gets the health summary of all data sources.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Health summary with source connectivity status.</returns>
        [HttpGet("health")]
        public async Task<ActionResult> GetHealthSummary(
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("[DataSource] Getting health summary");

            var health = await _assessmentApi.GetDataSourceHealthAsync(cancellationToken);

            return Ok(new
            {
                timestamp = DateTime.UtcNow,
                sources = health,
                overallStatus = health.Values.All(v => v) ? "healthy" : "degraded"
            });
        }

        /// <summary>
        /// Gets regional county metadata.
        /// </summary>
        /// <returns>SE Washington county metadata.</returns>
        [HttpGet("counties")]
        public ActionResult<IEnumerable<CountyMetadata>> GetCounties()
        {
            _logger.LogInformation("[DataSource] Listing county metadata");
            return Ok(SeWaRegionalConfig.Counties.Values);
        }
    }
}
