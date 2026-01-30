using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.AI.Services;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Codex 3-6-9 Framework - Executive Reports and Analytics Controller
///
/// Professional Reporting System:
/// - Daily operations reports for management
/// - Weekly executive summaries for C-level
/// - Monthly performance analysis for board
/// - Quarterly strategic reviews
/// - Annual championship reports for compliance
///
/// Export Formats:
/// - JSON (API integrations)
/// - CSV (data analysis)
/// - PDF (executive distribution)
/// - HTML (email reports)
///
/// Government Compliance:
/// - FISMA audit trail documentation
/// - Performance accountability reporting
/// - Stakeholder transparency requirements
/// - Board presentation materials
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
[ApiController]
[Route("api/codex/reports")]
[Authorize]
public class CodexReportsController : ControllerBase
{
    private readonly ICodexExecutiveReportService _reportService;
    private readonly ILogger<CodexReportsController> _logger;

    public CodexReportsController(
        ICodexExecutiveReportService reportService,
        ILogger<CodexReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Generate daily operations report
    /// Management-level summary of previous day's performance
    /// </summary>
    [HttpGet("daily")]
    [Authorize(Roles = "Admin,SystemAdministrator,CountyAdministrator,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailyReport(
        [FromQuery] string? countyId,
        [FromQuery] DateTime? date)
    {
        try
        {
            var targetDate = date ?? DateTime.UtcNow.Date.AddDays(-1);

            _logger.LogInformation("Generating daily report for {Date}, County: {County}",
                targetDate.ToShortDateString(), countyId ?? "System-Wide");

            var report = await _reportService.GenerateDailyReportAsync(countyId, targetDate);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate daily report");
            return StatusCode(500, new { error = "Failed to generate daily report" });
        }
    }

    /// <summary>
    /// Generate weekly executive summary
    /// C-level summary of week's operational excellence
    /// </summary>
    [HttpGet("weekly")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,Management")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWeeklyReport(
        [FromQuery] string? countyId,
        [FromQuery] DateTime? weekEnding)
    {
        try
        {
            var targetWeekEnd = weekEnding ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);

            _logger.LogInformation("Generating weekly report for week ending {Date}, County: {County}",
                targetWeekEnd.ToShortDateString(), countyId ?? "System-Wide");

            var report = await _reportService.GenerateWeeklyReportAsync(countyId, targetWeekEnd);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate weekly report");
            return StatusCode(500, new { error = "Failed to generate weekly report" });
        }
    }

    /// <summary>
    /// Generate monthly performance analysis
    /// Board-level monthly performance review
    /// </summary>
    [HttpGet("monthly")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,BoardMember")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlyReport(
        [FromQuery] string? countyId,
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        try
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            var targetMonth = month ?? DateTime.UtcNow.Month;

            _logger.LogInformation("Generating monthly report for {Year}-{Month}, County: {County}",
                targetYear, targetMonth, countyId ?? "System-Wide");

            var report = await _reportService.GenerateMonthlyReportAsync(countyId, targetYear, targetMonth);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate monthly report");
            return StatusCode(500, new { error = "Failed to generate monthly report" });
        }
    }

    /// <summary>
    /// Generate quarterly strategic review
    /// Stakeholder-level quarterly performance analysis
    /// </summary>
    [HttpGet("quarterly")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,BoardMember")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuarterlyReport(
        [FromQuery] string? countyId,
        [FromQuery] int? year,
        [FromQuery] int? quarter)
    {
        try
        {
            var targetYear = year ?? DateTime.UtcNow.Year;
            var targetQuarter = quarter ?? ((DateTime.UtcNow.Month - 1) / 3 + 1);

            _logger.LogInformation("Generating quarterly report for Q{Quarter} {Year}, County: {County}",
                targetQuarter, targetYear, countyId ?? "System-Wide");

            var report = await _reportService.GenerateQuarterlyReportAsync(countyId, targetYear, targetQuarter);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate quarterly report");
            return StatusCode(500, new { error = "Failed to generate quarterly report" });
        }
    }

