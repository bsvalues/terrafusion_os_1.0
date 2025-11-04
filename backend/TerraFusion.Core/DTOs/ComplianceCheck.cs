using System;

namespace TerraFusion.Core.DTOs
{
    /// <summary>
    /// Government-Grade Compliance Check DTO
    /// Consolidated from multiple duplicate definitions for championship type safety
    /// 3-6-9-12 Framework: Foundation (3) - Type Safety Enhancement
    /// </summary>
    public class ComplianceCheck
    {
        /// <summary>
        /// Unique identifier for the compliance check
        /// </summary>
        public string CheckId { get; set; } = string.Empty;

        /// <summary>
        /// Name of the compliance standard being checked
        /// </summary>
        public string StandardName { get; set; } = string.Empty;

        /// <summary>
        /// Category of compliance (e.g., "FISMA-High", "IAAO", "SOC2")
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// Description of what is being validated
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Whether the check passed validation
        /// </summary>
        public bool Passed { get; set; }

        /// <summary>
        /// Compliance score (0-1.0 scale, where 1.0 = 100% compliant)
        /// </summary>
        public decimal Score { get; set; }

        /// <summary>
        /// Severity level if check failed (Low, Medium, High, Critical)
        /// </summary>
        public string Severity { get; set; } = "Low";

        /// <summary>
        /// Detailed findings and recommendations
        /// </summary>
        public string Details { get; set; } = string.Empty;

        /// <summary>
        /// Remediation actions if check failed
        /// </summary>
        public string RemediationSteps { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when check was performed
        /// </summary>
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User or system that performed the check
        /// </summary>
        public string CheckedBy { get; set; } = "TerraFusion System";

        /// <summary>
        /// Required compliance level (e.g., "FISMA-High", "Moderate", "Low")
        /// </summary>
        public string RequiredLevel { get; set; } = string.Empty;

        /// <summary>
        /// Actual compliance level achieved
        /// </summary>
        public string ActualLevel { get; set; } = string.Empty;

        /// <summary>
        /// Reference to relevant compliance documentation
        /// </summary>
        public string DocumentationUrl { get; set; } = string.Empty;

        /// <summary>
        /// Government. Transcended. compliance indicator
        /// True if exceeds championship standards (>0.995 score)
        /// </summary>
        public bool IsChampionshipCompliant => Score >= 0.995m;

        /// <summary>
        /// FISMA-High compliance indicator
        /// </summary>
        public bool IsFISMACompliant => Passed && Category.Contains("FISMA");

        /// <summary>
        /// Creates a passing compliance check
        /// </summary>
        public static ComplianceCheck CreatePassing(string standardName, string category, decimal score = 1.0m)
        {
            return new ComplianceCheck
            {
                CheckId = Guid.NewGuid().ToString(),
                StandardName = standardName,
                Category = category,
                Passed = true,
                Score = score,
                Severity = "None",
                Details = "All compliance requirements met",
                CheckedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Creates a failing compliance check
        /// </summary>
        public static ComplianceCheck CreateFailing(string standardName, string category, string details, string severity = "High")
        {
            return new ComplianceCheck
            {
                CheckId = Guid.NewGuid().ToString(),
                StandardName = standardName,
                Category = category,
                Passed = false,
                Score = 0.0m,
                Severity = severity,
                Details = details,
                CheckedAt = DateTime.UtcNow
            };
        }
    }
}
