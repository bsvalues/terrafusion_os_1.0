using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Data Quality Controller (TFT-014)
    /// Provides data quality reporting, issue tracking, and validation endpoints
    /// to ensure assessment data integrity and IAAO data quality standards compliance.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class DataQualityController : ControllerBase
    {
        private readonly IDataQualityService _dataQualityService;
        private readonly ILogger<DataQualityController> _logger;

        public DataQualityController(
            IDataQualityService dataQualityService,
            ILogger<DataQualityController> logger)
        {
            _dataQualityService = dataQualityService;
            _logger = logger;
        }

        /// <summary>
        /// Generate a data quality report for the current jurisdiction's assessment data.
        /// Evaluates completeness, consistency, accuracy, and timeliness of property records.
        /// </summary>
        /// <param name="propertyClass">Optional property class filter.</param>
        /// <returns>Comprehensive data quality report with scores and findings.</returns>
        [HttpGet("report")]
        [ProducesResponseType(typeof(DataQualityReport), StatusCodes.Status200OK)]
        public async Task<ActionResult<DataQualityReport>> GetReport([FromQuery] string? propertyClass = null)
        {
            try
            {
                _logger.LogInformation("Generating data quality report: PropertyClass={PropertyClass}", propertyClass ?? "All");

                var report = await _dataQualityService.GenerateReportAsync(propertyClass);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate data quality report");
                return StatusCode(500, new { error = "Failed to generate data quality report." });
            }
        }

        /// <summary>
        /// Retrieve outstanding data quality issues that require attention.
        /// Issues are prioritized by severity and impact on assessment accuracy.
        /// </summary>
        /// <param name="severity">Optional severity filter: Critical, High, Medium, Low.</param>
        /// <param name="category">Optional category filter: Missing, Inconsistent, Outlier, Stale.</param>
        /// <param name="page">Page number (default 1).</param>
        /// <param name="pageSize">Page size (default 50, max 200).</param>
        /// <returns>Paginated list of data quality issues.</returns>
        [HttpGet("issues")]
        [ProducesResponseType(typeof(DataQualityIssuesResult), StatusCodes.Status200OK)]
        public async Task<ActionResult<DataQualityIssuesResult>> GetIssues(
            [FromQuery] string? severity = null,
            [FromQuery] string? category = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                pageSize = Math.Clamp(pageSize, 1, 200);

                _logger.LogInformation(
                    "Retrieving data quality issues: Severity={Severity}, Category={Category}, Page={Page}",
                    severity ?? "All", category ?? "All", page);

                var result = await _dataQualityService.GetIssuesAsync(severity, category, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve data quality issues");
                return StatusCode(500, new { error = "Failed to retrieve data quality issues." });
            }
        }

        /// <summary>
        /// Validate a dataset or subset of property records against quality rules.
        /// Runs completeness checks, range validations, cross-field consistency rules,
        /// and outlier detection.
        /// </summary>
        /// <param name="request">Validation parameters including scope and rule sets.</param>
        /// <returns>Validation results with pass/fail counts and specific findings.</returns>
        [HttpPost("validate")]
        [ProducesResponseType(typeof(DataValidationResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<DataValidationResult>> ValidateDataset([FromBody] DataValidationRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "Validating dataset: Scope={Scope}, RuleSetCount={RuleCount}",
                    request.Scope, request.RuleSets?.Count ?? 0);

                var result = await _dataQualityService.ValidateAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid data validation request");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dataset validation failed");
                return StatusCode(500, new { error = "Dataset validation failed." });
            }
        }
    }

    // DTOs for data quality operations

    /// <summary>Comprehensive data quality report for the jurisdiction.</summary>
    public class DataQualityReport
    {
        /// <summary>Overall data quality score (0-100).</summary>
        public decimal OverallScore { get; set; }
        /// <summary>Completeness score - percentage of required fields populated.</summary>
        public decimal CompletenessScore { get; set; }
        /// <summary>Consistency score - cross-field and cross-record consistency.</summary>
        public decimal ConsistencyScore { get; set; }
        /// <summary>Accuracy score - values within expected ranges.</summary>
        public decimal AccuracyScore { get; set; }
        /// <summary>Timeliness score - data freshness and update recency.</summary>
        public decimal TimelinessScore { get; set; }
        public int TotalRecordsEvaluated { get; set; }
        public int IssuesFound { get; set; }
        public int CriticalIssues { get; set; }
        public string PropertyClass { get; set; } = "All";
        public List<DataQualityFinding> TopFindings { get; set; } = new();
        public DateTime GeneratedAt { get; set; }
    }

    /// <summary>A specific data quality finding.</summary>
    public class DataQualityFinding
    {
        public string Category { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int AffectedRecords { get; set; }
        public string? RecommendedAction { get; set; }
    }

    /// <summary>Paginated list of data quality issues.</summary>
    public class DataQualityIssuesResult
    {
        public List<DataQualityIssue> Issues { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    /// <summary>A single data quality issue requiring attention.</summary>
    public class DataQualityIssue
    {
        public string IssueId { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;
        /// <summary>Issue category: Missing, Inconsistent, Outlier, Stale.</summary>
        public string Category { get; set; } = string.Empty;
        /// <summary>Severity: Critical, High, Medium, Low.</summary>
        public string Severity { get; set; } = string.Empty;
        /// <summary>Specific field or attribute affected.</summary>
        public string AffectedField { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CurrentValue { get; set; }
        public string? ExpectedRange { get; set; }
        public DateTime DetectedAt { get; set; }
        /// <summary>Whether the issue has been reviewed by an appraiser.</summary>
        public bool IsReviewed { get; set; }
    }

    /// <summary>Request to validate a dataset against quality rules.</summary>
    public class DataValidationRequest
    {
        /// <summary>Validation scope: All, PropertyClass, Neighborhood, ParcelList.</summary>
        public string Scope { get; set; } = "All";
        /// <summary>Property class filter when scope is PropertyClass.</summary>
        public string? PropertyClass { get; set; }
        /// <summary>Neighborhood code when scope is Neighborhood.</summary>
        public string? NeighborhoodCode { get; set; }
        /// <summary>Specific parcel IDs when scope is ParcelList.</summary>
        public List<string>? ParcelIds { get; set; }
        /// <summary>Rule sets to apply: Completeness, Range, Consistency, Outlier.</summary>
        public List<string>? RuleSets { get; set; }
    }

    /// <summary>Result of dataset validation.</summary>
    public class DataValidationResult
    {
        public int RecordsValidated { get; set; }
        public int RecordsPassed { get; set; }
        public int RecordsFailed { get; set; }
        public decimal PassRate { get; set; }
        public List<ValidationRuleResult> RuleResults { get; set; } = new();
        public DateTime ValidatedAt { get; set; }
    }

    /// <summary>Result for a single validation rule.</summary>
    public class ValidationRuleResult
    {
        public string RuleName { get; set; } = string.Empty;
        public string RuleSet { get; set; } = string.Empty;
        public int Passed { get; set; }
        public int Failed { get; set; }
        public decimal PassRate { get; set; }
        public List<string> SampleFailures { get; set; } = new();
    }

    /// <summary>Service interface for data quality operations.</summary>
    public interface IDataQualityService
    {
        Task<DataQualityReport> GenerateReportAsync(string? propertyClass);
        Task<DataQualityIssuesResult> GetIssuesAsync(string? severity, string? category, int page, int pageSize);
        Task<DataValidationResult> ValidateAsync(DataValidationRequest request);
    }
}