    /// <summary>
    /// Generate annual championship report
    /// Government compliance and stakeholder annual review
    /// </summary>
    [HttpGet("annual")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,BoardMember")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnnualReport(
        [FromQuery] string? countyId,
        [FromQuery] int? year)
    {
        try
        {
            var targetYear = year ?? DateTime.UtcNow.Year - 1;

            _logger.LogInformation("Generating annual report for {Year}, County: {County}",
                targetYear, countyId ?? "System-Wide");

            var report = await _reportService.GenerateAnnualReportAsync(countyId, targetYear);

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate annual report");
            return StatusCode(500, new { error = "Failed to generate annual report" });
        }
    }

    /// <summary>
    /// Export report to CSV format
    /// Data analysis and spreadsheet integration
    /// </summary>
    [HttpPost("export/csv")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,DataAnalyst")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [Produces("text/csv")]
    public async Task<IActionResult> ExportReportToCsv([FromBody] ExportReportRequest request)
    {
        try
        {
            var report = await GetReportByType(request);
            var csv = await _reportService.ExportReportToCsvAsync(report);

            var fileName = $"codex-report-{request.ReportType}-{DateTime.UtcNow:yyyyMMdd}.csv";

            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export report to CSV");
            return StatusCode(500, new { error = "Failed to export report to CSV" });
        }
    }

    /// <summary>
    /// Export report to JSON format
    /// API integrations and programmatic access
    /// </summary>
    [HttpPost("export/json")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,DataAnalyst")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [Produces("application/json")]
    public async Task<IActionResult> ExportReportToJson([FromBody] ExportReportRequest request)
    {
        try
        {
            var report = await GetReportByType(request);
            var json = await _reportService.ExportReportToJsonAsync(report);

            var fileName = $"codex-report-{request.ReportType}-{DateTime.UtcNow:yyyyMMdd}.json";

            return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export report to JSON");
            return StatusCode(500, new { error = "Failed to export report to JSON" });
        }
    }

    /// <summary>
    /// Export report to PDF format
    /// Executive distribution and board presentations
    /// </summary>
    [HttpPost("export/pdf")]
    [Authorize(Roles = "Admin,SystemAdministrator,ExecutiveLeadership,BoardMember")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [Produces("application/pdf")]
    public async Task<IActionResult> ExportReportToPdf([FromBody] ExportReportRequest request)
    {
        try
        {
            var report = await GetReportByType(request);
            var pdf = await _reportService.ExportReportToPdfAsync(report);

            var fileName = $"codex-report-{request.ReportType}-{DateTime.UtcNow:yyyyMMdd}.pdf";

            return File(pdf, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export report to PDF");
            return StatusCode(500, new { error = "Failed to export report to PDF" });
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private async Task<ExecutiveReportDto> GetReportByType(ExportReportRequest request)
    {
        return request.ReportType.ToLowerInvariant() switch
        {
            "daily" => await _reportService.GenerateDailyReportAsync(
                request.CountyId,
                request.Date ?? DateTime.UtcNow.Date.AddDays(-1)),

            "weekly" => await _reportService.GenerateWeeklyReportAsync(
                request.CountyId,
                request.Date ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek)),

            "monthly" => await _reportService.GenerateMonthlyReportAsync(
                request.CountyId,
                request.Year ?? DateTime.UtcNow.Year,
                request.Month ?? DateTime.UtcNow.Month),

            "quarterly" => await _reportService.GenerateQuarterlyReportAsync(
                request.CountyId,
                request.Year ?? DateTime.UtcNow.Year,
                request.Quarter ?? ((DateTime.UtcNow.Month - 1) / 3 + 1)),

            "annual" => await _reportService.GenerateAnnualReportAsync(
                request.CountyId,
                request.Year ?? DateTime.UtcNow.Year - 1),

            _ => throw new ArgumentException($"Invalid report type: {request.ReportType}")
        };
    }
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

public class ExportReportRequest
{
    public string ReportType { get; set; } = "daily";
    public string? CountyId { get; set; }
    public DateTime? Date { get; set; }
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
}
