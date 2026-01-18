/*
 * ═══════════════════════════════════════════════════════════════
 * COMPLIANCE SERVICE INTERFACE
 * TerraFusion.Consciousness - Government Compliance Validation
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Government Compliance Validation Service Interface
    /// Ensures FISMA, FedRAMP, SOC 2, NIST compliance
    /// </summary>
    public interface IComplianceService
    {
        /// <summary>
        /// Validate property valuation for IAAO compliance
        /// </summary>
        /// <param name="valuation">Valuation result to validate</param>
        /// <param name="countyId">County identifier</param>
        /// <returns>IAAO compliance result with accuracy metrics</returns>
        Task<IAAOComplianceResult> ValidateIAAOComplianceAsync(decimal valuation, string countyId);

        /// <summary>
        /// Validate government security compliance (FISMA-High)
        /// </summary>
        /// <param name="request">Compliance validation request</param>
        /// <returns>Compliance result with security assessment</returns>
        Task<GovernmentComplianceResult> ValidateGovernmentComplianceAsync(ComplianceValidationRequest request);

        /// <summary>
        /// Get compliance audit trail for transparency
        /// </summary>
        /// <param name="countyId">County identifier</param>
        /// <param name="startDate">Audit trail start date</param>
        /// <param name="endDate">Audit trail end date</param>
        /// <returns>Compliance audit records</returns>
        Task<List<ComplianceAuditRecord>> GetComplianceAuditTrailAsync(string countyId, DateTime startDate, DateTime endDate);

        /// <summary>
        /// Get compliance dashboard metrics
        /// </summary>
        /// <param name="countyId">County identifier</param>
        /// <returns>Compliance metrics including rates and issues</returns>
        Task<ComplianceDashboardMetrics> GetComplianceDashboardMetricsAsync(string countyId);
    }

    #region Request Models

    public class ComplianceValidationRequest
    {
        public string CountyId { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public List<string> ComplianceStandards { get; set; } = new List<string>();
        public Dictionary<string, object> ValidationData { get; set; } = new Dictionary<string, object>();
    }

    #endregion

    #region Response Models

    public class IAAOComplianceResult
    {
        public bool IsCompliant { get; set; }
        public decimal AccuracyPercentage { get; set; }
        public decimal MedianRatio { get; set; }
        public decimal CoefficientOfDispersion { get; set; }
        public decimal PriceRelatedDifferential { get; set; }
        public List<string> ComplianceIssues { get; set; } = new List<string>();
        public string CertificationLevel { get; set; } = "AAE";
        public DateTime ValidationTimestamp { get; set; } = DateTime.UtcNow;
    }

    public class GovernmentComplianceResult
    {
        public bool IsCompliant { get; set; }
        public List<string> ComplianceStandards { get; set; } = new List<string>();
        public Dictionary<string, bool> StandardsCompliance { get; set; } = new Dictionary<string, bool>();
        public List<string> Issues { get; set; } = new List<string>();
        public int ComplianceScore { get; set; }
        public DateTime ValidationTimestamp { get; set; } = DateTime.UtcNow;
    }

    public class ComplianceAuditRecord
    {
        public string RecordId { get; set; } = Guid.NewGuid().ToString();
        public string CountyId { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string ComplianceStandard { get; set; } = string.Empty;
        public bool IsCompliant { get; set; }
        public string AuditDetails { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ComplianceDashboardMetrics
    {
        public string CountyId { get; set; } = string.Empty;
        public decimal OverallComplianceRate { get; set; }
        public int TotalValidations { get; set; }
        public int ComplianceIssues { get; set; }
        public Dictionary<string, decimal> StandardsCompliance { get; set; } = new Dictionary<string, decimal>();
        public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
    }

    #endregion
}
