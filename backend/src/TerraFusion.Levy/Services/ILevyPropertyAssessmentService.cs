using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Levy.Services
{
    /// <summary>
    /// Port of BCBSLevy Flask <c>routes_property_assessment.py</c> API surface.
    /// Provides property-assessment validation, valuation, compliance, and workflow
    /// operations scoped to TerraLevy (distinct from the top-level
    /// <c>PropertyAssessmentController</c> which is the CAMA assessment record).
    ///
    /// Source of truth (reference, to be retired in Phase 6):
    /// <c>packages/terra-levy/backend/routes_property_assessment.py</c>
    ///   POST /api/validate-property   → <see cref="ValidatePropertyAsync"/>
    ///   POST /api/calculate-value     → <see cref="CalculateValueAsync"/>
    ///   POST /api/verify-compliance   → <see cref="VerifyComplianceAsync"/>
    ///   POST /api/execute-workflow    → <see cref="ExecuteWorkflowAsync"/>
    /// </summary>
    public interface ILevyPropertyAssessmentService
    {
        Task<PropertyValidationResult> ValidatePropertyAsync(
            PropertyValidationRequest request,
            CancellationToken cancellationToken = default);

        Task<PropertyValuationResult> CalculateValueAsync(
            PropertyValuationRequest request,
            CancellationToken cancellationToken = default);

        Task<ComplianceVerificationResult> VerifyComplianceAsync(
            ComplianceVerificationRequest request,
            CancellationToken cancellationToken = default);

        Task<WorkflowExecutionResult> ExecuteWorkflowAsync(
            WorkflowExecutionRequest request,
            CancellationToken cancellationToken = default);
    }

    // ──────────────── Validation ────────────────

    /// <summary>Free-form property payload validated by the data-validation agent.</summary>
    public class PropertyValidationRequest
    {
        public string? PropertyId { get; set; }
        public string? Address { get; set; }
        public decimal? AssessedValue { get; set; }
        public string? PropertyType { get; set; }
        public IDictionary<string, object?> AdditionalFields { get; set; } =
            new Dictionary<string, object?>();
    }

    public class PropertyValidationResult
    {
        public bool IsValid { get; set; }
        public IList<string> Errors { get; set; } = new List<string>();
        public IList<string> Warnings { get; set; } = new List<string>();
        /// <summary>0.0 to 1.0 confidence the record is complete and well-formed.</summary>
        public double QualityScore { get; set; }
        public string? Notes { get; set; }
    }

    // ──────────────── Valuation ────────────────

    public class PropertyValuationRequest
    {
        public string PropertyId { get; set; } = string.Empty;
        /// <summary>ISO-8601 date string; defaults to today when null.</summary>
        public string? ValuationDate { get; set; }
        /// <summary>
        /// Valuation method: <c>market_comparison</c> (default), <c>income</c>, or <c>cost</c>.
        /// </summary>
        public string Method { get; set; } = "market_comparison";
    }

    public class PropertyValuationResult
    {
        public string PropertyId { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string ValuationDate { get; set; } = string.Empty;
        public decimal EstimatedValue { get; set; }
        public double Confidence { get; set; }
        public IList<string> Assumptions { get; set; } = new List<string>();
    }

    // ──────────────── Compliance ────────────────

    public class ComplianceVerificationRequest
    {
        public string DistrictId { get; set; } = string.Empty;
        public int AssessmentYear { get; set; }
        /// <summary>
        /// Filter scope: <c>all</c> (default), <c>rcw_84_52</c>, <c>rcw_84_55</c>, <c>uniformity</c>, etc.
        /// </summary>
        public string ComplianceArea { get; set; } = "all";
    }

    public class ComplianceVerificationResult
    {
        public string DistrictId { get; set; } = string.Empty;
        public int AssessmentYear { get; set; }
        public string ComplianceArea { get; set; } = string.Empty;
        public bool Compliant { get; set; }
        public IList<ComplianceFinding> Findings { get; set; } = new List<ComplianceFinding>();
    }

    public class ComplianceFinding
    {
        public string Code { get; set; } = string.Empty;
        /// <summary><c>info</c>, <c>warning</c>, or <c>violation</c>.</summary>
        public string Severity { get; set; } = "info";
        public string Message { get; set; } = string.Empty;
        public string? Reference { get; set; }
    }

    // ──────────────── Workflow ────────────────

    public class WorkflowExecutionRequest
    {
        /// <summary>
        /// Workflow type: <c>reassessment</c>, <c>initial_assessment</c>, <c>appeal</c>,
        /// <c>exemption_review</c>, or any registered custom key.
        /// </summary>
        public string WorkflowType { get; set; } = string.Empty;
        public IList<string> Properties { get; set; } = new List<string>();
        public IDictionary<string, object?> Parameters { get; set; } =
            new Dictionary<string, object?>();
    }

    public class WorkflowExecutionResult
    {
        public string WorkflowType { get; set; } = string.Empty;
        public string Status { get; set; } = "queued";
        public int PropertiesProcessed { get; set; }
        public IList<WorkflowStepResult> Steps { get; set; } = new List<WorkflowStepResult>();
        public string? CorrelationId { get; set; }
    }

    public class WorkflowStepResult
    {
        public string PropertyId { get; set; } = string.Empty;
        public string Outcome { get; set; } = string.Empty;
        public string? Message { get; set; }
    }
}
