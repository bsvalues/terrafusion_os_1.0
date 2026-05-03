using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text.Json;
using System.Collections.Concurrent;
using System.Diagnostics;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.API.Services
{
  /// <summary>
  /// Government compliance evidence service.
  /// Missing governed evidence must fail closed instead of producing certification claims.
  /// </summary>
  public class GovernmentComplianceService : BackgroundService, IGovernmentComplianceService
  {
    private readonly ILogger<GovernmentComplianceService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;

    // Compliance monitoring infrastructure
    private readonly ConcurrentDictionary<string, ComplianceStatus> _complianceStatusCache;
    private readonly ConcurrentDictionary<string, DateTime> _lastComplianceCheck;
    private readonly ConcurrentQueue<ComplianceViolation> _violationQueue;
    private readonly Timer _complianceMonitorTimer;
    private readonly SemaphoreSlim _complianceSemaphore;

    // FISMA compliance components
    private readonly ConcurrentDictionary<string, SecurityControl> _fismaControls;
    private readonly ConcurrentDictionary<string, AuditTrail> _auditTrails;

    // WCAG 2.1 AA accessibility compliance
    private readonly ConcurrentDictionary<string, AccessibilityStatus> _wcagCompliance;

    // Washington State multi-county compliance
    private readonly ConcurrentDictionary<string, CountyComplianceStatus> _countyCompliance;
    private readonly List<string> _washingtonStateCounties;

    // Compliance metrics
    private static readonly ActivitySource ActivitySource = new("TerraFusion.Compliance");
    private readonly ConcurrentDictionary<string, long> _complianceMetrics;

    // AI-agent compliance evidence collected by governed audits.
    private readonly ConcurrentDictionary<string, AgentComplianceStatus> _agentCompliance;

    public GovernmentComplianceService(
        ILogger<GovernmentComplianceService> logger,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
      _logger = logger;
      _configuration = configuration;
      _scopeFactory = scopeFactory;

      // Initialize compliance infrastructure
      _complianceStatusCache = new ConcurrentDictionary<string, ComplianceStatus>();
      _lastComplianceCheck = new ConcurrentDictionary<string, DateTime>();
      _violationQueue = new ConcurrentQueue<ComplianceViolation>();
      _complianceSemaphore = new SemaphoreSlim(1, 1);
      _fismaControls = new ConcurrentDictionary<string, SecurityControl>();
      _auditTrails = new ConcurrentDictionary<string, AuditTrail>();
      _wcagCompliance = new ConcurrentDictionary<string, AccessibilityStatus>();
      _countyCompliance = new ConcurrentDictionary<string, CountyComplianceStatus>();
      _complianceMetrics = new ConcurrentDictionary<string, long>();
      _agentCompliance = new ConcurrentDictionary<string, AgentComplianceStatus>();

      // Initialize Washington State counties (39 counties)
      _washingtonStateCounties = new List<string>
      {
        "Adams", "Asotin", "Benton", "Chelan", "Clallam", "Clark", "Columbia", "Cowlitz",
        "Douglas", "Ferry", "Franklin", "Garfield", "Grant", "Grays Harbor", "Island",
        "Jefferson", "King", "Kitsap", "Kittitas", "Klickitat", "Lewis", "Lincoln",
        "Mason", "Okanogan", "Pacific", "Pend Oreille", "Pierce", "San Juan", "Skagit",
        "Skamania", "Snohomish", "Spokane", "Stevens", "Thurston", "Wahkiakum", "Walla Walla",
        "Whatcom", "Whitman", "Yakima"
      };

      // Initialize compliance monitoring timer (every 5 minutes for real-time monitoring)
      var monitorInterval = TimeSpan.FromMinutes(
          configuration.GetValue<int>("TerraFusion:Compliance:MonitorIntervalMinutes", 5));
      _complianceMonitorTimer = new Timer(MonitorCompliance, null, TimeSpan.Zero, monitorInterval);

      // Initialize FISMA security controls
      InitializeFISMAControls();

      // Initialize WCAG accessibility standards
      InitializeWCAGCompliance();

      // Initialize county compliance baselines
      InitializeCountyCompliance();

      _logger.LogInformation("Government compliance service initialized. Counties configured: {CountyCount}, FISMA controls loaded: {FISMACount}",
          _washingtonStateCounties.Count, _fismaControls.Count);
    }

    /// <summary>
    /// Evidence-backed compliance validation across configured government standards.
    /// </summary>
  public async Task<GovernmentComplianceResult> ValidateComplianceAsync(string component, string operation)
    {
      using var activity = ActivitySource.StartActivity("TerraFusion.ComplianceValidation");
      activity?.SetTag("compliance.component", component);
      activity?.SetTag("compliance.operation", operation);

  var result = new GovernmentComplianceResult
      {
        Component = component,
        Operation = operation,
        Timestamp = DateTime.UtcNow,
        OverallCompliant = true,
        Violations = new List<ComplianceViolation>()
      };

      try
      {
        _logger.LogDebug("🔍 TIER 3 Compliance validation started: {Component}.{Operation}", component, operation);

        // FISMA Security Compliance Validation
        var fismaResult = await ValidateFISMAComplianceAsync(component, operation);
        result.FISMACompliant = fismaResult.IsCompliant;
        result.FISMAScore = fismaResult.ComplianceScore;
        if (!fismaResult.IsCompliant)
        {
          result.Violations.AddRange(fismaResult.Violations);
          result.OverallCompliant = false;
        }

        // WCAG 2.1 AA Accessibility Validation
        var wcagResult = await ValidateWCAGComplianceAsync(component, operation);
        result.WCAGCompliant = wcagResult.IsCompliant;
        result.WCAGScore = wcagResult.ComplianceScore;
        if (!wcagResult.IsCompliant)
        {
          result.Violations.AddRange(wcagResult.Violations);
          result.OverallCompliant = false;
        }

        // Washington State Multi-County Compliance
        var countyResult = await ValidateCountyComplianceAsync(component, operation);
        result.CountyCompliant = countyResult.IsCompliant;
        result.CountyScore = countyResult.ComplianceScore;
        if (!countyResult.IsCompliant)
        {
          result.Violations.AddRange(countyResult.Violations);
          result.OverallCompliant = false;
        }

        // AI-agent compliance evidence
        var agentResult = await ValidateAIAgentComplianceAsync(component, operation);
        result.AIAgentCompliant = agentResult.IsCompliant;
        result.AIAgentScore = agentResult.ComplianceScore;
        if (!agentResult.IsCompliant)
        {
          result.Violations.AddRange(agentResult.Violations);
          result.OverallCompliant = false;
        }

        // Calculate overall compliance score
        result.OverallScore = CalculateOverallComplianceScore(result);

        // Update compliance metrics
        UpdateComplianceMetrics(result);

        // Audit compliance check (use scoped service)
        using (var scope = _scopeFactory.CreateScope())
        {
          var auditLogger = scope.ServiceProvider.GetRequiredService<IAuditLogger>();
          await auditLogger.LogAsync("COMPLIANCE_VALIDATION",
              JsonSerializer.Serialize(new
              {
                  component,
                  operation,
                  overallCompliant = result.OverallCompliant,
                  overallScore = result.OverallScore,
                  fismaScore = result.FISMAScore,
                  wcagScore = result.WCAGScore,
                  countyScore = result.CountyScore,
                  aiAgentScore = result.AIAgentScore,
                  violationCount = result.Violations.Count,
                  governmentClassification = "COMPLIANCE_AUDIT"
              }), result.OverallCompliant);
        }

        if (result.OverallCompliant)
        {
          _logger.LogInformation("✅ TIER 3 Compliance validation PASSED: {Component}.{Operation} - Score: {Score:F2}%",
              component, operation, result.OverallScore * 100);
        }
        else
        {
          _logger.LogWarning("⚠️ TIER 3 Compliance validation FAILED: {Component}.{Operation} - Score: {Score:F2}%, Violations: {ViolationCount}",
              component, operation, result.OverallScore * 100, result.Violations.Count);

          // Queue violations for remediation
          foreach (var violation in result.Violations)
          {
            _violationQueue.Enqueue(violation);
          }
        }

        return result;
      }
      catch (Exception ex)
      {
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        _logger.LogError(ex, "🚨 TIER 3 Compliance validation failed for {Component}.{Operation}", component, operation);

        // Audit error (use scoped service)
        using (var scope = _scopeFactory.CreateScope())
        {
          var auditLogger = scope.ServiceProvider.GetRequiredService<IAuditLogger>();
          await auditLogger.LogErrorAsync("COMPLIANCE_VALIDATION_ERROR", ex);
        }

        result.OverallCompliant = false;
        result.OverallScore = 0.0;
        result.Violations.Add(new ComplianceViolation
        {
          Type = "SYSTEM_ERROR",
          Component = component,
          Operation = operation,
          Severity = ViolationSeverity.Critical,
          Description = $"Compliance validation system error: {ex.Message}",
          Recommendation = "Review compliance service configuration and retry validation"
        });

        return result;
      }
    }

    /// <summary>
    /// 🔒 FISMA Security Compliance Validation
    /// Federal Information Security Management Act compliance for government systems
    /// </summary>
    private async Task<DetailedComplianceResult> ValidateFISMAComplianceAsync(string component, string operation)
    {
      var result = new DetailedComplianceResult
      {
        IsCompliant = true,
        ComplianceScore = 1.0,
        Violations = new List<ComplianceViolation>()
      };

      try
      {
        // Access Control (AC) Family
        await ValidateAccessControlCompliance(component, operation, result);

        // Audit and Accountability (AU) Family
        await ValidateAuditAccountabilityCompliance(component, operation, result);

        // Configuration Management (CM) Family
        await ValidateConfigurationManagementCompliance(component, operation, result);

        // Identification and Authentication (IA) Family
        await ValidateIdentificationAuthenticationCompliance(component, operation, result);

        // System and Communications Protection (SC) Family
        await ValidateSystemCommunicationsProtectionCompliance(component, operation, result);

        var totalControls = _fismaControls.Count;
        if (totalControls == 0)
        {
          MarkEvidenceUnavailable(
            result,
            component,
            operation,
            "FISMA_EVIDENCE_UNAVAILABLE",
            "No governed FISMA control evidence is loaded.");
          return result;
        }

        // Calculate FISMA compliance score
        var compliantControls = _fismaControls.Values.Count(c => c.IsCompliant);
        result.ComplianceScore = totalControls > 0 ? (double)compliantControls / totalControls : 1.0;
        result.IsCompliant = result.ComplianceScore >= 0.95; // 95% compliance threshold

        return result;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "FISMA compliance validation failed");
        result.IsCompliant = false;
        result.ComplianceScore = 0.0;
        return result;
      }
    }

    /// <summary>
    /// ♿ WCAG 2.1 AA Accessibility Compliance Validation
    /// Web Content Accessibility Guidelines for government digital services
    /// </summary>
    private async Task<DetailedComplianceResult> ValidateWCAGComplianceAsync(string component, string operation)
    {
      var result = new DetailedComplianceResult
      {
        IsCompliant = true,
        ComplianceScore = 1.0,
        Violations = new List<ComplianceViolation>()
      };

      try
      {
        // Principle 1: Perceivable
        await ValidatePerceivableCompliance(component, operation, result);

        // Principle 2: Operable
        await ValidateOperableCompliance(component, operation, result);

        // Principle 3: Understandable
        await ValidateUnderstandableCompliance(component, operation, result);

        // Principle 4: Robust
        await ValidateRobustCompliance(component, operation, result);

        var totalCriteria = _wcagCompliance.Count;
        if (totalCriteria == 0)
        {
          MarkEvidenceUnavailable(
            result,
            component,
            operation,
            "WCAG_EVIDENCE_UNAVAILABLE",
            "No governed WCAG accessibility evidence is loaded.");
          return result;
        }

        // Calculate WCAG compliance score
        var compliantCriteria = _wcagCompliance.Values.Count(c => c.IsCompliant);
        result.ComplianceScore = totalCriteria > 0 ? (double)compliantCriteria / totalCriteria : 1.0;
        result.IsCompliant = result.ComplianceScore >= 1.0; // 100% compliance required for AA level

        return result;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "WCAG compliance validation failed");
        result.IsCompliant = false;
        result.ComplianceScore = 0.0;
        return result;
      }
    }

    /// <summary>
    /// 🏛️ Washington State Multi-County Compliance Validation
    /// State-specific compliance requirements for county government systems
    /// </summary>
    private async Task<DetailedComplianceResult> ValidateCountyComplianceAsync(string component, string operation)
    {
      var result = new DetailedComplianceResult
      {
        IsCompliant = true,
        ComplianceScore = 1.0,
        Violations = new List<ComplianceViolation>()
      };

      try
      {
        if (_countyCompliance.IsEmpty)
        {
          MarkEvidenceUnavailable(
            result,
            component,
            operation,
            "COUNTY_EVIDENCE_UNAVAILABLE",
            "No county accreditation or compliance evidence is loaded.");
          return result;
        }

        foreach (var county in _washingtonStateCounties)
        {
          var countyKey = $"{county}_{component}";

          // Data sovereignty validation
          await ValidateDataSovereigntyCompliance(county, component, operation, result);

          // Public records compliance (RCW 42.56)
          await ValidatePublicRecordsCompliance(county, component, operation, result);

          // Open government compliance (RCW 42.30)
          await ValidateOpenGovernmentCompliance(county, component, operation, result);

          // County-specific regulations
          await ValidateCountySpecificCompliance(county, component, operation, result);
        }

        // Calculate county compliance score
        var totalCounties = _washingtonStateCounties.Count;
        var compliantCounties = _countyCompliance.Values.Count(c => c.IsCompliant);
        result.ComplianceScore = totalCounties > 0 ? (double)compliantCounties / totalCounties : 1.0;
        result.IsCompliant = result.ComplianceScore >= 0.98; // 98% compliance threshold for multi-county

        return result;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "County compliance validation failed");
        result.IsCompliant = false;
        result.ComplianceScore = 0.0;
        return result;
      }
    }

    /// <summary>
    /// AI-agent compliance validation from governed audit evidence.
    /// </summary>
    private async Task<DetailedComplianceResult> ValidateAIAgentComplianceAsync(string component, string operation)
    {
      var result = new DetailedComplianceResult
      {
        IsCompliant = true,
        ComplianceScore = 1.0,
        Violations = new List<ComplianceViolation>()
      };

      try
      {
        // AI Ethics and Transparency
        await ValidateAIEthicsCompliance(component, operation, result);

        // AI Decision Auditing
        await ValidateAIDecisionAuditingCompliance(component, operation, result);

        // AI Data Privacy
        await ValidateAIDataPrivacyCompliance(component, operation, result);

        // AI Performance and Bias Monitoring
        await ValidateAIPerformanceBiasCompliance(component, operation, result);

        var totalAgentChecks = _agentCompliance.Count;
        if (totalAgentChecks == 0)
        {
          MarkEvidenceUnavailable(
            result,
            component,
            operation,
            "AI_AGENT_EVIDENCE_UNAVAILABLE",
            "No governed AI-agent compliance audit evidence is loaded.");
          return result;
        }

        // Calculate AI agent compliance score
        var compliantAgentChecks = _agentCompliance.Values.Count(c => c.IsCompliant);
        result.ComplianceScore = totalAgentChecks > 0 ? (double)compliantAgentChecks / totalAgentChecks : 1.0;
        result.IsCompliant = result.ComplianceScore >= 0.99; // 99% compliance threshold for AI agents

        return result;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "AI Agent compliance validation failed");
        result.IsCompliant = false;
        result.ComplianceScore = 0.0;
        return result;
      }
    }

    private static void MarkEvidenceUnavailable(
      DetailedComplianceResult result,
      string component,
      string operation,
      string type,
      string description)
    {
      result.IsCompliant = false;
      result.ComplianceScore = 0.0;
      result.Violations.Add(new ComplianceViolation
      {
        Type = type,
        Component = component,
        Operation = operation,
        Severity = ViolationSeverity.Critical,
        Description = description,
        Recommendation = "Load governed compliance evidence before reporting this lane as compliant."
      });
    }

    // Additional compliance validation methods are intentionally fail-closed until
    // governed evidence sources are wired into the service.

    /// <summary>
    /// 📊 Calculate Overall Compliance Score
    /// </summary>
  private double CalculateOverallComplianceScore(GovernmentComplianceResult result)
    {
      var scores = new[] { result.FISMAScore, result.WCAGScore, result.CountyScore, result.AIAgentScore };
      var validScores = scores.Where(s => s.HasValue && s.Value >= 0).Select(s => s!.Value);
      return validScores.Any() ? validScores.Average() : 0.0;
    }

    /// <summary>
    /// 📈 Update Compliance Metrics
    /// </summary>
  private void UpdateComplianceMetrics(GovernmentComplianceResult result)
    {
      _complianceMetrics.AddOrUpdate("total_validations", 1, (k, v) => v + 1);

      if (result.OverallCompliant)
        _complianceMetrics.AddOrUpdate("compliant_validations", 1, (k, v) => v + 1);
      else
        _complianceMetrics.AddOrUpdate("non_compliant_validations", 1, (k, v) => v + 1);

      _complianceMetrics.AddOrUpdate("total_violations", result.Violations.Count, (k, v) => v + result.Violations.Count);
    }

    /// <summary>
    /// 🔄 Continuous Compliance Monitoring
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
      try
      {
        while (!stoppingToken.IsCancellationRequested)
        {
          try
          {
            await PerformComplianceAssessment();
            await ProcessViolationQueue();
            await GenerateComplianceReport();

            // Wait for next monitoring cycle (cancellable)
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
          }
          catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
          {
            // Cancellation requested - exit loop gracefully
            _logger.LogInformation("GovernmentComplianceService cancellation requested, stopping gracefully.");
            break;
          }
          catch (Exception ex)
          {
            // Recoverable error - log and back off, but respect cancellation
            _logger.LogError(ex, "Compliance monitoring cycle failed (recoverable)");

            if (stoppingToken.IsCancellationRequested)
            {
              _logger.LogInformation("Stopping token signaled after error; exiting compliance loop.");
              break;
            }

            try
            {
              await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
              // Cancellation during backoff - exit gracefully
              break;
            }
          }
        }
      }
      catch (OperationCanceledException)
      {
        _logger.LogInformation("GovernmentComplianceService ExecuteAsync cancelled.");
      }
    }

    /// <summary>
    /// 🎯 TIER 3 Compliance Monitoring Timer
    /// </summary>
    private async void MonitorCompliance(object? state)
    {
      if (!_complianceSemaphore.Wait(5000))
        return;

      try
      {
        using var activity = ActivitySource.StartActivity("TerraFusion.ComplianceMonitoring");

        // Monitor critical compliance components
        var criticalComponents = new[] { "Authentication", "Authorization", "DataAccess", "AuditLogging", "AIAgents" };

        foreach (var component in criticalComponents)
        {
          var result = await ValidateComplianceAsync(component, "MonitoringCheck");

          if (!result.OverallCompliant)
          {
            _logger.LogWarning("⚠️ Compliance monitoring detected issues in {Component}: {ViolationCount} violations",
                component, result.Violations.Count);
          }
        }

        _logger.LogDebug("✅ TIER 3 Compliance monitoring cycle completed");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Compliance monitoring failed");
      }
      finally
      {
        _complianceSemaphore.Release();
      }
    }

    // Initialize methods and helper classes would be implemented here...

    private void InitializeFISMAControls() { /* Implementation */ }
    private void InitializeWCAGCompliance() { /* Implementation */ }
    private void InitializeCountyCompliance() { /* Implementation */ }

    // Additional validation methods...
    private async Task ValidateAccessControlCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateAuditAccountabilityCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateConfigurationManagementCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateIdentificationAuthenticationCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateSystemCommunicationsProtectionCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }

    private async Task ValidatePerceivableCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateOperableCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateUnderstandableCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateRobustCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }

    private async Task ValidateDataSovereigntyCompliance(string county, string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidatePublicRecordsCompliance(string county, string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateOpenGovernmentCompliance(string county, string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    /// <summary>
    /// County-specific compliance validation must be backed by governed evidence.
    /// </summary>
    private async Task ValidateCountySpecificCompliance(string county, string component, string operation, DetailedComplianceResult result)
    {
        var countyKey = $"{county}_{component}_{operation}";
        if (!_countyCompliance.TryGetValue(countyKey, out var countyStatus))
        {
            result.IsCompliant = false;
            result.ComplianceScore = 0.0;
            result.Violations.Add(new ComplianceViolation
            {
                Type = "COUNTY_REQUIREMENT_EVIDENCE_UNAVAILABLE",
                Component = component,
                Operation = operation,
                Severity = ViolationSeverity.High,
                Description = $"No governed county compliance evidence is loaded for {county}.",
                Recommendation = "Load county accreditation evidence before reporting county compliance."
            });
        }
        else if (!countyStatus.IsCompliant)
        {
            result.IsCompliant = false;
            result.Violations.Add(new ComplianceViolation
            {
                Type = "COUNTY_REQUIREMENT_NON_COMPLIANT",
                Component = component,
                Operation = operation,
                Severity = ViolationSeverity.High,
                Description = $"{county} compliance evidence reports a non-compliant state.",
                Recommendation = "Review county compliance evidence and remediation requirements."
            });
        }

        await Task.CompletedTask;
    }

    private async Task ValidateAIEthicsCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateAIDecisionAuditingCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateAIDataPrivacyCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }
    private async Task ValidateAIPerformanceBiasCompliance(string component, string operation, DetailedComplianceResult result) { await Task.CompletedTask; }

    private async Task PerformComplianceAssessment() { await Task.CompletedTask; }
    private async Task ProcessViolationQueue() { await Task.CompletedTask; }
    private async Task GenerateComplianceReport() { await Task.CompletedTask; }

    public new void Dispose()
    {
      _complianceMonitorTimer?.Dispose();
      _complianceSemaphore?.Dispose();
      ActivitySource.Dispose();
    }
  }

  // Supporting data structures and interfaces...
  public interface IGovernmentComplianceService
  {
    Task<GovernmentComplianceResult> ValidateComplianceAsync(string component, string operation);
  }

  public class GovernmentComplianceResult
  {
    public string Component { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool OverallCompliant { get; set; }
    public double OverallScore { get; set; }

    public bool FISMACompliant { get; set; }
    public double? FISMAScore { get; set; }

    public bool WCAGCompliant { get; set; }
    public double? WCAGScore { get; set; }

    public bool CountyCompliant { get; set; }
    public double? CountyScore { get; set; }

    public bool AIAgentCompliant { get; set; }
    public double? AIAgentScore { get; set; }

    public List<ComplianceViolation> Violations { get; set; } = new();
  }

  public class DetailedComplianceResult
  {
    public bool IsCompliant { get; set; }
    public double ComplianceScore { get; set; }
    public List<ComplianceViolation> Violations { get; set; } = new();
  }

  public class ComplianceViolation
  {
    public string Type { get; set; } = string.Empty;
    public string Component { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
    public ViolationSeverity Severity { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
  }

  public enum ViolationSeverity
  {
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
  }

  public class ComplianceStatus
  {
    public bool IsCompliant { get; set; }
    public double Score { get; set; }
    public DateTime LastChecked { get; set; }
    public List<string> Issues { get; set; } = new();
  }

  public class SecurityControl
  {
    public string ControlId { get; set; } = string.Empty;
    public string Family { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsCompliant { get; set; }
    public DateTime LastAssessed { get; set; }
    public string Status { get; set; } = string.Empty;
  }

  public class AuditTrail
  {
    public string TrailId { get; set; } = string.Empty;
    public string Component { get; set; } = string.Empty;
    public DateTime Created { get; set; }
    public bool IsActive { get; set; }
    public string Configuration { get; set; } = string.Empty;
  }

  public class AccessibilityStatus
  {
    public string Criterion { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public bool IsCompliant { get; set; }
    public DateTime LastChecked { get; set; }
    public string Notes { get; set; } = string.Empty;
  }

  public class CountyComplianceStatus
  {
    public string County { get; set; } = string.Empty;
    public string Component { get; set; } = string.Empty;
    public bool IsCompliant { get; set; }
    public double ComplianceScore { get; set; }
    public DateTime LastValidated { get; set; }
    public List<string> Requirements { get; set; } = new();
  }

  public class AgentComplianceStatus
  {
    public string AgentId { get; set; } = string.Empty;
    public string AgentType { get; set; } = string.Empty;
    public bool IsCompliant { get; set; }
    public double EthicsScore { get; set; }
    public DateTime LastAudit { get; set; }
    public List<string> Capabilities { get; set; } = new();
  }
}
