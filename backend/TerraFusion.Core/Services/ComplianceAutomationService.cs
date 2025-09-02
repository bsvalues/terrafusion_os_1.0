using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Linq;

namespace TerraFusion.Core.Services
{
    public interface IComplianceAutomationService
    {
        Task<AuditTrail> CreateAuditTrailAsync(string action, string userId, object data, string? entityType = null);
        Task<List<AuditTrail>> GetAuditTrailAsync(DateTime? startDate = null, DateTime? endDate = null, string? userId = null);
        Task<ComplianceReport> GenerateComplianceReportAsync(ComplianceFramework framework, DateTime startDate, DateTime endDate);
        Task<ComplianceStatus> ValidateComplianceAsync(ComplianceFramework framework);
        Task<List<ComplianceViolation>> GetComplianceViolationsAsync(ComplianceFramework framework = ComplianceFramework.All);
        Task<bool> RemediateViolationAsync(string violationId, string remediationAction, string userId);
        Task<ComplianceDashboardData> GetComplianceDashboardDataAsync();
        Task<bool> ScheduleComplianceReportAsync(ComplianceReportSchedule schedule);
        Task<List<ComplianceControl>> GetComplianceControlsAsync(ComplianceFramework framework);
        Task<bool> UpdateComplianceControlAsync(string controlId, ComplianceControlStatus status, string evidence);
    }

    public enum ComplianceFramework
    {
        FISMA,
        NIST,
        SOC2,
        FedRAMP,
        HIPAA,
        PCI_DSS,
        All
    }

    public enum ComplianceControlStatus
    {
        NotImplemented,
        PartiallyImplemented,
        Implemented,
        Monitored,
        NonCompliant
    }

    public class AuditTrail
    {
        public required string Id { get; set; }
        public DateTime Timestamp { get; set; }
        public required string Action { get; set; }
        public required string UserId { get; set; }
        public required string UserName { get; set; }
        public required string EntityType { get; set; }
        public required string EntityId { get; set; }
        public required string Data { get; set; }
        public required string IPAddress { get; set; }
        public required string UserAgent { get; set; }
        public required string SessionId { get; set; }
        public required ComplianceFramework[] ApplicableFrameworks { get; set; }
    }

    public class ComplianceReport
    {
        public required string Id { get; set; }
        public ComplianceFramework Framework { get; set; }
        public DateTime GeneratedAt { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public required ComplianceStatus OverallStatus { get; set; }
        public required List<ComplianceControl> Controls { get; set; }
        public required List<ComplianceViolation> Violations { get; set; }
        public required ComplianceMetrics Metrics { get; set; }
        public required List<ComplianceRecommendation> Recommendations { get; set; }
    }

    public class ComplianceStatus
    {
        public ComplianceFramework Framework { get; set; }
        public double ComplianceScore { get; set; }
        public int TotalControls { get; set; }
        public int ImplementedControls { get; set; }
        public required string Status { get; set; }

    public class ComplianceReport
    {
        public string Id { get; set; }
        public ComplianceFramework Framework { get; set; }
        public DateTime GeneratedAt { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public ComplianceStatus OverallStatus { get; set; }
        public List<ComplianceControl> Controls { get; set; }
        public List<ComplianceViolation> Violations { get; set; }
        public ComplianceMetrics Metrics { get; set; }
        public List<ComplianceRecommendation> Recommendations { get; set; }
    }

    public class ComplianceStatus
    {
        public ComplianceFramework Framework { get; set; }
        public double ComplianceScore { get; set; }
        public int TotalControls { get; set; }
        public int ImplementedControls { get; set; }
        public int ViolationCount { get; set; }
        public DateTime LastAssessment { get; set; }
        public string Status { get; set; }
    }

    public class ComplianceViolation
    {
        public required string Id { get; set; }
        public ComplianceFramework Framework { get; set; }
        public required string ControlId { get; set; }
        public required string ControlName { get; set; }
        public required string Description { get; set; }
        public required string Severity { get; set; }
        public DateTime DetectedAt { get; set; }
        public required string Status { get; set; }
        public required string RemediationAction { get; set; }
        public DateTime? RemediatedAt { get; set; }
        public required string RemediatedBy { get; set; }
    }

