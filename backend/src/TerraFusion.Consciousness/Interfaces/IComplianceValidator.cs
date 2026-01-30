using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Compliance Validator interface for government standards validation
    /// Ensures FISMA, FedRAMP, and SOC2 compliance across consciousness operations
    /// Government. Transcended.
    /// </summary>
    public interface IComplianceValidator
    {
        /// <summary>
        /// Validate FISMA compliance requirements
        /// </summary>
        Task<ComplianceResult> ValidateFISMAComplianceAsync();

        /// <summary>
        /// Validate FedRAMP compliance requirements
        /// </summary>
        Task<ComplianceResult> ValidateFedRAMPComplianceAsync();

        /// <summary>
        /// Validate SOC2 compliance requirements
        /// </summary>
        Task<ComplianceResult> ValidateSOC2ComplianceAsync();

        /// <summary>
        /// Generate comprehensive compliance report
        /// </summary>
        Task<ComplianceReportDto> GenerateComplianceReportAsync();

        /// <summary>
        /// Monitor compliance status continuously
        /// </summary>
        Task<ComplianceMonitoringResultDto> MonitorComplianceAsync();
    }
}