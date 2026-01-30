// TerraFusion Codex: 3-6-9 Framework - API Controller
// Elite Systems Architecture by MIT PhD Agent

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// API Controller for Codex 3-6-9 Framework
    /// Provides endpoints for government OS excellence measurement
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CodexController : ControllerBase
    {
        private readonly ICodexService _codexService;
        private readonly ILogger<CodexController> _logger;

        public CodexController(
            ICodexService codexService,
            ILogger<CodexController> logger)
        {
            _codexService = codexService;
            _logger = logger;
        }

        /// <summary>
        /// Get system-wide ultimate power score
        /// </summary>
        /// <returns>Ultimate power score (0-12)</returns>
        [HttpGet("ultimate-power")]
        public async Task<ActionResult<double>> GetUltimatePower()
        {
            _logger.LogInformation("Calculating system-wide ultimate power");

            var codex = await _codexService.GetSystemWideCodexAsync();
            var ultimatePower = await _codexService.CalculateSystemWideUltimatePowerAsync(codex);

            return Ok(new
            {
                score = ultimatePower,
                maxScore = CodexConstants.FOUNDATION_MAX,
                percentage = (ultimatePower / CodexConstants.FOUNDATION_MAX) * 100,
                alertLevel = _codexService.DetermineAlertLevel(ultimatePower),
                timestamp = codex.Timestamp
            });
        }

        /// <summary>
        /// Get complete system codex with all domain scores
        /// </summary>
        [HttpGet("system-wide")]
        public async Task<ActionResult<object>> GetSystemWideCodex()
        {
            _logger.LogInformation("Retrieving system-wide codex");

            var codex = await _codexService.GetSystemWideCodexAsync();

            var domainScores = new Dictionary<string, double>
            {
                ["systemPerformance"] = _codexService.AmplifySystemHealth(codex.SystemPerformance),
                ["codeQuality"] = _codexService.AmplifyEngineeringExcellence(codex.CodeQuality),
                ["compliance"] = _codexService.AmplifyFISMACompliance(codex.Compliance)
            };

            var ultimatePower = await _codexService.CalculateSystemWideUltimatePowerAsync(codex);

            return Ok(new
            {
                timestamp = codex.Timestamp,
                ultimatePower = ultimatePower,
                alertLevel = _codexService.DetermineAlertLevel(ultimatePower),
                domainScores = domainScores,
                rawMetrics = new
                {
                    systemPerformance = codex.SystemPerformance,
                    codeQuality = codex.CodeQuality,
                    compliance = codex.Compliance
                }
            });
        }

        /// <summary>
        /// Get system performance metrics and score
        /// </summary>
        [HttpGet("system-performance")]
        public async Task<ActionResult<object>> GetSystemPerformance()
        {
            _logger.LogInformation("Retrieving system performance metrics");

            var metrics = await _codexService.GatherSystemPerformanceMetricsAsync();
            var score = _codexService.AmplifySystemHealth(metrics);

            return Ok(new
            {
                score = score,
                alertLevel = _codexService.DetermineAlertLevel(score),
                metrics = metrics
            });
        }

        /// <summary>
        /// Get code quality metrics and score
        /// </summary>
        [HttpGet("code-quality")]
        public async Task<ActionResult<object>> GetCodeQuality()
        {
            _logger.LogInformation("Retrieving code quality metrics");

            var metrics = await _codexService.GatherCodeQualityMetricsAsync();
            var score = _codexService.AmplifyEngineeringExcellence(metrics);

            return Ok(new
            {
                score = score,
                alertLevel = _codexService.DetermineAlertLevel(score),
                metrics = metrics
            });
        }

        /// <summary>
        /// Get compliance metrics and score
        /// </summary>
        [HttpGet("compliance")]
        public async Task<ActionResult<object>> GetCompliance()
        {
            _logger.LogInformation("Retrieving compliance metrics");

            var metrics = await _codexService.GatherComplianceMetricsAsync();
            var score = _codexService.AmplifyFISMACompliance(metrics);

            return Ok(new
            {
                score = score,
                alertLevel = _codexService.DetermineAlertLevel(score),
                metrics = metrics,
                fismaHighCompliant = score >= 10
            });
        }

        /// <summary>
        /// Compare codex scores across environments
        /// </summary>
        [HttpPost("compare")]
        public ActionResult<ComparisonResult> CompareEnvironments([FromBody] List<ComparativeCodex> codices)
        {
            _logger.LogInformation("Comparing {Count} codex environments", codices.Count);

            var comparison = _codexService.CompareEnvironments(codices);

            return Ok(comparison);
        }

        /// <summary>
        /// Health check endpoint
        /// </summary>
        [HttpGet("health")]
        public ActionResult Health()
        {
            return Ok(new
            {
                status = "Healthy",
                service = "Codex 3-6-9 Framework",
                framework = new
                {
                    foundation = 3,
                    amplification = 6,
                    ultimatePower = 9,
                    maxScore = CodexConstants.FOUNDATION_MAX
                }
            });
        }
    }
}
