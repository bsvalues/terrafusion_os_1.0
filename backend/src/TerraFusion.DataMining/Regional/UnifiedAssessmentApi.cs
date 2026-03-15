// TMR-043: Unified assessment data API across PACS and GIS
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Regional
{
    /// <summary>
    /// Unified property assessment record merging data from PACS and GIS sources.
    /// </summary>
    public class UnifiedAssessmentRecord
    {
        /// <summary>Parcel number (canonical identifier).</summary>
        public string ParcelNumber { get; set; } = string.Empty;

        /// <summary>County identifier.</summary>
        public string CountyId { get; set; } = string.Empty;

        /// <summary>Property owner name.</summary>
        public string OwnerName { get; set; } = string.Empty;

        /// <summary>Situs address.</summary>
        public string SitusAddress { get; set; } = string.Empty;

        /// <summary>Property class code.</summary>
        public string PropertyClassCode { get; set; } = string.Empty;

        /// <summary>Land assessed value.</summary>
        public decimal? LandValue { get; set; }

        /// <summary>Improvement assessed value.</summary>
        public decimal? ImprovementValue { get; set; }

        /// <summary>Total assessed value.</summary>
        public decimal? TotalAssessedValue { get; set; }

        /// <summary>Assessment year.</summary>
        public int? AssessmentYear { get; set; }

        /// <summary>Land use code from GIS.</summary>
        public string LandUseCode { get; set; } = string.Empty;

        /// <summary>Lot acreage from GIS.</summary>
        public decimal? Acreage { get; set; }

        /// <summary>GeoJSON geometry from GIS (nullable).</summary>
        public string? GeometryGeoJson { get; set; }

        /// <summary>Most recent sale date.</summary>
        public DateTime? LastSaleDate { get; set; }

        /// <summary>Most recent sale price.</summary>
        public decimal? LastSalePrice { get; set; }

        /// <summary>Which data sources contributed to this record.</summary>
        public List<string> DataSources { get; set; } = new();

        /// <summary>UTC timestamp when this record was assembled.</summary>
        public DateTime RetrievedAtUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Interface for the unified assessment API.
    /// </summary>
    public interface IUnifiedAssessmentApi
    {
        /// <summary>Gets a unified property record by parcel number.</summary>
        Task<UnifiedAssessmentRecord?> GetByParcelAsync(string parcelNumber, string countyId, CancellationToken ct = default);

        /// <summary>Searches unified records by owner name.</summary>
        Task<IReadOnlyList<UnifiedAssessmentRecord>> SearchByOwnerAsync(string ownerName, string countyId, int maxResults = 50, CancellationToken ct = default);

        /// <summary>Searches unified records by address.</summary>
        Task<IReadOnlyList<UnifiedAssessmentRecord>> SearchByAddressAsync(string address, string countyId, int maxResults = 50, CancellationToken ct = default);

        /// <summary>Gets data source health status.</summary>
        Task<Dictionary<string, bool>> GetDataSourceHealthAsync(CancellationToken ct = default);
    }

    /// <summary>
    /// Provides a unified view of assessment data by merging records from
    /// the PACS database and GIS layers. When both sources have data for
    /// the same parcel, PACS is authoritative for values and GIS is
    /// authoritative for spatial data.
    /// </summary>
    public class UnifiedAssessmentApi : IUnifiedAssessmentApi
    {
        private readonly IBentonPacsConnector _pacsConnector;
        private readonly IBentonGisConnector _gisConnector;
        private readonly ILogger<UnifiedAssessmentApi> _logger;

        /// <summary>
        /// Initializes the unified assessment API.
        /// </summary>
        /// <param name="pacsConnector">PACS database connector.</param>
        /// <param name="gisConnector">GIS REST connector.</param>
        /// <param name="logger">Logger instance.</param>
        public UnifiedAssessmentApi(
            IBentonPacsConnector pacsConnector,
            IBentonGisConnector gisConnector,
            ILogger<UnifiedAssessmentApi> logger)
        {
            _pacsConnector = pacsConnector ?? throw new ArgumentNullException(nameof(pacsConnector));
            _gisConnector = gisConnector ?? throw new ArgumentNullException(nameof(gisConnector));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<UnifiedAssessmentRecord?> GetByParcelAsync(
            string parcelNumber, string countyId, CancellationToken ct = default)
        {
            _logger.LogInformation(
                "[UnifiedAssessment] Looking up parcel {Parcel} in county {County}",
                parcelNumber, countyId);

            // Query both sources in parallel
            var pacsTask = _pacsConnector.GetByParcelNumberAsync(parcelNumber, ct);
            var gisTask = _gisConnector.GetParcelByIdAsync(parcelNumber, ct);

            await Task.WhenAll(pacsTask, gisTask);

            var pacsRecord = await pacsTask;
            var gisFeature = await gisTask;

            if (pacsRecord == null && gisFeature == null)
            {
                return null;
            }

            return MergeRecords(parcelNumber, countyId, pacsRecord, gisFeature);
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<UnifiedAssessmentRecord>> SearchByOwnerAsync(
            string ownerName, string countyId, int maxResults = 50, CancellationToken ct = default)
        {
            _logger.LogInformation("[UnifiedAssessment] Searching by owner: {Owner}", ownerName);

            var pacsResults = await _pacsConnector.SearchByOwnerAsync(ownerName, maxResults, ct);

            var unified = pacsResults.Select(p => new UnifiedAssessmentRecord
            {
                ParcelNumber = p.ParcelNumber,
                CountyId = countyId,
                OwnerName = p.OwnerName,
                SitusAddress = p.SitusAddress,
                TotalAssessedValue = p.TotalAssessedValue,
                DataSources = new List<string> { "PACS" }
            }).ToList();

            return unified.AsReadOnly();
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<UnifiedAssessmentRecord>> SearchByAddressAsync(
            string address, string countyId, int maxResults = 50, CancellationToken ct = default)
        {
            _logger.LogInformation("[UnifiedAssessment] Searching by address: {Address}", address);

            var pacsResults = await _pacsConnector.SearchByAddressAsync(address, maxResults, ct);

            var unified = pacsResults.Select(p => new UnifiedAssessmentRecord
            {
                ParcelNumber = p.ParcelNumber,
                CountyId = countyId,
                OwnerName = p.OwnerName,
                SitusAddress = p.SitusAddress,
                TotalAssessedValue = p.TotalAssessedValue,
                DataSources = new List<string> { "PACS" }
            }).ToList();

            return unified.AsReadOnly();
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, bool>> GetDataSourceHealthAsync(
            CancellationToken ct = default)
        {
            var pacsHealth = await _pacsConnector.TestConnectivityAsync(ct);
            var gisHealth = await _gisConnector.TestConnectivityAsync(ct);

            return new Dictionary<string, bool>
            {
                ["PACS"] = pacsHealth,
                ["GIS"] = gisHealth,
            };
        }

        /// <summary>
        /// Merges PACS and GIS data into a unified record.
        /// PACS is authoritative for assessment values; GIS is authoritative for spatial data.
        /// </summary>
        private static UnifiedAssessmentRecord MergeRecords(
            string parcelNumber, string countyId,
            PacsPropertyRecord? pacs, GisParcelFeature? gis)
        {
            var record = new UnifiedAssessmentRecord
            {
                ParcelNumber = parcelNumber,
                CountyId = countyId,
            };

            if (pacs != null)
            {
                record.OwnerName = pacs.OwnerName;
                record.SitusAddress = pacs.SitusAddress;
                record.PropertyClassCode = pacs.PropertyClassCode;
                record.LandValue = pacs.LandValue;
                record.ImprovementValue = pacs.ImprovementValue;
                record.TotalAssessedValue = pacs.TotalAssessedValue;
                record.AssessmentYear = pacs.AssessmentYear;
                record.LastSaleDate = pacs.LastSaleDate;
                record.LastSalePrice = pacs.LastSalePrice;
                record.DataSources.Add("PACS");
            }

            if (gis != null)
            {
                record.LandUseCode = gis.LandUseCode;
                record.Acreage = gis.Acreage;
                record.GeometryGeoJson = gis.GeometryGeoJson;
                // GIS can fill in address/owner if PACS didn't have it
                if (string.IsNullOrWhiteSpace(record.SitusAddress))
                    record.SitusAddress = gis.SitusAddress;
                if (string.IsNullOrWhiteSpace(record.OwnerName))
                    record.OwnerName = gis.OwnerName;
                record.DataSources.Add("GIS");
            }

            return record;
        }
    }
}
