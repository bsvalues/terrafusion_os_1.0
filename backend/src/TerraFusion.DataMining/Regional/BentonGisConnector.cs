// TMR-041: ArcGIS REST API connector for Benton County parcel/assessment/ownership
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Regional
{
    /// <summary>
    /// GIS parcel feature returned from ArcGIS REST queries.
    /// </summary>
    public class GisParcelFeature
    {
        /// <summary>Parcel identifier.</summary>
        public string ParcelId { get; set; } = string.Empty;

        /// <summary>Situs (property) address.</summary>
        public string SitusAddress { get; set; } = string.Empty;

        /// <summary>Property owner name.</summary>
        public string OwnerName { get; set; } = string.Empty;

        /// <summary>Land use code.</summary>
        public string LandUseCode { get; set; } = string.Empty;

        /// <summary>Total assessed value.</summary>
        public decimal? AssessedValue { get; set; }

        /// <summary>Lot acreage.</summary>
        public decimal? Acreage { get; set; }

        /// <summary>GIS geometry as GeoJSON string (nullable).</summary>
        public string? GeometryGeoJson { get; set; }

        /// <summary>Raw attribute dictionary from ArcGIS.</summary>
        public Dictionary<string, object?> RawAttributes { get; set; } = new();
    }

    /// <summary>
    /// Interface for the Benton County GIS connector.
    /// </summary>
    public interface IBentonGisConnector
    {
        /// <summary>Queries parcels by parcel ID.</summary>
        Task<GisParcelFeature?> GetParcelByIdAsync(string parcelId, CancellationToken ct = default);

        /// <summary>Queries parcels by owner name (partial match).</summary>
        Task<IReadOnlyList<GisParcelFeature>> SearchByOwnerAsync(string ownerName, CancellationToken ct = default);

        /// <summary>Queries parcels by situs address (partial match).</summary>
        Task<IReadOnlyList<GisParcelFeature>> SearchByAddressAsync(string address, CancellationToken ct = default);

        /// <summary>Tests ArcGIS REST endpoint connectivity.</summary>
        Task<bool> TestConnectivityAsync(CancellationToken ct = default);
    }

    /// <summary>
    /// Connects to Benton County's public ArcGIS REST services for
    /// parcel, assessment, and ownership data. All configuration
    /// (base URLs, layer IDs) comes from IConfiguration.
    /// No credentials are stored in code.
    /// </summary>
    public class BentonGisConnector : IBentonGisConnector
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BentonGisConnector> _logger;
        private readonly IConfiguration _configuration;

        private string BaseUrl =>
            _configuration["DataMining:BentonGis:BaseUrl"]
            ?? "https://gis.co.benton.wa.us/arcgis/rest/services";

        private string ParcelLayerId =>
            _configuration["DataMining:BentonGis:ParcelLayerId"] ?? "0";

        /// <summary>
        /// Initializes the Benton County GIS connector.
        /// </summary>
        /// <param name="httpClient">HTTP client instance.</param>
        /// <param name="logger">Logger instance.</param>
        /// <param name="configuration">Application configuration.</param>
        public BentonGisConnector(
            HttpClient httpClient,
            ILogger<BentonGisConnector> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        /// <inheritdoc />
        public Task<GisParcelFeature?> GetParcelByIdAsync(
            string parcelId, CancellationToken ct = default)
        {
            _logger.LogInformation("[BentonGIS] Stub: GetParcelById for {ParcelId}", parcelId);

            // Stub: Would query ArcGIS REST:
            // GET {BaseUrl}/Parcels/MapServer/{LayerId}/query?where=PARCEL_ID='{parcelId}'&outFields=*&f=json
            return Task.FromResult<GisParcelFeature?>(null);
        }

        /// <inheritdoc />
        public Task<IReadOnlyList<GisParcelFeature>> SearchByOwnerAsync(
            string ownerName, CancellationToken ct = default)
        {
            _logger.LogInformation("[BentonGIS] Stub: SearchByOwner for {Owner}", ownerName);

            IReadOnlyList<GisParcelFeature> empty = Array.Empty<GisParcelFeature>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public Task<IReadOnlyList<GisParcelFeature>> SearchByAddressAsync(
            string address, CancellationToken ct = default)
        {
            _logger.LogInformation("[BentonGIS] Stub: SearchByAddress for {Address}", address);

            IReadOnlyList<GisParcelFeature> empty = Array.Empty<GisParcelFeature>();
            return Task.FromResult(empty);
        }

        /// <inheritdoc />
        public async Task<bool> TestConnectivityAsync(CancellationToken ct = default)
        {
            try
            {
                _logger.LogDebug("[BentonGIS] Testing connectivity to {Url}", BaseUrl);
                var response = await _httpClient.GetAsync($"{BaseUrl}?f=json", ct);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[BentonGIS] Connectivity test failed");
                return false;
            }
        }
    }
}
