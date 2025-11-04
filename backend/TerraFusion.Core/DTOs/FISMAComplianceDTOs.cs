using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    public class FISMAComplianceReport
    {
        public DateTime AssessmentDate { get; set; }
        public int TotalControls { get; set; }
        public int ImplementedControls { get; set; }
        public double CompliancePercentage { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<SecurityControl> MissingControls { get; set; } = new();
        public int HighPriorityGaps { get; set; }
        public int MediumPriorityGaps { get; set; }
        public int LowPriorityGaps { get; set; }
        public List<string> RecommendedActions { get; set; } = new();
        public DateTime NextAssessmentDate { get; set; }
        public string GovernmentReadiness => CompliancePercentage >= 95 ? "READY" : CompliancePercentage >= 90 ? "NEARLY_READY" : "NOT_READY";
    }

    public class SecurityControl
    {
        [Required]
        public string ControlId { get; set; } = string.Empty;
        
        [Required]
        public string Family { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public string Priority { get; set; } = string.Empty; // HIGH, MEDIUM, LOW
        
        [Required]
        public string ImplementationStatus { get; set; } = string.Empty; // IMPLEMENTED, NOT_IMPLEMENTED, PARTIALLY_IMPLEMENTED
        
        public DateTime? ImplementationDate { get; set; }
        
        public string ImplementationNotes { get; set; } = string.Empty;
        
        public List<string> TechnicalRequirements { get; set; } = new();
        
        public int EstimatedEffortHours { get; set; }
        
        public string ResponsibleTeam { get; set; } = string.Empty;
        
        public DateTime? TargetCompletionDate { get; set; }
    }


    public class ComplianceTrendPoint
    {
        public DateTime Date { get; set; }
        public double CompliancePercentage { get; set; }
    }

    /// <summary>
    /// FISMA-specific compliance metrics
    /// For comprehensive compliance metrics, use TerraFusion.Abstractions.DTOs.ComplianceMetrics
    /// </summary>
    public class FISMAComplianceMetrics
    {
        public double OverallCompliance { get; set; }
        public double AccessControlCompliance { get; set; }
        public double AuditAccountabilityCompliance { get; set; }
        public double SecurityAssessmentCompliance { get; set; }
        public double ConfigurationManagementCompliance { get; set; }
        public double ContingencyPlanningCompliance { get; set; }
        public double IdentificationAuthenticationCompliance { get; set; }
        public double IncidentResponseCompliance { get; set; }
        public double SystemCommunicationsCompliance { get; set; }
        public List<ComplianceTrendPoint> TrendData { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }

    public class ControlImplementationRequest
    {
        [Required]
        public string ControlId { get; set; } = string.Empty;
        
        public string ImplementationNotes { get; set; } = string.Empty;
        
        public List<string> TechnicalRequirements { get; set; } = new();
        
        public int EstimatedEffortHours { get; set; }
        
        public string ResponsibleTeam { get; set; } = string.Empty;
        
        public DateTime? TargetCompletionDate { get; set; }
    }

    public class ComplianceImprovementPlan
    {
        public string PlanId { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public double CurrentCompliance { get; set; }
        public double TargetCompliance { get; set; }
        public List<SecurityControl> PriorityControls { get; set; } = new();
        public List<ImplementationPhase> Phases { get; set; } = new();
        public int TotalEstimatedHours { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ImplementationPhase
    {
        public int PhaseNumber { get; set; }
        public string PhaseName { get; set; } = string.Empty;
        public List<string> ControlIds { get; set; } = new();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public double ExpectedComplianceGain { get; set; }
    }

    public class FISMAAssessmentResult
    {
        public string AssessmentId { get; set; } = string.Empty;
        public DateTime AssessmentDate { get; set; }
        public string AssessorName { get; set; } = string.Empty;
        public string AssessmentType { get; set; } = string.Empty; // SELF, INDEPENDENT, THIRD_PARTY
        public FISMAComplianceReport ComplianceReport { get; set; } = new();
        public List<SecurityFinding> Findings { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
        public string OverallRiskLevel { get; set; } = string.Empty;
        public bool ATORecommendation { get; set; }
    }

    public class SecurityFinding
    {
        public string FindingId { get; set; } = string.Empty;
        public string ControlId { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty; // CRITICAL, HIGH, MEDIUM, LOW
        public string Description { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
        public List<string> Recommendations { get; set; } = new();
        public DateTime IdentifiedDate { get; set; }
        public DateTime? TargetResolutionDate { get; set; }
        public string Status { get; set; } = string.Empty; // OPEN, IN_PROGRESS, RESOLVED, ACCEPTED_RISK
    }
}