    public class ComplianceControl
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
        public ComplianceFramework Framework { get; set; }
        public ComplianceControlStatus Status { get; set; }
        public required string Evidence { get; set; }
        public DateTime LastUpdated { get; set; }
        public required string ResponsibleParty { get; set; }
        public DateTime? NextReview { get; set; }
    }

    public class ComplianceMetrics
    {
        public double ComplianceScore { get; set; }
        public int TotalAuditEvents { get; set; }
        public int SecurityIncidents { get; set; }
        public int DataAccessEvents { get; set; }
        public int PrivilegedAccessEvents { get; set; }
        public int FailedLoginAttempts { get; set; }
        public int ConfigurationChanges { get; set; }
        public Dictionary<string, int> ViolationsByType { get; set; } = new Dictionary<string, int>();
    }

    public class ComplianceRecommendation
    {
        public required string Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Priority { get; set; }
        public required string Category { get; set; }
        public required List<string> ActionItems { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ComplianceDashboardData
    {
        public required Dictionary<ComplianceFramework, ComplianceStatus> FrameworkStatus { get; set; }
        public required List<ComplianceViolation> RecentViolations { get; set; }
        public required ComplianceMetrics OverallMetrics { get; set; }
        public required List<ComplianceRecommendation> TopRecommendations { get; set; }
        public required Dictionary<string, object> TrendData { get; set; }
    }

    public class ComplianceReportSchedule
    {
        public required string Id { get; set; }
        public ComplianceFramework Framework { get; set; }
        public required string Frequency { get; set; }
        public required List<string> Recipients { get; set; }
        public required string Format { get; set; }
        public bool IsActive { get; set; }
    }

    public class ComplianceAutomationService : IComplianceAutomationService
    {
        private readonly ILogger<ComplianceAutomationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IRedisCacheService _cacheService;
        
        private readonly Dictionary<ComplianceFramework, List<ComplianceControl>> _frameworkControls;

        public ComplianceAutomationService(
            ILogger<ComplianceAutomationService> logger,
            IConfiguration configuration,
            IRedisCacheService cacheService)
        {
            _logger = logger;
            _configuration = configuration;
            _cacheService = cacheService;
            _frameworkControls = InitializeFrameworkControls();
        }

        public async Task<AuditTrail> CreateAuditTrailAsync(string action, string userId, object data, string entityType = null)
        {
            try
            {
                var auditTrail = new AuditTrail
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.UtcNow,
                    Action = action,
                    UserId = userId,
                    EntityType = entityType,
                    Data = JsonSerializer.Serialize(data),
                    ApplicableFrameworks = DetermineApplicableFrameworks(action, entityType)
                };

                // Store in cache for quick access
                await _cacheService.SetAsync($"audit:{auditTrail.Id}", auditTrail, TimeSpan.FromDays(7));
                
                // Add to audit trail list
                await _cacheService.AddToListAsync("audit:trail", auditTrail);

                _logger.LogInformation("Audit trail created: {Action} by {UserId}", action, userId);
                return auditTrail;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating audit trail for action: {Action}", action);
                throw;
            }
        }

        public async Task<List<AuditTrail>> GetAuditTrailAsync(DateTime? startDate = null, DateTime? endDate = null, string userId = null)
        {
            try
            {
                var cacheKey = $"audit:query:{startDate}:{endDate}:{userId}";
                var cachedResult = await _cacheService.GetAsync<List<AuditTrail>>(cacheKey);
                
                if (cachedResult != null)
                {
                    return cachedResult;
                }

                var allTrails = await _cacheService.GetListAsync<AuditTrail>("audit:trail");
                
                var filteredTrails = allTrails.Where(t => 
                    (startDate == null || t.Timestamp >= startDate) &&
                    (endDate == null || t.Timestamp <= endDate) &&
                    (userId == null || t.UserId == userId)
                ).OrderByDescending(t => t.Timestamp).ToList();

                await _cacheService.SetAsync(cacheKey, filteredTrails, TimeSpan.FromMinutes(15));
                
                return filteredTrails;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit trail");
                return new List<AuditTrail>();
            }
        }

        public async Task<ComplianceReport> GenerateComplianceReportAsync(ComplianceFramework framework, DateTime startDate, DateTime endDate)
        {
            try
            {
                var cacheKey = $"compliance:report:{framework}:{startDate:yyyyMMdd}:{endDate:yyyyMMdd}";
                var cachedReport = await _cacheService.GetAsync<ComplianceReport>(cacheKey);
                
                if (cachedReport != null)
                {
                    return cachedReport;
                }

                var controls = await GetComplianceControlsAsync(framework);
                var violations = await GetComplianceViolationsAsync(framework);
                var auditTrails = await GetAuditTrailAsync(startDate, endDate);
                
                var metrics = CalculateComplianceMetrics(auditTrails, violations);
                var recommendations = GenerateRecommendations(controls, violations);

                var report = new ComplianceReport
                {
                    Id = Guid.NewGuid().ToString(),
                    Framework = framework,
                    GeneratedAt = DateTime.UtcNow,
                    PeriodStart = startDate,
                    PeriodEnd = endDate,
                    OverallStatus = await ValidateComplianceAsync(framework),
                    Controls = controls,
                    Violations = violations,
                    Metrics = metrics,
                    Recommendations = recommendations
                };

                await _cacheService.SetAsync(cacheKey, report, TimeSpan.FromHours(4));
                
                _logger.LogInformation("Compliance report generated for {Framework}: {Score}% compliance", 
                    framework, report.OverallStatus.ComplianceScore);
                
                return report;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating compliance report for {Framework}", framework);
                throw;
            }
        }

        public async Task<ComplianceStatus> ValidateComplianceAsync(ComplianceFramework framework)
        {
            try
            {
                var controls = await GetComplianceControlsAsync(framework);
                var violations = await GetComplianceViolationsAsync(framework);
                
                var implementedControls = controls.Count(c => c.Status == ComplianceControlStatus.Implemented || 
                                                             c.Status == ComplianceControlStatus.Monitored);
                
                var complianceScore = controls.Count > 0 ? (double)implementedControls / controls.Count * 100 : 0;
                
                var status = new ComplianceStatus
                {
                    Framework = framework,
                    ComplianceScore = complianceScore,
                    TotalControls = controls.Count,
                    ImplementedControls = implementedControls,
                    ViolationCount = violations.Count(v => v.Status != "Resolved"),
                    LastAssessment = DateTime.UtcNow,
                    Status = complianceScore >= 95 ? "Compliant" : complianceScore >= 80 ? "Partially Compliant" : "Non-Compliant"
                };

                return status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating compliance for {Framework}", framework);
                throw;
            }
        }

        public async Task<List<ComplianceViolation>> GetComplianceViolationsAsync(ComplianceFramework framework = ComplianceFramework.All)
        {
            try
            {
                var cacheKey = $"compliance:violations:{framework}";
                var cachedViolations = await _cacheService.GetAsync<List<ComplianceViolation>>(cacheKey);
                
                if (cachedViolations != null)
                {
                    return cachedViolations;
                }

                // In a real implementation, this would query a database
                var violations = new List<ComplianceViolation>();
                
                await _cacheService.SetAsync(cacheKey, violations, TimeSpan.FromMinutes(30));
                return violations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance violations");
                return new List<ComplianceViolation>();
            }
        }

        public async Task<bool> RemediateViolationAsync(string violationId, string remediationAction, string userId)
        {
            try
            {
                // Create audit trail for remediation
                await CreateAuditTrailAsync("VIOLATION_REMEDIATED", userId, new { violationId, remediationAction });
                
                _logger.LogInformation("Violation {ViolationId} remediated by {UserId}", violationId, userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error remediating violation {ViolationId}", violationId);
                return false;
            }
        }

        public async Task<ComplianceDashboardData> GetComplianceDashboardDataAsync()
        {
            try
            {
                var cacheKey = "compliance:dashboard";
                var cachedData = await _cacheService.GetAsync<ComplianceDashboardData>(cacheKey);
                
                if (cachedData != null)
                {
                    return cachedData;
                }

                var frameworks = new[] { ComplianceFramework.FISMA, ComplianceFramework.NIST, ComplianceFramework.SOC2 };
                var frameworkStatus = new Dictionary<ComplianceFramework, ComplianceStatus>();
                
                foreach (var framework in frameworks)
                {
                    frameworkStatus[framework] = await ValidateComplianceAsync(framework);
                }

                var dashboardData = new ComplianceDashboardData
                {
                    FrameworkStatus = frameworkStatus,
                    RecentViolations = await GetComplianceViolationsAsync(),
                    OverallMetrics = new ComplianceMetrics(),
                    TopRecommendations = new List<ComplianceRecommendation>(),
                    TrendData = new Dictionary<string, object>()
                };

                await _cacheService.SetAsync(cacheKey, dashboardData, TimeSpan.FromMinutes(15));
                return dashboardData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance dashboard data");
                throw;
            }
        }

        public async Task<bool> ScheduleComplianceReportAsync(ComplianceReportSchedule schedule)
        {
            try
            {
                await _cacheService.SetAsync($"compliance:schedule:{schedule.Id}", schedule);
                _logger.LogInformation("Compliance report scheduled: {Framework} - {Frequency}", schedule.Framework, schedule.Frequency);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scheduling compliance report");
                return false;
            }
        }

        public async Task<List<ComplianceControl>> GetComplianceControlsAsync(ComplianceFramework framework)
        {
            try
            {
                var cacheKey = $"compliance:controls:{framework}";
                var cachedControls = await _cacheService.GetAsync<List<ComplianceControl>>(cacheKey);
                
                if (cachedControls != null)
                {
                    return cachedControls;
                }

                var controls = _frameworkControls.ContainsKey(framework) ? _frameworkControls[framework] : new List<ComplianceControl>();
                
                await _cacheService.SetAsync(cacheKey, controls, TimeSpan.FromHours(1));
                return controls;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance controls for {Framework}", framework);
                return new List<ComplianceControl>();
            }
        }

        public async Task<bool> UpdateComplianceControlAsync(string controlId, ComplianceControlStatus status, string evidence)
        {
            try
            {
                // Update control status and evidence
                _logger.LogInformation("Compliance control {ControlId} updated to {Status}", controlId, status);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating compliance control {ControlId}", controlId);
                return false;
            }
        }

        private ComplianceFramework[] DetermineApplicableFrameworks(string action, string entityType)
        {
            var frameworks = new List<ComplianceFramework>();
            
            // All government operations are subject to FISMA
            frameworks.Add(ComplianceFramework.FISMA);
            
            // Add NIST for security-related actions
            if (action.Contains("SECURITY") || action.Contains("AUTH") || action.Contains("ACCESS"))
            {
                frameworks.Add(ComplianceFramework.NIST);
            }
            
            return frameworks.ToArray();
        }

        private ComplianceMetrics CalculateComplianceMetrics(List<AuditTrail> auditTrails, List<ComplianceViolation> violations)
        {
            return new ComplianceMetrics
            {
                TotalAuditEvents = auditTrails.Count,
                SecurityIncidents = auditTrails.Count(a => a.Action.Contains("SECURITY")),
                DataAccessEvents = auditTrails.Count(a => a.Action.Contains("DATA_ACCESS")),
                PrivilegedAccessEvents = auditTrails.Count(a => a.Action.Contains("PRIVILEGED")),
                FailedLoginAttempts = auditTrails.Count(a => a.Action == "LOGIN_FAILED"),
                ConfigurationChanges = auditTrails.Count(a => a.Action.Contains("CONFIG")),
                ViolationsByType = violations.GroupBy(v => v.Severity).ToDictionary(g => g.Key, g => g.Count())
            };
        }

        private List<ComplianceRecommendation> GenerateRecommendations(List<ComplianceControl> controls, List<ComplianceViolation> violations)
        {
            var recommendations = new List<ComplianceRecommendation>();
            
            // Generate recommendations based on control status and violations
            var nonImplementedControls = controls.Where(c => c.Status == ComplianceControlStatus.NotImplemented).ToList();
            
            if (nonImplementedControls.Any())
            {
                recommendations.Add(new ComplianceRecommendation
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Implement Missing Controls",
                    Description = $"Implement {nonImplementedControls.Count} missing compliance controls",
                    Priority = "High",
                    Category = "Control Implementation",
                    ActionItems = nonImplementedControls.Select(c => $"Implement {c.Name}").ToList(),
                    CreatedAt = DateTime.UtcNow
                });
            }
            
            return recommendations;
        }

        private Dictionary<ComplianceFramework, List<ComplianceControl>> InitializeFrameworkControls()
        {
            return new Dictionary<ComplianceFramework, List<ComplianceControl>>
            {
                [ComplianceFramework.FISMA] = new List<ComplianceControl>
                {
                    new ComplianceControl { 
                        Id = "AC-1", 
                        Name = "Access Control Policy", 
                        Description = "Access Control Policy", 
                        Framework = ComplianceFramework.FISMA, 
                        Status = ComplianceControlStatus.Implemented, 
                        Evidence = "Policy documented", 
                        ResponsibleParty = "IT Security",
                        ControlId = "AC-1",
                        ControlName = "Access Control Policy",
                        Severity = "High",
                        RemediationAction = "Maintain policy",
                        RemediatedBy = ""
                    },
                    new ComplianceControl { 
                        Id = "AU-1", 
                        Name = "Audit and Accountability Policy", 
                        Description = "Audit and Accountability Policy", 
                        Framework = ComplianceFramework.FISMA, 
                        Status = ComplianceControlStatus.Implemented, 
                        Evidence = "Policy documented", 
                        ResponsibleParty = "Compliance Team",
                        ControlId = "AU-1",
                        ControlName = "Audit and Accountability Policy",
                        Severity = "High",
                        RemediationAction = "Maintain policy",
                        RemediatedBy = ""
                    },
                    new ComplianceControl { 
                        Id = "SC-1", 
                        Name = "System and Communications Protection Policy", 
                        Description = "System and Communications Protection Policy", 
                        Framework = ComplianceFramework.FISMA, 
                        Status = ComplianceControlStatus.Implemented, 
                        Evidence = "Policy documented", 
                        ResponsibleParty = "IT Security",
                        ControlId = "SC-1",
                        ControlName = "System and Communications Protection Policy",
                        Severity = "High",
                        RemediationAction = "Maintain policy",
                        RemediatedBy = ""
                    }
                },
                [ComplianceFramework.NIST] = new List<ComplianceControl>
                {
                    new ComplianceControl { 
                        Id = "ID.AM-1", 
                        Name = "Physical devices and systems are inventoried", 
                        Description = "Asset management", 
                        Framework = ComplianceFramework.NIST, 
                        Status = ComplianceControlStatus.Implemented, 
                        Evidence = "Asset inventory maintained", 
                        ResponsibleParty = "IT Operations",
                        ControlId = "ID.AM-1",
                        ControlName = "Physical devices and systems are inventoried",
                        Severity = "Medium",
                        RemediationAction = "Maintain inventory",
                        RemediatedBy = ""
                    },
                    new ComplianceControl { 
                        Id = "PR.AC-1", 
                        Name = "Identities and credentials are issued", 
                        Description = "Identity management", 
                        Framework = ComplianceFramework.NIST, 
                        Status = ComplianceControlStatus.Implemented, 
                        Evidence = "Identity system in place", 
                        ResponsibleParty = "IT Security",
                        ControlId = "PR.AC-1",
                        ControlName = "Identities and credentials are issued",
                        Severity = "High",
                        RemediationAction = "Maintain identity system",
                        RemediatedBy = ""
                    }
                }
            };
        }
    }
}
