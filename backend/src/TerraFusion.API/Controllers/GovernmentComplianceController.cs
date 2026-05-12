using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Services;
using TerraFusion.Abstractions.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Controllers
{
  /// <summary>
  /// Government compliance API.
  /// Compliance and certification claims must be backed by governed evidence.
  ///
  /// <para>PR-2 (Prometheus T3): explicitly tagged <c>[AllowAnonymous]</c>.
  /// Compliance status is operator-readable surface; the global
  /// <c>FallbackPolicy.RequireAuthenticatedUser()</c> now requires every
  /// controller to declare its auth posture explicitly. Pre-PR-2 this
  /// controller was untagged and silently anonymous — exactly the audit
  /// surface that motivated the FallbackPolicy fix.</para>
  /// </summary>
  [ApiController]
  [Route("api/compliance")]
  [Produces("application/json")]
  [AllowAnonymous]
  public class GovernmentComplianceController : ControllerBase
  {
    private readonly IGovernmentComplianceService _complianceService;
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<GovernmentComplianceController> _logger;

    public GovernmentComplianceController(
        IGovernmentComplianceService complianceService,
        IAuditLogger auditLogger,
        ILogger<GovernmentComplianceController> logger)
    {
      _complianceService = complianceService;
      _auditLogger = auditLogger;
      _logger = logger;
    }

    /// <summary>
    /// Validates component compliance against configured government standards.
    /// </summary>
    /// <param name="component">System component to validate</param>
    /// <param name="operation">Operation being performed</param>
    /// <returns>Comprehensive compliance validation result</returns>
    [HttpPost("validate")]
  [ProducesResponseType(typeof(GovernmentComplianceResult), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
  public async Task<ActionResult<GovernmentComplianceResult>> ValidateCompliance(
        [Required] string component,
        [Required] string operation)
    {
      try
      {
        _logger.LogInformation("Compliance validation requested: {Component}.{Operation}",
            component, operation);

        var result = await _complianceService.ValidateComplianceAsync(component, operation);

        await _auditLogger.LogApiCallAsync(
            HttpContext.Request.Method,
            HttpContext.Request.Path,
            result.OverallCompliant ? 200 : 207, // 207 = Multi-Status for partial compliance
            0, // Duration will be calculated elsewhere
            HttpContext.User?.FindFirst("sub")?.Value);

        if (result.OverallCompliant)
        {
          return Ok(result);
        }
        else
        {
          // Return 207 Multi-Status for partial compliance with detailed information
          return StatusCode(207, result);
        }
      }
      catch (ArgumentException ex)
      {
        _logger.LogWarning(ex, "Invalid compliance validation request: {Component}.{Operation}",
            component, operation);
        return BadRequest(new { error = "Invalid request parameters", details = ex.Message });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "🚨 Compliance validation failed: {Component}.{Operation}",
            component, operation);

        await _auditLogger.LogErrorAsync("COMPLIANCE_VALIDATION_API_ERROR", ex);

        return StatusCode(500, new { error = "Compliance validation service error", requestId = HttpContext.TraceIdentifier });
      }
    }

    /// <summary>
    /// Get current FISMA compliance status for the system
    /// </summary>
    [HttpGet("fisma/status")]
    [ProducesResponseType(typeof(FISMAComplianceStatus), 200)]
    public async Task<ActionResult<FISMAComplianceStatus>> GetFISMAStatus()
    {
      try
      {
        var result = await _complianceService.ValidateComplianceAsync("System", "FISMAStatus");

        var fismaStatus = new FISMAComplianceStatus
        {
          IsCompliant = result.FISMACompliant,
          ComplianceScore = result.FISMAScore ?? 0.0,
          LastValidated = result.Timestamp,
          SecurityControls = new List<SecurityControlStatus>(),
          CertificationLevel = result.FISMACompliant ? "Evidence compliant" : "Not certified",
          NextAssessment = default
        };

        await _auditLogger.LogApiCallAsync(HttpContext.Request.Method, HttpContext.Request.Path, 200, 0);

        return Ok(fismaStatus);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to get FISMA status");
        return StatusCode(500, new { error = "FISMA status retrieval failed" });
      }
    }

    /// <summary>
    /// Get current accessibility compliance status
    /// </summary>
    [HttpGet("wcag/status")]
    [ProducesResponseType(typeof(WCAGComplianceStatus), 200)]
    public async Task<ActionResult<WCAGComplianceStatus>> GetWCAGStatus()
    {
      try
      {
        var result = await _complianceService.ValidateComplianceAsync("UI", "WCAGStatus");

        var wcagStatus = new WCAGComplianceStatus
        {
          IsCompliant = result.WCAGCompliant,
          ComplianceScore = result.WCAGScore ?? 0.0,
          Level = "AA",
          LastValidated = result.Timestamp,
          Principles = new List<WCAGPrincipleStatus>(),
          NextAudit = default
        };

        await _auditLogger.LogApiCallAsync(HttpContext.Request.Method, HttpContext.Request.Path, 200, 0);

        return Ok(wcagStatus);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to get WCAG status");
        return StatusCode(500, new { error = "WCAG status retrieval failed" });
      }
    }

    /// <summary>
    /// Get Washington State county compliance evidence status.
    /// </summary>
    [HttpGet("counties/status")]
    [ProducesResponseType(typeof(CountyComplianceOverview), 200)]
    public async Task<ActionResult<CountyComplianceOverview>> GetCountyComplianceStatus()
    {
      try
      {
        var result = await _complianceService.ValidateComplianceAsync("Counties", "StatusOverview");

        var countyStatus = new CountyComplianceOverview
        {
          IsCompliant = result.CountyCompliant,
          OverallScore = result.CountyScore ?? 0.0,
          TotalCounties = 39,
          CompliantCounties = 0,
          LastValidated = result.Timestamp,
          CountyDetails = new List<CountyComplianceDetail>(),
          DataSovereigntyProtected = false,
          PublicRecordsCompliant = false,
          OpenGovernmentCompliant = false
        };

        await _auditLogger.LogApiCallAsync(HttpContext.Request.Method, HttpContext.Request.Path, 200, 0);

        return Ok(countyStatus);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to get county compliance status");
        return StatusCode(500, new { error = "County compliance status retrieval failed" });
      }
    }

    /// <summary>
    /// Get AI-agent compliance evidence status.
    /// </summary>
    [HttpGet("ai-agents/status")]
    [ProducesResponseType(typeof(AIAgentComplianceStatus), 200)]
    public async Task<ActionResult<AIAgentComplianceStatus>> GetAIAgentComplianceStatus()
    {
      try
      {
        var result = await _complianceService.ValidateComplianceAsync("AIAgents", "SwarmStatus");

        var agentStatus = new AIAgentComplianceStatus
        {
          IsCompliant = result.AIAgentCompliant,
          ComplianceScore = result.AIAgentScore ?? 0.0,
          TotalAgents = 0,
          CompliantAgents = 0,
          LastValidated = result.Timestamp,
          EthicsScore = 0.0,
          TransparencyScore = 0.0,
          BiasScore = 0.0,
          AgentCategories = new List<AgentCategoryCompliance>(),
          NextAudit = default
        };

        await _auditLogger.LogApiCallAsync(HttpContext.Request.Method, HttpContext.Request.Path, 200, 0);

        return Ok(agentStatus);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to get AI agent compliance status");
        return StatusCode(500, new { error = "AI agent compliance status retrieval failed" });
      }
    }

    /// <summary>
    /// Comprehensive compliance overview for all standards
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ComplianceDashboard), 200)]
    public async Task<ActionResult<ComplianceDashboard>> GetComplianceDashboard()
    {
      try
      {
        var result = await _complianceService.ValidateComplianceAsync("System", "OverallDashboard");

        var dashboard = new ComplianceDashboard
        {
          OverallCompliant = result.OverallCompliant,
          OverallScore = result.OverallScore,
          LastUpdated = result.Timestamp,

          FISMAStatus = new ComplianceStatusSummary
          {
            IsCompliant = result.FISMACompliant,
            Score = result.FISMAScore ?? 0.0,
            Status = result.FISMACompliant ? "Compliant" : "Non-Compliant",
            LastChecked = result.Timestamp
          },

          WCAGStatus = new ComplianceStatusSummary
          {
            IsCompliant = result.WCAGCompliant,
            Score = result.WCAGScore ?? 0.0,
            Status = result.WCAGCompliant ? "AA Compliant" : "Non-Compliant",
            LastChecked = result.Timestamp
          },

          CountyStatus = new ComplianceStatusSummary
          {
            IsCompliant = result.CountyCompliant,
            Score = result.CountyScore ?? 0.0,
            Status = result.CountyCompliant ? "Multi-County Compliant" : "Non-Compliant",
            LastChecked = result.Timestamp
          },

          AIAgentStatus = new ComplianceStatusSummary
          {
            IsCompliant = result.AIAgentCompliant,
            Score = result.AIAgentScore ?? 0.0,
            Status = result.AIAgentCompliant ? "Swarm Compliant" : "Non-Compliant",
            LastChecked = result.Timestamp
          },

          TotalViolations = result.Violations.Count,
          CriticalViolations = result.Violations.Count(v => v.Severity == ViolationSeverity.Critical),

          CertificationLevel = result.OverallCompliant ? "Evidence compliant" : "Not certified",

          GovernmentClassification = result.OverallCompliant
            ? "Evidence-backed compliance status"
            : "Compliance evidence incomplete"
        };

        await _auditLogger.LogApiCallAsync(HttpContext.Request.Method, HttpContext.Request.Path, 200, 0);

        return Ok(dashboard);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to get compliance dashboard");
        return StatusCode(500, new { error = "Compliance dashboard retrieval failed" });
      }
    }

    /// <summary>
    /// Get government certification status.
    /// </summary>
    [HttpGet("certification")]
    [ProducesResponseType(typeof(GovernmentCertificationStatus), 200)]
    public async Task<ActionResult<GovernmentCertificationStatus>> GetCertificationStatus()
    {
      try
      {
        var result = await _complianceService.ValidateComplianceAsync("System", "CertificationStatus");

        await _auditLogger.LogApiCallAsync(HttpContext.Request.Method, HttpContext.Request.Path, 503, 0);

        return StatusCode(503, new
        {
          error = "Government certification evidence is unavailable",
          overallCompliant = result.OverallCompliant,
          overallScore = result.OverallScore,
          violationCount = result.Violations.Count,
          requestId = HttpContext.TraceIdentifier
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to get certification status");
        return StatusCode(500, new { error = "Certification status retrieval failed" });
      }
    }
  }

  // Supporting DTOs for API responses
  public class FISMAComplianceStatus
  {
    public bool IsCompliant { get; set; }
    public double ComplianceScore { get; set; }
    public DateTime LastValidated { get; set; }
    public List<SecurityControlStatus> SecurityControls { get; set; } = new();
    public string CertificationLevel { get; set; } = string.Empty;
    public DateTime NextAssessment { get; set; }
  }

  public class SecurityControlStatus
  {
    public string ControlFamily { get; set; } = string.Empty;
    public string ControlName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime LastAssessed { get; set; }
  }

  public class WCAGComplianceStatus
  {
    public bool IsCompliant { get; set; }
    public double ComplianceScore { get; set; }
    public string Level { get; set; } = string.Empty;
    public DateTime LastValidated { get; set; }
    public List<WCAGPrincipleStatus> Principles { get; set; } = new();
    public DateTime NextAudit { get; set; }
  }

  public class WCAGPrincipleStatus
  {
    public string Principle { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Criteria { get; set; }
    public int CompliantCriteria { get; set; }
  }

  public class CountyComplianceOverview
  {
    public bool IsCompliant { get; set; }
    public double OverallScore { get; set; }
    public int TotalCounties { get; set; }
    public int CompliantCounties { get; set; }
    public DateTime LastValidated { get; set; }
    public List<CountyComplianceDetail> CountyDetails { get; set; } = new();
    public bool DataSovereigntyProtected { get; set; }
    public bool PublicRecordsCompliant { get; set; }
    public bool OpenGovernmentCompliant { get; set; }
  }

  public class CountyComplianceDetail
  {
    public string County { get; set; } = string.Empty;
    public double ComplianceScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public int PopulationServed { get; set; }
  }

  public class AIAgentComplianceStatus
  {
    public bool IsCompliant { get; set; }
    public double ComplianceScore { get; set; }
    public int TotalAgents { get; set; }
    public int CompliantAgents { get; set; }
    public DateTime LastValidated { get; set; }
    public double EthicsScore { get; set; }
    public double TransparencyScore { get; set; }
    public double BiasScore { get; set; }
    public List<AgentCategoryCompliance> AgentCategories { get; set; } = new();
    public DateTime NextAudit { get; set; }
  }

  public class AgentCategoryCompliance
  {
    public string Category { get; set; } = string.Empty;
    public int AgentCount { get; set; }
    public double ComplianceScore { get; set; }
    public string Status { get; set; } = string.Empty;
  }

  public class ComplianceDashboard
  {
    public bool OverallCompliant { get; set; }
    public double OverallScore { get; set; }
    public DateTime LastUpdated { get; set; }
    public ComplianceStatusSummary FISMAStatus { get; set; } = new();
    public ComplianceStatusSummary WCAGStatus { get; set; } = new();
    public ComplianceStatusSummary CountyStatus { get; set; } = new();
    public ComplianceStatusSummary AIAgentStatus { get; set; } = new();
    public int TotalViolations { get; set; }
    public int CriticalViolations { get; set; }
    public string CertificationLevel { get; set; } = string.Empty;
    public string GovernmentClassification { get; set; } = string.Empty;
  }

  public class ComplianceStatusSummary
  {
    public bool IsCompliant { get; set; }
    public double Score { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime LastChecked { get; set; }
  }

  public class GovernmentCertificationStatus
  {
    public string CertificationLevel { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public string CertifyingAuthority { get; set; } = string.Empty;
    public string CertificationId { get; set; } = string.Empty;
    public List<CertificationStandard> ComplianceStandards { get; set; } = new();
    public List<string> CapabilitiesCertified { get; set; } = new();
    public DateTime NextReview { get; set; }
    public string GovernmentEndorsement { get; set; } = string.Empty;
  }

  public class CertificationStandard
  {
    public string Standard { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double Score { get; set; }
  }
}
