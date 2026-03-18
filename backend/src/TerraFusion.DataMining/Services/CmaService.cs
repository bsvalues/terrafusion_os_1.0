// TMR-074: CMA (Comparative Market Analysis) service integrating multiple data sources
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Regional;

namespace TerraFusion.DataMining.Services
{
    /// <summary>
    /// A comparable property used in a CMA report.
    /// </summary>
    public class CmaComparable
    {
        /// <summary>Parcel number of the comparable.</summary>
        public string ParcelNumber { get; set; } = string.Empty;

        /// <summary>Property address.</summary>
        public string Address { get; set; } = string.Empty;

        /// <summary>Sale price.</summary>
        public decimal? SalePrice { get; set; }

        /// <summary>Sale date.</summary>
        public DateTime? SaleDate { get; set; }

        /// <summary>Living area in square feet.</summary>
        public int? SquareFeet { get; set; }

        /// <summary>Lot size in acres.</summary>
        public decimal? Acreage { get; set; }

        /// <summary>Year built.</summary>
        public int? YearBuilt { get; set; }

        /// <summary>Price per square foot.</summary>
        public decimal? PricePerSquareFoot { get; set; }

        /// <summary>Distance from subject in miles.</summary>
        public double? DistanceMiles { get; set; }

        /// <summary>Data source (PACS, GIS, Zillow, NARRPR).</summary>
        public string Source { get; set; } = string.Empty;

        /// <summary>Net adjustment amount applied.</summary>
        public decimal? AdjustmentAmount { get; set; }

        /// <summary>Adjusted sale price after adjustments.</summary>
        public decimal? AdjustedPrice { get; set; }
    }

    /// <summary>
    /// Result of a CMA analysis for a subject property.
    /// </summary>
    public class CmaReport
    {
        /// <summary>Subject parcel number.</summary>
        public string SubjectParcelNumber { get; set; } = string.Empty;

        /// <summary>Subject property address.</summary>
        public string SubjectAddress { get; set; } = string.Empty;

        /// <summary>County identifier.</summary>
        public string CountyId { get; set; } = string.Empty;

        /// <summary>Comparable properties used in analysis.</summary>
        public List<CmaComparable> Comparables { get; set; } = new();

        /// <summary>Indicated value (median of adjusted comparables).</summary>
        public decimal? IndicatedValue { get; set; }

        /// <summary>Low end of value range.</summary>
        public decimal? ValueRangeLow { get; set; }

        /// <summary>High end of value range.</summary>
        public decimal? ValueRangeHigh { get; set; }

        /// <summary>Confidence score (0.0 to 1.0).</summary>
        public double ConfidenceScore { get; set; }

        /// <summary>Service availability status ("available" or "not-yet-available").</summary>
        public string Status { get; set; } = "available";

        /// <summary>Data sources used in this analysis.</summary>
        public List<string> DataSourcesUsed { get; set; } = new();

        /// <summary>UTC timestamp of report generation.</summary>
        public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Interface for the CMA service.
    /// </summary>
    public interface ICmaService
    {
        /// <summary>Generates a CMA report for a subject property.</summary>
        Task<CmaReport> GenerateReportAsync(string parcelNumber, string countyId, CancellationToken ct = default);
    }

    /// <summary>
    /// Service that generates Comparative Market Analysis reports by integrating
    /// data from PACS, GIS, and third-party sources (Zillow, NARRPR).
    /// </summary>
    public class CmaService : ICmaService
    {
        private readonly IUnifiedAssessmentApi _assessmentApi;
        private readonly ILogger<CmaService> _logger;

        /// <summary>
        /// Initializes the CMA service.
        /// </summary>
        /// <param name="assessmentApi">Unified assessment API for property data.</param>
        /// <param name="logger">Logger instance.</param>
        public CmaService(
            IUnifiedAssessmentApi assessmentApi,
            ILogger<CmaService> logger)
        {
            _assessmentApi = assessmentApi ?? throw new ArgumentNullException(nameof(assessmentApi));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<CmaReport> GenerateReportAsync(
            string parcelNumber, string countyId, CancellationToken ct = default)
        {
            _logger.LogInformation(
                "[CMA] Generating report for parcel {Parcel} in {County}",
                parcelNumber, countyId);

            var subject = await _assessmentApi.GetByParcelAsync(parcelNumber, countyId, ct);

            var report = new CmaReport
            {
                SubjectParcelNumber = parcelNumber,
                SubjectAddress = subject?.SitusAddress ?? "Unknown",
                CountyId = countyId,
                DataSourcesUsed = subject?.DataSources ?? new List<string>(),
                ConfidenceScore = 0.0,
                Status = "not-yet-available", // CMA multi-source integration pending (Post-R3)
            };

            _logger.LogWarning(
                "[CMA] Service not-yet-available: report for {Parcel} returned with zero comparables. Multi-source integration deferred to Post-R3.",
                parcelNumber);

            return report;
        }
    }
}
