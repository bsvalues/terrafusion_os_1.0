using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.Levy.Services
{
    /// <summary>
    /// Native .NET port of the BCBSLevy property-assessment agent surface.
    ///
    /// The Flask source delegated to four AI "agents"
    /// (<c>data_validation_agent</c>, <c>valuation_agent</c>, <c>compliance_agent</c>,
    /// <c>workflow_agent</c>) via MCP. This port preserves the contract shape
    /// (request/response payloads) while replacing the MCP agent calls with
    /// deterministic, auditable .NET logic. Later phases may wire these back
    /// to the TerraFusion AI swarm behind the same interface.
    ///
    /// Follows the CostForge pattern: pure service, no HTTP concerns, DI-registered.
    /// </summary>
    public class LevyPropertyAssessmentService : ILevyPropertyAssessmentService
    {
        private readonly ILogger<LevyPropertyAssessmentService> _logger;

        public LevyPropertyAssessmentService(ILogger<LevyPropertyAssessmentService> logger)
        {
            _logger = logger;
        }

        public Task<PropertyValidationResult> ValidatePropertyAsync(
            PropertyValidationRequest request,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(request);

            var result = new PropertyValidationResult { IsValid = true, QualityScore = 1.0 };

            if (string.IsNullOrWhiteSpace(request.PropertyId))
            {
                result.Errors.Add("property_id is required");
                result.IsValid = false;
            }

            if (string.IsNullOrWhiteSpace(request.Address))
            {
                result.Warnings.Add("address is missing; parcel lookups may fail");
                result.QualityScore -= 0.25;
            }

            if (request.AssessedValue is null)
            {
                result.Warnings.Add("assessed_value is missing");
                result.QualityScore -= 0.25;
            }
            else if (request.AssessedValue < 0)
            {
                result.Errors.Add("assessed_value cannot be negative");
                result.IsValid = false;
            }

            if (string.IsNullOrWhiteSpace(request.PropertyType))
            {
                result.Warnings.Add("property_type is missing; classification will default");
                result.QualityScore -= 0.1;
            }

            if (result.QualityScore < 0)
            {
                result.QualityScore = 0;
            }

            result.Notes = result.IsValid
                ? "Record passes structural validation."
                : "Record has blocking validation errors.";

            _logger.LogInformation(
                "LevyPropertyAssessment.Validate property={PropertyId} valid={IsValid} score={Score}",
                request.PropertyId, result.IsValid, result.QualityScore);

            return Task.FromResult(result);
        }

        public Task<PropertyValuationResult> CalculateValueAsync(
            PropertyValuationRequest request,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (string.IsNullOrWhiteSpace(request.PropertyId))
            {
                throw new ArgumentException("PropertyId is required", nameof(request));
            }

            var valuationDate = string.IsNullOrWhiteSpace(request.ValuationDate)
                ? DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : request.ValuationDate;

            var method = string.IsNullOrWhiteSpace(request.Method)
                ? "market_comparison"
                : request.Method.Trim().ToLowerInvariant();

            var result = new PropertyValuationResult
            {
                PropertyId = request.PropertyId,
                Method = method,
                ValuationDate = valuationDate,
                EstimatedValue = 0m,
                Confidence = 0.0,
            };

            switch (method)
            {
                case "market_comparison":
                    result.Assumptions.Add("requires comparable sales within 12-month window (not yet fetched)");
                    break;
                case "income":
                    result.Assumptions.Add("requires rental/income data (not yet fetched)");
                    break;
                case "cost":
                    result.Assumptions.Add("requires CostForge cost basis (not yet fetched)");
                    break;
                default:
                    throw new ArgumentException(
                        $"Unsupported valuation method '{request.Method}'. " +
                        "Expected one of: market_comparison, income, cost.",
                        nameof(request));
            }

            // Deterministic compatibility value until the CostForge/market-comps pipeline is wired in
            // Phase 3.1 (schema reconciliation) and Phase 3.2 (Benton seed). Shape matches
            // the Flask contract so UI/clients can integrate now.
            result.Assumptions.Add("estimated_value remains 0 until comparable-sales and cost-basis inputs are wired; zero is returned for contract compatibility only");

            _logger.LogInformation(
                "LevyPropertyAssessment.CalculateValue property={PropertyId} method={Method} date={Date}",
                request.PropertyId, method, valuationDate);

            return Task.FromResult(result);
        }

        public Task<ComplianceVerificationResult> VerifyComplianceAsync(
            ComplianceVerificationRequest request,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (string.IsNullOrWhiteSpace(request.DistrictId))
            {
                throw new ArgumentException("DistrictId is required", nameof(request));
            }

            var year = request.AssessmentYear <= 0
                ? DateTime.UtcNow.Year
                : request.AssessmentYear;

            var area = string.IsNullOrWhiteSpace(request.ComplianceArea)
                ? "all"
                : request.ComplianceArea.Trim().ToLowerInvariant();

            var result = new ComplianceVerificationResult
            {
                DistrictId = request.DistrictId,
                AssessmentYear = year,
                ComplianceArea = area,
                Compliant = true,
            };

            // Structural checks that can run without the compliance-engine dependency.
            if (year < 1900 || year > DateTime.UtcNow.Year + 2)
            {
                result.Compliant = false;
                result.Findings.Add(new ComplianceFinding
                {
                    Code = "YEAR_OUT_OF_RANGE",
                    Severity = "violation",
                    Message = $"Assessment year {year} is outside the supported range.",
                });
            }

            // Compatibility informational finding — real RCW 84.52 / 84.55 checks land in
            // Phase 3 once LevyCalculationService is wired to district data.
            result.Findings.Add(new ComplianceFinding
            {
                Code = "INFO_DEEP_CHECKS_PENDING",
                Severity = "info",
                Message = "Statutory RCW 84.52/84.55 checks are not yet governed on this lane; district data wiring is still pending.",
                Reference = "RCW 84.52.043; RCW 84.55.010",
            });

            _logger.LogInformation(
                "LevyPropertyAssessment.VerifyCompliance district={DistrictId} year={Year} area={Area} compliant={Compliant}",
                request.DistrictId, year, area, result.Compliant);

            return Task.FromResult(result);
        }

        public Task<WorkflowExecutionResult> ExecuteWorkflowAsync(
            WorkflowExecutionRequest request,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (string.IsNullOrWhiteSpace(request.WorkflowType))
            {
                throw new ArgumentException("WorkflowType is required", nameof(request));
            }

            if (request.Properties is null || request.Properties.Count == 0)
            {
                throw new ArgumentException("Properties list is required", nameof(request));
            }

            var workflowType = request.WorkflowType.Trim().ToLowerInvariant();
            var supportedWorkflows = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "reassessment",
                "initial_assessment",
                "appeal",
                "exemption_review",
            };

            if (!supportedWorkflows.Contains(workflowType))
            {
                throw new ArgumentException(
                    $"Unsupported workflow_type '{request.WorkflowType}'. " +
                    $"Expected one of: {string.Join(", ", supportedWorkflows)}.",
                    nameof(request));
            }

            var correlationId = Guid.NewGuid().ToString("N");
            var result = new WorkflowExecutionResult
            {
                WorkflowType = workflowType,
                Status = "accepted",
                PropertiesProcessed = request.Properties.Count,
                CorrelationId = correlationId,
                Steps = request.Properties
                    .Select(pid => new WorkflowStepResult
                    {
                        PropertyId = pid,
                        Outcome = "queued",
                        Message = $"{workflowType} queued; will run when LevyWorkflowEngine lands in Phase 3.3.",
                    })
                    .ToList(),
            };

            _logger.LogInformation(
                "LevyPropertyAssessment.ExecuteWorkflow type={WorkflowType} count={Count} correlationId={CorrelationId}",
                workflowType, request.Properties.Count, correlationId);

            return Task.FromResult(result);
        }
    }
}
