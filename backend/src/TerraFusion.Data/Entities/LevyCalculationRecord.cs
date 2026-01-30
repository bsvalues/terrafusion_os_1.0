/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - LEVY CALCULATION RECORD ENTITY
 * Government Tax Levy Calculation History with RCW Compliance
 * Quantum Optimization (Factor 949), FISMA-HIGH Audit Trail
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Data.Entities;

/// <summary>
/// Levy Calculation Audit Record
///
/// Stores historical levy rate calculations for government accountability,
/// compliance auditing, and ML model training. Tracks base rates, AI-optimized
/// rates (Factor 949), statutory compliance, and risk assessments.
///
/// Compliance:
/// - RCW 84.52: Levy limits compliance tracking
/// - RCW 84.55: Limit factor compliance (1% maximum increase)
/// - FISMA-HIGH: Government audit trail requirements
///
/// Retention Policy: Permanent (government financial records)
/// Security Classification: FISMA-MODERATE (public tax records)
/// </summary>
[Table("levy_calculation_records")]
[Index(nameof(CalculationDate), Name = "IX_LevyCalculationRecord_CalculationDate")]
[Index(nameof(DistrictId), Name = "IX_LevyCalculationRecord_DistrictId")]
[Index(nameof(CountyCode), Name = "IX_LevyCalculationRecord_CountyCode")]
[Index(nameof(CalculatedBy), Name = "IX_LevyCalculationRecord_CalculatedBy")]
[Index(nameof(IsCompliant), Name = "IX_LevyCalculationRecord_IsCompliant")]
public class LevyCalculationRecord
{
    /// <summary>
    /// Unique calculation identifier
    /// </summary>
    [Key]
    [Column("calculation_id")]
    public Guid CalculationId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// District identifier (unique per county)
    /// </summary>
    [Required]
    [Column("district_id")]
    [MaxLength(100)]
    public string DistrictId { get; set; } = string.Empty;

    /// <summary>
    /// District display name
    /// </summary>
    [Required]
    [Column("district_name")]
    [MaxLength(200)]
    public string DistrictName { get; set; } = string.Empty;

    /// <summary>
    /// County code (FIPS or custom identifier)
    /// </summary>
    [Required]
    [Column("county_code")]
    [MaxLength(50)]
    public string CountyCode { get; set; } = string.Empty;

    /// <summary>
    /// District type (county-regular, county-roads, city, school-district, fire-district, etc.)
    /// </summary>
    [Required]
    [Column("district_type")]
    [MaxLength(50)]
    public string DistrictType { get; set; } = string.Empty;

    /// <summary>
    /// Measure type (regular, excess, bond)
    /// </summary>
    [Required]
    [Column("measure_type")]
    [MaxLength(50)]
    public string MeasureType { get; set; } = string.Empty;

    /// <summary>
    /// Calculation timestamp (UTC)
    /// </summary>
    [Required]
    [Column("calculation_date")]
    public DateTime CalculationDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Total assessed value for district (dollars)
    /// </summary>
    [Required]
    [Column("assessed_value", TypeName = "decimal(18,2)")]
    public decimal AssessedValue { get; set; }

    /// <summary>
    /// Budget amount to fund (dollars)
    /// </summary>
    [Required]
    [Column("budget_amount", TypeName = "decimal(18,2)")]
    public decimal BudgetAmount { get; set; }

    /// <summary>
    /// Base levy rate per $1,000 assessed value (before optimization)
    /// </summary>
    [Required]
    [Column("base_rate", TypeName = "decimal(10,6)")]
    public decimal BaseRate { get; set; }

    /// <summary>
    /// AI-optimized levy rate per $1,000 assessed value (Factor 949)
    /// </summary>
    [Required]
    [Column("ai_optimal_rate", TypeName = "decimal(10,6)")]
    public decimal AiOptimalRate { get; set; }

    /// <summary>
    /// ML model confidence score (0.0-1.0)
    /// </summary>
    [Required]
    [Column("confidence_score", TypeName = "decimal(5,4)")]
    public decimal ConfidenceScore { get; set; }

    /// <summary>
    /// Statutory limit per $1,000 AV (RCW 84.52)
    /// </summary>
    [Required]
    [Column("statutory_limit", TypeName = "decimal(10,6)")]
    public decimal StatutoryLimit { get; set; }

    /// <summary>
    /// RCW statutory reference (e.g., "RCW 84.52.043")
    /// </summary>
    [Required]
    [Column("statutory_reference")]
    [MaxLength(50)]
    public string StatutoryReference { get; set; } = "RCW 84.52.043";

    /// <summary>
    /// Is rate compliant with statutory limits?
    /// </summary>
    [Required]
    [Column("is_compliant")]
    public bool IsCompliant { get; set; }

    /// <summary>
    /// Projected revenue from optimized rate (dollars)
    /// </summary>
    [Required]
    [Column("projected_revenue", TypeName = "decimal(18,2)")]
    public decimal ProjectedRevenue { get; set; }

    /// <summary>
    /// Risk assessment level (LOW, MEDIUM, HIGH, CRITICAL)
    /// </summary>
    [Required]
    [Column("risk_level")]
    [MaxLength(20)]
    public string RiskLevel { get; set; } = string.Empty;

    /// <summary>
    /// Quantum optimization factor used (949)
    /// </summary>
    [Required]
    [Column("quantum_factor")]
    public int QuantumFactor { get; set; } = 949;

    /// <summary>
    /// Optimization method version (e.g., "QuantumGradientBoosting_v1.0")
    /// </summary>
    [Required]
    [Column("optimization_method")]
    [MaxLength(100)]
    public string OptimizationMethod { get; set; } = string.Empty;

    /// <summary>
    /// Compliance warnings (JSON array of warning messages)
    /// </summary>
    [Column("warnings")]
    [MaxLength(4000)]
    public string? Warnings { get; set; }

    /// <summary>
    /// User who performed calculation
    /// </summary>
    [Required]
    [Column("calculated_by")]
    [MaxLength(200)]
    public string CalculatedBy { get; set; } = string.Empty;

    /// <summary>
    /// User email for accountability
    /// </summary>
    [Column("calculated_by_email")]
    [MaxLength(300)]
    public string? CalculatedByEmail { get; set; }

    /// <summary>
    /// Client IP address
    /// </summary>
    [Column("ip_address")]
    [MaxLength(50)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// Fiscal year for levy calculation
    /// </summary>
    [Required]
    [Column("fiscal_year")]
    public int FiscalYear { get; set; } = DateTime.UtcNow.Year;

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Record last updated timestamp (for corrections/amendments)
    /// </summary>
    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Is this calculation approved for official use?
    /// </summary>
    [Column("is_approved")]
    public bool IsApproved { get; set; } = false;

    /// <summary>
    /// Approval timestamp
    /// </summary>
    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// User who approved calculation
    /// </summary>
    [Column("approved_by")]
    [MaxLength(200)]
    public string? ApprovedBy { get; set; }
}
